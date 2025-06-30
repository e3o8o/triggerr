# PRD-ENGINE-003: Payout Engine

**Status**: Ready for Implementation  
**Priority**: Critical - Core Value Proposition  
**Dependencies**: PRD-ENGINE-002 (Policy Engine), PRD-DATA-001 (Flight Data Aggregator), PRD-BLOCKCHAIN-002 (PayGo Adapter)  
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Payout Engine provides automated, real-time claim processing for parametric insurance policies. It continuously monitors flight data and triggers instant payouts when predefined conditions are met, eliminating manual claims processing.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Flight Monitor  │    │  Payout Engine   │    │ PayGo Escrow    │
│                 │────▶│                  │────▶│                 │
│ Real-time Data  │    │ Trigger Logic    │    │ Auto Fulfill    │
│ Status Updates  │    │ Condition Check  │    │ Fund Release    │
│ Delay Detection │    │ Payout Process   │    │ Balance Update  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Core Components

### 2.1 Payout Engine Implementation

```typescript
export class PayoutEngine {
  private flightMonitor: FlightMonitor;
  private conditionEvaluator: ConditionEvaluator;
  private payoutProcessor: PayoutProcessor;
  private escrowManager: EscrowManager;
  private scheduler: TaskScheduler;

  constructor(config: PayoutEngineConfig) {
    this.flightMonitor = new FlightMonitor(config.dataSources);
    this.conditionEvaluator = new ConditionEvaluator(config.rules);
    this.payoutProcessor = new PayoutProcessor(config.payouts);
    this.escrowManager = new EscrowManager(config.paygo);
    this.scheduler = new TaskScheduler(config.scheduling);
  }

  async startMonitoring(): Promise<void> {
    // Start continuous monitoring for all active policies
    await this.scheduler.start('payout-monitor', {
      interval: '*/2 * * * *', // Every 2 minutes
      task: () => this.monitorActivePolicies()
    });

    // Start flight data refresh
    await this.scheduler.start('flight-refresh', {
      interval: '*/5 * * * *', // Every 5 minutes
      task: () => this.refreshFlightData()
    });
  }

  private async monitorActivePolicies(): Promise<void> {
    const activePolicies = await this.getActivePolicies();
    
    for (const policy of activePolicies) {
      try {
        await this.evaluatePolicyForPayout(policy);
      } catch (error) {
        payoutEngineMetrics.evaluationErrors.inc({ 
          policy_id: policy.id,
          error: error.constructor.name 
        });
      }
    }
  }

  async evaluatePolicyForPayout(policy: Policy): Promise<void> {
    // Skip if already processed
    if (['PAID_OUT', 'EXPIRED', 'CANCELLED'].includes(policy.status)) {
      return;
    }

    // Get latest flight data
    const flightData = await this.flightMonitor.getFlightStatus(
      policy.flight.flightNumber,
      policy.flight.departureDate
    );

    // Evaluate payout conditions
    const evaluation = await this.conditionEvaluator.evaluate(policy, flightData);
    
    if (evaluation.shouldPayout) {
      await this.triggerPayout(policy, evaluation.reason, flightData);
    } else if (evaluation.shouldExpire) {
      await this.expirePolicy(policy);
    }

    // Update monitoring metrics
    payoutEngineMetrics.policiesEvaluated.inc({ 
      outcome: evaluation.shouldPayout ? 'payout' : 'continue' 
    });
  }

  private async triggerPayout(
    policy: Policy, 
    reason: PayoutReason, 
    flightData: FlightStatus
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Prevent duplicate processing
      if (await this.isPayoutInProgress(policy.id)) {
        return;
      }

      // Mark as processing
      await this.markPayoutInProgress(policy.id);

      // Calculate payout amount (could be partial based on delay severity)
      const payoutAmount = this.calculatePayoutAmount(policy, reason, flightData);

      // Process the payout
      const payout = await this.payoutProcessor.processPayout({
        policy,
        amount: payoutAmount,
        reason,
        flightData,
        triggeredAt: new Date()
      });

      // Update policy status
      await this.updatePolicyStatus(policy.id, 'PAID_OUT');

      // Send notifications
      await this.notifyPayout(policy, payout);

      payoutEngineMetrics.payoutsTriggered.inc({ 
        reason: reason.type,
        delay_bucket: this.getDelayBucket(flightData.delayMinutes || 0)
      });

      payoutEngineMetrics.payoutProcessingTime.observe(
        (Date.now() - startTime) / 1000
      );

    } catch (error) {
      await this.handlePayoutFailure(policy.id, error);
      
      payoutEngineMetrics.payoutFailures.inc({ 
        reason: reason.type,
        error: error.constructor.name 
      });
      
      throw error;
    }
  }
}
```

