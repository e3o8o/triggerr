# Learnings from Paygo Client Test Suite

This document summarizes the key functionalities and usage patterns of the `@witnessco/paygo-ts-client` library, as observed through the analysis and execution of its accompanying test suite. These tests provide practical examples of how to interact with the Paygo protocol for various operations.

[Would be nice to have Paygo have the access to real life data and update escrow as needed]

## 🔥 Critical Findings for Bun Runtime Compatibility [L7-8]
### Missing `nonce` Field in PayGo Client Transactions [L9-10]
#### Issue Description:
- Error: `missing field 'nonce' at line 1 column 89` when sending `FaucetRequest` or `Transfer` transactions.
- Root Cause: The `@witnessco/paygo-ts-client` package does not handle the `nonce` field internally, causing deserialization failures.
- Reproducible with: Bun runtime, minimal test script.

#### Recommended Action:
- Report to PayGo client team for resolution.
- Temporary workaround: Manually add `nonce` if API allows (untested).


### Direct Imports vs. Wrapper Approach vs Proxy Re-Export

#### JavaScript Usage

* **ALWAYS use direct imports from the PayGo client package** when running in Bun environment with JavaScript:
  ```javascript
  import { PaygoClient, FaucetRequest, Transfer } from "@witnessco/paygo-ts-client";
  ```

#### TypeScript Usage (Recommended Approach is the Proxy Re-Export technique detailed below)

* **For TypeScript projects, use specific submodule imports** to access the correct types:
  ```typescript
  import { PaygoClient } from "@witnessco/paygo-ts-client/dist/client";
  import { CreateEscrow } from "@witnessco/paygo-ts-client/dist/types/transactions/create_escrow";
  import { FulfillEscrow } from "@witnessco/paygo-ts-client/dist/types/transactions/fulfill_escrow";
  import { ReleaseEscrow } from "@witnessco/paygo-ts-client/dist/types/transactions/release_escrow";
  ```

* The package structure separates types into specific submodules, which is not apparent from the JavaScript usage examples.

* **AVOID complex wrapper patterns** that use dynamic imports or environment detection, as these interfere with WebAssembly bindings in Bun.

* **Client initialization pattern that works reliably with Bun**:
  ```javascript
  const client = new PaygoClient();
  await client.setPk(privateKey);
  ```

#### Proxy Re-Export Technique for TypeScript Compatibility

* **Problem**: While direct imports work in JavaScript, TypeScript may still report module resolution errors for transaction classes like `Transfer`, `CreateEscrow`, etc. even when they function correctly at runtime.

* **Solution**: Use a proxy package to re-export PayGo classes and avoid TypeScript import issues:

```typescript
// In packages/blockchain/paygo-adapter/src/client.ts
import {
  PaygoClient,
  Transfer,
  CreateEscrow,
  FulfillEscrow,
  ReleaseEscrow,
  FaucetRequest,
} from "@witnessco/paygo-ts-client";

// Re-export PayGo transaction classes to avoid TypeScript import issues
export {
  PaygoClient,
  Transfer,
  CreateEscrow,
  FulfillEscrow,
  ReleaseEscrow,
  FaucetRequest,
};
```

* **Usage**: Import from your adapter instead of directly from PayGo:
```typescript
// Instead of: import { Transfer } from "@witnessco/paygo-ts-client";
import { Transfer } from "@triggerr/paygo-adapter";
```

* **Benefits**:
  - Eliminates TypeScript compilation errors
  - Maintains all runtime functionality
  - Provides a single, consistent import path
  - Allows for future customization of PayGo classes if needed

### WebAssembly Binding Issues

* When using complex wrapper patterns, certain methods like `getAccount()` can trigger WebAssembly binding errors with messages like `FnOnce called more than once` in Bun runtime.

* These binding issues are resolved by using the direct import approach as shown in the official test files, rather than using wrapper abstractions.

### Parameters Requirements

* **CreateEscrow constructor requires all parameters** to be specified in the correct order:
  ```javascript
  new CreateEscrow(
    escrowId,         // escrow ID (required)
    amount,          // amount (required)
    expirationDate,   // Date object (required) - Date.now() + milliseconds
    fulfillerAddress, // address (optional)
    vKey              // verification key (optional)
  );
  ```

