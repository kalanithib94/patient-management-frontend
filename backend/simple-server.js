const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Import Salesforce service
const salesforceService = require('./services/salesforce');
// Import settings routes
const settingsRoutes = require('./routes/settings');
// Import appointments routes
const appointmentsRoutes = require('./routes/appointments');

// Helper functions for Salesforce sync
async function handleSalesforceUpdate(row, updatedPatient, res, id) {
  try {
    if (row && row.salesforce_id) {
      // Update existing Salesforce record
      const salesforceResult = await salesforceService.updateReferral(row.salesforce_id, updatedPatient);
      
      if (salesforceResult.success) {
        console.log(`✅ Patient updated in Salesforce: ${row.salesforce_id}`);
        res.json({ 
          status: 'success', 
          data: updatedPatient,
          salesforceSync: 'success',
          salesforceId: row.salesforce_id,
          message: 'Patient updated successfully! Synced to Salesforce.'
        });
      } else {
        throw new Error('Salesforce update failed');
      }
    } else {
      // No Salesforce ID, create new referral
      const salesforceResult = await salesforceService.createReferral(updatedPatient);
      
      if (salesforceResult.success) {
        // Update patient record with Salesforce ID
        const updateSql = 'UPDATE patients SET salesforce_id = ? WHERE id = ?';
        db.run(updateSql, [salesforceResult.salesforceId, id], (updateErr) => {
          if (updateErr) {
            console.warn('⚠️  Failed to update patient with Salesforce ID:', updateErr.message);
          } else {
            console.log(`✅ Patient updated with Salesforce ID: ${salesforceResult.salesforceId}`);
          }
        });
        
        res.json({ 
          status: 'success', 
          data: { ...updatedPatient, salesforce_id: salesforceResult.salesforceId },
          salesforceSync: 'success',
          salesforceId: salesforceResult.salesforceId,
          message: 'Patient updated successfully! Synced to Salesforce as new referral.'
        });
      } else {
        throw new Error('Salesforce sync failed');
      }
    }
  } catch (salesforceError) {
    console.warn('⚠️  Salesforce sync failed, but patient updated locally:', salesforceError.message);
    
    res.json({ 
      status: 'success', 
      data: updatedPatient,
      salesforceSync: 'failed',
      salesforceError: salesforceError.message,
      message: 'Patient updated successfully! Salesforce sync failed, but data is saved locally.'
    });
  }
}

async function handleSalesforceDelete(salesforce_id, first_name, last_name, res) {
  if (salesforce_id) {
    try {
      // Delete from Salesforce
      const salesforceResult = await salesforceService.deleteReferral(salesforce_id);
      
      if (salesforceResult.success) {
        console.log(`✅ Patient deleted from Salesforce: ${salesforce_id}`);
        res.json({ 
          status: 'success', 
          message: 'Patient deleted successfully! Removed from Salesforce.',
          salesforceSync: 'success',
          salesforceId: salesforce_id
        });
      } else {
        throw new Error('Salesforce deletion failed');
      }
    } catch (salesforceError) {
      console.warn('⚠️  Salesforce deletion failed, but patient deleted locally:', salesforceError.message);
      
      res.json({ 
        status: 'success', 
        message: 'Patient deleted successfully! Salesforce sync failed, but data is removed locally.',
        salesforceSync: 'failed',
        salesforceError: salesforceError.message
      });
    }
  } else {
    console.log('ℹ️  No Salesforce ID found, patient deleted locally only');
    res.json({ 
      status: 'success', 
      message: 'Patient deleted successfully! (No Salesforce record to sync)',
      salesforceSync: 'skipped'
    });
  }
}

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'database', 'patient_management.db');
const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      date_of_birth DATE NOT NULL,
      address TEXT,
      emergency_contact TEXT,
      medical_history TEXT,
      allergies TEXT,
      medications TEXT,
      status TEXT DEFAULT 'active',
      salesforce_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'scheduled',
      duration INTEGER DEFAULT 30,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients (id)
    )
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'Server is running!' });
});

// Settings routes
app.use('/api/settings', settingsRoutes);
app.use('/api/appointments', appointmentsRoutes);

// Salesforce test endpoint
app.get('/api/salesforce/test', async (req, res) => {
  try {
    const result = await salesforceService.testConnection();
    res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('Error testing Salesforce connection:', error);
    res.status(500).json({ status: 'error', message: 'Failed to test Salesforce connection', error: error.message });
  }
});

// Get Salesforce referrals
app.get('/api/salesforce/referrals', async (req, res) => {
  try {
    const result = await salesforceService.getReferrals();
    res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('Error fetching Salesforce referrals:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch referrals', error: error.message });
  }
});

// Get all patients
app.get('/api/patients', (req, res) => {
  const { search, status } = req.query;
  let sql = 'SELECT * FROM patients';
  let params = [];

  if (search || status) {
    const conditions = [];
    if (search) {
      conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ status: 'error', message: 'Database error' });
    } else {
      res.json({ status: 'success', data: rows });
    }
  });
});