### 2.2 Flight Monitor

```typescript
export class FlightMonitor {
  private flightAggregator: FlightDataAggregator;
  private statusCache: Map<string, CachedFlightStatus> = new Map();

  async getFlightStatus(
    flightNumber: string, 
    departureDate: Date
  ): Promise<FlightStatus> {
    const cacheKey = `${flightNumber}:${departureDate.toISOString().split('T')[0]}`;
    
    // Check cache first (valid for 2 minutes for active flights)
    const cached = this.statusCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.status;
    }

    // Fetch fresh data
    const flightData = await this.flightAggregator.getFlightData({
      type: 'FLIGHT_BY_NUMBER',
      flightNumber,
      date: departureDate,
      maxAge: 5 // 5 minutes max age
    });

    if (!flightData.data.length) {
      throw new PayoutEngineError('FLIGHT_NOT_FOUND', `Flight ${flightNumber} not found`);
    }

    const flight = flightData.data[0];
    const status = this.parseFlightStatus(flight);

    // Cache the result
    this.statusCache.set(cacheKey, {
      status,
      timestamp: Date.now(),
      confidence: flightData.metadata.confidence
    });

    return status;
  }

  private parseFlightStatus(flight: Flight): FlightStatus {
    const now = new Date();
    const scheduledDeparture = new Date(flight.departureScheduledAt);
    const actualDeparture = flight.departureActual ? new Date(flight.departureActual) : null;
    const scheduledArrival = new Date(flight.arrivalScheduledAt);
    const actualArrival = flight.arrivalActual ? new Date(flight.arrivalActual) : null;

    // Calculate delays
    let departureDelayMinutes = 0;
    let arrivalDelayMinutes = 0;

    if (actualDeparture) {
      departureDelayMinutes = Math.max(0, 
        (actualDeparture.getTime() - scheduledDeparture.getTime()) / (1000 * 60)
      );
    }

    if (actualArrival) {
      arrivalDelayMinutes = Math.max(0,
        (actualArrival.getTime() - scheduledArrival.getTime()) / (1000 * 60)
      );
    }

    // Determine status
    let status: FlightStatusType;
    if (flight.status === 'CANCELLED') {
      status = 'CANCELLED';
    } else if (actualArrival) {
      status = 'LANDED';
    } else if (actualDeparture) {
      status = 'IN_FLIGHT';
    } else if (now > scheduledDeparture) {
      status = 'DELAYED';
    } else {
      status = 'SCHEDULED';
    }

    return {
      flightNumber: flight.flightNumber,
      status,
      departureDelayMinutes,
      arrivalDelayMinutes,
      delayMinutes: Math.max(departureDelayMinutes, arrivalDelayMinutes),
      scheduledDeparture,
      actualDeparture,
      scheduledArrival,
      actualArrival,
      lastUpdated: new Date()
    };
  }
}
```

### 2.3 Condition Evaluator

```typescript
export class ConditionEvaluator {
  async evaluate(policy: Policy, flightData: FlightStatus): Promise<PayoutEvaluation> {
    const rules = this.getPolicyRules(policy);
    
    // Check cancellation condition
    if (flightData.status === 'CANCELLED') {
      return {
        shouldPayout: true,
        shouldExpire: false,
        reason: {
          type: 'FLIGHT_CANCELLED',
          details: 'Flight was cancelled'
        },
        confidence: 1.0
      };
    }

    // Check delay condition
    if (flightData.delayMinutes >= policy.delayThreshold) {
      return {
        shouldPayout: true,
        shouldExpire: false,
        reason: {
          type: 'FLIGHT_DELAYED',
          delayMinutes: flightData.delayMinutes,
          details: `Flight delayed by ${flightData.delayMinutes} minutes`
        },
        confidence: this.calculateDelayConfidence(flightData)
      };
    }

    // Check if flight completed without qualifying delay
    if (flightData.status === 'LANDED' && flightData.delayMinutes < policy.delayThreshold) {
      return {
        shouldPayout: false,
        shouldExpire: true,
        reason: {
          type: 'FLIGHT_COMPLETED_ON_TIME',
          details: `Flight completed with only ${flightData.delayMinutes} minutes delay`
        },
        confidence: 1.0
      };
    }

    // Check policy expiration (24 hours after scheduled arrival)
    const expirationTime = new Date(policy.flight.arrivalScheduledAt);
    expirationTime.setHours(expirationTime.getHours() + 24);
    
    if (new Date() > expirationTime) {
      return {
        shouldPayout: false,
        shouldExpire: true,
        reason: {
          type: 'POLICY_EXPIRED',
          details: 'Policy expired 24 hours after scheduled arrival'
        },
        confidence: 1.0
      };
    }

    // Continue monitoring
    return {
      shouldPayout: false,
      shouldExpire: false,
      reason: {
        type: 'MONITORING_CONTINUES',
        details: 'Flight still being monitored'
      },
      confidence: 0.5
    };
  }

  private calculateDelayConfidence(flightData: FlightStatus): number {
    // Higher confidence for landed flights vs. estimated delays
    if (flightData.status === 'LANDED') {
      return 1.0;
    }
    
    if (flightData.actualDeparture) {
      return 0.9; // High confidence if departure delay is confirmed
    }
    
    return 0.7; // Medium confidence for estimated delays
  }
}
```

