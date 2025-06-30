// ===========================================================================
// API SDK - ERROR HANDLING EXAMPLE
// ===========================================================================

import {
  createHttpClient,
  ApiClientError,
  type HttpClientConfig,
  type AuthHeaderProvider,
} from "../src"; // Assuming execution from root or correctly resolved
import type { ApiResponse } from "@triggerr/api-contracts";

/**
 * This example demonstrates robust error handling strategies for the SDK.
 * It covers:
 * - Handling standard API errors returned by the server (e.g., 4xx, 5xx).
 * - Distinguishing between different types of API errors (e.g., validation vs. not found).
 * - Handling network errors and request timeouts that occur before a response is received.
 * - Using the onAuthFailure callback for centralized authentication error handling.
 */

// --- Mocking Infrastructure ---

/**
 * A mock fetch implementation that simulates different error scenarios based on the URL path.
 */
const mockFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const url = input.toString();
  console.log(`[Mock Fetch] Intercepted request to: ${url}`);

  // Simulate 404 Not Found
  if (url.includes("/NotFound")) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "The requested resource could not be found.",
        },
        timestamp: new Date().toISOString(),
      }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  // Simulate 422 Validation Error
  if (url.includes("/validation-error")) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The input provided is invalid.",
          details: {
            field: "email",
            issue: "Email address must be a valid format.",
          },
        },
        timestamp: new Date().toISOString(),
      }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  }

  // Simulate 401 Unauthorized
  if (url.includes("/unauthorized")) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication token is missing or invalid.",
        },
        timestamp: new Date().toISOString(),
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // Simulate 500 Internal Server Error
  if (url.includes("/server-error")) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred on the server.",
        },
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // Simulate Network Error
  if (url.includes("/network-error")) {
    return Promise.reject(new TypeError("Failed to fetch"));
  }

  // Simulate Timeout (AbortError)
  if (url.includes("/timeout")) {
    const error = new DOMException("The request was aborted.", "AbortError");
    return Promise.reject(error);
  }

  // Default successful response
  return new Response(
    JSON.stringify({
      success: true,
      data: { message: "This is a successful response." },
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

// Simple Auth Provider for the onAuthFailure demonstration
class MockAuthProvider implements AuthHeaderProvider {
  async getAuthHeaders() {
    return { Authorization: "Bearer mock-token" };
  }
  async onAuthFailure(error: any) {
    console.log(
      `[onAuthFailure] Auth error detected! Status: ${error.status}. The user should be logged out.`,
    );
  }
}

async function errorHandlingExample() {
  console.log("--- Running Error Handling Example ---");

  const config: HttpClientConfig = {
    baseURL: "https://api.triggerr.com/api/v1",
    fetchImpl: mockFetch, // Use our mock fetch for simulations
    authHeaderProvider: new MockAuthProvider(),
    debug: { enabled: true, logLevel: "info" },
    retry: false, // Disable retries for predictable error testing
  };

  const client = createHttpClient(config);

  // --- Scenario 1: Handling API Errors from a Response ---
  console.log("\n--- Scenario 1: Handling a 404 Not Found API Error ---");
  try {
    const notFoundResponse = await client.get("/not-found");
    if (!notFoundResponse.success) {
      console.log("Successfully caught API error in response object.");
      console.log(`Error Code: ${notFoundResponse.error?.code}`);
      console.log(`Error Message: ${notFoundResponse.error?.message}`);
    }
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.log("Successfully caught API error via exception.");
      console.log(`Error Code: ${error.apiError?.code}`);
      console.log(`Error Message: ${error.message}`);
      console.log(`HTTP Status: ${error.status}`);
    }
  }

  // --- Scenario 2: Handling a Validation Error with Details ---
  console.log("\n--- Scenario 2: Handling a 422 Validation Error ---");
  try {
    const validationResponse = await client.get("/validation-error");
    if (
      !validationResponse.success &&
      validationResponse.error?.code === "VALIDATION_ERROR"
    ) {
      console.log("Successfully caught Validation Error.");
      console.log(`Field: ${validationResponse.error.details?.field}`);
      console.log(`Issue: ${validationResponse.error.details?.issue}`);
    }
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.log("Successfully caught Validation Error via exception.");
      console.log(`Error Code: ${error.apiError?.code}`);
      console.log(`Error Message: ${error.message}`);
      if (error.apiError?.details?.field) {
        console.log(`Field: ${error.apiError.details.field}`);
        console.log(`Issue: ${error.apiError.details.issue}`);
      }
    }
  }

  // --- Scenario 3: Handling a 401 Unauthorized Error ---
  console.log("\n--- Scenario 3: Handling a 401 Unauthorized Error ---");
  // The `onAuthFailure` callback in our provider will be automatically triggered.
  try {
    const unauthorizedResponse = await client.get("/unauthorized");
    if (!unauthorizedResponse.success) {
      console.log(
        "Unauthorized request was made. Check logs for onAuthFailure message.",
      );
    }
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      console.log(
        "Unauthorized request caught via exception. Check logs for onAuthFailure message.",
      );
    }
  }

  // --- Scenario 4: Handling a Thrown Network or Timeout Error ---
  console.log("\n--- Scenario 4: Handling a Network Error ---");
  try {
    // This call will reject because the mock fetch simulates a network failure.
    await client.get("/network-error");
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.log("Successfully caught a thrown ApiClientError!");
      console.log(`Error Name: ${error.name}`);
      console.log(`Error Message: ${error.message}`);
      // The `apiError` property contains the standardized error code.
      console.log(`Inferred Error Code: ${error.apiError?.code}`);
    } else {
      console.error("Caught an unexpected error type:", error);
    }
  }

  console.log("\n--- Scenario 5: Handling a Timeout Error ---");
  try {
    // This call will reject because the mock fetch simulates an AbortError.
    await client.get("/timeout");
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 408) {
      console.log("Successfully caught a thrown Timeout Error!");
      console.log(`Error Name: ${error.name}`);
      console.log(`Status: ${error.status}`);
      console.log(`Error Message: ${error.message}`);
    } else {
      console.error("Caught an unexpected error type for timeout:", error);
    }
  }
}

// Run the example
errorHandlingExample()
  .then(() => console.log("\nError handling example completed."))
  .catch((error) => console.error("Example failed catastrophically:", error));
