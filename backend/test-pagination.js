// Test Pagination functionality
const http = require('http');

const tests = [
  {
    name: 'HCM → Hanoi - Page 1 (5 trips)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&page=1&limit=5',
    expectedTrips: 5,
    expectedPage: 1
  },
  {
    name: 'HCM → Hanoi - Page 2 (4 trips)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&page=2&limit=5',
    expectedTrips: 4,
    expectedPage: 2
  },
  {
    name: 'HCM → Da Nang - Page 1 (5 trips)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Da%20Nang&date=2024-01-20&page=1&limit=5',
    expectedTrips: 5,
    expectedPage: 1
  },
  {
    name: 'HCM → Da Nang - Page 2 (3 trips)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Da%20Nang&date=2024-01-20&page=2&limit=5',
    expectedTrips: 3,
    expectedPage: 2
  },
  {
    name: 'With Filters - Limousine Morning (Page 1)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&busType=limousine&departureTime=morning&page=1&limit=5',
    expectedPage: 1
  },
  {
    name: 'Limit 3 - Page 1',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&page=1&limit=3',
    expectedTrips: 3,
    expectedPage: 1,
    expectedTotalPages: 3
  },
  {
    name: 'Limit 3 - Page 3',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&page=3&limit=3',
    expectedTrips: 3,
    expectedPage: 3,
    expectedTotalPages: 3
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

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Test ${index + 1}/${tests.length}: ${test.name}`);
    console.log(`${'─'.repeat(70)}`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode === 200 && jsonData.success) {
            const { trips, totalCount, page, limit, totalPages } = jsonData.data;
            
            console.log(`✅ Status: ${res.statusCode}`);
            console.log(`\nPagination Info:`);
            console.log(`  Current Page: ${page}`);
            console.log(`  Total Pages: ${totalPages}`);
            console.log(`  Limit: ${limit}`);
            console.log(`  Total Count: ${totalCount}`);
            console.log(`  Trips Returned: ${trips.length}`);
            
            // Validation
            let allPassed = true;
            
            if (test.expectedPage && page !== test.expectedPage) {
              console.log(`  ❌ Expected page ${test.expectedPage}, got ${page}`);
              allPassed = false;
            } else if (test.expectedPage) {
              console.log(`  ✅ Page number correct`);
            }
            
            if (test.expectedTrips && trips.length !== test.expectedTrips) {
              console.log(`  ❌ Expected ${test.expectedTrips} trips, got ${trips.length}`);
              allPassed = false;
            } else if (test.expectedTrips) {
              console.log(`  ✅ Trip count correct`);
            }
            
            if (test.expectedTotalPages && totalPages !== test.expectedTotalPages) {
              console.log(`  ❌ Expected ${test.expectedTotalPages} total pages, got ${totalPages}`);
              allPassed = false;
            } else if (test.expectedTotalPages) {
              console.log(`  ✅ Total pages correct`);
            }
            
            // Show trip IDs
            if (trips.length > 0) {
              console.log(`\nTrip IDs: ${trips.map(t => t.tripId).join(', ')}`);
            }
            
            if (allPassed) {
              console.log(`\n✅ All validations passed`);
            }
          } else {
            console.log(`❌ Status: ${res.statusCode}`);
            console.log(`Error:`, jsonData.error || 'Unknown error');
          }
        } catch (error) {
          console.log(`❌ Failed to parse response:`, error.message);
        }
        
        setTimeout(resolve, 300);
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request failed:`, error.message);
      setTimeout(resolve, 300);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.error('❌ Request timeout (5s)');
      setTimeout(resolve, 300);
    });

    req.end();
  });
}

async function runAllTests() {
  console.log('\n🧪 Testing Pagination Functionality');
  console.log('═'.repeat(70));
  
  for (let i = 0; i < tests.length; i++) {
    await runTest(tests[i], i);
  }
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log('🎉 Pagination tests completed!');
  console.log(`${'═'.repeat(70)}\n`);
}

runAllTests();
