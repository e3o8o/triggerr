# PRD-API-003: Webhook System

**Status**: Ready for Implementation  
**Priority**: Medium - Enhanced Integration Capabilities  
**Dependencies**: PRD-API-001 (Public API), PRD-ENGINE-002 (Policy Engine), PRD-ENGINE-003 (Payout Engine)  
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Webhook System provides real-time event notifications to external systems, enabling seamless integration with third-party applications, partner platforms, and provider systems. It ensures reliable delivery of critical events with retry mechanisms and comprehensive monitoring.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Event Sources   │    │ Webhook Engine   │    │ External Systems│
│                 │────▶│                  │────▶│                 │
│ Policy Engine   │    │ Event Router     │    │ Partner Apps    │
│ Payout Engine   │    │ Delivery Queue   │    │ Provider APIs   │
│ Flight Monitor  │    │ Retry Logic      │    │ Notification    │
│ User Actions    │    │ Security Layer   │    │ Systems         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Core Components

### 2.1 Webhook Engine Implementation

```typescript
export class WebhookEngine {
  private eventRouter: EventRouter;
  private deliveryQueue: DeliveryQueue;
  private securityManager: WebhookSecurity;
  private retryManager: RetryManager;

  constructor(config: WebhookEngineConfig) {
    this.eventRouter = new EventRouter(config.routing);
    this.deliveryQueue = new DeliveryQueue(config.queue);
    this.securityManager = new WebhookSecurity(config.security);
    this.retryManager = new RetryManager(config.retry);
  }

  async registerWebhook(registration: WebhookRegistration): Promise<Webhook> {
    // Validate webhook URL
    await this.validateWebhookUrl(registration.url);

    // Generate signing secret
    const secret = this.securityManager.generateSecret();

    // Create webhook record
    const webhook = await this.createWebhookRecord({
      ...registration,
      secret,
      status: 'ACTIVE',
      createdAt: new Date()
    });

    // Test webhook with verification event
    await this.sendVerificationEvent(webhook);

    webhookMetrics.webhooksRegistered.inc({ 
      events: registration.events.length,
      user_type: registration.userId ? 'user' : 'provider'
    });

    return webhook;
  }

  async processEvent(event: WebhookEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // Find matching webhooks
      const webhooks = await this.findMatchingWebhooks(event);

      if (webhooks.length === 0) {
        webhookMetrics.eventsWithoutSubscribers.inc({ event_type: event.type });
        return;
      }

      // Queue deliveries for each webhook
      for (const webhook of webhooks) {
        await this.queueDelivery(webhook, event);
      }

      webhookMetrics.eventsProcessed.inc({ 
        event_type: event.type,
        subscribers: webhooks.length.toString()
      });

      webhookMetrics.eventProcessingTime.observe(
        (Date.now() - startTime) / 1000
      );

    } catch (error) {
      webhookMetrics.eventProcessingErrors.inc({ 
        event_type: event.type,
        error: error.constructor.name
      });
      throw error;
    }
  }

  private async queueDelivery(webhook: Webhook, event: WebhookEvent): Promise<void> {
    const delivery: WebhookDelivery = {
      id: generateDeliveryId(),
      webhookId: webhook.id,
      event: event.type,
      payload: this.buildPayload(event),
      attempts: 0,
      status: 'PENDING',
      scheduledAt: new Date(),
      createdAt: new Date()
    };

    await this.deliveryQueue.enqueue(delivery);
  }

  private buildPayload(event: WebhookEvent): WebhookPayload {
    return {
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      apiVersion: 'v1'
    };
  }
}
```

### 2.2 Event Router

