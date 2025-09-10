import React from 'react';
import { FiMenu, FiBell, FiUser, FiSearch } from 'react-icons/fi';
import './Header.css';

const Header = ({ onToggleSidebar }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onToggleSidebar}>
          <FiMenu size={20} />
        </button>
        <div className="search-box">
          <FiSearch className="search-icon" size={16} />
          <input 
            type="text" 
            placeholder="Search patients, appointments..." 
            className="search-input"
          />
        </div>
      </div>
      
      <div className="header-right">
        <button className="notification-btn">
          <FiBell size={20} />
          <span className="notification-badge">3</span>
        </button>
        
        <div className="user-profile">
          <div className="user-avatar">
            <FiUser size={16} />
          </div>
          <div className="user-info">
            <span className="user-name">Dr. Sarah Johnson</span>
            <span className="user-role">Chief Medical Officer</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
