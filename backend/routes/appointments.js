const express = require('express');
const Joi = require('joi');
const { getAll, getRow, runQuery } = require('../config/database');

const router = express.Router();

// Validation schemas
const appointmentSchema = Joi.object({
  patientId: Joi.number().integer().positive().required(),
  appointmentDate: Joi.date().min('now').required(),
  appointmentTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  type: Joi.string().valid('general', 'follow-up', 'consultation', 'emergency').required(),
  notes: Joi.string().max(1000).allow(''),
  status: Joi.string().valid('scheduled', 'confirmed', 'completed', 'cancelled', 'urgent').default('scheduled'),
  duration: Joi.number().integer().min(15).max(240).default(30)
});

// GET /api/appointments - Get all appointments
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      date, 
      status, 
      type,
      patientId 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (date) {
      whereClause += ' AND a.appointment_date = ?';
      params.push(date);
    }
    
    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }
    
    if (type) {
      whereClause += ' AND a.type = ?';
      params.push(type);
    }
    
    if (patientId) {
      whereClause += ' AND a.patient_id = ?';
      params.push(patientId);
    }
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM appointments a 
      ${whereClause}
    `;
    const totalResult = await getRow(countSql, params);
    const total = totalResult.total;
    
    const sql = `
      SELECT 
        a.id,
        a.patient_id as patientId,
        p.first_name || ' ' || p.last_name as patientName,
        p.email as patientEmail,
        p.phone as patientPhone,
        a.appointment_date as appointmentDate,
        a.appointment_time as appointmentTime,
        a.type,
        a.notes,
        a.status,
        a.duration,
        a.created_at as createdAt,
        a.updated_at as updatedAt
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      ${whereClause}
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    const appointments = await getAll(sql, params);
    
    res.json({
      status: 'success',
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointments'
    });
  }
});

// GET /api/appointments/:id - Get single appointment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        a.id,
        a.patient_id as patientId,
        p.first_name || ' ' || p.last_name as patientName,
        p.email as patientEmail,
        p.phone as patientPhone,
        a.appointment_date as appointmentDate,
        a.appointment_time as appointmentTime,
        a.type,
        a.notes,
        a.status,
        a.duration,
        a.created_at as createdAt,
        a.updated_at as updatedAt
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = ?
    `;
    
    const appointment = await getRow(sql, [id]);
    
    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }
    
    res.json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointment'
    });
  }
});

// POST /api/appointments - Create new appointment
router.post('/', async (req, res) => {
  try {
    const { error, value } = appointmentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: error.details[0].message
      });
    }
    
    const {
      patientId,
      appointmentDate,
      appointmentTime,
      type,
      notes,
      status,
      duration
    } = value;
    
    // Check if patient exists
    const patientExists = await getRow('SELECT id FROM patients WHERE id = ?', [patientId]);
    if (!patientExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }
    
    // Check for conflicting appointments
    const conflictSql = `
      SELECT id FROM appointments 
      WHERE appointment_date = ? 
      AND appointment_time = ? 
      AND status IN ('scheduled', 'confirmed')
    `;
    const conflict = await getRow(conflictSql, [appointmentDate, appointmentTime]);
    
    if (conflict) {
      return res.status(409).json({
        status: 'error',
        message: 'Time slot is already booked'
      });
    }
    
    const sql = `
      INSERT INTO appointments (
        patient_id, appointment_date, appointment_time,
        type, notes, status, duration
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await runQuery(sql, [
      patientId, appointmentDate, appointmentTime,
      type, notes, status, duration
    ]);
    
    res.status(201).json({
      status: 'success',
      message: 'Appointment scheduled successfully',
      data: {
        id: result.id,
        patientId,
        appointmentDate,
        appointmentTime,
        type
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create appointment'
    });
  }
});

// PUT /api/appointments/:id - Update appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = appointmentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: error.details[0].message
      });
    }
    
    const {
      patientId,
      appointmentDate,
      appointmentTime,
      type,
      notes,
      status,
      duration
    } = value;
    
    // Check if patient exists
    const patientExists = await getRow('SELECT id FROM patients WHERE id = ?', [patientId]);
    if (!patientExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }
    
    // Check for conflicting appointments (excluding current appointment)
    const conflictSql = `
      SELECT id FROM appointments 
      WHERE appointment_date = ? 
      AND appointment_time = ? 
      AND status IN ('scheduled', 'confirmed')
      AND id != ?
    `;
    const conflict = await getRow(conflictSql, [appointmentDate, appointmentTime, id]);
    
    if (conflict) {
      return res.status(409).json({
        status: 'error',
        message: 'Time slot is already booked'
      });
    }
    
    const sql = `
      UPDATE appointments SET
        patient_id = ?,
        appointment_date = ?,
        appointment_time = ?,
        type = ?,
        notes = ?,
        status = ?,
        duration = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await runQuery(sql, [
      patientId, appointmentDate, appointmentTime,
      type, notes, status, duration, id
    ]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update appointment'
    });
  }
});

// DELETE /api/appointments/:id - Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = 'DELETE FROM appointments WHERE id = ?';
    const result = await runQuery(sql, [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete appointment'
    });
  }
});

// PATCH /api/appointments/:id/status - Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['scheduled', 'confirmed', 'completed', 'cancelled', 'urgent'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value'
      });
    }
    
    const sql = `
      UPDATE appointments 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const result = await runQuery(sql, [status, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Appointment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update appointment status'
    });
  }
});

// GET /api/appointments/today - Get today's appointments
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        a.id,
        a.patient_id as patientId,
        p.first_name || ' ' || p.last_name as patientName,
        p.phone as patientPhone,
        a.appointment_time as appointmentTime,
        a.type,
        a.status,
        a.duration
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.appointment_date = ?
      ORDER BY a.appointment_time ASC
    `;
    
    const appointments = await getAll(sql, [today]);
    
    res.json({
      status: 'success',
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch today\'s appointments'
    });
  }
});

module.exports = router;
