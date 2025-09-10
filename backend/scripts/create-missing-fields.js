const jsforce = require('jsforce');
require('dotenv').config();

async function createMissingFields() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com'
  });

  try {
    console.log('🔐 Authenticating with Salesforce...');
    await conn.login(process.env.SALESFORCE_USERNAME, process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN);
    console.log('✅ Connected to Salesforce successfully');

    console.log('\n🔍 Checking current fields...');
    const describeResult = await conn.describe('Referral__c');
    const existingFields = describeResult.fields.map(f => f.name);
    console.log('📋 Current fields:', existingFields.join(', '));

    // Define the missing fields we need to create
    const missingFields = [
      {
        fullName: 'Referral__c.Date_of_Birth__c',
        type: 'Date',
        label: 'Date of Birth'
      },
      {
        fullName: 'Referral__c.Address__c',
        type: 'TextArea',
        label: 'Address',
        length: 255
      },
      {
        fullName: 'Referral__c.Emergency_Contact__c',
        type: 'Text',
        label: 'Emergency Contact',
        length: 100
      },
      {
        fullName: 'Referral__c.Medical_History__c',
        type: 'TextArea',
        label: 'Medical History',
        length: 1000
      },
      {
        fullName: 'Referral__c.Allergies__c',
        type: 'Text',
        label: 'Allergies',
        length: 255
      },
      {
        fullName: 'Referral__c.Current_Medications__c',
        type: 'Text',
        label: 'Current Medications',
        length: 255
      },
      {
        fullName: 'Referral__c.Status__c',
        type: 'Picklist',
        label: 'Status',
        valueSet: {
          restricted: true,
          valueSetDefinition: {
            value: [
              { fullName: 'New', default: true, label: 'New' },
              { fullName: 'In_Progress', label: 'In Progress' },
              { fullName: 'Completed', label: 'Completed' }
            ]
          }
        }
      },
      {
        fullName: 'Referral__c.Source__c',
        type: 'Text',
        label: 'Source',
        length: 50,
        defaultValue: 'Patient Management System'
      },
      {
        fullName: 'Referral__c.Referral_Date__c',
        type: 'Date',
        label: 'Referral Date',
        defaultValue: 'TODAY'
      }
    ];

    // Filter out fields that already exist
    const fieldsToCreate = missingFields.filter(field => 
      !existingFields.includes(field.fullName.split('.')[1])
    );

    if (fieldsToCreate.length === 0) {
      console.log('✅ All fields already exist!');
      return;
    }

    console.log(`\n🔧 Creating ${fieldsToCreate.length} missing fields...`);

    // Create fields in smaller batches to avoid API limits
    const batchSize = 3;
    for (let i = 0; i < fieldsToCreate.length; i += batchSize) {
      const batch = fieldsToCreate.slice(i, i + batchSize);
      console.log(`📝 Creating fields batch ${Math.floor(i/batchSize) + 1}...`);
      
      try {
        const fieldResults = await conn.metadata.create('CustomField', batch);
        console.log('✅ Fields created:', fieldResults);
      } catch (error) {
        console.error('❌ Error creating batch:', error.message);
        // Continue with next batch
      }
      
      // Wait between batches
      if (i + batchSize < fieldsToCreate.length) {
        console.log('⏳ Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('\n🔍 Verifying all fields...');
    const finalDescribeResult = await conn.describe('Referral__c');
    const finalFields = finalDescribeResult.fields.map(f => f.name);
    console.log('📋 Final fields:', finalFields.join(', '));

    console.log('\n🎉 Field creation process completed!');

  } catch (error) {
    console.error('❌ Error creating fields:', error.message);
    if (error.errorCode) {
      console.error('Error Code:', error.errorCode);
    }
    if (error.fields) {
      console.error('Field Errors:', error.fields);
    }
  }
}

// Run the script
createMissingFields()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