```typescript
export class EventRouter {
  private subscriptions: Map<string, WebhookSubscription[]> = new Map();

  async findMatchingWebhooks(event: WebhookEvent): Promise<Webhook[]> {
    const eventSubscriptions = this.subscriptions.get(event.type) || [];
    const matchingWebhooks: Webhook[] = [];

    for (const subscription of eventSubscriptions) {
      const webhook = await this.getWebhookById(subscription.webhookId);
      
      if (!webhook || !webhook.isActive) {
        continue;
      }

      // Apply event filters
      if (await this.matchesFilters(event, subscription.filters)) {
        matchingWebhooks.push(webhook);
      }
    }

    return matchingWebhooks;
  }

  private async matchesFilters(
    event: WebhookEvent, 
    filters?: EventFilters
  ): Promise<boolean> {
    if (!filters) return true;

    // User/Provider filtering
    if (filters.userId && event.data.userId !== filters.userId) {
      return false;
    }

    if (filters.providerId && event.data.providerId !== filters.providerId) {
      return false;
    }

    // Policy status filtering
    if (filters.policyStatus && event.data.policy?.status !== filters.policyStatus) {
      return false;
    }

    // Custom field filtering
    if (filters.customFields) {
      for (const [field, value] of Object.entries(filters.customFields)) {
        if (event.data[field] !== value) {
          return false;
        }
      }
    }

    return true;
  }
}
```

### 2.3 Delivery Queue & Retry Logic

```typescript
export class DeliveryQueue {
  private queue: Queue<WebhookDelivery>;
  private httpClient: HttpClient;

  constructor(config: QueueConfig) {
    this.queue = new Queue('webhook-delivery', config);
    this.httpClient = new HttpClient(config.http);
    this.setupWorkers();
  }

  async enqueue(delivery: WebhookDelivery): Promise<void> {
    await this.queue.add('deliver', delivery, {
      delay: this.calculateDelay(delivery.attempts),
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }

  private setupWorkers(): void {
    this.queue.process('deliver', async (job) => {
      const delivery = job.data as WebhookDelivery;
      return await this.executeDelivery(delivery);
    });
  }

  private async executeDelivery(delivery: WebhookDelivery): Promise<void> {
    const webhook = await this.getWebhookById(delivery.webhookId);
    if (!webhook) {
      throw new WebhookError('WEBHOOK_NOT_FOUND', 'Webhook not found');
    }

    const startTime = Date.now();
    delivery.attempts += 1;

    try {
      // Sign the payload
      const signature = this.signPayload(delivery.payload, webhook.secret);

      // Send HTTP request
      const response = await this.httpClient.post(webhook.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event,
          'X-Webhook-Delivery': delivery.id,
          'User-Agent': 'triggerr-webhooks/1.0'
        },
        timeout: 30000 // 30 seconds
      });

      if (response.status >= 200 && response.status < 300) {
        // Success
        await this.markDeliverySuccess(delivery, response);
        
        webhookMetrics.deliveriesSuccessful.inc({ 
          event_type: delivery.event,
          status_code: response.status.toString()
        });
      } else {
        // HTTP error status
        await this.markDeliveryFailed(delivery, `HTTP ${response.status}: ${response.statusText}`);
        
        webhookMetrics.deliveriesFailed.inc({ 
          event_type: delivery.event,
          status_code: response.status.toString()
        });
      }

    } catch (error) {
      // Network or other error
      await this.markDeliveryFailed(delivery, error.message);
      
      webhookMetrics.deliveriesFailed.inc({ 
        event_type: delivery.event,
        error: error.constructor.name
      });

      // Retry if attempts remaining
      if (delivery.attempts < 5) {
        await this.scheduleRetry(delivery);
      } else {
        await this.markDeliveryAbandoned(delivery);
      }
    }

    webhookMetrics.deliveryDuration.observe(
      (Date.now() - startTime) / 1000
    );
  }

  private signPayload(payload: any, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify(payload);
    const signedPayload = `${timestamp}.${body}`;
    
    return `t=${timestamp},v1=${createHmac('sha256', secret).update(signedPayload).digest('hex')}`;
  }

  private calculateDelay(attempts: number): number {
    // Exponential backoff: 5s, 25s, 125s, 625s, 3125s
    return Math.pow(5, attempts) * 1000;
  }
}
```

