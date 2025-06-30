import { PaygoClient } from "@witnessco/paygo-ts-client";

async function checkExports() {
  console.log("🔍 Checking PayGo Client Exports...\n");

  try {
    // Check what's available on the main module
    const paygoModule = await import("@witnessco/paygo-ts-client");
    console.log("📦 Available exports from main module:");
    console.log(Object.keys(paygoModule));

    // Test basic client creation
    console.log("\n✅ Testing PaygoClient creation:");
    const client = new PaygoClient();
    console.log("PaygoClient created successfully");

    // Check methods available on client instance
    console.log("\n🔧 Methods available on PaygoClient instance:");
    const clientMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
      .filter(method => method !== 'constructor')
      .sort();
    console.log(clientMethods);

    // Try to import individual classes
    console.log("\n🧪 Testing individual class imports:");

    const testImports = [
      'Transfer',
      'CreateEscrow',
      'FulfillEscrow',
      'ReleaseEscrow',
      'FaucetRequest',
      'UpsertDelegation',
      'DelegateTransfer',
      'SignerConfig',
      'TransactionResponse',
      'ProcessedTransaction'
    ];

    for (const className of testImports) {
      try {
        const classImport = paygoModule[className];
        if (classImport) {
          console.log(`✅ ${className}: Available`);
        } else {
          console.log(`❌ ${className}: Not found`);
        }
      } catch (error) {
        console.log(`❌ ${className}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error("❌ Error checking exports:", error.message);
  }
}

checkExports().catch(console.error);
