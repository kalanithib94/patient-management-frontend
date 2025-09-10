const express = require('express');
const Joi = require('joi');
const { getAll, getRow, runQuery } = require('../config/database');
const salesforceService = require('../services/salesforce');

const router = express.Router();

// Validation schemas
const patientSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
  dateOfBirth: Joi.date().max('now').required(),
  address: Joi.string().max(200).allow(''),
  emergencyContact: Joi.string().max(100).allow(''),
  medicalHistory: Joi.string().max(1000).allow(''),
  allergies: Joi.string().max(500).allow(''),
  medications: Joi.string().max(500).allow(''),
  status: Joi.string().valid('active', 'inactive').default('active')
});

// GET /api/patients - Get all patients
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    const countSql = `SELECT COUNT(*) as total FROM patients ${whereClause}`;
    const totalResult = await getRow(countSql, params);
    const total = totalResult.total;
    
    const sql = `
      SELECT 
        id,
        first_name as firstName,
        last_name as lastName,
        email,
        phone,
        date_of_birth as dateOfBirth,
        address,
        emergency_contact as emergencyContact,
        medical_history as medicalHistory,
        allergies,
        medications,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM patients 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    const patients = await getAll(sql, params);
    
    res.json({
      status: 'success',
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patients'
    });
  }
});

// GET /api/patients/:id - Get single patient
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        id,
        first_name as firstName,
        last_name as lastName,
        email,
        phone,
        date_of_birth as dateOfBirth,
        address,
        emergency_contact as emergencyContact,
        medical_history as medicalHistory,
        allergies,
        medications,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM patients 
      WHERE id = ?
    `;
    
    const patient = await getRow(sql, [id]);
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }
    
    res.json({
      status: 'success',
      data: patient
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient'
    });
  }
});

// POST /api/patients - Create new patient
router.post('/', async (req, res) => {
  try {
    const { error, value } = patientSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: error.details[0].message
      });
    }
    
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      emergencyContact,
      medicalHistory,
      allergies,
      medications,
      status
    } = value;
    
    // First, create patient in local database
    const sql = `
      INSERT INTO patients (
        first_name, last_name, email, phone, date_of_birth,
        address, emergency_contact, medical_history, allergies,
        medications, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await runQuery(sql, [
      firstName, lastName, email, phone, dateOfBirth,
      address, emergencyContact, medicalHistory, allergies,
      medications, status
    ]);
    
    // Prepare patient data for Salesforce
    const patientData = {
      name: `${firstName} ${lastName}`,
      condition: medicalHistory || 'General consultation',
      age: new Date().getFullYear() - new Date(dateOfBirth).getFullYear(),
      phone: phone,
      email: email,
      notes: `Medical History: ${medicalHistory || 'None'}\nAllergies: ${allergies || 'None'}\nMedications: ${medications || 'None'}\nEmergency Contact: ${emergencyContact || 'None'}`
    };
    
    let salesforceResult = null;
    let salesforceId = null;
    
    // Try to sync with Salesforce
    try {
      salesforceResult = await salesforceService.createReferral(patientData);
      salesforceId = salesforceResult.salesforceId;
      
      // Update local database with Salesforce ID
      if (salesforceId) {
        await runQuery(
          'UPDATE patients SET salesforce_id = ? WHERE id = ?',
          [salesforceId, result.id]
        );
      }
    } catch (salesforceError) {
      console.warn('⚠️ Salesforce sync failed, but patient created locally:', salesforceError.message);
      // Continue with local creation even if Salesforce fails
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Patient created successfully',
      data: {
        id: result.id,
        firstName,
        lastName,
        email,
        salesforceId: salesforceId,
        salesforceSync: salesforceResult ? 'success' : 'failed'
      }
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        status: 'error',
        message: 'Patient with this email already exists'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create patient'
    });
  }
});

// PUT /api/patients/:id - Update patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = patientSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: error.details[0].message
      });
    }
    
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      emergencyContact,
      medicalHistory,
      allergies,
      medications,
      status
    } = value;
    
    const sql = `
      UPDATE patients SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        date_of_birth = ?,
        address = ?,
        emergency_contact = ?,
        medical_history = ?,
        allergies = ?,
        medications = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await runQuery(sql, [
      firstName, lastName, email, phone, dateOfBirth,
      address, emergencyContact, medicalHistory, allergies,
      medications, status, id
    ]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Patient updated successfully'
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        status: 'error',
        message: 'Patient with this email already exists'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update patient'
    });
  }
});

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = 'DELETE FROM patients WHERE id = ?';
    const result = await runQuery(sql, [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete patient'
    });
  }
});

// GET /api/patients/:id/appointments - Get patient appointments
router.get('/:id/appointments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        a.id,
        a.appointment_date as appointmentDate,
        a.appointment_time as appointmentTime,
        a.type,
        a.notes,
        a.status,
        a.duration,
        a.created_at as createdAt
      FROM appointments a
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    
    const appointments = await getAll(sql, [id]);
    
    res.json({
      status: 'success',
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient appointments'
    });
  }
});

// GET /api/patients/salesforce/test - Test Salesforce connection
router.get('/salesforce/test', async (req, res) => {
  try {
    const result = await salesforceService.testConnection();
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error testing Salesforce connection:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to test Salesforce connection',
      error: error.message
    });
  }
});

module.exports = router;
