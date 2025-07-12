import { PayGoClientService } from "@triggerr/paygo-adapter";
import {
  SignerConfig,
  FaucetRequest,
  Transfer,
  CreateEscrow,
  FulfillEscrow,
  ReleaseEscrow,
  UpsertDelegation,
  DelegateTransfer,
  type TransactionResponse,
  type ProcessedTransaction,
} from "@triggerr/paygo-adapter";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hashMessage } from "viem";

// Test private keys (from docs)
const alicePk =
  "0x1476431d1020e741bdfb5af0e6f4d8a1d58d4f7b4de09d5053bfec86a20a7649";
const bobPk =
  "0x6476431d1020e741bdfb5af0e6f4d8a1d58d4f7b4de09d5053bfec86a20a7649";

// Utility functions
function formatBalance(balanceInCents: bigint): string {
  const dollars = balanceInCents / 100n;
  const centsRemainder = balanceInCents % 100n;
  return `${balanceInCents} cents ($${dollars}.${centsRemainder.toString().padStart(2, "0")})`;
}

// Simple function to get balance of user (from docs)
async function getBalance(client: PayGoClientService, address: string) {
  const account = await client.getAccount(address as `0x${string}`);
  return account.balance;
}

async function runComprehensivePaygoTest() {
  console.log("🔹🔹🔹 COMPREHENSIVE PAYGO TEST 🔹🔹🔹\n");

  try {
    // =====================================
    // 📋 TEST 1: BASIC CLIENT SETUP & ACCOUNTS
    // =====================================
    console.log("📋 TEST 1: BASIC CLIENT SETUP & ACCOUNTS");

    // Create a client with local signing (from docs)
    const localClient = new PayGoClientService();
    await localClient.setPk(alicePk);
    console.log("✅ Local client created successfully!");

    // Or create a client with viem wallet (from docs)
    const viemClient = new PayGoClientService({
      viemWalletClient: createWalletClient({
        // sample account and transport
        account: privateKeyToAccount(bobPk),
        transport: http("https://eth.llamarpc.com"),
      }),
    });
    console.log("✅ Viem client created successfully!");

    // Get current addresses (from docs)
    const aliceAddress = await localClient.address();
    const bobAddress = await viemClient.address();
    console.log(`Alice address: ${aliceAddress}`);
    console.log(`Bob address: ${bobAddress}`);

    // Get account information (from docs)
    const aliceAccount = await localClient.getAccount(
      aliceAddress as `0x${string}`,
    );
    const bobAccount = await viemClient.getAccount(bobAddress as `0x${string}`);
    console.log(`Alice balance: ${formatBalance(aliceAccount.balance)}`);
    console.log(`Alice nonce: ${aliceAccount.nonce}`);
    console.log(`Bob balance: ${formatBalance(bobAccount.balance)}`);
    console.log(`Bob nonce: ${bobAccount.nonce}`);

    // =====================================
    // 📋 TEST 2: BASIC FAUCET & TRANSFER
    // =====================================
    console.log("\n📋 TEST 2: BASIC FAUCET & TRANSFER");

    // Request tokens from faucet (from docs)
    const faucetRequest = new FaucetRequest(1000000000000000000n); // amount in cents
    // Send the faucet request
    const faucetResponse =
      await localClient.signAndPostTransactionFromParams(faucetRequest);
    console.log(
      "✅ Faucet request sent, receipt:",
      (faucetResponse as any).hash,
    );
    console.log(
      "🪪 Full faucetResponse:",
      JSON.stringify(
        faucetResponse,
        (key, value) => (typeof value === "bigint" ? value.toString() : value),
        2,
      ),
    );
    // Use ProcessedTransaction type
    if (faucetResponse.hash) {
      const tx: ProcessedTransaction = await localClient.getTransactionByHash(
        faucetResponse.hash,
      );
      console.log("Fetched transaction by hash:", tx);
    }

    // Recipient address (from docs)
    const recipientAddress = "0x1A005245F091CEE6E5A6169eb76316F5451C842E";
    // Create and send a transfer (from docs)
    const transfer = new Transfer(
      recipientAddress, // recipient address
      1000000000000000000n, // amount in cents
    );
    // Send the transfer
    const transferResponse =
      await localClient.signAndPostTransactionFromParams(transfer);
    console.log("✅ Transfer sent, receipt:", (transferResponse as any).hash);

    // =====================================
    // 📋 TEST 3: DELEGATIONS
    // =====================================
    console.log("\n📋 TEST 3: DELEGATIONS");

    // Create clients with local signing (from docs)
    const aliceClient = new PayGoClientService();
    await aliceClient.setPk(alicePk);
    const bobClient = new PayGoClientService();
    await bobClient.setPk(bobPk);

    // Request tokens from faucet to alice (from docs)
    const faucetRequest2 = new FaucetRequest(100000n); // amount in cents
    // Send the faucet request
    const faucetResponse2: TransactionResponse =
      await aliceClient.signAndPostTransactionFromParams(faucetRequest2);
    console.log(
      "✅ Faucet request sent, receipt:",
      (faucetResponse2 as any).hash,
    );

    // Client addresses
    const aliceAddress2 = await aliceClient.address();
    const bobAddress2 = await bobClient.address();
    const charlieAddress = "0x1A005245F091CEE6E5A6169eb76316F5451C842E";

    // Print balances before delegation (from docs)
    console.log(
      `Alice address: ${aliceAddress2} and balance:`,
      await getBalance(aliceClient, aliceAddress2 as `0x${string}`),
    );
    console.log(
      `Bob address: ${bobAddress2} and balance:`,
      await getBalance(bobClient, bobAddress2 as `0x${string}`),
    );
    console.log(
      `Charlie address: ${charlieAddress} and balance:`,
      await getBalance(aliceClient, charlieAddress as `0x${string}`),
    );

    // Create a delegation (from docs)
    const delegationId = hashMessage(crypto.randomUUID()); // 32 byte random hash
    const delegation = new UpsertDelegation(
      delegationId,
      bobAddress2 as `0x${string}`, // delegate address
      1000000000000000000n, // allowance
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // expiration (30 days)
    );
    const delegationResponse =
      await aliceClient.signAndPostTransactionFromParams(delegation);
    console.log("✅ Delegation created:", (delegationResponse as any).hash);

    // Make a delegated transfer (from docs)
    const delegatedTransfer = new DelegateTransfer(
      delegationId,
      100n, // amount
      charlieAddress as `0x${string}`, // recipient
      aliceAddress2 as `0x${string}`, // sender
    );
    const delegatedTransferResponse =
      await bobClient.signAndPostTransactionFromParams(delegatedTransfer);
    console.log(
      "✅ Delegated transfer sent:",
      (delegatedTransferResponse as any).hash,
    );

    // Print balances after delegation (from docs)
    console.log(
      `Alice address: ${aliceAddress2} and balance:`,
      await getBalance(aliceClient, aliceAddress2 as `0x${string}`),
    );
    console.log(
      `Bob address: ${bobAddress2} and balance:`,
      await getBalance(bobClient, bobAddress2 as `0x${string}`),
    );
    console.log(
      `Charlie address: ${charlieAddress} and balance:`,
      await getBalance(aliceClient, charlieAddress as `0x${string}`),
    );

    // =====================================
    // 📋 TEST 4: ESCROWS
    // =====================================
    console.log("\n📋 TEST 4: ESCROWS");

    // Request tokens from faucet to alice (from docs)
    const faucetRequest3 = new FaucetRequest(100000n); // amount in cents
    // Send the faucet request
    const faucetResponse3: TransactionResponse =
      await aliceClient.signAndPostTransactionFromParams(faucetRequest3);
    console.log(
      "✅ Faucet request sent, receipt:",
      (faucetResponse3 as any).hash,
    );

    console.log(
      "Alice balance before creating first escrow:",
      await getBalance(aliceClient, aliceAddress2 as `0x${string}`),
    );
    console.log(
      "Bob balance before creating first escrow:",
      await getBalance(bobClient, bobAddress2 as `0x${string}`),
    );

    // Create an escrow (from docs)
    let escrowId = hashMessage(crypto.randomUUID()); // 32 byte random hash
    let createEscrow = new CreateEscrow(
      escrowId,
      100n, // amount
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // expiration (30 days)
      bobAddress2 as `0x${string}`, // optional fulfiller address
      "0x0000000000000000000000000000000000000000000000000000000000000000", // optional vkey of an sp1 circuit
    );
    const escrowResponse =
      await aliceClient.signAndPostTransactionFromParams(createEscrow);
    console.log("✅ Escrow created:", (escrowResponse as any).hash);

    console.log(
      "Alice balance after creating first escrow:",
      await getBalance(aliceClient, aliceAddress2 as `0x${string}`),
    );
    console.log(
      "Bob balance after creating first escrow:",
      await getBalance(bobClient, bobAddress2 as `0x${string}`),
    );

    // Fulfill an escrow (from docs)
    const fulfillEscrow = new FulfillEscrow(
      escrowId,
      "0x0000000000000000000000000000000000000000000000000000000000000000", // proof
    );
    const fulfillment =
      await bobClient.signAndPostTransactionFromParams(fulfillEscrow);
    console.log("✅ Escrow fulfilled:", (fulfillment as any).hash);

    console.log(
      "Alice balance after fulfilling first escrow:",
      await getBalance(aliceClient, aliceAddress2 as `0x${string}`),
    );
    console.log(
      "Bob balance after fulfilling first escrow:",
      await getBalance(bobClient, bobAddress2 as `0x${string}`),
    );

    // Create a new escrow with short expiration (from docs)
    escrowId = hashMessage(crypto.randomUUID());
    createEscrow = new CreateEscrow(
      escrowId,
      100n, // amount
      new Date(Date.now() + 1 * 1000), // expiration (1 seconds)
      bobAddress2 as `0x${string}`, // optional fulfiller address
      "0x0000000000000000000000000000000000000000000000000000000000000000", // optional vkey of an sp1 circuit
    );
    const escrowResponse2 =
      await aliceClient.signAndPostTransactionFromParams(createEscrow);
    console.log("✅ Escrow created:", (escrowResponse2 as any).hash);

    console.log(
      "Alice balance after creating second escrow:",
      await getBalance(aliceClient, aliceAddress2 as `0x${string}`),
    );
    console.log(
      "Bob balance after creating second escrow:",
      await getBalance(bobClient, bobAddress2 as `0x${string}`),
    );

    // Wait for the escrow to expire (from docs)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Release an expired escrow (from docs)
    const releaseEscrow = new ReleaseEscrow(escrowId);
    const release =
      await aliceClient.signAndPostTransactionFromParams(releaseEscrow);
    console.log("✅ Escrow released:", (release as any).hash);

    console.log(
      "Alice balance after releasing second escrow:",
      await getBalance(aliceClient, aliceAddress2 as `0x${string}`),
    );
    console.log(
      "Bob balance after releasing second escrow:",
      await getBalance(bobClient, bobAddress2 as `0x${string}`),
    );

    // =====================================
    // 📋 TEST 5: TRANSACTION HISTORY
    // =====================================
    console.log("\n📋 TEST 5: TRANSACTION HISTORY");

    const client = new PayGoClientService();
    // Sample transaction hash (from docs)
    const txHash =
      "0x8310e0897e56084d7780b6c12a8943814b4355ad441ae7fd02f1abc541b9eaa0";

    try {
      // Get transaction by hash (from docs)
      const tx = await client.getTransactionByHash(txHash);
      console.log("✅ Transaction found:", tx);
    } catch (error) {
      console.log("ℹ️ Sample transaction not found (expected for test)");
    }

    // Get transactions by signer (from docs)
    const testAddress = await client.address();
    const txs = await client.getTransactionsBySigner(
      testAddress as `0x${string}`,
    );
    console.log(`✅ Found ${txs.length} transactions by signer ${testAddress}`);

    // Get transactions in a block (from docs)
    try {
      const blockTxs = await client.getTransactionsByBlock(1n);
      console.log(`✅ Found ${blockTxs.length} transactions in block 1`);
    } catch (error) {
      console.log("ℹ️ Could not fetch block transactions (may be empty)");
    }

    // =====================================
    // 📋 TEST 6: SWITCHING SIGNING METHODS
    // =====================================
    console.log("\n📋 TEST 6: SWITCHING SIGNING METHODS");

    const localPk =
      "0x1476431d1020e741bdfb5af0e6f4d8a1d58d4f7b4de09d5053bfec86a20a7649";
    const viemPk =
      "0x6476431d1020e741bdfb5af0e6f4d8a1d58d4f7b4de09d5053bfec86a20a7649";

    // Start with local signing (from docs)
    const switchingClient = new PayGoClientService();
    await switchingClient.setPk(localPk);

    // Create a viem wallet client (from docs)
    const viemWalletClient = createWalletClient({
      // sample account and transport
      account: privateKeyToAccount(viemPk),
      transport: http("https://eth.llamarpc.com"),
    });

    // Setup viem wallet client in paygo client (from docs)
    await switchingClient.setViemWalletClient(viemWalletClient);

    // Request tokens from faucet to viem signer's address (from docs)
    const faucetRequestViem = new FaucetRequest(1000000000000000000n); // amount in cents
    const faucetResponseViem =
      await switchingClient.signAndPostTransactionFromParams(
        faucetRequestViem,
        SignerConfig.Viem,
      );
    console.log(
      "✅ Faucet request sent (viem):",
      (faucetResponseViem as any).hash,
    );

    // Request tokens from faucet to local signer's address (from docs)
    const faucetRequestLocal = new FaucetRequest(1000000000000000000n); // amount in cents
    const faucetResponseLocal =
      await switchingClient.signAndPostTransactionFromParams(
        faucetRequestLocal,
        SignerConfig.Local,
      );
    console.log(
      "✅ Faucet request sent (local):",
      (faucetResponseLocal as any).hash,
    );

    // =====================================
    // 📋 TEST SUMMARY
    // =====================================
    console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY! 🎉");
    console.log(
      "✅ All Paygo features tested according to documentation examples",
    );
  } catch (error: any) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    throw error;
  }
}

// Chat message handler (separate from blockchain tests)
export async function handleChatMessageRequest(
  req: Request,
): Promise<Response> {
  const userId = "placeholder-user-id";
  let body;

  try {
    body = await req.json();
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "INVALID_JSON",
        message: "Invalid JSON in request body.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(`[API Chat Message] Received request from user: ${userId}`);

  const responseData = {
    response: `(Mock) Received your message: "${body.message}"`,
    conversationId: body.conversationId || `new_conv_${Date.now()}`,
    message: "Chat message processed successfully (mocked).",
  };

  return new Response(JSON.stringify({ data: responseData }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// Run the test
runComprehensivePaygoTest().catch(console.error);
