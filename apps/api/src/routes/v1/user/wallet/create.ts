import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { Auth, Database, Schema } from "@triggerr/core";
import { eq } from "drizzle-orm";
import { WalletService } from "@triggerr/wallet-service";

/**
 * Handles POST requests for the /api/v1/user/wallet/create endpoint.
 *
 * This endpoint creates a new custodial wallet for the authenticated user.
 * It's primarily used as a fallback when the automatic wallet creation
 * during sign-in fails or when a user somehow doesn't have a wallet.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleCreateWallet(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(`[API Create Wallet] [${requestId}] Received request`);

  // 1. Validate request method
  if (request.method !== "POST") {
    console.warn(
      `[API Create Wallet] [${requestId}] Invalid method: ${request.method}`,
    );
    const errorResponse = createApiError(
      "METHOD_NOT_ALLOWED",
      "Only POST requests are allowed for this endpoint.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Authentication check
  const authContext = await Auth.getAuthContext(
    request.headers,
    request.headers.get("Cookie") || undefined,
  );

  if (!authContext.isAuthenticated || !authContext.user?.id) {
    console.warn(`[API Create Wallet] [${requestId}] User not authenticated`);
    const errorResponse = createApiError(
      "UNAUTHORIZED",
      "User must be authenticated to create a wallet.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = authContext.user.id;
  console.log(
    `[API Create Wallet] [${requestId}] Creating wallet for user: ${userId}`,
  );

  // Set RLS context for database operations
  await Auth.setRLSContext(authContext);

  try {
    // 3. Check if user already has a wallet
    console.log(
      `[API Create Wallet] [${requestId}] Checking for existing wallet...`,
    );
    const existingWallet = await Database.db.query.userWallets.findFirst({
      where: eq(Schema.userWalletsSchema.userId, userId),
    });

    if (existingWallet) {
      console.log(
        `[API Create Wallet] [${requestId}] User already has wallet: ${existingWallet.address}`,
      );
      const responseData = {
        walletCreated: false,
        internalWalletId: existingWallet.id,
        address: existingWallet.address,
        isPrimary: existingWallet.isPrimary,
        message: "User already has an existing wallet.",
      };

      return new Response(JSON.stringify(createApiResponse(responseData)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Create new wallet
    console.log(
      `[API Create Wallet] [${requestId}] No existing wallet found. Creating new wallet...`,
    );

    let newWallet;
    try {
      const walletService = new WalletService();
      newWallet = await walletService.createWallet(userId, "PAYGO");

      console.log(
        `[API Create Wallet] [${requestId}] Wallet created successfully:`,
      );
      console.log(
        `[API Create Wallet] [${requestId}] - Wallet ID: ${newWallet.internalWalletId}`,
      );
      console.log(
        `[API Create Wallet] [${requestId}] - PayGo Address: ${newWallet.address}`,
      );
    } catch (walletError: any) {
      console.error(
        `[API Create Wallet] [${requestId}] Wallet creation failed:`,
        walletError.message,
      );

      // Handle duplicate wallet error (race condition)
      if (
        walletError.message?.includes("duplicate") ||
        walletError.message?.includes("unique constraint") ||
        walletError.message?.includes("user_wallets_user_unique")
      ) {
        console.log(
          `[API Create Wallet] [${requestId}] Race condition detected - checking for wallet created by concurrent request...`,
        );

        const raceConditionWallet =
          await Database.db.query.userWallets.findFirst({
            where: eq(Schema.userWalletsSchema.userId, userId),
          });

        if (raceConditionWallet) {
          console.log(
            `[API Create Wallet] [${requestId}] Race condition resolved - returning existing wallet`,
          );
          const responseData = {
            walletCreated: false,
            internalWalletId: raceConditionWallet.id,
            address: raceConditionWallet.address,
            isPrimary: raceConditionWallet.isPrimary,
            message: "Wallet was created by a concurrent request.",
          };

          return new Response(JSON.stringify(createApiResponse(responseData)), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Re-throw the error if it's not a race condition or if race condition couldn't be resolved
      throw walletError;
    }

    // 5. Return success response
    const responseData = {
      walletCreated: true,
      internalWalletId: newWallet.internalWalletId,
      address: newWallet.address,
      isPrimary: true,
      message: "Wallet created successfully.",
    };

    console.log(
      `[API Create Wallet] [${requestId}] Request completed successfully`,
    );

    return new Response(JSON.stringify(createApiResponse(responseData)), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Create Wallet] [${requestId}] Unexpected error:`,
      error.message,
    );
    console.error(
      `[API Create Wallet] [${requestId}] Error stack:`,
      error.stack,
    );

    // Determine appropriate error response
    const isValidationError =
      error.message?.includes("validation") ||
      error.message?.includes("constraint") ||
      error.message?.includes("duplicate");

    if (isValidationError) {
      const errorResponse = createApiError(
        "VALIDATION_ERROR",
        `Wallet creation failed: ${error.message}`,
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorResponse = createApiError(
      "SERVER_ERROR",
      "An unexpected error occurred while creating the wallet.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
