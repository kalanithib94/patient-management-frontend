import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, 
  FiUsers, 
  FiCalendar, 
  FiActivity,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import './Analytics.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6M');
  const [analyticsData, setAnalyticsData] = useState({});

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const data = {
      patientGrowth: [
        { month: 'Jan', patients: 45, appointments: 120 },
        { month: 'Feb', patients: 52, appointments: 135 },
        { month: 'Mar', patients: 48, appointments: 110 },
        { month: 'Apr', patients: 61, appointments: 145 },
        { month: 'May', patients: 55, appointments: 130 },
        { month: 'Jun', patients: 67, appointments: 160 }
      ],
      appointmentTypes: [
        { name: 'General Checkup', value: 35, color: '#667eea' },
        { name: 'Follow-up', value: 25, color: '#764ba2' },
        { name: 'Emergency', value: 15, color: '#f56565' },
        { name: 'Consultation', value: 25, color: '#48bb78' }
      ],
      monthlyRevenue: [
        { month: 'Jan', revenue: 45000, expenses: 32000 },
        { month: 'Feb', revenue: 52000, expenses: 35000 },
        { month: 'Mar', revenue: 48000, expenses: 33000 },
        { month: 'Apr', revenue: 61000, expenses: 38000 },
        { month: 'May', revenue: 55000, expenses: 36000 },
        { month: 'Jun', revenue: 67000, expenses: 40000 }
      ],
      patientAgeGroups: [
        { ageGroup: '0-18', count: 45 },
        { ageGroup: '19-35', count: 120 },
        { ageGroup: '36-50', count: 180 },
        { ageGroup: '51-65', count: 150 },
        { ageGroup: '65+', count: 95 }
      ],
      topConditions: [
        { condition: 'Hypertension', count: 45, percentage: 18 },
        { condition: 'Diabetes', count: 38, percentage: 15 },
        { condition: 'Cardiovascular', count: 32, percentage: 13 },
        { condition: 'Respiratory', count: 28, percentage: 11 },
        { condition: 'Gastrointestinal', count: 25, percentage: 10 }
      ],
      appointmentStatus: [
        { status: 'Completed', count: 156, color: '#48bb78' },
        { status: 'Scheduled', count: 45, color: '#f6ad55' },
        { status: 'Cancelled', count: 12, color: '#f56565' },
        { status: 'No-show', count: 8, color: '#a0aec0' }
      ]
    };

    setAnalyticsData(data);
    setLoading(false);
  };

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value.toLocaleString()}</h3>
        <p className="stat-title">{title}</p>
        <div className="stat-change">
          <FiTrendingUp size={14} />
          <span className={change >= 0 ? 'positive' : 'negative'}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Analytics</h1>
          <p className="analytics-subtitle">Comprehensive insights and reporting</p>
        </div>
        <div className="analytics-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="1M">Last Month</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Last Year</option>
          </select>
          <button className="btn btn-secondary" onClick={loadAnalytics}>
            <FiRefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn-primary">
            <FiDownload size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <StatCard
          title="Total Patients"
          value={1247}
          change={12}
          icon={FiUsers}
          color="#667eea"
        />
        <StatCard
          title="Monthly Appointments"
          value={160}
          change={8}
          icon={FiCalendar}
          color="#48bb78"
        />
        <StatCard
          title="Revenue This Month"
          value={67000}
          change={15}
          icon={FiTrendingUp}
          color="#38b2ac"
        />
        <StatCard
          title="Patient Satisfaction"
          value={94}
          change={3}
          icon={FiActivity}
          color="#f6ad55"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        <div className="chart-card large">
          <div className="card-header">
            <h3 className="card-title">Patient Growth & Appointments</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={analyticsData.patientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="patients" 
                  stackId="1"
                  stroke="#667eea" 
                  fill="#667eea"
                  fillOpacity={0.6}
                  name="New Patients"
                />
                <Area 
                  type="monotone" 
                  dataKey="appointments" 
                  stackId="2"
                  stroke="#48bb78" 
                  fill="#48bb78"
                  fillOpacity={0.6}
                  name="Appointments"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Appointment Types</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.appointmentTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.appointmentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {analyticsData.appointmentTypes.map((item, index) => (
                <div key={index} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Revenue vs Expenses</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#718096" />
                <YAxis stroke="#718096" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#48bb78" name="Revenue" />
                <Bar dataKey="expenses" fill="#f56565" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Patient Age Distribution</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.patientAgeGroups} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#718096" />
                <YAxis dataKey="ageGroup" type="category" stroke="#718096" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="count" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Top Medical Conditions</h3>
          </div>
          <div className="conditions-list">
            {analyticsData.topConditions.map((condition, index) => (
              <div key={index} className="condition-item">
                <div className="condition-info">
                  <span className="condition-name">{condition.condition}</span>
                  <span className="condition-count">{condition.count} patients</span>
                </div>
                <div className="condition-bar">
                  <div 
                    className="condition-fill"
                    style={{ width: `${condition.percentage}%` }}
                  ></div>
                </div>
                <span className="condition-percentage">{condition.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Appointment Status</h3>
          </div>
          <div className="status-list">
            {analyticsData.appointmentStatus.map((status, index) => (
              <div key={index} className="status-item">
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: status.color }}
                ></div>
                <span className="status-name">{status.status}</span>
                <span className="status-count">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
