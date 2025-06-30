# PRD-BLOCKCHAIN-001: Blockchain Abstraction Layer

**Status**: Ready for Implementation  
**Priority**: High - Future Extensibility  
**Dependencies**: PRD-CORE-003 (Shared Types), PRD-BLOCKCHAIN-002 (PayGo Adapter)  
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Blockchain Abstraction Layer provides a unified interface for blockchain operations, enabling the triggerr platform to support multiple blockchain protocols while maintaining consistent business logic. It abstracts PayGo-specific operations and prepares for future multi-chain expansion.

### 1.2 Strategic Goals
- **Protocol Agnostic**: Business logic independent of specific blockchain implementation
- **Future-Proof**: Easy integration of new blockchain protocols
- **Consistent Interface**: Unified API across all blockchain operations
- **Error Handling**: Standardized error patterns across different chains
- **Performance**: Optimized for high-throughput insurance operations

### 1.3 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Business Logic  │    │  Abstraction     │    │   Adapters      │
│                 │────▶│     Layer        │────▶│                 │
│ Policy Engine   │    │                  │    │ PayGo Adapter   │
│ Payout Engine   │    │ Unified Interface│    │ Future Adapters │
│ Quote Engine    │    │ Error Handling   │    │ (Ethereum, etc) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Core Components

### 2.1 Blockchain Interface

```typescript
export interface IBlockchainAdapter {
  // Adapter identification
  readonly name: string;
  readonly version: string;
  readonly supportedOperations: BlockchainOperation[];

  // Connection management
  initialize(config: BlockchainConfig): Promise<void>;
  isConnected(): Promise<boolean>;
  getNetworkInfo(): Promise<NetworkInfo>;
  
  // Wallet operations
  createWallet(): Promise<WalletInfo>;
  importWallet(privateKey: string): Promise<WalletInfo>;
  getBalance(address: string): Promise<Balance>;
  
  // Escrow operations
  createEscrow(params: CreateEscrowParams): Promise<EscrowResult>;
  fulfillEscrow(escrowId: string, proof?: string): Promise<TransactionResult>;
  releaseEscrow(escrowId: string): Promise<TransactionResult>;
  getEscrowStatus(escrowId: string): Promise<EscrowStatus>;
  
  // Transaction operations
  getTransaction(txHash: string): Promise<TransactionInfo>;
  getTransactionHistory(address: string, options?: HistoryOptions): Promise<TransactionInfo[]>;
  estimateGas(operation: BlockchainOperation, params: any): Promise<GasEstimate>;
  
  // Monitoring
  subscribeToEvents(eventTypes: EventType[], callback: EventCallback): Promise<SubscriptionId>;
  unsubscribe(subscriptionId: SubscriptionId): Promise<void>;
}
```

### 2.2 Blockchain Manager

```typescript
export class BlockchainManager {
  private adapters: Map<string, IBlockchainAdapter> = new Map();
  private defaultAdapter: string;
  private metrics: BlockchainMetrics;

  constructor(config: BlockchainManagerConfig) {
    this.metrics = new BlockchainMetrics();
    this.setupDefaultAdapters(config);
  }

  async registerAdapter(name: string, adapter: IBlockchainAdapter): Promise<void> {
    await adapter.initialize(this.getAdapterConfig(name));
    this.adapters.set(name, adapter);
    
    blockchainMetrics.adaptersRegistered.inc({ adapter: name });
  }

  async getAdapter(name?: string): Promise<IBlockchainAdapter> {
    const adapterName = name || this.defaultAdapter;
    const adapter = this.adapters.get(adapterName);
    
    if (!adapter) {
      throw new BlockchainAbstractionError(
        'ADAPTER_NOT_FOUND',
        `Blockchain adapter '${adapterName}' not found`
      );
    }

    // Health check
    if (!(await adapter.isConnected())) {
      await this.reconnectAdapter(adapterName);
    }

    return adapter;
  }

  async createEscrow(
    params: CreateEscrowParams,
    adapterName?: string
  ): Promise<EscrowResult> {
    const adapter = await this.getAdapter(adapterName);
    const startTime = Date.now();

    try {
      const result = await adapter.createEscrow(params);
      
      this.metrics.recordOperation('createEscrow', adapter.name, Date.now() - startTime, 'success');
      
      return {
        ...result,
        adapterUsed: adapter.name,
        networkInfo: await adapter.getNetworkInfo()
      };

    } catch (error) {
      this.metrics.recordOperation('createEscrow', adapter.name, Date.now() - startTime, 'error');
      throw this.normalizeError(error, adapter.name);
    }
  }

  async fulfillEscrow(
    escrowId: string,
    proof?: string,
    adapterName?: string
  ): Promise<TransactionResult> {
    const adapter = await this.getAdapter(adapterName);
    const startTime = Date.now();

    try {
      const result = await adapter.fulfillEscrow(escrowId, proof);
      
      this.metrics.recordOperation('fulfillEscrow', adapter.name, Date.now() - startTime, 'success');
      
      return {
        ...result,
        adapterUsed: adapter.name
      };

    } catch (error) {
      this.metrics.recordOperation('fulfillEscrow', adapter.name, Date.now() - startTime, 'error');
      throw this.normalizeError(error, adapter.name);
    }
  }

  async getWalletBalance(address: string, adapterName?: string): Promise<Balance> {
    const adapter = await this.getAdapter(adapterName);
    
    try {
      return await adapter.getBalance(address);
    } catch (error) {
      throw this.normalizeError(error, adapter.name);
    }
  }

  private normalizeError(error: any, adapterName: string): BlockchainAbstractionError {
    if (error instanceof BlockchainAbstractionError) {
      return error;
    }

    // Map adapter-specific errors to normalized errors
    const errorMap = this.getErrorMap(adapterName);
    const normalizedCode = errorMap.get(error.code) || 'UNKNOWN_ERROR';

    return new BlockchainAbstractionError(
      normalizedCode,
      error.message,
      {
        originalError: error,
        adapter: adapterName
      }
    );
  }
}
```