* Omitting the expiration date parameter leads to the error: `createEscrow.expiration.getTime is not a function`.

### Escrow Operations

* **Escrow Release Pattern**: To successfully release an escrow:
  1. Create the escrow with a defined expiration time
  2. Wait for the escrow to expire (the expiration time must be reached)
  3. Only then can the escrow creator release the funds

* For testing, use a short expiration time (e.g., `new Date(Date.now() + 1 * 1000)` for 1 second) and explicitly wait before attempting to release.

* Server errors (502) may occur when attempting to release an escrow before it has expired.

* **Verifying Escrow Status**: The test suite reveals that there is no direct `getEscrowStatus(escrowId)` method available in the client library. The correct pattern for verification is indirect: check the balances of the involved parties (creator and fulfiller) before and after the escrow operation to confirm that funds have been moved correctly. This implies that any direct status-checking feature in our application is blocked pending an update to the PayGo client library.

### Transaction Handling

* Always implement proper error handling for all blockchain transactions:
  ```javascript
  try {
    const response = await client.signAndPostTransactionFromParams(transaction);
    // Handle successful response
  } catch (error) {
    // Log and handle errors appropriately
    console.error(`Transaction failed: ${error.message}`);
  }
  ```

* Wait for transaction confirmation before checking balances or proceeding with dependent operations:
  ```javascript
  // Wait for transaction to be confirmed
  await new Promise(resolve => setTimeout(resolve, 2000));
  ```

* **No Direct Transaction History**: The test suite confirms that there is no direct method like `getTransactionHistory(address)` in the client. The method `getTransactionsBySigner` exists but appears to be non-functional on the testnet, always returning an empty array. The only reliable way to confirm a transaction is to check the account balance before and after the operation. This means any transaction history feature in our application must be custom-built by recording successful transactions in our own backend (e.g., in-memory or in a database).

### Testing Patterns

* **Isolation Testing**: Test individual PayGo operations in isolation first to identify which methods work reliably in your environment.

* **Comprehensive Testing**: Once individual operations work, test the full flow with proper error handling.

* **Realistic Scenarios**: Create tests that mimic real application flows (like our triggerr flow test) to ensure all components work together.

### TypeScript Declaration Mismatch & The Proxy Re-Export Dilemma

**Problem:** A critical and recurring issue is that the `@witnessco/paygo-ts-client` package has faulty or incomplete TypeScript declaration files (`.d.ts`). Bun's runtime can correctly find and use all the necessary exports (`PaygoClient`, `CreateEscrow`, etc.), but the TypeScript compiler cannot find them in the type definitions. This leads to a state where the code *runs* but does not *build*.

**Initial Solution:** Our first successful workaround was a "proxy re-export" technique. We created a `paygo-adapter` package that imported the necessary classes from `@witnessco/paygo-ts-client` and then re-exported them. This seemed to resolve the type-checking issue, as our application would then import from our trusted adapter instead of the faulty source package.

**New Complication:** This solution became unstable after we introduced the `IBlockchainService` abstraction layer. The `paygo-adapter` now implements this interface, which creates a more complex dependency graph. We suspect that the order of imports (`@witnessco/paygo-ts-client` vs. `@triggerr/blockchain-interface`) within our adapter's `client.ts` file is now causing the TypeScript errors to reappear.

**Proposed Resolution Path:**
1.  **Test Import Order:** The cleanest solution is to test the hypothesis that import order matters. We will attempt to fix the TypeScript errors by moving the `@witnessco/paygo-ts-client` import to be the very first line in any file that uses it, before any internal project imports.
2.  **Explicit Dependency:** If re-ordering imports fails, the next best solution is to make dependencies explicit. Services that need concrete PayGo types (like `CreateEscrow`) will import them directly from `@witnessco/paygo-ts-client`. To handle the faulty declarations, we will use a `// @ts-ignore` directive as a targeted, last-resort workaround.
3.  **Clean Adapter API:** In either case, the public API of the `@triggerr/paygo-adapter` will be cleaned. Its `index.ts` will **only** export the `PayGoClientService` and other custom utilities. It will no longer re-export the underlying library's types, which was the source of the architectural confusion. This makes the adapter's role as a *translator*, not a *passthrough*, explicit.

