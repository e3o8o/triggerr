import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { Wallet } from "@triggerr/api-contracts";
import { WalletService } from "@triggerr/wallet-service";
import { Auth } from "@triggerr/core";
import type { BlockchainProviderName } from "@triggerr/blockchain-interface";

/**
 * Handles POST requests for the /api/v1/wallet/generate-anonymous endpoint.
 *
 * This endpoint allows an anonymous user to request the creation of a new,
 * temporary custodial wallet on a specified blockchain. The wallet is associated
 * with their anonymous session ID.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleGenerateAnonymousWallet(
  request: Request,
  walletService: WalletService,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(
    `[API Generate Anonymous Wallet] [${requestId}] Received request.`,
  );

  try {
    // 1. Get anonymous session ID from headers
    const anonymousSessionId = await Auth.getAnonymousSessionId(
      request.headers,
    );
    if (!anonymousSessionId) {
      console.warn(
        `[API Generate Anonymous Wallet] [${requestId}] Missing anonymous session ID.`,
      );
      const errorResponse = createApiError(
        "UNAUTHORIZED",
        "Anonymous session ID is required.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult =
      Wallet.validators.generateAnonymousRequest.safeParse(body);

    if (!validationResult.success) {
      console.warn(
        `[API Generate Anonymous Wallet] [${requestId}] Request validation failed:`,
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

    // Default to 'PAYGO' if no chain is specified by the client
    const chain = (validationResult.data.chain ||
      "PAYGO") as BlockchainProviderName;

    console.log(
      `[API Generate Anonymous Wallet] [${requestId}] Requesting new ${chain} wallet for session: ${anonymousSessionId}`,
    );

    // 3. Use the injected WalletService instance to create the custodial wallet
    const newWallet = await walletService.createWallet(
      anonymousSessionId, // We use the session ID as the temporary user ID
      chain,
    );

    console.log(
      `[API Generate Anonymous Wallet] [${requestId}] Successfully created wallet ${newWallet.address} on chain ${chain}.`,
    );

    // 4. Format and return the response
    const responseData = {
      address: newWallet.address,
      chain: chain,
      message: `New ${chain} wallet generated successfully for your session.`,
    };

    const successResponse = createApiResponse(responseData);
    return new Response(JSON.stringify(successResponse), {
      status: 201, // 201 Created
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Generate Anonymous Wallet] [${requestId}] An unexpected error occurred:`,
      error,
    );

    // Handle potential errors, like an unsupported chain being requested
    if (error.message.includes("Unsupported blockchain provider")) {
      const errorResponse = createApiError("BAD_REQUEST", error.message);
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorResponse = createApiError(
      "SERVER_ERROR",
      "An unexpected error occurred while generating the wallet.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
