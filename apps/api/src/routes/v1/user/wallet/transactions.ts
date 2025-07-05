import { isAddress, type Hex } from "viem";
import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { WalletService } from "@triggerr/wallet-service";
import { Auth } from "@triggerr/core";
import { Database } from "@triggerr/core";
import { Schema } from "@triggerr/core";
import { eq, and } from "drizzle-orm";
import { getPayGoClient } from "@triggerr/paygo-adapter";
import { getTransactionHistory } from "@triggerr/paygo-adapter";

/**
 * Transaction type for client consumption
 */
interface TransactionResponse {
  id: string;
  type:
    | "send"
    | "receive"
    | "escrow_create"
    | "escrow_fulfill"
    | "escrow_release"
    | "faucet";
  amount: string;
  formattedAmount: string;
  from?: string;
  to?: string;
  date: string;
  hash: string;
  metadata?: Record<string, any>;
}

/**
 * Handles GET requests for the /api/v1/user/wallet/transactions endpoint.
 *
 * Fetches the transaction history for an authenticated user's wallet by
 * querying the PayGo blockchain via the enhanced PayGoClientService.
 *
 * @param {Request} req - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleGetTransactions(
  req: Request,
  walletService: WalletService,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(`[API Get Transactions] [${requestId}] Received request.`);

  // 1. Authenticate user and set RLS context
  const authContext = await Auth.getAuthContext(
    req.headers,
    req.headers.get("Cookie") || undefined,
  );

  if (!authContext.isAuthenticated || !authContext.user?.id) {
    console.warn(
      `[API Get Transactions] [${requestId}] User not authenticated.`,
    );
    return new Response(
      JSON.stringify(
        createApiError("UNAUTHORIZED", "User must be authenticated."),
      ),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const userId = authContext.user.id;
  console.log(
    `[API Get Transactions] [${requestId}] Authenticated user: ${userId}`,
  );

  // Set RLS context for database operations
  await Auth.setRLSContext(authContext);

  try {
    const { searchParams } = new URL(req.url);

    // Get optional address parameter
    let walletAddress = searchParams.get("address") as Hex | null;

    // If no address provided, get user's primary wallet address
    if (!walletAddress) {
      const userWallet = await Database.db.query.userWallets.findFirst({
        where: eq(Schema.userWalletsSchema.userId, userId),
        columns: {
          address: true,
        },
      });

      if (!userWallet) {
        return new Response(
          JSON.stringify(
            createApiError("NOT_FOUND", "No wallet found for this user."),
          ),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      walletAddress = userWallet.address as Hex;
    } else if (!isAddress(walletAddress)) {
      return new Response(
        JSON.stringify(
          createApiError("BAD_REQUEST", "Invalid wallet address format."),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(
      `[API Get Transactions] [${requestId}] Fetching transaction history for address: ${walletAddress}`,
    );

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Initialize PayGo client
    const paygoClient = await getPayGoClient();

    // Fetch and parse transactions from PayGo blockchain
    const result = await getTransactionHistory(
      paygoClient.getClient(),
      walletAddress,
      {
        page,
        limit,
      },
    );

    const { transactions: parsedTransactions, pagination } = result;

    // Convert ParsedTransaction format to API response format
    const formattedTransactions: TransactionResponse[] = parsedTransactions.map(
      (tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        formattedAmount: tx.formattedAmount,
        ...(tx.from && { from: tx.from }),
        ...(tx.to && { to: tx.to }),
        date: tx.date,
        hash: tx.hash,
        ...(tx.metadata && { metadata: tx.metadata }),
      }),
    );

    const responseData = {
      pagination,
      transactions: formattedTransactions,
      message: `Transaction history retrieved successfully for ${walletAddress}. Found ${pagination.totalItems} transaction(s).`,
    };

    console.log(
      `[API Get Transactions] [${requestId}] Returning ${formattedTransactions.length} transactions (page ${pagination.page}/${pagination.totalPages}) from PayGo blockchain`,
    );

    return new Response(JSON.stringify(createApiResponse(responseData)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Get Transactions] [${requestId}] Error retrieving transaction history:`,
      error,
    );

    // Enhanced error handling for specific PayGo errors
    if (error.message) {
      // Handle network/connectivity errors
      if (
        error.message.toLowerCase().includes("network") ||
        error.message.toLowerCase().includes("connection") ||
        error.message.toLowerCase().includes("timeout")
      ) {
        const errorResponse = createApiError(
          "NETWORK_ERROR",
          "Network error occurred while fetching transaction history. Please try again.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle PayGo client errors
      if (
        error.message.toLowerCase().includes("paygo") ||
        error.message.toLowerCase().includes("client")
      ) {
        const errorResponse = createApiError(
          "SERVICE_UNAVAILABLE",
          "Blockchain service is temporarily unavailable. Please try again later.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 503,
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
          "The wallet address is invalid or not found on the network.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Return a generic server error for any other cases
    const errorResponse = createApiError(
      "SERVER_ERROR",
      "An unexpected error occurred while retrieving transaction history.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
