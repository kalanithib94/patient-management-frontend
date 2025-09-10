import React, { useState, useEffect } from 'react';
import { 
  FiSettings, 
  FiCloud, 
  FiCheck, 
  FiX, 
  FiRefreshCw,
  FiInfo,
  FiKey,
  FiDatabase,
  FiLock
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { settingsAPI } from '../services/api';
import './Settings.css';

const Settings = () => {
  const [salesforceConfig, setSalesforceConfig] = useState({
    loginUrl: 'https://login.salesforce.com',
    username: '',
    password: '',
    securityToken: '',
    isSandbox: false
  });
  
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    testing: false,
    message: '',
    organizationId: '',
    mode: 'Not Connected'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentConfig();
    testConnection();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      const response = await settingsAPI.getSalesforce();
      if (response.data.data) {
        setSalesforceConfig(response.data.data);
      }
    } catch (error) {
      console.log('No existing configuration found');
    }
  };

  const testConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, testing: true }));
    try {
      const response = await settingsAPI.testSalesforce();
      setConnectionStatus({
        connected: response.data.data.connected,
        testing: false,
        message: response.data.data.connected ? 'Connected Successfully' : 'Not Connected',
        organizationId: response.data.data.userInfo?.organizationId || '',
        mode: response.data.data.mode || 'simulation'
      });
    } catch (error) {
      setConnectionStatus({
        connected: false,
        testing: false,
        message: 'Connection Failed',
        organizationId: '',
        mode: 'error'
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSalesforceConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      loginUrl: name === 'isSandbox' 
        ? (checked ? 'https://test.salesforce.com' : 'https://login.salesforce.com')
        : prev.loginUrl
    }));
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Save configuration to backend
      const response = await settingsAPI.saveSalesforce(salesforceConfig);
      
      if (response.data.status === 'success') {
        toast.success('Salesforce configuration saved successfully!');
        
        // Test the new connection
        await testConnection();
      }
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearConfig = () => {
    if (window.confirm('Are you sure you want to clear the Salesforce configuration?')) {
      setSalesforceConfig({
        loginUrl: 'https://login.salesforce.com',
        username: '',
        password: '',
        securityToken: '',
        isSandbox: false
      });
      toast.info('Configuration cleared. Remember to save to apply changes.');
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">
            <FiSettings className="title-icon" />
            Settings
          </h1>
          <p className="settings-subtitle">Configure your Salesforce integration and system preferences</p>
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="status-card">
        <div className="status-header">
          <h3>
            <FiCloud className="section-icon" />
            Salesforce Connection Status
          </h3>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={testConnection}
            disabled={connectionStatus.testing}
          >
            <FiRefreshCw className={connectionStatus.testing ? 'spinning' : ''} />
            Test Connection
          </button>
        </div>
        
        <div className="status-content">
          <div className={`status-indicator ${connectionStatus.connected ? 'connected' : 'disconnected'}`}>
            {connectionStatus.connected ? <FiCheck /> : <FiX />}
            <span>{connectionStatus.message}</span>
          </div>
          
          {connectionStatus.connected && (
            <div className="status-details">
              <div className="detail-item">
                <span className="detail-label">Mode:</span>
                <span className="detail-value">{connectionStatus.mode}</span>
              </div>
              {connectionStatus.organizationId && (
                <div className="detail-item">
                  <span className="detail-label">Org ID:</span>
                  <span className="detail-value">{connectionStatus.organizationId}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Salesforce Configuration Form */}
      <div className="config-card">
        <div className="config-header">
          <h3>
            <FiKey className="section-icon" />
            Salesforce Configuration
          </h3>
        </div>

        <form onSubmit={handleSaveConfig} className="config-form">
          <div className="form-info">
            <FiInfo className="info-icon" />
            <p>Enter your Salesforce credentials to enable real-time patient synchronization with your CRM.</p>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiDatabase className="label-icon" />
              Environment Type
            </label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isSandbox"
                  checked={salesforceConfig.isSandbox}
                  onChange={handleInputChange}
                />
                <span>Use Sandbox Environment</span>
              </label>
              <small className="form-hint">
                Check this if you're using a Salesforce Sandbox or Scratch Org
              </small>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Login URL</label>
            <input
              type="text"
              name="loginUrl"
              value={salesforceConfig.loginUrl}
              className="form-input"
              disabled
            />
            <small className="form-hint">Automatically set based on environment type</small>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="email"
              name="username"
              value={salesforceConfig.username}
              onChange={handleInputChange}
              className="form-input"
              placeholder="your-username@company.com"
              required
            />
            <small className="form-hint">Your Salesforce login email</small>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FiLock className="label-icon" />
              Password
            </label>
            <div className="password-input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={salesforceConfig.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Your Salesforce password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <small className="form-hint">Your Salesforce account password</small>
          </div>

          <div className="form-group">
            <label className="form-label">Security Token</label>
            <input
              type="text"
              name="securityToken"
              value={salesforceConfig.securityToken}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Your security token"
              required
            />
            <small className="form-hint">
              Get this from Salesforce: Setup → My Personal Information → Reset Security Token
            </small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleClearConfig}
            >
              Clear Configuration
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Instructions Card */}
      <div className="instructions-card">
        <h3>
          <FiInfo className="section-icon" />
          How to Set Up a Salesforce Scratch Org
        </h3>
        
        <div className="instructions-content">
          <h4>Quick Setup (For Testing):</h4>
          <ol>
            <li>
              <strong>Get a Free Developer Org:</strong>
              <p>Sign up at <a href="https://developer.salesforce.com/signup" target="_blank" rel="noopener noreferrer">developer.salesforce.com/signup</a></p>
            </li>
            <li>
              <strong>Create a Scratch Org (Optional):</strong>
              <pre className="code-block">
{`sfdx force:org:create -f config/project-scratch-def.json -a MyTestOrg -d 7`}
              </pre>
            </li>
            <li>
              <strong>Get Your Security Token:</strong>
              <p>Setup → My Personal Information → Reset Security Token</p>
            </li>
            <li>
              <strong>Create Custom Object:</strong>
              <p>Object Manager → Create → Custom Object → Name: "Referral"</p>
            </li>
            <li>
              <strong>Add Required Fields:</strong>
              <p>Add fields like First_Name__c, Last_Name__c, Email__c, etc.</p>
            </li>
          </ol>

          <h4>Required Salesforce Object Fields:</h4>
          <ul>
            <li><code>First_Name__c</code> (Text)</li>
            <li><code>Last_Name__c</code> (Text)</li>
            <li><code>Email__c</code> (Email)</li>
            <li><code>Phone__c</code> (Phone)</li>
            <li><code>Date_of_Birth__c</code> (Date)</li>
            <li><code>Medical_History__c</code> (Long Text)</li>
            <li><code>Status__c</code> (Picklist)</li>
          </ul>

          <div className="info-box">
            <FiInfo />
            <p>
              <strong>Note for Recruiters:</strong> The system works without Salesforce credentials 
              in simulation mode. Real sync happens when credentials are provided.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
