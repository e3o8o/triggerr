import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { faucetRequestSchema } from "@triggerr/api-contracts/validators/wallet";
import type {
  FaucetRequest,
  UserFaucetResponse,
} from "@triggerr/api-contracts/dtos/wallet";
import { WalletService } from "@triggerr/wallet-service";
import { getAuthContext, setRLSContext } from "@triggerr/core/auth";
import { db } from "@triggerr/core/database";
import { userWallets } from "@triggerr/core/database/schema";
import { eq, and } from "drizzle-orm";
import type { Hex } from "viem";
import type { BlockchainProviderName } from "@triggerr/blockchain-interface";

/**
 * Handles POST requests for the /api/v1/user/wallet/faucet endpoint.
 *
 * Requests funds from the system faucet for the authenticated user's primary wallet.
 * This is primarily for testing purposes in development/staging environments.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleFaucetRequest(
  request: Request,
  walletService: WalletService,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(`[API Faucet] [${requestId}] Received faucet request`);

  try {
    // 1. Authenticate user and set RLS context
    const authContext = await getAuthContext(
      request.headers,
      request.headers.get("Cookie") || undefined,
    );

    if (!authContext.isAuthenticated || !authContext.user?.id) {
      console.warn(`[API Faucet] [${requestId}] User not authenticated`);
      const errorResponse = createApiError(
        "UNAUTHORIZED",
        "You must be logged in to request faucet funds.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = authContext.user.id;
    console.log(`[API Faucet] [${requestId}] Authenticated user: ${userId}`);

    // Set RLS context for database operations
    await setRLSContext(authContext);

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = faucetRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.warn(
        `[API Faucet] [${requestId}] Request validation failed:`,
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

    const data: FaucetRequest = {
      ...(validationResult.data.amount !== undefined && {
        amount: validationResult.data.amount,
      }),
      ...(validationResult.data.reason !== undefined && {
        reason: validationResult.data.reason,
      }),
    };

    // 3. Get user's primary wallet
    const userWalletResult = await db
      .select({
        id: userWallets.id,
        address: userWallets.address,
        chain: userWallets.chain,
      })
      .from(userWallets)
      .where(
        and(eq(userWallets.userId, userId), eq(userWallets.isPrimary, true)),
      )
      .limit(1);

    if (userWalletResult.length === 0) {
      console.warn(
        `[API Faucet] [${requestId}] No primary wallet found for user ${userId}`,
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
    const recipientAddress = userWallet.address as Hex;
    const recipientChain = userWallet.chain as BlockchainProviderName;

    // 4. Determine faucet amount (default to $100.00 if not specified)
    const defaultFaucetAmount = 10000; // $100.00 in cents
    const faucetAmountCents = data.amount || defaultFaucetAmount;
    const faucetAmountDollars = (faucetAmountCents / 100).toFixed(2);

    console.log(
      `[API Faucet] [${requestId}] Requesting ${faucetAmountDollars} USD for wallet ${recipientAddress}`,
    );

    // 5. Get current balance before faucet
    const currentBalance = await walletService.getAccountBalance(
      recipientAddress,
      recipientChain,
    );
    const currentBalanceCents = parseInt(currentBalance.balance);

    // 6. Use the injected WalletService instance to request faucet funds
    const result = await walletService.requestFaucetFunds(
      userId,
      recipientAddress,
      faucetAmountDollars,
    );

    console.log(
      `[API Faucet] [${requestId}] Faucet successful: ${result.hash}`,
    );

    // 7. Calculate new balance (estimate)
    const estimatedNewBalanceCents = currentBalanceCents + faucetAmountCents;

    // 8. Format the response according to the DTO
    const response: UserFaucetResponse = {
      success: true,
      amount: faucetAmountCents,
      txHash: result.hash,
      newBalance: estimatedNewBalanceCents,
      message: `Successfully sent $${faucetAmountDollars} to your wallet`,
      nextRequestAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };

    // Return a standardized success response
    const successResponse = createApiResponse(response);
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Faucet] [${requestId}] Error processing faucet request:`,
      error,
    );

    // Enhanced error handling for specific, predictable errors
    if (error.message) {
      // Handle insufficient faucet funds
      if (
        error.message.toLowerCase().includes("insufficient funds") ||
        error.message.toLowerCase().includes("faucet")
      ) {
        const errorResponse = createApiError(
          "SERVICE_UNAVAILABLE",
          "The faucet is temporarily unavailable due to insufficient funds. Please try again later.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle rate limiting (if implemented in the future)
      if (
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("too many requests")
      ) {
        const errorResponse = createApiError(
          "RATE_LIMITED",
          "You have exceeded the faucet request limit. Please wait before making another request.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 429,
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
    }

    // Return a generic server error for any other cases
    const errorResponse = createApiError(
      "SERVER_ERROR",
      "An unexpected error occurred while processing your faucet request. Please try again.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
