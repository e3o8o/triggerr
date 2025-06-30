// quick-test.ts - Place this in the same directory as your adapter
import { PayGoClientService, FaucetRequest } from "@triggerr/paygo-adapter";

async function quickTest() {
  console.log("🧪 Quick Debug Test Starting...");
  
  const alicePk = "0x1476431d1020e741bdfb5af0e6f4d8a1d58d4f7b4de09d5053bfec86a20a7649";
  
  // Create client
  const client = new PayGoClientService();
  await client.setPk(alicePk);
  
  // Get address
  const address = await client.address();
  
  // Try one transaction to see debug output
  const faucetRequest = new FaucetRequest(1000n);
  const response = await client.signAndPostTransactionFromParams(faucetRequest);
  
  console.log("🎯 Final response:", response);
  console.log("🔗 Final hash:", (response as any).hash);
}

quickTest().catch(console.error);