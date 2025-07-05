// ===========================================================================
// API SDK - ANONYMOUS USER USAGE EXAMPLE
// ===========================================================================

import {
  createHttpClient,
  AnonymousSessionManager,
  type HttpClientConfig,
  type AuthHeaderProvider,
} from "../src"; // Using relative path to run from the project root
import type { ApiResponse } from "@triggerr/api-contracts";
import type {
  InsuranceQuoteRequest,
  InsuranceQuoteResponse,
} from "@triggerr/api-contracts";

// Additional types for the example (these would be in api-contracts in a real implementation)
interface PolicyPurchaseRequestDto {
  quote_id: string;
  payment_token: string;
  policy_holder: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface PolicyPurchaseResponseDto {
  policy_id: string;
  tracking_number: string;
  status: string;
}

interface PolicyDto {
  id: string;
  tracking_number: string;
  status: string;
  premium: number;
}

/**
 * This example demonstrates using the InsureInnie API SDK as an anonymous (unauthenticated) user.
 * It covers:
 * - Using the built-in AnonymousSessionManager to handle session IDs.
 * - Configuring the SDK to send the anonymous session header.
 * - Getting an insurance quote.
 * - Purchasing a policy and receiving a tracking number.
 * - Tracking the policy status anonymously.
 */

// Step 1: Use the AnonymousSessionManager to handle the session ID.
// The manager will automatically generate and store the session ID in localStorage if available.
const sessionManager = new AnonymousSessionManager();

// Step 2: Create an AuthHeaderProvider that uses the session manager.
// This provider will supply the 'x-anonymous-session-id' header to the client.
class AnonymousAuthProvider implements AuthHeaderProvider {
  constructor(private manager: AnonymousSessionManager) {}

  public async getAuthHeaders(): Promise<Record<string, string> | null> {
    const sessionId = this.manager.getSessionId();
    if (sessionId) {
      console.log(
        `[Auth Provider] Supplying anonymous session ID: ${sessionId}`,
      );
      return {
        "x-anonymous-session-id": sessionId,
      };
    }
    return null;
  }

  public async onAuthFailure(error: any): Promise<void> {
    // This is less likely to be called for anonymous users unless the session ID is explicitly invalidated by the server.
    console.warn(
      "[Auth Provider] Anonymous session was considered invalid.",
      error,
    );
    this.manager.clearSessionId(); // Clear the invalid session
  }
}

async function anonymousUserExample() {
  console.log("--- Running Anonymous User Example ---");

  try {
    const anonymousProvider = new AnonymousAuthProvider(sessionManager);
    console.log(
      `Current anonymous session ID: ${sessionManager.getSessionId()}`,
    );

    // Step 3: Configure and create the SDK client.
    const config: HttpClientConfig = {
      baseURL: "https://api.triggerr.com/api/v1", // Use your actual API URL
      authHeaderProvider: anonymousProvider,
      debug: { enabled: true, logLevel: "info" },
      // Mock fetch implementation for demonstration purposes
      fetchImpl: mockAnonymousFetch,
    };

    const client = createHttpClient(config);
    console.log("SDK client initialized with anonymous session provider.");

    // Step 4: Get an insurance quote.
    console.log("\n--- Getting an insurance quote ---");

    const quoteRequest: InsuranceQuoteRequest = {
      productType: "flight_delay",
      flightDetails: {
        flightNumber: "BA286",
        airline: "British Airways",
        origin: "LHR",
        destination: "SFO",
        departureDate: "2024-08-15",
        departureTime: "14:30",
      },
      coverageDetails: {
        tier: "economy",
        coverageAmount: 500,
        delayThreshold: 60,
      },
    };

    const quoteResponse = await client.post<
      ApiResponse<InsuranceQuoteResponse>,
      InsuranceQuoteRequest
    >("/insurance/quote", quoteRequest);

    if (quoteResponse.success) {
      const quoteId = quoteResponse.data?.data?.quoteId;
      console.log("Quote received successfully! Quote ID:", quoteId);

      // Step 5: Purchase a policy using the quote.
      console.log("\n--- Purchasing a policy with the quote ---");

      const purchaseRequest: PolicyPurchaseRequestDto = {
        quote_id: quoteId!,
        payment_token: "mock-payment-token-from-stripe-or-paygo",
        policy_holder: {
          first_name: "Jane",
          last_name: "Doe",
          email: "jane.doe.anon@example.com",
        },
      };

      const purchaseResponse = await client.post<
        ApiResponse<PolicyPurchaseResponseDto>,
        PolicyPurchaseRequestDto
      >("/insurance/purchase", purchaseRequest);

      if (purchaseResponse.success) {
        const trackingNumber = purchaseResponse.data?.data?.tracking_number;
        console.log(
          "Policy purchased successfully! Tracking Number:",
          trackingNumber,
        );

        // Step 6: Track the policy status anonymously.
        console.log("\n--- Tracking the policy status ---");

        const policyStatusResponse = await client.get<ApiResponse<PolicyDto>>(
          `/policies/track/${trackingNumber}`,
        );

        if (policyStatusResponse.success) {
          console.log(
            "Policy status retrieved successfully:",
            policyStatusResponse.data?.data,
          );
        } else {
          console.error("Failed to track policy:", policyStatusResponse.error);
        }
      } else {
        console.error("Failed to purchase policy:", purchaseResponse.error);
      }
    } else {
      console.error("Failed to get quote:", quoteResponse.error);
    }
  } catch (error) {
    console.error("An unexpected error occurred in the example:", error);
  }
}

/**
 * A mock fetch implementation to simulate API responses for the anonymous flow.
 */
async function mockAnonymousFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = input.toString();
  console.log(`[Mock Fetch] Intercepted request to: ${url}`);

  if (url.endsWith("/insurance/quote")) {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: {
            quoteId: `quote_anon_${Date.now()}`,
            productType: "flight_delay",
            product: {
              id: "prod-flight-delay",
              name: "Flight Delay Insurance",
              type: "flight_delay",
              description: "Coverage for flight delays",
              coverageTiers: [],
              delayThresholds: [60],
              maxCoverageAmount: 5000,
              minCoverageAmount: 100,
              basePrice: 25.5,
              isActive: true,
            },
            coverage: {
              tier: "economy",
              amount: 500,
              delayThreshold: 60,
            },
            premium: {
              total: 25.5,
              currency: "USD",
              breakdown: [],
            },
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.endsWith("/insurance/purchase")) {
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: {
            policy_id: `pol_anon_${Date.now()}`,
            tracking_number: `track_anon_${Date.now()}`,
            status: "ACTIVE",
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.includes("/policies/track/")) {
    const trackingNumber = url.split("/").pop();
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          data: {
            id: `pol_for_${trackingNumber}`,
            tracking_number: trackingNumber,
            status: "ACTIVE",
            premium: 25.5,
          },
        },
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

// Run the example
anonymousUserExample()
  .then(() => console.log("\nAnonymous user example completed."))
  .catch((error) => console.error("Example failed catastrophically:", error));
