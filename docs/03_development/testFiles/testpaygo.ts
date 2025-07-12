import {
	PayGoClientService,
	type ProcessedTransaction,
} from "@triggerr/paygo-adapter";

const client = new PayGoClientService();
// Sample transaction hash
const txHash =
	"0x8310e0897e56084d7780b6c12a8943814b4355ad441ae7fd02f1abc541b9eaa0";

// Get transaction by hash
const tx: ProcessedTransaction = await client.getTransactionByHash(txHash);
console.log("Transaction:", tx);

// Get transactions by signer
const address = await client.address();
const txs = await client.getTransactionsBySigner(address as `0x${string}`);
console.log(`Found ${txs.length} transactions by signer ${address}`);

// Get transactions in a block
const blockTxs = await client.getTransactionsByBlock(1n);
console.log(`Found ${blockTxs.length} transactions in block 1`);
