# PayGo Adapter (`@triggerr/paygo-adapter`)

This package serves as a robust, singleton adapter for the `@witnessco/paygo-ts-client`. It provides a centralized, consistent, and error-handled interface for all blockchain interactions within the triggerr platform.

## Core Concepts

The adapter is built on two primary concepts to handle different operational contexts:

1.  **System-Wide Client**: A lazy-loaded, singleton client for performing platform-level operations (e.g., funding a faucet, processing payouts). This client is initialized with a system-wide admin private key from the environment.
2.  **Request-Scoped Client**: A temporary, on-demand client for handling user-specific transactions (e.g., transferring funds from a user's wallet). This pattern is implemented in the `wallet-service` which consumes this adapter. A new client is instantiated with a user's decrypted private key for the duration of a single API request.

## Usage

### 1. System-Wide Operations (Read-Only & Admin Actions)

For any operation that does not require a specific user's signature, use the `getPayGoClient()` function. This function provides a lazy-loaded singleton instance of the `PayGoClientService`.

The client is automatically initialized on its first use with the `PAYGO_ADMIN_PK` from your environment variables. This lazy initialization is critical to avoid issues with WebAssembly (WASM) during Server-Side Rendering (SSR).

**Example: Checking an account balance in an API route**

```typescript
import { getPayGoClient } from '@triggerr/paygo-adapter';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  try {
    // getPayGoClient() will safely initialize the client on the first call
    const paygoClient = await getPayGoClient();
    const accountInfo = await paygoClient.getAccount(address as `0x${string}`);
    
    // Remember to convert bigints to strings for JSON serialization
    const response = {
      ...accountInfo,
      balance: accountInfo.balance.toString(),
      nonce: accountInfo.nonce.toString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch account balance' }, { status: 500 });
  }
}
```

### 2. User-Specific Operations (Signed Transactions)

For operations that must be signed by a specific user (e.g., sending funds), you must use the `UserWalletClientService` from the `@triggerr/wallet-service` package.

This service is designed to be instantiated with the user's decrypted private key for a single request. It internally uses the `PayGoClientService` from this adapter.

**Example: Transferring funds in an API route**

```typescript
import { WalletService } from '@triggerr/wallet-service';
import { NextResponse } from 'next/server';

// Assume you have a secure way to get the user's decrypted private key
import { getDecryptedUserKey } from '@/lib/kms'; 

export async function POST(request: Request) {
  const { recipientAddress, amount } = await request.json();
  const userId = /* get user ID from auth context */;
  
  try {
    const senderPrivateKey = await getDecryptedUserKey(userId);
    
    const walletService = new WalletService();
    const transactionResult = await walletService.transferFunds(
      senderPrivateKey,
      recipientAddress,
      amount
    );

    return NextResponse.json(transactionResult);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to transfer funds' }, { status: 500 });
  }
}
```

## Available Utilities

The adapter also exports several helpful utility functions:

-   `convertToPayGoAmount(decimalAmount: string): bigint`: Converts a standard decimal string (e.g., "10.50") to the `bigint` format required by PayGo.
-   `convertFromPayGoAmount(bigIntAmount: bigint): string`: Converts a PayGo `bigint` amount back to a user-friendly decimal string.
-   `safePayGoCall(...)`: A wrapper for making PayGo calls with centralized error handling (though direct `try/catch` is often clearer in services).

By centralizing all PayGo interactions through this adapter, we ensure consistent behavior, robust error handling, and a clear separation between system and user operations.

## PayGoClientService Adapter

## Hash Property Limitation

**Important:**

- The `.hash` property returned by `PayGoClientService` is generated locally (from the transaction signature or nonce/timestamp) for developer convenience and API consistency.
- This hash is **not guaranteed** to match the canonical transaction hash as recognized by the backend or blockchain node.
- As a result, you **should not use this hash to look up transactions on the backend** (e.g., via `getTransactionByHash`).
- The backend may use a different hashing algorithm or include additional data, so the locally-generated hash may not be queryable or indexable.

### Recommended Usage
- Use the `.hash` property for local reference, logging, or UI feedback only.
- To retrieve transactions, use methods like `getTransactionsBySigner` or wait for the backend to return the canonical hash.
- If you need to look up a transaction by hash, ensure you are using the hash provided by the backend, not the adapter-generated one.

---

For more details, see the main documentation or contact the maintainers.