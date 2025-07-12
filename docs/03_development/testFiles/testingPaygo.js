import { PaygoClient } from "@witnessco/paygo-ts-client";

// Create a client with local signing
// If private key is not set, client chooses random
const client = new PaygoClient();

// Get current address
const address = await client.address();
console.log(`Current address: ${address}`);

// Get account information
const account = await client.getAccount(address);
console.log(`Account balance: ${account.balance}`);
console.log(`Account nonce: ${account.nonce}`);
