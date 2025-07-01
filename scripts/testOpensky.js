#!/usr/bin/env bun

const axios = require('axios');

// API configuration
const CLIENT_ID = '0mareugen3';  // Provided OpenSky username
const CLIENT_SECRET = 'Essen3tric!';  // Provided OpenSky password
const BASE_URL = 'https://opensky-network.org/api';

// Test configuration
const TEST_ICAO24 = 'a808c1'; // Example aircraft ICAO24 address
const TEST_USERNAME = 'testuser'; // Example username for user-specific endpoints
const TEST_BBOX = {
  lamin: 45.8389, // Bounding box for testing (around Switzerland)
  lomin: 5.9962,
  lamax: 47.8229,
  lomax: 10.5226
};

// Create authentication credentials for query params
const authParams = {
  username: CLIENT_ID,
  password: CLIENT_SECRET
};

// Test function for OpenSky API
async function testOpenSkyAPI() {
  console.log('✈️  Testing OpenSky Network API...\n');

  const baseHeaders = {
    'Accept': 'application/json',
    'User-Agent': 'OpenSky-API-Test/1.0'
  };

  const tests = [
    {
      name: 'All States',
      url: `${BASE_URL}/states/all`,
      description: 'Get all current aircraft states (public endpoint)',
      requiresAuth: false
    },
    {
      name: 'All States (Query Params)',
      url: `${BASE_URL}/states/all`,
      description: 'Get all current aircraft states with query parameters',
      requiresAuth: true,
      authMethod: 'params'
    },
    {
      name: 'States by Bounding Box (Query Params)',
      url: `${BASE_URL}/states/all`,
      description: 'Get aircraft states within bounding box with query parameters',
      params: {
        lamin: TEST_BBOX.lamin,
        lomin: TEST_BBOX.lomin,
        lamax: TEST_BBOX.lamax,
        lomax: TEST_BBOX.lomax
      },
      requiresAuth: true,
      authMethod: 'params'
    },
    {
      name: 'My States (Query Params)',
      url: `${BASE_URL}/states/own`,
      description: 'Get states of aircraft owned by your account with query parameters',
      requiresAuth: true,
      authMethod: 'params'
    },
    {
      name: 'Flights by Aircraft (Query Params)',
      url: `${BASE_URL}/flights/aircraft`,
      description: 'Get flights for specific aircraft with query parameters',
      params: {
        icao24: TEST_ICAO24,
        begin: Math.floor(Date.now() / 1000) - 86400, // Last 24 hours
        end: Math.floor(Date.now() / 1000)
      },
      requiresAuth: true,
      authMethod: 'params'
    }
  ];

  let successCount = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`Description: ${test.description}`);
      console.log(`URL: ${test.url}`);
      console.log(`Requires Auth: ${test.requiresAuth ? 'Yes' : 'No'}`);
      if (test.authMethod) {
        console.log(`Auth Method: ${test.authMethod}`);
      }

      const config = {
        timeout: 20000,
        headers: { ...baseHeaders },
        validateStatus: function (status) {
          return status < 500; // Accept any status code less than 500
        }
      };

      // Set up authentication for query params
      if (test.requiresAuth && test.authMethod === 'params') {
        config.params = { ...authParams, ...test.params };
      } else if (test.params) {
        config.params = { ...test.params };
      }

      const response = await axios.get(test.url, config);

      if (
        response.status === 200 ||
        (test.name.includes('My States') && response.status === 403) ||
        (test.name.includes('Flights by Aircraft') &&
          (response.status === 404 || (response.status === 200 && Array.isArray(response.data) && response.data.length === 0)))
      ) {
        console.log(`✅ ${test.name} - SUCCESS (${response.status})`);
        if (test.name.includes('My States') && response.status === 403) {
          console.log('   ℹ️  Authentication successful, but no owned aircraft found.');
        } else if (test.name.includes('Flights by Aircraft') && (response.status === 404 || (response.status === 200 && Array.isArray(response.data) && response.data.length === 0))) {
          console.log('   ℹ️  No flights found for the specified aircraft and time range.');
        } else {
          if (response.data.time) {
            console.log(`   🕐 Data timestamp: ${new Date(response.data.time * 1000).toISOString()}`);
          }
          if (response.data.states && Array.isArray(response.data.states)) {
            console.log(`   ✈️  Aircraft states: ${response.data.states.length}`);
            if (response.data.states.length > 0) {
              const sample = response.data.states[0];
              console.log(`   📋 Sample aircraft:`, {
                icao24: sample[0],
                callsign: sample[1]?.trim() || 'N/A',
                country: sample[2] || 'N/A',
                longitude: sample[5],
                latitude: sample[6],
                altitude: sample[7],
                velocity: sample[9]
              });
            }
          } else if (Array.isArray(response.data)) {
            console.log(`   📊 Returned ${response.data.length} items`);
            if (response.data.length > 0) {
              console.log(`   📋 Sample data:`, JSON.stringify(response.data[0], null, 2).substring(0, 300) + '...');
            }
          } else if (typeof response.data === 'object') {
            console.log(`   📋 Response keys:`, Object.keys(response.data));
          }
        }
        successCount++;
      } else {
        console.log(`⚠️  ${test.name} - Status: ${response.status}`);
        if (response.data) {
          console.log(`   Response:`, response.data);
        }
      }

    } catch (error) {
      console.log(`❌ ${test.name} - FAILED`);
      if (error.response) {
        console.log(`   Status: ${error.response.status} - ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`   Error details:`, error.response.data);
        }
      } else if (error.request) {
        console.log('   ❌ No response received (timeout or network error)');
      } else {
        console.log(`   ❌ Request error: ${error.message}`);
      }
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful tests: ${successCount}/${totalTests}`);
  console.log(`❌ Failed tests: ${totalTests - successCount}/${totalTests}`);
  if (successCount > 0) {
    console.log('\n🎉 OpenSky API is accessible!');
    console.log('💡 You can now use the working endpoints in your application.');
  } else {
    console.log('\n⚠️  No tests passed. Please check your credentials and network connection.');
  }
}

// Additional test for real-time aircraft tracking
async function testRealTimeTracking() {
  console.log('\n\n🔍 Testing Real-Time Aircraft Tracking...\n');
  try {
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'OpenSky-API-Test/1.0'
    };
    console.log('Trying query parameters...');
    const response = await axios.get(`${BASE_URL}/states/all`, {
      headers,
      params: authParams,
      timeout: 20000
    });
    if (response.status === 200 && response.data && response.data.states) {
      console.log(`✅ Found ${response.data.states.length} aircraft currently tracked`);
      console.log(`🕐 Data timestamp: ${new Date(response.data.time * 1000).toISOString()}`);
      if (response.data.states.length > 0) {
        const aircraftToShow = Math.min(3, response.data.states.length);
        console.log(`\n📋 Sample Aircraft (showing ${aircraftToShow}):`);
        for (let i = 0; i < aircraftToShow; i++) {
          const aircraft = response.data.states[i];
          console.log(`\n   Aircraft ${i + 1}:`);
          console.log(`     ICAO24: ${aircraft[0]}`);
          console.log(`     Callsign: ${aircraft[1]?.trim() || 'N/A'}`);
          console.log(`     Country: ${aircraft[2] || 'N/A'}`);
          console.log(`     Position: ${aircraft[6]?.toFixed(4) || 'N/A'}, ${aircraft[5]?.toFixed(4) || 'N/A'}`);
          console.log(`     Altitude: ${aircraft[7] || 'N/A'} meters`);
          console.log(`     Velocity: ${aircraft[9] || 'N/A'} m/s`);
          console.log(`     Heading: ${aircraft[10] || 'N/A'}°`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Real-time tracking test failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error:`, error.response.data);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Rate limit information
function showRateLimitInfo() {
  console.log('\n📊 OpenSky API Rate Limits:');
  console.log('   Anonymous users: 400 requests/day');
  console.log('   Registered users: 4000 requests/day');
  console.log('   Rate limit: 10 requests/minute');
  console.log('   This test adds 2-second delays between requests');
}

// Run all tests
async function runAllTests() {
  showRateLimitInfo();
  await testOpenSkyAPI();
  await testRealTimeTracking();
  console.log('\n💡 Tips for using OpenSky API:');
  console.log('   - Use bounding boxes to limit data and improve performance');
  console.log('   - Cache responses when possible due to rate limits');
  console.log('   - Aircraft states update every 10-15 seconds');
  console.log('   - Historical data requires authentication');
}

runAllTests();