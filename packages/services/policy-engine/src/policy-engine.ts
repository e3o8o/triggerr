/**
 * Policy Engine Service
 *
 * This service orchestrates the conversion of a valid insurance quote into an
 * active, on-chain policy. Its core responsibilities include:
 * 1. Validating the quote to ensure its integrity and prevent reuse.
 * 2. Creating a permanent policy record in the database.
 * 3. Interacting with the EscrowManager to create a funded on-chain escrow.
 * 4. Linking the on-chain transaction back to the policy record.
 * 5. Handling all potential errors in the purchase pipeline gracefully.
 */

import { Database, Schema } from "@triggerr/core";
import type { Logger } from "@triggerr/core";
import { generateId, generatePolicyEscrowId } from "@triggerr/core/utils";
import {
  EscrowManager,
  type EscrowCreateParams,
} from "@triggerr/escrow-engine";
import { and, eq } from "drizzle-orm";

// ============================================================================
// Request and Response Types
// ============================================================================

export interface PolicyPurchaseRequest {
  quoteId: string;
  // Either userId (for authenticated users) or anonymousSessionId (for anonymous users)
  userId?: string;
  anonymousSessionId?: string;
  // The wallet from which the premium will be paid
  buyerWalletAddress: string;
  // The private key for the buyer's wallet to sign the transaction
  buyerPrivateKey: string;
  // The blockchain to operate on
  chain: string; // Multichain support: "PAYGO" | "ETHEREUM" | "BASE" | "SOLANA"
}

export interface PolicyPurchaseResponse {
  policyId: string;
  policyNumber: string;
  transactionHash: string;
  escrowId: string;
  message: string;
}

// Type for a validated quote fetched from the database
type ValidatedQuote = typeof Schema.quote.$inferSelect;

// ============================================================================
// Policy Engine Service
// ============================================================================

export class PolicyEngine {
  private escrowManager: EscrowManager;
  private logger: Logger;

  constructor(escrowManager: EscrowManager, logger: Logger) {
    this.escrowManager = escrowManager;
    this.logger = logger;
    this.logger.info("[PolicyEngine] Initialized with EscrowManager");
  }

  /**
   * The main public method to create an insurance policy from a quote.
   * This is a transactional process that ensures a policy is only created
   * if the on-chain escrow is successfully funded.
   */
  public async createPolicyFromQuote(
    request: PolicyPurchaseRequest,
  ): Promise<PolicyPurchaseResponse> {
    const requestId = crypto.randomUUID();
    this.logger.info(
      `[PolicyEngine] [${requestId}] Starting policy purchase for quote ${request.quoteId}`,
    );

    // Step 1: Validate the quote's existence, status, and expiration
    const quote = await this.validateQuote(request.quoteId, requestId);
    this.logger.info(
      `[PolicyEngine] [${requestId}] Quote ${quote.id} validated successfully.`,
    );

    // Step 2: Lock the quote to prevent double-spending
    await this.lockQuote(quote.id, requestId);
    this.logger.info(`[PolicyEngine] [${requestId}] Quote ${quote.id} locked.`);

    // Step 3: Create the initial policy record in the database
    const policy = await this.createPolicyRecordInDB(
      quote,
      request.userId,
      request.anonymousSessionId,
      request.chain,
      requestId,
    );
    this.logger.info(
      `[PolicyEngine] [${requestId}] Policy record ${policy.id} created with status PENDING.`,
    );

    try {
      // Step 4: Create the on-chain escrow
      const escrowResult = await this.createPolicyEscrow(
        quote,
        request,
        requestId,
      );
      this.logger.info(
        `[PolicyEngine] [${requestId}] On-chain escrow created. TxHash: ${escrowResult.txHash}`,
      );

      // Step 5: Update the policy with the escrow details and set its status to ACTIVE
      if (!escrowResult.internalId || !escrowResult.txHash) {
        throw new Error(
          "Escrow creation succeeded but missing required identifiers",
        );
      }

      await this.updatePolicyWithEscrow(
        policy.id,
        escrowResult.internalId,
        escrowResult.txHash,
        requestId,
      );
      this.logger.info(
        `[PolicyEngine] [${requestId}] Policy ${policy.id} updated with escrow details and set to ACTIVE.`,
      );

      return {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        transactionHash: escrowResult.txHash!,
        escrowId: escrowResult.internalId!,
        message: "Policy purchased and activated successfully.",
      };
    } catch (error) {
      // If any part of the on-chain process fails, mark the policy as FAILED
      this.logger.error(
        `[PolicyEngine] [${requestId}] Escrow creation failed, marking policy as FAILED.`,
        error,
      );
      await this.failPolicy(policy.id, requestId);
      throw error; // Re-throw the error to be handled by the API layer
    }
  }

