// Quick test script for Docker backend
const http = require('http');

const tests = [
  {
    name: 'Health Check',
    path: '/health'
  },
  {
    name: 'Basic Trip Search',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20'
  },
  {
    name: 'Trip Search with Filters',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&busType=limousine&busType=sleeper&departureTime=morning&minPrice=400000&maxPrice=600000&amenities=wifi&amenities=ac'
  },
  {
    name: 'Trip Search - Da Nang',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Da%20Nang&date=2024-01-20&page=1&limit=5'
  }
];

function runTest(test, index) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: test.path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test ${index + 1}/${tests.length}: ${test.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`URL: http://localhost:3000${test.path.substring(0, 80)}${test.path.length > 80 ? '...' : ''}`);

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode} ${res.statusCode === 200 ? '✅' : '❌'}`);

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (test.name.includes('Trip Search') && jsonData.data) {
            console.log(`\nResults:`);
            console.log(`  - Trips found: ${jsonData.data.trips?.length || 0}`);
            console.log(`  - Total count: ${jsonData.data.totalCount || 0}`);
            console.log(`  - Page: ${jsonData.data.page}/${jsonData.data.totalPages}`);
            
            if (jsonData.data.filters) {
              const activeFilters = Object.entries(jsonData.data.filters)
                .filter(([k, v]) => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true))
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
              
              if (activeFilters.length > 0) {
                console.log(`\nActive Filters:`);
                activeFilters.forEach(f => console.log(`  - ${f}`));
              }
            }

            if (jsonData.data.trips && jsonData.data.trips.length > 0) {
              console.log(`\nSample Trip:`);
              const trip = jsonData.data.trips[0];
              console.log(`  - ID: ${trip.tripId}`);
              console.log(`  - Operator: ${trip.operator.name} (${trip.operator.rating}⭐)`);
              console.log(`  - Bus Type: ${trip.bus.busType}`);
              console.log(`  - Departure: ${trip.schedule.departureTime}`);
              console.log(`  - Price: ${trip.pricing.basePrice.toLocaleString('vi-VN')} VND`);
              console.log(`  - Amenities: ${trip.bus.amenities.map(a => a.name).join(', ')}`);
              console.log(`  - Available Seats: ${trip.availability.availableSeats}/${trip.availability.totalSeats}`);
            }
          } else if (test.name === 'Health Check') {
            console.log(`\nHealth Status:`);
            console.log(`  - Service: ${jsonData.service}`);
            console.log(`  - Status: ${jsonData.status}`);
            console.log(`  - Version: ${jsonData.version}`);
          }
        } catch (error) {
          console.log(`\n❌ Failed to parse response:`, error.message);
          console.log('Raw response:', data.substring(0, 200));
        }
        
        setTimeout(resolve, 500);
      });
    });

    req.on('error', (error) => {
      console.error(`\n❌ Request failed:`, error.message);
      console.log('Make sure Docker containers are running: docker-compose up');
      setTimeout(resolve, 500);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.error('\n❌ Request timeout (5s)');
      setTimeout(resolve, 500);
    });

    req.end();
  });
}

async function runAllTests() {
  console.log('\n🧪 Testing Backend API (Docker)');
  console.log('━'.repeat(60));
  
  for (let i = 0; i < tests.length; i++) {
    await runTest(tests[i], i);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ All tests completed!');
  console.log(`${'='.repeat(60)}\n`);
}

runAllTests();
