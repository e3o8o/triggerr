// Enhanced PayGo Transaction Parser - Deep Analysis
// This script performs a comprehensive analysis of PayGo transaction data
// to extract all available information for proper transaction history display

import { PaygoClient } from "@witnessco/paygo-ts-client";
import { hashMessage } from "viem";

console.log('🔍 ENHANCED PAYGO TRANSACTION DEEP ANALYSIS 🔍\n');

/**
 * Safely extract all properties from an object, handling BigInt values
 */
function extractObjectProperties(obj, prefix = '') {
  const properties = {};

  if (!obj || typeof obj !== 'object') {
    return properties;
  }

  try {
    // Get all property names including non-enumerable ones
    const allKeys = [
      ...Object.keys(obj),
      ...Object.getOwnPropertyNames(obj),
      ...Object.getOwnPropertySymbols(obj).map(s => s.toString())
    ];

    const uniqueKeys = [...new Set(allKeys)];

    for (const key of uniqueKeys) {
      try {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'bigint') {
          properties[fullKey] = value.toString();
        } else if (typeof value === 'function') {
          // Skip functions but note they exist
          properties[fullKey] = '[Function]';
        } else if (value && typeof value === 'object') {
          // Recursively extract nested properties
          properties[fullKey] = '[Object]';
          const nestedProps = extractObjectProperties(value, fullKey);
          Object.assign(properties, nestedProps);
        } else {
          properties[fullKey] = value;
        }
      } catch (error) {
        // Skip properties that can't be accessed
        continue;
      }
    }
  } catch (error) {
    console.warn('Error extracting properties:', error.message);
  }

  return properties;
}

/**
 * Analyze transaction parameter objects in detail
 */
function analyzeTransactionParams(transactionParams) {
  if (!transactionParams) return null;

  console.log('\n🔬 DEEP TRANSACTION PARAMS ANALYSIS:');

  // Extract all properties
  const allProps = extractObjectProperties(transactionParams);

  console.log('All detected properties:');
  Object.entries(allProps).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  // Check if it's a specific transaction type class
  const constructor = transactionParams.constructor;
  if (constructor && constructor.name) {
    console.log(`\nTransaction class: ${constructor.name}`);
  }

  // Try to call methods that might exist
  const methodsToTry = ['tx_type', 'amount', 'to', 'from', 'recipient', 'fulfiller', 'spender'];

  console.log('\nTrying common methods:');
  for (const method of methodsToTry) {
    try {
      if (typeof transactionParams[method] === 'function') {
        const result = transactionParams[method]();
        console.log(`  ${method}(): ${result}`);
      } else if (transactionParams[method] !== undefined) {
        console.log(`  ${method}: ${transactionParams[method]}`);
      }
    } catch (error) {
      // Method doesn't exist or failed
    }
  }

  return allProps;
}

/**
 * Enhanced transaction parser with deeper inspection
 */
