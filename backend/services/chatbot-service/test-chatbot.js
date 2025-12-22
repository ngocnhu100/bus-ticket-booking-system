/**
 * Test script for Chatbot Service
 * 
 * Run with: node test-chatbot.js
 * 
 * Prerequisites:
 * - API Gateway running on http://localhost:3000
 * - Chatbot service running on http://localhost:3007
 * - OpenAI API key configured in .env
 * 
 * Note: This script tests via API Gateway (recommended)
 * To test direct service access, change BASE_URL to http://localhost:3007
 * and update endpoints (e.g., /query instead of /chatbot/query)
 */

const axios = require('axios');

// Use API Gateway (recommended)
const BASE_URL = 'http://localhost:3000/chatbot';

// Alternative: Direct service access
// const BASE_URL = 'http://localhost:3007';

let sessionId = null;

// Helper function to make requests
async function request(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error in ${method} ${endpoint}:`);
    console.error(error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Health check
async function testHealthCheck() {
  console.log('\n📋 Test 1: Health Check');
  const result = await request('GET', '/health');
  console.log('✅ Service is healthy:', result);
  return result.success;
}

// Test 2: Start conversation (trip search)
async function testTripSearch() {
  console.log('\n📋 Test 2: Trip Search');
  const result = await request('POST', '/query', {
    message: 'Tôi muốn đi từ Sài Gòn ra Đà Nẵng ngày mai',
  });

  sessionId = result.data.sessionId;
  console.log('✅ Session created:', sessionId);
  console.log('Response:', result.data.response.text);
  console.log('Entities:', result.data.response.entities);
  console.log('Suggestions:', result.data.response.suggestions);

  return result.success;
}

// Test 3: Continue conversation
async function testContinueConversation() {
  console.log('\n📋 Test 3: Continue Conversation');
  
  if (!sessionId) {
    throw new Error('No session ID from previous test');
  }

  const result = await request('POST', '/query', {
    sessionId,
    message: 'Tìm chuyến buổi sáng',
  });

  console.log('✅ Response:', result.data.response.text);
  return result.success;
}

// Test 4: FAQ question
async function testFAQ() {
  console.log('\n📋 Test 4: FAQ Question');
  
  const result = await request('POST', '/query', {
    message: 'Chính sách hoàn vé như thế nào?',
  });

  console.log('✅ FAQ Response:', result.data.response.text);
  return result.success;
}

// Test 5: Get conversation history
async function testGetHistory() {
  console.log('\n📋 Test 5: Get Conversation History');

  if (!sessionId) {
    throw new Error('No session ID from previous test');
  }

  const result = await request('GET', `/sessions/${sessionId}/history`);
  console.log('✅ Retrieved', result.data.count, 'messages');
  console.log('Messages:');
  result.data.messages.forEach((msg, idx) => {
    console.log(`  ${idx + 1}. [${msg.role}]: ${msg.content.substring(0, 100)}...`);
  });

  return result.success;
}

// Test 6: Submit feedback
async function testFeedback() {
  console.log('\n📋 Test 6: Submit Feedback');

  if (!sessionId) {
    throw new Error('No session ID from previous test');
  }

  // Get message ID from history first
  const historyResult = await request('GET', `/sessions/${sessionId}/history`);
  const lastMessage = historyResult.data.messages[historyResult.data.messages.length - 1];

  const result = await request('POST', '/feedback', {
    sessionId,
    messageId: lastMessage.message_id,
    rating: 'positive',
    comment: 'Very helpful!',
  });

  console.log('✅ Feedback submitted:', result.data.message);
  return result.success;
}

// Test 7: Reset conversation
async function testResetConversation() {
  console.log('\n📋 Test 7: Reset Conversation');

  if (!sessionId) {
    throw new Error('No session ID from previous test');
  }

  const result = await request('POST', `/sessions/${sessionId}/reset`);
  console.log('✅ Conversation reset:', result.data.message);

  // Verify history is cleared
  const historyResult = await request('GET', `/sessions/${sessionId}/history`);
  console.log('Messages after reset:', historyResult.data.count);

  return result.success;
}

// Test 8: English query
async function testEnglishQuery() {
  console.log('\n📋 Test 8: English Query');

  const result = await request('POST', '/query', {
    message: 'Find buses from Ho Chi Minh City to Hanoi on 2025-12-25',
  });

  console.log('✅ Response:', result.data.response.text);
  console.log('Entities:', result.data.response.entities);

  return result.success;
}

// Test 9: Booking intent (without actually booking)
async function testBookingIntent() {
  console.log('\n📋 Test 9: Booking Intent');

  // First search for trips
  const searchResult = await request('POST', '/query', {
    message: 'Find trips from HCMC to Da Nang tomorrow',
  });

  const newSessionId = searchResult.data.sessionId;

  // Then express booking intent
  const bookingResult = await request('POST', '/query', {
    sessionId: newSessionId,
    message: 'I want to book the first trip, seat A1',
  });

  console.log('✅ Booking guidance:', bookingResult.data.response.text);

  return bookingResult.success;
}

// Test 10: General inquiry
async function testGeneralInquiry() {
  console.log('\n📋 Test 10: General Inquiry');

  const result = await request('POST', '/query', {
    message: 'Hello! How can you help me?',
  });

  console.log('✅ Response:', result.data.response.text);

  return result.success;
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Chatbot Service Tests\n');
  console.log('='.repeat(50));

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Trip Search', fn: testTripSearch },
    { name: 'Continue Conversation', fn: testContinueConversation },
    { name: 'FAQ', fn: testFAQ },
    { name: 'Get History', fn: testGetHistory },
    { name: 'Submit Feedback', fn: testFeedback },
    { name: 'Reset Conversation', fn: testResetConversation },
    { name: 'English Query', fn: testEnglishQuery },
    { name: 'Booking Intent', fn: testBookingIntent },
    { name: 'General Inquiry', fn: testGeneralInquiry },
  ];

  const results = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  for (const test of tests) {
    try {
      const success = await test.fn();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`${test.name}: Test returned false`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${test.name}: ${error.message}`);
      console.error(`❌ Test failed: ${test.name}`);
    }

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / tests.length) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log('\n✨ Tests completed!\n');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
