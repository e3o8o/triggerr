# PRD-BLOCKCHAIN-002: PayGo Blockchain Adapter

**Version**: 1.0  
**Status**: Draft  
**Author**: Development Team  
**Created**: 2025-01-27  
**Dependencies**: PRD-CORE-001 (Database Schema), PRD-BLOCKCHAIN-001 (Blockchain Interface)  
**Priority**: Critical

## 1. Overview

This PRD defines the PayGo blockchain adapter that provides seamless integration with the PayGo protocol for escrow operations, wallet management, and transaction processing in the triggerr insurance platform. The implementation is based on proven patterns from the comprehensive test suite and designed for production reliability.

### 1.1 Strategic Goals
- **Escrow Automation**: Enable automated policy escrow creation, fulfillment, and release
- **Wallet Management**: Secure wallet creation and transaction signing for users and providers  
- **Transaction Reliability**: Robust transaction handling with confirmation tracking
- **Cost Efficiency**: Optimize transaction costs and minimize failed transactions
- **Audit Trail**: Complete transaction logging for regulatory compliance
- **Future Extensibility**: Clean abstraction for potential multi-chain support

### 1.2 Reference Implementation
This PRD is based on the working test file: `/working_tests/test-paygo-full.js`

### 1.3 Technology Stack
- **Package Location**: `packages/blockchain/paygo-adapter`
- **Core Library**: `@witnessco/paygo-ts-client`
- **Cryptography**: `viem` for hashing and message signing
- **Validation**: Zod schemas for transaction validation
- **Storage**: Encrypted private key storage in database
- **Monitoring**: Transaction success/failure tracking

## 2. PayGo Protocol Integration

### 2.1 Core Operations
Based on the working test patterns, the adapter supports:

```typescript
// Core PayGo operations from test file
interface PayGoOperations {
  // Wallet management
  createWallet(): Promise<WalletInfo>;
  importWallet(privateKey: string): Promise<WalletInfo>;
  getBalance(address: string): Promise<BigInt>;
  
  // Faucet operations (for testing/development)
  requestFaucet(amount: BigInt): Promise<TransactionReceipt>;
  
  // Transfer operations
  transfer(recipient: string, amount: BigInt): Promise<TransactionReceipt>;
  
  // Escrow operations
  createEscrow(params: CreateEscrowParams): Promise<EscrowReceipt>;
  fulfillEscrow(escrowId: string): Promise<TransactionReceipt>;
  releaseEscrow(escrowId: string): Promise<TransactionReceipt>;
  
  // Account information
  getAccount(address: string): Promise<AccountInfo>;
  getTransactionHistory(address: string): Promise<Transaction[]>;
}
```

### 2.2 Client Architecture
```typescript
// Based on direct import patterns from test file
import {
  PaygoClient,
  FaucetRequest,
  Transfer,
  CreateEscrow,
  FulfillEscrow,
  ReleaseEscrow
} from "@witnessco/paygo-ts-client";
import { hashMessage } from "viem";

export class PayGoAdapter implements BlockchainAdapter {
  private clients: Map<string, PaygoClient> = new Map();
  private readonly config: PayGoConfig;

  constructor(config: PayGoConfig) {
    this.config = config;
  }

  // Create client with private key - following test pattern
  private async createClient(privateKey: string): Promise<PaygoClient> {
    const client = new PaygoClient();
    await client.setPk(privateKey);
    return client;
  }

  // Get or create client for a specific wallet
  private async getClient(walletAddress: string): Promise<PaygoClient> {
    if (this.clients.has(walletAddress)) {
      return this.clients.get(walletAddress)!;
    }

    // Retrieve encrypted private key from database
    const wallet = await this.getWalletFromDB(walletAddress);
    const privateKey = await this.decryptPrivateKey(wallet.encryptedPrivateKey);
    
    const client = await this.createClient(privateKey);
    this.clients.set(walletAddress, client);
    
    return client;
  }
}
```

## 3. Wallet Management

