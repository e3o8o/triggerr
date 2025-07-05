import { Auth } from "@triggerr/core";

/**
 * Handles authentication requests for the Bun API server.
 * This adapts the better-auth handler to work with Bun's Request/Response pattern.
 * Supports both GET and POST methods for authentication flows.
 */
export async function handleAuthRequest(request: Request): Promise<Response> {
  try {
    // Pass the original request directly to the better-auth handler.
    // The better-auth handler is designed to parse the full request URL
    // based on its internal configuration (e.g., baseURL).
    const response = await Auth.auth.handler(request);

    return response;
  } catch (error) {
    console.error("[API Auth] Error handling auth request:", error);

    return new Response(
      JSON.stringify({
        error: "AUTHENTICATION_ERROR",
        message: "An error occurred during authentication",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
