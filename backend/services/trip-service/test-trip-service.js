// Test script for Trip Service
const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

async function testTripService() {
  console.log('🧪 Testing Trip Service...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Basic search
    console.log('2️⃣ Testing Basic Search...');
    const basicSearch = await axios.get(`${BASE_URL}/trips/search`, {
      params: {
        origin: 'Ho Chi Minh City',
        destination: 'Hanoi'
      }
    });
    console.log('✅ Basic search passed:');
    console.log(`   Total trips: ${basicSearch.data.data.totalCount}`);
    console.log(`   Page: ${basicSearch.data.data.page}/${basicSearch.data.data.totalPages}`);
    console.log('');

    // Test 3: Search with filters
    console.log('3️⃣ Testing Search with Filters...');
    const filteredSearch = await axios.get(`${BASE_URL}/trips/search`, {
      params: {
        origin: 'Ho Chi Minh City',
        destination: 'Hanoi',
        busType: 'limousine,sleeper',
        departureTime: 'morning,afternoon',
        minPrice: 400000,
        maxPrice: 600000
      }
    });
    console.log('✅ Filtered search passed:');
    console.log(`   Total matching trips: ${filteredSearch.data.data.totalCount}`);
    console.log('');

    // Test 4: Search with sorting (price ascending)
    console.log('4️⃣ Testing Search with Sorting (Price ASC)...');
    const sortedSearchAsc = await axios.get(`${BASE_URL}/trips/search`, {
      params: {
        origin: 'Ho Chi Minh City',
        destination: 'Hanoi',
        sortBy: 'price',
        order: 'asc',
        limit: 5
      }
    });
    console.log('✅ Sorted search (ASC) passed:');
    console.log('   First 3 trip prices:');
    sortedSearchAsc.data.data.trips.slice(0, 3).forEach(trip => {
      console.log(`   - ${trip.operator.name}: ${trip.pricing.basePrice} VND`);
    });
    console.log('');

    // Test 5: Search with sorting (price descending)
    console.log('5️⃣ Testing Search with Sorting (Price DESC)...');
    const sortedSearchDesc = await axios.get(`${BASE_URL}/trips/search`, {
      params: {
        origin: 'Ho Chi Minh City',
        destination: 'Hanoi',
        sortBy: 'price',
        order: 'desc',
        limit: 5
      }
    });
    console.log('✅ Sorted search (DESC) passed:');
    console.log('   First 3 trip prices:');
    sortedSearchDesc.data.data.trips.slice(0, 3).forEach(trip => {
      console.log(`   - ${trip.operator.name}: ${trip.pricing.basePrice} VND`);
    });
    console.log('');

    // Test 6: Search with pagination
    console.log('6️⃣ Testing Search with Pagination...');
    const page1 = await axios.get(`${BASE_URL}/trips/search`, {
      params: {
        origin: 'Ho Chi Minh City',
        destination: 'Hanoi',
        page: 1,
        limit: 3
      }
    });
    const page2 = await axios.get(`${BASE_URL}/trips/search`, {
      params: {
        origin: 'Ho Chi Minh City',
        destination: 'Hanoi',
        page: 2,
        limit: 3
      }
    });
    console.log('✅ Pagination test passed:');
    console.log(`   Page 1: ${page1.data.data.trips.length} trips`);
    console.log(`   Page 2: ${page2.data.data.trips.length} trips`);
    console.log(`   Total pages: ${page1.data.data.totalPages}`);
    console.log('');

    // Test 7: Search with amenities filter
    console.log('7️⃣ Testing Search with Amenities Filter...');
    const amenitiesSearch = await axios.get(`${BASE_URL}/trips/search`, {
      params: {
        origin: 'Ho Chi Minh City',
        destination: 'Hanoi',
        amenities: 'wifi,toilet,entertainment'
      }
    });
    console.log('✅ Amenities search passed:');
    console.log(`   Trips with all requested amenities: ${amenitiesSearch.data.data.totalCount}`);
    console.log('');

    // Test 8: Get trip by ID
    console.log('8️⃣ Testing Get Trip by ID...');
    const tripById = await axios.get(`${BASE_URL}/trips/TRIP001`);
    console.log('✅ Get trip by ID passed:');
    console.log(`   Trip: ${tripById.data.data.route.origin} → ${tripById.data.data.route.destination}`);
    console.log(`   Operator: ${tripById.data.data.operator.name}`);
    console.log(`   Price: ${tripById.data.data.pricing.basePrice} VND`);
    console.log('');

    console.log('🎉 All tests passed successfully!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

testTripService();
