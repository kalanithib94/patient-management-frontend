import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiCalendar, 
  FiBarChart, 
  FiSettings,
  FiLogOut,
  FiCpu
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { path: '/', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/patients', icon: FiUsers, label: 'Patients' },
    { path: '/appointments', icon: FiCalendar, label: 'Appointments' },
    { path: '/analytics', icon: FiBarChart, label: 'Analytics' },
    { path: '/ai-insights', icon: FiCpu, label: 'AI Insights' },
    { path: '/settings', icon: FiSettings, label: 'Settings' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">🏥</div>
          <span className="logo-text">MediCare</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
                end={item.exact}
              >
                <item.icon className="nav-icon" size={20} />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="nav-item">
          <button className="nav-link">
            <FiSettings className="nav-icon" size={20} />
            <span className="nav-label">Settings</span>
          </button>
        </div>
        <div className="nav-item">
          <button className="nav-link">
            <FiLogOut className="nav-icon" size={20} />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
