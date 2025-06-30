# Unified Master Plan: The Agnostic Multi-Chain Architecture

**Document Version**: 1.0
**Date**: June 24, 2025
**Status**: Master Implementation Plan
**Objective**: To serve as the **single, definitive source of truth** for the foundational refactoring of the triggerr platform. This plan details the process of transforming the existing codebase into a truly blockchain-agnostic, multi-chain, and multi-wallet system, preparing it for all future product verticals and integrations.

---

## 1. **Executive Summary & Architectural Vision**

### 1.1. Current State
The project's foundation is stable, with functional core services (`PayGoClientService`, `EscrowManager`, `WalletService`) and a comprehensive test suite. However, a deep architectural review has revealed that these core services are **tightly coupled** to the PayGo blockchain implementation. This coupling presents a significant risk to our long-term vision of becoming a platform-independent insurance leader.

### 1.2. The Architectural Mandate
To achieve true resilience, flexibility, and future-readiness, we will undertake a foundational refactoring **before** implementing new features. The goal is to create a "0/10" abstraction layer, where switching or adding new blockchain platforms becomes a configuration change rather than a code change.

### 1.3. Core Pillars of the New Architecture
1.  **Platform Agnostic**: The application's business logic will have no knowledge of whether it's interacting with PayGo, Solana, or Ethereum.
2.  **Multi-Chain Native**: The system will be capable of managing wallets and executing transactions on multiple blockchains simultaneously.
3.  **Wallet Flexibility**: Users will be able to use both platform-generated (custodial) wallets and their own connected (non-custodial) wallets.
4.  **Provider Choice**: Insurance providers will be able to specify their preferred blockchain for escrow and settlements.

---

## 2. **Detailed Implementation Plan**

This plan is divided into distinct, sequential phases. Each phase is a prerequisite for the next.

### **Phase 1: Establish the Generic Blockchain Contract (The "Socket")**
**Goal**: Create the abstract, dependency-free `blockchain-interface` package. This is the cornerstone of the entire architecture.

*   **Task 1.1: Create the Package Structure**
    *   **Action**: Create the directory `packages/blockchain/blockchain-interface/`.
    *   **Action**: Initialize it with a `package.json`, `tsconfig.json`, and an `src` directory.

*   **Task 1.2: Define Generic Data Models**
    *   **File**: `packages/blockchain/blockchain-interface/src/models.ts`
    *   **Action**: Define and export all platform-agnostic types. This file must not contain any imports from specific blockchain libraries.
        ```typescript
        export type BlockchainProviderName = 'PAYGO' | 'SOLANA' | 'ETHEREUM' | 'BASE';
        export type TransactionStatus = 'success' | 'failure' | 'pending';
        export type WalletType = 'CUSTODIAL' | 'NON_CUSTODIAL';

        export interface BlockchainWallet {
          address: string;
          chain: BlockchainProviderName;
          walletType: WalletType;
          provider?: string; // e.g., 'metamask', 'phantom'
          publicKey?: string;
          privateKey?: string; // Must be optional, only present for CUSTODIAL
        }

        export interface BlockchainAccountInfo {
          balance: bigint;
          nonce: number;
        }

        export interface GenericEscrowParams {
          amount: bigint;
          recipientAddress: string;
          expiration: Date;
          purpose: string; // e.g., 'POLICY', 'USER_DEPOSIT'
          metadata?: Record<string, any>;
        }

        export interface TransactionResult {
          hash: string;
          status: TransactionStatus;
          rawResponse?: any;
        }
        ```

*   **Task 1.3: Define the Master `IBlockchainService` Interface**
    *   **File**: `packages/blockchain/blockchain-interface/src/service.ts`
    *   **Action**: Define the master interface that all adapters must implement.
        ```typescript
        import { /* all models */ } from './models';

        export interface IBlockchainService {
          // Read-only methods
          getAccountInfo(address: string): Promise<BlockchainAccountInfo>;
          getTransactionStatus(hash: string): Promise<TransactionStatus>;

          // Write methods (for custodial signing)
          generateNewWallet(): Promise<BlockchainWallet>;
          createEscrow(params: GenericEscrowParams, privateKey: string): Promise<TransactionResult>;
          // ... other write methods (transfer, etc.) will take a privateKey

          // Methods for non-custodial signing
          prepareCreateEscrowTransaction(params: GenericEscrowParams): Promise<any>; // Returns an unsigned transaction object
          submitSignedTransaction(signedTx: any): Promise<TransactionResult>;
        }
        ```

*   **Task 1.4: Finalize and Configure Package**
    *   **File**: `packages/blockchain/blockchain-interface/src/index.ts`
    *   **Action**: Export all interfaces and types from `models.ts` and `service.ts`.
    *   **Action**: Add a new path alias in the root `tsconfig.json`: `"@triggerr/blockchain-interface": ["./packages/blockchain/blockchain-interface/src"]`.

### **Phase 2: Refactor `paygo-adapter` into a Compliant "Plug"**
**Goal**: Make the existing `paygo-adapter` the first official implementation of our new `IBlockchainService` contract.

*   **Task 2.1: Implement `IBlockchainService` in `PayGoClientService`**
    *   **Action**: Add `@triggerr/blockchain-interface` as a dependency to `paygo-adapter`'s `package.json`.
    *   **Action**: Modify the `PayGoClientService` class in `.../paygo-adapter/src/client.ts` to `implements IBlockchainService`.
    *   **Action**: Implement every method required by the interface, creating translation layers between our generic models and the PayGo-specific client calls.

