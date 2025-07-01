#!/usr/bin/env bun
const axios = require('axios');

// API configuration
const API_KEY = 'qVYjNbxKZGaGgfc1hfngI182saZqoKkn';
const BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';

// Test configuration
const TEST_FLIGHT_ID = 'DAL123'; // Delta flight example
const TEST_AIRPORT_CODE = 'JFK'; // JFK Airport
const TEST_TAIL_NUMBER = 'N12345'; // Example tail number

// Test function for FlightAware API
async function testFlightAwareAPI() {
  console.log('🛫 Testing FlightAware AeroAPI...\n');

  const headers = {
    'x-apikey': API_KEY,
    'Accept': 'application/json'
  };

  const tests = [
    {
      name: 'Airports Info',
      url: `${BASE_URL}/airports/${TEST_AIRPORT_CODE}`,
      description: 'Get airport information'
    },
    {
      name: 'Airport Flights (Departures)',
      url: `${BASE_URL}/airports/${TEST_AIRPORT_CODE}/flights/departures`,
      description: 'Get departing flights from airport'
    },
    {
      name: 'Airport Flights (Arrivals)', 
      url: `${BASE_URL}/airports/${TEST_AIRPORT_CODE}/flights/arrivals`,
      description: 'Get arriving flights to airport'
    },
    {
      name: 'Flight Search',
      url: `${BASE_URL}/flights/search`,
      description: 'Search for flights',
      params: { query: `-destination ${TEST_AIRPORT_CODE}` }
    },
    {
      name: 'Operators List',
      url: `${BASE_URL}/operators`,
      description: 'Get list of operators'
    }
  ];

  let successCount = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`\n📋 Testing: ${test.name}`);
      console.log(`Description: ${test.description}`);
      console.log(`URL: ${test.url}`);

      const config = {
        headers,
        timeout: 15000
      };

      if (test.params) {
        config.params = test.params;
      }

      const response = await axios.get(test.url, config);

      if (response.status === 200) {
        console.log(`✅ ${test.name} - SUCCESS (${response.status})`);
        
        // Log some sample data (first few items)
        if (response.data) {
          if (Array.isArray(response.data)) {
            console.log(`   📊 Returned ${response.data.length} items`);
            if (response.data.length > 0) {
              console.log(`   📋 Sample data:`, JSON.stringify(response.data[0], null, 2).substring(0, 200) + '...');
            }
          } else if (typeof response.data === 'object') {
            console.log(`   📋 Data keys:`, Object.keys(response.data));
            if (Object.keys(response.data).length > 0) {
              const firstKey = Object.keys(response.data)[0];
              console.log(`   📋 Sample (${firstKey}):`, JSON.stringify(response.data[firstKey], null, 2).substring(0, 200) + '...');
            }
          }
        }
        successCount++;
      } else {
        console.log(`⚠️  ${test.name} - Unexpected status: ${response.status}`);
      }

    } catch (error) {
      console.log(`❌ ${test.name} - FAILED`);
      
      if (error.response) {
        console.log(`   Status: ${error.response.status} - ${error.response.statusText}`);
        
        if (error.response.data) {
          console.log(`   Error details:`, error.response.data);
        }
        
        // Specific error handling
        switch (error.response.status) {
          case 401:
            console.log('   ⚠️  Authentication failed. Check your API key.');
            break;
          case 403:
            console.log('   ⚠️  Access forbidden. Your API key may not have permission for this endpoint.');
            break;
          case 404:
            console.log('   ⚠️  Endpoint not found. This endpoint may not exist or be available.');
            break;
          case 429:
            console.log('   ⚠️  Rate limit exceeded. Too many requests.');
            break;
          case 500:
            console.log('   ⚠️  Server error. FlightAware API may be experiencing issues.');
            break;
          default:
            console.log(`   ⚠️  HTTP Error: ${error.response.status}`);
        }
      } else if (error.request) {
        console.log('   ❌ No response received (timeout or network error)');
      } else {
        console.log(`   ❌ Request error: ${error.message}`);
      }
    }

    // Add a small delay between requests to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful tests: ${successCount}/${totalTests}`);
  console.log(`❌ Failed tests: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount > 0) {
    console.log('\n🎉 FlightAware API is accessible!');
    console.log('💡 You can now use the working endpoints in your application.');
  } else {
    console.log('\n⚠️  No tests passed. Please check:');
    console.log('   - API key validity');
    console.log('   - API key permissions');
    console.log('   - FlightAware service status');
    console.log('   - Network connectivity');
  }
}

// Additional test for specific flight tracking
async function testSpecificFlight() {
  console.log('\n\n🔍 Testing Specific Flight Tracking...\n');
  
  try {
    const headers = {
      'x-apikey': API_KEY,
      'Accept': 'application/json'
    };

    // Try to get live flights
    const response = await axios.get(`${BASE_URL}/flights/search`, {
      headers,
      params: {
        query: '-type airline',
        max_pages: 1
      },
      timeout: 15000
    });

    if (response.status === 200 && response.data && response.data.flights) {
      console.log(`✅ Found ${response.data.flights.length} live flights`);
      
      if (response.data.flights.length > 0) {
        const flight = response.data.flights[0];
        console.log('\n📋 Sample Live Flight:');
        console.log(`   Flight ID: ${flight.ident || 'N/A'}`);
        console.log(`   Aircraft: ${flight.aircraft_type || 'N/A'}`);
        console.log(`   Origin: ${flight.origin?.code || 'N/A'} (${flight.origin?.name || 'N/A'})`);
        console.log(`   Destination: ${flight.destination?.code || 'N/A'} (${flight.destination?.name || 'N/A'})`);
        console.log(`   Status: ${flight.status || 'N/A'}`);
        
        if (flight.progress_percent !== undefined) {
          console.log(`   Progress: ${flight.progress_percent}%`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Specific flight test failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error:`, error.response.data);
    }
  }
}

// Run all tests
async function runAllTests() {
  await testFlightAwareAPI();
  await testSpecificFlight();
}

runAllTests();