// ===========================================================================
// API SDK - BASIC USAGE EXAMPLE
// ===========================================================================

import { createHttpClient, type HttpClientConfig } from "../src"; // Using relative path to run from the project root
import { CacheFactory } from "../src/utils";
import type { ApiResponse } from "@triggerr/api-contracts";
import type { InsuranceProduct } from "@triggerr/api-contracts";

interface FlightDataDto {
  flight_number: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  status: string;
}

/**
 * This example demonstrates the basic setup and usage of the Triggerr API SDK.
 * It covers:
 * - Configuring the SDK with features like retry, caching, and logging.
 * - Making simple, type-safe API calls.
 * - Handling successful responses and basic errors.
 * - Demonstrating the caching mechanism.
 */
async function basicUsageExample() {
  console.log("--- Running Basic Usage Example ---");

  try {
    // Step 1: Configure the SDK client
    // This configuration object shows how to enable various features.
    const config: HttpClientConfig = {
      baseURL: "https://api.triggerr.com/api/v1", // Use your actual API base URL
      timeout: 30000, // 30-second request timeout

      // Configure retry logic for network reliability
      retry: {
        maxAttempts: 3,
        condition: "on_error",
        baseDelay: 500, // Start with a 500ms delay
        backoffStrategy: "exponential",
      },

      // Enable caching for GET requests to improve performance
      cache: {
        enabled: true,
        manager: CacheFactory.memory({
          defaultTtl: 60000, // Cache items for 1 minute by default
        }),
      },

      // Enable detailed logging for development
      debug: {
        enabled: true,
        logLevel: "debug",
      },

      // Use a mock fetch implementation for this example
      fetchImpl: mockBasicFetch,
    };

    // Create the HTTP client instance
    const client = createHttpClient(config);
    console.log("SDK client initialized successfully.");

    // Step 2: Make API calls
    // Example 1: Get available insurance products
    console.log("\n--- Fetching available insurance products ---");
    const productsResponse = await client.get<ApiResponse<InsuranceProduct[]>>(
      "/insurance/products",
    );

    if (productsResponse.success) {
      console.log("Available Insurance Products:", productsResponse.data);
    } else {
      // Handle API errors that are returned in the response body
      console.error(
        `Failed to fetch products: ${productsResponse.error?.code} - ${productsResponse.error?.message}`,
      );
    }

    // ---
    // Example 2: Get flight information
    console.log("\n--- Fetching flight information ---");
    const flightInfoParams = {
      flightNumber: "AA123",
      date: "2024-09-10",
    };

    // Query parameters are passed as the second argument to `get`
    const flightResponse = await client.get<ApiResponse<FlightDataDto>>(
      "/flight-data",
      flightInfoParams,
    );

    if (flightResponse.success) {
      console.log("Flight Information:", flightResponse.data);
    } else {
      console.error(
        `Failed to fetch flight info: ${flightResponse.error?.code} - ${flightResponse.error?.message}`,
      );
    }

    // Step 3: Demonstrate caching
    console.log("\n--- Demonstrating caching ---");
    console.log(
      "Making a second request to /insurance/products. This should be a cache hit.",
    );

    const cachedResponse = await client.get<ApiResponse<InsuranceProduct[]>>(
      "/insurance/products",
    );
    console.log(
      `Cache hit successful: ${cachedResponse.success}. Data was retrieved without a network call.`,
    );

    // Invalidate the cache for a specific endpoint
    await client.invalidateCache("GET:/insurance/products");
    console.log("Cache invalidated for GET:/insurance/products.");

    console.log(
      "Making a third request. This should trigger a network call again.",
    );
    await client.get<ApiResponse<InsuranceProduct[]>>("/insurance/products");
  } catch (error) {
    // This block catches errors thrown by the client itself, like configuration
    // issues or unrecoverable network errors after all retries have failed.
    console.error("An unexpected error was thrown by the HttpClient:", error);
  }
}

/**
 * A mock fetch implementation to simulate API responses for this example.
 */
async function mockBasicFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = input.toString();
  const method = init?.method || "GET";
  console.log(`[Mock Fetch] Intercepted ${method} request to: ${url}`);

  // Cache hit simulation: If the request is made again, the mock won't be called if caching is working.
  if (mockBasicFetch.callCount > 0 && url.includes("/insurance/products")) {
    console.log(
      "[Mock Fetch] Warning: Fetch called for a cached endpoint. Caching might not be working as expected.",
    );
  }

  if (url.includes("/insurance/products")) {
    mockBasicFetch.callCount = (mockBasicFetch.callCount || 0) + 1;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: [
            {
              id: "prod-flight-delay",
              name: "Flight Delay Insurance",
              type: "flight_delay",
              description: "Coverage for flight delays over 2 hours.",
              coverageTiers: [],
              delayThresholds: [60, 120, 180],
              maxCoverageAmount: 5000,
              minCoverageAmount: 100,
              basePrice: 25,
              isActive: true,
            },
            {
              id: "prod-flight-cancellation",
              name: "Flight Cancellation Insurance",
              type: "flight_cancellation",
              description: "Coverage for cancelled flights.",
              coverageTiers: [],
              delayThresholds: [0],
              maxCoverageAmount: 10000,
              minCoverageAmount: 200,
              basePrice: 50,
              isActive: true,
            },
          ],
        },
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.includes("/flight-data")) {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: {
            flight_number: "AA123",
            origin: "JFK",
            destination: "LAX",
            scheduled_departure: "2024-09-10T14:00:00Z",
            status: "On-Time",
          },
        },
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: { code: "NOT_FOUND", message: "Endpoint not mocked" },
    }),
    { status: 404 },
  );
}
mockBasicFetch.callCount = 0;

// Run the example
basicUsageExample()
  .then(() => console.log("\nBasic usage example completed."))
  .catch((error) => console.error("Example failed catastrophically:", error));
