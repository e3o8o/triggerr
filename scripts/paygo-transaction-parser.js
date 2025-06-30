// PayGo Transaction Parser with BigInt Handling
// This parser extracts meaningful transaction data from PayGo's blockchain responses
// and converts them into a format suitable for our transaction history API

import { PaygoClient } from "@witnessco/paygo-ts-client";
import { hashMessage } from "viem";

/**
 * Custom JSON serializer that handles BigInt values
 */
function safeJsonStringify(obj, space = 2) {
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    },
    space,
  );
}

/**
 * Safe JSON parser for PayGo responses
 */
function safeJsonParse(str) {
  try {
    return JSON.parse(str, (key, value) => {
      // Convert large numeric strings back to BigInt if they look like BigInt values
      if (typeof value === "string" && /^\d{15,}$/.test(value)) {
        return BigInt(value);
      }
      return value;
    });
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

/**
 * Extract transaction type from PayGo transaction parameters
 */
function extractTransactionType(transactionParams, signature) {
  if (!transactionParams) return "unknown";

  // Check for escrow ID (indicates escrow operations)
  if (transactionParams.id) {
    // Could be escrow create, fulfill, or release
    // We'll need to check the signature or other parameters to determine exact type
    return "escrow";
  }

  // Check for transfer parameters
  if (transactionParams.to && transactionParams.amount) {
    return "transfer";
  }

  // Check for faucet parameters
  if (transactionParams.amount && !transactionParams.to) {
    return "faucet";
  }

  // Default to unknown
  return "unknown";
}

/**
 * Extract amount from transaction parameters or derive from context
 */
function extractAmount(transactionParams, txType) {
  if (!transactionParams) return "0";

  // Direct amount extraction
  if (transactionParams.amount) {
    try {
      const amount = BigInt(transactionParams.amount);
      // Convert from PayGo cents to dollars
      return (Number(amount) / 100).toFixed(2);
    } catch (error) {
      console.warn("Error converting amount:", error);
      return "0.00";
    }
  }

  // For escrow operations, we might need to derive amount differently
  if (txType === "escrow" && transactionParams.escrowAmount) {
    try {
      const amount = BigInt(transactionParams.escrowAmount);
      return (Number(amount) / 100).toFixed(2);
    } catch (error) {
      console.warn("Error converting escrow amount:", error);
      return "0.00";
    }
  }

  return "0.00";
}

/**
 * Generate a transaction hash from transaction data
 * Since PayGo doesn't provide direct hash access, we'll create a deterministic hash
 */
function generateTransactionHash(transaction, address) {
  const { timestamp, signedTransaction } = transaction;

  if (signedTransaction && signedTransaction.signature) {
    // Use the signature as the transaction hash (it's unique per transaction)
    return `0x${signedTransaction.signature.slice(0, 64)}`;
  }

  // Fallback: create hash from timestamp + nonce + address
  const nonce = signedTransaction?.unsignedTransaction?.nonce || "0";
  const hashInput = `${timestamp}-${nonce}-${address}`;
  return hashMessage(hashInput);
}

/**
 * Extract addresses from transaction parameters
 */
function extractAddresses(transactionParams, signerAddress) {
  const addresses = {
    from: signerAddress,
    to: null,
  };

  if (transactionParams.to) {
    addresses.to = transactionParams.to;
  }

  if (transactionParams.fulfiller) {
    addresses.to = transactionParams.fulfiller;
  }

  return addresses;
}

/**
 * Parse a single PayGo transaction into our standard format
 */
function parsePayGoTransaction(rawTransaction, signerAddress) {
  try {
    const { timestamp, signedTransaction } = rawTransaction;

    if (!signedTransaction || !signedTransaction.unsignedTransaction) {
      console.warn("Invalid transaction structure:", rawTransaction);
      return null;
    }

    const { unsignedTransaction } = signedTransaction;
    const { transactionParams, nonce } = unsignedTransaction;

    // Extract basic transaction info
    const txType = extractTransactionType(
      transactionParams,
      signedTransaction.signature,
    );
    const amount = extractAmount(transactionParams, txType);
    const hash = generateTransactionHash(rawTransaction, signerAddress);
    const addresses = extractAddresses(transactionParams, signerAddress);

    // Determine transaction direction and type
    let type = "send";
    if (txType === "faucet") {
      type = "receive";
    } else if (txType === "escrow") {
      type = "escrow_create"; // Default, could be refined
    } else if (
      addresses.to &&
      addresses.to.toLowerCase() === signerAddress.toLowerCase()
    ) {
      type = "receive";
    }

    // Format amount for display
    const numericAmount = parseFloat(amount);
    const formattedAmount = `$${numericAmount.toFixed(2)}`;

    return {
      id: hash,
      type,
      amount,
      formattedAmount,
      from: addresses.from,
      to: addresses.to,
      date: new Date(timestamp).toISOString(),
      hash,
      metadata: {
        nonce,
        rawType: txType,
        signature: signedTransaction.signature,
        transactionParams,
      },
    };
  } catch (error) {
    console.error("Error parsing PayGo transaction:", error);
    return null;
  }
}

/**
 * Enhanced transaction fetcher with BigInt handling
 */
async function fetchTransactionsBySigner(client, address) {
  try {
    console.log(`[PayGoParser] Fetching transactions for ${address}`);

    // Get raw transactions from PayGo
    const rawTransactions = await client.getTransactionsBySigner(address);
    console.log(
      `[PayGoParser] Found ${rawTransactions.length} raw transactions`,
    );

    // Parse each transaction
    const parsedTransactions = [];

    for (const rawTx of rawTransactions) {
      try {
        // Handle BigInt serialization issue by processing the object directly
        const parsedTx = parsePayGoTransaction(rawTx, address);
        if (parsedTx) {
          parsedTransactions.push(parsedTx);
        }
      } catch (error) {
        console.warn(
          "[PayGoParser] Error parsing individual transaction:",
          error.message,
        );
        continue;
      }
    }

    console.log(
      `[PayGoParser] Successfully parsed ${parsedTransactions.length} transactions`,
    );
    return parsedTransactions;
  } catch (error) {
    console.error("[PayGoParser] Error fetching transactions:", error);
    return [];
  }
}

/**
 * Enhanced transaction fetcher by hash with BigInt handling
 */
async function fetchTransactionByHash(client, hash) {
  try {
    console.log(`[PayGoParser] Fetching transaction by hash: ${hash}`);

    const rawTransaction = await client.getTransactionByHash(hash);

    if (!rawTransaction) {
      console.log(`[PayGoParser] No transaction found for hash: ${hash}`);
      return null;
    }

    // Since we don't know the signer address, we'll extract it from the transaction
    const signerAddress = await client.address(); // This gets the current client's address

    const parsedTx = parsePayGoTransaction(rawTransaction, signerAddress);
    console.log(`[PayGoParser] Successfully parsed transaction by hash`);

    return parsedTx;
  } catch (error) {
    console.error("[PayGoParser] Error fetching transaction by hash:", error);
    return null;
  }
}

/**
 * Get enhanced transaction history with proper PayGo data parsing
 */
async function getEnhancedTransactionHistory(client, address, options = {}) {
  const { page = 1, limit = 20, includeEscrows = true } = options;

  try {
    console.log(
      `[PayGoParser] Getting enhanced transaction history for ${address}`,
    );

    // Fetch transactions from PayGo
    const transactions = await fetchTransactionsBySigner(client, address);

    // Optionally enhance with escrow data
    if (includeEscrows) {
      try {
        // Try to get escrow data to enhance transaction info
        const escrowsAsSpender = await client.getEscrowsBySpender(address);
        const escrowsAsFulfiller = await client.getEscrowsByFulfiller(address);

        // TODO: Correlate escrow data with transactions to provide more detailed info
        console.log(
          `[PayGoParser] Found ${escrowsAsSpender.length} escrows as spender, ${escrowsAsFulfiller.length} as fulfiller`,
        );
      } catch (escrowError) {
        console.warn(
          "[PayGoParser] Could not fetch escrow data:",
          escrowError.message,
        );
      }
    }

    // Sort by date, newest first
    transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    const result = {
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        totalItems: transactions.length,
        totalPages: Math.ceil(transactions.length / limit),
      },
      metadata: {
        address,
        parsedAt: new Date().toISOString(),
        rawTransactionCount: transactions.length,
      },
    };

    console.log(
      `[PayGoParser] Returning ${paginatedTransactions.length} transactions (page ${page}/${result.pagination.totalPages})`,
    );
    return result;
  } catch (error) {
    console.error(
      "[PayGoParser] Error getting enhanced transaction history:",
      error,
    );
    throw error;
  }
}

/**
 * Debug function to analyze transaction structure
 */
async function debugTransactionStructure(client, address) {
  try {
    console.log("\n🔍 DEBUG: ANALYZING TRANSACTION STRUCTURE");

    const rawTransactions = await client.getTransactionsBySigner(address);
    console.log(`Found ${rawTransactions.length} transactions`);

    if (rawTransactions.length > 0) {
      const firstTx = rawTransactions[0];

      console.log("\n📋 First transaction analysis:");
      console.log("- Timestamp:", firstTx.timestamp);
      console.log("- Has signedTransaction:", !!firstTx.signedTransaction);

      if (firstTx.signedTransaction) {
        console.log(
          "- Has unsignedTransaction:",
          !!firstTx.signedTransaction.unsignedTransaction,
        );
        console.log(
          "- Signature length:",
          firstTx.signedTransaction.signature?.length,
        );

        if (firstTx.signedTransaction.unsignedTransaction) {
          const unsignedTx = firstTx.signedTransaction.unsignedTransaction;
          console.log("- Nonce:", unsignedTx.nonce);
          console.log(
            "- TransactionParams keys:",
            Object.keys(unsignedTx.transactionParams || {}),
          );

          // Log transaction params without BigInt serialization issues
          if (unsignedTx.transactionParams) {
            Object.entries(unsignedTx.transactionParams).forEach(
              ([key, value]) => {
                console.log(
                  `  - ${key}:`,
                  typeof value === "bigint" ? value.toString() : value,
                );
              },
            );
          }
        }
      }

      // Test parsing
      const parsed = parsePayGoTransaction(firstTx, address);
      console.log("\n✅ Parsed transaction:", parsed);
    }
  } catch (error) {
    console.error("Debug error:", error);
  }
}

// Export all functions
export {
  safeJsonStringify,
  safeJsonParse,
  parsePayGoTransaction,
  fetchTransactionsBySigner,
  fetchTransactionByHash,
  getEnhancedTransactionHistory,
  debugTransactionStructure,
};

// If run directly, perform debug analysis
if (import.meta.main) {
  console.log("🔍 PAYGO TRANSACTION PARSER DEBUG MODE 🔍\n");

  async function runDebug() {
    try {
      const alicePk =
        "0xa5d78e82e9f198698ecca11c99c97580e47f5972cf0b8d614c32b6032ae15045";
      const client = new PaygoClient();
      await client.setPk(alicePk);
      const address = await client.address();

      console.log(`Testing with address: ${address}`);

      // Run debug analysis
      await debugTransactionStructure(client, address);

      // Test enhanced transaction history
      console.log("\n📋 Testing enhanced transaction history...");
      const history = await getEnhancedTransactionHistory(client, address, {
        limit: 5,
      });
      console.log(`✅ Got ${history.transactions.length} transactions`);

      if (history.transactions.length > 0) {
        console.log("\n📄 Sample parsed transaction:");
        console.log(safeJsonStringify(history.transactions[0]));
      }
    } catch (error) {
      console.error("❌ Debug failed:", error);
    }
  }

  runDebug().catch(console.error);
}
