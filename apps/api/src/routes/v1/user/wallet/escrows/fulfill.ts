import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";
import { EscrowManager } from "@triggerr/escrow-engine";

import { getAuthContext, setRLSContext } from "@triggerr/core/auth";
import { db } from "@triggerr/core/database";
import { userWallets, escrow } from "@triggerr/core/database/schema";
import { eq, and } from "drizzle-orm";
import type { Hex } from "viem";

// Request validation schema
const fulfillEscrowRequestSchema = z.object({
  escrowId: z.string().min(1, "Escrow ID is required"),
  proof: z.string().optional(), // Optional ZK proof for advanced escrows
});

type FulfillEscrowRequest = z.infer<typeof fulfillEscrowRequestSchema>;

/**
 * Handles POST requests for the /api/v1/user/wallet/escrows/fulfill endpoint.
 *
 * Allows the designated fulfiller (recipient) to fulfill an escrow and claim the funds.
 * The user must be authenticated and must be the designated fulfiller of the escrow.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleFulfillEscrowRequest(
  request: Request,
  escrowManager: EscrowManager,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(
    `[API Escrow Fulfill] [${requestId}] Received fulfill escrow request`,
  );

  try {
    // 1. Authenticate user and set RLS context
    const authContext = await getAuthContext(
      request.headers,
      request.headers.get("Cookie") || undefined,
    );

    if (!authContext.isAuthenticated || !authContext.user?.id) {
      console.warn(
        `[API Escrow Fulfill] [${requestId}] User not authenticated`,
      );
      const errorResponse = createApiError(
        "UNAUTHORIZED",
        "You must be logged in to fulfill an escrow.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = authContext.user.id;
    console.log(
      `[API Escrow Fulfill] [${requestId}] Authenticated user: ${userId}`,
    );

    // Set RLS context for database operations
    await setRLSContext(authContext);

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = fulfillEscrowRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.warn(
        `[API Escrow Fulfill] [${requestId}] Request validation failed:`,
        validationResult.error.format(),
      );
      const errorResponse = createApiError(
        "VALIDATION_ERROR",
        "Invalid request format",
        { details: validationResult.error.format() },
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: FulfillEscrowRequest = validationResult.data;
    const { escrowId, proof } = data;

    // 3. Get user's primary wallet to verify they can fulfill the escrow
    const userWalletResult = await db
      .select({
        id: userWallets.id,
        address: userWallets.address,
      })
      .from(userWallets)
      .where(
        and(eq(userWallets.userId, userId), eq(userWallets.isPrimary, true)),
      )
      .limit(1);

    if (userWalletResult.length === 0) {
      console.warn(
        `[API Escrow Fulfill] [${requestId}] No primary wallet found for user ${userId}`,
      );
      const errorResponse = createApiError(
        "NOT_FOUND",
        "Primary wallet not found. Please contact support.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userWallet = userWalletResult[0];
    if (!userWallet) {
      return new Response(
        JSON.stringify(createApiError("WALLET_NOT_FOUND", "Wallet not found")),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const fulfillerAddress = userWallet.address as Hex;

    // 4. Verify the escrow exists and user is authorized to fulfill it
    const escrowRecord = await db.query.escrow.findFirst({
      where: eq(escrow.blockchainId, escrowId),
    });

    if (!escrowRecord) {
      console.warn(
        `[API Escrow Fulfill] [${requestId}] Escrow not found: ${escrowId}`,
      );
      const errorResponse = createApiError(
        "NOT_FOUND",
        "Escrow not found or does not exist.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Verify user is the designated fulfiller
    if (
      escrowRecord.fulfillerAddress &&
      escrowRecord.fulfillerAddress.toLowerCase() !==
        fulfillerAddress.toLowerCase()
    ) {
      console.warn(
        `[API Escrow Fulfill] [${requestId}] User ${userId} is not authorized to fulfill escrow ${escrowId}`,
      );
      const errorResponse = createApiError(
        "FORBIDDEN",
        "You are not authorized to fulfill this escrow.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Check if escrow is already fulfilled or released
    if (escrowRecord.status === "FULFILLED") {
      const errorResponse = createApiError(
        "CONFLICT",
        "This escrow has already been fulfilled.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (escrowRecord.status === "RELEASED") {
      const errorResponse = createApiError(
        "CONFLICT",
        "This escrow has already been released and cannot be fulfilled.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 7. Check if escrow has expired
    if (escrowRecord.expiresAt && new Date() > escrowRecord.expiresAt) {
      const errorResponse = createApiError(
        "CONFLICT",
        "This escrow has expired and cannot be fulfilled.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[API Escrow Fulfill] [${requestId}] Fulfilling escrow ${escrowId} for user ${userId}`,
    );

    // 7. Fetch the wallet of the escrow creator to correctly record the 'from' address
    let fromAddress: string = "system"; // Default fallback
    if (escrowRecord.userId) {
      const creatorWallet = await db.query.userWallets.findFirst({
        where: eq(userWallets.userId, escrowRecord.userId),
        columns: { address: true },
      });
      if (creatorWallet) {
        fromAddress = creatorWallet.address;
      }
    }

    // 8. Use the injected EscrowManager instance to fulfill the escrow
    const fulfillResult = await escrowManager.fulfillEscrow(
      escrowId as Hex,
      fulfillerAddress,
      proof,
    );

    if (!fulfillResult.success) {
      console.error(
        `[API Escrow Fulfill] [${requestId}] Escrow fulfillment failed: ${fulfillResult.error}`,
      );
      const errorResponse = createApiError(
        "ESCROW_FULFILLMENT_FAILED",
        `Failed to fulfill escrow: ${fulfillResult.error}`,
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[API Escrow Fulfill] [${requestId}] Escrow fulfilled successfully: ${fulfillResult.txHash}`,
    );

    // 10. Format the response
    const response = {
      escrowId,
      internalId: escrowRecord.internalId,
      transactionHash: fulfillResult.txHash,
      status: "fulfilled",
      amount: parseInt(escrowRecord.amount), // Convert from decimal to cents
      fulfillerAddress,
      fulfilledAt: new Date().toISOString(),
      message: `Escrow fulfilled successfully. Funds have been transferred to your wallet.`,
    };

    // Return a standardized success response
    const successResponse = createApiResponse(response);
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Escrow Fulfill] [${requestId}] Error fulfilling escrow:`,
      error,
    );

    // Enhanced error handling for specific, predictable errors
    if (error.message) {
      // Handle escrow not found errors
      if (
        error.message.toLowerCase().includes("escrow") &&
        error.message.toLowerCase().includes("not found")
      ) {
        const errorResponse = createApiError(
          "NOT_FOUND",
          "Escrow not found or does not exist.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle already fulfilled errors
      if (
        error.message.toLowerCase().includes("already fulfilled") ||
        error.message.toLowerCase().includes("completed")
      ) {
        const errorResponse = createApiError(
          "CONFLICT",
          "This escrow has already been fulfilled.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle expired escrow errors
      if (
        error.message.toLowerCase().includes("expired") ||
        error.message.toLowerCase().includes("expiration")
      ) {
        const errorResponse = createApiError(
          "CONFLICT",
          "This escrow has expired and cannot be fulfilled.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle authorization errors
      if (
        error.message.toLowerCase().includes("unauthorized") ||
        error.message.toLowerCase().includes("permission")
      ) {
        const errorResponse = createApiError(
          "FORBIDDEN",
          "You are not authorized to fulfill this escrow.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle invalid proof errors
      if (
        error.message.toLowerCase().includes("proof") ||
        error.message.toLowerCase().includes("verification")
      ) {
        const errorResponse = createApiError(
          "VALIDATION_ERROR",
          "Invalid or missing proof for escrow fulfillment.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle wallet not found errors
      if (
        error.message.toLowerCase().includes("wallet") &&
        error.message.toLowerCase().includes("not found")
      ) {
        const errorResponse = createApiError(
          "WALLET_ERROR",
          "Your wallet could not be accessed. Please contact support.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle network/connectivity errors
      if (
        error.message.toLowerCase().includes("network") ||
        error.message.toLowerCase().includes("connection") ||
        error.message.toLowerCase().includes("timeout")
      ) {
        const errorResponse = createApiError(
          "NETWORK_ERROR",
          "Network error occurred. Please try again in a few moments.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Return a generic server error for any other cases
    const errorResponse = createApiError(
      "SERVER_ERROR",
      "An unexpected error occurred while fulfilling your escrow. Please try again.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
