import { createApiError, createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles GET requests for the /api/v1/chat/sessions endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
export async function handleListSessions(req: Request): Promise<Response> {
  // In a real implementation, this would be derived from an auth token.
  const sessionId = "placeholder-session-id";
  const { searchParams } = new URL(req.url);

  console.log(`[API List Sessions] Received request for session: ${sessionId} with params: ${searchParams}`);

  // TODO: Implement database query with pagination to fetch conversation sessions.

  const responseData = {
    pagination: {
      page: Number(searchParams.get("page") || "1"),
      limit: Number(searchParams.get("limit") || "20"),
      total: 0, // Mocked total
    },
    sessions: [], // Return an empty array for now
    message: "Session list retrieved successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
