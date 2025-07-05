import type { Hex } from "viem";
import { eq } from "drizzle-orm";
import {
  IBlockchainService,
  GenericEscrowParams,
  BlockchainProviderName,
} from "@triggerr/blockchain-interface";
import { BlockchainServiceRegistry } from "@triggerr/service-registry";
import PayGoClientService, {
  CreateEscrow,
  FulfillEscrow,
  ReleaseEscrow,
} from "@triggerr/paygo-adapter";
import { Database, Schema } from "@triggerr/core";
import {
  generatePolicyEscrowId,
  generateUserEscrowId,
  type EscrowPurpose,
} from "@triggerr/core";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type EscrowModelType =
  | "SINGLE_SIDED"
  | "DUAL_SIDED"
  | "COMBINED"
  | "HYBRID_PARTIAL_COLLATERAL"
  | "COLLATERALIZED_PROVIDER_POOL"
  | "BONDED_LIABILITY_POOL"
  | "USER_DEPOSIT"
  | "PEER_TO_PEER_POOL"
  | "SUBSCRIPTION_BASED_POOL"
  | "DYNAMIC_RISK_POOL"
  | "PREDICTION_MARKET"
  | "SYNTHETIC_DEFI_COVERAGE"
  | "NFT_POLICY"
  | "DAO_GOVERNED_POOL"
  | "MULTI_ORACLE_VERIFIED";

export type PremiumReturnPolicy =
  | "PROVIDER_KEEPS_PREMIUM"
  | "RETURN_TO_CUSTOMER";

export interface EscrowConfiguration {
  escrowModel: EscrowModelType;
  premiumReturnPolicy: PremiumReturnPolicy;
  collateralRequirement?: string;
  poolAddress?: string;
  poolMinimumBalance?: string;
  modelSpecificConfig?: Record<string, any>;
}

// Discriminated union for creation parameters
type PolicyEscrowParams = {
  type: "POLICY";
  policyId: string;
  providerId: string;
  userAddress: string;
  providerAddress: string;
};

type UserEscrowParams = {
  type: "USER";
  userId: string;
  purpose: EscrowPurpose;
  userAddress: string;
  recipientAddress?: string;
};

export type EscrowCreateParams = {
  premiumAmount: string;
  coverageAmount: string;
  expirationDate: Date;
  configuration: EscrowConfiguration;
  metadata?: Record<string, any>;
} & (PolicyEscrowParams | UserEscrowParams);

export interface EscrowResult {
  success: boolean;
  internalId?: string;
  blockchainId?: string;
  txHash?: string;
  error?: string;
  gasUsed?: number;
  blockNumber?: number;
}

export interface EscrowStatus {
  id: string;
  status: "PENDING" | "FULFILLED" | "RELEASED" | "EXPIRED" | "CANCELLED";
  amount: string;
  collateralAmount?: string;
  poolId?: string;
  expiresAt: Date;
  fulfilledAt?: Date;
  releasedAt?: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// ESCROW ENGINE INTERFACE
// ============================================================================

export interface IEscrowEngine {
  createEscrow(params: EscrowCreateParams): Promise<EscrowResult>;
  fulfillEscrow(
    escrowId: string,
    fulfillerAddress: string,
    proof?: string,
  ): Promise<EscrowResult>;
  releaseEscrow(
    escrowId: string,
    reason:
      | "FLIGHT_ON_TIME"
      | "FLIGHT_DELAYED"
      | "FLIGHT_CANCELLED"
      | "EXPIRED"
      | "USER_RELEASE",
    metadata?: Record<string, any>,
  ): Promise<EscrowResult>;
  getEscrowStatus(escrowId: string): Promise<EscrowStatus>;
  validateConfiguration(config: EscrowConfiguration): boolean;
  getModelType(): EscrowModelType;
}

// ============================================================================
// BASE ESCROW ENGINE IMPLEMENTATION
// ============================================================================

export abstract class BaseEscrowEngine implements IEscrowEngine {
  protected blockchainClient: IBlockchainService;
  protected modelType: EscrowModelType;