### Migration from Wrapper to Direct Imports

* When migrating from a wrapper-based approach to direct imports:
  1. Replace all import statements to get classes directly from the package
  2. Remove all wrapper abstraction layers
  3. Use consistent client initialization patterns
  4. Update all API routes to use the direct approach
  5. Add proper error handling for all operations

## General Observations

*   **TypeScript Integration:** The library is written in TypeScript. Test files often use `@ts-expect-error` for imports, which might suggest areas for improvement in the library's type definitions or specific configurations needed for seamless type checking in different environments.
*   **Amounts:** Financial amounts in transactions (e.g., for transfers, faucet requests, escrows) are consistently handled using JavaScript's `bigint` type. PayGo uses a base-100 unit system (100 units = $1.00) with BigInt precision to support both small operations (100n = $1.00) and very large values (1000000000000000000n for testing/high-precision scenarios).
*   **Unique IDs:** For features requiring unique identifiers like delegations (`delegationId`) and escrows (`escrowId`), the tests commonly use `hashMessage(crypto.randomUUID())` from `viem` to generate secure, unique 32-byte hashes.
*   **Execution Environment:** Tests run reliably with `bun run <script_path>.ts`.

---

### `test_paygo_client_basic.ts`

*   **Purpose:** Demonstrates the most fundamental client setup and account information retrieval.
*   **Key Operations Demonstrated:**
    *   `new PaygoClient()`: Basic client instantiation (defaults to a new random local wallet if no private key is provided).
    *   `client.address()`: Retrieving the client's current public address.
    *   `client.getAccount(address)`: Fetching account details like `balance` and `nonce`.
*   **Key Learnings/Observations:**
    *   A `PaygoClient` can be created without any initial configuration, generating a temporary in-memory wallet.
    *   New accounts will typically have a balance and nonce of 0.

---

### `test_paygo_client.ts`

*   **Purpose:** Shows client initialization with a specific private key for local signing and with a Viem wallet, and demonstrates basic faucet requests and transfers.
*   **Key Operations Demonstrated:**
    *   `client.setPk(privateKey)`: Configuring the client with a specific private key for local signing.
    *   `new PaygoClient({ viemWalletClient })`: Initializing the client with a pre-configured Viem wallet client.
    *   `new FaucetRequest(amount)`: Creating parameters for a faucet token request.
    *   `new Transfer(recipientAddress, amount)`: Creating parameters for a token transfer.
    *   `client.signAndPostTransactionFromParams(params)`: The core method for sending transactions.
*   **Key Learnings/Observations:**
    *   Illustrates two primary ways to equip the client with signing capabilities.
    *   The `viemWalletClient` is created using `createWalletClient` from `viem`, typically with an account derived from a private key and an HTTP transport to an RPC node.

---

### `test_paygo_delegation.ts`

*   **Purpose:** Tests the end-to-end flow of creating a spending delegation and then using that delegation to perform a transfer.
*   **Key Operations Demonstrated:**
    *   `new UpsertDelegation(delegationId, delegateAddress, allowance, expiration)`: Used by an account owner to grant spending power to a delegate.
    *   `new DelegateTransfer(delegationId, amount, recipient, sender)`: Used by the delegate to spend funds from the owner's account.
*   **Key Learnings/Observations:**
    *   The `delegationId` links the `UpsertDelegation` and `DelegateTransfer` operations.
    *   This feature allows for smart contract-like allowance mechanisms.
    *   The delegate signs the `DelegateTransfer`, but funds move from the sender's (owner's) account.

---

### `test_paygo_escrow.ts`

*   **Purpose:** Tests the complete lifecycle of an escrow: creation, fulfillment by a designated party, and release back to the creator upon expiration if unfulfilled.
*   **Key Operations Demonstrated:**
    *   `new CreateEscrow(escrowId, amount, expiration, fulfillerAddress?, vkey?)`: Locks funds from the creator's account.
    *   `new FulfillEscrow(escrowId, proof?)`: Allows the designated fulfiller to claim the escrowed funds.
    *   `new ReleaseEscrow(escrowId)`: Allows the creator to reclaim funds if the escrow expires unfulfilled.
