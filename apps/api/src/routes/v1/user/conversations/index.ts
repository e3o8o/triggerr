import { createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles GET requests for the /api/v1/user/conversations endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
export async function handleListConversations(req: Request): Promise<Response> {
  // Placeholder for authentication logic to get the real user ID
  const userId = "placeholder-user-id";
  const { searchParams } = new URL(req.url);

  console.log(`[API List Conversations] Received request for user: ${userId}`);

  // TODO: Implement validation for pagination and filter query params.
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "20";

  // TODO: Implement database query to fetch the user's conversations with pagination.

  const responseData = {
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalItems: 0, // Mocked
      totalPages: 0, // Mocked
    },
    conversations: [], // Mocked
    message: "Conversation list retrieved successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
