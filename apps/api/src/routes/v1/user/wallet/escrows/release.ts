import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";
import { EscrowManager } from "@triggerr/escrow-engine";
import { Auth } from "@triggerr/core";
import { Database } from "@triggerr/core";
import { Schema } from "@triggerr/core";
import { eq, and } from "drizzle-orm";
import type { Hex } from "viem";

// Request validation schema
const releaseEscrowRequestSchema = z.object({
  escrowId: z.string().min(1, "Escrow ID is required"),
  reason: z.string().optional(), // Optional reason for the release
});

type ReleaseEscrowRequest = z.infer<typeof releaseEscrowRequestSchema>;

/**
 * Handles POST requests for the /api/v1/user/wallet/escrows/release endpoint.
 *
 * Allows the escrow creator to release an escrow and reclaim the funds.
 * This is typically done when an escrow has expired without being fulfilled,
 * or under other specific conditions allowed by the escrow terms.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleReleaseEscrowRequest(
  request: Request,
  escrowManager: EscrowManager,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(
    `[API Escrow Release] [${requestId}] Received release escrow request`,
  );

  try {
    // 1. Authenticate user and set RLS context
    const authContext = await Auth.getAuthContext(
      request.headers,
      request.headers.get("Cookie") || undefined,
    );

    if (!authContext.isAuthenticated || !authContext.user?.id) {
      console.warn(
        `[API Escrow Release] [${requestId}] User not authenticated`,
      );
      const errorResponse = createApiError(
        "UNAUTHORIZED",
        "You must be logged in to release an escrow.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = authContext.user.id;
    console.log(
      `[API Escrow Release] [${requestId}] Authenticated user: ${userId}`,
    );

    // Set RLS context for database operations
    await Auth.setRLSContext(authContext);

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = releaseEscrowRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.warn(
        `[API Escrow Release] [${requestId}] Request validation failed:`,
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

    const data: ReleaseEscrowRequest = validationResult.data;
    const { escrowId, reason } = data;

    // 3. Get user's primary wallet to verify they can release the escrow
    const userWalletResult = await Database.db
      .select({
        id: Schema.userWalletsSchema.id,
        address: Schema.userWalletsSchema.address,
      })
      .from(Schema.userWalletsSchema)
      .where(
        and(
          eq(Schema.userWalletsSchema.userId, userId),
          eq(Schema.userWalletsSchema.isPrimary, true),
        ),
      )
      .limit(1);

    if (userWalletResult.length === 0) {
      console.warn(
        `[API Escrow Release] [${requestId}] No primary wallet found for user ${userId}`,
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
    const creatorAddress = userWallet.address as Hex;

    // 4. Verify the escrow exists and user is authorized to release it
    const escrowRecord = await Database.db.query.escrow.findFirst({
      where: eq(Schema.escrowSchema.blockchainId, escrowId),
    });

    if (!escrowRecord) {
      console.warn(
        `[API Escrow Release] [${requestId}] Escrow not found: ${escrowId}`,
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

    // 5. Verify user is the creator of the escrow
    if (escrowRecord.userId && escrowRecord.userId !== userId) {
      console.warn(
        `[API Escrow Release] [${requestId}] User ${userId} is not authorized to release escrow ${escrowId}`,
      );
      const errorResponse = createApiError(
        "FORBIDDEN",
        "You are not authorized to release this escrow. Only the creator can release an escrow.",
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
        "This escrow has already been fulfilled and cannot be released.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (escrowRecord.status === "RELEASED") {
      const errorResponse = createApiError(
        "CONFLICT",
        "This escrow has already been released.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 7. Check if escrow can be released (typically after expiration)
    const now = new Date();
    const canReleaseAfterExpiration =
      escrowRecord.expiresAt && now > escrowRecord.expiresAt;

    // For now, we allow release after expiration or if no fulfiller is set
    // In the future, additional business rules could be added here
    const canRelease =
      canReleaseAfterExpiration || !escrowRecord.fulfillerAddress;

    if (!canRelease) {
      const expirationDate = escrowRecord.expiresAt?.toISOString() || "unknown";
      const errorResponse = createApiError(
        "CONFLICT",
        `This escrow cannot be released yet. It will be available for release after ${expirationDate}.`,
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[API Escrow Release] [${requestId}] Releasing escrow ${escrowId} for user ${userId}`,
    );

    // 8. Use the injected EscrowManager instance to release the escrow
    const releaseResult = await escrowManager.releaseEscrow(
      escrowId as Hex,
      (reason as "EXPIRED" | "USER_RELEASE") || "EXPIRED",
    );

    if (!releaseResult.success) {
      console.error(
        `[API Escrow Release] [${requestId}] Escrow release failed: ${releaseResult.error}`,
      );
      const errorResponse = createApiError(
        "ESCROW_RELEASE_FAILED",
        `Failed to release escrow: ${releaseResult.error}`,
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[API Escrow Release] [${requestId}] Escrow released successfully: ${releaseResult.txHash}`,
    );

    // 9. Format the response
    const recipientAddress = escrowRecord.fulfillerAddress;

    const response = {
      escrowId,
      internalId: escrowRecord.internalId,
      transactionHash: releaseResult.txHash,
      status: "released",
      amount: parseInt(escrowRecord.amount), // Convert from decimal to cents
      creatorAddress,
      releasedAt: new Date().toISOString(),
      reason: reason || "EXPIRED",
      message: `Escrow released successfully. Funds have been returned to your wallet.`,
    };

    // Return a standardized success response
    const successResponse = createApiResponse(response);
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Escrow Release] [${requestId}] Error releasing escrow:`,
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

      // Handle already released errors
      if (
        error.message.toLowerCase().includes("already released") ||
        error.message.toLowerCase().includes("completed")
      ) {
        const errorResponse = createApiError(
          "CONFLICT",
          "This escrow has already been released.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle already fulfilled errors
      if (
        error.message.toLowerCase().includes("fulfilled") ||
        error.message.toLowerCase().includes("claimed")
      ) {
        const errorResponse = createApiError(
          "CONFLICT",
          "This escrow has already been fulfilled and cannot be released.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle premature release errors
      if (
        error.message.toLowerCase().includes("cannot be released") ||
        error.message.toLowerCase().includes("not expired")
      ) {
        const errorResponse = createApiError(
          "CONFLICT",
          "This escrow cannot be released yet. Please wait until it expires.",
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
          "You are not authorized to release this escrow.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
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
      "An unexpected error occurred while releasing your escrow. Please try again.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