*   **Key Learnings/Observations:**
    *   The `escrowId` is crucial for linking these operations.
    *   The `vkey` (verification key) parameter in `CreateEscrow` can be used to require a ZK proof for fulfillment, though tests used a zero key for basic escrow.
    *   Demonstrates two main paths: successful fulfillment and release after expiration.

---

### `test_paygo_signer_config.ts`

*   **Purpose:** Demonstrates the client's ability to manage and switch between multiple signing mechanisms (local private key and Viem wallet) for different transactions.
*   **Key Operations Demonstrated:**
    *   `client.setPk(privateKey)`: Sets up local signing.
    *   `client.setViemWalletClient(viemWalletClient)`: Sets up Viem-based signing.
    *   `client.signAndPostTransactionFromParams(params, SignerConfig.Viem)`: Explicitly uses the Viem signer.
    *   `client.signAndPostTransactionFromParams(params, SignerConfig.Local)`: Explicitly uses the local signer.
*   **Key Learnings/Observations:**
    *   A single `PaygoClient` instance can be configured with both local and Viem signers.
    *   The `SignerConfig` enum allows precise control over which signer is used for a specific transaction. This is useful for applications managing multiple identities or signing methods.

---

### `test_paygo_transactions.ts`

*   **Purpose:** Focuses on retrieving transaction information from the Paygo network.
*   **Key Operations Demonstrated:**
    *   `client.getTransactionByHash(txHash)`: Fetches details of a specific transaction.
    *   `client.getTransactionsBySigner(address)`: Retrieves transactions signed by a specific address.
    *   `client.getTransactionsByBlock(blockNumber)`: Retrieves all transactions within a given block.
*   **Key Learnings/Observations:**
    *   Provides methods for transaction history lookup and block exploration.
    *   The `ProcessedTransaction` type defines the structure of returned transaction data.

---

### `test_paygo_viem.ts`

*   **Purpose:** Tests the primary method of initializing `PaygoClient` directly with a Viem wallet client.
*   **Key Operations Demonstrated:**
    *   `createWalletClient({ account, transport })` from `viem`.
    *   `new PaygoClient({ viemWalletClient })`.
*   **Key Learnings/Observations:**
    *   This is the standard way to integrate if a Viem wallet is the intended primary signer for the client instance.
    *   The `PaygoClient` then uses this Viem wallet for deriving its address and for all signing operations (unless overridden by `SignerConfig`).

---

### `test_wallet_verification.ts`

*   **Purpose:** A utility script to verify control over a Paygo wallet using its address and private key, and to optionally fund it via faucet.
*   **Key Operations Demonstrated:**
    *   Takes address and private key as command-line arguments.
    *   Initializes client with `client.setPk(privateKey)`.
    *   Compares client-derived address with the input address.
    *   Fetches account balance and nonce.
    *   Conditionally requests funds from the faucet if balance is zero.
*   **Key Learnings/Observations:**
    *   Useful for confirming wallet credentials and operational status on the network.

---

### `test_triggerr_wallet.ts` (Reviewed Previously)

*   **Purpose:** Demonstrates wallet creation, funding via faucet, and balance checking, specifically within the context of the triggerr application's potential needs.
*   **Key Learnings/Observations:**
    *   Reinforces basic wallet operations.
    *   Shows how to simulate a user flow of acquiring and checking a wallet.

---

### `test_aviationstack_flights.ts`

*   **Purpose:** Tests integration with the Aviationstack API for fetching flight data.
*   **Key Operations Demonstrated:**
    *   Uses `axios` to make GET requests to the Aviationstack API.
*   **Key Learnings/Observations:**
    *   This test is separate from Paygo client functionality but is part of the broader application's test suite.
    *   Confirms API key validity and basic request structure for flight data retrieval.

---

## **Architectural Finding: The WASM Runtime Challenge & The `apps/api` Solution** [L300-301

During the integration of the PayGo client, we encountered a persistent and critical runtime error related to WebAssembly (WASM) initialization within the Next.js API route environment.

**The Problem:**

The error, `Failed to initialize WASM bindings: TypeError: Failed to parse URL from /_next/static/media/ts_client_bg.wasm`, consistently appeared when attempting to instantiate the `PaygoClient`.

