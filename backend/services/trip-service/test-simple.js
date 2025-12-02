// Simple test using native http module
const http = require('http');

function testEndpoint(url, description) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response:`, JSON.stringify(json, null, 2).substring(0, 200) + '...');
          console.log('');
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Testing Trip Service...\n');

  try {
    // Test 1: Health check
    await testEndpoint('http://localhost:3003/health', 'Health Check');

    // Test 2: Basic search
    await testEndpoint(
      'http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi',
      'Basic Search'
    );

    // Test 3: Search with filters
    await testEndpoint(
      'http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&busType=limousine&sortBy=price&order=asc',
      'Filtered Search with Sorting'
    );

    // Test 4: Pagination
    await testEndpoint(
      'http://localhost:3003/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&page=1&limit=5',
      'Paginated Search'
    );

    // Test 5: Get by ID
    await testEndpoint(
      'http://localhost:3003/trips/TRIP001',
      'Get Trip by ID'
    );

    console.log('🎉 All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
