const axios = require('axios');

// Test through API Gateway
const API_BASE = 'http://localhost:3000';

// Test data
const testBooking = {
  tripId: 'TRIP_TEST_001', // Valid trip ID from seeded data
  isGuestCheckout: true,
  passengers: [{
    fullName: 'Test User',
    seatNumber: 'A1'
  }],
  contactPhone: '0901234567',
  contactEmail: 'test@example.com',
  totalPrice: 150000
};

async function createBooking(index) {
  try {
    // Generate random seat to avoid conflicts
    const row = String.fromCharCode(65 + Math.floor(Math.random() * 10)); // A-J
    const seatNum = Math.floor(Math.random() * 4) + 1; // 1-4
    const seatCode = `${row}${seatNum}`;
    
    const booking = {
      ...testBooking,
      passengers: [{
        fullName: `Test User ${index}`,
        seatNumber: seatCode
      }],
      contactEmail: `test${index}@example.com`
    };

    const response = await axios.post(`${API_BASE}/bookings`, booking);
    const reference = response.data.data?.booking_reference || response.data.data?.bookingReference;
    if (!reference) {
      console.log('Debug - Response structure:', JSON.stringify(response.data, null, 2));
    }
    return {
      success: true,
      reference,
      index
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      details: error.response?.data || error.code,
      index
    };
  }
}

async function testConcurrentBookings(count = 10) {
  console.log(`\n🧪 Testing ${count} concurrent booking reference generation...\n`);
  
  const startTime = Date.now();
  
  // Create concurrent requests
  const promises = Array.from({ length: count }, (_, i) => createBooking(i + 1));
  const results = await Promise.all(promises);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('📊 RESULTS:');
  console.log(`✅ Successful: ${successful.length}/${count}`);
  console.log(`❌ Failed: ${failed.length}/${count}`);
  console.log(`⏱️  Duration: ${duration}ms (${(duration/count).toFixed(2)}ms avg per booking)\n`);
  
  if (successful.length > 0) {
    console.log('✅ Generated Booking References:');
    const references = successful.map(r => r.reference).sort();
    references.forEach((ref, idx) => {
      console.log(`   ${idx + 1}. ${ref}`);
    });
    
    // Check for duplicates
    const uniqueRefs = new Set(references);
    if (uniqueRefs.size !== references.length) {
      console.log('\n❌ CRITICAL: DUPLICATE REFERENCES DETECTED!');
      const duplicates = references.filter((ref, idx) => references.indexOf(ref) !== idx);
      console.log('   Duplicates:', duplicates);
    } else {
      console.log('\n✅ All references are unique');
    }
    
    // Check sequential pattern
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const expectedPrefix = `BK${today}`;
    const allHaveCorrectPrefix = references.every(ref => ref.startsWith(expectedPrefix));
    
    if (allHaveCorrectPrefix) {
      console.log(`✅ All references have correct prefix: ${expectedPrefix}`);
      
      // Extract sequences
      const sequences = references.map(ref => parseInt(ref.slice(-3)));
      console.log(`📈 Sequence range: ${Math.min(...sequences)} - ${Math.max(...sequences)}`);
    } else {
      console.log(`❌ Some references have incorrect prefix (expected: ${expectedPrefix})`);
    }
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Bookings:');
    failed.forEach(f => {
      console.log(`   #${f.index}: ${f.error}`);
      if (f.details) console.log(`      Details: ${JSON.stringify(f.details)}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

async function testSequentialBookings(count = 5) {
  console.log(`\n🧪 Testing ${count} sequential booking reference generation...\n`);
  
  const references = [];
  
  for (let i = 1; i <= count; i++) {
    console.log(`Creating booking ${i}/${count}...`);
    const result = await createBooking(100 + i);
    
    if (result.success) {
      console.log(`✅ ${result.reference}`);
      references.push(result.reference);
    } else {
      console.log(`❌ Error: ${result.error}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (references.length > 1) {
    console.log('\n📊 Sequential Analysis:');
    const sequences = references.map(ref => parseInt(ref.slice(-3)));
    
    let isSequential = true;
    for (let i = 1; i < sequences.length; i++) {
      const diff = sequences[i] - sequences[i-1];
      if (diff !== 1) {
        isSequential = false;
        console.log(`❌ Gap detected: ${sequences[i-1]} -> ${sequences[i]} (diff: ${diff})`);
      }
    }
    
    if (isSequential) {
      console.log('✅ All references are perfectly sequential');
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

async function main() {
  console.log('🚀 BOOKING REFERENCE GENERATION TEST');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Sequential bookings
    await testSequentialBookings(5);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Concurrent bookings
    await testConcurrentBookings(10);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: High concurrency
    await testConcurrentBookings(20);
    
    console.log('\n✅ All tests completed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
