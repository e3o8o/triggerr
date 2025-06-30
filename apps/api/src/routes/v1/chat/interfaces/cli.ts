import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";

/**
 * Handles POST requests for the /api/v1/chat/interfaces/cli endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */

// Define a Zod schema for the expected request body
const cliRequestBodySchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
  conversationId: z.string().optional(),
});

export async function handleCliRequest(req: Request): Promise<Response> {
  const userId = "placeholder-user-id";

  let body;
  try {
    const rawBody = await req.json();
    body = cliRequestBodySchema.parse(rawBody);
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

  console.log(`[API CLI Interface] Received request from user: ${userId}`);

  // TODO: Implement full logic for handling CLI chat messages.
  // This would involve:
  // 1. Validating the request body against a Zod schema.
  // 2. Getting or creating a conversation based on `body.conversationId`.
  // 3. Saving the user's message to the database.
  // 4. Calling an LLM service to get a response.
  // 5. Saving the AI's response to the database.

  const responseData = {
    response: `(CLI Mock) Received your message: "${body.message}"`,
    conversationId: body.conversationId || `new_conv_${Date.now()}`,
    message: "CLI message processed successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
