const jsforce = require('jsforce');
require('dotenv').config();

async function createFieldsCorrect() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com'
  });

  try {
    console.log('🔐 Authenticating with Salesforce...');
    await conn.login(process.env.SALESFORCE_USERNAME, process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN);
    console.log('✅ Connected to Salesforce successfully');

    // Create fields with correct configuration
    const fields = [
      {
        fullName: 'Referral__c.Date_of_Birth__c',
        type: 'Date',
        label: 'Date of Birth'
      },
      {
        fullName: 'Referral__c.Address__c',
        type: 'TextArea',
        label: 'Address'
        // Note: TextArea doesn't use length parameter
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
        label: 'Medical History'
        // Note: TextArea doesn't use length parameter
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

    console.log('\n🔧 Creating fields with correct configuration...');

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      console.log(`\n📝 Creating field ${i + 1}/${fields.length}: ${field.fullName}`);
      
      try {
        const result = await conn.metadata.create('CustomField', field);
        if (result.success) {
          console.log('✅ Success:', result);
        } else {
          console.log('❌ Failed:', result.errors);
        }
      } catch (error) {
        console.log('❌ Error:', error.message);
        if (error.fields && error.fields.length > 0) {
          console.log('Field errors:', error.fields);
        }
      }
      
      // Wait between field creations
      if (i < fields.length - 1) {
        console.log('⏳ Waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('\n🔍 Final verification...');
    const describeResult = await conn.describe('Referral__c');
    const finalFields = describeResult.fields.map(f => `${f.name} (${f.type})`);
    console.log('📋 Available fields:');
    finalFields.forEach(field => console.log(`  - ${field}`));

    console.log('\n🎉 Field creation process completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
createFieldsCorrect()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
