import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiCalendar, 
  FiActivity, 
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApi } from '../hooks/useApi';
import { analyticsAPI, patientsAPI, appointmentsAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  // Fetch dashboard analytics
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useApi(() => analyticsAPI.getDashboard());
  
  // Fetch recent patients
  const { data: patientsData, loading: patientsLoading, error: patientsError } = useApi(() => 
    patientsAPI.getAll({ limit: 5, status: 'active' })
  );
  
  // Fetch today's appointments
  const { data: appointmentsData, loading: appointmentsLoading, error: appointmentsError } = useApi(() => 
    appointmentsAPI.getToday()
  );

  // Debug logging
  useEffect(() => {
    console.log('🔍 Dashboard Debug:');
    console.log('Analytics Data:', analyticsData);
    console.log('Patients Data:', patientsData);
    console.log('Appointments Data:', appointmentsData);
    console.log('Analytics Error:', analyticsError);
    console.log('Patients Error:', patientsError);
    console.log('Appointments Error:', appointmentsError);
  }, [analyticsData, patientsData, appointmentsData, analyticsError, patientsError, appointmentsError]);

  // Enhanced sample data for charts with medical context
  const patientTrendData = [
    { name: 'Jan', patients: 45, visits: 120, revenue: 12500 },
    { name: 'Feb', patients: 52, visits: 135, revenue: 14200 },
    { name: 'Mar', patients: 48, visits: 128, revenue: 13800 },
    { name: 'Apr', patients: 61, visits: 155, revenue: 16800 },
    { name: 'May', patients: 55, visits: 142, revenue: 15200 },
    { name: 'Jun', patients: 67, visits: 168, revenue: 18200 }
  ];

  const appointmentTypeData = [
    { name: 'General Checkup', value: 35, color: '#667eea', icon: '🩺' },
    { name: 'Follow-up', value: 25, color: '#48bb78', icon: '🔄' },
    { name: 'Emergency', value: 15, color: '#f56565', icon: '🚨' },
    { name: 'Specialist', value: 25, color: '#764ba2', icon: '👨‍⚕️' }
  ];

  const loading = analyticsLoading || patientsLoading || appointmentsLoading;
  
  const stats = {
    totalPatients: Number(analyticsData?.data?.totalPatients) || 0,
    todayAppointments: Number(analyticsData?.data?.todayAppointments) || 0,
    pendingAppointments: Number(analyticsData?.data?.pendingAppointments) || 0,
    completedAppointments: Number(analyticsData?.data?.completedAppointments) || 0
  };

  // Transform patient data to match frontend expectations
  const recentPatients = (patientsData?.data || []).map(patient => ({
    id: patient.id,
    name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient',
    age: patient.age || 'N/A',
    condition: patient.medical_history || 'No condition specified',
    lastVisit: patient.last_visit || 'Never',
    status: patient.status || 'active'
  }));
  
  const upcomingAppointments = (appointmentsData?.data || []).map(appointment => ({
    id: appointment.id,
    patientName: appointment.patientName || 'Unknown Patient',
    time: appointment.appointmentTime || 'TBD',
    type: appointment.type || 'General',
    status: appointment.status || 'scheduled'
  }));

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{(value || 0).toLocaleString()}</h3>
        <p className="stat-title">{title}</p>
        {trend && (
          <div className="stat-trend">
            <FiTrendingUp size={14} />
            <span>{trend > 0 ? '+' : ''}{trend}% from last month</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="dashboard-title">🏥 Medical Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, Dr. Johnson! Here's your practice overview for today.</p>
          </div>
          <div className="header-stats">
            <div className="quick-stat">
              <span className="quick-stat-value">12</span>
              <span className="quick-stat-label">New Today</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-value">8</span>
              <span className="quick-stat-label">Urgent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={FiUsers}
          color="#667eea"
          trend={12}
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={FiCalendar}
          color="#48bb78"
          trend={8}
        />
        <StatCard
          title="Pending Appointments"
          value={stats.pendingAppointments}
          icon={FiClock}
          color="#f6ad55"
          trend={-5}
        />
        <StatCard
          title="Completed This Month"
          value={stats.completedAppointments}
          icon={FiCheckCircle}
          color="#38b2ac"
          trend={15}
        />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">📈 Patient Growth & Visits Trend</h3>
            <div className="chart-actions">
              <button className="btn btn-sm btn-secondary">6M</button>
              <button className="btn btn-sm btn-primary">1Y</button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={patientTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="patients" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">🩺 Appointment Distribution</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {appointmentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {appointmentTypeData.map((item, index) => (
                <div key={index} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="legend-icon">{item.icon}</span>
                  <span>{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="activity-row">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">👥 Recent Patients</h3>
            <button className="btn btn-sm btn-primary">View All</button>
          </div>
          <div className="patients-list">
            {recentPatients.length > 0 ? (
              recentPatients.map(patient => (
                <div key={patient.id} className="patient-item">
                  <div className="patient-avatar">
                    {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="patient-info">
                    <h4 className="patient-name">{patient.name || 'Unknown Patient'}</h4>
                    <p className="patient-details">
                      {patient.age || 'N/A'} years • {patient.condition || 'No condition specified'}
                    </p>
                    <p className="patient-date">Last visit: {patient.lastVisit || 'Never'}</p>
                  </div>
                  <div className="patient-status">
                    <span className="status-badge status-active">Active</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No recent patients found</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📅 Upcoming Appointments</h3>
            <button className="btn btn-sm btn-primary">View All</button>
          </div>
          <div className="appointments-list">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(appointment => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-time">
                    <FiClock size={16} />
                    <span>{appointment.time || 'TBD'}</span>
                  </div>
                  <div className="appointment-details">
                    <h4 className="appointment-patient">{appointment.patientName || 'Unknown Patient'}</h4>
                    <p className="appointment-type">{appointment.type || 'General'}</p>
                  </div>
                  <div className="appointment-status">
                    <span className={`status-badge ${
                      appointment.status === 'confirmed' ? 'status-active' :
                      appointment.status === 'urgent' ? 'status-cancelled' : 'status-pending'
                    }`}>
                      {appointment.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