  constructor(
    blockchainClient: IBlockchainService,
    modelType: EscrowModelType,
  ) {
    this.blockchainClient = blockchainClient;
    this.modelType = modelType;
  }

  abstract createEscrow(params: EscrowCreateParams): Promise<EscrowResult>;
  abstract fulfillEscrow(
    escrowId: string,
    fulfillerAddress: string,
    proof?: string,
  ): Promise<EscrowResult>;
  abstract releaseEscrow(
    escrowId: string,
    reason: string,
    metadata?: Record<string, any>,
  ): Promise<EscrowResult>;
  abstract getEscrowStatus(escrowId: string): Promise<EscrowStatus>;
  abstract validateConfiguration(config: EscrowConfiguration): boolean;

  getModelType(): EscrowModelType {
    return this.modelType;
  }

  protected async executePayGoTransaction<
    T extends CreateEscrow | FulfillEscrow | ReleaseEscrow,
  >(transaction: T): Promise<EscrowResult> {
    try {
      const response = await (
        this.blockchainClient as any
      ).signAndPostTransactionFromParams(transaction);
      return { success: true, txHash: response.hash };
    } catch (error) {
      console.error(`PayGo transaction failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  protected convertToPayGoAmount(decimalAmount: string): bigint {
    const amount = parseFloat(decimalAmount);
    return BigInt(Math.round(amount * 100)); // Convert to cents
  }
}

// ============================================================================
// SINGLE-SIDED ESCROW ENGINE (For Policies)
// ============================================================================

export class SingleSidedEscrowEngine extends BaseEscrowEngine {
  constructor(blockchainClient: IBlockchainService) {
    super(blockchainClient, "SINGLE_SIDED");
  }

  async createEscrow(params: EscrowCreateParams): Promise<EscrowResult> {
    if (params.type !== "POLICY") {
      throw new Error(
        "SingleSidedEscrowEngine can only be used for POLICY type escrows.",
      );
    }

    try {
      // Generate policy escrow ID using provider and policy IDs
      const { internalId, blockchainId } = generatePolicyEscrowId(
        params.providerId,
        params.policyId,
      );

      // Convert amount to PayGo format (cents)
      const amount = this.convertToPayGoAmount(params.premiumAmount);

      // Ensure blockchainId is properly formatted for PayGo (must be 0x-prefixed)
      const formattedBlockchainId = blockchainId.startsWith("0x")
        ? (blockchainId as `0x${string}`)
        : (`0x${blockchainId}` as `0x${string}`);

      // Format provider address (add 0x prefix if missing)
      const providerAddress = params.providerAddress?.startsWith("0x")
        ? (params.providerAddress as `0x${string}`)
        : (`0x${params.providerAddress}` as `0x${string}`);

      // Create escrow with default verification key (all zeros)
      const createEscrow = new CreateEscrow(
        formattedBlockchainId, // escrowId
        amount, // amount
        params.expirationDate, // expiration date
        providerAddress, // fulfiller address (provider)
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // vKey (default)
      );

      console.log(`Creating policy escrow with ID: ${formattedBlockchainId}`);
      console.log(`Amount: ${amount} (${params.premiumAmount} in USD)`);
      console.log(`Expiration: ${params.expirationDate.toISOString()}`);
      console.log(`Provider: ${providerAddress}`);

      const result = await this.executePayGoTransaction(createEscrow);

      if (result.success) {
        console.log(`Successfully created policy escrow: ${result.txHash}`);
        result.internalId = internalId;
        result.blockchainId = formattedBlockchainId;
      } else {
        console.error(`Failed to create policy escrow: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in createEscrow: ${errorMessage}`, error);
      return {
        success: false,
        error: `Failed to create policy escrow: ${errorMessage}`,
      };
    }
  }

  async fulfillEscrow(
    escrowId: string,
    fulfillerAddress: string,
    proof?: string,
  ): Promise<EscrowResult> {
    try {
      // Format fulfiller address (add 0x prefix if missing)
      const formattedFulfillerAddress = fulfillerAddress?.startsWith("0x")
        ? (fulfillerAddress as `0x${string}`)
        : (`0x${fulfillerAddress}` as `0x${string}`);

      console.log(
        `Fulfilling escrow ${escrowId} by ${formattedFulfillerAddress}`,
      );

      const fulfillEscrow = new FulfillEscrow(
        escrowId,
        formattedFulfillerAddress,
      );

      const result = await this.executePayGoTransaction(fulfillEscrow);

      if (result.success) {
        console.log(`Successfully fulfilled escrow: ${result.txHash}`);
      } else {
        console.error(`Failed to fulfill escrow: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in fulfillEscrow: ${errorMessage}`, error);
      return {
        success: false,
        error: `Failed to fulfill escrow: ${errorMessage}`,
      };
    }
  }

  async releaseEscrow(
    escrowId: string,
    reason: string,
    metadata?: Record<string, any>,
  ): Promise<EscrowResult> {
    try {
      console.log(`Releasing escrow ${escrowId} with reason: ${reason}`);

      // Note: The reason parameter is not used in the PayGo ReleaseEscrow constructor
      // but we log it for auditing purposes
      const releaseEscrow = new ReleaseEscrow(escrowId);

      const result = await this.executePayGoTransaction(releaseEscrow);

      if (result.success) {
        console.log(`Successfully released escrow: ${result.txHash}`);
      } else {
        console.error(`Failed to release escrow: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in releaseEscrow: ${errorMessage}`, error);
      return {
        success: false,
        error: `Failed to release escrow: ${errorMessage}`,
      };
    }
  }

  async getEscrowStatus(escrowId: string): Promise<EscrowStatus> {
    try {
      // Format escrow ID properly for PayGo
      const formattedEscrowId = escrowId.startsWith("0x")
        ? (escrowId as `0x${string}`)
        : (`0x${escrowId}` as `0x${string}`);

      console.log(
        `[SingleSidedEscrowEngine] Checking status for escrow: ${formattedEscrowId}`,
      );

      // TODO: Replace with actual blockchain query when PayGo provides escrow status API
      // For now, we'll return a placeholder status that indicates the escrow exists
      // but we cannot determine its exact state without a direct blockchain query method

      // In a real implementation, this would call something like:
      // const escrowData = await this.paygoClient.getEscrow(formattedEscrowId);

      return {
        id: escrowId,
        status: "PENDING", // Assume pending since we can't query the actual state yet
        amount: "0.00", // Would come from blockchain query
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      };
    } catch (error) {
      console.error(
        `[SingleSidedEscrowEngine] Error checking escrow status: ${error}`,
      );
      return {
        id: escrowId,
        status: "EXPIRED",
        amount: "0.00",
        expiresAt: new Date(),
      };
    }
  }

  validateConfiguration(config: EscrowConfiguration): boolean {
    // For single-sided escrows, we require:
    // - Correct model type
    // - No collateral requirement (handled by the smart contract)
    // - No pool address (this is a direct escrow)
    return (
      config.escrowModel === "SINGLE_SIDED" &&
      !config.collateralRequirement &&
      !config.poolAddress
    );
  }
}

// ============================================================================
// USER-INITIATED ESCROW ENGINE (For User Escrows)
// ============================================================================

export class UserInitiatedEscrowEngine extends BaseEscrowEngine {
  constructor(blockchainClient: IBlockchainService) {
    super(blockchainClient, "USER_DEPOSIT");
  }

  async createEscrow(params: EscrowCreateParams): Promise<EscrowResult> {
    if (params.type !== "USER") {
      throw new Error(
        "UserInitiatedEscrowEngine can only be used for USER type escrows.",
      );
    }

    try {
      // Generate a user escrow ID using the userId and purpose
      const { internalId, blockchainId } = generateUserEscrowId(
        params.userId,
        params.purpose,
      );

      // Convert amount to PayGo format (cents)
      const amount = this.convertToPayGoAmount(params.premiumAmount);

      // Ensure blockchainId is properly formatted for PayGo (must be 0x-prefixed)
      const formattedBlockchainId = blockchainId.startsWith("0x")
        ? (blockchainId as `0x${string}`)
        : (`0x${blockchainId}` as `0x${string}`);

      // Format user address (add 0x prefix if missing)
      const userAddress = params.userAddress?.startsWith("0x")
        ? (params.userAddress as `0x${string}`)
        : (`0x${params.userAddress}` as `0x${string}`);

      // Create escrow with default verification key (all zeros)
      const createEscrow = new CreateEscrow(
        formattedBlockchainId, // escrowId
        amount, // amount
        params.expirationDate, // expiration date
        userAddress, // fulfiller address
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`, // vKey (default)
      );

      console.log(`Creating user escrow with ID: ${formattedBlockchainId}`);
      console.log(`Amount: ${amount} (${params.premiumAmount} in USD)`);
      console.log(`Expiration: ${params.expirationDate.toISOString()}`);
      console.log(`Fulfiller: ${userAddress}`);

      const result = await this.executePayGoTransaction(createEscrow);

      if (result.success) {
        console.log(`Successfully created user escrow: ${result.txHash}`);
        result.internalId = internalId;
        result.blockchainId = formattedBlockchainId;
      } else {
        console.error(`Failed to create user escrow: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in createEscrow: ${errorMessage}`, error);
      return {
        success: false,
        error: `Failed to create user escrow: ${errorMessage}`,
      };
    }
  }

  async fulfillEscrow(
    escrowId: string,
    fulfillerAddress: string,
    proof?: string,
  ): Promise<EscrowResult> {
    try {
      // Format fulfiller address (add 0x prefix if missing)
      const formattedFulfillerAddress = fulfillerAddress?.startsWith("0x")
        ? (fulfillerAddress as `0x${string}`)
        : (`0x${fulfillerAddress}` as `0x${string}`);

      console.log(
        `Fulfilling escrow ${escrowId} by ${formattedFulfillerAddress}`,
      );

      const fulfillEscrow = new FulfillEscrow(
        escrowId,
        formattedFulfillerAddress,
      );

      const result = await this.executePayGoTransaction(fulfillEscrow);

      if (result.success) {
        console.log(`Successfully fulfilled escrow: ${result.txHash}`);
      } else {
        console.error(`Failed to fulfill escrow: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in fulfillEscrow: ${errorMessage}`, error);
      return {
        success: false,
        error: `Failed to fulfill escrow: ${errorMessage}`,
      };
    }
  }

  async releaseEscrow(
    escrowId: string,
    reason: string,
    metadata?: Record<string, any>,
  ): Promise<EscrowResult> {
    try {
      console.log(`Releasing escrow ${escrowId} with reason: ${reason}`);

      // Note: The reason parameter is not used in the PayGo ReleaseEscrow constructor
      // but we log it for auditing purposes
      const releaseEscrow = new ReleaseEscrow(escrowId);

      const result = await this.executePayGoTransaction(releaseEscrow);

      if (result.success) {
        console.log(`Successfully released escrow: ${result.txHash}`);
      } else {
        console.error(`Failed to release escrow: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error in releaseEscrow: ${errorMessage}`, error);
      return {
        success: false,
        error: `Failed to release escrow: ${errorMessage}`,
      };
    }
  }

  async getEscrowStatus(escrowId: string): Promise<EscrowStatus> {
    // TODO: Implement actual escrow status checking from the blockchain
    console.warn("getEscrowStatus not yet implemented for user escrows");
    return {
      id: escrowId,
      status: "PENDING",
      amount: "0",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };
  }

  validateConfiguration(config: EscrowConfiguration): boolean {
    // For user deposits, we only require that the model type is USER_DEPOSIT
    // and no pool address is specified (since it's a direct user escrow)
    return config.escrowModel === "USER_DEPOSIT" && !config.poolAddress;
  }
}

// ============================================================================
// ESCROW ENGINE FACTORY
// ============================================================================

export class EscrowEngineFactory {
  private static engines = new Map<
    EscrowModelType,
    new (blockchainClient: IBlockchainService) => IEscrowEngine
  >([
    ["SINGLE_SIDED", SingleSidedEscrowEngine],
    ["USER_DEPOSIT", UserInitiatedEscrowEngine],
  ]);

  constructor(private blockchainRegistry: BlockchainServiceRegistry) {}

  createEngine(
    modelType: EscrowModelType,
    chain: BlockchainProviderName, // Multichain support: "PAYGO" | "ETHEREUM" | "BASE" | "SOLANA"
  ): IEscrowEngine {
    const EngineClass = EscrowEngineFactory.engines.get(modelType);
    if (!EngineClass) {
      throw new Error(`Unsupported escrow engine type: ${modelType}`);
    }
    const blockchainClient = this.blockchainRegistry.get(chain);
    return new EngineClass(blockchainClient);
  }
}

// ============================================================================
// ESCROW MANAGER (High-level interface)
// ============================================================================

export class EscrowManager {
  private factory: EscrowEngineFactory;

  constructor(factory: EscrowEngineFactory) {
    this.factory = factory;
  }

  async createEscrow(params: EscrowCreateParams): Promise<EscrowResult> {
    // Extract chain from metadata for multichain support
    const chain = (params.metadata?.chain as BlockchainProviderName) || "PAYGO"; // Default to PAYGO if not specified
    const engine = this.factory.createEngine(
      params.configuration.escrowModel,
      chain,
    );
    if (!engine.validateConfiguration(params.configuration)) {
      return {
        success: false,
        error: `Invalid configuration for escrow model ${params.configuration.escrowModel}`,
      };
    }
    return await engine.createEscrow(params);
  }

  async fulfillEscrow(
    escrowId: string,
    fulfillerAddress: string,
    proof?: string,
  ): Promise<EscrowResult> {
    try {
      const escrowRecord = await Database.db.query.escrow.findFirst({
        where: eq(Schema.escrow.blockchainId, escrowId),
      });

      if (!escrowRecord) {
        throw new Error(`Escrow with blockchain ID ${escrowId} not found.`);
      }

      // Extract chain from escrow record for multichain support
      const chain = (escrowRecord.chain as BlockchainProviderName) || "PAYGO"; // Default to PAYGO if not specified
      const engine = this.factory.createEngine(escrowRecord.escrowModel, chain);

      return await engine.fulfillEscrow(escrowId, fulfillerAddress, proof);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[EscrowManager] Error fulfilling escrow ${escrowId}:`,
        error,
      );
      return {
        success: false,
        error: `Failed to fulfill escrow: ${errorMessage}`,
      };
    }
  }

  async releaseEscrow(
    escrowId: string,
    reason:
      | "FLIGHT_ON_TIME"
      | "FLIGHT_DELAYED"
      | "FLIGHT_CANCELLED"
      | "EXPIRED"
      | "USER_RELEASE" = "EXPIRED",
  ): Promise<EscrowResult> {
    try {
      const escrowRecord = await Database.db.query.escrow.findFirst({
        where: eq(Schema.escrow.blockchainId, escrowId),
      });

      if (!escrowRecord) {
        throw new Error(`Escrow with blockchain ID ${escrowId} not found.`);
      }

      // Extract chain from escrow record for multichain support
      const chain = (escrowRecord.chain as BlockchainProviderName) || "PAYGO"; // Default to PAYGO if not specified
      const engine = this.factory.createEngine(escrowRecord.escrowModel, chain);

      return await engine.releaseEscrow(escrowId, reason);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[EscrowManager] Error releasing escrow ${escrowId}:`,
        error,
      );
      return {
        success: false,
        error: `Failed to release escrow: ${errorMessage}`,
      };
    }
  }
}
