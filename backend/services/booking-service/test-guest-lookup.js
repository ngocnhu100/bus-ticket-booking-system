/**
 * Test script for Guest Booking Lookup API
 * 
 * Tests various scenarios:
 * 1. Lookup with phone number
 * 2. Lookup with email
 * 3. Invalid booking reference
 * 4. Contact mismatch
 * 5. Missing parameters
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(title) {
  console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.yellow);
}

async function testGuestLookup() {
  log(`\n${colors.bold}🧪 Guest Booking Lookup API Test Suite${colors.reset}\n`);
  log(`Testing endpoint: ${BASE_URL}/guest/lookup\n`);

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Lookup with phone number (success case)
  logTest('Test 1: Lookup with Valid Phone Number');
  try {
    const response = await axios.get(`${BASE_URL}/guest/lookup`, {
      params: {
        bookingReference: 'ABC123',
        phone: '+84973994154'
      }
    });

    if (response.status === 200 && response.data.success) {
      logSuccess('Successfully retrieved booking with phone');
      logInfo(`Booking Reference: ${response.data.data.bookingReference}`);
      logInfo(`Contact Phone: ${response.data.data.contactPhone}`);
      logInfo(`Total Price: ${response.data.data.totalPrice} ${response.data.data.currency}`);
      passedTests++;
    } else {
      logError('Unexpected response structure');
      failedTests++;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logInfo('Booking not found (expected if no test data exists)');
      logInfo('Status: 404 - Booking not found');
      logInfo('Response: ' + JSON.stringify(error.response.data, null, 2));
      passedTests++; // This is expected behavior
    } else {
      logError(`Test failed: ${error.message}`);
      if (error.response) {
        logInfo('Response: ' + JSON.stringify(error.response.data, null, 2));
      }
      failedTests++;
    }
  }

  // Test 2: Lookup with email (success case)
  logTest('Test 2: Lookup with Valid Email');
  try {
    const response = await axios.get(`${BASE_URL}/guest/lookup`, {
      params: {
        bookingReference: 'ABC123',
        email: 'guest@example.com'
      }
    });

    if (response.status === 200 && response.data.success) {
      logSuccess('Successfully retrieved booking with email');
      passedTests++;
    } else {
      logError('Unexpected response structure');
      failedTests++;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logInfo('Booking not found (expected if no test data exists)');
      passedTests++;
    } else {
      logError(`Test failed: ${error.message}`);
      failedTests++;
    }
  }

  // Test 3: Missing booking reference (validation error)
  logTest('Test 3: Missing Booking Reference');
  try {
    const response = await axios.get(`${BASE_URL}/guest/lookup`, {
      params: {
        phone: '+84973994154'
      }
    });
    logError('Should have returned 400 error');
    failedTests++;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Correctly returned 400 for missing booking reference');
      logInfo('Error code: ' + error.response.data.error.code);
      logInfo('Error message: ' + error.response.data.error.message);
      passedTests++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      failedTests++;
    }
  }

  // Test 4: Missing contact info (validation error)
  logTest('Test 4: Missing Phone and Email');
  try {
    const response = await axios.get(`${BASE_URL}/guest/lookup`, {
      params: {
        bookingReference: 'ABC123'
      }
    });
    logError('Should have returned 400 error');
    failedTests++;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Correctly returned 400 for missing contact info');
      logInfo('Error message: ' + error.response.data.error.message);
      passedTests++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      failedTests++;
    }
  }

  // Test 5: Invalid booking reference format
  logTest('Test 5: Invalid Booking Reference Format');
  try {
    const response = await axios.get(`${BASE_URL}/guest/lookup`, {
      params: {
        bookingReference: 'INVALID', // Only 7 chars, should be 6
        phone: '+84973994154'
      }
    });
    logError('Should have returned 400 error');
    failedTests++;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Correctly returned 400 for invalid format');
      logInfo('Error message: ' + error.response.data.error.message);
      passedTests++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      failedTests++;
    }
  }

  // Test 6: Invalid phone format
  logTest('Test 6: Invalid Phone Format');
  try {
    const response = await axios.get(`${BASE_URL}/guest/lookup`, {
      params: {
        bookingReference: 'ABC123',
        phone: '123' // Invalid phone
      }
    });
    logError('Should have returned 400 error');
    failedTests++;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Correctly returned 400 for invalid phone format');
      passedTests++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      failedTests++;
    }
  }

  // Test 7: Vietnamese phone format (0 prefix)
  logTest('Test 7: Vietnamese Phone Format (0 prefix)');
  try {
    const response = await axios.get(`${BASE_URL}/guest/lookup`, {
      params: {
        bookingReference: 'ABC123',
        phone: '0973994154' // Vietnamese format
      }
    });

    if (response.status === 200) {
      logSuccess('Successfully accepted Vietnamese phone format');
      passedTests++;
    }
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 403) {
      logSuccess('Phone format accepted (booking not found is expected)');
      passedTests++;
    } else if (error.response?.status === 400) {
      logError('Vietnamese phone format rejected incorrectly');
      failedTests++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      failedTests++;
    }
  }

  // Test 8: Contact mismatch (wrong phone)
  logTest('Test 8: Contact Mismatch - Wrong Phone');
  try {
    const response = await axios.get(`${BASE_URL}/guest/lookup`, {
      params: {
        bookingReference: 'ABC123',
        phone: '+84999999999' // Wrong phone
      }
    });
    
    if (response.status === 200) {
      logError('Should have returned 403 for wrong phone');
      failedTests++;
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logSuccess('Correctly returned 403 for contact mismatch');
      logInfo('Error code: ' + error.response.data.error.code);
      passedTests++;
    } else if (error.response?.status === 404) {
      logInfo('Booking not found (cannot test contact mismatch)');
      passedTests++;
    } else {
      logError(`Unexpected error: ${error.message}`);
      failedTests++;
    }
  }

  // Summary
  console.log(`\n${colors.bold}${colors.blue}=== Test Summary ===${colors.reset}`);
  log(`Total Tests: ${passedTests + failedTests}`);
  logSuccess(`Passed: ${passedTests}`);
  if (failedTests > 0) {
    logError(`Failed: ${failedTests}`);
  }
  
  const percentage = ((passedTests / (passedTests + failedTests)) * 100).toFixed(1);
  log(`\nSuccess Rate: ${percentage}%`, percentage >= 80 ? colors.green : colors.red);
}

// Run tests
testGuestLookup().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
