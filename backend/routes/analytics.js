const express = require('express');
const { getAll, getRow } = require('../config/database');

const router = express.Router();

// GET /api/analytics/overview - Get analytics overview
router.get('/overview', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Get total patients
    const totalPatientsResult = await getRow('SELECT COUNT(*) as total FROM patients WHERE status = "active"');
    const totalPatients = totalPatientsResult.total;
    
    // Get new patients in period
    const newPatientsResult = await getRow(
      'SELECT COUNT(*) as total FROM patients WHERE created_at >= ?',
      [startDateStr]
    );
    const newPatients = newPatientsResult.total;
    
    // Get total appointments
    const totalAppointmentsResult = await getRow('SELECT COUNT(*) as total FROM appointments');
    const totalAppointments = totalAppointmentsResult.total;
    
    // Get appointments in period
    const periodAppointmentsResult = await getRow(
      'SELECT COUNT(*) as total FROM appointments WHERE appointment_date >= ?',
      [startDateStr]
    );
    const periodAppointments = periodAppointmentsResult.total;
    
    // Get completed appointments
    const completedAppointmentsResult = await getRow(
      'SELECT COUNT(*) as total FROM appointments WHERE status = "completed" AND appointment_date >= ?',
      [startDateStr]
    );
    const completedAppointments = completedAppointmentsResult.total;
    
    // Get pending appointments
    const pendingAppointmentsResult = await getRow(
      'SELECT COUNT(*) as total FROM appointments WHERE status IN ("scheduled", "confirmed") AND appointment_date >= ?',
      [startDateStr]
    );
    const pendingAppointments = pendingAppointmentsResult.total;
    
    res.json({
      status: 'success',
      data: {
        totalPatients,
        newPatients,
        totalAppointments,
        periodAppointments,
        completedAppointments,
        pendingAppointments,
        period: parseInt(period)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics overview'
    });
  }
});

// GET /api/analytics/patients - Get patient analytics
router.get('/patients', async (req, res) => {
  try {
    const { period = '6' } = req.query; // months
    
    // Patient growth over time
    const growthData = await getAll(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM patients 
      WHERE created_at >= date('now', '-${period} months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `);
    
    // Patient age distribution
    const ageDistribution = await getAll(`
      SELECT 
        CASE 
          WHEN (julianday('now') - julianday(date_of_birth)) / 365.25 < 18 THEN '0-17'
          WHEN (julianday('now') - julianday(date_of_birth)) / 365.25 < 35 THEN '18-34'
          WHEN (julianday('now') - julianday(date_of_birth)) / 365.25 < 50 THEN '35-49'
          WHEN (julianday('now') - julianday(date_of_birth)) / 365.25 < 65 THEN '50-64'
          ELSE '65+'
        END as ageGroup,
        COUNT(*) as count
      FROM patients 
      WHERE status = 'active'
      GROUP BY ageGroup
      ORDER BY ageGroup
    `);
    
    // Patient status distribution
    const statusDistribution = await getAll(`
      SELECT status, COUNT(*) as count
      FROM patients
      GROUP BY status
    `);
    
    res.json({
      status: 'success',
      data: {
        growthData,
        ageDistribution,
        statusDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching patient analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient analytics'
    });
  }
});

// GET /api/analytics/appointments - Get appointment analytics
router.get('/appointments', async (req, res) => {
  try {
    const { period = '6' } = req.query; // months
    
    // Appointment trends over time
    const trendsData = await getAll(`
      SELECT 
        strftime('%Y-%m', appointment_date) as month,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM appointments 
      WHERE appointment_date >= date('now', '-${period} months')
      GROUP BY strftime('%Y-%m', appointment_date)
      ORDER BY month
    `);
    
    // Appointment types distribution
    const typeDistribution = await getAll(`
      SELECT type, COUNT(*) as count
      FROM appointments
      WHERE appointment_date >= date('now', '-${period} months')
      GROUP BY type
    `);
    
    // Appointment status distribution
    const statusDistribution = await getAll(`
      SELECT status, COUNT(*) as count
      FROM appointments
      WHERE appointment_date >= date('now', '-${period} months')
      GROUP BY status
    `);
    
    // Daily appointment counts for current month
    const dailyAppointments = await getAll(`
      SELECT 
        appointment_date as date,
        COUNT(*) as count
      FROM appointments
      WHERE appointment_date >= date('now', 'start of month')
        AND appointment_date <= date('now', 'end of month')
      GROUP BY appointment_date
      ORDER BY appointment_date
    `);
    
    res.json({
      status: 'success',
      data: {
        trendsData,
        typeDistribution,
        statusDistribution,
        dailyAppointments
      }
    });
  } catch (error) {
    console.error('Error fetching appointment analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch appointment analytics'
    });
  }
});

// GET /api/analytics/revenue - Get revenue analytics (mock data)
router.get('/revenue', async (req, res) => {
  try {
    const { period = '6' } = req.query; // months
    
    // Mock revenue data - in a real app, this would come from billing/payment tables
    const revenueData = [
      { month: '2024-01', revenue: 45000, expenses: 32000 },
      { month: '2024-02', revenue: 52000, expenses: 35000 },
      { month: '2024-03', revenue: 48000, expenses: 33000 },
      { month: '2024-04', revenue: 61000, expenses: 38000 },
      { month: '2024-05', revenue: 55000, expenses: 36000 },
      { month: '2024-06', revenue: 67000, expenses: 40000 }
    ];
    
    // Calculate totals
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpenses = revenueData.reduce((sum, item) => sum + item.expenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    res.json({
      status: 'success',
      data: {
        revenueData,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: ((netProfit / totalRevenue) * 100).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch revenue analytics'
    });
  }
});

// GET /api/analytics/dashboard - Get dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's appointments
    const todayAppointmentsResult = await getRow(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?',
      [today]
    );
    const todayAppointments = todayAppointmentsResult.count;
    
    // Upcoming appointments (next 7 days)
    const upcomingAppointmentsResult = await getRow(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE appointment_date BETWEEN ? AND date(?, '+7 days')
        AND status IN ('scheduled', 'confirmed')
    `, [today, today]);
    const upcomingAppointments = upcomingAppointmentsResult.count;
    
    // Overdue appointments
    const overdueAppointmentsResult = await getRow(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE appointment_date < ? 
        AND status IN ('scheduled', 'confirmed')
    `, [today]);
    const overdueAppointments = overdueAppointmentsResult.count;
    
    // Recent patients (last 30 days)
    const recentPatientsResult = await getRow(`
      SELECT COUNT(*) as count 
      FROM patients 
      WHERE created_at >= date('now', '-30 days')
    `);
    const recentPatients = recentPatientsResult.count;
    
    // Top conditions (mock data)
    const topConditions = [
      { condition: 'Hypertension', count: 45, percentage: 18 },
      { condition: 'Diabetes', count: 38, percentage: 15 },
      { condition: 'Cardiovascular', count: 32, percentage: 13 },
      { condition: 'Respiratory', count: 28, percentage: 11 },
      { condition: 'Gastrointestinal', count: 25, percentage: 10 }
    ];
    
    res.json({
      status: 'success',
      data: {
        todayAppointments,
        upcomingAppointments,
        overdueAppointments,
        recentPatients,
        topConditions
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard analytics'
    });
  }
});

module.exports = router;
