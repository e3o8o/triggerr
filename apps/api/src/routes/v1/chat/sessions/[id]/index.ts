import { createApiError, createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles GET requests for the /api/v1/chat/sessions/[id] endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
export async function handleGetSessionById(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  const sessionId = pathname.split("/").pop();

  console.log(`[API Get Session] Received request for session: ${sessionId}`);

  // TODO: Implement database query with authorization to fetch the session.

  const responseData = {
    sessionId,
    title: "Mock Session Title",
    messages: [], // Mocked
    message: "Session details retrieved successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
