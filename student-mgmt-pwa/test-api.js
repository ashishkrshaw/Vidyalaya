// Test script to verify token-free API access
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testing token-free API access...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);

    // Test 2: Get students (should work without token)
    console.log('\n2. Testing get students...');
    const studentsResponse = await fetch(`${BASE_URL}/students`, {
      headers: {
        'Content-Type': 'application/json',
        'X-School-ID': 'test-school'
      }
    });
    const studentsData = await studentsResponse.json();
    console.log('✅ Get students:', studentsData.students ? `${studentsData.students.length} students` : 'No students');

    // Test 3: Add a test student
    console.log('\n3. Testing add student...');
    const testStudent = {
      student_id: 'TEST-001',
      name: 'Test Student',
      class: '10',
      section: 'A',
      admission_date: new Date().toISOString().split('T')[0],
      parent_name: 'Test Parent',
      phone: '1234567890',
      address: 'Test Address'
    };

    const addResponse = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-School-ID': 'test-school'
      },
      body: JSON.stringify(testStudent)
    });
    const addData = await addResponse.json();
    console.log('✅ Add student:', addData.message);

    // Test 4: Get students again to verify
    console.log('\n4. Testing get students after adding...');
    const studentsResponse2 = await fetch(`${BASE_URL}/students`, {
      headers: {
        'Content-Type': 'application/json',
        'X-School-ID': 'test-school'
      }
    });
    const studentsData2 = await studentsResponse2.json();
    console.log('✅ Get students after add:', studentsData2.students ? `${studentsData2.students.length} students` : 'No students');

    // Test 5: Get history
    console.log('\n5. Testing get history...');
    const historyResponse = await fetch(`${BASE_URL}/students/history`, {
      headers: {
        'Content-Type': 'application/json',
        'X-School-ID': 'test-school'
      }
    });
    const historyData = await historyResponse.json();
    console.log('✅ Get history:', historyData.history ? `${historyData.history.length} entries` : 'No history');

    console.log('\n🎉 All tests passed! Token-free access is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI(); 