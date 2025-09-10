const jsforce = require('jsforce');
require('dotenv').config();

async function createReferralObject() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com'
  });

  try {
    console.log('🔐 Authenticating with Salesforce...');
    await conn.login(process.env.SALESFORCE_USERNAME, process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN);
    console.log('✅ Connected to Salesforce successfully');
    console.log(`📊 User ID: ${conn.userInfo.id}`);
    console.log(`🏢 Organization ID: ${conn.userInfo.organizationId}`);

    // Check if Referral__c object already exists
    console.log('\n🔍 Checking if Referral__c object exists...');
    try {
      const describeResult = await conn.describe('Referral__c');
      console.log('✅ Referral__c object already exists!');
      console.log('📋 Available fields:', describeResult.fields.map(f => f.name).join(', '));
      return;
    } catch (error) {
      console.log('❌ Referral__c object does not exist, creating it...');
    }

    // Create the custom object
    console.log('\n🏗️  Creating Referral__c custom object...');
    const customObject = {
      fullName: 'Referral__c',
      label: 'Referral',
      pluralLabel: 'Referrals',
      nameField: {
        type: 'Text',
        label: 'Referral Name',
        length: 80
      },
      deploymentStatus: 'Deployed',
      sharingModel: 'ReadWrite',
      description: 'Patient referral records from the Patient Management System'
    };

    const createObjectResult = await conn.metadata.create('CustomObject', customObject);
    console.log('✅ Custom object created successfully:', createObjectResult);

    // Wait a moment for the object to be available
    console.log('\n⏳ Waiting for object to be available...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Create custom fields
    console.log('\n🔧 Creating custom fields...');
    
    const fields = [
      {
        fullName: 'Referral__c.First_Name__c',
        type: 'Text',
        label: 'First Name',
        length: 50,
        required: true
      },
      {
        fullName: 'Referral__c.Last_Name__c',
        type: 'Text',
        label: 'Last Name',
        length: 50,
        required: true
      },
      {
        fullName: 'Referral__c.Email__c',
        type: 'Email',
        label: 'Email',
        required: true
      },
      {
        fullName: 'Referral__c.Phone__c',
        type: 'Phone',
        label: 'Phone',
        required: true
      },
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

    // Create fields in batches
    const batchSize = 5;
    for (let i = 0; i < fields.length; i += batchSize) {
      const batch = fields.slice(i, i + batchSize);
      console.log(`📝 Creating fields batch ${Math.floor(i/batchSize) + 1}...`);
      
      const fieldResults = await conn.metadata.create('CustomField', batch);
      console.log('✅ Fields created:', fieldResults);
      
      // Wait between batches
      if (i + batchSize < fields.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('\n🎉 Referral__c custom object and fields created successfully!');
    console.log('📋 You can now test patient creation with Salesforce sync.');

  } catch (error) {
    console.error('❌ Error creating Salesforce object:', error.message);
    if (error.errorCode) {
      console.error('Error Code:', error.errorCode);
    }
    if (error.fields) {
      console.error('Field Errors:', error.fields);
    }
  }
}

// Run the script
createReferralObject()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