function parseTransactionEnhanced(rawTransaction, signerAddress) {
  try {
    const { timestamp, signedTransaction } = rawTransaction;
    const { unsignedTransaction } = signedTransaction;
    const { transactionParams, nonce } = unsignedTransaction;
    const { signature } = signedTransaction;

    console.log(`\n📋 PARSING TRANSACTION (Nonce: ${nonce})`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Signature: ${signature.substring(0, 20)}...`);

    // Deep analysis of transaction parameters
    const paramAnalysis = analyzeTransactionParams(transactionParams);

    // Try to determine transaction type from class name
    let txType = 'unknown';
    let txSubType = null;
    let amount = '0.00';
    let recipientAddress = null;
    let senderAddress = signerAddress;

    if (transactionParams) {
      const className = transactionParams.constructor?.name;
      console.log(`Transaction class name: ${className}`);

      switch (className) {
        case 'Transfer':
          txType = 'transfer';
          // Try to extract transfer details
          try {
            if (typeof transactionParams.tx_type === 'function') {
              txSubType = transactionParams.tx_type();
            }
            // Look for amount and recipient in the object
            if (transactionParams.to) recipientAddress = transactionParams.to;
            if (transactionParams.amount) {
              const amountBigInt = BigInt(transactionParams.amount);
              amount = (Number(amountBigInt) / 100).toFixed(2);
            }
          } catch (e) {
            console.warn('Error extracting transfer details:', e.message);
          }
          break;

        case 'FaucetRequest':
          txType = 'faucet';
          recipientAddress = signerAddress; // Faucet goes to the signer
          try {
            if (transactionParams.amount) {
              const amountBigInt = BigInt(transactionParams.amount);
              amount = (Number(amountBigInt) / 100).toFixed(2);
            }
          } catch (e) {
            console.warn('Error extracting faucet amount:', e.message);
          }
          break;

        case 'CreateEscrow':
          txType = 'escrow';
          txSubType = 'create';
          try {
            if (transactionParams.amount) {
              const amountBigInt = BigInt(transactionParams.amount);
              amount = (Number(amountBigInt) / 100).toFixed(2);
            }
            if (transactionParams.fulfiller) {
              recipientAddress = transactionParams.fulfiller;
            }
          } catch (e) {
            console.warn('Error extracting escrow create details:', e.message);
          }
          break;

        case 'FulfillEscrow':
          txType = 'escrow';
          txSubType = 'fulfill';
          // Fulfilling means accepting an escrow assigned to you
          break;

        case 'ReleaseEscrow':
          txType = 'escrow';
          txSubType = 'release';
          // Releasing means sending the escrow funds to the fulfiller
          break;

        default:
          console.log(`Unknown transaction class: ${className}`);
          break;
      }
    }

    // Generate deterministic hash
    const hash = `0x${signature.slice(0, 64)}`;

    // Determine display type
    let displayType = 'send';
    if (txType === 'faucet') {
      displayType = 'receive';
    } else if (txType === 'escrow') {
      displayType = txSubType ? `escrow_${txSubType}` : 'escrow_create';
    } else if (recipientAddress && recipientAddress.toLowerCase() === signerAddress.toLowerCase()) {
      displayType = 'receive';
    }

    const formattedAmount = `$${parseFloat(amount).toFixed(2)}`;

    const result = {
      id: hash,
      type: displayType,
      amount,
      formattedAmount,
      from: displayType === 'receive' ? (recipientAddress !== signerAddress ? recipientAddress : null) : senderAddress,
      to: displayType === 'send' ? recipientAddress : null,
      date: new Date(timestamp).toISOString(),
      hash,
      metadata: {
        nonce,
        rawType: txType,
        subType: txSubType,
        className: transactionParams?.constructor?.name,
        signature,
        allParams: paramAnalysis,
      },
    };

    console.log('✅ PARSED RESULT:');
    console.log(`  Type: ${result.type}`);
    console.log(`  Amount: ${result.formattedAmount}`);
    console.log(`  From: ${result.from || 'N/A'}`);
    console.log(`  To: ${result.to || 'N/A'}`);
    console.log(`  Hash: ${result.hash}`);

    return result;

  } catch (error) {
    console.error('❌ Error parsing transaction:', error);
    return null;
  }
}

/**
 * Main analysis function
 */
async function runDeepAnalysis() {
  try {
    // Use test keys
    const alicePk = '0xa5d78e82e9f198698ecca11c99c97580e47f5972cf0b8d614c32b6032ae15045';
    const client = new PaygoClient();
    await client.setPk(alicePk);
    const address = await client.address();

    console.log(`🎯 Analyzing transactions for: ${address}`);

    // Get raw transactions
    const rawTransactions = await client.getTransactionsBySigner(address);
    console.log(`\n📊 Found ${rawTransactions.length} raw transactions`);

    // Parse each transaction with enhanced analysis
    const parsedTransactions = [];

    for (let i = 0; i < Math.min(rawTransactions.length, 5); i++) {
      const rawTx = rawTransactions[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`ANALYZING TRANSACTION ${i + 1}/${rawTransactions.length}`);
      console.log(`${'='.repeat(60)}`);

      const parsed = parseTransactionEnhanced(rawTx, address);
      if (parsed) {
        parsedTransactions.push(parsed);
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📋 ANALYSIS SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total transactions: ${rawTransactions.length}`);
    console.log(`Successfully parsed: ${parsedTransactions.length}`);

    if (parsedTransactions.length > 0) {
      const typeCount = parsedTransactions.reduce((acc, tx) => {
        acc[tx.type] = (acc[tx.type] || 0) + 1;
        return acc;
      }, {});

      console.log('\nTransaction types found:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log('\n🎯 RECOMMENDED TRANSACTION HISTORY FORMAT:');
      console.log('Based on the analysis, here\'s how we should structure our transaction endpoint:');

      parsedTransactions.forEach((tx, i) => {
        console.log(`\nTransaction ${i + 1}:`);
        console.log(`  {`);
        console.log(`    "id": "${tx.id}",`);
        console.log(`    "type": "${tx.type}",`);
        console.log(`    "amount": "${tx.amount}",`);
        console.log(`    "formattedAmount": "${tx.formattedAmount}",`);
        console.log(`    "from": ${tx.from ? `"${tx.from}"` : 'null'},`);
        console.log(`    "to": ${tx.to ? `"${tx.to}"` : 'null'},`);
        console.log(`    "date": "${tx.date}",`);
        console.log(`    "hash": "${tx.hash}"`);
        console.log(`  }`);
      });
    }

  } catch (error) {
    console.error('❌ Deep analysis failed:', error);
  }
}

// Run the analysis
runDeepAnalysis().catch(console.error);