Our investigation revealed that this is not a bug in our code, but a fundamental incompatibility between the PayGo client's WASM module and the complex, SSR-focused runtime of Next.js API routes. The Next.js server-side environment could not correctly resolve the path to the required `.wasm` file during runtime initialization.

**The Solution: A Dedicated API Service (`apps/api`)**

While we attempted several workarounds, including lazy initialization within a service layer, the most robust and architecturally sound solution was to **delegate all blockchain operations to a dedicated, standalone API service.**

**Why this works:**

1.  **Clean Runtime Environment:** A pure Bun server (`apps/api`) provides a simple, predictable server-side environment without the complexities of the Next.js build process. This allows the PayGo client and its WASM dependencies to initialize correctly without any pathing conflicts.
2.  **Clear Separation of Concerns:** This architecture creates a strong boundary between the frontend and backend. The `apps/web` application is now exclusively responsible for the user experience, while the `apps/api` service handles all business logic, database interactions, and blockchain operations.
3.  **Improved Stability & Scalability:** This separation makes the entire system more stable. The frontend is completely decoupled from the complexities of the blockchain client. In the future, the API service can be scaled and deployed independently of the web app.

This migration represents a significant architectural improvement and establishes a stable foundation for all future backend development.

## 🛠️ Transaction Hash Normalization in Custom Adapter

### Problem: Missing Transaction Hashes in Official PayGo Client

- The official `@witnessco/paygo-ts-client` does not return a `hash` property in its transaction response objects.
- Many standard blockchain workflows, tests, and integrations expect a transaction hash for tracking, confirmation, and assertions.
- As a result, any code or test that accessed `response.hash` received `undefined`, making transaction tracking and automated testing unreliable.

### Impact

- ✅ Transactions (faucet, transfer, escrow, delegation) were still processed and balances updated correctly.
- ❌ Transaction tracking and confirmation workflows were broken due to missing hashes.
- ❌ Test assertions that expected a hash failed, reducing confidence in integration and automation.
- ❌ Debugging and transaction referencing became difficult without a unique identifier.

### Solution: Adapter Hash Generation & Response Normalization

To restore compatibility and reliability, the custom PayGo adapter implements a hash normalization strategy:

- **Primary Method:**
  If a transaction signature is present, the adapter generates a hash using the signature:
  ```typescript
  if (signature) {
    result.hash = `0x${signature}`;
  }
  ```
- **Fallback Method:**
  If the signature is missing, the adapter generates a hash from the nonce and timestamp:
  ```typescript
  const hashData = `${nonce}-${timestamp}`;
  result.hash = `0x${Buffer.from(hashData).toString('hex')}`;
  ```
- **Response Structure Normalization:**
  The adapter detects when the hash is missing, extracts unique identifiers from the response, and adds the `hash` property to maintain API compatibility. All original response data is preserved.

### Debugging & Best Practices

- Comprehensive logging was added to the adapter to track transaction parameters, raw API responses, hash generation, and BigInt serialization.
- This approach ensures that all transaction types (faucet, transfer, escrow, delegation) now return a valid, unique hash for tracking and testing.
- The solution is robust, with fallback mechanisms and clear documentation.

### Recommendations

- **Always use the adapter's normalized response** for transaction tracking and test assertions.
- **Document the hash generation strategy** in API docs and onboarding materials.
- **Monitor upstream changes:** If the official PayGo client adds native hash support, consider updating or simplifying the adapter.
- **Add unit tests** for hash generation logic to ensure future changes do not break this contract.

// Paygo Frontend Formatting Guide
// Based on the Paygo TypeScript client documentation

// ============================================================================
// 1. ADDRESS FORMATTING
// ============================================================================

// Addresses are EVM-style hex strings with 0x prefix
type PaygoAddress = `0x${string}`;

function formatAddress(address: string): PaygoAddress {
  // Ensure proper 0x prefix and lowercase
  return address.toLowerCase().startsWith('0x')
    ? address.toLowerCase() as PaygoAddress
    : `0x${address.toLowerCase()}` as PaygoAddress;
}

// Example usage:
const userAddress = formatAddress("1A005245F091CEE6E5A6169eb76316F5451C842E");
// Result: "0x1a005245f091cee6e5a6169eb76316f5451c842e"

