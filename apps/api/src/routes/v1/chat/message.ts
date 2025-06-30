import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";

/**
 * Handles POST requests for the /api/v1/chat/message endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
// Define a Zod schema for the expected request body
const chatMessageRequestBodySchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
  conversationId: z.string().optional(),
});

export async function handleChatMessageRequest(
  req: Request,
): Promise<Response> {
  const userId = "placeholder-user-id"; // Placeholder until auth is migrated
  let body;

  try {
    const rawBody = await req.json();
    body = chatMessageRequestBodySchema.parse(rawBody);
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

  console.log(`[API Chat Message] Received request from user: ${userId}`);

  // TODO: Implement full logic for handling chat messages, including
  // getting or creating a conversation, saving messages, and calling an LLM.

  const responseData = {
    response: `(Mock) Received your message: "${body.message}"`,
    conversationId: body.conversationId || `new_conv_${Date.now()}`,
    message: "Chat message processed successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
