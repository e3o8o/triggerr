const axios = require("axios");
require("dotenv").config(); // Load environment variables from .env file

// API Configuration
const API_KEY =
  process.env.AVIATIONSTACK_API_KEY || "ecb207fc2912eb933856043c07566b4c";
const BASE_URL = "http://api.aviationstack.com/v1"; // HTTP is correct for free plan

// Test Data
const TEST_FLIGHT = {
  airline: "Air Baltic",
  flight_number: "BT318",
  date: "2025-06-06",
};

const TEST_AIRPORT = "RIX"; // Riga International Airport IATA code

// Test Functions

// Test API Connection
async function testAPIConnection() {
  console.log("🔍 Testing API Connection...\n");
  try {
    const response = await axios.get(`${BASE_URL}/flights`, {
      params: { access_key: API_KEY, limit: 1 },
    });
    console.log("✅ API Connection: SUCCESS");
    console.log(`📊 Status Code: ${response.status}`);
    const headers = response.headers;
    const rateLimit = Object.keys(headers).find(
      (key) => key.toLowerCase() === "x-ratelimit-remaining",
    );
    console.log(
      `📈 Rate Limit Remaining: ${rateLimit ? headers[rateLimit] : "N/A"}`,
    );
    console.log(`📋 Data Structure: ${response.data ? "Valid" : "Invalid"}\n`);
    return true;
  } catch (error) {
    console.log("❌ API Connection: FAILED");
    console.log(`📊 Error: ${error.response?.status || error.message}`);
    console.log(
      `📋 Details: ${error.response?.data?.error?.message || error.message}`,
    );
    if (error.response?.data?.error?.code === "invalid_access_key") {
      console.log("⚠️ Invalid API key. Please verify your API_KEY.");
    } else if (error.response?.data?.error?.code === "usage_limit_reached") {
      console.log("⚠️ Monthly request limit reached. Upgrade to a paid plan.");
    }
    console.log("");
    return false;
  }
}

// Test Flight Lookup (Enhanced)
async function testFlightLookup() {
  console.log("🔍 Testing Flight Lookup (BT318)...\n");
  try {
    const response = await axios.get(`${BASE_URL}/flights`, {
      params: { access_key: API_KEY, flight_iata: TEST_FLIGHT.flight_number },
    });
    const flights = response.data.data;
    if (flights && flights.length > 0) {
      console.log("✅ Flight Lookup: SUCCESS");
      console.log(`📊 Flights Found: ${flights.length}`);
      const flight = flights[0];
      console.log("\n📋 Flight Details:");
      console.log(
        `   Flight: ${flight.flight?.iata || "N/A"} (${flight.flight?.icao || "N/A"})`,
      );
      console.log(`   Airline: ${flight.airline?.name || "N/A"}`);
      console.log(`   Status: ${flight.flight_status || "N/A"}`);
      console.log(
        `   Departure: ${flight.departure?.airport || "N/A"} at ${flight.departure?.scheduled || "N/A"}`,
      );
      console.log(
        `   Arrival: ${flight.arrival?.airport || "N/A"} at ${flight.arrival?.scheduled || "N/A"}`,
      );
      console.log(
        `   Aircraft: ${flight.aircraft?.registration || "N/A"} (${flight.aircraft?.model || "N/A"})`,
      );
      console.log(
        `   Delay: Departure - ${flight.departure?.delay || "N/A"}, Arrival - ${flight.arrival?.delay || "N/A"}`,
      );
    } else {
      console.log("⚠️ Flight Lookup: NO DATA");
      console.log(`   Flight ${TEST_FLIGHT.flight_number} not found for today`);
      console.log("   Note: Free plan supports real-time data only.");
    }
    console.log("");
    return true;
  } catch (error) {
    console.log("❌ Flight Lookup: FAILED");
    console.log(`📊 Error: ${error.response?.status || error.message}`);
    console.log(
      `📋 Details: ${error.response?.data?.error?.message || error.message}`,
    );
    console.log("");
    return false;
  }
}