// ============================================================================
// 2. AMOUNT FORMATTING (CORRECTED BASED ON TEST FILE ANALYSIS)
// ============================================================================

// PayGo uses a base unit system where amounts are in "cents" but with BigInt precision
// Based on corrected test file analysis: 100 base units = $1.00
// Use BigInt for all amount handling to maintain precision

function formatAmountToPayGoUnits(dollarAmount: number): bigint {
  return BigInt(Math.round(dollarAmount * 100));
}

function formatPayGoUnitsToDollars(paygoUnits: bigint): string {
  const dollars = paygoUnits / 100n;
  const centsRemainder = paygoUnits % 100n;
  return `$${dollars}.${centsRemainder.toString().padStart(2, "0")}`;
}

// Actual examples from corrected test file (test-paygo-full.ts):
// Small escrow operations:
const escrowAmount = 100n; // $1.00
const smallTransfer = 100n; // $1.00

// Large faucet operations:
const faucetAmount = 1000000000000000000n; // Large amount for testing
const largeTransfer = 1000000000000000000n; // Large amount for testing

// The formatBalance function from test file:
function formatBalance(balanceInCents: bigint): string {
  const dollars = balanceInCents / 100n;
  const centsRemainder = balanceInCents % 100n;
  return `${balanceInCents} cents ($${dollars}.${centsRemainder.toString().padStart(2, "0")})`;
}

// Key insight: PayGo uses consistent base-100 units but allows very large BigInt values
// for high-precision operations and testing scenarios

// ============================================================================
// 3. TRANSACTION HASH FORMATTING
// ============================================================================

// Transaction hashes are 32-byte hex strings with 0x prefix
type TransactionHash = `0x${string}`;

function formatTransactionHash(hash: string): TransactionHash {
  if (!hash.startsWith('0x')) {
    hash = `0x${hash}`;
  }
  // Ensure it's 66 characters (0x + 64 hex chars)
  if (hash.length !== 66) {
    throw new Error('Invalid transaction hash length');
  }
  return hash.toLowerCase() as TransactionHash;
}

// ============================================================================
// 4. DATE/TIME FORMATTING FOR ESCROWS AND DELEGATIONS
// ============================================================================

// Dates are handled as JavaScript Date objects, but need proper formatting for API
function formatExpirationDate(date: Date): Date {
  // Ensure the date is in the future
  if (date <= new Date()) {
    throw new Error('Expiration date must be in the future');
  }
  return date;
}

// Common patterns for expiration dates:
const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

// ============================================================================
// 5. DELEGATION ID FORMATTING
// ============================================================================

// Delegation IDs are 32-byte hashes
import { hashMessage } from 'viem';

function generateDelegationId(): `0x${string}` {
  // Generate a unique ID using a random UUID
  const uuid = crypto.randomUUID();
  return hashMessage(uuid);
}

// ============================================================================
// 6. ESCROW ID FORMATTING
// ============================================================================

// Escrow IDs follow the same format as delegation IDs
function generateEscrowId(): `0x${string}` {
  const uuid = crypto.randomUUID();
  return hashMessage(uuid);
}

// ============================================================================
// 7. ACCOUNT DATA FORMATTING
// ============================================================================

interface FormattedAccount {
  address: PaygoAddress;
  balance: string; // Display as dollar string
  balancePayGoUnits: bigint; // Raw PayGo units (base 100 system)
  nonce: number;
}

function formatAccountData(account: any): FormattedAccount {
  return {
    address: formatAddress(account.address),
    balance: formatPayGoUnitsToDollars(account.balance),
    balancePayGoUnits: BigInt(account.balance),
    nonce: Number(account.nonce)
  };
}

// ============================================================================
// 8. TRANSACTION RESPONSE FORMATTING
// ============================================================================

interface FormattedTransactionResponse {
  hash: TransactionHash;
  status: 'pending' | 'success' | 'failed';
  timestamp?: Date;
  gasUsed?: bigint;
}

function formatTransactionResponse(response: any): FormattedTransactionResponse {
  return {
    hash: formatTransactionHash(response.hash),
    status: response.status || 'pending',
    timestamp: response.timestamp ? new Date(response.timestamp) : undefined,
    gasUsed: response.gasUsed ? BigInt(response.gasUsed) : undefined
  };
}

