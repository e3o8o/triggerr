import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { getAuthContext, setRLSContext } from "@triggerr/core/auth";
import { db } from "@triggerr/core/database";
import { userWallets } from "@triggerr/core/database/schema";
import { eq } from "drizzle-orm";
import { WalletService } from "@triggerr/wallet-service";
import {
  formatBalanceDisplay,
  formatAddressDisplay,
} from "@triggerr/paygo-adapter/src/utils";
import { isAddress, type Hex } from "viem";
import type { BlockchainProviderName } from "@triggerr/blockchain-interface";

/**
 * Handles GET requests for the /api/v1/user/wallet/info endpoint.
 * Fetches the user's primary wallet address and its current balance from the blockchain.
 */
export async function handleGetWalletInfo(
  req: Request,
  walletService: WalletService,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(`[API Get Wallet Info] [${requestId}] Received request.`);

  // 1. Authenticate user
  const authContext = await getAuthContext(
    req.headers,
    req.headers.get("Cookie") || undefined,
  );

  if (!authContext.isAuthenticated || !authContext.user?.id) {
    console.warn(
      `[API Get Wallet Info] [${requestId}] User not authenticated.`,
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
    `[API Get Wallet Info] [${requestId}] Authenticated user: ${userId}`,
  );

  // Set RLS context for any potential subsequent database operations
  await setRLSContext(authContext);

  try {
    // 2. Fetch user's wallet from the database
    // 2. Fetch user's wallet from the database
    // For now, we assume the user has one primary wallet.
    // In the future, this could be extended to select a specific wallet.
    const wallet = await db.query.userWallets.findFirst({
      where: eq(userWallets.userId, userId),
    });

    if (!wallet) {
      console.warn(
        `[API Get Wallet Info] [${requestId}] No wallet found for user ${userId}.`,
      );
      return new Response(
        JSON.stringify(
          createApiError("NOT_FOUND", "No wallet found for this user."),
        ),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const walletAddress = wallet.address as Hex;
    const walletChain = wallet.chain as BlockchainProviderName;

    // 3. Use the injected service to fetch the on-chain account information
    const accountInfo = await walletService.getAccountBalance(
      walletAddress,
      walletChain,
    );

    // The balance from getAccountBalance is a raw stringified BigInt.
    // Format it correctly for display.
    const balanceAsBigInt = BigInt(accountInfo.balance);
    const formattedBalance = formatBalanceDisplay(balanceAsBigInt);
    const formattedAddress = formatAddressDisplay(walletAddress);

    // 4. Construct the response with real data
    // 4. Construct the response with real data
    const responseData = {
      userId,
      walletAddress: walletAddress,
      chain: walletChain,
      formattedWalletAddress: formattedAddress,
      balance: accountInfo.balance, // Return the raw stringified bigint
      formattedBalance: formattedBalance, // Provide a user-friendly formatted string
      message: "Wallet information retrieved successfully.",
    };

    console.log(
      `[API Get Wallet Info] [${requestId}] Returning wallet info for user ${userId}.`,
    );
    return new Response(JSON.stringify(createApiResponse(responseData)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Get Wallet Info] [${requestId}] An unexpected error occurred:`,
      error,
    );
    return new Response(
      JSON.stringify(
        createApiError(
          "SERVER_ERROR",
          "An unexpected error occurred while retrieving wallet information.",
        ),
      ),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