### 2.3 PayGo Adapter Implementation

```typescript
export class PayGoBlockchainAdapter implements IBlockchainAdapter {
  readonly name = 'paygo';
  readonly version = '1.0.0';
  readonly supportedOperations: BlockchainOperation[] = [
    'CREATE_WALLET',
    'IMPORT_WALLET',
    'GET_BALANCE',
    'CREATE_ESCROW',
    'FULFILL_ESCROW',
    'RELEASE_ESCROW',
    'GET_TRANSACTION'
  ];

  private paygoClient: PaygoClient;
  private config: PayGoAdapterConfig;

  async initialize(config: BlockchainConfig): Promise<void> {
    this.config = config as PayGoAdapterConfig;
    this.paygoClient = new PaygoClient();
    
    if (this.config.privateKey) {
      await this.paygoClient.setPk(this.config.privateKey);
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      const address = await this.paygoClient.address();
      return !!address;
    } catch {
      return false;
    }
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    return {
      name: 'PayGo Network',
      chainId: 'paygo',
      blockHeight: 0, // PayGo doesn't use traditional blocks
      gasPrice: '0' // PayGo doesn't use gas
    };
  }

  async createWallet(): Promise<WalletInfo> {
    const client = new PaygoClient(); // Creates new random wallet
    const address = await client.address();
    
    return {
      address,
      publicKey: address, // PayGo uses address as public identifier
      network: 'paygo'
    };
  }

  async importWallet(privateKey: string): Promise<WalletInfo> {
    const client = new PaygoClient();
    await client.setPk(privateKey);
    const address = await client.address();
    
    return {
      address,
      publicKey: address,
      network: 'paygo'
    };
  }

  async getBalance(address: string): Promise<Balance> {
    try {
      const account = await this.paygoClient.getAccount(address);
      
      return {
        address,
        amount: account.balance.toString(),
        currency: 'PAYGO',
        decimals: 2 // PayGo uses cents
      };
    } catch (error) {
      throw new BlockchainAdapterError('BALANCE_FETCH_FAILED', error.message);
    }
  }

  async createEscrow(params: CreateEscrowParams): Promise<EscrowResult> {
    try {
      const createEscrowParams = new CreateEscrow(
        params.escrowId,
        BigInt(params.amount * 100), // Convert to cents
        params.expirationDate,
        params.beneficiary,
        params.verificationKey || '0x0000000000000000000000000000000000000000000000000000000000000000'
      );

      const response = await this.paygoClient.signAndPostTransactionFromParams(
        createEscrowParams
      );

      return {
        escrowId: params.escrowId,
        transactionHash: response.txHash,
        status: 'CREATED',
        amount: params.amount,
        currency: 'PAYGO',
        expirationDate: params.expirationDate,
        beneficiary: params.beneficiary
      };

    } catch (error) {
      throw new BlockchainAdapterError('ESCROW_CREATION_FAILED', error.message);
    }
  }

  async fulfillEscrow(escrowId: string, proof?: string): Promise<TransactionResult> {
    try {
      const fulfillParams = new FulfillEscrow(escrowId, proof);
      
      const response = await this.paygoClient.signAndPostTransactionFromParams(
        fulfillParams
      );

      return {
        transactionHash: response.txHash,
        status: 'CONFIRMED',
        blockNumber: 0, // PayGo doesn't use blocks
        gasUsed: '0'
      };

    } catch (error) {
      throw new BlockchainAdapterError('ESCROW_FULFILLMENT_FAILED', error.message);
    }
  }

  async releaseEscrow(escrowId: string): Promise<TransactionResult> {
    try {
      const releaseParams = new ReleaseEscrow(escrowId);
      
      const response = await this.paygoClient.signAndPostTransactionFromParams(
        releaseParams
      );

      return {
        transactionHash: response.txHash,
        status: 'CONFIRMED',
        blockNumber: 0,
        gasUsed: '0'
      };

    } catch (error) {
      throw new BlockchainAdapterError('ESCROW_RELEASE_FAILED', error.message);
    }
  }

  async getEscrowStatus(escrowId: string): Promise<EscrowStatus> {
    // Note: PayGo doesn't provide direct escrow status queries
    // This would need to be tracked in our database
    throw new BlockchainAdapterError(
      'OPERATION_NOT_SUPPORTED',
      'PayGo does not support direct escrow status queries'
    );
  }

  async getTransaction(txHash: string): Promise<TransactionInfo> {
    try {
      const transaction = await this.paygoClient.getTransactionByHash(txHash);
      
      return {
        hash: transaction.hash,
        status: transaction.status,
        blockNumber: 0,
        gasUsed: '0',
        timestamp: new Date(transaction.timestamp)
      };

    } catch (error) {
      throw new BlockchainAdapterError('TRANSACTION_FETCH_FAILED', error.message);
    }
  }

  async getTransactionHistory(
    address: string, 
    options?: HistoryOptions
  ): Promise<TransactionInfo[]> {
    try {
      const transactions = await this.paygoClient.getTransactionsBySigner(address);
      
      return transactions.map(tx => ({
        hash: tx.hash,
        status: tx.status,
        blockNumber: 0,
        gasUsed: '0',
        timestamp: new Date(tx.timestamp)
      }));

    } catch (error) {
      throw new BlockchainAdapterError('HISTORY_FETCH_FAILED', error.message);
    }
  }

  async estimateGas(operation: BlockchainOperation, params: any): Promise<GasEstimate> {
    // PayGo doesn't use gas
    return {
      gasLimit: '0',
      gasPrice: '0',
      totalCost: '0',
      currency: 'PAYGO'
    };
  }

  async subscribeToEvents(
    eventTypes: EventType[], 
    callback: EventCallback
  ): Promise<SubscriptionId> {
    // PayGo event subscription would be implemented here
    // For now, return a placeholder
    throw new BlockchainAdapterError(
      'OPERATION_NOT_SUPPORTED',
      'PayGo event subscription not yet implemented'
    );
  }

  async unsubscribe(subscriptionId: SubscriptionId): Promise<void> {
    // Unsubscribe implementation
    throw new BlockchainAdapterError(
      'OPERATION_NOT_SUPPORTED',
      'PayGo event subscription not yet implemented'
    );
  }
}
```