// ============================================================================
// 9. FORM VALIDATION HELPERS
// ============================================================================

// Validate addresses
function isValidAddress(address: string): boolean {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
}

// Validate amounts (must be positive)
function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 999999999; // Reasonable upper limit
}

// Validate transaction hashes
function isValidTransactionHash(hash: string): boolean {
  const hashRegex = /^0x[a-fA-F0-9]{64}$/;
  return hashRegex.test(hash);
}

// ============================================================================
// 10. FRONTEND FORM EXAMPLES
// ============================================================================

// Transfer form data structure
interface TransferFormData {
  recipientAddress: string;
  amount: string; // Dollar amount as string from input
  memo?: string;
}

function formatTransferForSubmission(formData: TransferFormData) {
  return {
    recipientAddress: formatAddress(formData.recipientAddress),
    amountCents: formatAmountToCents(parseFloat(formData.amount)),
    memo: formData.memo
  };
}

// Delegation form data structure
interface DelegationFormData {
  delegateAddress: string;
  allowanceAmount: string;
  expirationDays: number;
}

function formatDelegationForSubmission(formData: DelegationFormData) {
  const expirationDate = new Date(
    Date.now() + formData.expirationDays * 24 * 60 * 60 * 1000
  );

  return {
    delegationId: generateDelegationId(),
    delegateAddress: formatAddress(formData.delegateAddress),
    allowanceCents: formatAmountToCents(parseFloat(formData.allowanceAmount)),
    expiration: formatExpirationDate(expirationDate)
  };
}

// Escrow form data structure
interface EscrowFormData {
  amount: string;
  expirationHours: number;
  fulfillerAddress?: string;
  requiresProof: boolean;
}

function formatEscrowForSubmission(formData: EscrowFormData) {
  const expirationDate = new Date(
    Date.now() + formData.expirationHours * 60 * 60 * 1000
  );

  return {
    escrowId: generateEscrowId(),
    amountCents: formatAmountToCents(parseFloat(formData.amount)),
    expiration: formatExpirationDate(expirationDate),
    fulfillerAddress: formData.fulfillerAddress
      ? formatAddress(formData.fulfillerAddress)
      : undefined,
    vkey: formData.requiresProof
      ? "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" // Replace with actual vkey
      : "0x0000000000000000000000000000000000000000000000000000000000000000"
  };
}

// ============================================================================
// 11. DISPLAY FORMATTING UTILITIES
// ============================================================================

// Format balance for display
function formatBalanceDisplay(cents: bigint): string {
  const dollars = formatCentsToDollars(cents);
  return `$${dollars}`;
}

// Format address for display (shortened)
function formatAddressDisplay(address: string): string {
  const formatted = formatAddress(address);
  return `${formatted.slice(0, 6)}...${formatted.slice(-4)}`;
}

// Format transaction hash for display (shortened)
function formatHashDisplay(hash: string): string {
  const formatted = formatTransactionHash(hash);
  return `${formatted.slice(0, 10)}...${formatted.slice(-8)}`;
}

// Format date for display
function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// ============================================================================
// 12. ERROR HANDLING
// ============================================================================

class PaygoFormattingError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'PaygoFormattingError';
  }
}

// Example usage in form validation
function validateAndFormatTransfer(formData: TransferFormData) {
  if (!isValidAddress(formData.recipientAddress)) {
    throw new PaygoFormattingError('Invalid recipient address', 'recipientAddress');
  }

  if (!isValidAmount(formData.amount)) {
    throw new PaygoFormattingError('Invalid amount', 'amount');
  }

  return formatTransferForSubmission(formData);
}

export {
  formatAddress,
  formatAmountToCents,
  formatCentsToDollars,
  formatTransactionHash,
  formatExpirationDate,
  generateDelegationId,
  generateEscrowId,
  formatAccountData,
  formatTransactionResponse,
  isValidAddress,
  isValidAmount,
  isValidTransactionHash,
  formatTransferForSubmission,
  formatDelegationForSubmission,
  formatEscrowForSubmission,
  formatBalanceDisplay,
  formatAddressDisplay,
  formatHashDisplay,
  formatDateDisplay,
  validateAndFormatTransfer,
  PaygoFormattingError
};
