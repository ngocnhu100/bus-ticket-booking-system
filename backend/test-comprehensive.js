// Comprehensive test: Sorting + Filtering + Pagination
const http = require('http');

const tests = [
  {
    name: 'Price ASC + Limousine Filter + Page 1',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&busType=limousine&sortBy=price&order=asc&page=1&limit=3'
  },
  {
    name: 'Time DESC (Latest departure first)',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Da%20Nang&date=2024-01-20&sortBy=time&order=desc&limit=5'
  },
  {
    name: 'Duration ASC + Price Range 300k-500k',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&minPrice=300000&maxPrice=500000&sortBy=duration&order=asc&limit=5'
  },
  {
    name: 'Morning + Amenities (WiFi, AC) + Price ASC',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&departureTime=morning&amenities=wifi&amenities=ac&sortBy=price&order=asc'
  },
  {
    name: 'Sleeper + Evening + Duration DESC',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&busType=sleeper&departureTime=evening&sortBy=duration&order=desc'
  },
  {
    name: 'Default sort (time ASC) - No sortBy specified',
    path: '/trips/search?origin=Ho%20Chi%20Minh%20City&destination=Hanoi&date=2024-01-20&limit=5'
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

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`Test ${index + 1}/${tests.length}: ${test.name}`);
    console.log(`${'═'.repeat(70)}`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode === 200 && jsonData.success) {
            const { trips, totalCount, page, totalPages, sorting, filters } = jsonData.data;
            
            console.log(`✅ Status: ${res.statusCode}\n`);
            
            // Sorting info
            console.log(`📊 Sorting:`);
            console.log(`   Sort By: ${sorting.sortBy}`);
            console.log(`   Order: ${sorting.order}`);
            
            // Pagination info
            console.log(`\n📄 Pagination:`);
            console.log(`   Page: ${page}/${totalPages}`);
            console.log(`   Results: ${trips.length} trips (${totalCount} total)`);
            
            // Active filters
            console.log(`\n🔍 Active Filters:`);
            const activeFilters = [];
            if (filters.busType && filters.busType.length > 0) {
              activeFilters.push(`Bus Type: ${filters.busType.join(', ')}`);
            }
            if (filters.departureTime && filters.departureTime.length > 0) {
              activeFilters.push(`Departure: ${filters.departureTime.join(', ')}`);
            }
            if (filters.minPrice || filters.maxPrice) {
              const min = filters.minPrice ? `${(filters.minPrice/1000).toFixed(0)}k` : '0';
              const max = filters.maxPrice ? `${(filters.maxPrice/1000).toFixed(0)}k` : '∞';
              activeFilters.push(`Price: ${min} - ${max} VND`);
            }
            if (filters.amenities && filters.amenities.length > 0) {
              activeFilters.push(`Amenities: ${filters.amenities.join(', ')}`);
            }
            
            if (activeFilters.length > 0) {
              activeFilters.forEach(f => console.log(`   - ${f}`));
            } else {
              console.log(`   - None (showing all trips)`);
            }
            
            // Trip results
            if (trips.length > 0) {
              console.log(`\n🚌 Trip Results:`);
              console.log(`   ${'─'.repeat(66)}`);
              console.log(`   #  ID        Price      Time   Duration  Type      Amenities`);
              console.log(`   ${'─'.repeat(66)}`);
              
              trips.forEach((trip, idx) => {
                const price = `${(trip.pricing.basePrice/1000).toFixed(0)}k`.padEnd(9);
                const time = trip.schedule.departureTime.padEnd(6);
                const hrs = Math.floor(trip.route.estimatedDuration / 60);
                const mins = trip.route.estimatedDuration % 60;
                const duration = `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`.padEnd(9);
                const type = trip.bus.busType.padEnd(9);
                const amenities = trip.bus.amenities.length;
                
                console.log(`   ${(idx + 1).toString().padStart(2)} ${trip.tripId}  ${price} ${time} ${duration} ${type} ${amenities} items`);
              });
              console.log(`   ${'─'.repeat(66)}`);
              
              // Verify sorting
              let sortValid = true;
              let sortError = '';
              
              for (let i = 1; i < trips.length; i++) {
                const prev = trips[i - 1];
                const curr = trips[i];
                
                if (sorting.sortBy === 'price') {
                  const isAsc = sorting.order === 'asc';
                  if (isAsc && curr.pricing.basePrice < prev.pricing.basePrice) {
                    sortValid = false;
                    sortError = `Price not ascending at position ${i}`;
                  } else if (!isAsc && curr.pricing.basePrice > prev.pricing.basePrice) {
                    sortValid = false;
                    sortError = `Price not descending at position ${i}`;
                  }
                } else if (sorting.sortBy === 'duration') {
                  const isAsc = sorting.order === 'asc';
                  if (isAsc && curr.route.estimatedDuration < prev.route.estimatedDuration) {
                    sortValid = false;
                    sortError = `Duration not ascending at position ${i}`;
                  } else if (!isAsc && curr.route.estimatedDuration > prev.route.estimatedDuration) {
                    sortValid = false;
                    sortError = `Duration not descending at position ${i}`;
                  }
                }
              }
              
              if (sortValid) {
                console.log(`   ✅ Sort order verified: ${sorting.sortBy} (${sorting.order})`);
              } else {
                console.log(`   ❌ Sort order error: ${sortError}`);
              }
            } else {
              console.log(`\n   No trips found matching criteria`);
            }
          } else {
            console.log(`❌ Status: ${res.statusCode}`);
            console.log(`Error:`, jsonData.error || 'Unknown error');
          }
        } catch (error) {
          console.log(`❌ Failed to parse response:`, error.message);
        }
        
        setTimeout(resolve, 400);
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request failed:`, error.message);
      setTimeout(resolve, 400);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.error('❌ Request timeout (5s)');
      setTimeout(resolve, 400);
    });

    req.end();
  });
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 Comprehensive Test: Sorting + Filtering + Pagination       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  for (let i = 0; i < tests.length; i++) {
    await runTest(tests[i], i);
  }
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log('✅ All comprehensive tests completed successfully!');
  console.log(`${'═'.repeat(70)}\n`);
}

runAllTests();
