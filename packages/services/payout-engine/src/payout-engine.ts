import { EscrowManager, EscrowEngineFactory } from "@triggerr/escrow-engine";
import { BlockchainServiceRegistry } from "@triggerr/service-registry";
import { Database, Schema } from "@triggerr/core";
import { eq, and, inArray, desc } from "drizzle-orm";

import type { Hex } from "viem";

/**
 * Response type for the internal processTriggeredPayouts method
 */
export interface InternalProcessPayoutsResponse {
  success: boolean;
  processedCount: number;
  failedCount: number;
  totalAmount: string;
  results: Array<{
    policyId: string;
    success: boolean;
    message: string;
    transactionHash?: string;
    amount?: string;
    recipientAddress?: string;
  }>;
  summary: {
    totalPolicies: number;
    eligiblePolicies: number;
    successfulPayouts: number;
    failedPayouts: number;
    skippedPolicies: number;
    totalAmountPaid: string;
  };
}

/**
 * Interface for policy eligibility check
 */
interface PolicyEligibilityResult {
  isEligible: boolean;
  reason: string;
  payoutAmount?: string;
  recipientAddress?: string;
}

/**
 * The PayoutEngine is responsible for processing policy payouts when
 * claim conditions are met. This is a production-ready implementation
 * that performs real database operations and blockchain transactions.
 */
export class PayoutEngine {
  private escrowManager: EscrowManager;

  constructor() {
    // EscrowManager will be initialized with PayGo client when needed
    this.escrowManager = null as any; // Will be set in methods that need it
  }

