import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { getAuthContext } from "@triggerr/core/auth";
import { db } from "@triggerr/core/database";
import { escrow, userWallets } from "@triggerr/core/database/schema";
import { eq, or } from "drizzle-orm";

/**
 * Response interface for the user escrows list endpoint
 */
interface UserEscrowsResponse {
  created: Array<{
    id: string;
    blockchainId: string;
    amount: string;
    status: string;
    expiresAt: string;
    createdAt: string;
    fulfillerAddress: string | null;
    purpose: string;
  }>;
  assigned: Array<{
    id: string;
    blockchainId: string;
    amount: string;
    status: string;
    expiresAt: string;
    createdAt: string;
    creatorUserId: string;
    purpose: string;
  }>;
}

/**
 * Handles GET requests for the /api/v1/user/wallet/escrows endpoint.
 *
 * Fetches all escrows associated with the authenticated user, both those they created
 * and those assigned to them as fulfiller.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleGetUserEscrows(
  request: Request,
): Promise<Response> {
  console.log("[API Escrows List] GET request received");

  try {
    // Get authentication context, passing the request headers
    const authContext = await getAuthContext(
      request.headers,
      request.headers.get("Cookie") || undefined,
    );

    if (!authContext.isAuthenticated || !authContext.user) {
      const errorResponse = createApiError(
        "UNAUTHORIZED",
        "You must be logged in to view escrows.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = authContext.user.id;
    console.log(`[API Escrows List] Fetching escrows for user: ${userId}`);

    // Get user's wallet addresses to match against fulfiller addresses
    const userWalletAddresses = await db.query.userWallets.findMany({
      where: eq(userWallets.userId, userId),
      columns: {
        address: true,
      },
    });

    const walletAddresses = userWalletAddresses.map((wallet) => wallet.address);

    // Fetch escrows created by the user
    const createdEscrows = await db.query.escrow.findMany({
      where: eq(escrow.userId, userId),
      columns: {
        id: true,
        blockchainId: true,
        amount: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        fulfillerAddress: true,
        purpose: true,
      },
      orderBy: (escrow, { desc }) => [desc(escrow.createdAt)],
    });

    // Fetch escrows assigned to the user (where user's wallet is the fulfiller)
    let assignedEscrows: any[] = [];
    if (walletAddresses.length > 0) {
      assignedEscrows = await db.query.escrow.findMany({
        where: or(
          ...walletAddresses.map((address) =>
            eq(escrow.fulfillerAddress, address),
          ),
        ),
        columns: {
          id: true,
          blockchainId: true,
          amount: true,
          status: true,
          expiresAt: true,
          createdAt: true,
          userId: true,
          purpose: true,
        },
        orderBy: (escrow, { desc }) => [desc(escrow.createdAt)],
      });
    }

    // Format the response
    const response: UserEscrowsResponse = {
      created: createdEscrows
        .filter((escrowItem) => escrowItem.blockchainId) // Filter out null blockchainIds
        .map((escrowItem) => ({
          id: escrowItem.id,
          blockchainId: escrowItem.blockchainId!,
          amount: escrowItem.amount,
          status: escrowItem.status,
          expiresAt: escrowItem.expiresAt.toISOString(),
          createdAt: escrowItem.createdAt.toISOString(),
          fulfillerAddress: escrowItem.fulfillerAddress,
          purpose: escrowItem.purpose || "CUSTOM",
        })),
      assigned: assignedEscrows
        .filter((escrowItem) => escrowItem.blockchainId) // Filter out null blockchainIds
        .map((escrowItem) => ({
          id: escrowItem.id,
          blockchainId: escrowItem.blockchainId!,
          amount: escrowItem.amount,
          status: escrowItem.status,
          expiresAt: escrowItem.expiresAt.toISOString(),
          createdAt: escrowItem.createdAt.toISOString(),
          creatorUserId: escrowItem.userId || "unknown",
          purpose: escrowItem.purpose || "CUSTOM",
        })),
    };

    console.log(
      `[API Escrows List] Found ${response.created.length} created escrows and ${response.assigned.length} assigned escrows`,
    );

    // Return a standardized success response
    const successResponse = createApiResponse(response);
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[API Escrows List] Error fetching user escrows:", error);

    // Return a standardized error response
    const errorResponse = createApiError(
      "SERVER_ERROR",
      "An error occurred while retrieving escrows.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
