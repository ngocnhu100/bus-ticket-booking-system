// Test Sorting functionality
const http = require('http');

const tests = [
  {
    name: 'Sort by Price - Ascending (cheapest first)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&sortBy=price&order=asc&limit=5',
    checkSort: (trips) => {
      for (let i = 1; i < trips.length; i++) {
        if (trips[i].pricing.basePrice < trips[i-1].pricing.basePrice) {
          return `Price not ascending: ${trips[i-1].pricing.basePrice} > ${trips[i].pricing.basePrice}`;
        }
      }
      return null;
    }
  },
  {
    name: 'Sort by Price - Descending (most expensive first)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&sortBy=price&order=desc&limit=5',
    checkSort: (trips) => {
      for (let i = 1; i < trips.length; i++) {
        if (trips[i].pricing.basePrice > trips[i-1].pricing.basePrice) {
          return `Price not descending: ${trips[i-1].pricing.basePrice} < ${trips[i].pricing.basePrice}`;
        }
      }
      return null;
    }
  },
  {
    name: 'Sort by Departure Time - Ascending (earliest first)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&sortBy=time&order=asc&limit=5',
    checkSort: (trips) => {
      for (let i = 1; i < trips.length; i++) {
        const timeA = trips[i-1].schedule.departureTime.split(':').map(Number);
        const timeB = trips[i].schedule.departureTime.split(':').map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        if (minutesB < minutesA) {
          return `Time not ascending: ${trips[i-1].schedule.departureTime} > ${trips[i].schedule.departureTime}`;
        }
      }
      return null;
    }
  },
  {
    name: 'Sort by Departure Time - Descending (latest first)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&sortBy=time&order=desc&limit=5',
    checkSort: (trips) => {
      for (let i = 1; i < trips.length; i++) {
        const timeA = trips[i-1].schedule.departureTime.split(':').map(Number);
        const timeB = trips[i].schedule.departureTime.split(':').map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        if (minutesB > minutesA) {
          return `Time not descending: ${trips[i-1].schedule.departureTime} < ${trips[i].schedule.departureTime}`;
        }
      }
      return null;
    }
  },
  {
    name: 'Sort by Duration - Ascending (shortest first)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&sortBy=duration&order=asc&limit=5',
    checkSort: (trips) => {
      for (let i = 1; i < trips.length; i++) {
        if (trips[i].route.estimatedDuration < trips[i-1].route.estimatedDuration) {
          return `Duration not ascending: ${trips[i-1].route.estimatedDuration} > ${trips[i].route.estimatedDuration}`;
        }
      }
      return null;
    }
  },
  {
    name: 'Sort by Duration - Descending (longest first)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&sortBy=duration&order=desc&limit=5',
    checkSort: (trips) => {
      for (let i = 1; i < trips.length; i++) {
        if (trips[i].route.estimatedDuration > trips[i-1].route.estimatedDuration) {
          return `Duration not descending: ${trips[i-1].route.estimatedDuration} < ${trips[i].route.estimatedDuration}`;
        }
      }
      return null;
    }
  },
  {
    name: 'Sort with Filters (Limousine, Morning, Price Asc)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&busType=limousine&departureTime=morning&sortBy=price&order=asc',
    checkSort: (trips) => {
      // Check all are limousine
      for (const trip of trips) {
        if (trip.bus.busType !== 'limousine') {
          return `Not all trips are limousine: ${trip.tripId} is ${trip.bus.busType}`;
        }
      }
      // Check price order
      for (let i = 1; i < trips.length; i++) {
        if (trips[i].pricing.basePrice < trips[i-1].pricing.basePrice) {
          return `Price not ascending: ${trips[i-1].pricing.basePrice} > ${trips[i].pricing.basePrice}`;
        }
      }
      return null;
    }
  },
  {
    name: 'Invalid sortBy parameter',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&sortBy=invalid',
    expectError: true,
    expectedStatus: 400
  },
  {
    name: 'Invalid order parameter',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&sortBy=price&order=invalid',
    expectError: true,
    expectedStatus: 400
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
          
          if (test.expectError) {
            if (res.statusCode === test.expectedStatus && !jsonData.success) {
              console.log(`✅ Status: ${res.statusCode} (expected error)`);
              console.log(`✅ Error message: ${jsonData.error.message}`);
              console.log(`\n✅ Validation working correctly`);
            } else {
              console.log(`❌ Expected status ${test.expectedStatus}, got ${res.statusCode}`);
            }
          } else if (res.statusCode === 200 && jsonData.success) {
            const { trips, totalCount, sorting } = jsonData.data;
            
            console.log(`✅ Status: ${res.statusCode}`);
            console.log(`\nSorting Info:`);
            console.log(`  Sort By: ${sorting.sortBy}`);
            console.log(`  Order: ${sorting.order}`);
            console.log(`  Trips Returned: ${trips.length}/${totalCount}`);
            
            if (trips.length > 0) {
              console.log(`\nTrip Details:`);
              trips.forEach((trip, idx) => {
                const price = trip.pricing.basePrice.toLocaleString('vi-VN');
                const time = trip.schedule.departureTime;
                const duration = `${Math.floor(trip.route.estimatedDuration / 60)}h ${trip.route.estimatedDuration % 60}m`;
                console.log(`  ${idx + 1}. ${trip.tripId}: ${price} VND | ${time} | ${duration} | ${trip.bus.busType}`);
              });
            }
            
            // Validate sorting
            if (test.checkSort) {
              const sortError = test.checkSort(trips);
              if (sortError) {
                console.log(`\n❌ Sort validation failed: ${sortError}`);
              } else {
                console.log(`\n✅ Sort order is correct`);
              }
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
  console.log('\n🧪 Testing Sorting Functionality');
  console.log('═'.repeat(70));
  
  for (let i = 0; i < tests.length; i++) {
    await runTest(tests[i], i);
  }
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log('🎉 Sorting tests completed!');
  console.log(`${'═'.repeat(70)}\n`);
}

runAllTests();
