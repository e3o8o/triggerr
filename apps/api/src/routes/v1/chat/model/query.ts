import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";

/**
 * Handles POST requests for the /api/v1/chat/model/query endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
// Define a Zod schema for the expected request body
const llmQueryRequestBodySchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty."),
  model: z.string().optional(),
});

export async function handleDirectLLMQuery(req: Request): Promise<Response> {
  // Placeholder for authentication logic.
  const userId = "placeholder-user-id";
  let body;

  try {
    const rawBody = await req.json();
    body = llmQueryRequestBodySchema.parse(rawBody);
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

  console.log(`[API Direct LLM Query] Received request from user: ${userId}`);

  // TODO: Implement full logic for handling direct LLM queries,
  // including validation and routing to the appropriate LLM service.

  const responseData = {
    response: `(LLM Mock) Received your prompt: "${body.prompt}"`,
    modelUsed: "mock-llm",
    message: "Direct LLM query processed successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
