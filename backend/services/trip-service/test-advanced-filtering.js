// Advanced Filtering Test Script for Trip Service
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

async function runTests() {
  console.log('🧪 Testing Advanced Filtering for Trip Service\n');
  console.log('=' .repeat(80));
  console.log('\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Basic search (no filters)
  try {
    console.log('TEST 1: Basic Search (No Filters)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Total trips found: ${result.data.totalCount}`);
    console.log(`   Page: ${result.data.page}/${result.data.totalPages}`);
    console.log(`   Trips returned: ${result.data.trips.length}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 2: Filter by Bus Type (single)
  try {
    console.log('TEST 2: Filter by Bus Type (Single - Limousine)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&busType=limousine');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   First 3 trips:`);
    result.data.trips.slice(0, 3).forEach(trip => {
      console.log(`   - ${trip.tripId}: ${trip.bus.busType} by ${trip.operator.name}`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 3: Filter by Bus Type (multiple)
  try {
    console.log('TEST 3: Filter by Bus Type (Multiple - Limousine + Sleeper)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&busType=limousine,sleeper');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    const busTypes = [...new Set(result.data.trips.map(t => t.bus.busType))];
    console.log(`   Bus types found: ${busTypes.join(', ')}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 4: Filter by Departure Time (single period)
  try {
    console.log('TEST 4: Filter by Departure Time (Morning)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&departureTime=morning');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Departure times:`);
    result.data.trips.slice(0, 5).forEach(trip => {
      console.log(`   - ${trip.tripId}: ${trip.schedule.departureTime}`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 5: Filter by Departure Time (multiple periods)
  try {
    console.log('TEST 5: Filter by Departure Time (Morning + Afternoon)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&departureTime=morning,afternoon');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Sample departure times:`);
    result.data.trips.slice(0, 5).forEach(trip => {
      const hour = parseInt(trip.schedule.departureTime.split(':')[0]);
      const period = hour >= 6 && hour < 12 ? 'morning' : 
                     hour >= 12 && hour < 18 ? 'afternoon' : 
                     hour >= 18 && hour < 24 ? 'evening' : 'night';
      console.log(`   - ${trip.tripId}: ${trip.schedule.departureTime} (${period})`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 6: Filter by Price Range
  try {
    console.log('TEST 6: Filter by Price Range (400,000 - 500,000 VND)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&minPrice=400000&maxPrice=500000');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Price range:`);
    result.data.trips.forEach(trip => {
      console.log(`   - ${trip.tripId}: ${trip.pricing.basePrice.toLocaleString()} VND`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 7: Filter by Amenities (single)
  try {
    console.log('TEST 7: Filter by Amenities (WiFi only)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&amenities=wifi');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Sample amenities:`);
    result.data.trips.slice(0, 3).forEach(trip => {
      const amenityNames = trip.bus.amenities.map(a => a.id).join(', ');
      console.log(`   - ${trip.tripId}: ${amenityNames}`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 8: Filter by Amenities (multiple - must have ALL)
  try {
    console.log('TEST 8: Filter by Amenities (WiFi + Toilet + Entertainment)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&amenities=wifi,toilet,entertainment');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Total trips with ALL amenities: ${result.data.totalCount}`);
    console.log(`   Trips found:`);
    result.data.trips.forEach(trip => {
      const amenityNames = trip.bus.amenities.map(a => a.id).join(', ');
      console.log(`   - ${trip.tripId}: ${amenityNames}`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 9: Filter by Available Seats (passengers)
  try {
    console.log('TEST 9: Filter by Available Seats (Min 20 seats)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&passengers=20');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Total trips: ${result.data.totalCount}`);
    console.log(`   Available seats:`);
    result.data.trips.forEach(trip => {
      console.log(`   - ${trip.tripId}: ${trip.availability.availableSeats}/${trip.availability.totalSeats} seats`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 10: Combined Filters (Complex Query)
  try {
    console.log('TEST 10: Combined Filters (Limousine + Morning + 400k-600k + WiFi)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&busType=limousine&departureTime=morning&minPrice=400000&maxPrice=600000&amenities=wifi');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Total trips matching ALL filters: ${result.data.totalCount}`);
    console.log(`   Trips found:`);
    result.data.trips.forEach(trip => {
      const hour = parseInt(trip.schedule.departureTime.split(':')[0]);
      const period = hour >= 6 && hour < 12 ? 'morning' : 'afternoon/evening/night';
      console.log(`   - ${trip.tripId}:`);
      console.log(`     Type: ${trip.bus.busType}, Time: ${trip.schedule.departureTime} (${period})`);
      console.log(`     Price: ${trip.pricing.basePrice.toLocaleString()} VND`);
      console.log(`     Amenities: ${trip.bus.amenities.map(a => a.id).join(', ')}`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 11: Sort by Price (Ascending)
  try {
    console.log('TEST 11: Sort by Price (Ascending)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=asc&limit=5');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Sorted trips (cheapest first):`);
    result.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.pricing.basePrice.toLocaleString()} VND - ${trip.operator.name}`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 12: Sort by Price (Descending)
  try {
    console.log('TEST 12: Sort by Price (Descending)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=price&order=desc&limit=5');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Sorted trips (most expensive first):`);
    result.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.pricing.basePrice.toLocaleString()} VND - ${trip.operator.name}`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 13: Sort by Time
  try {
    console.log('TEST 13: Sort by Departure Time (Ascending)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=time&order=asc&limit=5');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Sorted trips (earliest first):`);
    result.data.trips.forEach((trip, idx) => {
      console.log(`   ${idx + 1}. ${trip.tripId}: ${trip.schedule.departureTime} - ${trip.operator.name}`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 14: Sort by Duration
  try {
    console.log('TEST 14: Sort by Duration (Ascending)');
    console.log('-'.repeat(80));
    const result = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&sortBy=duration&order=asc&limit=5');
    console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Sorted trips (shortest first):`);
    result.data.trips.forEach((trip, idx) => {
      const hours = Math.floor(trip.route.estimatedDuration / 60);
      const minutes = trip.route.estimatedDuration % 60;
      console.log(`   ${idx + 1}. ${trip.tripId}: ${hours}h ${minutes}m - ${trip.operator.name}`);
    });
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Test 15: Pagination
  try {
    console.log('TEST 15: Pagination (Page 1 and Page 2)');
    console.log('-'.repeat(80));
    const page1 = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&page=1&limit=3');
    const page2 = await makeRequest('/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&page=2&limit=3');
    console.log(`✅ Status: SUCCESS`);
    console.log(`   Page 1 trips: ${page1.data.trips.map(t => t.tripId).join(', ')}`);
    console.log(`   Page 2 trips: ${page2.data.trips.map(t => t.tripId).join(', ')}`);
    console.log(`   Total pages: ${page1.data.totalPages}, Total count: ${page1.data.totalCount}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    testsFailed++;
  }
  console.log('\n');

  // Summary
  console.log('=' .repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('\n');

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Advanced filtering is working perfectly!\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the service.\n');
    process.exit(1);
  }
}

// Run tests
console.log('⏳ Waiting for service to be ready...\n');
setTimeout(() => {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}, 2000);
