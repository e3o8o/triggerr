import {
	PayGoClientService,
	FaucetRequest,
	Transfer,
	UpsertDelegation,
	DelegateTransfer,
	CreateEscrow,
	FulfillEscrow,
	ReleaseEscrow,
	SignerConfig,
	type TransactionResponse,
	type ProcessedTransaction,
} from "@triggerr/paygo-adapter";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hashMessage } from "viem";

// Demo function to showcase all Paygo features
async function paygoCompleteDemo() {
	console.log("🚀 Starting Paygo Complete Demo\n");

	// Private keys for different users
	const alicePk = "0x1476431d1020e741bdfb5af0e6f4d8a1d58d4f7b4de09d5053bfec86a20a7649";
	const bobPk = "0x6476431d1020e741bdfb5af0e6f4d8a1d58d4f7b4de09d5053bfec86a20a7649";
	const viemPk = "0x6476431d1020e741bdfb5af0e6f4d8a1d58d4f7b4de09d5053bfec86a20a7649";
	const charlieAddress = "0x1A005245F091CEE6E5A6169eb76316F5451C842E";

	// ======================
	// 1. CLIENT SETUP
	// ======================
	console.log("📝 1. Setting up clients...");
	
	// Create clients with local signing
	const aliceClient = new PayGoClientService();
	await aliceClient.setPk(alicePk);
	
	const bobClient = new PayGoClientService();
	await bobClient.setPk(bobPk);

	// Create a viem wallet client
	const viemWalletClient = createWalletClient({
		account: privateKeyToAccount(viemPk),
		transport: http("https://eth.llamarpc.com"),
	});

	// Create client with viem integration
	const viemClient = new PayGoClientService({
		viemWalletClient,
	});

	// Get addresses
	const aliceAddress = await aliceClient.address();
	const bobAddress = await bobClient.address();
	const viemAddress = await viemClient.address();

	console.log(`Alice address: ${aliceAddress}`);
	console.log(`Bob address: ${bobAddress}`);
	console.log(`Viem address: ${viemAddress}\n`);

	// ======================
	// 2. ACCOUNT MANAGEMENT
	// ======================
	console.log("👤 2. Account Management...");
	
	// Get account information
	const aliceAccount = await aliceClient.getAccount(aliceAddress as `0x${string}`);
	console.log(`Alice balance: ${aliceAccount.balance} cents`);
	console.log(`Alice nonce: ${aliceAccount.nonce}\n`);

	// ======================
	// 3. FAUCET REQUESTS
	// ======================
	console.log("💰 3. Requesting tokens from faucet...");
	
	// Request tokens for Alice
	const aliceFaucetRequest = new FaucetRequest(100000n);
	const aliceFaucetResponse: TransactionResponse = 
		await aliceClient.signAndPostTransactionFromParams(aliceFaucetRequest);
	console.log(`Alice faucet request hash: ${(aliceFaucetResponse as any).hash}`);

	// Request tokens for Bob
	const bobFaucetRequest = new FaucetRequest(100000n);
	const bobFaucetResponse: TransactionResponse = 
		await bobClient.signAndPostTransactionFromParams(bobFaucetRequest);
	console.log(`Bob faucet request hash: ${(bobFaucetResponse as any).hash}`);

	// Request tokens using viem client
	const viemFaucetRequest = new FaucetRequest(100000n);
	const viemFaucetResponse: TransactionResponse = 
		await viemClient.signAndPostTransactionFromParams(viemFaucetRequest);
	console.log(`Viem faucet request hash: ${(viemFaucetResponse as any).hash}\n`);

	// ======================
	// 4. BASIC TRANSFERS
	// ======================
	console.log("💸 4. Making basic transfers...");
	
	// Alice transfers to Charlie
	const transfer = new Transfer(charlieAddress as `0x${string}`, 1000n);
	const transferResponse: TransactionResponse = 
		await aliceClient.signAndPostTransactionFromParams(transfer);
	console.log(`Transfer hash: ${(transferResponse as any).hash}`);

	// Print balances after transfer
	console.log(`Alice balance after transfer: ${await getBalance(aliceClient, aliceAddress as `0x${string}`)}`);
	console.log(`Charlie balance after transfer: ${await getBalance(aliceClient, charlieAddress as `0x${string}`)}\n`);

	// ======================
	// 5. DELEGATIONS
	// ======================
	console.log("🤝 5. Setting up delegations...");
	
	// Create a delegation (Alice delegates to Bob)
	const delegationId = hashMessage(crypto.randomUUID());
	const delegation = new UpsertDelegation(
		delegationId,
		bobAddress as `0x${string}`, // delegate
		50000n, // allowance
		new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiration
	);
	const delegationResponse = await aliceClient.signAndPostTransactionFromParams(delegation);
	console.log(`Delegation created hash: ${(delegationResponse as any).hash}`);

	// Make a delegated transfer (Bob spends Alice's money)
	const delegatedTransfer = new DelegateTransfer(
		delegationId,
		500n, // amount
		charlieAddress as `0x${string}`, // recipient
		aliceAddress as `0x${string}` // sender (Alice's funds)
	);
	const delegatedTransferResponse = 
		await bobClient.signAndPostTransactionFromParams(delegatedTransfer);
	console.log(`Delegated transfer hash: ${(delegatedTransferResponse as any).hash}`);

	console.log(`Alice balance after delegation: ${await getBalance(aliceClient, aliceAddress as `0x${string}`)}`);
	console.log(`Bob balance after delegation: ${await getBalance(bobClient, bobAddress as `0x${string}`)}`);
	console.log(`Charlie balance after delegation: ${await getBalance(aliceClient, charlieAddress)}\n`);

	// Helper function to get account balance
	async function getBalance(client: PayGoClientService, address: `0x${string}`): Promise<bigint> {
		try {
			const account = await client.getAccount(address);
			return account.balance;
		} catch (error) {
			console.warn(`Could not get balance for ${address}:`, error);
			return 0n;
		}
	}
}

// Execute the demo
paygoCompleteDemo().catch(console.error);