### 2.4 Webhook Security

```typescript
export class WebhookSecurity {
  generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const providedSignature = elements.find(e => e.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !providedSignature) {
      return false;
    }

    // Check timestamp tolerance (5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) {
      return false;
    }

    // Verify signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(providedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}
```

## 3. Event Types

### 3.1 Policy Events
```typescript
type PolicyEventType = 
  | 'policy.created'
  | 'policy.activated'
  | 'policy.expired'
  | 'policy.cancelled'
  | 'policy.paid_out';

interface PolicyEventData {
  policy: {
    id: string;
    policyNumber: string;
    userId: string;
    providerId: string;
    status: string;
    premium: number;
    coverage: number;
  };
}
```

### 3.2 Payment Events
```typescript
type PaymentEventType =
  | 'payment.processing'
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.refunded';

interface PaymentEventData {
  payment: {
    id: string;
    policyId: string;
    amount: number;
    status: string;
    method: string;
  };
}
```

### 3.3 Payout Events
```typescript
type PayoutEventType =
  | 'payout.triggered'
  | 'payout.processing'
  | 'payout.completed'
  | 'payout.failed';

interface PayoutEventData {
  payout: {
    id: string;
    policyId: string;
    amount: number;
    reason: string;
    flightDelayMinutes?: number;
    txHash?: string;
  };
}
```

### 3.4 Flight Events
```typescript
type FlightEventType =
  | 'flight.status_changed'
  | 'flight.delayed'
  | 'flight.cancelled'
  | 'flight.departed'
  | 'flight.arrived';

interface FlightEventData {
  flight: {
    flightNumber: string;
    status: string;
    delayMinutes?: number;
    departureTime: string;
    arrivalTime: string;
  };
  affectedPolicies: string[];
}
```

## 4. API Endpoints

### 4.1 Webhook Management

#### POST /webhooks
Register a new webhook endpoint.

**Request:**
```json
{
  "url": "https://yourdomain.com/webhooks/triggerr",
  "events": ["policy.created", "policy.paid_out"],
  "description": "Production webhook for policy events",
  "filters": {
    "policyStatus": ["ACTIVE", "PAID_OUT"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "webhook_1234567890",
    "url": "https://yourdomain.com/webhooks/triggerr",
    "events": ["policy.created", "policy.paid_out"],
    "secret": "whsec_...",
    "status": "ACTIVE",
    "createdAt": "2025-06-01T12:00:00Z"
  }
}
```

#### GET /webhooks
List registered webhooks.

#### PUT /webhooks/{webhookId}
Update webhook configuration.

#### DELETE /webhooks/{webhookId}
Delete webhook.

### 4.2 Webhook Testing

#### POST /webhooks/{webhookId}/test
Send test event to webhook.

**Request:**
```json
{
  "eventType": "policy.created",
  "testData": {
    "policy": {
      "id": "test_policy_123",
      "status": "ACTIVE"
    }
  }
}
```

### 4.3 Delivery Monitoring

#### GET /webhooks/{webhookId}/deliveries
Get delivery history for webhook.

**Response:**
```json
{
  "deliveries": [
    {
      "id": "delivery_1234567890",
      "event": "policy.created",
      "status": "DELIVERED",
      "attempts": 1,
      "response": {
        "statusCode": 200,
        "duration": 156
      },
      "createdAt": "2025-06-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250
  }
}
```

#### POST /webhooks/{webhookId}/deliveries/{deliveryId}/retry
Manually retry failed delivery.

## 5. Security Features

### 5.1 Signature Verification
```typescript
// Webhook signature verification example
const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  const elements = signature.split(',');
  const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
  const sig = elements.find(e => e.startsWith('v1='))?.split('=')[1];
  
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(sig, 'hex'),
    Buffer.from(expectedSig, 'hex')
  );
};
```

### 5.2 URL Validation
- HTTPS requirement for production webhooks
- Domain whitelist support
- IP address restrictions
- Port restrictions (standard HTTP/HTTPS ports only)

