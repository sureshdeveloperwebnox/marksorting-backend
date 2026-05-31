import axios from 'axios';

async function testUpdate() {
  const backendUrl = 'http://localhost:4000/api/v1';
  
  // First, we need to log in to get a token
  try {
    console.log('Logging in...');
    const loginRes = await axios.post(`${backendUrl}/auth/login`, {
      email: 'admin@marksorting.com',
      password: 'NewVetri@123', // let's check what the default credentials are
    });
    
    const token = loginRes.data.access_token;
    console.log('Logged in successfully, token retrieved.');
    
    // Get users to find one to update
    const usersRes = await axios.get(`${backendUrl}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const userToUpdate = usersRes.data.users[0];
    if (!userToUpdate) {
      console.error('No users found.');
      return;
    }
    
    console.log(`Attempting to update user: ${userToUpdate.full_name} (${userToUpdate.id})`);
    
    // Scenario 1: Attempt update without password (empty password scenario from updated frontend)
    console.log('\n--- Scenario 1: Updating without password ---');
    try {
      const updateRes = await axios.put(`${backendUrl}/users/${userToUpdate.id}`, {
        full_name: userToUpdate.full_name,
        email: userToUpdate.email,
        role_id: userToUpdate.role.id,
        account_status: userToUpdate.account_status,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Scenario 1 Success:', updateRes.data.after ? 'User updated successfully' : 'Failed');
    } catch (err: any) {
      console.error('Scenario 1 Failed with status:', err.response?.status);
      console.error('Error Details:', JSON.stringify(err.response?.data, null, 2));
    }

    // Scenario 2: Attempt update with a valid password
    console.log('\n--- Scenario 2: Updating with a valid password ---');
    try {
      const updateRes = await axios.put(`${backendUrl}/users/${userToUpdate.id}`, {
        full_name: userToUpdate.full_name,
        email: userToUpdate.email,
        password: 'NewValidPassword123!',
        role_id: userToUpdate.role.id,
        account_status: userToUpdate.account_status,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Scenario 2 Success:', updateRes.data.after ? 'User updated successfully (password changed)' : 'Failed');
    } catch (err: any) {
      console.error('Scenario 2 Failed with status:', err.response?.status);
      console.error('Error Details:', JSON.stringify(err.response?.data, null, 2));
    }
    
  } catch (err: any) {
    console.error('Failed to run test:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
}

testUpdate();