### 3.1 Wallet Creation & Import
```typescript
export interface WalletInfo {
  address: string;
  encryptedPrivateKey: string;
  balance: BigInt;
  nonce: number;
  createdAt: Date;
}

export class WalletService {
  async createWallet(userId?: string): Promise<WalletInfo> {
    // Generate new wallet using PayGo client
    const client = new PaygoClient();
    const privateKey = this.generatePrivateKey();
    await client.setPk(privateKey);
    
    const address = await client.address();
    const encryptedPrivateKey = await this.encryptPrivateKey(privateKey);
    
    // Store in database
    const wallet = await this.db.user.update({
      where: { id: userId },
      data: {
        walletAddress: address,
        walletPrivateKey: encryptedPrivateKey
      }
    });

    // Get initial account info
    const account = await client.getAccount(address);
    
    return {
      address,
      encryptedPrivateKey,
      balance: account.balance,
      nonce: account.nonce,
      createdAt: new Date()
    };
  }

  async importWallet(privateKey: string, userId?: string): Promise<WalletInfo> {
    // Validate private key format
    if (!this.isValidPrivateKey(privateKey)) {
      throw new PayGoError('INVALID_PRIVATE_KEY', 'Invalid private key format');
    }

    const client = await this.createClient(privateKey);
    const address = await client.address();
    const encryptedPrivateKey = await this.encryptPrivateKey(privateKey);
    
    // Store in database
    if (userId) {
      await this.db.user.update({
        where: { id: userId },
        data: {
          walletAddress: address,
          walletPrivateKey: encryptedPrivateKey
        }
      });
    }

    const account = await client.getAccount(address);
    
    return {
      address,
      encryptedPrivateKey,
      balance: account.balance,
      nonce: account.nonce,
      createdAt: new Date()
    };
  }

  // Balance formatting from test file
  formatBalance(balanceInCents: BigInt): string {
    const balanceStr = balanceInCents.toString();
    const dollars = Number(balanceStr) / 100;
    return `${balanceStr} cents ($${dollars.toFixed(2)})`;
  }
}
```

### 3.2 Security Implementation
```typescript
export class WalletSecurity {
  private readonly encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  async encryptPrivateKey(privateKey: string): Promise<string> {
    // Use AES-256-GCM encryption
    const key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(this.encryptionKey, 'hex'),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedPrivateKey = new TextEncoder().encode(privateKey);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedPrivateKey
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return Buffer.from(combined).toString('base64');
  }

  async decryptPrivateKey(encryptedPrivateKey: string): Promise<string> {
    const combined = Buffer.from(encryptedPrivateKey, 'base64');
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const key = await crypto.subtle.importKey(
      'raw',
      Buffer.from(this.encryptionKey, 'hex'),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }
}
```

## 4. Escrow Operations

