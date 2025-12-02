// Comprehensive Sorting Test Script for Trip Service
const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3005;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

function verifyAscending(arr, field, label) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) {
      console.log(`   ❌ NOT SORTED: ${label}[${i}]=${arr[i]} > ${label}[${i+1}]=${arr[i+1]}`);
      return false;
    }
  }
  console.log(`   ✅ VERIFIED: All ${arr.length} items in ascending order`);
  return true;
}

function verifyDescending(arr, field, label) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < arr[i + 1]) {
      console.log(`   ❌ NOT SORTED: ${label}[${i}]=${arr[i]} < ${label}[${i+1}]=${arr[i+1]}`);
      return false;
    }
  }
  console.log(`   ✅ VERIFIED: All ${arr.length} items in descending order`);
  return true;
}

async function runTests() {
  console.log('🧪 Testing Sorting Functionality for Trip Service\n');
  console.log('=' .repeat(80));
  console.log('\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Sort by Price - Ascending
  try {
    console.log('TEST 1: Sort by Price (Ascending)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=asc');
    console.log(`✅ Request successful`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Price order:`);
    
    const prices = result.data.trips.map(t => t.pricing.basePrice);
    result.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.pricing.basePrice.toLocaleString()} VND - ${trip.operator.name}`);
    });
    
    if (verifyAscending(prices, 'price', 'Prices')) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 2: Sort by Price - Descending
  try {
    console.log('TEST 2: Sort by Price (Descending)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=desc');
    console.log(`✅ Request successful`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Price order:`);
    
    const prices = result.data.trips.map(t => t.pricing.basePrice);
    result.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.pricing.basePrice.toLocaleString()} VND - ${trip.operator.name}`);
    });
    
    if (verifyDescending(prices, 'price', 'Prices')) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 3: Sort by Time - Ascending (Default)
  try {
    console.log('TEST 3: Sort by Departure Time (Ascending - Default)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=time&order=asc');
    console.log(`✅ Request successful`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Departure time order:`);
    
    const times = result.data.trips.map(t => {
      const [h, m] = t.schedule.departureTime.split(':').map(Number);
      return h * 60 + m;
    });
    
    result.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.schedule.departureTime} - ${trip.operator.name}`);
    });
    
    if (verifyAscending(times, 'time', 'Departure times')) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 4: Sort by Time - Descending
  try {
    console.log('TEST 4: Sort by Departure Time (Descending)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=time&order=desc');
    console.log(`✅ Request successful`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Departure time order:`);
    
    const times = result.data.trips.map(t => {
      const [h, m] = t.schedule.departureTime.split(':').map(Number);
      return h * 60 + m;
    });
    
    result.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.schedule.departureTime} - ${trip.operator.name}`);
    });
    
    if (verifyDescending(times, 'time', 'Departure times')) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 5: Sort by Duration - Ascending
  try {
    console.log('TEST 5: Sort by Duration (Ascending)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=duration&order=asc');
    console.log(`✅ Request successful`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Duration order:`);
    
    const durations = result.data.trips.map(t => t.route.estimatedDuration);
    result.data.trips.forEach((trip, idx) => {
      const hours = Math.floor(trip.route.estimatedDuration / 60);
      const minutes = trip.route.estimatedDuration % 60;
      console.log(`   ${idx + 1}. ${trip.tripId}: ${hours}h ${minutes}m (${trip.route.estimatedDuration} min) - ${trip.operator.name}`);
    });
    
    if (verifyAscending(durations, 'duration', 'Durations')) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 6: Sort by Duration - Descending
  try {
    console.log('TEST 6: Sort by Duration (Descending)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=duration&order=desc');
    console.log(`✅ Request successful`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Duration order:`);
    
    const durations = result.data.trips.map(t => t.route.estimatedDuration);
    result.data.trips.forEach((trip, idx) => {
      const hours = Math.floor(trip.route.estimatedDuration / 60);
      const minutes = trip.route.estimatedDuration % 60;
      console.log(`   ${idx + 1}. ${trip.tripId}: ${hours}h ${minutes}m (${trip.route.estimatedDuration} min) - ${trip.operator.name}`);
    });
    
    if (verifyDescending(durations, 'duration', 'Durations')) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 7: Default Sort (no sortBy specified - should default to time)
  try {
    console.log('TEST 7: Default Sort (No sortBy parameter - should default to time)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi');
    console.log(`✅ Request successful`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Default order (should be by time):`);
    
    const times = result.data.trips.map(t => {
      const [h, m] = t.schedule.departureTime.split(':').map(Number);
      return h * 60 + m;
    });
    
    result.data.trips.slice(0, 5).forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.schedule.departureTime}`);
    });
    
    if (verifyAscending(times, 'time', 'Default departure times')) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 8: Sort with Filters - Price ASC with Bus Type
  try {
    console.log('TEST 8: Sort with Filters (Price ASC + Limousine filter)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&busType=limousine&sortBy=price&order=asc');
    console.log(`✅ Request successful`);
    console.log(`   Filtered trips: ${result.data.totalCount}`);
    console.log(`   Sorted limousine trips by price:`);
    
    const prices = result.data.trips.map(t => t.pricing.basePrice);
    result.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.pricing.basePrice.toLocaleString()} VND - ${trip.bus.busType}`);
    });
    
    // Verify all are limousine
    const allLimousine = result.data.trips.every(t => t.bus.busType === 'limousine');
    console.log(`   ✅ All trips are limousine: ${allLimousine}`);
    
    if (verifyAscending(prices, 'price', 'Prices') && allLimousine) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 9: Sort with Pagination
  try {
    console.log('TEST 9: Sort with Pagination (Price ASC, Page 1 vs Page 2)');
    console.log('-'.repeat(80));
    const page1 = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=asc&page=1&limit=3');
    const page2 = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=asc&page=2&limit=3');
    
    console.log(`✅ Request successful`);
    console.log(`   Page 1 trips:`);
    page1.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.pricing.basePrice.toLocaleString()} VND`);
    });
    
    console.log(`   Page 2 trips:`);
    page2.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.pricing.basePrice.toLocaleString()} VND`);
    });
    
    // Verify page 1 last price <= page 2 first price
    const page1LastPrice = page1.data.trips[page1.data.trips.length - 1].pricing.basePrice;
    const page2FirstPrice = page2.data.trips[0].pricing.basePrice;
    const correctOrder = page1LastPrice <= page2FirstPrice;
    
    console.log(`   Last price on page 1: ${page1LastPrice.toLocaleString()} VND`);
    console.log(`   First price on page 2: ${page2FirstPrice.toLocaleString()} VND`);
    console.log(`   ✅ Correct pagination order: ${correctOrder}`);
    
    if (correctOrder) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 10: Sort different routes
  try {
    console.log('TEST 10: Sort Different Route (HCM → Da Nang, Price ASC)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Da%20Nang&sortBy=price&order=asc');
    console.log(`✅ Request successful`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Price order:`);
    
    const prices = result.data.trips.map(t => t.pricing.basePrice);
    result.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.pricing.basePrice.toLocaleString()} VND - ${trip.operator.name}`);
    });
    
    if (verifyAscending(prices, 'price', 'Prices')) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 11: Complex Sort - Duration DESC with multiple filters
  try {
    console.log('TEST 11: Complex Sort (Duration DESC + Morning + Limousine/Sleeper)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&busType=limousine,sleeper&departureTime=morning&sortBy=duration&order=desc');
    console.log(`✅ Request successful`);
    console.log(`   Filtered trips: ${result.data.totalCount}`);
    console.log(`   Duration order (longest first):`);
    
    const durations = result.data.trips.map(t => t.route.estimatedDuration);
    result.data.trips.forEach((trip, idx) => {
      const hours = Math.floor(trip.route.estimatedDuration / 60);
      const minutes = trip.route.estimatedDuration % 60;
      console.log(`   ${idx + 1}. ${trip.tripId}: ${hours}h ${minutes}m - ${trip.bus.busType} - ${trip.schedule.departureTime}`);
    });
    
    if (verifyDescending(durations, 'duration', 'Durations')) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 12: Stability Test - Multiple sorts should give consistent results
  try {
    console.log('TEST 12: Stability Test (Multiple identical requests should return same order)');
    console.log('-'.repeat(80));
    const result1 = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=asc');
    const result2 = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=asc');
    const result3 = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=asc');
    
    const tripIds1 = result1.data.trips.map(t => t.tripId).join(',');
    const tripIds2 = result2.data.trips.map(t => t.tripId).join(',');
    const tripIds3 = result3.data.trips.map(t => t.tripId).join(',');
    
    const consistent = (tripIds1 === tripIds2) && (tripIds2 === tripIds3);
    
    console.log(`   Request 1: ${tripIds1}`);
    console.log(`   Request 2: ${tripIds2}`);
    console.log(`   Request 3: ${tripIds3}`);
    console.log(`   ✅ Results are consistent: ${consistent}`);
    
    if (consistent) {
      testsPassed++;
    } else {
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Summary
  console.log('=' .repeat(80));
  console.log('📊 SORTING TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('\n');

  if (testsFailed === 0) {
    console.log('🎉 All sorting tests passed! Sorting is working perfectly!\n');
    console.log('Summary of verified sorting capabilities:');
    console.log('  ✅ Sort by Price (ascending & descending)');
    console.log('  ✅ Sort by Departure Time (ascending & descending)');
    console.log('  ✅ Sort by Duration (ascending & descending)');
    console.log('  ✅ Default sorting (time ascending)');
    console.log('  ✅ Sorting with filters');
    console.log('  ✅ Sorting with pagination');
    console.log('  ✅ Stable and consistent results');
    console.log('\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the service.\n');
    process.exit(1);
  }
}

// Run tests
console.log('⏳ Connecting to Trip Service...\n');
setTimeout(() => {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}, 1000);
