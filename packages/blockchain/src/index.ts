// ===========================================================================
// BLOCKCHAIN PACKAGE - Main Exports
// ===========================================================================

/**
 * Main blockchain package that re-exports utilities and interfaces
 * from various blockchain-related packages in the monorepo.
 */

// Re-export PayGo adapter utilities
export {
  PayGoClientService,
  formatBalanceDisplay,
  formatAddressDisplay,
  convertToPayGoAmount,
  convertFromPayGoAmount,
  safePayGoCall,
  initPayGoClient,
  initPayGoClientWithNewWallet,
  getPayGoClient,
  isPayGoClientInitialized,
  resetPayGoClient,
  parsePayGoTransaction,
  parsePayGoTransactions,
  paginateTransactions,
  getTransactionHistory,
} from "@triggerr/paygo-adapter";

// Re-export PayGo adapter types
export type {
  SafePayGoCallResult,
  ParsedTransaction,
  Hex,
} from "@triggerr/paygo-adapter";

// Re-export blockchain interface types
export type {
  BlockchainProviderName,
  BlockchainWallet,
  BlockchainAccountInfo,
  GenericEscrowParams,
  TransactionResult,
  TransactionStatus,
  WalletType,
} from "@triggerr/blockchain-interface";

// Re-export blockchain interface service
export type { IBlockchainService } from "@triggerr/blockchain-interface";
