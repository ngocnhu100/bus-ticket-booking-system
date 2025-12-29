// Simple test script for /trips/search endpoint
const http = require('http');

function testTripSearch() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2026-01-15',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\nResponse Body:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
        console.log(`\n✅ Found ${jsonData.data?.trips?.length || 0} trips`);
      } catch (error) {
        console.log(data);
        console.error('Failed to parse JSON:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.end();
}

// Run the test
console.log('🔍 Testing /trips/search endpoint...\n');
testTripSearch();