### 4.1 Policy Escrow Management
```typescript
export interface PolicyEscrowParams {
  policyId: string;
  amount: BigInt;
  userAddress: string;
  providerAddress: string;
  expirationDays: number;
  fulfillmentConditions?: string;
}

export class EscrowService {
  async createPolicyEscrow(params: PolicyEscrowParams): Promise<EscrowResult> {
    // Generate unique escrow ID using same pattern as test
    const escrowId = hashMessage(`policy-${params.policyId}-${Date.now()}`);
    
    // Calculate expiration date
    const expirationDate = new Date(Date.now() + params.expirationDays * 24 * 60 * 60 * 1000);
    
    // Get provider client (provider funds the escrow)
    const providerClient = await this.getClient(params.providerAddress);
    
    // Create escrow transaction
    const createEscrow = new CreateEscrow(
      escrowId,
      params.amount,
      expirationDate,
      params.userAddress, // fulfiller (user gets payout)
      "0x0000000000000000000000000000000000000000000000000000000000000000" // no ZK proof required
    );

    try {
      console.log(`Creating policy escrow for ${params.policyId}...`);
      const response = await providerClient.signAndPostTransactionFromParams(createEscrow);
      
      // Wait for confirmation
      await this.waitForConfirmation(2000);
      
      // Store escrow in database
      const escrow = await this.db.escrow.create({
        data: {
          internalId: `ESC-POL-${params.policyId}-${Date.now()}`,
          blockchainId: escrowId,
          userId: await this.getUserIdFromAddress(params.userAddress),
          providerId: await this.getProviderIdFromAddress(params.providerAddress),
          amount: params.amount,
          status: 'FUNDED',
          purpose: 'POLICY_PAYOUT',
          txHash: response.hash,
          expiresAt: expirationDate
        }
      });

      return {
        escrowId,
        txHash: response.hash,
        status: 'CREATED',
        amount: params.amount,
        expiresAt: expirationDate,
        dbEscrowId: escrow.id
      };
    } catch (error) {
      throw new PayGoError('ESCROW_CREATION_FAILED', `Failed to create escrow: ${error.message}`);
    }
  }

  async fulfillPolicyEscrow(escrowId: string, userAddress: string): Promise<TransactionReceipt> {
    // Get user client (user claims the payout)
    const userClient = await this.getClient(userAddress);
    
    const fulfillEscrow = new FulfillEscrow(escrowId);

    try {
      console.log(`Fulfilling escrow ${escrowId}...`);
      const response = await userClient.signAndPostTransactionFromParams(fulfillEscrow);
      
      // Wait for confirmation
      await this.waitForConfirmation(2000);
      
      // Update escrow status in database
      await this.db.escrow.update({
        where: { blockchainId: escrowId },
        data: {
          status: 'FULFILLED',
          releaseTxHash: response.hash,
          releasedAt: new Date()
        }
      });

      return response;
    } catch (error) {
      throw new PayGoError('ESCROW_FULFILLMENT_FAILED', `Failed to fulfill escrow: ${error.message}`);
    }
  }

  async releaseExpiredEscrow(escrowId: string, providerAddress: string): Promise<TransactionReceipt> {
    // Get provider client (provider releases funds back to themselves)
    const providerClient = await this.getClient(providerAddress);
    
    const releaseEscrow = new ReleaseEscrow(escrowId);

    try {
      console.log(`Releasing expired escrow ${escrowId}...`);
      const response = await providerClient.signAndPostTransactionFromParams(releaseEscrow);
      
      // Wait for confirmation
      await this.waitForConfirmation(2000);
      
      // Update escrow status in database
      await this.db.escrow.update({
        where: { blockchainId: escrowId },
        data: {
          status: 'RELEASED',
          releaseTxHash: response.hash,
          releasedAt: new Date()
        }
      });

      return response;
    } catch (error) {
      throw new PayGoError('ESCROW_RELEASE_FAILED', `Failed to release escrow: ${error.message}`);
    }
  }

  // Timing helper from test file
  private async waitForConfirmation(ms: number = 2000): Promise<void> {
    console.log(`Waiting for transaction confirmation (${ms}ms)...`);
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 5. Transaction Management

### 5.1 Transfer Operations
```typescript
export class TransferService {
  async sendTransfer(
    fromAddress: string, 
    toAddress: string, 
    amount: BigInt
  ): Promise<TransactionReceipt> {
    const client = await this.getClient(fromAddress);
    
    const transfer = new Transfer(toAddress, amount);

    try {
      console.log(`Sending transfer: ${this.formatBalance(amount)} from ${fromAddress} to ${toAddress}`);
      const response = await client.signAndPostTransactionFromParams(transfer);
      
      await this.waitForConfirmation();
      
      // Log transaction in database
      await this.logTransaction({
        type: 'TRANSFER',
        fromAddress,
        toAddress,
        amount,
        txHash: response.hash,
        status: 'CONFIRMED'
      });

      return response;
    } catch (error) {
      await this.logTransaction({
        type: 'TRANSFER',
        fromAddress,
        toAddress,
        amount,
        status: 'FAILED',
        error: error.message
      });
      
      throw new PayGoError('TRANSFER_FAILED', `Transfer failed: ${error.message}`);
    }
  }

  async requestFaucet(address: string, amount: BigInt): Promise<TransactionReceipt> {
    const client = await this.getClient(address);
    
    const faucetRequest = new FaucetRequest(amount);

    try {
      console.log(`Requesting faucet: ${this.formatBalance(amount)} for ${address}`);
      const response = await client.signAndPostTransactionFromParams(faucetRequest);
      
      await this.waitForConfirmation();
      
      return response;
    } catch (error) {
      throw new PayGoError('FAUCET_FAILED', `Faucet request failed: ${error.message}`);
    }
  }
}
```

### 5.2 Account Information
```typescript
export interface AccountInfo {
  address: string;
  balance: BigInt;
  nonce: number;
  formattedBalance: string;
}

export class AccountService {
  async getAccountInfo(address: string): Promise<AccountInfo> {
    const client = await this.getClient(address);
    
    try {
      const account = await client.getAccount(address);
      
      return {
        address,
        balance: account.balance,
        nonce: account.nonce,
        formattedBalance: this.formatBalance(account.balance)
      };
    } catch (error) {
      throw new PayGoError('ACCOUNT_INFO_FAILED', `Failed to get account info: ${error.message}`);
    }
  }

  async checkBalance(address: string): Promise<BigInt> {
    const accountInfo = await this.getAccountInfo(address);
    return accountInfo.balance;
  }

  async hasMinimumBalance(address: string, minimumAmount: BigInt): Promise<boolean> {
    const balance = await this.checkBalance(address);
    return balance >= minimumAmount;
  }
}
```

## 6. Error Handling

### 6.1 PayGo-Specific Errors
```typescript
export class PayGoError extends Error {
  constructor(
    public code: string,
    public message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PayGoError';
  }
}

