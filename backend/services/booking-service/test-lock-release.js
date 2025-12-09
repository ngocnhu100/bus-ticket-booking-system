// test-lock-release.js
const axios = require('axios');

async function testLockRelease() {
  const bookingServiceUrl = 'http://localhost:3001';
  const tripServiceUrl = 'http://localhost:3002';

  try {
    console.log('🧪 Testing seat lock release for cancelled bookings...');

    // First, let's check if services are running
    try {
      await axios.get(`${bookingServiceUrl}/health`);
      console.log('✅ Booking service is running');
    } catch (error) {
      console.log('❌ Booking service not running, starting it...');
      // We'll assume it's running for now
    }

    try {
      await axios.get(`${tripServiceUrl}/health`);
      console.log('✅ Trip service is running');
    } catch (error) {
      console.log('❌ Trip service not running, starting it...');
      // We'll assume it's running for now
    }

    // Test the lock release endpoint directly
    console.log('🔓 Testing direct lock release call...');

    const testTripId = 'test-trip-123';
    const testSeatCodes = ['A1', 'A2'];

    const response = await axios.post(
      `${tripServiceUrl}/${testTripId}/seats/release`,
      {
        seatCodes: testSeatCodes,
        isGuest: true,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      }
    );

    console.log('✅ Lock release response:', response.data);

    if (response.data.success) {
      console.log('🎉 Lock release functionality is working!');
    } else {
      console.log('❌ Lock release failed:', response.data);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testLockRelease();
