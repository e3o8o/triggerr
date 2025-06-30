import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";

/**
 * Handles POST requests for the /api/v1/chat/model/context endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
// Define a Zod schema for the expected request body
const contextRequestBodySchema = z.object({
  conversationId: z.string().optional(),
  contextData: z.record(z.any()),
});

export async function handleContextInjection(req: Request): Promise<Response> {
  const userId = "placeholder-user-id"; // Placeholder until auth is migrated
  let body;
  try {
    const rawBody = await req.json();
    body = contextRequestBodySchema.parse(rawBody);
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

  console.log(`[API Context Injection] Received request from user: ${userId}`);

  // TODO: Implement logic to add context to a conversation.

  const responseData = {
    conversationId: body.conversationId || `new_conv_${Date.now()}`,
    injected: true,
    message: "Context injected successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