## 3. Data Types

```typescript
interface BlockchainConfig {
  privateKey?: string;
  rpcUrl?: string;
  networkId?: string;
  timeout?: number;
}

interface CreateEscrowParams {
  escrowId: string;
  amount: number;
  expirationDate: Date;
  beneficiary?: string;
  verificationKey?: string;
}

interface EscrowResult {
  escrowId: string;
  transactionHash: string;
  status: 'CREATED' | 'PENDING' | 'CONFIRMED';
  amount: number;
  currency: string;
  expirationDate: Date;
  beneficiary?: string;
  adapterUsed?: string;
  networkInfo?: NetworkInfo;
}

interface TransactionResult {
  transactionHash: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  blockNumber: number;
  gasUsed: string;
  adapterUsed?: string;
}

interface Balance {
  address: string;
  amount: string;
  currency: string;
  decimals: number;
}

interface WalletInfo {
  address: string;
  publicKey: string;
  network: string;
}

interface NetworkInfo {
  name: string;
  chainId: string;
  blockHeight: number;
  gasPrice: string;
}

type BlockchainOperation = 
  | 'CREATE_WALLET'
  | 'IMPORT_WALLET'
  | 'GET_BALANCE'
  | 'CREATE_ESCROW'
  | 'FULFILL_ESCROW'
  | 'RELEASE_ESCROW'
  | 'GET_TRANSACTION'
  | 'SUBSCRIBE_EVENTS';

type EventType = 
  | 'ESCROW_CREATED'
  | 'ESCROW_FULFILLED'
  | 'ESCROW_RELEASED'
  | 'TRANSACTION_CONFIRMED';
```

## 4. Error Handling

```typescript
export class BlockchainAbstractionError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BlockchainAbstractionError';
  }
}

export class BlockchainAdapterError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BlockchainAdapterError';
  }
}

export const BLOCKCHAIN_ERROR_CODES = {
  ADAPTER_NOT_FOUND: 'ADAPTER_NOT_FOUND',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  OPERATION_NOT_SUPPORTED: 'OPERATION_NOT_SUPPORTED',
  ESCROW_CREATION_FAILED: 'ESCROW_CREATION_FAILED',
  ESCROW_FULFILLMENT_FAILED: 'ESCROW_FULFILLMENT_FAILED',
  ESCROW_RELEASE_FAILED: 'ESCROW_RELEASE_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;
```

