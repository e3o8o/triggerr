/**
 * @file Defines the master IBlockchainService interface.
 *
 * This interface is the "Socket" in our "Socket and Plugs" architecture. It defines
 * a comprehensive, chain-agnostic contract that every blockchain adapter (like
 * PayGo, Solana, etc.) MUST implement.
 *
 * Our core business logic (WalletService, EscrowEngine) will ONLY ever interact
 * with this interface, ensuring complete decoupling from any specific blockchain
 * technology.
 */

import type {
  BlockchainAccountInfo,
  BlockchainWallet,
  GenericEscrowParams,
  TransactionResult,
  TransactionStatus,
} from './models';

export interface IBlockchainService {
  // =========================================================================
  // READ-ONLY METHODS (Typically do not require signing)
  // =========================================================================

  /**
   * Fetches the account information for a given address.
   * @param address The public address to query.
   * @returns A promise that resolves to the account's info, including balance and nonce.
   */
  getAccountInfo(address: string): Promise<BlockchainAccountInfo>;

  /**
   * Checks the status of a previously submitted transaction.
   * @param hash The transaction hash to check.
   * @returns A promise that resolves to the current status of the transaction.
   */
  getTransactionStatus(hash: string): Promise<TransactionStatus>;

  // =========================================================================
  // CUSTODIAL WRITE METHODS (Require a private key for direct signing)
  // =========================================================================

  /**
   * Generates a new wallet managed by our platform.
   * @returns A promise that resolves to a new BlockchainWallet object, including its private key.
   */
  generateNewWallet(): Promise<BlockchainWallet>;

  /**
   * Creates a new escrow, signed by the provided private key.
   * @param params The generic parameters for creating the escrow.
   * @param privateKey The private key of the sender's wallet to sign the transaction.
   * @returns A promise that resolves to the result of the transaction submission.
   */
  createEscrow(params: GenericEscrowParams, privateKey: string): Promise<TransactionResult>;

  /**
   * Fulfills an existing escrow, signed by the provided private key.
   * @param escrowId The identifier of the escrow to fulfill.
   * @param privateKey The private key of the fulfiller's wallet.
   * @returns A promise that resolves to the result of the transaction submission.
   */
  fulfillEscrow(escrowId: string, privateKey: string): Promise<TransactionResult>;

  /**
   * Releases funds from an expired or fulfilled escrow, signed by the provided private key.
   * @param escrowId The identifier of the escrow to release.
   * @param privateKey The private key of the appropriate party (creator or fulfiller).
   * @returns A promise that resolves to the result of the transaction submission.
   */
  releaseEscrow(escrowId: string, privateKey: string): Promise<TransactionResult>;

  // =========================================================================
  // NON-CUSTODIAL METHODS (For interacting with user's browser wallets)
  // =========================================================================

  /**
   * Prepares a transaction object for creating an escrow, to be sent to a user's
   * external wallet (e.g., Phantom, MetaMask) for signing.
   * @param params The generic parameters for creating the escrow.
   * @returns A promise that resolves to the raw, unsigned transaction object in the format expected by the specific blockchain's client-side tooling.
   */
  prepareCreateEscrowTransaction(params: GenericEscrowParams): Promise<any>;

  /**
   * Submits a transaction that has already been signed by an external wallet.
   * @param signedTx The raw signed transaction object returned from the user's wallet.
   * @returns A promise that resolves to the result of the transaction submission.
   */
  submitSignedTransaction(signedTx: any): Promise<TransactionResult>;
}
