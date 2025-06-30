// Comprehensive PayGo Transaction Analysis Script
// This script analyzes PayGo's transaction data structures and available methods
// to properly implement transaction history functionality

import { PaygoClient } from "@witnessco/paygo-ts-client";

console.log('🔍 COMPREHENSIVE PAYGO TRANSACTION ANALYSIS 🔍\n');

async function analyzePayGoTransactions() {
  try {
    // Use the same test private key from working tests
    const alicePk = '0xa5d78e82e9f198698ecca11c99c97580e47f5972cf0b8d614c32b6032ae15045';
    const bobPk = '0xb5d78e82e9f198698ecca11c99c97580e47f5972cf0b8d614c32b6032ae15046';

    // Create and initialize clients
    const aliceClient = new PaygoClient();
    await aliceClient.setPk(alicePk);

    const bobClient = new PaygoClient();
    await bobClient.setPk(bobPk);

    const aliceAddress = await aliceClient.address();
    const bobAddress = await bobClient.address();

    console.log(`Alice address: ${aliceAddress}`);
    console.log(`Bob address: ${bobAddress}`);

    // ==========================================
    // STEP 1: Analyze Available Methods
    // ==========================================
    console.log('\n📋 STEP 1: ANALYZING AVAILABLE PAYGO CLIENT METHODS');
    const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(aliceClient));
    console.log('All PayGo Client Methods:');
    allMethods.forEach(method => {
      if (typeof aliceClient[method] === 'function') {
        console.log(`  - ${method}`);
      }
    });

    // ==========================================
    // STEP 2: Analyze getTransactionsBySigner Data Structure
    // ==========================================
    console.log('\n📋 STEP 2: ANALYZING getTransactionsBySigner DATA STRUCTURE');

    try {
      const transactions = await aliceClient.getTransactionsBySigner(aliceAddress);
      console.log(`Found ${transactions.length} transactions for Alice`);

      if (transactions.length > 0) {
        console.log('\n🔬 DETAILED TRANSACTION STRUCTURE ANALYSIS:');

        transactions.slice(0, 3).forEach((tx, index) => {
          console.log(`\n--- Transaction ${index + 1} ---`);
          console.log('Raw transaction object:');
          console.log(JSON.stringify(tx, null, 2));

          // Analyze structure
          console.log('\nStructure analysis:');
          console.log(`- timestamp: ${tx.timestamp || 'MISSING'}`);
          console.log(`- signedTransaction exists: ${!!tx.signedTransaction}`);

          if (tx.signedTransaction) {
            console.log(`- unsignedTransaction exists: ${!!tx.signedTransaction.unsignedTransaction}`);
            console.log(`- signature exists: ${!!tx.signedTransaction.signature}`);

            if (tx.signedTransaction.unsignedTransaction) {
              const unsignedTx = tx.signedTransaction.unsignedTransaction;
              console.log(`- nonce: ${unsignedTx.nonce || 'MISSING'}`);
              console.log(`- transactionParams exists: ${!!unsignedTx.transactionParams}`);

              if (unsignedTx.transactionParams) {
                console.log('- transactionParams content:');
                Object.keys(unsignedTx.transactionParams).forEach(key => {
                  console.log(`  - ${key}: ${unsignedTx.transactionParams[key]}`);
                });
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error getting transactions by signer:', error.message);
    }

    // ==========================================
    // STEP 3: Test getTransactionByHash Method
    // ==========================================
    console.log('\n📋 STEP 3: TESTING getTransactionByHash METHOD');

    // Let's try to get transaction details using hashes we know from our test
    const knownHashes = [
      '0xd353e2ba417709552164003da9f2af01096e59662e57fd20d089bc5a61c3f918', // Faucet
      '0x7e71fbf3eece7588521f173c5dea1ecac6e731222190e50f19c6f477495281a1', // Transfer
      '0x2d80ccc77cd2dd4ff94d1631ae376878a86fe0e5904fc9828d7037b63d2e82e8', // Escrow create
    ];

    for (const hash of knownHashes) {
      try {
        console.log(`\n🔍 Fetching transaction by hash: ${hash}`);
        const txData = await aliceClient.getTransactionByHash(hash);
        console.log('Transaction data by hash:');
        console.log(JSON.stringify(txData, null, 2));

        // Analyze this structure
        if (txData) {
          console.log('\nTransaction by hash analysis:');
          console.log(`- Has hash field: ${!!txData.hash}`);
          console.log(`- Has from field: ${!!txData.from}`);
          console.log(`- Has to field: ${!!txData.to}`);
          console.log(`- Has amount field: ${!!txData.amount}`);
          console.log(`- Has type field: ${!!txData.type}`);
          console.log(`- Has timestamp field: ${!!txData.timestamp}`);
          console.log(`- All keys: ${Object.keys(txData).join(', ')}`);
        }
      } catch (error) {
        console.log(`Error fetching transaction ${hash}: ${error.message}`);
      }
    }

    // ==========================================
    // STEP 4: Test Other Transaction Methods
    // ==========================================
    console.log('\n📋 STEP 4: TESTING OTHER TRANSACTION METHODS');

    // Test getTransactionsByBlock
    try {
      console.log('\n🔍 Testing getTransactionsByBlock...');
      // We need to find a recent block number first
      const recentTransactions = await aliceClient.getTransactionsBySigner(aliceAddress);
      if (recentTransactions.length > 0) {
        // Try to extract block number from recent transactions
        console.log('Recent transaction for block analysis:', JSON.stringify(recentTransactions[0], null, 2));
      }
    } catch (error) {
      console.log('Error testing getTransactionsByBlock:', error.message);
    }

    // ==========================================
    // STEP 5: Test Escrow Methods for Transaction Data
    // ==========================================
    console.log('\n📋 STEP 5: TESTING ESCROW METHODS');

    try {
      console.log('\n🔍 Testing getEscrowsBySpender...');
      const escrowsBySpender = await aliceClient.getEscrowsBySpender(aliceAddress);
      console.log(`Found ${escrowsBySpender.length} escrows as spender`);
      if (escrowsBySpender.length > 0) {
        console.log('Sample escrow by spender:');
        console.log(JSON.stringify(escrowsBySpender[0], null, 2));
      }
    } catch (error) {
      console.log('Error getting escrows by spender:', error.message);
    }

    try {
      console.log('\n🔍 Testing getEscrowsByFulfiller...');
      const escrowsByFulfiller = await aliceClient.getEscrowsByFulfiller(aliceAddress);
      console.log(`Found ${escrowsByFulfiller.length} escrows as fulfiller`);
      if (escrowsByFulfiller.length > 0) {
        console.log('Sample escrow by fulfiller:');
        console.log(JSON.stringify(escrowsByFulfiller[0], null, 2));
      }
    } catch (error) {
      console.log('Error getting escrows by fulfiller:', error.message);
    }

    // ==========================================
    // STEP 6: Explore Transaction Signature for Hash Extraction
    // ==========================================
    console.log('\n📋 STEP 6: EXPLORING TRANSACTION SIGNATURE FOR HASH EXTRACTION');

    try {
      const transactions = await aliceClient.getTransactionsBySigner(aliceAddress);
      if (transactions.length > 0) {
        const tx = transactions[0];
        console.log('\nAnalyzing signature and hash possibilities:');

        if (tx.signedTransaction && tx.signedTransaction.signature) {
          console.log(`Signature: ${tx.signedTransaction.signature}`);
          console.log(`Signature length: ${tx.signedTransaction.signature.length}`);

          // Try to compute hash from signature + transaction data
          console.log('Attempting to derive transaction hash...');

          // The transaction hash might be derivable from the signature and transaction data
          // Let's see if we can find a pattern
        }
      }
    } catch (error) {
      console.log('Error analyzing signatures:', error.message);
    }

    // ==========================================
    // STEP 7: Account Information for Context
    // ==========================================
    console.log('\n📋 STEP 7: ACCOUNT INFORMATION FOR CONTEXT');

    try {
      const aliceAccount = await aliceClient.getAccount(aliceAddress);
      console.log('Alice account info:');
      console.log(`- Balance: ${aliceAccount.balance}`);
      console.log(`- Nonce: ${aliceAccount.nonce}`);
      console.log(`- All account fields: ${Object.keys(aliceAccount).join(', ')}`);
    } catch (error) {
      console.log('Error getting account info:', error.message);
    }

    // ==========================================
    // STEP 8: Summary and Recommendations
    // ==========================================
    console.log('\n📋 STEP 8: ANALYSIS SUMMARY AND RECOMMENDATIONS');
    console.log('\n🎯 KEY FINDINGS:');
    console.log('1. getTransactionsBySigner() returns transactions but in a different format than expected');
    console.log('2. Transaction data includes timestamp and signed transaction details');
    console.log('3. Need to extract transaction type, amount, and hash from the available data');
    console.log('4. May need to correlate with escrow data for complete transaction history');

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Create a transaction parser that handles the actual PayGo data structure');
    console.log('2. Map transaction types based on transactionParams content');
    console.log('3. Extract amounts from transaction parameters or correlate with account balance changes');
    console.log('4. Generate or derive transaction hashes if not directly available');
    console.log('5. Combine multiple data sources (transactions, escrows, account history) for complete picture');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the analysis
analyzePayGoTransactions().catch(console.error);