  /**
   * Fetches a quote from the database and validates its state.
   * @returns The validated quote record.
   * @throws If the quote is not found, expired, or already used.
   */
  private async validateQuote(
    quoteId: string,
    requestId: string,
  ): Promise<ValidatedQuote> {
    const quote = await Database.db.query.quote.findFirst({
      where: eq(Schema.quote.id, quoteId),
    });

    if (!quote) {
      this.logger.warn(
        `[PolicyEngine] [${requestId}] Quote validation failed: Quote ${quoteId} not found.`,
      );
      throw new Error("QuoteNotFound");
    }

    if (new Date(quote.validUntil) < new Date()) {
      this.logger.warn(
        `[PolicyEngine] [${requestId}] Quote validation failed: Quote ${quoteId} has expired.`,
      );
      // Optionally, update the quote status to EXPIRED in the background
      Database.db
        .update(Schema.quote)
        .set({ status: "EXPIRED" })
        .where(eq(Schema.quote.id, quoteId))
        .catch();
      throw new Error("QuoteExpired");
    }

    if (quote.status !== "PENDING") {
      this.logger.warn(
        `[PolicyEngine] [${requestId}] Quote validation failed: Quote ${quoteId} has already been used (status: ${quote.status}).`,
      );
      throw new Error("QuoteAlreadyUsed");
    }

    return quote;
  }

  /**
   * Updates the quote's status to 'ACCEPTED' to prevent reuse.
   */
  private async lockQuote(quoteId: string, requestId: string): Promise<void> {
    const [updatedQuote] = await Database.db
      .update(Schema.quote)
      .set({ status: "ACCEPTED" })
      .where(
        and(eq(Schema.quote.id, quoteId), eq(Schema.quote.status, "PENDING")),
      )
      .returning();

    if (!updatedQuote) {
      this.logger.error(
        `[PolicyEngine] [${requestId}] Failed to lock quote ${quoteId}. It may have been accepted by a concurrent request.`,
      );
      throw new Error("QuoteLockFailed");
    }
  }

