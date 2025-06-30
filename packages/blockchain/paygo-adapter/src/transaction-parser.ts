/**
 * PayGo Transaction Parser
 *
 * This module provides utilities to parse PayGo blockchain transaction data
 * into a format suitable for our transaction history API endpoints.
 *
 * PayGo uses a base-100 system (100 units = $1.00).
 * Transaction types are determined by the class name of transactionParams.
 */

import type { Hex } from "viem";
import { convertFromPayGoAmount, formatBalanceDisplay } from "./utils";

/**
 * Standard transaction interface for our API
 */
export interface ParsedTransaction {
  id: string;
  type:
    | "send"
    | "receive"
    | "escrow_create"
    | "escrow_fulfill"
    | "escrow_release"
    | "faucet";
  amount: string; // Decimal format (e.g., "1.50")
  formattedAmount: string; // Display format (e.g., "$1.50")
  from?: string;
  to?: string;
  date: string; // ISO timestamp
  hash: string;
  metadata?: {
    nonce: string;
    rawType: string;
    className?: string;
    escrowId?: string;
    signature: string;
  };
}

/**
 * Raw PayGo transaction structure
 */
interface PayGoRawTransaction {
  timestamp: string;
  signedTransaction: {
    unsignedTransaction: {
      nonce: string;
      transactionParams: any;
    };
    signature: string;
  };
}

/**
 * Convert PayGo amount (BigInt with base-100 system) to decimal string
 */
function convertPayGoAmount(amount: bigint): string {
  try {
    // Use the corrected utility function
    return convertFromPayGoAmount(amount);
  } catch (error) {
    console.warn("[PayGoParser] Error converting amount:", error);
    return "0";
  }
}

/**
 * Format amount for display with currency symbol
 */
function formatAmountDisplay(amount: string): string {
  const numericAmount = parseFloat(amount);
  return `$${numericAmount.toFixed(2)}`;
}

/**
 * Extract transaction hash from signature
 */
function extractTransactionHash(signature: string): string {
  // Use first 64 characters of signature as transaction hash
  return `0x${signature.slice(0, 64)}`;
}

/**
 * Parse transaction parameters based on class type
 */
function parseTransactionParams(transactionParams: any, signerAddress: string) {
  if (!transactionParams) {
    return {
      type: "unknown",
      amount: "0",
      from: signerAddress,
      to: null,
      metadata: {},
    };
  }

  const className = transactionParams.constructor?.name || "Unknown";
  let type = "unknown";
  let amount = "0";
  let from: string | null = signerAddress;
  let to: string | null = null;
  let metadata: Record<string, any> = { className };

  switch (className) {
    case "Transfer":
      type = "send";
      try {
        if (transactionParams.to) {
          to = transactionParams.to;
        }
        if (transactionParams.value) {
          amount = convertPayGoAmount(BigInt(transactionParams.value));
        }
      } catch (error) {
        console.warn("[PayGoParser] Error parsing Transfer:", error);
      }
      break;

    case "FaucetRequest":
      type = "faucet";
      from = null; // Faucet comes from system
      to = signerAddress; // Faucet goes to the requester
      try {
        if (transactionParams.value) {
          amount = convertPayGoAmount(BigInt(transactionParams.value));
        }
      } catch (error) {
        console.warn("[PayGoParser] Error parsing FaucetRequest:", error);
      }
      break;

    case "CreateEscrow":
      type = "escrow_create";
      try {
        if (transactionParams.amount !== undefined) {
          amount = convertPayGoAmount(BigInt(transactionParams.amount));
        }
        if (transactionParams.fulfiller) {
          to = transactionParams.fulfiller;
        }
        if (transactionParams.id) {
          metadata.escrowId = transactionParams.id;
        }
      } catch (error) {
        console.warn("[PayGoParser] Error parsing CreateEscrow:", error);
      }
      break;

    case "FulfillEscrow":
      type = "escrow_fulfill";
      try {
        if (transactionParams.id) {
          metadata.escrowId = transactionParams.id;
        }
        // For fulfill, the signer is accepting an escrow assigned to them
        from = null; // Will be determined by escrow details
        to = signerAddress;
      } catch (error) {
        console.warn("[PayGoParser] Error parsing FulfillEscrow:", error);
      }
      break;

    case "ReleaseEscrow":
      type = "escrow_release";
      try {
        if (transactionParams.id) {
          metadata.escrowId = transactionParams.id;
        }
        // For release, the signer is releasing escrow funds to the fulfiller
        // Amount and recipient would need to be looked up from escrow details
      } catch (error) {
        console.warn("[PayGoParser] Error parsing ReleaseEscrow:", error);
      }
      break;

    default:
      console.warn(`[PayGoParser] Unknown transaction class: ${className}`);
      break;
  }

  return {
    type,
    amount,
    from,
    to,
    metadata,
  };
}

