# PRD-ENGINE-002: Policy Engine

**Status**: Ready for Implementation  
**Priority**: Critical - Core Business Logic  
**Dependencies**: PRD-ENGINE-001 (Quote Engine), PRD-BLOCKCHAIN-002 (PayGo Adapter), PRD-CORE-001 (Database), Escrow Engine (Multi-Model Support)
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Policy Engine manages the complete lifecycle of insurance policies, from creation through payout. It integrates with PayGo blockchain for multi-model escrow management and automated claim processing. The engine supports multiple escrow models (Single-Sided, Dual-Sided, Combined, Pooled) to accommodate different provider strategies and user preferences.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Policy API    │    │  Policy Engine   │    │  Escrow Engine  │
│                 │────▶│                  │────▶│                 │
│ /api/policies   │    │ Lifecycle Mgmt   │    │ Multi-Model     │
│ POST /create    │    │ Escrow Manager   │    │ Single-Sided    │
│ GET  /:id       │    │ Status Tracker   │    │ Dual-Sided      │
│ GET  /:id/verify│    │ Model Selection  │    │ Pooled Models   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                        ┌──────────────────┐    ┌─────────────────┐
                        │  Provider Config │    │  PayGo Client   │
                        │                  │    │                 │
                        │ Escrow Model     │    │ Blockchain Ops  │
                        │ Collateral Reqs  │    │ Auto Payouts    │
                        │ Pool Settings    │    │ Balance Checks  │
                        └──────────────────┘    └─────────────────┘
```
</text>

<old_text>
```typescript
export class PolicyEngine {
  private escrowManager: EscrowManager;
  private statusTracker: PolicyStatusTracker;
  private payoutProcessor: PayoutProcessor;
  private quoteEngine: QuoteEngine;

  constructor(config: PolicyEngineConfig) {
    this.escrowManager = new EscrowManager(config.paygo);
    this.statusTracker = new PolicyStatusTracker(config.monitoring);
    this.payoutProcessor = new PayoutProcessor(config.payouts);
    this.quoteEngine = new QuoteEngine(config.quotes);
  }

  async createPolicy(request: PolicyCreateRequest): Promise<Policy> {
    // Generate quote first
    const quote = await this.quoteEngine.generateQuote(request.quoteParams);
    
    // Create policy record
    const policy = await this.createPolicyRecord(request, quote);
    
    try {
      // Create escrow based on provider's selected model
      const escrowResult = await this.escrowManager.createEscrowForPolicy({
        policyId: policy.id,
        providerId: provider.id,
        userAddress: request.userWalletAddress,
        providerAddress: provider.walletAddress,
        premiumAmount: quote.premium,
        coverageAmount: quote.coverageAmount,
        expirationDate: policy.expiresAt,
        configuration: escrowConfig,
        metadata: {
          flightNumber: request.flightNumber,
          departureDate: request.departureDate,
          delayThreshold: policy.delayThreshold
        }
      });

      if (!escrowResult.success) {
        await this.rollbackPolicy(policy.id);
        throw new Error(`Escrow creation failed: ${escrowResult.error}`);
      }

      // Update policy with escrow details
      await this.updatePolicyEscrow(policy.id, {
        escrowId: escrowResult.escrowId!,
        blockchainId: escrowResult.blockchainId,
        txHash: escrowResult.txHash,
        status: 'ACTIVE'
      });

      return await this.getPolicy(policy.id);
    } catch (error) {
      await this.rollbackPolicy(policy.id);
      throw error;
    }
  }

  private getEscrowConfiguration(provider: Provider, request: PolicyCreateRequest): EscrowConfiguration {
    const baseConfig: EscrowConfiguration = {
      escrowModel: provider.escrowModel,
      premiumReturnPolicy: provider.premiumReturnPolicy,
      collateralRequirement: provider.collateralRequirement,
      poolAddress: provider.poolAddress,
      poolMinimumBalance: provider.poolMinimumBalance,
      modelSpecificConfig: provider.escrowConfiguration || {}
    };

    // Override with request-specific configurations if needed
    if (request.escrowPreferences) {
      // Only allow overrides that the provider supports
      return this.mergeEscrowConfigurations(baseConfig, request.escrowPreferences);
    }

    return baseConfig;
  }

