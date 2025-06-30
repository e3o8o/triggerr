import { isAddress, type Hex } from "viem";
import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { walletSendRequestSchema } from "@triggerr/api-contracts/validators/wallet";
import type {
  WalletSendRequest,
  WalletSendResponse,
} from "@triggerr/api-contracts/dtos/wallet";
import { WalletService } from "@triggerr/wallet-service";
import { getAuthContext, setRLSContext } from "@triggerr/core/auth";
import { db } from "@triggerr/core/database";
import { userWallets } from "@triggerr/core/database/schema";
import { eq, and } from "drizzle-orm";

/**
 * Handles POST requests for the /api/v1/user/wallet/send endpoint.
 *
 * Transfers funds from the user's primary wallet to another address using the
 * centralized WalletService with secure key management.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleSendFunds(
  request: Request,
  walletService: WalletService,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(`[API Send] [${requestId}] Received send funds request`);

  try {
    // 1. Authenticate user and set RLS context
    const authContext = await getAuthContext(
      request.headers,
      request.headers.get("Cookie") || undefined,
    );

    if (!authContext.isAuthenticated || !authContext.user?.id) {
      console.warn(`[API Send] [${requestId}] User not authenticated`);
      const errorResponse = createApiError(
        "UNAUTHORIZED",
        "You must be logged in to transfer funds.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = authContext.user.id;
    console.log(`[API Send] [${requestId}] Authenticated user: ${userId}`);

    // Set RLS context for database operations
    await setRLSContext(authContext);

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = walletSendRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.warn(
        `[API Send] [${requestId}] Request validation failed:`,
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

    const data: WalletSendRequest = validationResult.data;

    // 3. Validate recipient address format
    if (!isAddress(data.toAddress)) {
      console.warn(
        `[API Send] [${requestId}] Invalid recipient address: ${data.toAddress}`,
      );
      const errorResponse = createApiError(
        "VALIDATION_ERROR",
        "Invalid recipient wallet address format.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Get user's primary wallet
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
        `[API Send] [${requestId}] No primary wallet found for user ${userId}`,
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

    const senderWallet = userWalletResult[0];
    const senderAddress = senderWallet.address as Hex;
    const recipientAddress = data.toAddress as Hex;

    // Convert amount from integer (cents) to decimal string for WalletService
    const amountInDollars = (data.amount / 100).toFixed(2);

    console.log(
      `[API Send] [${requestId}] Initiating transfer: ${amountInDollars} USD from ${senderAddress} to ${recipientAddress}`,
    );

    // 5. Use the injected WalletService instance to perform the transfer
    const result = await walletService.transferFunds(
      userId,
      senderAddress,
      recipientAddress,
      amountInDollars,
    );

    console.log(
      `[API Send] [${requestId}] Transfer successful: ${result.hash}`,
    );

    // 6. Format the response according to the DTO
    const response: WalletSendResponse = {
      transactionId: crypto.randomUUID(), // Generate a unique transaction ID for our system
      txHash: result.hash,
      status: "pending", // Transaction is submitted but not yet confirmed
      amount: data.amount, // Return amount in cents as received
      fee: 0, // PayGo doesn't charge explicit fees in our current setup
      estimatedConfirmation: new Date(Date.now() + 30000).toISOString(), // Estimate 30 seconds for confirmation
      message: `Transfer of $${amountInDollars} initiated successfully`,
    };

    // Return a standardized success response
    const successResponse = createApiResponse(response);
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Send] [${requestId}] Error processing transfer:`,
      error,
    );

    // Enhanced error handling for specific, predictable errors
    if (error.message) {
      // Handle insufficient funds
      if (
        error.message.toLowerCase().includes("insufficient funds") ||
        error.message.toLowerCase().includes("balance")
      ) {
        const errorResponse = createApiError(
          "INSUFFICIENT_FUNDS",
          "Insufficient funds in your wallet to complete this transfer.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle invalid address errors
      if (
        error.message.toLowerCase().includes("invalid address") ||
        error.message.toLowerCase().includes("address")
      ) {
        const errorResponse = createApiError(
          "INVALID_ADDRESS",
          "The recipient address is invalid or not found on the network.",
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
      "An unexpected error occurred while processing your transfer. Please try again.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
