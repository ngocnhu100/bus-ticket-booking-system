/**
 * Test script để verify booking reference uniqueness logic
 */
const axios = require('axios');

const API_BASE = 'http://localhost:3004';

async function testUniqueReferenceGeneration() {
  console.log('========================================');
  console.log('TEST: Booking Reference Uniqueness');
  console.log('========================================\n');

  // Test data
  const bookingData = {
    tripId: '1',
    seats: ['1A'],
    passengers: [
      {
        fullName: 'Test Uniqueness',
        documentType: 'CCCD',
        documentId: '001234567890',
        phone: '+84973994154',
        seatCode: '1A'
      }
    ],
    contactEmail: 'test.unique@example.com',
    contactPhone: '+84973994154'
  };

  try {
    console.log('1️⃣  Creating first booking...');
    const response1 = await axios.post(`${API_BASE}/`, bookingData);
    
    if (response1.data.success) {
      console.log('✅ First booking created successfully');
      console.log(`   Booking Reference: ${response1.data.data.bookingReference}`);
      console.log(`   Booking ID: ${response1.data.data.bookingId}`);
    }

    console.log('\n2️⃣  Creating second booking (should get different reference)...');
    
    // Modify data slightly for second booking
    bookingData.seats = ['1B'];
    bookingData.passengers[0].seatCode = '1B';
    bookingData.passengers[0].fullName = 'Test Uniqueness 2';
    
    const response2 = await axios.post(`${API_BASE}/`, bookingData);
    
    if (response2.data.success) {
      console.log('✅ Second booking created successfully');
      console.log(`   Booking Reference: ${response2.data.data.bookingReference}`);
      console.log(`   Booking ID: ${response2.data.data.bookingId}`);
      
      // Compare references
      if (response1.data.data.bookingReference !== response2.data.data.bookingReference) {
        console.log('\n✅ SUCCESS: Both bookings have UNIQUE references');
      } else {
        console.log('\n❌ FAIL: Both bookings have SAME reference (this should not happen)');
      }
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

async function testReferenceCollisionHandling() {
  console.log('\n\n========================================');
  console.log('TEST: Reference Collision Handling');
  console.log('========================================\n');
  console.log('ℹ️  Creating multiple bookings simultaneously to test collision handling...\n');

  const promises = [];
  
  for (let i = 0; i < 3; i++) {
    const bookingData = {
      tripId: '1',
      seats: [`${i+2}A`],
      passengers: [
        {
          fullName: `Concurrent Test ${i + 1}`,
          documentType: 'CCCD',
          documentId: `00123456789${i}`,
          phone: `+8497399415${i}`,
          seatCode: `${i+2}A`
        }
      ],
      contactEmail: `concurrent${i}@example.com`,
      contactPhone: `+8497399415${i}`
    };

    promises.push(
      axios.post(`${API_BASE}/`, bookingData)
        .then(res => ({
          success: true,
          reference: res.data.data.bookingReference,
          seat: bookingData.seats[0]
        }))
        .catch(err => ({
          success: false,
          error: err.response?.data?.error?.message || err.message,
          seat: bookingData.seats[0]
        }))
    );
  }

  const results = await Promise.all(promises);
  
  console.log('Results:');
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✅ Booking ${index + 1} (seat ${result.seat}): ${result.reference}`);
    } else {
      console.log(`❌ Booking ${index + 1} (seat ${result.seat}): ${result.error}`);
    }
  });

  // Check uniqueness
  const references = results
    .filter(r => r.success)
    .map(r => r.reference);
  
  const uniqueRefs = new Set(references);
  
  if (references.length === uniqueRefs.size) {
    console.log('\n✅ SUCCESS: All concurrent bookings have UNIQUE references');
  } else {
    console.log('\n❌ FAIL: Some concurrent bookings have DUPLICATE references');
  }
}

async function runTests() {
  await testUniqueReferenceGeneration();
  await testReferenceCollisionHandling();
  
  console.log('\n========================================');
  console.log('All tests completed!');
  console.log('========================================\n');
}

runTests();
