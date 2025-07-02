import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";
import { PolicyEngine } from "@triggerr/policy-engine";
import { EscrowManager, EscrowEngineFactory } from "@triggerr/escrow-engine";
import { BlockchainServiceRegistry } from "@triggerr/blockchain-interface";
import { Logger } from "@triggerr/core/logging";
import { getAuthContext, setRLSContext } from "@triggerr/core/auth";

// Request validation schema
const policyPurchaseRequestSchema = z.object({
  quoteId: z.string().min(1, "Quote ID is required"),
  buyerWalletAddress: z
    .string()
    .min(1, "Buyer wallet address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format"),
  buyerPrivateKey: z
    .string()
    .min(1, "Buyer private key is required")
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid private key format"),
  chain: z.enum(["PAYGO", "ETHEREUM", "BASE", "SOLANA"]).default("PAYGO"),
  paymentMethod: z
    .enum(["CRYPTO_ESCROW", "STRIPE_CARD"])
    .default("CRYPTO_ESCROW"),
  metadata: z
    .object({
      deviceInfo: z.string().optional(),
      referrer: z.string().optional(),
      campaignId: z.string().optional(),
    })
    .optional(),
});

type PolicyPurchaseRequest = z.infer<typeof policyPurchaseRequestSchema>;

/**
 * Handles POST requests for the /api/v1/policy/purchase endpoint.
 *
 * This endpoint orchestrates the complete policy purchase flow:
 * 1. Validates the quote and request
 * 2. Creates a policy record
 * 3. Funds the policy escrow on-chain
 * 4. Activates the policy
 */
