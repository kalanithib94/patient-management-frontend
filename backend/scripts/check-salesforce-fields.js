const jsforce = require('jsforce');
require('dotenv').config();

async function checkSalesforceFields() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com'
  });

  try {
    console.log('🔐 Authenticating with Salesforce...');
    await conn.login(process.env.SALESFORCE_USERNAME, process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN);
    console.log('✅ Connected to Salesforce successfully');

    console.log('\n🔍 Checking Referral__c object fields...');
    const describeResult = await conn.describe('Referral__c');
    
    console.log('📋 Available fields:');
    describeResult.fields.forEach(field => {
      console.log(`  - ${field.name} (${field.type})`);
    });

    console.log('\n🧪 Testing a simple query...');
    const testQuery = `SELECT Id, Name FROM Referral__c LIMIT 1`;
    const result = await conn.query(testQuery);
    console.log('✅ Query successful:', result.records.length, 'records found');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSalesforceFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