export const handlePayGoError = (error: any): never => {
  // Handle WebAssembly binding errors (from test learnings)
  if (error.message?.includes('FnOnce called more than once')) {
    throw new PayGoError(
      'WASM_BINDING_ERROR',
      'WebAssembly binding error. Try using direct imports instead of wrapper patterns.',
      error
    );
  }

  // Handle transaction errors
  if (error.message?.includes('insufficient funds')) {
    throw new PayGoError(
      'INSUFFICIENT_FUNDS',
      'Insufficient funds for transaction',
      error
    );
  }

  if (error.message?.includes('nonce')) {
    throw new PayGoError(
      'NONCE_ERROR',
      'Transaction nonce error. Account may be out of sync.',
      error
    );
  }

  // Handle escrow-specific errors
  if (error.message?.includes('escrow not found')) {
    throw new PayGoError(
      'ESCROW_NOT_FOUND',
      'Escrow not found on blockchain',
      error
    );
  }

  if (error.message?.includes('escrow not expired')) {
    throw new PayGoError(
      'ESCROW_NOT_EXPIRED',
      'Cannot release escrow before expiration',
      error
    );
  }

  // Generic error
  throw new PayGoError(
    'UNKNOWN_ERROR',
    error.message || 'Unknown PayGo error',
    error
  );
};
```

## 7. Service Integration Layer

### 7.1 Insurance Policy Integration
```typescript
export class PolicyBlockchainService {
  constructor(
    private escrowService: EscrowService,
    private transferService: TransferService,
    private accountService: AccountService
  ) {}

  async createPolicyEscrow(policy: Policy): Promise<EscrowResult> {
    // Calculate escrow amount (premium + potential payout)
    const escrowAmount = this.calculateEscrowAmount(policy);
    
    // Get provider wallet
    const provider = await this.db.provider.findUnique({
      where: { id: policy.providerId }
    });

    if (!provider?.walletAddress) {
      throw new PayGoError('PROVIDER_WALLET_MISSING', 'Provider wallet not configured');
    }

    // Check provider has sufficient balance
    const hasBalance = await this.accountService.hasMinimumBalance(
      provider.walletAddress, 
      escrowAmount
    );

    if (!hasBalance) {
      throw new PayGoError('INSUFFICIENT_PROVIDER_FUNDS', 'Provider has insufficient funds');
    }

    // Create escrow
    const escrowResult = await this.escrowService.createPolicyEscrow({
      policyId: policy.id,
      amount: escrowAmount,
      userAddress: policy.user.walletAddress!,
      providerAddress: provider.walletAddress,
      expirationDays: 30 // Policy-specific expiration
    });

    // Update policy with escrow information
    await this.db.policy.update({
      where: { id: policy.id },
      data: {
        escrowId: escrowResult.dbEscrowId,
        status: 'ACTIVE'
      }
    });

    return escrowResult;
  }

  async processPayout(policy: Policy, delayMinutes: number): Promise<TransactionReceipt> {
    if (!policy.escrow?.blockchainId) {
      throw new PayGoError('NO_ESCROW', 'No escrow found for policy');
    }

    // Verify delay threshold met
    if (delayMinutes < policy.delayThreshold) {
      throw new PayGoError('THRESHOLD_NOT_MET', 'Delay threshold not met for payout');
    }

    // Process payout (user fulfills escrow)
    const receipt = await this.escrowService.fulfillPolicyEscrow(
      policy.escrow.blockchainId,
      policy.user.walletAddress!
    );

    // Update policy status
    await this.db.policy.update({
      where: { id: policy.id },
      data: {
        status: 'PAID_OUT',
        payoutAmount: policy.coverageAmount,
        payoutDate: new Date(),
        payoutTxHash: receipt.hash
      }
    });

    return receipt;
  }

  private calculateEscrowAmount(policy: Policy): BigInt {
    // Convert policy amounts to PayGo cents format
    const coverageInCents = BigInt(Math.round(policy.coverageAmount * 100));
    return coverageInCents;
  }
}
```

## 8. Configuration

### 8.1 Environment Configuration
```typescript
export interface PayGoConfig {
  networkUrl?: string;
  encryptionKey: string;
  defaultGasLimit?: number;
  confirmationTimeout?: number;
  retryAttempts?: number;
  testMode?: boolean;
}

