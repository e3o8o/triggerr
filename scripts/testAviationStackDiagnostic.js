#!/usr/bin/env node

/**
 * AviationStack API Diagnostic Test
 *
 * This script helps diagnose the 403 Forbidden error that's blocking Phase 1 completion.
 * It tests various configurations and endpoints to identify the root cause.
 */

const axios = require("axios");
require("dotenv").config();

// API Configuration - using the same as the client
const API_KEY = process.env.AVIATIONSTACK_API_KEY || "ecb207fc2912eb933856043c07566b4c";
const BASE_URL = "http://api.aviationstack.com/v1";

console.log("🔍 AviationStack API Diagnostic Test");
console.log("=====================================");
console.log(`📅 Test Date: ${new Date().toISOString()}`);
console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);
console.log(`🌐 Base URL: ${BASE_URL}`);
console.log("=====================================\n");

// Test configurations
const testConfigs = [
  {
    name: "Basic Connection Test",
    endpoint: "/flights",
    params: { access_key: API_KEY, limit: 1 },
    headers: { "Accept": "application/json" }
  },
  {
    name: "Client Configuration Test",
    endpoint: "/flights",
    params: { access_key: API_KEY, flight_iata: "BT318" },
    headers: {
      "Accept": "application/json",
      "User-Agent": "Triggerr-FlightAggregator/1.0"
    }
  },
  {
    name: "No User-Agent Test",
    endpoint: "/flights",
    params: { access_key: API_KEY, limit: 1 },
    headers: { "Accept": "application/json" }
  },
  {
    name: "Alternative Headers Test",
    endpoint: "/flights",
    params: { access_key: API_KEY, limit: 1 },
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; TriggerrBot/1.0)"
    }
  },
  {
    name: "HTTPS Test",
    endpoint: "/flights",
    params: { access_key: API_KEY, limit: 1 },
    headers: { "Accept": "application/json" },
    useHttps: true
  },
  {
    name: "Query String Test",
    endpoint: "/flights",
    params: null,
    headers: { "Accept": "application/json" },
    customUrl: `${BASE_URL}/flights?access_key=${API_KEY}&limit=1`
  }
];

async function runDiagnosticTest(config) {
  console.log(`\n🔬 Testing: ${config.name}`);
  console.log("─".repeat(50));

  try {
    let url;
    let requestConfig = {
      method: "GET",
      headers: config.headers,
      timeout: 15000
    };

    if (config.customUrl) {
      url = config.customUrl;
    } else {
      const baseUrl = config.useHttps ? BASE_URL.replace('http://', 'https://') : BASE_URL;
      url = `${baseUrl}${config.endpoint}`;
      if (config.params) {
        requestConfig.params = config.params;
      }
    }

    console.log(`📍 URL: ${url}`);
    console.log(`📋 Headers:`, JSON.stringify(config.headers, null, 2));
    if (config.params) {
      console.log(`🔗 Params:`, JSON.stringify(config.params, null, 2));
    }

    const startTime = Date.now();
    const response = await axios.get(url, requestConfig);
    const endTime = Date.now();

    console.log(`✅ SUCCESS`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response Time: ${endTime - startTime}ms`);
    console.log(`📏 Response Size: ${JSON.stringify(response.data).length} bytes`);

    // Check response headers for rate limiting info
    const rateLimitHeaders = {};
    Object.keys(response.headers).forEach(key => {
      if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('limit')) {
        rateLimitHeaders[key] = response.headers[key];
      }
    });

    if (Object.keys(rateLimitHeaders).length > 0) {
      console.log(`🚦 Rate Limit Headers:`, rateLimitHeaders);
    }

    // Sample the response data
    if (response.data) {
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log(`📊 Data Count: ${response.data.data.length}`);
        if (response.data.data.length > 0) {
          console.log(`📋 Sample Flight: ${response.data.data[0].flight?.iata || 'N/A'}`);
        }
      }

      if (response.data.pagination) {
        console.log(`📄 Pagination:`, response.data.pagination);
      }
    }

    return { success: true, status: response.status, config };

  } catch (error) {
    console.log(`❌ FAILED`);

    if (error.response) {
      console.log(`📊 Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`📋 Response Headers:`, JSON.stringify(error.response.headers, null, 2));

      if (error.response.data) {
        console.log(`📄 Error Response:`, JSON.stringify(error.response.data, null, 2));
      }

      // Specific 403 analysis
      if (error.response.status === 403) {
        console.log(`\n🚨 403 FORBIDDEN ANALYSIS:`);
        console.log(`   This could indicate:`);
        console.log(`   • Invalid API key`);
        console.log(`   • API key doesn't have permission for this endpoint`);
        console.log(`   • Rate limit exceeded`);
        console.log(`   • IP-based restrictions`);
        console.log(`   • User-Agent blocking`);
        console.log(`   • Plan limitations (free vs paid)`);
      }

    } else if (error.request) {
      console.log(`📡 Network Error: No response received`);
      console.log(`   Request timeout or network connectivity issue`);
    } else {
      console.log(`⚙️  Request Setup Error: ${error.message}`);
    }

    return { success: false, error: error.message, status: error.response?.status, config };
  }
}

async function testDirectFetch() {
  console.log(`\n🧪 Testing Direct Fetch (same as client):`);
  console.log("─".repeat(50));

  try {
    const url = new URL(`${BASE_URL}/flights`);
    url.searchParams.set("access_key", API_KEY);
    url.searchParams.set("flight_iata", "BT318");

    console.log(`📍 Final URL: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Triggerr-FlightAggregator/1.0"
      },
      signal: AbortSignal.timeout(15000)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`📄 Error Body: ${errorText}`);
    } else {
      const data = await response.json();
      console.log(`✅ SUCCESS with fetch()`);
      console.log(`📊 Data Count: ${data.data?.length || 0}`);
    }

  } catch (error) {
    console.log(`❌ Fetch failed: ${error.message}`);
  }
}

async function runAllTests() {
  const results = [];

  for (const config of testConfigs) {
    const result = await runDiagnosticTest(config);
    results.push(result);

    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test the exact same method as our client
  await testDirectFetch();

  // Summary
  console.log(`\n📊 TEST SUMMARY`);
  console.log("=".repeat(50));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (failed.length > 0) {
    console.log(`\n❌ Failed Tests:`);
    failed.forEach(result => {
      console.log(`   • ${result.config.name}: ${result.status || 'Network Error'}`);
    });
  }

  if (successful.length > 0) {
    console.log(`\n✅ Successful Tests:`);
    successful.forEach(result => {
      console.log(`   • ${result.config.name}: ${result.status}`);
    });
  }

  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (failed.some(r => r.status === 403)) {
    console.log(`   🔑 403 errors detected - check API key permissions and plan limits`);
    console.log(`   📞 Contact AviationStack support if API key should work`);
    console.log(`   🔄 Try regenerating API key in dashboard`);
  }

  if (successful.some(r => r.config.useHttps)) {
    console.log(`   🔒 HTTPS variant worked - consider using HTTPS endpoint`);
  }

  if (successful.length === 0) {
    console.log(`   🚨 All tests failed - check network connectivity and API key validity`);
  }
}

// Run the diagnostic tests
runAllTests().catch(console.error);
