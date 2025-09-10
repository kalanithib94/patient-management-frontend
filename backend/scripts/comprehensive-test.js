const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let testsPassed = 0;
let testsFailed = 0;

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function runTest(testName, testFunc) {
  try {
    console.log(`\n${colors.yellow}Testing: ${testName}${colors.reset}`);
    await testFunc();
    console.log(`${colors.green}✅ ${testName} - PASSED${colors.reset}`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}❌ ${testName} - FAILED${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

async function runAllTests() {
  console.log('🧪 Running Comprehensive System Tests...\n');
  console.log('=' .repeat(50));

  // Test 1: Health Check
  await runTest('Health Check API', async () => {
    const response = await axios.get(`${API_URL}/health`);
    if (response.data.status !== 'success') throw new Error('Health check failed');
  });

  // Test 2: Get All Patients
  await runTest('Get All Patients', async () => {
    const response = await axios.get(`${API_URL}/patients`);
    if (!response.data.data || !Array.isArray(response.data.data)) {
      throw new Error('Invalid patients response');
    }
    console.log(`   Found ${response.data.data.length} patients`);
  });

  // Test 3: Create New Patient
  let newPatientId;
  await runTest('Create New Patient', async () => {
    const patientData = {
      first_name: 'Test',
      last_name: 'ComprehensiveTest',
      email: `test.comprehensive${Date.now()}@example.com`,
      phone: '555-' + Math.floor(Math.random() * 10000),
      date_of_birth: '1990-01-01',
      address: '123 Test Street',
      emergency_contact: 'Emergency Contact',
      medical_history: 'Test medical history',
      allergies: 'None',
      medications: 'Test medications'
    };
    
    const response = await axios.post(`${API_URL}/patients`, patientData);
    if (!response.data.data || !response.data.data.id) {
      throw new Error('Patient creation failed');
    }
    newPatientId = response.data.data.id;
    console.log(`   Created patient with ID: ${newPatientId}`);
    
    // Check Salesforce sync
    if (response.data.salesforceId) {
      console.log(`   ✨ Salesforce sync successful! ID: ${response.data.salesforceId}`);
    }
  });

  // Test 4: Update Patient
  if (newPatientId) {
    await runTest('Update Patient', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'ComprehensiveTest',
        email: `updated.comprehensive${Date.now()}@example.com`,
        phone: '555-9999',
        date_of_birth: '1990-01-01',
        status: 'active'
      };
      
      const response = await axios.put(`${API_URL}/patients/${newPatientId}`, updateData);
      if (response.data.status !== 'success') {
        throw new Error('Patient update failed');
      }
    });
  }

  // Test 5: Get All Appointments
  await runTest('Get All Appointments', async () => {
    const response = await axios.get(`${API_URL}/appointments`);
    if (!response.data.data || !Array.isArray(response.data.data)) {
      throw new Error('Invalid appointments response');
    }
    console.log(`   Found ${response.data.data.length} appointments`);
  });

  // Test 6: Analytics Dashboard
  await runTest('Analytics Dashboard', async () => {
    const response = await axios.get(`${API_URL}/analytics/dashboard`);
    if (!response.data.data) {
      throw new Error('Invalid analytics response');
    }
    const data = response.data.data;
    console.log(`   Total Patients: ${data.totalPatients}`);
    console.log(`   Today's Appointments: ${data.todayAppointments}`);
    console.log(`   Pending Appointments: ${data.pendingAppointments}`);
  });

  // Test 7: Salesforce Connection
  await runTest('Salesforce Connection', async () => {
    const response = await axios.get(`${API_URL}/salesforce/test`);
    if (response.data.data.connected) {
      console.log(`   ✨ Salesforce connected in ${response.data.data.mode} mode`);
      if (response.data.data.userInfo) {
        console.log(`   Organization ID: ${response.data.data.userInfo.organizationId}`);
      }
    } else {
      console.log(`   ⚠️ Salesforce in simulation mode`);
    }
  });

  // Test 8: Search Patients
  await runTest('Search Patients', async () => {
    const response = await axios.get(`${API_URL}/patients?search=John`);
    if (!response.data.data) {
      throw new Error('Search failed');
    }
    console.log(`   Found ${response.data.data.length} patients matching "John"`);
  });

  // Test 9: Today's Appointments
  await runTest('Today\'s Appointments', async () => {
    const response = await axios.get(`${API_URL}/appointments/today`);
    if (!response.data.data) {
      throw new Error('Today\'s appointments failed');
    }
    console.log(`   Found ${response.data.data.length} appointments for today`);
  });

  // Test 10: Delete Patient (cleanup)
  if (newPatientId) {
    await runTest('Delete Patient (Cleanup)', async () => {
      const response = await axios.delete(`${API_URL}/patients/${newPatientId}`);
      if (response.data.status !== 'success') {
        throw new Error('Patient deletion failed');
      }
    });
  }

  // Final Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`${colors.green}✅ Tests Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Tests Failed: ${testsFailed}${colors.reset}`);
  
  const successRate = ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1);
  console.log(`\n📈 Success Rate: ${successRate}%`);
  
  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 ALL TESTS PASSED! The system is working perfectly!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️ Some tests failed. Please review the errors above.${colors.reset}`);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
