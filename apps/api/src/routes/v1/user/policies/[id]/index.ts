import { createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles GET requests for the /api/v1/user/policies/[id] endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
export async function handleGetPolicyById(req: Request): Promise<Response> {
  // Placeholder for authentication logic
  const userId = "placeholder-user-id";
  const { pathname } = new URL(req.url);

  // A simple way to get the ID from the path, a proper router would be better
  const policyId = pathname.split("/").pop();

  console.log(`[API Get Policy] Received request for policy: ${policyId} by user: ${userId}`);

  // TODO: Implement database query to fetch the policy, ensuring the user is authorized to view it.

  // Mocked response data
  const responseData = {
    id: policyId,
    policyNumber: `POL-${Math.floor(Math.random() * 100000)}`,
    status: "active", // Mocked status
    productType: "flight_delay",
    coverageAmount: "50000", // Cents
    premium: "500", // Cents
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    message: "Policy details retrieved successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