  /**
   * Creates a new policy record in the database with a 'PENDING' status.
   */
  private async createPolicyRecordInDB(
    quote: ValidatedQuote,
    userId: string | undefined,
    anonymousSessionId: string | undefined,
    chain: string,
    requestId: string,
  ) {
    // Validate that exactly one of userId or anonymousSessionId is provided
    if ((!userId && !anonymousSessionId) || (userId && anonymousSessionId)) {
      this.logger.error(
        `[PolicyEngine] [${requestId}] Invalid user identification: exactly one of userId or anonymousSessionId must be provided`,
      );
      throw new Error("InvalidUserIdentification");
    }
    const policyId = generateId("pol");
    const policyNumber = `TRG-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // The expiration of the policy itself (e.g., flight arrival time + buffer)
    // For now, let's set a simple expiration, like 48 hours from creation.
    // This should be derived from flight data in a real implementation.
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const [newPolicy] = await Database.db
      .insert(Schema.policy)
      .values({
        id: policyId,
        policyNumber,
        userId: userId || null,
        anonymousSessionId: anonymousSessionId || null,
        providerId: quote.providerId,
        flightId: quote.flightId,
        quoteId: quote.id,
        coverageType: quote.coverageType,
        coverageAmount: quote.coverageAmount,
        premium: quote.premium,
        payoutAmount: quote.coverageAmount, // Payout is typically the coverage amount
        status: "PENDING",
        chain, // Store the chain for multichain support
        expiresAt,
        // Default terms; would be enhanced with data from quote.riskFactors
        terms: {
          delayThresholdMinutes: 60,
        },
        metadata: {
          // Store additional metadata for multichain support
          chainSpecific: {
            [chain]: {
              supportedFeatures: ["escrow", "automation"],
              networkId:
                chain === "PAYGO" ? "paygo-mainnet" : chain.toLowerCase(),
            },
          },
        },
      })
      .returning();

    if (!newPolicy) {
      this.logger.error(
        `[PolicyEngine] [${requestId}] Failed to insert new policy record into database.`,
      );
      throw new Error("DatabaseInsertFailed");
    }

    return newPolicy;
  }

  /**
   * Calls the EscrowManager to create the on-chain escrow.
   * Uses proper escrow ID generation for multichain support.
   */
  private async createPolicyEscrow(
    quote: ValidatedQuote,
    request: PolicyPurchaseRequest,
    requestId: string,
  ) {
    // In a multi-provider system, the recipient would be the provider's wallet.
    // For now, we'll use a placeholder or the platform wallet.
    const providerWalletAddress = process.env.PLATFORM_REVENUE_WALLET_ADDRESS;
    if (!providerWalletAddress) {
      throw new Error("Platform wallet address is not configured.");
    }

    // Generate proper escrow IDs using the escrow ID generator
    const escrowIds = generatePolicyEscrowId(quote.providerId, quote.flightId);

    this.logger.info(
      `[PolicyEngine] [${requestId}] Generated escrow IDs - Internal: ${escrowIds.internalId}, Blockchain: ${escrowIds.blockchainId}`,
    );

    const escrowParams: EscrowCreateParams = {
      type: "POLICY",
      premiumAmount: quote.premium,
      coverageAmount: quote.coverageAmount,
      userAddress: request.buyerWalletAddress,
      expirationDate: new Date(new Date().getTime() + 72 * 60 * 60 * 1000), // 72 hours from now
      policyId: quote.flightId,
      providerId: quote.providerId,
      providerAddress: process.env.PLATFORM_REVENUE_WALLET_ADDRESS!,
      configuration: {
        escrowModel: "SINGLE_SIDED",
        premiumReturnPolicy: "PROVIDER_KEEPS_PREMIUM",
      },
      metadata: {
        chain: request.chain, // Pass chain for multichain support
        internalEscrowId: escrowIds.internalId,
        blockchainEscrowId: escrowIds.blockchainId,
        policyNumber: `TRG-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
    };

    return this.escrowManager.createEscrow(escrowParams);
  }

  /**
   * Updates the policy record with the escrow ID and transaction hash and activates it.
   */
  private async updatePolicyWithEscrow(
    policyId: string,
    escrowId: string,
    transactionHash: string,
    requestId: string,
  ) {
    const [updatedPolicy] = await Database.db
      .update(Schema.policy)
      .set({
        status: "ACTIVE",
        activatedAt: new Date(),
        metadata: {
          escrowId,
          transactionHash,
        },
      })
      .where(eq(Schema.policy.id, policyId))
      .returning();

    if (!updatedPolicy) {
      this.logger.error(
        `[PolicyEngine] [${requestId}] Failed to update policy ${policyId} with escrow details.`,
      );
      // This is a critical error state that requires manual intervention,
      // as the on-chain escrow exists but the off-chain record is not updated.
      throw new Error("PolicyUpdateFailed");
    }
  }

  /**
   * Updates a policy's status to 'FAILED' if escrow creation fails.
   */
  private async failPolicy(policyId: string, requestId: string): Promise<void> {
    try {
      await Database.db
        .update(Schema.policy)
        .set({ status: "FAILED" })
        .where(eq(Schema.policy.id, policyId));
      this.logger.info(
        `[PolicyEngine] [${requestId}] Policy ${policyId} status set to FAILED.`,
      );
    } catch (error) {
      this.logger.error(
        `[PolicyEngine] [${requestId}] CRITICAL: Failed to update policy ${policyId} status to FAILED after an escrow error. Manual intervention required.`,
        error,
      );
    }
  }
}
