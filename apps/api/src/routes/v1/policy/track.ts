import { createApiError, createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles GET requests for the /api/v1/policy/track endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 * This route allows for tracking a policy's status, typically by an anonymous user
 * who has a policy reference number.
 */
export async function handleTrackPolicyRequest(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const policyReference = searchParams.get("reference");

  console.log(`[API Track Policy] Received request for reference: ${policyReference}`);

  if (!policyReference) {
    const errorResponse = createApiError("BAD_REQUEST", "A policy 'reference' query parameter is required.");
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // TODO: Implement database query to fetch the policy by its reference number or ID.
  // This should not require authentication but should also not expose sensitive user data.

  const responseData = {
    policyReference,
    status: "active", // Mocked status
    productName: "Flight Delay Insurance", // Mocked
    premium: "2500", // Mocked in cents
    coverageAmount: "50000", // Mocked in cents
    flightDetails: {
        flightNumber: "UA123",
        departure: "SFO",
        arrival: "JFK",
        scheduledDeparture: new Date().toISOString(),
        scheduledArrival: new Date().toISOString(),
    },
    message: "Policy tracking details retrieved successfully (mocked).",
  };

  const successResponse = createApiResponse(responseData);
  return new Response(JSON.stringify(successResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
