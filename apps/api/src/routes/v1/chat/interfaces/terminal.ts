import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";

/**
 * Handles POST requests for the /api/v1/chat/interfaces/terminal endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
// Define a Zod schema for the expected request body
const terminalRequestBodySchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
  conversationId: z.string().optional(),
});

export async function handleTerminalInterfaceRequest(
  req: Request,
): Promise<Response> {
  // Placeholder for authentication logic.
  const userId = "placeholder-user-id";
  let body;

  try {
    const rawBody = await req.json();
    body = terminalRequestBodySchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify(
          createApiError("VALIDATION_ERROR", "Invalid request body.", {
            details: error.format(),
          }),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify(
        createApiError("INVALID_JSON", "Invalid JSON in request body."),
      ),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(`[API Terminal Interface] Received request from user: ${userId}`);

  // TODO: Implement full logic for handling terminal-based chat messages.

  const responseData = {
    response: `(Terminal Mock) Acknowledged your message: "${body.message}"`,
    conversationId: body.conversationId || `new_conv_${Date.now()}`,
    message: "Terminal message processed successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
