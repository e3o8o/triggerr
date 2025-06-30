import { createApiError, createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles GET requests for the /api/v1/chat/sessions/[id]/messages endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
export async function handleGetSessionMessages(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  // Example path: /api/v1/chat/sessions/123/messages -> splits to ["", "api", "v1", "chat", "sessions", "123", "messages"]
  // The session ID is the second to last element.
  const sessionId = pathname.split("/").slice(-2, -1)[0];

  console.log(`[API Get Session Messages] Received request for session: ${sessionId}`);

  // TODO: Implement database query with authorization and pagination to fetch the actual messages.

  const responseData = {
    sessionId,
    messages: [], // Mocked empty array
    pagination: {
        limit: 20, // Default limit
        offset: 0, // Default offset
        hasMore: false, // Mocked
    },
    message: "Session messages retrieved successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
