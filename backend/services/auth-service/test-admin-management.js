/**
 * Admin Management API Test Suite
 * 
 * This file provides comprehensive test examples for all admin management endpoints.
 * Run these tests after the service is running.
 * 
 * Prerequisites:
 * 1. Database migrations applied (including 019 and 020)
 * 2. Auth service running on port 3001
 * 3. API Gateway running on port 3000
 * 4. Default admin account exists (admin@example.com / Admin@123)
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin@123';

let adminToken = null;
let createdAdminId = null;

/**
 * Helper function to login and get admin token
 */
async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    
    if (response.data.success && response.data.data.accessToken) {
      adminToken = response.data.data.accessToken;
      console.log('✅ Admin login successful');
      console.log('Token:', adminToken.substring(0, 50) + '...');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 1: Create Admin Account
 */
async function testCreateAdmin() {
  console.log('\n📝 Test 1: Create Admin Account');
  console.log('='.repeat(50));
  
  try {
    const newAdmin = {
      email: `testadmin${Date.now()}@example.com`,
      phone: `091234${Math.floor(Math.random() * 10000)}`,
      password: 'TestAdmin@123',
      fullName: 'Test Administrator',
    };
    
    console.log('Creating admin with data:', JSON.stringify(newAdmin, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/admin/accounts`, newAdmin, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    console.log('✅ Admin created successfully');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    createdAdminId = response.data.data.userId;
    return true;
  } catch (error) {
    console.error('❌ Failed to create admin:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 2: Get All Admin Accounts (with pagination)
 */
async function testGetAllAdmins() {
  console.log('\n📋 Test 2: Get All Admin Accounts');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/accounts`, {
      params: { page: 1, limit: 10 },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    console.log('✅ Retrieved admin accounts successfully');
    console.log(`Total admins: ${response.data.pagination.total}`);
    console.log(`Page: ${response.data.pagination.page}/${response.data.pagination.totalPages}`);
    console.log(`Admins on this page: ${response.data.data.length}`);
    console.log('\nFirst admin:', JSON.stringify(response.data.data[0], null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed to get admin accounts:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 3: Get All Active Admins
 */
async function testGetActiveAdmins() {
  console.log('\n🟢 Test 3: Get Active Admin Accounts');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/accounts`, {
      params: { page: 1, limit: 10, status: 'active' },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    console.log('✅ Retrieved active admin accounts successfully');
    console.log(`Total active admins: ${response.data.pagination.total}`);
    console.log(`Active admins on this page: ${response.data.data.length}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to get active admins:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 4: Search Admin by Name/Email
 */
async function testSearchAdmins() {
  console.log('\n🔍 Test 4: Search Admin Accounts');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/accounts`, {
      params: { page: 1, limit: 10, search: 'test' },
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    console.log('✅ Search completed successfully');
    console.log(`Found ${response.data.pagination.total} admin(s) matching "test"`);
    if (response.data.data.length > 0) {
      console.log('First result:', JSON.stringify(response.data.data[0], null, 2));
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to search admins:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 5: Get Admin by ID
 */
async function testGetAdminById() {
  console.log('\n👤 Test 5: Get Admin Account by ID');
  console.log('='.repeat(50));
  
  if (!createdAdminId) {
    console.log('⚠️  No admin ID available, skipping test');
    return false;
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/accounts/${createdAdminId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    console.log('✅ Retrieved admin account successfully');
    console.log('Admin details:', JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed to get admin by ID:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 6: Update Admin Account
 */
async function testUpdateAdmin() {
  console.log('\n✏️  Test 6: Update Admin Account');
  console.log('='.repeat(50));
  
  if (!createdAdminId) {
    console.log('⚠️  No admin ID available, skipping test');
    return false;
  }
  
  try {
    const updateData = {
      fullName: 'Updated Test Administrator',
      phone: '0999999999',
    };
    
    console.log('Updating admin with data:', JSON.stringify(updateData, null, 2));
    
    const response = await axios.put(
      `${API_BASE_URL}/admin/accounts/${createdAdminId}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    
    console.log('✅ Admin updated successfully');
    console.log('Updated admin:', JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed to update admin:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 7: Get Admin Statistics
 */
async function testGetAdminStats() {
  console.log('\n📊 Test 7: Get Admin Statistics');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    console.log('✅ Retrieved admin statistics successfully');
    console.log('Statistics:', JSON.stringify(response.data.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Failed to get admin stats:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 8: Deactivate Admin Account
 */
async function testDeactivateAdmin() {
  console.log('\n🔴 Test 8: Deactivate Admin Account');
  console.log('='.repeat(50));
  
  if (!createdAdminId) {
    console.log('⚠️  No admin ID available, skipping test');
    return false;
  }
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/accounts/${createdAdminId}/deactivate`,
      {},
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    
    console.log('✅ Admin deactivated successfully');
    console.log('Deactivated admin:', JSON.stringify(response.data.data, null, 2));
    console.log('Is active:', response.data.data.isActive); // Should be false
    return true;
  } catch (error) {
    console.error('❌ Failed to deactivate admin:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 9: Reactivate Admin Account
 */
async function testReactivateAdmin() {
  console.log('\n🟢 Test 9: Reactivate Admin Account');
  console.log('='.repeat(50));
  
  if (!createdAdminId) {
    console.log('⚠️  No admin ID available, skipping test');
    return false;
  }
  
  try {
    const reactivationData = {
      password: 'NewSecurePass@123',
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/admin/accounts/${createdAdminId}/reactivate`,
      reactivationData,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    
    console.log('✅ Admin reactivated successfully');
    console.log('Reactivated admin:', JSON.stringify(response.data.data, null, 2));
    console.log('Is active:', response.data.data.isActive); // Should be true
    return true;
  } catch (error) {
    console.error('❌ Failed to reactivate admin:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 10: Validation Error - Invalid Email
 */
async function testValidationError() {
  console.log('\n⚠️  Test 10: Validation Error Handling');
  console.log('='.repeat(50));
  
  try {
    const invalidAdmin = {
      email: 'invalid-email',  // Invalid format
      password: 'weak',  // Too weak
      fullName: 'T',  // Too short
    };
    
    console.log('Attempting to create admin with invalid data...');
    
    await axios.post(`${API_BASE_URL}/admin/accounts`, invalidAdmin, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    console.log('❌ Test failed - should have received validation error');
    return false;
  } catch (error) {
    if (error.response?.status === 422) {
      console.log('✅ Validation error handled correctly');
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 11: Unauthorized Access
 */
async function testUnauthorizedAccess() {
  console.log('\n🚫 Test 11: Unauthorized Access');
  console.log('='.repeat(50));
  
  try {
    console.log('Attempting to access admin endpoint without token...');
    
    await axios.get(`${API_BASE_URL}/admin/accounts`);
    
    console.log('❌ Test failed - should have been blocked');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Unauthorized access blocked correctly');
      console.log('Error:', error.response.data.error.message);
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   Admin Management API - Comprehensive Tests      ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('\n');
  
  const results = [];
  
  // Login first
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without admin authentication');
    process.exit(1);
  }
  
  // Run all tests
  results.push({ name: 'Create Admin', success: await testCreateAdmin() });
  results.push({ name: 'Get All Admins', success: await testGetAllAdmins() });
  results.push({ name: 'Get Active Admins', success: await testGetActiveAdmins() });
  results.push({ name: 'Search Admins', success: await testSearchAdmins() });
  results.push({ name: 'Get Admin by ID', success: await testGetAdminById() });
  results.push({ name: 'Update Admin', success: await testUpdateAdmin() });
  results.push({ name: 'Get Admin Stats', success: await testGetAdminStats() });
  results.push({ name: 'Deactivate Admin', success: await testDeactivateAdmin() });
  results.push({ name: 'Reactivate Admin', success: await testReactivateAdmin() });
  results.push({ name: 'Validation Error', success: await testValidationError() });
  results.push({ name: 'Unauthorized Access', success: await testUnauthorizedAccess() });
  
  // Print summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║              Test Results Summary                  ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('\n');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.name}`);
  });
  
  console.log('\n');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('\n');
  
  if (failed === 0) {
    console.log('🎉 All tests passed successfully!');
  } else {
    console.log('⚠️  Some tests failed. Please check the logs above.');
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  loginAsAdmin,
  testCreateAdmin,
  testGetAllAdmins,
  testGetActiveAdmins,
  testSearchAdmins,
  testGetAdminById,
  testUpdateAdmin,
  testGetAdminStats,
  testDeactivateAdmin,
  testReactivateAdmin,
  testValidationError,
  testUnauthorizedAccess,
};
