import { isAddress, type Hex } from "viem";
import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { Wallet } from "@triggerr/api-contracts";
import { EscrowManager } from "@triggerr/escrow-engine";
import { Auth, Database, Schema, generateUserEscrowId } from "@triggerr/core";
import type { EscrowPurpose } from "@triggerr/core"; // Import the type directly
import { eq, and } from "drizzle-orm";

/**
 * Handles POST requests for the /api/v1/user/wallet/escrows/create endpoint.
 *
 * Creates a new user-initiated escrow on-chain using the EscrowManager.
 * The escrow will lock funds from the user's primary wallet until it's
 * fulfilled by the recipient or released after expiration.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleCreateEscrowRequest(
  request: Request,
  escrowManager: EscrowManager,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(
    `[API Escrow Create] [${requestId}] Received create escrow request`,
  );

  try {
    // 1. Authenticate user and set RLS context
    const authContext = await Auth.getAuthContext(
      request.headers,
      request.headers.get("Cookie") || undefined,
    );

    if (!authContext.isAuthenticated || !authContext.user?.id) {
      console.warn(`[API Escrow Create] [${requestId}] User not authenticated`);
      const errorResponse = createApiError(
        "UNAUTHORIZED",
        "You must be logged in to create an escrow.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = authContext.user.id;
    console.log(
      `[API Escrow Create] [${requestId}] Authenticated user: ${userId}`,
    );

    // Set RLS context for database operations
    await Auth.setRLSContext(authContext);

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult =
      Wallet.validators.escrowCreateRequest.safeParse(body);

    if (!validationResult.success) {
      console.warn(
        `[API Escrow Create] [${requestId}] Request validation failed:`,
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

    const { recipientAddress, amount, expirationInMinutes, purpose } =
      validationResult.data;

    // 3. Validate recipient address format
    if (!isAddress(recipientAddress)) {
      console.warn(
        `[API Escrow Create] [${requestId}] Invalid recipient address: ${recipientAddress}`,
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
        `[API Escrow Create] [${requestId}] No primary wallet found for user ${userId}`,
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
    const senderAddress = userWallet.address as Hex;

    // 5. Generate unique escrow ID using the escrow ID generator
    const { internalId, blockchainId } = generateUserEscrowId(
      userId,
      purpose as EscrowPurpose,
    );

    // 6. Calculate expiration date
    const expirationDate = new Date(
      Date.now() + expirationInMinutes * 60 * 1000,
    );

    // Convert amount string to decimal for EscrowManager (it expects dollars, not cents)
    const amountInDollars = (parseInt(amount) / 100).toFixed(2);

    console.log(
      `[API Escrow Create] [${requestId}] Creating escrow: ${amountInDollars} USD from ${senderAddress} to ${recipientAddress}`,
    );
    console.log(
      `[API Escrow Create] [${requestId}] Escrow details - Internal ID: ${internalId}, Blockchain ID: ${blockchainId}`,
    );

    // 7. Use the injected EscrowManager instance to create the escrow
    const escrowResult = await escrowManager.createEscrow({
      type: "USER",
      userId,
      purpose: purpose as EscrowPurpose,
      userAddress: senderAddress,
      recipientAddress: recipientAddress as Hex,
      premiumAmount: amountInDollars,
      coverageAmount: amountInDollars, // For user escrows, coverage equals premium
      expirationDate,
      configuration: {
        escrowModel: "USER_DEPOSIT",
        premiumReturnPolicy: "RETURN_TO_CUSTOMER",
      },
      metadata: {
        createdBy: "user_api",
        requestId,
        description: `User-initiated ${purpose.toLowerCase()} escrow`,
      },
    });

    if (!escrowResult.success) {
      console.error(
        `[API Escrow Create] [${requestId}] Escrow creation failed: ${escrowResult.error}`,
      );
      const errorResponse = createApiError(
        "ESCROW_CREATION_FAILED",
        `Failed to create escrow: ${escrowResult.error}`,
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[API Escrow Create] [${requestId}] Escrow created successfully: ${escrowResult.txHash}`,
    );

    // 8. Format the response
    const response = {
      escrowId: escrowResult.blockchainId || blockchainId,
      internalId: escrowResult.internalId || internalId,
      transactionHash: escrowResult.txHash,
      status: "created",
      amount: parseInt(amount), // Return amount in cents as received
      recipientAddress,
      expirationDate: expirationDate.toISOString(),
      purpose,
      message: `Escrow of $${amountInDollars} created successfully and will expire on ${expirationDate.toISOString()}`,
    };

    // Return a standardized success response
    const successResponse = createApiResponse(response);
    return new Response(JSON.stringify(successResponse), {
      status: 201, // 201 Created
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Escrow Create] [${requestId}] Error creating escrow:`,
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
          "Insufficient funds in your wallet to create this escrow.",
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

      // Handle escrow configuration errors
      if (
        error.message.toLowerCase().includes("configuration") ||
        error.message.toLowerCase().includes("invalid")
      ) {
        const errorResponse = createApiError(
          "CONFIGURATION_ERROR",
          "The escrow configuration is invalid. Please check your parameters.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
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
      "An unexpected error occurred while creating your escrow. Please try again.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
