/**
 * @file Defines the generic, platform-agnostic data models for blockchain interactions.
 *
 * This file is the "dictionary" for our application's blockchain layer. It defines
 * a set of common interfaces and types that are not specific to any single
 * blockchain (like PayGo or Solana).
 *
 * The goal is to ensure that our business logic services (WalletService, EscrowEngine)
 * only ever have to work with these generic types, completely decoupling them from the
 * implementation details of any specific chain.
 */

/**
 * A type representing the supported blockchain providers.
 * This ensures we can only ever reference chains that we have a concrete adapter for.
 */
export type BlockchainProviderName = "PAYGO" | "SOLANA" | "ETHEREUM" | "BASE";

/**
 * A standard set of statuses for any on-chain transaction.
 */
export type TransactionStatus = "success" | "failure" | "pending";

/**
 * Distinguishes between wallets generated and managed by our platform versus
 * those connected by a user (e.g., Phantom, MetaMask).
 */
export type WalletType = "CUSTODIAL" | "NON_CUSTODIAL";

/**
 * The universal, chain-agnostic representation of a blockchain wallet.
 * This is the primary model our application will use to represent user wallets.
 */
export interface BlockchainWallet {
  /** The public address of the wallet. */
  address: string;
  /** The blockchain this wallet belongs to. */
  chain: BlockchainProviderName;
  /** The type of the wallet. */
  walletType: WalletType;
  /** The provider of the wallet, e.g., 'metamask', 'phantom'. Only for NON_CUSTODIAL. */
  provider?: string;
  /** The public key associated with the wallet, if applicable. */
  publicKey?: string;
  /**
   * The private key for the wallet.
   * MUST only be present for CUSTODIAL wallets. It will be encrypted when stored.
   * It is optional because we will never have access to it for NON_CUSTODIAL wallets.
   */
  privateKey?: string;
}

/**
 * A generic representation of account details fetched from a blockchain.
 */
export interface BlockchainAccountInfo {
  /** The main token balance of the account, as a bigint to handle large numbers. */
  balance: bigint;
  /** The transaction count or nonce for the account. */
  nonce: number;
  // Note: We can add other generic properties here in the future,
  // like token balances, if needed.
}

/**
 * A generic, chain-agnostic structure for defining the parameters needed to create an escrow.
 */
export interface GenericEscrowParams {
  /** The amount of funds to be placed in the escrow, as a bigint. */
  amount: bigint;
  /** The public address of the party who can receive the funds. */
  recipientAddress: string;
  /** The date and time when the escrow will expire. */
  expiration: Date;
  /**
   * A high-level purpose for the escrow, used for internal tracking.
   * e.g., 'POLICY_PREMIUM', 'USER_DEPOSIT'.
   */
  purpose: string;
  /** Any additional, chain-specific metadata that might be required. */
  metadata?: Record<string, any>;
}

/**
 * A standardized, generic result object returned after submitting any transaction.
 */
export interface TransactionResult {
  /**
   * The unique identifier or hash for the transaction on its respective blockchain.
   */
  hash: string;
  /** The current or final status of the transaction. */
  status: TransactionStatus;
  /**
   * Optional field to store the original, raw response from the specific
   * blockchain client for debugging and logging purposes.
   */
  rawResponse?: any;
}
