import { createApiError, createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles GET requests for the /api/v1/insurance/products endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
export async function handleListProducts(req: Request): Promise<Response> {
  console.log(`[API List Products] Received request`);

  // TODO: Implement database query to fetch all available insurance products.

  const responseData = {
    products: [], // Mocked
    total: 0, // Mocked
    message: "Product list retrieved successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