  private async createPolicyRecord(
    request: PolicyCreateRequest, 
    quote: Quote, 
    escrowConfig: EscrowConfiguration
  ): Promise<Policy> {
    const policyData = {
      id: generatePolicyId(),
      policyNumber: generatePolicyNumber(),
      userId: request.userId,
      providerId: request.providerId,
      flightId: request.flightId,
      quoteId: quote.id,
      coverageType: request.coverageType,
      coverageAmount: quote.coverageAmount,
      premium: quote.premium,
      payoutAmount: quote.coverageAmount,
      status: 'PENDING' as const,
      delayThreshold: request.delayThreshold || 60,
      terms: {
        escrowModel: escrowConfig.escrowModel,
        premiumReturnPolicy: escrowConfig.premiumReturnPolicy,
        collateralRequirement: escrowConfig.collateralRequirement
      },
      metadata: {
        riskFactors: quote.riskFactors,
        confidence: quote.confidence,
        escrowConfiguration: escrowConfig
      },
      expiresAt: new Date(request.flightDate.getTime() + 24 * 60 * 60 * 1000), // 24 hours after flight
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.db.insert(policy).values(policyData).returning();
  }

  async processAutomaticPayout(policyId: string, flightStatus: FlightStatus): Promise<PayoutResult> {
    const policy = await this.getPolicy(policyId);
    const escrow = await this.getEscrowForPolicy(policyId);
    
    if (!policy || !escrow) {
      throw new Error('Policy or escrow not found');
    }

    // Determine payout reason based on flight status
    let payoutReason: 'FLIGHT_ON_TIME' | 'FLIGHT_DELAYED' | 'FLIGHT_CANCELLED' | 'EXPIRED';
    
    if (flightStatus.status === 'CANCELLED') {
      payoutReason = 'FLIGHT_CANCELLED';
    } else if (flightStatus.delayMinutes >= policy.delayThreshold) {
      payoutReason = 'FLIGHT_DELAYED';
    } else if (new Date() > policy.expiresAt) {
      payoutReason = 'EXPIRED';
    } else {
      payoutReason = 'FLIGHT_ON_TIME';
    }

    // Process escrow release through appropriate engine
    const escrowResult = await this.escrowManager.processEscrowRelease(
      escrow.blockchainId!,
      escrow.escrowModel,
      payoutReason,
      {
        flightDelayMinutes: flightStatus.delayMinutes,
        actualDepartureTime: flightStatus.actualDepartureTime,
        actualArrivalTime: flightStatus.actualArrivalTime
      }
    );

    if (!escrowResult.success) {
      throw new Error(`Escrow release failed: ${escrowResult.error}`);
    }

    // Create payout record
    const payoutAmount = this.calculatePayoutAmount(policy, payoutReason, escrow.escrowModel);
    
    const payout = await this.createPayoutRecord({
      policyId: policy.id,
      escrowId: escrow.id,
      amount: payoutAmount,
      reason: `${payoutReason}: ${flightStatus.delayMinutes} min delay`,
      flightDelayMinutes: flightStatus.delayMinutes,
      conditionsMet: {
        delayThreshold: policy.delayThreshold,
        actualDelay: flightStatus.delayMinutes,
        payoutTrigger: payoutReason
      },
      txHash: escrowResult.txHash,
      blockNumber: escrowResult.blockNumber,
      processedAt: new Date()
    });

    // Update policy status
    await this.updatePolicyStatus(policy.id, 
      payoutReason === 'FLIGHT_ON_TIME' ? 'EXPIRED' : 'CLAIMED'
    );

    return {
      success: true,
      payout,
      escrowResult
    };
  }

  private calculatePayoutAmount(
    policy: Policy, 
    reason: string, 
    escrowModel: EscrowModelType
  ): string {
    if (reason === 'FLIGHT_ON_TIME' || reason === 'EXPIRED') {
      return '0.00'; // No payout for on-time flights
    }

    // For delayed/cancelled flights, payout depends on escrow model and premium return policy
    let payoutAmount = parseFloat(policy.payoutAmount);
    
    // If premium return policy is "return to customer", add premium to payout
    if (policy.terms?.premiumReturnPolicy === 'RETURN_TO_CUSTOMER') {
      payoutAmount += parseFloat(policy.premium);
    }

    return payoutAmount.toFixed(2);
  }

  async getSupportedEscrowModels(): Promise<EscrowModelType[]> {
    return this.escrowManager.getSupportedModels();
  }

  async validateEscrowConfiguration(config: EscrowConfiguration): Promise<boolean> {
    const engine = EscrowEngineFactory.createEngine(config.escrowModel, this.escrowManager.paygoClient);
    return engine.validateConfiguration(config);
  }

## 2. Core Components

### 2.1 Policy Engine Implementation

```typescript
export class PolicyEngine {
  private escrowManager: EscrowManager;
  private statusTracker: PolicyStatusTracker;
  private payoutProcessor: PayoutProcessor;
  private quoteEngine: QuoteEngine;

  constructor(config: PolicyEngineConfig) {
    this.escrowManager = new EscrowManager(config.paygo);
    this.statusTracker = new PolicyStatusTracker(config.monitoring);
    this.payoutProcessor = new PayoutProcessor(config.payouts);
    this.quoteEngine = new QuoteEngine(config.quotes);
  }

  async createPolicy(request: PolicyCreateRequest): Promise<Policy> {
    // Generate quote first
    const quote = await this.quoteEngine.generateQuote(request.quoteParams);
    
    // Create policy record
    const policy = await this.createPolicyRecord(request, quote);
    
    try {
      // Create escrow for premium and payout
      const escrow = await this.escrowManager.createPolicyEscrow(policy);
      
      // Update policy with escrow details
      await this.updatePolicyEscrow(policy.id, escrow);
      
      // Start monitoring
      await this.statusTracker.startMonitoring(policy);
      
      return await this.getPolicyById(policy.id);
      
    } catch (error) {
      // Mark policy as failed and cleanup
      await this.handlePolicyCreationFailure(policy.id, error);
      throw new PolicyEngineError('ESCROW_CREATION_FAILED', error.message);
    }
  }

  async processPolicyEvent(policyId: string, event: PolicyEvent): Promise<void> {
    const policy = await this.getPolicyById(policyId);
    
    switch (event.type) {
      case 'FLIGHT_DELAYED':
        await this.handleFlightDelay(policy, event);
        break;
      case 'FLIGHT_CANCELLED':
        await this.handleFlightCancellation(policy, event);
        break;
      case 'FLIGHT_COMPLETED':
        await this.handleFlightCompletion(policy, event);
        break;
      case 'ESCROW_EXPIRED':
        await this.handleEscrowExpiration(policy, event);
        break;
    }
  }

  private async handleFlightDelay(policy: Policy, event: FlightDelayEvent): Promise<void> {
    if (event.delayMinutes >= policy.delayThreshold) {
      // Trigger payout
      await this.payoutProcessor.processPayout(policy, {
        reason: 'FLIGHT_DELAY',
        delayMinutes: event.delayMinutes,
        payoutAmount: policy.payoutAmount
      });
    }
  }
}
```

### 2.2 Escrow Manager with PayGo Integration

```typescript
export class EscrowManager {
  private paygoClient: PaygoClient;
  private escrowIdGenerator: EscrowIdGenerator;

  constructor(config: PayGoConfig) {
    this.paygoClient = new PaygoClient();
    this.setupPaygoClient(config);
    this.escrowIdGenerator = new EscrowIdGenerator();
  }

  async createPolicyEscrow(policy: Policy): Promise<PolicyEscrow> {
    // Generate escrow identifiers
    const escrowIds = this.escrowIdGenerator.generatePolicyEscrowIds(
      policy.providerId,
      policy.policyId
    );

    // Calculate escrow amount (premium + payout collateral)
    const escrowAmount = this.calculateEscrowAmount(policy);
    
    // Set expiration (flight date + 24 hours buffer)
    const expirationDate = new Date(policy.flight.departureScheduledAt);
    expirationDate.setHours(expirationDate.getHours() + 24);

    try {
      // Create PayGo escrow
      const createEscrowParams = new CreateEscrow(
        escrowIds.blockchainId,
        BigInt(escrowAmount * 100), // Convert to cents
        expirationDate,
        policy.userWalletAddress, // User can fulfill (claim payout)
        '0x0000000000000000000000000000000000000000000000000000000000000000' // No ZK proof required
      );

      const response = await this.paygoClient.signAndPostTransactionFromParams(
        createEscrowParams
      );

      // Create database record
      const escrow = await this.createEscrowRecord({
        internalId: escrowIds.internalId,
        blockchainId: escrowIds.blockchainId,
        policyId: policy.id,
        userId: policy.userId,
        providerId: policy.providerId,
        amount: escrowAmount,
        txHash: response.txHash,
        status: 'CREATED',
        expiresAt: expirationDate
      });

      policyEngineMetrics.escrowsCreated.inc({ provider: policy.providerId });
      
      return escrow;

    } catch (error) {
      policyEngineMetrics.escrowCreationFailures.inc({ 
        provider: policy.providerId,
        error: error.constructor.name 
      });
      throw new PolicyEngineError('ESCROW_CREATION_FAILED', error.message);
    }
  }

  async fulfillEscrow(escrow: PolicyEscrow, reason: PayoutReason): Promise<void> {
    try {
      const fulfillParams = new FulfillEscrow(escrow.blockchainId);
      
      const response = await this.paygoClient.signAndPostTransactionFromParams(
        fulfillParams
      );

      await this.updateEscrowStatus(escrow.id, 'FULFILLED', response.txHash);
      
      policyEngineMetrics.escrowsFulfilled.inc({ 
        reason: reason.type,
        provider: escrow.providerId 
      });

    } catch (error) {
      policyEngineMetrics.escrowFulfillmentFailures.inc({ 
        reason: reason.type,
        error: error.constructor.name 
      });
      throw error;
    }
  }

  async releaseEscrow(escrow: PolicyEscrow): Promise<void> {
    try {
      const releaseParams = new ReleaseEscrow(escrow.blockchainId);
      
      const response = await this.paygoClient.signAndPostTransactionFromParams(
        releaseParams
      );

      await this.updateEscrowStatus(escrow.id, 'RELEASED', response.txHash);
      
      policyEngineMetrics.escrowsReleased.inc({ provider: escrow.providerId });

    } catch (error) {
      policyEngineMetrics.escrowReleaseFailures.inc({ 
        error: error.constructor.name 
      });
      throw error;
    }
  }

  private calculateEscrowAmount(policy: Policy): number {
    // Provider must escrow the payout amount
    return policy.payoutAmount;
  }

  private async setupPaygoClient(config: PayGoConfig): Promise<void> {
    // Use provider's private key for escrow operations
    await this.paygoClient.setPk(config.providerPrivateKey);
  }
}
```

### 2.3 Policy Status Tracker

```typescript
export class PolicyStatusTracker {
  private flightMonitor: FlightMonitor;
  private scheduler: TaskScheduler;

  async startMonitoring(policy: Policy): Promise<void> {
    // Schedule flight status checks
    await this.scheduler.scheduleRecurring(`monitor_${policy.id}`, {
      interval: '*/5 * * * *', // Every 5 minutes
      task: () => this.checkFlightStatus(policy.id),
      until: policy.flight.arrivalScheduledAt
    });

    // Schedule policy expiration
    await this.scheduler.scheduleOnce(`expire_${policy.id}`, {
      at: policy.flight.arrivalScheduledAt,
      task: () => this.expirePolicy(policy.id)
    });
  }

  private async checkFlightStatus(policyId: string): Promise<void> {
    const policy = await this.getPolicyById(policyId);
    
    if (policy.status !== 'ACTIVE') {
      return; // Only monitor active policies
    }

    try {
      const flightStatus = await this.flightMonitor.getFlightStatus(
        policy.flight.flightNumber,
        policy.flight.departureScheduledAt
      );

      await this.processFlightStatusUpdate(policy, flightStatus);
      
    } catch (error) {
      policyEngineMetrics.monitoringErrors.inc({ 
        policy_id: policyId,
        error: error.constructor.name 
      });
    }
  }

  private async processFlightStatusUpdate(
    policy: Policy, 
    status: FlightStatus
  ): Promise<void> {
    const currentStatus = policy.status;
    
    switch (status.status) {
      case 'DELAYED':
        if (status.delayMinutes >= policy.delayThreshold) {
          await this.triggerPayout(policy, {
            type: 'FLIGHT_DELAY',
            delayMinutes: status.delayMinutes
          });
        }
        break;
        
      case 'CANCELLED':
        await this.triggerPayout(policy, {
          type: 'FLIGHT_CANCELLED'
        });
        break;
        
      case 'LANDED':
        if (status.delayMinutes < policy.delayThreshold) {
          await this.completePolicySuccessfully(policy);
        }
        break;
    }
  }
}
```

### 2.4 Payout Processor

```typescript
export class PayoutProcessor {
  private escrowManager: EscrowManager;
  private notificationService: NotificationService;

  async processPayout(policy: Policy, reason: PayoutReason): Promise<Payout> {
    try {
      // Prevent duplicate payouts
      if (policy.status === 'PAID_OUT') {
        throw new PolicyEngineError('ALREADY_PAID_OUT', 'Policy already paid out');
      }

      // Update policy status
      await this.updatePolicyStatus(policy.id, 'PROCESSING_PAYOUT');

      // Fulfill escrow (releases funds to user)
      await this.escrowManager.fulfillEscrow(policy.escrow, reason);

      // Create payout record
      const payout = await this.createPayoutRecord({
        policyId: policy.id,
        amount: policy.payoutAmount,
        reason: reason.type,
        processedAt: new Date(),
        txHash: policy.escrow.txHash
      });

      // Update policy status
      await this.updatePolicyStatus(policy.id, 'PAID_OUT');

      // Send notification
      await this.notificationService.sendPayoutNotification(policy, payout);

      policyEngineMetrics.payoutsProcessed.inc({ 
        reason: reason.type,
        amount_bucket: this.getAmountBucket(policy.payoutAmount)
      });

      return payout;

    } catch (error) {
      await this.updatePolicyStatus(policy.id, 'PAYOUT_FAILED');
      
      policyEngineMetrics.payoutFailures.inc({ 
        reason: reason.type,
        error: error.constructor.name 
      });
      
      throw error;
    }
  }
}
```

## 3. Data Types

```typescript
interface Policy {
  id: string;
  policyId: string; // Human-readable ID
  userId: string;
  providerId: string;
  flightId: string;
  escrowId?: string;
  premium: number;
  payoutAmount: number;
  delayThreshold: number; // Minutes
  status: PolicyStatus;
  flight: PolicyFlightData;
  escrow?: PolicyEscrow;
  createdAt: Date;
  updatedAt: Date;
}

type PolicyStatus = 
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'PROCESSING_PAYOUT'
  | 'PAID_OUT'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED';

interface PolicyEscrow {
  id: string;
  internalId: string; // Human-readable escrow ID
  blockchainId: string; // PayGo blockchain identifier
  policyId: string;
  amount: number;
  status: EscrowStatus;
  txHash?: string;
  expiresAt: Date;
}

type EscrowStatus = 
  | 'CREATED'
  | 'FUNDED'
  | 'FULFILLED'
  | 'RELEASED'
  | 'EXPIRED'
  | 'FAILED';

interface PayoutReason {
  type: 'FLIGHT_DELAY' | 'FLIGHT_CANCELLED' | 'MANUAL';
  delayMinutes?: number;
  details?: string;
}
```

## 4. API Endpoints

### 4.1 Create Policy
```
POST /api/policies
```

**Request:**
```json
{
  "quoteId": "quote_1234567890",
  "userWalletAddress": "0x742d35Cc6634C0532925a3b8D400",
  "acceptTerms": true
}
```

**Response:**
```json
{
  "policy": {
    "id": "pol_1234567890",
    "policyId": "INS-USR-001-BT318-20250615-ABC123",
    "status": "ACTIVE",
    "premium": 42.50,
    "payoutAmount": 500.00,
    "escrow": {
      "id": "esc_1234567890",
      "internalId": "ESC-INS-PROV-POL001-20250615-DEF456",
      "status": "CREATED",
      "txHash": "0x..."
    }
  }
}
```

### 4.2 Get Policy Details
```
GET /api/policies/{policyId}
```

### 4.3 Get User Policies
```
GET /api/policies?userId={userId}&status=ACTIVE
```

### 4.4 Process Manual Payout
```
POST /api/policies/{policyId}/payout
```

## 5. Error Handling

```typescript
export class PolicyEngineError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PolicyEngineError';
  }
}

export const POLICY_ERROR_CODES = {
  ESCROW_CREATION_FAILED: 'ESCROW_CREATION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  POLICY_NOT_FOUND: 'POLICY_NOT_FOUND',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  PAYOUT_FAILED: 'PAYOUT_FAILED',
  ALREADY_PAID_OUT: 'ALREADY_PAID_OUT',
  ESCROW_EXPIRED: 'ESCROW_EXPIRED'
} as const;
```

## 6. Monitoring & Metrics

```typescript
export const policyEngineMetrics = {
  policiesCreated: new Counter({
    name: 'policy_engine_policies_created_total',
    help: 'Total policies created',
    labelNames: ['provider', 'coverage_type']
  }),
  
  escrowsCreated: new Counter({
    name: 'policy_engine_escrows_created_total',
    help: 'Total escrows created',
    labelNames: ['provider']
  }),
  
  payoutsProcessed: new Counter({
    name: 'policy_engine_payouts_processed_total',
    help: 'Total payouts processed',
    labelNames: ['reason', 'amount_bucket']
  }),
  
  policyProcessingTime: new Histogram({
    name: 'policy_engine_processing_duration_seconds',
    help: 'Policy processing duration',
    buckets: [1, 5, 10, 30, 60]
  }),
  
  escrowCreationFailures: new Counter({
    name: 'policy_engine_escrow_failures_total',
    help: 'Escrow creation failures',
    labelNames: ['provider', 'error']
  })
};
```

## 7. Implementation Timeline

### Week 1: Core Engine
- Policy lifecycle management
- Basic escrow integration
- Status tracking system
- Database models

### Week 2: PayGo Integration
- Complete escrow manager
- Payout processing
- Error handling
- Transaction monitoring

### Week 3: Monitoring & Polish
- Flight status monitoring
- Automated triggers
- API endpoints
- Metrics and alerting

## 8. Success Metrics

### Performance
- Policy creation: < 10 seconds
- Payout processing: < 30 seconds
- Monitoring accuracy: > 99%

### Business
- Successful payout rate: > 98%
- Policy conversion: > 85%
- Escrow success rate: > 99.5%

---

**Next**: PRD-ENGINE-003 (Payout Engine)  
**Integration**: Consumes PRD-ENGINE-001, integrates with PayGo blockchain