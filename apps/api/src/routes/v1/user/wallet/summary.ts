import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { Auth } from "@triggerr/core";
import { Database } from "@triggerr/core";
import { Schema } from "@triggerr/core";
import { eq } from "drizzle-orm";
import { WalletService } from "@triggerr/wallet-service";
import type { BlockchainProviderName } from "@triggerr/blockchain-interface";
import type { Hex } from "viem";
import {
  formatBalanceDisplay,
  formatAddressDisplay,
} from "@triggerr/blockchain";

/**
 * Handles GET requests for the /api/v1/user/wallets/summary endpoint.
 *
 * Fetches all wallets associated with the authenticated user, gets their
 * current balances from the respective blockchains, and returns a
read-only summary.
 */
export async function handleGetWalletsSummary(
  request: Request,
  walletService: WalletService,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(`[API Wallets Summary] [${requestId}] Received request.`);

  try {
    // 1. Authenticate user and set RLS context
    const authContext = await Auth.getAuthContext(request.headers);
    if (!authContext.isAuthenticated || !authContext.user?.id) {
      return new Response(
        JSON.stringify(
          createApiError("UNAUTHORIZED", "User must be authenticated."),
        ),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const userId = authContext.user.id;
    await Auth.setRLSContext(authContext);

    // 2. Fetch all wallets for the user from the database
    const walletsInDb = await Database.db.query.userWallets.findMany({
      where: eq(Schema.userWalletsSchema.userId, userId),
      orderBy: (wallets: any, { desc }: any) => [desc(wallets.createdAt)],
    });

    if (walletsInDb.length === 0) {
      return new Response(
        JSON.stringify(
          createApiResponse({ wallets: [], totalBalanceUSD: "0.00" }),
        ),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. Fetch balance for each wallet concurrently
    const balancePromises = walletsInDb.map((wallet: any) =>
      walletService
        .getAccountBalance(
          wallet.address as Hex,
          wallet.chain as BlockchainProviderName,
        )
        .catch((error) => {
          // Prevent one failed balance check from failing the whole endpoint
          console.error(
            `[API Wallets Summary] [${requestId}] Failed to get balance for ${wallet.address} on ${wallet.chain}:`,
            error,
          );
          return { balance: "0", nonce: "0", error: "Failed to fetch balance" };
        }),
    );

    const balances = await Promise.all(balancePromises);

    // 4. Aggregate and format the response
    // TODO: Implement a price oracle to get real USD values for different chain tokens.
    // For now, we assume all balances are in a similar "cent-like" unit for aggregation.
    let totalBalanceCents = 0n;
    const walletSummaries = walletsInDb.map((wallet: any, index: number) => {
      const balanceInfo = balances[index];
      const balanceBigInt = BigInt(balanceInfo.balance || "0");
      totalBalanceCents += balanceBigInt;

      return {
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        walletType: wallet.walletType,
        balance: balanceInfo.balance || "0",
        formattedBalance: formatBalanceDisplay(balanceBigInt),
        isPrimary: wallet.isPrimary,
        error: balanceInfo.error || null,
      };
    });

    const responseData = {
      totalBalanceUSD: (Number(totalBalanceCents) / 100).toFixed(2), // Simplistic USD conversion
      wallets: walletSummaries,
    };

    return new Response(JSON.stringify(createApiResponse(responseData)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Wallets Summary] [${requestId}] An unexpected error occurred:`,
      error,
    );
    return new Response(
      JSON.stringify(
        createApiError(
          "SERVER_ERROR",
          "An unexpected error occurred while fetching wallet summary.",
        ),
      ),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
