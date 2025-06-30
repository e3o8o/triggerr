import { createApiError, createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles GET requests for the /api/v1/user/wallet/escrows/[id] endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
export async function handleGetEscrowById(req: Request): Promise<Response> {
  const userId = "placeholder-user-id"; // Placeholder until auth is migrated
  const { pathname } = new URL(req.url);
  const escrowId = pathname.split("/").pop();

  console.log(`[API Get Escrow] Received request for escrow: ${escrowId} by user: ${userId}`);

  // TODO: Implement validation, authorization, and on-chain/DB query logic.

  const responseData = {
    escrowId,
    status: "funded", // Mock status
    amount: "50000000000000000", // Mock amount (0.05 tokens)
    createdAt: new Date().toISOString(),
    recipientAddress: "0xb5d78e82e9f198698ecca11c99c97580e47f5972cf0b8d614c32b6032ae15046", // Mock recipient
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