### 2.4 Payout Processor Integration

```typescript
export class PayoutProcessor {
  private escrowManager: EscrowManager;
  private paygoClient: PaygoClient;
  private notificationService: NotificationService;

  async processPayout(request: PayoutRequest): Promise<Payout> {
    const { policy, amount, reason, flightData } = request;
    
    try {
      // Validate payout eligibility
      await this.validatePayout(policy, reason);

      // Get escrow details
      const escrow = await this.getEscrowByPolicyId(policy.id);
      if (!escrow) {
        throw new PayoutEngineError('ESCROW_NOT_FOUND', 'No escrow found for policy');
      }

      // Fulfill escrow to release funds to user
      await this.fulfillEscrow(escrow, reason);

      // Create payout record
      const payout = await this.createPayoutRecord({
        policyId: policy.id,
        escrowId: escrow.id,
        amount,
        reason: reason.type,
        details: reason.details,
        flightDelayMinutes: reason.delayMinutes,
        processedAt: new Date(),
        txHash: escrow.fulfillmentTxHash
      });

      // Update metrics
      payoutEngineMetrics.payoutAmount.observe(amount);
      payoutEngineMetrics.payoutsByReason.inc({ reason: reason.type });

      return payout;

    } catch (error) {
      payoutEngineMetrics.payoutProcessingErrors.inc({ 
        error: error.constructor.name,
        reason: reason.type 
      });
      throw error;
    }
  }

  private async fulfillEscrow(escrow: PolicyEscrow, reason: PayoutReason): Promise<void> {
    try {
      const fulfillParams = new FulfillEscrow(escrow.blockchainId);
      
      const response = await this.paygoClient.signAndPostTransactionFromParams(
        fulfillParams
      );

      // Update escrow record
      await this.updateEscrowRecord(escrow.id, {
        status: 'FULFILLED',
        fulfillmentTxHash: response.txHash,
        fulfilledAt: new Date()
      });

    } catch (error) {
      throw new PayoutEngineError('ESCROW_FULFILLMENT_FAILED', error.message);
    }
  }
}
```

## 3. Data Types

```typescript
interface FlightStatus {
  flightNumber: string;
  status: FlightStatusType;
  departureDelayMinutes: number;
  arrivalDelayMinutes: number;
  delayMinutes: number;
  scheduledDeparture: Date;
  actualDeparture?: Date;
  scheduledArrival: Date;
  actualArrival?: Date;
  lastUpdated: Date;
}

type FlightStatusType = 
  | 'SCHEDULED'
  | 'DELAYED' 
  | 'IN_FLIGHT'
  | 'LANDED'
  | 'CANCELLED'
  | 'UNKNOWN';

interface PayoutEvaluation {
  shouldPayout: boolean;
  shouldExpire: boolean;
  reason: PayoutReason;
  confidence: number;
}

interface PayoutReason {
  type: 'FLIGHT_DELAYED' | 'FLIGHT_CANCELLED' | 'FLIGHT_COMPLETED_ON_TIME' | 'POLICY_EXPIRED' | 'MONITORING_CONTINUES';
  delayMinutes?: number;
  details: string;
}

interface PayoutRequest {
  policy: Policy;
  amount: number;
  reason: PayoutReason;
  flightData: FlightStatus;
  triggeredAt: Date;
}

interface Payout {
  id: string;
  policyId: string;
  amount: number;
  reason: string;
  details: string;
  flightDelayMinutes?: number;
  processedAt: Date;
  txHash: string;
}
```

