const jsforce = require('jsforce');

// Your Salesforce credentials
const config = {
  loginUrl: 'https://login.salesforce.com', // Production URL
  username: 'masterenterprise@test.com',
  password: '1@Balumani9A',
  securityToken: 'fgk59HeeBVpYsoO1o2x8FqxH1' // Updated token
};

async function testConnection() {
  console.log('🔄 Testing Salesforce connection...');
  console.log('📧 Username:', config.username);
  console.log('🌐 Login URL:', config.loginUrl);
  
  try {
    // Create connection
    const conn = new jsforce.Connection({
      loginUrl: config.loginUrl
    });
    
    // Login with credentials
    const fullPassword = config.password + config.securityToken;
    await conn.login(config.username, fullPassword);
    
    console.log('\n✅ SUCCESS! Connected to Salesforce!');
    console.log('📊 User ID:', conn.userInfo.id);
    console.log('🏢 Organization ID:', conn.userInfo.organizationId);
    console.log('🌐 Instance URL:', conn.instanceUrl);
    
    // Check if Referral__c object exists
    console.log('\n🔍 Checking for Referral__c object...');
    try {
      const result = await conn.sobject('Referral__c').describe();
      console.log('✅ Referral__c object exists!');
      console.log('📋 Fields:', Object.keys(result.fields).length);
    } catch (error) {
      console.log('⚠️  Referral__c object not found. You need to create it.');
      console.log('   Run: npm run create-salesforce-object');
    }
    
    console.log('\n🎉 Your Salesforce org is ready for the Patient Management System!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if this is a sandbox org (should use test.salesforce.com)');
    console.log('2. Verify your password is correct');
    console.log('3. Make sure the security token is current');
    console.log('4. Check if your IP is whitelisted in Salesforce');
  }
}

// Run the test
testConnection();