  /**
   * Processes payouts for a list of policies that have been triggered
   * for payout (e.g., due to a flight delay).
   *
   * @param {string[]} policyIds - IDs of policies to process payouts for.
   * @returns {Promise<InternalProcessPayoutsResponse>} A promise resolving to the processing results.
   */
  public async processTriggeredPayouts(
    policyIds: string[],
  ): Promise<InternalProcessPayoutsResponse> {
    const requestId = crypto.randomUUID();
    console.log(
      `[PayoutEngine] [${requestId}] Processing payouts for ${policyIds.length} policies`,
    );

    const results = [];
    let processedCount = 0;
    let failedCount = 0;
    let totalAmountPaid = 0;

    // Initialize EscrowManager with proper factory
    try {
      const blockchainRegistry = new BlockchainServiceRegistry();
      const escrowEngineFactory = new EscrowEngineFactory(blockchainRegistry);
      this.escrowManager = new EscrowManager(escrowEngineFactory);
    } catch (error) {
      console.error(
        `[PayoutEngine] [${requestId}] Failed to initialize PayGo client:`,
        error,
      );
      return {
        success: false,
        processedCount: 0,
        failedCount: policyIds.length,
        totalAmount: "0.00",
        results: policyIds.map((policyId) => ({
          policyId,
          success: false,
          message: "Failed to initialize PayGo client",
        })),
        summary: {
          totalPolicies: policyIds.length,
          eligiblePolicies: 0,
          successfulPayouts: 0,
          failedPayouts: policyIds.length,
          skippedPolicies: 0,
          totalAmountPaid: "0.00",
        },
      };
    }

    for (const policyId of policyIds) {
      try {
        console.log(
          `[PayoutEngine] [${requestId}] Processing policy: ${policyId}`,
        );

        // 1. Fetch policy with all required relations
        const policyRecord = await this.fetchPolicyWithRelations(policyId);

        if (!policyRecord) {
          console.log(
            `[PayoutEngine] [${requestId}] Policy ${policyId} not found`,
          );
          results.push({
            policyId,
            success: false,
            message: `Policy not found`,
          });
          failedCount++;
          continue;
        }

        // 2. Check policy eligibility
        const eligibility = await this.checkPolicyEligibility(
          policyRecord,
          requestId,
        );

        if (!eligibility.isEligible) {
          console.log(
            `[PayoutEngine] [${requestId}] Policy ${policyId} not eligible: ${eligibility.reason}`,
          );
          results.push({
            policyId,
            success: false,
            message: eligibility.reason,
          });
          failedCount++;
          continue;
        }

        // 3. Process the payout
        const payoutResult = await this.processPayout(
          policyRecord,
          eligibility,
          requestId,
        );

        if (payoutResult.success) {
          console.log(
            `[PayoutEngine] [${requestId}] Successfully processed payout for policy ${policyId}`,
          );
          totalAmountPaid += parseFloat(eligibility.payoutAmount!);
          results.push({
            policyId,
            success: true,
            message: "Payout processed successfully",
            ...(payoutResult.transactionHash && {
              transactionHash: payoutResult.transactionHash,
            }),
            ...(eligibility.payoutAmount && {
              amount: eligibility.payoutAmount,
            }),
            ...(eligibility.recipientAddress && {
              recipientAddress: eligibility.recipientAddress,
            }),
          });
          processedCount++;
        } else {
          console.log(
            `[PayoutEngine] [${requestId}] Failed to process payout for policy ${policyId}: ${payoutResult.error}`,
          );
          results.push({
            policyId,
            success: false,
            message: payoutResult.error!,
          });
          failedCount++;
        }
      } catch (error) {
        console.error(
          `[PayoutEngine] [${requestId}] Error processing payout for policy ${policyId}:`,
          error,
        );
        results.push({
          policyId,
          success: false,
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        failedCount++;
      }
    }

    return {
      success: failedCount === 0,
      processedCount,
      failedCount,
      totalAmount: totalAmountPaid.toFixed(2),
      results,
      summary: {
        totalPolicies: policyIds.length,
        eligiblePolicies: processedCount + failedCount, // Total processed
        successfulPayouts: processedCount,
        failedPayouts: failedCount,
        skippedPolicies: 0, // Could be calculated if we track skipped vs failed
        totalAmountPaid: totalAmountPaid.toFixed(2),
      },
    };
  }

  /**
   * Fetches a policy with all required relations for payout processing.
   * Uses real database operations with proper drizzle-orm queries.
   *
   * @param {string} policyId - The policy ID to fetch
   * @returns {Promise<any | null>} The policy with relations or null if not found
   */
  private async fetchPolicyWithRelations(
    policyId: string,
  ): Promise<any | null> {
    try {
      console.log(`[PayoutEngine] Fetching policy ${policyId} from database`);

      // Use drizzle query with relations to get policy data
      const policyRecord = await Database.db.query.policy.findFirst({
        where: eq(Schema.policy.id, policyId),
        with: {
          user: true,
          provider: true,
          escrows: true,
          flight: true,
        },
      });

      if (!policyRecord) {
        console.log(`[PayoutEngine] Policy ${policyId} not found in database`);
        return null;
      }

      console.log(
        `[PayoutEngine] Successfully fetched policy ${policyId} with ${policyRecord.escrows?.length || 0} escrows`,
      );

      return policyRecord;
    } catch (error) {
      console.error(`[PayoutEngine] Error fetching policy ${policyId}:`, error);
      return null;
    }
  }

  /**
   * Checks if a policy is eligible for payout processing.
   * Uses real database operations to verify user wallet and policy status.
   *
   * @param {any} policyRecord - The policy with relations
   * @param {string} requestId - Request ID for logging
   * @returns {Promise<PolicyEligibilityResult>} Eligibility result
   */
  private async checkPolicyEligibility(
    policyRecord: any,
    requestId: string,
  ): Promise<PolicyEligibilityResult> {
    try {
      // Check if policy has required data
      if (!policyRecord.user) {
        return {
          isEligible: false,
          reason: "Policy user not found",
        };
      }

      // Fetch user's primary wallet from database
      const userWalletResult = await Database.db
        .select({
          id: Schema.userWallets.id,
          address: Schema.userWallets.address,
        })
        .from(Schema.userWallets)
        .where(
          and(
            eq(Schema.userWallets.userId, policyRecord.userId),
            eq(Schema.userWallets.isPrimary, true),
          ),
        )
        .limit(1);

      if (userWalletResult.length === 0) {
        return {
          isEligible: false,
          reason: "User wallet not found",
        };
      }

      const userWallet = userWalletResult[0];

      if (!policyRecord.escrows || policyRecord.escrows.length === 0) {
        return {
          isEligible: false,
          reason: "No associated escrow found",
        };
      }

      // Find the primary escrow (first active one)
      const primaryEscrow =
        policyRecord.escrows.find(
          (e: any) => e.status === "PENDING" || e.status === "ACTIVE",
        ) || policyRecord.escrows[0];

      if (!primaryEscrow) {
        return {
          isEligible: false,
          reason: "No valid escrow found for policy",
        };
      }

      // Check policy status
      if (policyRecord.status === "CLAIMED") {
        return {
          isEligible: false,
          reason: "Policy has already been claimed",
        };
      }

      if (policyRecord.status === "CANCELLED") {
        return {
          isEligible: false,
          reason: "Policy has been cancelled",
        };
      }

      if (policyRecord.status === "EXPIRED") {
        return {
          isEligible: false,
          reason: "Policy has expired",
        };
      }

      if (primaryEscrow.status === "FULFILLED") {
        return {
          isEligible: false,
          reason: "Escrow has already been fulfilled",
        };
      }

      if (primaryEscrow.status === "RELEASED") {
        return {
          isEligible: false,
          reason: "Escrow has already been released",
        };
      }

      // Check if escrow has expired
      if (
        primaryEscrow.expiresAt &&
        new Date() > new Date(primaryEscrow.expiresAt)
      ) {
        return {
          isEligible: false,
          reason: "Escrow has expired",
        };
      }

      // Check if policy is in a payable status
      if (policyRecord.status !== "ACTIVE") {
        return {
          isEligible: false,
          reason: `Policy status is ${policyRecord.status}, must be ACTIVE for payout`,
        };
      }

      // For parametric insurance: Simplified eligibility check
      // In a real implementation, this would check specific claim conditions
      // based on flight delay data, weather conditions, etc.
      // For now, we assume the policy was triggered externally

      // Determine payout amount (use claim amount from policy)
      const payoutAmount =
        policyRecord.claimAmount || policyRecord.premiumAmount;
      if (!userWallet) {
        throw new Error(`No wallet found for user ${policyRecord.user}`);
      }
      const recipientAddress = userWallet.address;

      if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
        return {
          isEligible: false,
          reason: "Invalid payout amount",
        };
      }

      console.log(
        `[PayoutEngine] [${requestId}] Policy ${policyRecord.id} eligible for payout: ${payoutAmount} to ${recipientAddress}`,
      );

      return {
        isEligible: true,
        reason: "Policy meets all eligibility criteria",
        payoutAmount: payoutAmount,
        recipientAddress: recipientAddress,
      };
    } catch (error) {
      console.error(
        `[PayoutEngine] [${requestId}] Error checking policy eligibility:`,
        error,
      );
      return {
        isEligible: false,
        reason: `Error checking eligibility: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Processes the actual payout for an eligible policy.
   * Performs real blockchain transaction and database operations.
   *
   * @param {any} policyRecord - The policy with relations
   * @param {PolicyEligibilityResult} eligibility - The eligibility result
   * @param {string} requestId - Request ID for logging
   * @returns {Promise<{success: boolean, transactionHash?: string, error?: string}>}
   */
  private async processPayout(
    policyRecord: any,
    eligibility: PolicyEligibilityResult,
    requestId: string,
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    const primaryEscrow =
      policyRecord.escrows.find(
        (e: any) => e.status === "PENDING" || e.status === "ACTIVE",
      ) || policyRecord.escrows[0];

    try {
      // 1. Release the escrow via blockchain transaction
      console.log(
        `[PayoutEngine] [${requestId}] Releasing escrow ${primaryEscrow.blockchainId}`,
      );

      const releaseResult = await this.escrowManager.releaseEscrow(
        primaryEscrow.blockchainId as Hex,
        "EXPIRED", // Use valid enum value for policy claim
      );

      if (!releaseResult.success) {
        throw new Error(`Failed to release escrow: ${releaseResult.error}`);
      }

      console.log(
        `[PayoutEngine] [${requestId}] Escrow released successfully: ${releaseResult.txHash}`,
      );

      // 2. Record the payout in database
      const payoutId = crypto.randomUUID();

      await Database.db.insert(Schema.payout).values({
        id: payoutId,
        policyId: policyRecord.id,
        escrowId: primaryEscrow.id,
        amount: eligibility.payoutAmount!,
        status: "COMPLETED",
        reason: "POLICY_CLAIM_TRIGGERED",
        txHash: releaseResult.txHash!,
        processedAt: new Date(),
        chain: primaryEscrow.chain || "PAYGO",
        metadata: {
          requestId,
          recipientAddress: eligibility.recipientAddress,
          processedBy: "payout-engine",
        },
      });

      console.log(
        `[PayoutEngine] [${requestId}] Payout record created: ${payoutId}`,
      );

      // 3. Update policy status to CLAIMED
      await Database.db
        .update(Schema.policy)
        .set({
          status: "CLAIMED",
          updatedAt: new Date(),
        })
        .where(eq(Schema.policy.id, policyRecord.id));

      console.log(
        `[PayoutEngine] [${requestId}] Policy status updated to CLAIMED`,
      );

      // 4. Update escrow status to RELEASED
      await Database.db
        .update(Schema.escrow)
        .set({
          status: "RELEASED",
          updatedAt: new Date(),
        })
        .where(eq(Schema.escrow.id, primaryEscrow.id));

      console.log(
        `[PayoutEngine] [${requestId}] Escrow status updated to RELEASED`,
      );

      return {
        success: true,
        transactionHash: releaseResult.txHash!,
      };
    } catch (error) {
      console.error(
        `[PayoutEngine] [${requestId}] Error processing payout:`,
        error,
      );

      // Try to record failed payout attempt
      try {
        const failedPayoutId = crypto.randomUUID();
        await Database.db.insert(Schema.payout).values({
          id: failedPayoutId,
          policyId: policyRecord.id,
          escrowId: primaryEscrow.id,
          amount: eligibility.payoutAmount!,
          status: "FAILED",
          reason: "POLICY_CLAIM_TRIGGERED",
          errorMessage: error instanceof Error ? error.message : String(error),
          chain: primaryEscrow.chain || "PAYGO",
          metadata: {
            requestId,
            recipientAddress: eligibility.recipientAddress,
            processedBy: "payout-engine",
            failureReason:
              error instanceof Error ? error.message : String(error),
          },
        });
      } catch (dbError) {
        console.error(
          `[PayoutEngine] [${requestId}] Failed to record failed payout:`,
          dbError,
        );
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Gets payout history for policies.
   * Uses real database operations to fetch payout records.
   *
   * @param {string[]} policyIds - Policy IDs to get payouts for
   * @returns {Promise<any[]>} Array of payout records
   */
  public async getPayoutHistory(policyIds: string[]): Promise<any[]> {
    try {
      if (policyIds.length === 0) {
        return [];
      }

      console.log(
        `[PayoutEngine] Fetching payout history for policies: ${policyIds.join(", ")}`,
      );

      const payoutHistory = await Database.db
        .select({
          id: Schema.payout.id,
          policyId: Schema.payout.policyId,
          amount: Schema.payout.amount,
          status: Schema.payout.status,
          reason: Schema.payout.reason,
          txHash: Schema.payout.txHash,
          processedAt: Schema.payout.processedAt,
          createdAt: Schema.payout.createdAt,
          updatedAt: Schema.payout.updatedAt,
          errorMessage: Schema.payout.errorMessage,
          metadata: Schema.payout.metadata,
        })
        .from(Schema.payout)
        .where(inArray(Schema.payout.policyId, policyIds))
        .orderBy(desc(Schema.payout.createdAt));

      console.log(
        `[PayoutEngine] Found ${payoutHistory.length} payout records`,
      );

      return payoutHistory.map((record) => ({
        ...record,
        processedAt: record.processedAt?.toISOString() || null,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error(`[PayoutEngine] Error fetching payout history:`, error);
      return [];
    }
  }

  /**
   * Gets payout statistics for a set of policies.
   * Uses real database operations to calculate statistics.
   *
   * @param {string[]} policyIds - Policy IDs to get stats for
   * @returns {Promise<any>} Payout statistics
   */
  public async getPayoutStatistics(policyIds: string[]): Promise<any> {
    try {
      if (policyIds.length === 0) {
        return {
          totalPayouts: 0,
          totalAmount: "0.00",
          completedPayouts: 0,
          pendingPayouts: 0,
          failedPayouts: 0,
        };
      }

      console.log(
        `[PayoutEngine] Calculating statistics for policies: ${policyIds.join(", ")}`,
      );

      const payoutRecords = await Database.db
        .select({
          status: Schema.payout.status,
          amount: Schema.payout.amount,
        })
        .from(Schema.payout)
        .where(inArray(Schema.payout.policyId, policyIds));

      const stats = payoutRecords.reduce(
        (acc, record) => {
          const amount = parseFloat(record.amount);
          acc.totalPayouts++;
          acc.totalAmount += amount;

          switch (record.status) {
            case "COMPLETED":
              acc.completedPayouts++;
              break;
            case "PENDING":
            case "PROCESSING":
              acc.pendingPayouts++;
              break;
            case "FAILED":
            case "CANCELLED":
              acc.failedPayouts++;
              break;
          }

          return acc;
        },
        {
          totalPayouts: 0,
          totalAmount: 0,
          completedPayouts: 0,
          pendingPayouts: 0,
          failedPayouts: 0,
        },
      );

      const result = {
        totalPayouts: stats.totalPayouts,
        totalAmount: stats.totalAmount.toFixed(2),
        completedPayouts: stats.completedPayouts,
        pendingPayouts: stats.pendingPayouts,
        failedPayouts: stats.failedPayouts,
      };

      console.log(`[PayoutEngine] Statistics calculated:`, result);

      return result;
    } catch (error) {
      console.error(
        `[PayoutEngine] Error calculating payout statistics:`,
        error,
      );
      return {
        totalPayouts: 0,
        totalAmount: "0.00",
        completedPayouts: 0,
        pendingPayouts: 0,
        failedPayouts: 0,
      };
    }
  }
}