// Test Airline Search (Enhanced)
async function testAirlineSearch() {
  console.log("🔍 Testing Airline Search (Air Baltic)...\n");
  try {
    const response = await axios.get(`${BASE_URL}/airlines`, {
      params: {
        access_key: API_KEY,
        airline_name: TEST_FLIGHT.airline,
        limit: 5,
      },
    });
    const airlines = response.data.data;
    if (airlines && airlines.length > 0) {
      console.log("✅ Airline Search: SUCCESS");
      console.log(`📊 Airlines Found: ${airlines.length}`);
      console.log("\n📋 Sample Airline:");
      console.log(`   Name: ${airlines[0].name || "N/A"}`);
      console.log(`   IATA: ${airlines[0].iata_code || "N/A"}`);
      console.log(`   ICAO: ${airlines[0].icao_code || "N/A"}`);
      console.log(`   Fleet Size: ${airlines[0].fleet_size || "N/A"}`);
      console.log(`   Headquarters: ${airlines[0].headquarters || "N/A"}`);
    } else {
      console.log("⚠️ Airline Search: NO DATA");
      console.log(`   No airlines found matching "${TEST_FLIGHT.airline}"`);
    }
    console.log("");
    return true;
  } catch (error) {
    console.log("❌ Airline Search: FAILED");
    console.log(`📊 Error: ${error.response?.status || error.message}`);
    console.log(
      `📋 Details: ${error.response?.data?.error?.message || error.message}`,
    );
    console.log("");
    return false;
  }
}

// Test Airport Lookup
async function testAirportLookup() {
  console.log("🔍 Testing Airport Lookup (RIX)...\n");
  try {
    const response = await axios.get(`${BASE_URL}/airports`, {
      params: { access_key: API_KEY, iata_code: TEST_AIRPORT },
    });
    const airports = response.data.data;
    if (airports && airports.length > 0) {
      console.log("✅ Airport Lookup: SUCCESS");
      console.log(`📊 Airports Found: ${airports.length}`);
      console.log("\n📋 Sample Airport:");
      console.log(`   Name: ${airports[0].airport_name || "N/A"}`);
      console.log(`   IATA: ${airports[0].iata_code || "N/A"}`);
      console.log(`   ICAO: ${airports[0].icao_code || "N/A"}`);
      console.log(`   City: ${airports[0].city_name || "N/A"}`);
      console.log(`   Country: ${airports[0].country_name || "N/A"}`);
    } else {
      console.log("⚠️ Airport Lookup: NO DATA");
      console.log(`   No airports found matching IATA code "${TEST_AIRPORT}"`);
    }
    console.log("");
    return true;
  } catch (error) {
    console.log("❌ Airport Lookup: FAILED");
    console.log(`📊 Error: ${error.response?.status || error.message}`);
    console.log(
      `📋 Details: ${error.response?.data?.error?.message || error.message}`,
    );
    console.log("");
    return false;
  }
}

// Main Test Runner
async function runTests() {
  console.log("🚀 AviationStack API Test Suite");
  console.log("=".repeat(40));
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
  console.log(
    `✈️ Test Flight: ${TEST_FLIGHT.flight_number} (${TEST_FLIGHT.airline})`,
  );
  console.log(`🛫 Test Airport: ${TEST_AIRPORT}`);
  console.log("=".repeat(40));
  console.log("");

  const results = [];
  results.push(await testAPIConnection());
  results.push(await testFlightLookup());
  results.push(await testAirlineSearch());
  results.push(await testAirportLookup());

  // Summary
  const passed = results.filter((r) => r).length;
  const total = results.length;
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(20));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`🎯 Success Rate: ${Math.round((passed / total) * 100)}%`);
  console.log(
    passed === total
      ? "\n🎉 All tests passed!"
      : "\n⚠️ Some tests failed. Check logs.",
  );
}

// Run the Tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testAPIConnection,
  testFlightLookup,
  testAirlineSearch,
  testAirportLookup,
  runTests,
};
