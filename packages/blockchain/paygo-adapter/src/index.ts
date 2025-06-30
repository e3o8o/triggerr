// ===========================================================================
// PayGo ADAPTER PACKAGE - Public API
// ===========================================================================

/**
 * PayGo Adapter - Clean interface for @witnessco/paygo-ts-client
 * 
 * This module serves as a proxy re-export and wrapper for the PayGo client,
 * working around known TypeScript declaration issues in the upstream package.
 */

export { default as PayGoClientService } from "./client";
export {
  safePayGoCall,
  convertToPayGoAmount,
  convertFromPayGoAmount,
} from "./utils";
export type { SafePayGoCallResult } from "./utils";

// @ts-ignore - The paygo-ts-client has faulty type declarations, but the exports are available at runtime.
// Re-export PayGo transaction classes to avoid TypeScript import issues
export {
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  PaygoClient,
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  Transfer,
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  CreateEscrow,
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  FulfillEscrow,
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  ReleaseEscrow,
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  FaucetRequest,
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  UpsertDelegation,
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  DelegateTransfer,
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  SignerConfig,
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  type TransactionResponse,
  // @ts-ignore - Known upstream typing issue, see client.ts for full explanation
  type ProcessedTransaction,
} from "@witnessco/paygo-ts-client";

// Export initialization functions
export {
  initPayGoClient,
  initPayGoClientWithNewWallet,
  getPayGoClient,
  isPayGoClientInitialized,
  resetPayGoClient,
} from "./init";

export type { Hex } from "viem";

// Export transaction parser utilities
export {
  parsePayGoTransaction,
  parsePayGoTransactions,
  paginateTransactions,
  getTransactionHistory,
} from "./transaction-parser";
export type { ParsedTransaction } from "./transaction-parser";

// Default export for compatibility
export { default } from "./client";