// Create patient
app.post('/api/patients', (req, res) => {
  const { first_name, last_name, email, phone, date_of_birth, address, emergency_contact, medical_history, allergies, medications } = req.body;
  
  const sql = `
    INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, address, emergency_contact, medical_history, allergies, medications)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [first_name, last_name, email, phone, date_of_birth, address, emergency_contact, medical_history, allergies, medications];
  
  db.run(sql, params, async function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to create patient' });
    } else {
      const patientId = this.lastID;
      const patientData = { id: patientId, ...req.body };
      
      console.log(`📋 Patient created locally with ID: ${patientId}`);
      console.log(`🔄 Attempting Salesforce sync for: ${first_name} ${last_name}`);
      
      try {
        // Attempt Salesforce sync
        const salesforceResult = await salesforceService.createReferral(patientData);
        
        if (salesforceResult.success) {
          // Update patient record with Salesforce ID
          const updateSql = 'UPDATE patients SET salesforce_id = ? WHERE id = ?';
          db.run(updateSql, [salesforceResult.salesforceId, patientId], (updateErr) => {
            if (updateErr) {
              console.warn('⚠️  Failed to update patient with Salesforce ID:', updateErr.message);
            } else {
              console.log(`✅ Patient updated with Salesforce ID: ${salesforceResult.salesforceId}`);
            }
          });
          
          res.json({ 
            status: 'success', 
            data: { ...patientData, salesforce_id: salesforceResult.salesforceId },
            salesforceSync: 'success',
            salesforceId: salesforceResult.salesforceId,
            message: `Patient created successfully! Synced to Salesforce as ${salesforceResult.salesforceId}`
          });
        } else {
          throw new Error('Salesforce sync failed');
        }
      } catch (salesforceError) {
        console.warn('⚠️  Salesforce sync failed, but patient created locally:', salesforceError.message);
        
        res.json({ 
          status: 'success', 
          data: patientData,
          salesforceSync: 'failed',
          salesforceError: salesforceError.message,
          message: 'Patient created successfully! Salesforce sync failed, but data is saved locally.'
        });
      }
    }
  });
});

// Update patient
app.put('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, date_of_birth, address, emergency_contact, medical_history, allergies, medications, status } = req.body;
  
  const sql = `
    UPDATE patients 
    SET first_name = ?, last_name = ?, email = ?, phone = ?, date_of_birth = ?, 
        address = ?, emergency_contact = ?, medical_history = ?, allergies = ?, 
        medications = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  const params = [first_name, last_name, email, phone, date_of_birth, address, emergency_contact, medical_history, allergies, medications, status, id];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to update patient' });
    } else {
      const updatedPatient = { id, ...req.body };
      
      console.log(`📋 Patient updated locally with ID: ${id}`);
      console.log(`🔄 Attempting Salesforce sync for update: ${first_name} ${last_name}`);
      
      // Get the patient's Salesforce ID first
      db.get('SELECT salesforce_id FROM patients WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching Salesforce ID:', err);
          res.json({ status: 'success', data: updatedPatient, salesforceSync: 'failed', message: 'Patient updated locally, but Salesforce sync failed' });
          return;
        }
        
        // Handle Salesforce sync asynchronously
        handleSalesforceUpdate(row, updatedPatient, res, id);
      });
    }
  });
});

// Delete patient
app.delete('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  
  // First get the patient's Salesforce ID before deleting
  db.get('SELECT salesforce_id, first_name, last_name FROM patients WHERE id = ?', [id], async (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ status: 'error', message: 'Failed to fetch patient data' });
      return;
    }
    
    if (!row) {
      res.status(404).json({ status: 'error', message: 'Patient not found' });
      return;
    }
    
    const { salesforce_id, first_name, last_name } = row;
    
    // Delete from local database
    db.run('DELETE FROM patients WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to delete patient' });
      } else {
        console.log(`📋 Patient deleted locally with ID: ${id}`);
        console.log(`🔄 Attempting Salesforce sync for deletion: ${first_name} ${last_name}`);
        
        // Handle Salesforce sync asynchronously
        handleSalesforceDelete(salesforce_id, first_name, last_name, res);
      }
    });
  });
});

// Get appointments
app.get('/api/appointments', (req, res) => {
  db.all(`
    SELECT a.*, p.first_name, p.last_name, p.email 
    FROM appointments a 
    LEFT JOIN patients p ON a.patient_id = p.id 
    ORDER BY a.appointment_date, a.appointment_time
  `, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ status: 'error', message: 'Database error' });
    } else {
      res.json({ status: 'success', data: rows });
    }
  });
});

// Get today's appointments
app.get('/api/appointments/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  db.all(`
    SELECT a.*, p.first_name, p.last_name, p.email 
    FROM appointments a 
    LEFT JOIN patients p ON a.patient_id = p.id 
    WHERE a.appointment_date = ?
    ORDER BY a.appointment_time
  `, [today], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ status: 'error', message: 'Database error' });
    } else {
      res.json({ status: 'success', data: rows });
    }
  });
});

// Analytics endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  // Get total patients
  db.get('SELECT COUNT(*) as total FROM patients', (err, patientCount) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ status: 'error', message: 'Database error' });
      return;
    }

    // Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    db.get('SELECT COUNT(*) as total FROM appointments WHERE appointment_date = ?', [today], (err, todayAppointments) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ status: 'error', message: 'Database error' });
        return;
      }

      // Get pending appointments
      db.get('SELECT COUNT(*) as total FROM appointments WHERE status = "scheduled"', (err, pendingAppointments) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ status: 'error', message: 'Database error' });
          return;
        }

        // Get completed appointments
        db.get('SELECT COUNT(*) as total FROM appointments WHERE status = "completed"', (err, completedAppointments) => {
          if (err) {
            console.error('Database error:', err);
            res.status(500).json({ status: 'error', message: 'Database error' });
            return;
          }

          res.json({
            status: 'success',
            data: {
              totalPatients: patientCount.total,
              todayAppointments: todayAppointments.total,
              pendingAppointments: pendingAppointments.total,
              completedAppointments: completedAppointments.total
            }
          });
        });
      });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend URL: http://localhost:3000`);
});

module.exports = app;
