/**
 * Default Salesforce Configuration
 * These are demo credentials for a sandbox org that can be used for demonstration purposes
 * Users can override these with their own credentials through the Settings page
 */

const defaultSalesforceConfig = {
  // Default Demo Org Credentials - Master Enterprise Org
  // NOTE: Credentials configured - will work in simulation mode if connection fails
  DEFAULT_USERNAME: 'masterenterprise@test.com',
  DEFAULT_PASSWORD: '1@Balumani9A',
  DEFAULT_SECURITY_TOKEN: 'fgk59HeeBVpYsoO1o2x8FqxH1',
  DEFAULT_LOGIN_URL: 'https://login.salesforce.com', // Using production URL
  
  // Instructions for setting up your own demo org
  SETUP_INSTRUCTIONS: `
    To set up your default demo Salesforce org:
    1. Create a free Salesforce Developer Edition or Sandbox
    2. Create a Connected App for OAuth
    3. Update the credentials above with your demo org details
    4. Deploy the Referral__c custom object to your org
    
    Users can still override these defaults through the Settings page.
  `
};

// Function to get Salesforce configuration
// Priority: User Settings > Environment Variables > Default Demo Org
function getSalesforceConfig(userSettings = null) {
  // If user has provided settings through the UI, use those
  if (userSettings && userSettings.username) {
    console.log('📱 Using user-provided Salesforce credentials');
    return {
      username: userSettings.username,
      password: userSettings.password,
      securityToken: userSettings.securityToken || '',
      loginUrl: userSettings.loginUrl || 'https://login.salesforce.com',
      source: 'user-settings'
    };
  }
  
  // Check for environment variables (for production deployment)
  if (process.env.SALESFORCE_USERNAME && process.env.SALESFORCE_PASSWORD) {
    console.log('🔧 Using environment variable Salesforce credentials');
    return {
      username: process.env.SALESFORCE_USERNAME,
      password: process.env.SALESFORCE_PASSWORD,
      securityToken: process.env.SALESFORCE_SECURITY_TOKEN || '',
      loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com',
      source: 'environment'
    };
  }
  
  // Use default demo org credentials
  console.log('🎯 Using default demo Salesforce org credentials');
  return {
    username: defaultSalesforceConfig.DEFAULT_USERNAME,
    password: defaultSalesforceConfig.DEFAULT_PASSWORD,
    securityToken: defaultSalesforceConfig.DEFAULT_SECURITY_TOKEN,
    loginUrl: defaultSalesforceConfig.DEFAULT_LOGIN_URL,
    source: 'default-demo'
  };
}

module.exports = {
  defaultSalesforceConfig,
  getSalesforceConfig
};
