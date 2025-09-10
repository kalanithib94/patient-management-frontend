const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const jsforce = require('jsforce');

const router = express.Router();

// Path to store Salesforce configuration
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'salesforce-config.json');

// GET /api/settings/salesforce - Get current Salesforce configuration
router.get('/salesforce', async (req, res) => {
  try {
    // Check if config file exists
    try {
      const configData = await fs.readFile(CONFIG_PATH, 'utf8');
      const config = JSON.parse(configData);
      
      // Don't send password and token to frontend for security
      const safeConfig = {
        loginUrl: config.loginUrl || 'https://login.salesforce.com',
        username: config.username || '',
        isSandbox: config.loginUrl === 'https://test.salesforce.com',
        // Mask sensitive data
        password: config.password ? '********' : '',
        securityToken: config.securityToken ? '********' : ''
      };
      
      res.json({
        status: 'success',
        data: safeConfig
      });
    } catch (error) {
      // Config file doesn't exist yet
      res.json({
        status: 'success',
        data: {
          loginUrl: 'https://login.salesforce.com',
          username: '',
          password: '',
          securityToken: '',
          isSandbox: false
        }
      });
    }
  } catch (error) {
    console.error('Error reading Salesforce config:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to read configuration'
    });
  }
});

// POST /api/settings/salesforce - Save Salesforce configuration
router.post('/salesforce', async (req, res) => {
  try {
    const { loginUrl, username, password, securityToken, isSandbox } = req.body;
    
    // Validate required fields
    if (!username || !password || !securityToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, password, and security token are required'
      });
    }
    
    // Prepare configuration
    const config = {
      loginUrl: isSandbox ? 'https://test.salesforce.com' : 'https://login.salesforce.com',
      username,
      password,
      securityToken,
      isSandbox,
      updatedAt: new Date().toISOString()
    };
    
    // Test the connection before saving
    try {
      const conn = new jsforce.Connection({
        loginUrl: config.loginUrl
      });
      
      await conn.login(username, password + securityToken);
      
      // Connection successful, save the configuration
      await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
      await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
      
      // Update environment variables for current session
      process.env.SALESFORCE_LOGIN_URL = config.loginUrl;
      process.env.SALESFORCE_USERNAME = username;
      process.env.SALESFORCE_PASSWORD = password;
      process.env.SALESFORCE_SECURITY_TOKEN = securityToken;
      
      // Update Salesforce service with new user credentials
      const salesforceService = require('../services/salesforce');
      salesforceService.setUserCredentials(config);
      await salesforceService.connect();
      
      res.json({
        status: 'success',
        message: 'Salesforce configuration saved and connected successfully',
        data: {
          connected: true,
          organizationId: conn.userInfo.organizationId,
          userId: conn.userInfo.id
        }
      });
    } catch (connectionError) {
      console.error('Salesforce connection test failed:', connectionError);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Salesforce credentials. Please check your username, password, and security token.',
        error: connectionError.message
      });
    }
  } catch (error) {
    console.error('Error saving Salesforce config:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save configuration'
    });
  }
});

// DELETE /api/settings/salesforce - Clear Salesforce configuration
router.delete('/salesforce', async (req, res) => {
  try {
    // Delete config file
    try {
      await fs.unlink(CONFIG_PATH);
    } catch (error) {
      // File might not exist, that's okay
    }
    
    // Clear environment variables
    delete process.env.SALESFORCE_LOGIN_URL;
    delete process.env.SALESFORCE_USERNAME;
    delete process.env.SALESFORCE_PASSWORD;
    delete process.env.SALESFORCE_SECURITY_TOKEN;
    
    res.json({
      status: 'success',
      message: 'Salesforce configuration cleared'
    });
  } catch (error) {
    console.error('Error clearing Salesforce config:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear configuration'
    });
  }
});

module.exports = router;