## 5. Configuration

```typescript
export interface BlockchainManagerConfig {
  defaultAdapter: string;
  adapters: {
    [name: string]: BlockchainConfig;
  };
  retryOptions: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    healthCheckInterval: number;
  };
}

// Example configuration
const config: BlockchainManagerConfig = {
  defaultAdapter: 'paygo',
  adapters: {
    paygo: {
      privateKey: process.env.PAYGO_PRIVATE_KEY,
      timeout: 30000
    }
  },
  retryOptions: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true
  },
  monitoring: {
    enableMetrics: true,
    healthCheckInterval: 60000
  }
};
```

## 6. Integration Example

```typescript
// Business logic using the abstraction layer
export class PolicyService {
  constructor(private blockchainManager: BlockchainManager) {}

  async createPolicyEscrow(policy: Policy): Promise<EscrowResult> {
    const escrowParams: CreateEscrowParams = {
      escrowId: policy.escrowId,
      amount: policy.payoutAmount,
      expirationDate: policy.expirationDate,
      beneficiary: policy.userWalletAddress
    };

    // Business logic doesn't need to know which blockchain is used
    return await this.blockchainManager.createEscrow(escrowParams);
  }

  async triggerPayout(policy: Policy): Promise<TransactionResult> {
    // Abstract interface hides blockchain-specific details
    return await this.blockchainManager.fulfillEscrow(policy.escrowId);
  }
}
```

## 7. Future Extensibility

### 7.1 Adding New Blockchain Support

```typescript
// Example: Ethereum adapter implementation
export class EthereumBlockchainAdapter implements IBlockchainAdapter {
  readonly name = 'ethereum';
  readonly version = '1.0.0';
  readonly supportedOperations: BlockchainOperation[] = [
    'CREATE_WALLET',
    'GET_BALANCE',
    'CREATE_ESCROW',
    // ... all operations
  ];

  // Implement all interface methods for Ethereum
  async createEscrow(params: CreateEscrowParams): Promise<EscrowResult> {
    // Ethereum-specific escrow creation using smart contracts
    // ...
  }
  
  // ... other implementations
}

// Register new adapter
blockchainManager.registerAdapter('ethereum', new EthereumBlockchainAdapter());
```

### 7.2 Multi-Chain Operations

```typescript
// Future capability: Cross-chain escrow operations
export class CrossChainEscrowService {
  async createCrossChainEscrow(
    sourceChain: string,
    targetChain: string,
    params: CreateEscrowParams
  ): Promise<EscrowResult> {
    // Implementation for cross-chain escrow
  }
}
```

## 8. Monitoring & Metrics

```typescript
export const blockchainMetrics = {
  adaptersRegistered: new Counter({
    name: 'blockchain_adapters_registered_total',
    help: 'Total blockchain adapters registered',
    labelNames: ['adapter']
  }),
  
  operationsTotal: new Counter({
    name: 'blockchain_operations_total',
    help: 'Total blockchain operations',
    labelNames: ['adapter', 'operation', 'status']
  }),
  
  operationDuration: new Histogram({
    name: 'blockchain_operation_duration_seconds',
    help: 'Blockchain operation duration',
    labelNames: ['adapter', 'operation'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  
  connectionHealth: new Gauge({
    name: 'blockchain_connection_health',
    help: 'Blockchain connection health (1=healthy, 0=unhealthy)',
    labelNames: ['adapter']
  })
};
```

## 9. Implementation Timeline

### Week 1: Core Abstraction
- Define blockchain interfaces
- Implement BlockchainManager
- Create error handling framework
- Basic configuration system

### Week 2: PayGo Adapter
- Implement PayGoBlockchainAdapter
- Port existing PayGo patterns
- Integration testing
- Error mapping and normalization

### Week 3: Integration & Testing
- Integrate with existing Policy/Payout engines
- Comprehensive testing
- Performance optimization
- Documentation and examples

## 10. Success Metrics

### Technical
- Interface compatibility: 100% of PayGo operations work through abstraction
- Performance overhead: <10% compared to direct PayGo calls
- Error handling coverage: 100% of adapter errors properly normalized

### Extensibility
- New adapter integration time: <1 week for experienced developer
- Code reuse: >90% of business logic remains unchanged when adding new adapters
- Testing coverage: >95% for all abstraction layer components

---

**Dependencies**: PRD-CORE-003 (Shared Types), PRD-BLOCKCHAIN-002 (PayGo Adapter)  
**Integration**: Enables future multi-chain support while maintaining PayGo MVP functionality  
**Status**: Implementation Ready for Phase 2