### **Phase 3: Implement the Multi-Chain Service Registry**
**Goal**: Build the runtime router that holds and provides access to all available blockchain clients.

*   **Task 3.1: Create the `service-registry` Package**
    *   **Action**: Create the directory `packages/blockchain/service-registry/`.

*   **Task 3.2: Implement the `BlockchainServiceRegistry`**
    *   **File**: `packages/blockchain/service-registry/src/index.ts`
    *   **Action**: Implement the `BlockchainServiceRegistry` class. Its constructor will instantiate all available, concrete blockchain services (starting with `PayGoClientService`) and store them in a `Map`. Its `get(providerName: BlockchainProviderName)` method will return the requested service instance.

### **Phase 4: Update the Database Schema**
**Goal**: Modify the database to support the multi-chain and multi-wallet architecture.

*   **Task 4.1: Modify `schema.ts`**
    *   **File**: `packages/core/src/database/schema.ts`
    *   **Action**:
        *   In the `userWallets` table: rename `paygoAddress` to `address`, add `chain: text('chain').notNull()`, and `walletType: text('wallet_type').notNull()`. Make the `encryptedPrivateKey` column nullable and rename it to `encryptedSecret`.
        *   In the `provider` table: add `preferredChain: text('preferred_chain').notNull().default('PAYGO')`.
        *   In the `policy`, `escrow`, and `payout` tables: add a `chain: text('chain').notNull()` column to each.
    *   **Action**: Run `drizzle-kit generate` to create the new migration file and review it for correctness.

### **Phase 5: Decouple and Rewire the Application**
**Goal**: Remove all hard dependencies on PayGo from the business logic and connect everything to the new abstraction layers.

*   **Task 5.1: Refactor Core Services (`WalletService`, `EscrowManager`)**
    *   **Action**: Modify the constructors of `WalletService` and `EscrowManager` to accept the `BlockchainServiceRegistry` as their sole blockchain-related dependency.
    *   **Action**: Update all internal methods within these services to use the registry pattern. For example, a call to `this.paygoClient.generateNewWallet()` becomes `this.blockchainRegistry.get('PAYGO').generateNewWallet()`.

*   **Task 5.2: Create New API Endpoint for Anonymous Wallet Generation**
    *   **Action**: Create a new API endpoint at `POST /api/v1/wallet/generate-anonymous`.
    *   **Logic**: This endpoint will accept an optional `chain: BlockchainProviderName` in the body. It will call `walletService.createCustodialWallet`, passing in the anonymous session ID and the chosen chain, then return the new wallet's details.
    *   **Rationale**: This provides a dedicated, secure way for the frontend to request a new wallet without needing a full user account.

*   **Task 5.3: Create New API Endpoint for Linking Existing Wallets**
    *   **Action**: Create a new API endpoint at `POST /api/v1/user/wallet/link-existing`.
    *   **Logic**: This endpoint will be for authenticated users. It will accept an `address`, `chain`, and `walletType: 'NON_CUSTODIAL'` in the body. It will call a new `walletService.linkExistingWallet` method to save the user's non-custodial wallet to the database.
    *   **Rationale**: This fulfills the core requirement of allowing users to bring their own wallets (e.g., Phantom, MetaMask) to the platform.

*   **Task 5.4: Update Application Entry Point**
    *   **Action**: In the main server setup file, instantiate the `BlockchainServiceRegistry` once and inject it into the `EscrowManager` and `WalletService` constructors.

*   **Task 5.5: Create Wallets Summary API Endpoint**
    *   **Action**: Create a new endpoint at `GET /api/v1/user/wallets/summary`.
    *   **Logic**: This handler will query all wallets for a given user, fetch the balance for each one by calling the appropriate blockchain service via the registry, and return a list of all wallets along with an aggregated total balance in a common currency (e.g., USD).
    *   **Rationale**: Fulfills the requirement to show users all their balances across different chains in one view.

*   **Task 5.6: Build Frontend `WalletConnector`**
    *   **Action**: Create `apps/web/src/lib/wallet-connector.ts` to handle interactions with browser wallet extensions like Phantom and MetaMask, exposing a simple `connect` and `signTransaction` API.

### **Phase 6: Final Validation**
**Goal**: Ensure the entire refactoring was successful without regressions.

*   **Task 6.1: Run Full Test Suite**
    *   **Action**: Execute `bun test` and ensure all existing tests still pass after the refactoring.
*   **Task 6.2: Manually Test `dev-dashboard`**
    *   **Action**: Launch the application and perform all core wallet operations (get balance, faucet, send, create escrow) to ensure they still work through the new abstraction layers.

---

## 3. **Post-Refactoring: Resuming Feature Implementation**

Once the above refactoring is complete, the foundation will be ready. We will then proceed with the original feature implementation plan, now building upon our new, robust, multi-chain architecture. This includes:

1.  **Implement Foundational Aggregators** (`packages/aggregators/`).
2.  **Implement Quote Engine** (`packages/services/quote-engine/`).
3.  **Implement Policy Purchase Endpoint** (`apps/api/src/routes/v1/policy/purchase.ts`).
4.  **Implement Payout Engine** (`packages/services/payout-engine/`).

This unified plan ensures we build correctly from the ground up, prioritizing architectural integrity to enable future scalability and flexibility.
