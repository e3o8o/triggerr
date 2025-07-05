import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { Wallet } from "@triggerr/api-contracts";
import { WalletService } from "@triggerr/wallet-service";
import { Auth } from "@triggerr/core";
import type { BlockchainProviderName } from "@triggerr/blockchain-interface";
import { isAddress } from "viem";

/**
 * Handles POST requests for the /api/v1/user/wallet/link-existing endpoint.
 *
 * This endpoint allows an authenticated user to link their own existing,
 * non-custodial wallet (e.g., from Phantom or MetaMask) to their triggerr account.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleLinkExistingWallet(
  request: Request,
  walletService: WalletService,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(`[API Link Existing Wallet] [${requestId}] Received request.`);

  try {
    // 1. Get authenticated user context
    const authContext = await Auth.getAuthContext(request.headers);
    if (!authContext.isAuthenticated || !authContext.user?.id) {
      console.warn(
        `[API Link Existing Wallet] [${requestId}] User not authenticated.`,
      );
      return new Response(
        JSON.stringify(
          createApiError(
            "UNAUTHORIZED",
            "You must be logged in to link a wallet.",
          ),
        ),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const userId = authContext.user.id;

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult =
      Wallet.validators.linkExistingRequest.safeParse(body);

    if (!validationResult.success) {
      console.warn(
        `[API Link Existing Wallet] [${requestId}] Request validation failed:`,
        validationResult.error.format(),
      );
      const errorResponse = createApiError(
        "VALIDATION_ERROR",
        "Invalid request format.",
        { details: validationResult.error.format() },
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { address, chain, publicKey } = validationResult.data;

    // 3. Additional validation for address format
    if (!isAddress(address)) {
      const errorResponse = createApiError(
        "VALIDATION_ERROR",
        "The provided wallet address is not a valid format.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[API Link Existing Wallet] [${requestId}] User ${userId} attempting to link ${chain} wallet: ${address}`,
    );

    // 4. Use the injected WalletService instance to link the non-custodial wallet
    const newWalletRecord = await walletService.linkExistingWallet({
      userId,
      address,
      chain: chain as BlockchainProviderName,
      ...(publicKey && { publicKey }),
    });

    console.log(
      `[API Link Existing Wallet] [${requestId}] Successfully linked wallet. DB record ID: ${newWalletRecord.id}`,
    );

    // 5. Format and return the response
    const responseData = {
      id: newWalletRecord.id,
      address: newWalletRecord.address,
      chain: newWalletRecord.chain,
      walletType: newWalletRecord.walletType,
      message: `${chain} wallet linked successfully.`,
    };

    const successResponse = createApiResponse(responseData);
    return new Response(JSON.stringify(successResponse), {
      status: 201, // 201 Created
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Link Existing Wallet] [${requestId}] An unexpected error occurred:`,
      error,
    );

    // Handle potential unique constraint errors, e.g., wallet already linked
    if (error.message.includes("violates unique constraint")) {
      const errorResponse = createApiError(
        "CONFLICT",
        "This wallet address has already been linked to an account.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorResponse = createApiError(
      "SERVER_ERROR",
      "An unexpected error occurred while linking the wallet.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
