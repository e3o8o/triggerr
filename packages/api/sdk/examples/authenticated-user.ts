// ===========================================================================
// API SDK - AUTHENTICATED USER USAGE EXAMPLE
// ===========================================================================

import {
  createHttpClient,
  type AuthHeaderProvider,
  type HttpClientConfig,
} from "../src"; // Assuming execution from root or correctly resolved
import type { ApiResponse } from "@triggerr/api-contracts";
import type { UserProfile, UserWallet } from "@triggerr/api-contracts";

/**
 * This example demonstrates how to use the SDK for an authenticated user.
 * It covers:
 * - Implementing an AuthHeaderProvider to supply JWT tokens.
 * - Configuring the SDK for authenticated requests.
 * - Making calls to user-specific, protected endpoints.
 * - Handling potential authentication failures.
 */

// --- Mock JWT Token ---
// In a real application, this token would be retrieved after a successful user login.
// It could be stored in localStorage, sessionStorage, or a secure cookie.
const MOCK_JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTExZTItYjI5Mi0wMjQyYWMxMTAwMDMiLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE2Nzc2MjI0MDAsImV4cCI6MTczNTY4OTYwMH0.mock_signature_for_example";

/**
 * Step 1: Implement the AuthHeaderProvider
 *
 * This class is the bridge between your application's authentication system and the SDK.
 * The SDK will call `getAuthHeaders()` before making a request that requires authentication.
 */
class AppAuthHeaderProvider implements AuthHeaderProvider {
  private token: string | null = MOCK_JWT_TOKEN;

  /**
   * Retrieves the authentication headers.
   * This method could fetch the token from localStorage, cookies, or a state management store.
   */
  public async getAuthHeaders(): Promise<Record<string, string> | null> {
    if (this.token) {
      console.log("AuthHeaderProvider: Providing Authorization header.");
      return {
        Authorization: `Bearer ${this.token}`,
      };
    }
    console.log("AuthHeaderProvider: No token available.");
    return null;
  }

  /**
   * An optional method the SDK can call upon authentication failure (e.g., 401 Unauthorized).
   * This is the perfect place to implement token refresh logic or trigger a global logout.
   */
  public async onAuthFailure(error: any): Promise<void> {
    console.error(
      "Authentication failed!",
      error?.status,
      error?.apiError?.message,
    );
    // In a real app, you would clear the invalid token and redirect to a login page.
    this.token = null;
    // For example:
    // localStorage.removeItem('authToken');
    // window.location.href = '/login';
    console.log("Token has been cleared due to auth failure.");
  }

  // Helper method for the example to simulate logout
  public logout(): void {
    this.token = null;
    console.log("User has been logged out.");
  }
}

/**
 * A mock fetch implementation to simulate API responses for authenticated requests.
 */
