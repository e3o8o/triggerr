import { isAddress, type Hex } from "viem";
import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { WalletService } from "@triggerr/wallet-service"; // Import the WalletService

/**
 * Handles GET requests for the /api/v1/user/wallet/balance endpoint.
 *
 * Fetches the balance and nonce for a given PayGo wallet address using the
 * centralized WalletService.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleGetWalletBalance(
  request: Request,
  walletService: WalletService,
): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("address");

  // 1. Validate input parameters
  if (!walletAddress) {
    const errorResponse = createApiError(
      "BAD_REQUEST",
      "A wallet address query parameter is required.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isAddress(walletAddress)) {
    const errorResponse = createApiError(
      "BAD_REQUEST",
      "The provided wallet address is not a valid address format.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`[API Balance] Fetching balance for: ${walletAddress}`);

  try {
    // Call the WalletService method to get account details
    const accountInfo = await walletService.getAccountBalance(
      walletAddress as Hex,
      "PAYGO",
    );

    // The WalletService.getAccountBalance already converts BigInts to strings,
    // so it's directly serializable.

    // Return a standardized success response
    const successResponse = createApiResponse(accountInfo);
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Balance] Error fetching account balance for ${walletAddress}:`,
      error,
    );

    // Check for specific, known errors from the service layer
    if (error.message && error.message.includes("Account not found")) {
      const errorResponse = createApiError(
        "NOT_FOUND",
        `Wallet address ${walletAddress} not found on the network.`,
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return a standardized error response for all other cases
    const errorResponse = createApiError(
      "SERVER_ERROR",
      "An unexpected error occurred while retrieving the wallet balance.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