export async function handleAnonymousPolicyPurchase(
  request: Request,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(
    `[API Policy Purchase] [${requestId}] Received policy purchase request`,
  );

  let body: PolicyPurchaseRequest;
  let userId: string;

  try {
    // Step 1: Authenticate user
    const authContext = await getAuthContext(
      request.headers,
      request.headers.get("Cookie") || undefined,
    );

    if (!authContext.isAuthenticated || !authContext.user?.id) {
      console.warn(
        `[API Policy Purchase] [${requestId}] User not authenticated`,
      );
      return new Response(
        JSON.stringify(
          createApiError(
            "UNAUTHORIZED",
            "User must be authenticated to purchase a policy.",
          ),
        ),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    userId = authContext.user.id;
    await setRLSContext(authContext);

    console.log(
      `[API Policy Purchase] [${requestId}] Authenticated user: ${userId}`,
    );

    // Step 2: Parse and validate request body
    const rawBody = await request.json();
    body = policyPurchaseRequestSchema.parse(rawBody);

    console.log(
      `[API Policy Purchase] [${requestId}] Validated request for quote ${body.quoteId} on ${body.chain}`,
    );
  } catch (error) {
    console.warn(
      `[API Policy Purchase] [${requestId}] Request validation failed:`,
      error,
    );

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify(
          createApiError("VALIDATION_ERROR", "Invalid request format", {
            details: error.format(),
          }),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify(
        createApiError("INVALID_JSON", "Invalid JSON in request body"),
      ),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // Step 3: Initialize services
    const logger = new Logger("PolicyPurchaseAPI");
    const blockchainRegistry = new BlockchainServiceRegistry();
    const escrowEngineFactory = new EscrowEngineFactory(blockchainRegistry);
    const escrowManager = new EscrowManager(escrowEngineFactory);
    const policyEngine = new PolicyEngine(escrowManager, logger);

    console.log(
      `[API Policy Purchase] [${requestId}] Services initialized successfully`,
    );

    // Step 4: Prepare policy purchase request
    const policyRequest = {
      quoteId: body.quoteId,
      userId: userId,
      buyerWalletAddress: body.buyerWalletAddress,
      buyerPrivateKey: body.buyerPrivateKey,
      chain: body.chain,
    };

    console.log(
      `[API Policy Purchase] [${requestId}] Calling PolicyEngine for quote ${body.quoteId}`,
    );

    // Step 5: Create policy using PolicyEngine
    const policyResponse =
      await policyEngine.createPolicyFromQuote(policyRequest);

    console.log(
      `[API Policy Purchase] [${requestId}] Policy created successfully: ${policyResponse.policyId}`,
    );

    // Step 6: Return successful response
    const responseData = {
      policyId: policyResponse.policyId,
      policyNumber: policyResponse.policyNumber,
      transactionHash: policyResponse.transactionHash,
      escrowId: policyResponse.escrowId,
      status: "ACTIVE",
      activatedAt: new Date().toISOString(),
      message: policyResponse.message,
      metadata: {
        requestId,
        chain: body.chain,
        paymentMethod: body.paymentMethod,
        processingTime: Date.now(),
      },
    };

    return new Response(JSON.stringify(createApiResponse(responseData)), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Policy Purchase] [${requestId}] Policy purchase failed:`,
      error,
    );

    // Handle specific PolicyEngine errors
    if (error.message === "QuoteNotFound") {
      return new Response(
        JSON.stringify(
          createApiError(
            "QUOTE_NOT_FOUND",
            "The specified quote was not found. Please generate a new quote.",
            { quoteId: body.quoteId },
          ),
        ),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    if (error.message === "QuoteExpired") {
      return new Response(
        JSON.stringify(
          createApiError(
            "QUOTE_EXPIRED",
            "The quote has expired. Please generate a new quote to proceed with the purchase.",
            { quoteId: body.quoteId },
          ),
        ),
        { status: 410, headers: { "Content-Type": "application/json" } },
      );
    }

    if (error.message === "QuoteAlreadyUsed") {
      return new Response(
        JSON.stringify(
          createApiError(
            "QUOTE_ALREADY_USED",
            "This quote has already been used for a policy purchase. Please generate a new quote.",
            { quoteId: body.quoteId },
          ),
        ),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    if (error.message === "QuoteLockFailed") {
      return new Response(
        JSON.stringify(
          createApiError(
            "QUOTE_LOCK_FAILED",
            "Unable to secure the quote for purchase. It may have been purchased by another request. Please try again.",
            { quoteId: body.quoteId },
          ),
        ),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    if (error.message === "DatabaseInsertFailed") {
      return new Response(
        JSON.stringify(
          createApiError(
            "DATABASE_ERROR",
            "Unable to create policy record. Please try again.",
            { requestId },
          ),
        ),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (error.message === "PolicyUpdateFailed") {
      return new Response(
        JSON.stringify(
          createApiError(
            "POLICY_UPDATE_FAILED",
            "Policy was created but could not be activated. Please contact support.",
            { requestId },
          ),
        ),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Handle blockchain/escrow related errors
    if (
      error.message?.includes("insufficient funds") ||
      error.message?.includes("balance")
    ) {
      return new Response(
        JSON.stringify(
          createApiError(
            "INSUFFICIENT_FUNDS",
            "Insufficient funds in the specified wallet to purchase this policy.",
            { walletAddress: body.buyerWalletAddress },
          ),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (
      error.message?.includes("escrow") ||
      error.message?.includes("transaction")
    ) {
      return new Response(
        JSON.stringify(
          createApiError(
            "BLOCKCHAIN_ERROR",
            "Unable to process the blockchain transaction. Please check your wallet and try again.",
            { chain: body.chain, requestId },
          ),
        ),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    if (error.message?.includes("Platform wallet address is not configured")) {
      return new Response(
        JSON.stringify(
          createApiError(
            "SERVICE_CONFIGURATION_ERROR",
            "The insurance service is temporarily unavailable due to configuration issues. Please try again later.",
            { requestId },
          ),
        ),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    // Generic server error for any other cases
    return new Response(
      JSON.stringify(
        createApiError(
          "POLICY_PURCHASE_FAILED",
          "An unexpected error occurred during policy purchase. Please try again later or contact support.",
          { requestId },
        ),
      ),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