export const getPayGoConfig = (): PayGoConfig => ({
  encryptionKey: process.env.PAYGO_ENCRYPTION_KEY!,
  confirmationTimeout: parseInt(process.env.PAYGO_CONFIRMATION_TIMEOUT || '2000'),
  retryAttempts: parseInt(process.env.PAYGO_RETRY_ATTEMPTS || '3'),
  testMode: process.env.NODE_ENV === 'development'
});
```

## 9. Testing Strategy

### 9.1 Integration Tests
```typescript
describe('PayGoAdapter', () => {
  let adapter: PayGoAdapter;
  let testWallet: WalletInfo;

  beforeEach(async () => {
    adapter = new PayGoAdapter(getTestConfig());
    testWallet = await adapter.createWallet();
  });

  describe('Wallet Operations', () => {
    it('should create wallet successfully', async () => {
      expect(testWallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(testWallet.encryptedPrivateKey).toBeTruthy();
    });

    it('should check balance', async () => {
      const balance = await adapter.checkBalance(testWallet.address);
      expect(typeof balance).toBe('bigint');
    });
  });

  describe('Escrow Operations', () => {
    it('should create and fulfill escrow', async () => {
      // Request faucet first
      await adapter.requestFaucet(testWallet.address, BigInt('1000000000000000000'));
      
      const escrowParams = {
        policyId: 'test-policy-1',
        amount: BigInt('50000000000000000'),
        userAddress: testWallet.address,
        providerAddress: testWallet.address,
        expirationDays: 1
      };

      const escrowResult = await adapter.createPolicyEscrow(escrowParams);
      expect(escrowResult.status).toBe('CREATED');
      expect(escrowResult.txHash).toBeTruthy();
    });
  });
});
```

## 10. Monitoring & Metrics

### 10.1 Transaction Monitoring
```typescript
export const paygoMetrics = {
  transactionsTotal: counter('paygo_transactions_total'),
  transactionDuration: histogram('paygo_transaction_duration_seconds'),
  escrowsCreated: counter('paygo_escrows_created_total'),
  escrowsFulfilled: counter('paygo_escrows_fulfilled_total'),
  balanceChecks: counter('paygo_balance_checks_total'),
  errors: counter('paygo_errors_total')
};

export class PayGoMonitoring {
  static trackTransaction(type: string, duration: number, success: boolean) {
    paygoMetrics.transactionsTotal.inc({ type, success: success.toString() });
    paygoMetrics.transactionDuration.observe({ type }, duration);
  }

  static trackEscrowOperation(operation: string, success: boolean) {
    if (operation === 'create') {
      paygoMetrics.escrowsCreated.inc({ success: success.toString() });
    } else if (operation === 'fulfill') {
      paygoMetrics.escrowsFulfilled.inc({ success: success.toString() });
    }
  }
}
```

## 11. Implementation Timeline

### Week 1: Foundation
- [ ] Setup package structure and dependencies
- [ ] Implement wallet creation and management
- [ ] Add private key encryption/decryption
- [ ] Create basic PayGo client integration

### Week 2: Escrow Operations
- [ ] Implement escrow creation functionality
- [ ] Add escrow fulfillment and release
- [ ] Create policy-specific escrow methods
- [ ] Add transaction confirmation handling

### Week 3: Integration & Error Handling
- [ ] Integrate with policy engine
- [ ] Implement comprehensive error handling
- [ ] Add transaction monitoring and logging
- [ ] Create retry mechanisms

### Week 4: Testing & Optimization
- [ ] Write comprehensive test suite
- [ ] Add performance monitoring
- [ ] Optimize transaction costs
- [ ] Production readiness verification

## 12. Success Metrics

- **Transaction Success Rate**: > 99% successful transactions
- **Confirmation Time**: < 5 seconds average confirmation
- **Escrow Reliability**: 100% escrow creation success for funded accounts
- **Security**: Zero private key exposures
- **Error Recovery**: < 1% failed transactions due to service errors

## 13. Risk Mitigation

### 13.1 Security Measures
- **Private Key Encryption**: AES-256-GCM encryption for all stored keys
- **Memory Management**: Clear sensitive data from memory after use
- **Access Control**: Role-based access to wallet operations
- **Audit Logging**: Complete transaction audit trail

### 13.2 Operational Resilience  
- **Retry Logic**: Automatic retry for transient failures
- **Circuit Breakers**: Prevent cascade failures
- **Health Checks**: Continuous service health monitoring
- **Graceful Degradation**: Fallback to read-only mode if needed

## 14. Dependencies

- **Requires**: PRD-CORE-001 (Database Schema) for escrow and transaction storage
- **Requires**: PRD-BLOCKCHAIN-001 (Blockchain Interface) for abstraction compliance
- **Enables**: PRD-ENGINE-002 (Policy Engine) escrow automation
- **Enables**: PRD-ENGINE-003 (Payout Engine) automated payouts

---

**Status**: Ready for implementation  
**Next PRD**: PRD-INTEGRATION-002 (FlightAware Integration)