async function mockAuthenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = input.toString();
  const headers = new Headers(init?.headers);
  const authHeader = headers.get("Authorization");

  console.log(`[Mock Fetch] Intercepted request to: ${url}`);
  console.log(
    `[Mock Fetch] Auth header: ${authHeader ? "Present" : "Missing"}`,
  );

  // Check for authentication
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

  // Mock user profile endpoint
  if (url.includes("/user/profile")) {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: {
            id: "user-123",
            email: "john.doe@example.com",
            name: "John Doe",
            walletAddress: "0x742d35cc6731c0532925a3b8d3ac19d0c5e01234",
            status: "active",
            role: "customer",
            kycStatus: "approved",
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-06-18T10:30:00Z",
            lastLoginAt: "2024-06-18T09:15:00Z",
            preferences: {
              currency: "USD",
              timezone: "UTC",
              language: "en",
              notifications: {
                email: true,
                sms: false,
                push: true,
                marketing: false,
              },
            },
          },
        },
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Mock user policies endpoint
  if (url.includes("/user/policies")) {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: [
            {
              id: "policy-456",
              type: "flight_delay",
              status: "active",
              premium: 45.5,
              coverage: 500,
              flightNumber: "BA286",
              createdAt: "2024-06-01T14:20:00Z",
            },
            {
              id: "policy-789",
              type: "flight_cancellation",
              status: "expired",
              premium: 75.0,
              coverage: 1000,
              flightNumber: "AA123",
              createdAt: "2024-05-15T09:45:00Z",
            },
          ],
        },
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Mock user wallet endpoint
  if (url.includes("/user/wallet")) {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: {
            id: "wallet-123",
            userId: "user-123",
            address: "0x742d35cc6731c0532925a3b8d3ac19d0c5e01234",
            walletName: "Primary Wallet",
            walletType: "custodial",
            status: "active",
            isPrimary: true,
            balance: {
              available: 1250.75,
              pending: 0,
              reserved: 45.5,
              currency: "USDC",
            },
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-06-18T10:30:00Z",
            lastActivity: "2024-06-18T09:15:00Z",
          },
        },
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  // Default: endpoint not found
  return new Response(
    JSON.stringify({
      success: false,
      error: { code: "NOT_FOUND", message: "Endpoint not mocked" },
    }),
    { status: 404 },
  );
}

async function authenticatedUserExample() {
  console.log("--- Running Authenticated User Example ---");

  // Step 2: Configure and create the SDK client
  const authProvider = new AppAuthHeaderProvider();

  const config: HttpClientConfig = {
    baseURL: "https://api.triggerr.com/api/v1", // Use your actual API URL
    authHeaderProvider: authProvider,
    debug: { enabled: true, logLevel: "info" },
    fetchImpl: mockAuthenticatedFetch, // Use mock fetch for demonstration
  };

  const client = createHttpClient(config);
  console.log("Authenticated SDK client initialized.");

  try {
    // Step 3: Make authenticated API calls

    // Example 1: Get user profile
    console.log("\n--- Fetching user profile ---");
    const profileResponse =
      await client.get<ApiResponse<UserProfile>>("/user/profile");
    if (profileResponse.success) {
      console.log("User Profile Data:", profileResponse.data);
    } else {
      console.error("Failed to fetch user profile:", profileResponse.error);
    }

    // Example 2: List user policies
    console.log("\n--- Fetching user policies ---");
    const policiesResponse = await client.get<ApiResponse<any>>(
      "/user/policies",
      {
        limit: 10,
        page: 1,
      },
    );
    if (policiesResponse.success) {
      console.log("User Policies Data:", policiesResponse.data);
    } else {
      console.error("Failed to fetch user policies:", policiesResponse.error);
    }

    // Example 3: Get user wallet information
    console.log("\n--- Fetching user wallet ---");
    const walletResponse =
      await client.get<ApiResponse<UserWallet>>("/user/wallet");
    if (walletResponse.success) {
      console.log("User Wallet Data:", walletResponse.data);
    } else {
      console.error("Failed to fetch user wallet:", walletResponse.error);
    }

    // Example 4: Demonstrate auth failure by logging out
    console.log("\n--- Demonstrating authentication failure ---");
    authProvider.logout(); // Simulate logging out by clearing the token
    console.log("The next request should fail with a 401 error...");

    const failedResponse =
      await client.get<ApiResponse<UserProfile>>("/user/profile");
    if (!failedResponse.success) {
      console.log(
        `Request failed as expected. Error: ${failedResponse.error?.code} - ${failedResponse.error?.message}`,
      );
    }
  } catch (error) {
    // Errors thrown by the SDK (e.g., network issues, unhandled exceptions from the client itself)
    // will be caught here. API errors are typically handled via the `success: false` path.
    console.error("An unexpected error was thrown by the HttpClient:", error);
  }
}

// Run the example
authenticatedUserExample()
  .then(() => console.log("\nAuthenticated user example completed."))
  .catch((error) => console.error("Example failed catastrophically:", error));
