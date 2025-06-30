import { createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles GET requests for the /api/v1/user/policies endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
export async function handleListUserPolicies(req: Request): Promise<Response> {
  const userId = "placeholder-user-id"; // Placeholder until auth is migrated
  const { searchParams } = new URL(req.url);

  console.log(`[API List Policies] Received request for user: ${userId}`);

  // TODO: Implement database query with pagination and filtering.

  const responseData = {
    pagination: {
      page: Number(searchParams.get("page") || "1"),
      limit: Number(searchParams.get("limit") || "20"),
      totalItems: 0, // Mocked
      totalPages: 0, // Mocked
    },
    policies: [],
    message: "Policy list retrieved successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