/**
 * Parse a single PayGo transaction into our standard format
 */
export function parsePayGoTransaction(
  rawTransaction: PayGoRawTransaction,
  signerAddress: string,
): ParsedTransaction | null {
  try {
    const { timestamp, signedTransaction } = rawTransaction;

    if (!signedTransaction?.unsignedTransaction) {
      console.warn("[PayGoParser] Invalid transaction structure");
      return null;
    }

    const { unsignedTransaction, signature } = signedTransaction;
    const { transactionParams, nonce } = unsignedTransaction;

    // Parse transaction parameters
    const parsed = parseTransactionParams(transactionParams, signerAddress);

    // Generate transaction hash
    const hash = extractTransactionHash(signature);

    // Determine final transaction type for display
    let displayType = parsed.type as ParsedTransaction["type"];

    // Handle special cases
    if (parsed.type === "faucet") {
      displayType = "receive"; // Faucet requests show as received funds
    }

    // Create the final transaction object
    const transaction: ParsedTransaction = {
      id: hash,
      type: displayType,
      amount: parsed.amount,
      formattedAmount: formatAmountDisplay(parsed.amount),
      from: parsed.from || undefined,
      to: parsed.to || undefined,
      date: new Date(timestamp).toISOString(),
      hash,
      metadata: {
        nonce,
        rawType: parsed.type,
        className: parsed.metadata.className,
        escrowId: parsed.metadata.escrowId,
        signature,
      },
    };

    return transaction;
  } catch (error) {
    console.error("[PayGoParser] Error parsing transaction:", error);
    return null;
  }
}

/**
 * Parse multiple PayGo transactions
 */
export function parsePayGoTransactions(
  rawTransactions: PayGoRawTransaction[],
  signerAddress: string,
): ParsedTransaction[] {
  const parsedTransactions: ParsedTransaction[] = [];

  for (const rawTx of rawTransactions) {
    try {
      const parsed = parsePayGoTransaction(rawTx, signerAddress);
      if (parsed) {
        parsedTransactions.push(parsed);
      }
    } catch (error) {
      console.warn("[PayGoParser] Skipping malformed transaction:", error);
      continue;
    }
  }

  // Sort by date, newest first
  parsedTransactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return parsedTransactions;
}

/**
 * Apply pagination to parsed transactions
 */
export function paginateTransactions(
  transactions: ParsedTransaction[],
  page: number = 1,
  limit: number = 20,
) {
  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  return {
    transactions: paginatedTransactions,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  };
}

/**
 * Enhanced transaction fetcher with parsing
 */
export async function getTransactionHistory(
  paygoClient: any,
  address: string,
  options: {
    page?: number;
    limit?: number;
  } = {},
): Promise<{
  transactions: ParsedTransaction[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}> {
  try {
    // Fetch raw transactions from PayGo
    const rawTransactions = await paygoClient.getTransactionsBySigner(address);

    // Parse transactions
    const parsedTransactions = parsePayGoTransactions(rawTransactions, address);

    // Apply pagination
    const result = paginateTransactions(
      parsedTransactions,
      options.page || 1,
      options.limit || 20,
    );

    return result;
  } catch (error) {
    console.error("[PayGoParser] Error fetching transaction history:", error);
    throw error;
  }
}
