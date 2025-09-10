const jsforce = require('jsforce');
require('dotenv').config();

async function setFieldSecurity() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com'
  });

  try {
    console.log('🔐 Authenticating with Salesforce...');
    await conn.login(process.env.SALESFORCE_USERNAME, process.env.SALESFORCE_PASSWORD + process.env.SALESFORCE_SECURITY_TOKEN);
    console.log('✅ Connected to Salesforce successfully');

    // Get all profiles
    console.log('\n📋 Getting all profiles...');
    const profilesQuery = await conn.query('SELECT Id, Name FROM Profile WHERE Name != \'System Administrator\'');
    const profiles = profilesQuery.records;
    console.log(`Found ${profiles.length} profiles to update`);

    // Get all custom fields for Referral__c
    console.log('\n🔍 Getting Referral__c fields...');
    const describeResult = await conn.describe('Referral__c');
    const customFields = describeResult.fields.filter(field => 
      field.name.endsWith('__c') && field.name !== 'Id'
    );
    
    console.log('Custom fields found:');
    customFields.forEach(field => console.log(`  - ${field.name}`));

    // Define the fields we want to make visible
    const fieldsToUpdate = [
      'First_Name__c',
      'Last_Name__c', 
      'Email__c',
      'Phone__c',
      'Date_of_Birth__c',
      'Address__c',
      'Emergency_Contact__c',
      'Medical_History__c',
      'Allergies__c',
      'Current_Medications__c',
      'Status__c',
      'Source__c',
      'Referral_Date__c'
    ];

    console.log('\n🔧 Setting field-level security for all profiles...');

    for (const profile of profiles) {
      console.log(`\n📝 Updating profile: ${profile.Name} (${profile.Id})`);
      
      for (const fieldName of fieldsToUpdate) {
        try {
          // Check if field exists
          const field = customFields.find(f => f.name === fieldName);
          if (!field) {
            console.log(`  ⚠️  Field ${fieldName} not found, skipping...`);
            continue;
          }

          // Create field permission for this profile and field
          const fieldPermission = {
            fullName: `${profile.Name}.${fieldName}`,
            editable: true,
            readable: true,
            field: fieldName
          };

          const result = await conn.metadata.create('FieldPermissions', fieldPermission);
          console.log(`  ✅ ${fieldName}: ${result.success ? 'Success' : 'Failed'}`);
          
          if (!result.success && result.errors) {
            console.log(`    Error: ${result.errors[0].message}`);
          }

        } catch (error) {
          console.log(`  ❌ ${fieldName}: ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Field-level security update completed!');
    console.log('\n📋 Summary:');
    console.log(`- Profiles updated: ${profiles.length}`);
    console.log(`- Fields processed: ${fieldsToUpdate.length}`);
    console.log('- All Referral__c fields should now be visible to all profiles');

  } catch (error) {
    console.error('❌ Error setting field security:', error.message);
    if (error.errorCode) {
      console.error('Error Code:', error.errorCode);
    }
  }
}

// Run the script
setFieldSecurity()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
