# PRD-BLOCKCHAIN-003: Wallet Service

**Status**: Ready for Implementation  
**Priority**: Medium - Advanced Wallet Management  
**Dependencies**: PRD-BLOCKCHAIN-002 (PayGo Adapter), PRD-CORE-001 (Database), PRD-CORE-002 (Auth)  
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Wallet Service provides comprehensive wallet management functionality for users and providers on the triggerr platform. It handles wallet creation, balance management, transaction history, and secure private key storage while integrating seamlessly with PayGo blockchain operations.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Wallet API    │    │  Wallet Service  │    │  PayGo Client   │
│                 │────▶│                  │────▶│                 │
│ /api/wallet/*   │    │ Balance Mgmt     │    │ Balance Query   │
│ Balance Check   │    │ Transaction Log  │    │ Send/Receive    │
│ Send/Receive    │    │ Key Management   │    │ Address Derive  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Secure Storage │
                       │                  │
                       │ Encrypted Keys   │
                       │ Transaction Log  │
                       │ Wallet Metadata  │
                       └──────────────────┘
```

## 2. Core Components

### 2.1 Wallet Service Implementation

```typescript
export class WalletService {
  private paygoClient: PaygoClient;
  private keyManager: KeyManager;
  private transactionTracker: TransactionTracker;
  private balanceCache: BalanceCache;

  constructor(config: WalletServiceConfig) {
    this.paygoClient = new PaygoClient();
    this.keyManager = new KeyManager(config.encryption);
    this.transactionTracker = new TransactionTracker(config.tracking);
    this.balanceCache = new BalanceCache(config.cache);
  }

  async createWallet(userId: string, walletType: WalletType): Promise<Wallet> {
    try {
      // Generate new wallet with PayGo client
      const tempClient = new PaygoClient();
      const walletAddress = await tempClient.address();
      
      // Get private key (this is conceptual - actual implementation may vary)
      const privateKey = await this.extractPrivateKey(tempClient);

      // Encrypt and store private key
      const encryptedKey = await this.keyManager.encryptPrivateKey(privateKey);

      // Create wallet record
      const wallet = await this.createWalletRecord({
        userId,
        address: walletAddress,
        encryptedPrivateKey: encryptedKey,
        type: walletType,
        status: 'ACTIVE',
        createdAt: new Date()
      });

      // Initialize transaction tracking
      await this.transactionTracker.initializeWallet(wallet.id);

      walletServiceMetrics.walletsCreated.inc({ type: walletType });

      return wallet;

    } catch (error) {
      walletServiceMetrics.walletCreationErrors.inc({ 
        type: walletType,
        error: error.constructor.name 
      });
      throw new WalletServiceError('WALLET_CREATION_FAILED', error.message);
    }
  }

  async importWallet(
    userId: string, 
    privateKey: string, 
    walletType: WalletType
  ): Promise<Wallet> {
    try {
      // Validate private key
      const client = new PaygoClient();
      await client.setPk(privateKey);
      const walletAddress = await client.address();

      // Check if wallet already exists
      const existingWallet = await this.getWalletByAddress(walletAddress);
      if (existingWallet) {
        throw new WalletServiceError('WALLET_ALREADY_EXISTS', 'Wallet already imported');
      }

      // Encrypt and store private key
      const encryptedKey = await this.keyManager.encryptPrivateKey(privateKey);

      // Create wallet record
      const wallet = await this.createWalletRecord({
        userId,
        address: walletAddress,
        encryptedPrivateKey: encryptedKey,
        type: walletType,
        status: 'ACTIVE',
        createdAt: new Date()
      });

      // Sync transaction history
      await this.syncTransactionHistory(wallet.id);

      walletServiceMetrics.walletsImported.inc({ type: walletType });

      return wallet;

    } catch (error) {
      if (error instanceof WalletServiceError) {
        throw error;
      }
      walletServiceMetrics.walletImportErrors.inc({ 
        type: walletType,
        error: error.constructor.name 
      });
      throw new WalletServiceError('WALLET_IMPORT_FAILED', error.message);
    }
  }

  async getWalletBalance(walletId: string, forceRefresh = false): Promise<WalletBalance> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await this.balanceCache.get(walletId);
        if (cached) {
          return cached;
        }
      }

      const wallet = await this.getWalletById(walletId);
      
      // Create PayGo client with wallet's private key
      const client = await this.createPaygoClient(wallet);
      
      // Get account information
      const account = await client.getAccount(wallet.address);
      
      const balance: WalletBalance = {
        walletId,
        address: wallet.address,
        balance: account.balance,
        nonce: account.nonce,
        lastUpdated: new Date()
      };

      // Cache the balance
      await this.balanceCache.set(walletId, balance);

      walletServiceMetrics.balanceChecks.inc({ wallet_type: wallet.type });

      return balance;

    } catch (error) {
      walletServiceMetrics.balanceCheckErrors.inc({ 
        error: error.constructor.name 
      });
      throw new WalletServiceError('BALANCE_CHECK_FAILED', error.message);
    }
  }

  async sendFunds(
    fromWalletId: string, 
    toAddress: string, 
    amount: bigint,
    memo?: string
  ): Promise<Transaction> {
    try {
      const wallet = await this.getWalletById(fromWalletId);
      
      // Create PayGo client with sender's private key
      const client = await this.createPaygoClient(wallet);

      // Create transfer transaction
      const transfer = new Transfer(toAddress, amount);
      
      // Sign and submit transaction
      const response = await client.signAndPostTransactionFromParams(transfer);

      // Record transaction
      const transaction = await this.recordTransaction({
        fromWalletId,
        toAddress,
        amount,
        memo,
        txHash: response.txHash,
        status: 'PENDING',
        type: 'SEND',
        createdAt: new Date()
      });

      // Invalidate balance cache
      await this.balanceCache.invalidate(fromWalletId);

      walletServiceMetrics.transactionsSent.inc({ 
        wallet_type: wallet.type 
      });

      return transaction;

    } catch (error) {
      walletServiceMetrics.transactionErrors.inc({ 
        type: 'SEND',
        error: error.constructor.name 
      });
      throw new WalletServiceError('SEND_TRANSACTION_FAILED', error.message);
    }
  }

  async requestFaucetFunds(walletId: string, amount?: bigint): Promise<Transaction> {
    try {
      const wallet = await this.getWalletById(walletId);
      
      // Create PayGo client
      const client = await this.createPaygoClient(wallet);

      // Request faucet funds
      const faucetAmount = amount || BigInt(1000000); // Default 1M units
      const faucetRequest = new FaucetRequest(faucetAmount);
      
      const response = await client.signAndPostTransactionFromParams(faucetRequest);

      // Record transaction
      const transaction = await this.recordTransaction({
        fromWalletId: walletId,
        toAddress: wallet.address,
        amount: faucetAmount,
        memo: 'Faucet request',
        txHash: response.txHash,
        status: 'PENDING',
        type: 'FAUCET',
        createdAt: new Date()
      });

      walletServiceMetrics.faucetRequests.inc({ 
        wallet_type: wallet.type 
      });

      return transaction;

    } catch (error) {
      walletServiceMetrics.faucetErrors.inc({ 
        error: error.constructor.name 
      });
      throw new WalletServiceError('FAUCET_REQUEST_FAILED', error.message);
    }
  }

  private async createPaygoClient(wallet: Wallet): Promise<PaygoClient> {
    const client = new PaygoClient();
    const privateKey = await this.keyManager.decryptPrivateKey(wallet.encryptedPrivateKey);
    await client.setPk(privateKey);
    return client;
  }
}
```

### 2.2 Key Management

```typescript
export class KeyManager {
  private encryptionKey: string;

  constructor(config: EncryptionConfig) {
    this.encryptionKey = config.encryptionKey;
  }

  async encryptPrivateKey(privateKey: string): Promise<string> {
    try {
      // Use AES-256-GCM encryption
      const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
      let encrypted = cipher.update(privateKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Include auth tag for integrity
      const authTag = cipher.getAuthTag();
      
      return `${encrypted}:${authTag.toString('hex')}`;
    } catch (error) {
      throw new WalletServiceError('ENCRYPTION_FAILED', error.message);
    }
  }

  async decryptPrivateKey(encryptedKey: string): Promise<string> {
    try {
      const [encrypted, authTagHex] = encryptedKey.split(':');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new WalletServiceError('DECRYPTION_FAILED', error.message);
    }
  }

  async rotateEncryptionKey(newKey: string): Promise<void> {
    // Implementation for key rotation
    // This would re-encrypt all existing private keys with the new key
    throw new Error('Key rotation not implemented yet');
  }
}
```

### 2.3 Transaction Tracker

```typescript
export class TransactionTracker {
  async recordTransaction(data: TransactionData): Promise<Transaction> {
    const transaction = await this.createTransactionRecord({
      ...data,
      id: generateTransactionId(),
      status: 'PENDING'
    });

    // Start monitoring for confirmation
    await this.startTransactionMonitoring(transaction.id);

    return transaction;
  }

  async getTransactionHistory(
    walletId: string, 
    options: TransactionHistoryOptions = {}
  ): Promise<TransactionHistory> {
    const { limit = 50, offset = 0, type, status } = options;

    const transactions = await this.queryTransactions({
      walletId,
      type,
      status,
      limit,
      offset,
      orderBy: 'createdAt DESC'
    });

    const total = await this.countTransactions({ walletId, type, status });

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  private async startTransactionMonitoring(transactionId: string): Promise<void> {
    // Schedule background job to monitor transaction status
    // This would integrate with the task scheduler from PRD-INFRA-001
    await this.scheduleTransactionStatusCheck(transactionId);
  }

  async updateTransactionStatus(txHash: string, status: TransactionStatus): Promise<void> {
    await this.updateTransactionByHash(txHash, { status, updatedAt: new Date() });
    
    walletServiceMetrics.transactionStatusUpdates.inc({ 
      status,
      previous_status: 'PENDING' 
    });
  }
}
```

## 3. Data Types

```typescript
interface Wallet {
  id: string;
  userId: string;
  address: string;
  encryptedPrivateKey: string;
  type: WalletType;
  status: WalletStatus;
  metadata?: WalletMetadata;
  createdAt: Date;
  updatedAt: Date;
}

type WalletType = 'USER' | 'PROVIDER' | 'SYSTEM';
type WalletStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

interface WalletBalance {
  walletId: string;
  address: string;
  balance: bigint;
  nonce: number;
  lastUpdated: Date;
}

interface Transaction {
  id: string;
  fromWalletId?: string;
  toAddress: string;
  amount: bigint;
  memo?: string;
  txHash: string;
  status: TransactionStatus;
  type: TransactionType;
  blockNumber?: number;
  confirmations?: number;
  createdAt: Date;
  confirmedAt?: Date;
}

type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
type TransactionType = 'SEND' | 'RECEIVE' | 'FAUCET' | 'ESCROW_CREATE' | 'ESCROW_FULFILL';

interface TransactionHistoryOptions {
  limit?: number;
  offset?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: Date;
  dateTo?: Date;
}
```

## 4. API Endpoints

### 4.1 Wallet Management
```
POST /api/wallet/create
```
**Request:**
```json
{
  "type": "USER"
}
```
**Response:**
```json
{
  "wallet": {
    "id": "wallet_1234567890",
    "address": "0x742d35Cc6634C0532925a3b8D400",
    "type": "USER",
    "status": "ACTIVE",
    "createdAt": "2025-01-27T12:00:00Z"
  }
}
```

### 4.2 Wallet Import
```
POST /api/wallet/import
```
**Request:**
```json
{
  "privateKey": "0xa5d78e82e9f198698ecca11c99c97580e47f5972cf0b8d614c32b6032ae15045",
  "type": "USER"
}
```

### 4.3 Balance Check
```
GET /api/wallet/{walletId}/balance?refresh=true
```
**Response:**
```json
{
  "balance": {
    "walletId": "wallet_1234567890",
    "address": "0x742d35Cc6634C0532925a3b8D400",
    "balance": "1000000",
    "nonce": 5,
    "lastUpdated": "2025-01-27T12:00:00Z"
  }
}
```

### 4.4 Send Funds
```
POST /api/wallet/{walletId}/send
```
**Request:**
```json
{
  "toAddress": "0x8ba1f109551bD432803012645Hac136c",
  "amount": "500000",
  "memo": "Payment for policy premium"
}
```

### 4.5 Transaction History
```
GET /api/wallet/{walletId}/transactions?limit=20&offset=0&type=SEND
```

### 4.6 Faucet Request
```
POST /api/wallet/{walletId}/faucet
```
**Request:**
```json
{
  "amount": "1000000"
}
```

## 5. Security Considerations

### 5.1 Private Key Protection
```typescript
const SECURITY_MEASURES = {
  encryption: 'AES-256-GCM',
  keyDerivation: 'PBKDF2 with 100,000 iterations',
  keyRotation: 'Quarterly rotation schedule',
  accessLogging: 'All private key access logged',
  memoryProtection: 'Clear sensitive data from memory after use'
};
```

### 5.2 Access Control
- Private key decryption only for authenticated users
- Role-based access for different wallet types
- Audit logging for all wallet operations
- Rate limiting on sensitive operations

### 5.3 Transaction Security
- Transaction signing validation
- Amount limits for automated transactions
- Multi-step confirmation for large amounts
- Fraud detection patterns

## 6. Error Handling

```typescript
export class WalletServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WalletServiceError';
  }
}

export const WALLET_ERROR_CODES = {
  WALLET_CREATION_FAILED: 'WALLET_CREATION_FAILED',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS'
} as const;
```

## 7. Monitoring & Metrics

```typescript
export const walletServiceMetrics = {
  walletsCreated: new Counter({
    name: 'wallet_service_wallets_created_total',
    help: 'Wallets created',
    labelNames: ['type']
  }),
  
  balanceChecks: new Counter({
    name: 'wallet_service_balance_checks_total',
    help: 'Balance checks performed',
    labelNames: ['wallet_type']
  }),
  
  transactionsSent: new Counter({
    name: 'wallet_service_transactions_sent_total',
    help: 'Transactions sent',
    labelNames: ['wallet_type']
  }),
  
  walletOperationTime: new Histogram({
    name: 'wallet_service_operation_duration_seconds',
    help: 'Wallet operation duration',
    labelNames: ['operation'],
    buckets: [0.1, 0.5, 1, 2, 5]
  }),
  
  encryptionOperations: new Counter({
    name: 'wallet_service_encryption_operations_total',
    help: 'Encryption/decryption operations',
    labelNames: ['operation', 'status']
  })
};
```

## 8. Integration Patterns

### 8.1 PayGo Client Integration
```typescript
// Proven pattern from working tests
const client = new PaygoClient();
await client.setPk(privateKey);

// Balance checking
const account = await client.getAccount(address);

// Transaction sending
const transfer = new Transfer(toAddress, amount);
const response = await client.signAndPostTransactionFromParams(transfer);
```

### 8.2 Database Integration
```typescript
// Prisma model relationships
model Wallet {
  id                String   @id @default(cuid())
  userId            String
  address           String   @unique
  encryptedPrivateKey String // AES-256-GCM encrypted
  type              WalletType
  status            WalletStatus @default(ACTIVE)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user              User     @relation(fields: [userId], references: [id])
  transactions      Transaction[]
  
  @@map("wallets")
}
```

## 9. Implementation Timeline

### Week 1: Core Wallet Operations
- Wallet creation and import functionality
- Private key encryption/decryption
- Basic PayGo client integration
- Database models and relationships

### Week 2: Transaction Management
- Balance checking with caching
- Fund sending and receiving
- Transaction history tracking
- Faucet integration

### Week 3: Security & Monitoring
- Enhanced security measures
- Comprehensive error handling
- Monitoring and metrics
- API endpoints and testing

## 10. Success Metrics

### Performance
- Wallet creation: < 3 seconds
- Balance checking: < 1 second
- Transaction submission: < 2 seconds
- Private key operations: < 500ms

### Security
- Zero private key exposures
- 100% encryption success rate
- Complete audit trail
- No unauthorized access

### Reliability
- 99.9% wallet operation success rate
- 100% transaction tracking accuracy
- Zero data loss incidents

---

**Dependencies**: PRD-BLOCKCHAIN-002 (PayGo Adapter), PRD-CORE-001 (Database)  
**Integration**: Provides wallet functionality for users and providers  
**Status**: Implementation Ready for Phase 2