## 4. API Endpoints

### 4.1 Get Payout Status
```
GET /api/payouts/policy/{policyId}
```

**Response:**
```json
{
  "payout": {
    "id": "payout_1234567890",
    "policyId": "pol_1234567890",
    "amount": 500.00,
    "reason": "FLIGHT_DELAYED",
    "details": "Flight delayed by 75 minutes",
    "flightDelayMinutes": 75,
    "processedAt": "2025-06-15T14:30:00Z",
    "txHash": "0x..."
  }
}
```

### 4.2 Manual Payout Trigger (Admin)
```
POST /api/admin/payouts/trigger
```

**Request:**
```json
{
  "policyId": "pol_1234567890",
  "reason": "MANUAL",
  "details": "Manual payout approved by admin",
  "amount": 500.00
}
```

### 4.3 Payout Engine Status
```
GET /api/admin/payout-engine/status
```

**Response:**
```json
{
  "status": "RUNNING",
  "activePolicies": 245,
  "payoutsToday": 12,
  "lastProcessedAt": "2025-06-15T14:25:00Z",
  "errorRate": 0.002
}
```

## 5. Monitoring & Metrics

```typescript
export const payoutEngineMetrics = {
  policiesEvaluated: new Counter({
    name: 'payout_engine_policies_evaluated_total',
    help: 'Policies evaluated for payout',
    labelNames: ['outcome']
  }),
  
  payoutsTriggered: new Counter({
    name: 'payout_engine_payouts_triggered_total',
    help: 'Payouts triggered',
    labelNames: ['reason', 'delay_bucket']
  }),
  
  payoutAmount: new Histogram({
    name: 'payout_engine_payout_amount',
    help: 'Payout amounts',
    buckets: [50, 100, 250, 500, 1000, 2500]
  }),
  
  payoutProcessingTime: new Histogram({
    name: 'payout_engine_processing_duration_seconds',
    help: 'Payout processing time',
    buckets: [1, 5, 10, 30, 60, 120]
  }),
  
  flightDataFreshness: new Histogram({
    name: 'payout_engine_flight_data_age_minutes',
    help: 'Age of flight data used for decisions',
    buckets: [1, 2, 5, 10, 15, 30]
  }),
  
  evaluationErrors: new Counter({
    name: 'payout_engine_evaluation_errors_total',
    help: 'Policy evaluation errors',
    labelNames: ['policy_id', 'error']
  })
};
```

## 6. Error Handling

```typescript
export class PayoutEngineError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PayoutEngineError';
  }
}

export const PAYOUT_ERROR_CODES = {
  FLIGHT_NOT_FOUND: 'FLIGHT_NOT_FOUND',
  ESCROW_NOT_FOUND: 'ESCROW_NOT_FOUND',
  ESCROW_FULFILLMENT_FAILED: 'ESCROW_FULFILLMENT_FAILED',
  INVALID_PAYOUT_CONDITION: 'INVALID_PAYOUT_CONDITION',
  DUPLICATE_PAYOUT: 'DUPLICATE_PAYOUT',
  INSUFFICIENT_ESCROW_FUNDS: 'INSUFFICIENT_ESCROW_FUNDS'
} as const;
```

## 7. Implementation Timeline

### Week 1: Core Logic
- Flight monitoring system
- Condition evaluation engine
- Basic payout triggers
- Integration with Flight Data Aggregator

### Week 2: PayGo Integration
- Escrow fulfillment logic
- Payout processing
- Error handling and retries
- Transaction monitoring

### Week 3: Automation & Monitoring
- Scheduled monitoring tasks
- Metrics and alerting
- Admin APIs
- Performance optimization

## 8. Success Metrics

### Performance
- Payout processing time: < 60 seconds
- Flight data freshness: < 5 minutes
- Monitoring accuracy: > 99.8%
- System uptime: > 99.9%

### Business
- Automatic payout rate: > 95%
- False positive rate: < 1%
- User satisfaction: > 90%
- Average payout time: < 2 minutes

---

**Dependencies**: PRD-ENGINE-002 (Policy Engine), PRD-DATA-001 (Flight Data Aggregator)  
**Integration**: Automates the core value proposition of instant parametric insurance payouts  
**Status**: Implementation Ready