### 5.3 Rate Limiting
- Per-webhook delivery rate limits
- Global system rate limits
- Burst protection
- Backpressure mechanisms

## 6. Monitoring & Metrics

### 6.1 Webhook Metrics
```typescript
export const webhookMetrics = {
  webhooksRegistered: new Counter({
    name: 'webhook_system_webhooks_registered_total',
    help: 'Webhooks registered',
    labelNames: ['events', 'user_type']
  }),
  
  eventsProcessed: new Counter({
    name: 'webhook_system_events_processed_total',
    help: 'Events processed',
    labelNames: ['event_type', 'subscribers']
  }),
  
  deliveriesSuccessful: new Counter({
    name: 'webhook_system_deliveries_successful_total',
    help: 'Successful deliveries',
    labelNames: ['event_type', 'status_code']
  }),
  
  deliveriesFailed: new Counter({
    name: 'webhook_system_deliveries_failed_total',
    help: 'Failed deliveries',
    labelNames: ['event_type', 'error', 'status_code']
  }),
  
  deliveryDuration: new Histogram({
    name: 'webhook_system_delivery_duration_seconds',
    help: 'Delivery duration',
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
  })
};
```

### 6.2 Health Monitoring
- Webhook endpoint health checks
- Delivery success rates
- Average response times
- Error rate alerting

## 7. Error Handling

### 7.1 Error Types
```typescript
export class WebhookError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

export const WEBHOOK_ERROR_CODES = {
  INVALID_URL: 'INVALID_URL',
  WEBHOOK_NOT_FOUND: 'WEBHOOK_NOT_FOUND',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  SIGNATURE_INVALID: 'SIGNATURE_INVALID',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE'
} as const;
```

### 7.2 Retry Strategy
- **Immediate retry**: Network timeout errors
- **Exponential backoff**: HTTP 5xx errors
- **No retry**: HTTP 4xx errors (except 429)
- **Maximum attempts**: 5 retries over 24 hours
- **Dead letter queue**: Failed deliveries after max attempts

## 8. Configuration

### 8.1 Webhook Limits
```typescript
const WEBHOOK_LIMITS = {
  maxWebhooksPerUser: 10,
  maxEventsPerWebhook: 20,
  maxPayloadSize: 1024 * 1024, // 1MB
  maxResponseTime: 30000, // 30 seconds
  maxRetries: 5,
  retryWindow: 24 * 60 * 60 * 1000 // 24 hours
};
```

### 8.2 Supported Events
```typescript
const SUPPORTED_EVENTS = [
  'policy.created',
  'policy.activated',
  'policy.expired',
  'policy.cancelled', 
  'policy.paid_out',
  'payment.processing',
  'payment.completed',
  'payment.failed',
  'payout.triggered',
  'payout.completed',
  'flight.status_changed',
  'flight.delayed',
  'flight.cancelled'
];
```

## 9. Implementation Timeline

### Week 1: Core Infrastructure
- Webhook registration and management
- Event routing system
- Basic delivery mechanism
- Security implementation

### Week 2: Advanced Features
- Retry logic and queue management
- Filtering and subscription management
- Monitoring and metrics
- API endpoints

### Week 3: Testing & Integration
- Event integration with existing engines
- Comprehensive testing
- Documentation and examples
- Performance optimization

## 10. Success Metrics

### Performance
- Delivery success rate: > 99%
- Average delivery time: < 2 seconds
- Event processing latency: < 100ms

### Reliability
- System uptime: > 99.9%
- Retry success rate: > 95%
- False failure rate: < 1%

### Developer Experience
- Webhook setup time: < 5 minutes
- Test event delivery: < 30 seconds
- Documentation completeness: > 95%

---

**Dependencies**: PRD-API-001 (Public API), Policy/Payout Engines for event sources  
**Integration**: Real-time notifications for all platform events  
**Status**: Implementation Ready