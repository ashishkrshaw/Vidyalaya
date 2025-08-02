const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

async function testSchoolLoginFlow() {
  try {
    console.log('🧪 Testing School Login Flow...\n');

    // Step 1: Add a test school
    console.log('1. Adding test school...');
    const addSchoolResponse = await fetch(`${BASE_URL}/admin/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: 'TEST001',
        schoolName: 'Test School',
        firstUser: {
          username: 'testuser',
          password: 'testpass123',
          role: 'admin'
        }
      })
    });

    if (addSchoolResponse.ok) {
      console.log('✅ Test school added successfully');
    } else {
      const error = await addSchoolResponse.text();
      console.log('❌ Failed to add test school:', error);
      return;
    }

    // Step 2: Test school login
    console.log('\n2. Testing school login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/school-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: 'TEST001',
        username: 'testuser',
        password: 'testpass123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ School login successful!');
      console.log('User:', loginData.user);
      console.log('School Info:', loginData.schoolInfo);
    } else {
      const error = await loginResponse.text();
      console.log('❌ School login failed:', error);
    }

    // Step 3: Test invalid login
    console.log('\n3. Testing invalid login...');
    const invalidLoginResponse = await fetch(`${BASE_URL}/auth/school-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: 'TEST001',
        username: 'testuser',
        password: 'wrongpassword'
      })
    });

    if (!invalidLoginResponse.ok) {
      console.log('✅ Invalid login correctly rejected');
    } else {
      console.log('❌ Invalid login should have been rejected');
    }

    console.log('\n🎉 School login flow test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Navigate to /school-login');
    console.log('3. Use School ID: TEST001, Username: testuser, Password: testpass123');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSchoolLoginFlow(); 