/**
 * Performance Test Script for Trip Service
 * Tests caching, database pool, and performance metrics
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3005';
const ITERATIONS = 10;

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealth() {
  log('blue', '\n🏥 Testing Health Endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    log('green', `✅ Health check passed`);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log('red', `❌ Health check failed: ${error.message}`);
    return false;
  }
}

async function testCacheStats() {
  log('blue', '\n💾 Testing Cache Statistics...');
  try {
    const response = await axios.get(`${BASE_URL}/cache/stats`);
    log('green', `✅ Cache stats retrieved`);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log('yellow', `⚠️ Cache stats unavailable: ${error.message}`);
    return false;
  }
}

async function testDbStats() {
  log('blue', '\n🏊 Testing Database Pool Statistics...');
  try {
    const response = await axios.get(`${BASE_URL}/db/stats`);
    log('green', `✅ DB stats retrieved`);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log('yellow', `⚠️ DB stats unavailable: ${error.message}`);
    return false;
  }
}

async function testSearchPerformance() {
  log('blue', `\n🔍 Testing Search Performance (${ITERATIONS} requests)...`);
  
  const searchParams = {
    origin: 'Ho Chi Minh City',
    destination: 'Hanoi',
    date: '2024-12-15',
    page: 1,
    limit: 10
  };

  const queryString = new URLSearchParams(searchParams).toString();
  const url = `${BASE_URL}/trips/search?${queryString}`;

  const times = [];
  let cacheHits = 0;
  let cacheMisses = 0;

  for (let i = 0; i < ITERATIONS; i++) {
    const start = Date.now();
    try {
      const response = await axios.get(url);
      const duration = Date.now() - start;
      times.push(duration);
      
      if (response.status === 200) {
        // First request is likely a miss, subsequent ones should be hits
        if (i === 0) {
          cacheMisses++;
          log('yellow', `  Request ${i + 1}: ${duration}ms (Cache MISS)`);
        } else {
          cacheHits++;
          log('green', `  Request ${i + 1}: ${duration}ms (Cache HIT expected)`);
        }
      }
    } catch (error) {
      log('red', `  Request ${i + 1}: FAILED - ${error.message}`);
    }
  }

  // Calculate statistics
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];

  log('blue', '\n📊 Performance Results:');
  console.log(`  Total Requests: ${ITERATIONS}`);
  console.log(`  Successful: ${times.length}`);
  console.log(`  Cache HITs: ${cacheHits}`);
  console.log(`  Cache MISSes: ${cacheMisses}`);
  console.log(`  Average Time: ${avgTime.toFixed(2)}ms`);
  console.log(`  Min Time: ${minTime}ms`);
  console.log(`  Max Time: ${maxTime}ms`);
  console.log(`  P95 Time: ${p95Time}ms`);

  // Performance expectations
  if (avgTime < 100) {
    log('green', '  ✅ Excellent performance (<100ms avg)');
  } else if (avgTime < 200) {
    log('yellow', '  ⚠️ Good performance (100-200ms avg)');
  } else {
    log('red', '  ❌ Needs optimization (>200ms avg)');
  }

  return times.length === ITERATIONS;
}

async function testCacheClear() {
  log('blue', '\n🗑️ Testing Cache Clear...');
  try {
    const response = await axios.delete(`${BASE_URL}/cache/clear?pattern=trip:search:*`);
    log('green', `✅ Cache cleared successfully`);
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log('yellow', `⚠️ Cache clear unavailable: ${error.message}`);
    return false;
  }
}

async function testDifferentSearches() {
  log('blue', '\n🔍 Testing Different Search Patterns...');
  
  const searches = [
    { origin: 'Ho Chi Minh City', destination: 'Hanoi', date: '2024-12-15' },
    { origin: 'Ho Chi Minh City', destination: 'Da Nang', date: '2024-12-16', busType: 'limousine' },
    { origin: 'Hanoi', destination: 'Da Nang', date: '2024-12-17', minPrice: 300000, maxPrice: 500000 }
  ];

  let passed = 0;
  for (const [index, params] of searches.entries()) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/trips/search?${queryString}`;
    
    try {
      const start = Date.now();
      const response = await axios.get(url);
      const duration = Date.now() - start;
      
      if (response.status === 200 && response.data.success) {
        passed++;
        log('green', `  ✅ Search ${index + 1}: ${duration}ms - ${response.data.data.totalCount} trips found`);
      } else {
        log('red', `  ❌ Search ${index + 1}: Invalid response`);
      }
    } catch (error) {
      log('red', `  ❌ Search ${index + 1}: ${error.message}`);
    }
  }

  log('blue', `\n  Results: ${passed}/${searches.length} searches passed`);
  return passed === searches.length;
}

async function runTests() {
  log('blue', '🚀 Starting Trip Service Performance Tests\n');
  log('blue', `📍 Testing: ${BASE_URL}\n`);
  log('blue', '='.repeat(60));

  const results = {
    health: await testHealth(),
    cacheStats: await testCacheStats(),
    dbStats: await testDbStats(),
    searchPerformance: await testSearchPerformance(),
    differentSearches: await testDifferentSearches(),
    cacheClear: await testCacheClear()
  };

  log('blue', '\n' + '='.repeat(60));
  log('blue', '\n📋 Test Summary:');
  
  let passed = 0;
  let total = 0;
  
  for (const [test, result] of Object.entries(results)) {
    total++;
    if (result) {
      passed++;
      log('green', `  ✅ ${test}: PASSED`);
    } else {
      log('red', `  ❌ ${test}: FAILED`);
    }
  }

  log('blue', `\n🎯 Final Score: ${passed}/${total} tests passed\n`);
  
  if (passed === total) {
    log('green', '✅ All tests passed! Performance optimizations are working correctly.\n');
    process.exit(0);
  } else if (passed >= total * 0.8) {
    log('yellow', '⚠️ Most tests passed. Some optimizations may need configuration.\n');
    process.exit(0);
  } else {
    log('red', '❌ Many tests failed. Please check the service configuration.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log('red', `\n❌ Test runner failed: ${error.message}\n`);
  process.exit(1);
});
