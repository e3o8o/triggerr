# PRD-API-002: Provider Integration API

**Status**: Ready for Implementation  
**Priority**: Medium - Future Marketplace Expansion  
**Dependencies**: PRD-ENGINE-004 (Provider Management), PRD-API-001 (Public API), PRD-CORE-002 (Auth)  
**Estimated Timeline**: 3-4 weeks  

## 1. Overview

### 1.1 Purpose
The Provider Integration API enables third-party insurance providers to join the triggerr marketplace, create and manage parametric insurance products, track revenue, and integrate their systems with the platform. This API transforms triggerr from a single-provider platform into a comprehensive insurance marketplace.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Provider Apps   │    │ Provider API     │    │ Provider Engine │
│                 │────▶│                  │────▶│                 │
│ Dashboard       │    │ Authentication   │    │ Product Mgmt    │
│ Backend Systems │    │ Rate Limiting    │    │ Revenue Mgmt    │
│ Mobile Apps     │    │ Webhooks         │    │ Approval Flow   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 1.3 Strategic Goals
- **Marketplace Growth**: Enable 50+ providers within 12 months
- **Product Diversity**: Support multiple parametric insurance types
- **Revenue Optimization**: Automated revenue sharing and reporting
- **Developer Experience**: Best-in-class API documentation and SDKs
- **Compliance**: Regulatory compliance across jurisdictions

## 2. Authentication & Authorization

### 2.1 Provider Authentication
```typescript
interface ProviderAuth {
  // API Key Authentication
  apiKey: string;      // Provider-specific API key
  signature: string;   // Request signature using provider secret
  timestamp: number;   // Request timestamp for replay protection
  
  // OAuth 2.0 for Advanced Integrations
  clientId: string;
  clientSecret: string;
  scope: string[];     // Requested permissions
}
```

### 2.2 Permission Scopes
```typescript
type ProviderScope = 
  | 'provider:read'           // Read provider information
  | 'provider:write'          // Update provider details
  | 'products:read'           // View products
  | 'products:write'          // Create/update products
  | 'products:publish'        // Publish products to marketplace
  | 'policies:read'           // View policies for provider's products
  | 'revenue:read'            // Access revenue reports
  | 'webhooks:read'           // View webhook configurations
  | 'webhooks:write'          // Configure webhooks
  | 'quotes:create'           // Generate quotes for provider products
  | 'quotes:read'             // View quote details
  | 'analytics:read';         // Access analytics data
```

### 2.3 Rate Limiting Tiers
```typescript
const PROVIDER_RATE_LIMITS = {
  STARTUP: {
    requests: 1000,
    window: 'hour',
    burst: 50,
    monthlyQuota: 10000
  },
  STANDARD: {
    requests: 5000,
    window: 'hour',
    burst: 200,
    monthlyQuota: 100000
  },
  PREMIUM: {
    requests: 20000,
    window: 'hour',
    burst: 500,
    monthlyQuota: 500000
  },
  ENTERPRISE: {
    requests: 100000,
    window: 'hour',
    burst: 2000,
    monthlyQuota: 'unlimited'
  }
};
```

## 3. Provider Management Endpoints

### 3.1 Provider Registration & Profile

#### POST /api/providers/register
Register new provider for marketplace.

**Request:**
```json
{
  "name": "AcmeCorp Insurance",
  "description": "Leading provider of parametric insurance solutions",
  "category": "INSURTECH_STARTUP",
  "businessInfo": {
    "registrationNumber": "REG123456789",
    "website": "https://acmecorp.com",
    "contactEmail": "partnerships@acmecorp.com",
    "businessAddress": {
      "street": "123 Insurance St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "US"
    }
  },
  "financialInfo": {
    "capitalRequirement": 500000,
    "bankingDetails": {
      "bankName": "Chase Bank",
      "accountNumber": "encrypted_account_info",
      "routingNumber": "encrypted_routing_info"
    }
  },
  "technicalContact": {
    "name": "John Doe",
    "email": "tech@acmecorp.com",
    "phone": "+1-555-0123"
  },
  "proposedProducts": [
    {
      "name": "Flight Delay Pro",
      "category": "FLIGHT_DELAY",
      "description": "Enhanced flight delay insurance with real-time tracking"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prov_acme_123456",
    "name": "AcmeCorp Insurance",
    "status": "PENDING_APPROVAL",
    "applicationId": "app_789012",
    "apiCredentials": {
      "keyId": "pk_test_acme_abcdef123456",
      "publicKey": "pk_live_acme_abcdef123456"
    },
    "submittedAt": "2025-01-27T10:00:00Z",
    "estimatedReviewTime": "5-7 business days"
  }
}
```

#### GET /api/providers/profile
Get current provider profile and status.

#### PUT /api/providers/profile
Update provider profile information.

#### GET /api/providers/status
Get approval status and requirements.

### 3.2 API Key Management

#### GET /api/providers/api-keys
List all API keys for provider.

#### POST /api/providers/api-keys
Create new API key.

**Request:**
```json
{
  "name": "Production API Key",
  "permissions": [
    "products:write",
    "policies:read",
    "revenue:read"
  ],
  "rateLimit": "STANDARD",
  "expiresAt": "2026-01-27T00:00:00Z"
}
```

#### DELETE /api/providers/api-keys/{keyId}
Revoke API key.

## 4. Product Management Endpoints

### 4.1 Product Lifecycle

#### POST /api/providers/products
Create new insurance product.

**Request:**
```json
{
  "name": "Weather Protection Plus",
  "description": "Comprehensive weather-based parametric insurance",
  "category": "WEATHER",
  "productConfig": {
    "coverageTypes": ["RAIN", "SNOW", "EXTREME_HEAT"],
    "geographicScope": ["US", "CA", "EU"],
    "quotingRules": {
      "baseRate": 0.08,
      "minimumPremium": 25.00,
      "maximumCoverage": 10000.00,
      "riskFactors": {
        "seasonality": 1.2,
        "historicalWeather": 1.5,
        "locationRisk": 2.0
      }
    },
    "payoutRules": {
      "triggers": [
        {
          "condition": "rainfall_mm",
          "threshold": 50,
          "window": "24_hours",
          "payoutPercentage": 100
        }
      ],
      "calculations": {
        "method": "LINEAR",
        "minPayout": 0.1,
        "maxPayout": 1.0
      }
    },
    "dataSources": [
      {
        "provider": "WEATHER_API",
        "endpoint": "precipitation",
        "updateFrequency": "hourly"
      }
    ]
  },
  "pricing": {
    "currency": "USD",
    "feeStructure": {
      "platformFee": 0.15,
      "providerShare": 0.85
    }
  },
  "compliance": {
    "requiredLicenses": ["SURPLUS_LINES"],
    "jurisdiction": ["US_ALL_STATES"],
    "regulatoryApproval": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod_weather_plus_123",
    "name": "Weather Protection Plus",
    "status": "DRAFT",
    "version": "1.0.0",
    "endpoints": {
      "quotes": "/api/quotes/weather-protection-plus",
      "policies": "/api/policies/weather-protection-plus"
    },
    "testMode": true,
    "createdAt": "2025-01-27T10:00:00Z"
  }
}
```

#### GET /api/providers/products
List all products for provider.

#### GET /api/providers/products/{productId}
Get detailed product information.

#### PUT /api/providers/products/{productId}
Update product configuration.

#### POST /api/providers/products/{productId}/publish
Publish product to marketplace.

#### POST /api/providers/products/{productId}/suspend
Temporarily suspend product.

### 4.2 Product Testing & Validation

#### POST /api/providers/products/{productId}/test-quote
Generate test quote for validation.

**Request:**
```json
{
  "testScenario": "STANDARD_CASE",
  "parameters": {
    "location": "40.7128,-74.0060",
    "coverage": 1000.00,
    "duration": "7_days",
    "startDate": "2025-02-01T00:00:00Z"
  }
}
```

#### POST /api/providers/products/{productId}/simulate-payout
Simulate payout scenario for testing.

## 5. Policy & Revenue Management

### 5.1 Policy Tracking

#### GET /api/providers/policies
List policies for provider's products.

**Query Parameters:**
```typescript
interface PolicyQuery {
  productId?: string;
  status?: PolicyStatus;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}
```

#### GET /api/providers/policies/{policyId}
Get detailed policy information.

#### GET /api/providers/policies/analytics
Get policy analytics and trends.

### 5.2 Revenue Management

#### GET /api/providers/revenue/summary
Get revenue summary and current balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentBalance": 15750.00,
    "currency": "USD",
    "thisMonth": {
      "grossRevenue": 8500.00,
      "platformFees": 1275.00,
      "netRevenue": 7225.00,
      "policiesCount": 142
    },
    "lastPayout": {
      "amount": 12000.00,
      "date": "2025-01-15T00:00:00Z",
      "transactionId": "txn_payout_123456"
    },
    "nextPayout": {
      "estimatedAmount": 15750.00,
      "scheduledDate": "2025-02-01T00:00:00Z"
    }
  }
}
```

#### GET /api/providers/revenue/transactions
Get detailed revenue transaction history.

#### GET /api/providers/revenue/reports
Generate revenue reports.

**Query Parameters:**
```typescript
interface RevenueReportQuery {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  endDate: string;
  format: 'json' | 'csv' | 'pdf';
  groupBy?: 'product' | 'country' | 'date';
}
```

#### POST /api/providers/revenue/payout-request
Request immediate payout (if balance meets minimum).

## 6. Analytics & Insights

### 6.1 Performance Analytics

#### GET /api/providers/analytics/overview
Get comprehensive performance overview.

#### GET /api/providers/analytics/conversion
Get quote-to-policy conversion metrics.

#### GET /api/providers/analytics/geographic
Get geographic performance breakdown.

#### GET /api/providers/analytics/product-performance
Get product-specific performance metrics.

### 6.2 Market Intelligence

#### GET /api/providers/market/benchmarks
Get market benchmark data (anonymized).

#### GET /api/providers/market/trends
Get market trend analysis.

#### GET /api/providers/market/opportunities
Get suggested market opportunities.

## 7. Webhook Management

### 7.1 Webhook Configuration

#### POST /api/providers/webhooks
Register webhook endpoint.

**Request:**
```json
{
  "url": "https://acmecorp.com/webhooks/triggerr",
  "events": [
    "policy.created",
    "policy.activated", 
    "policy.paid_out",
    "revenue.payout_processed",
    "product.status_changed"
  ],
  "description": "Production webhook for policy events",
  "secret": "webhook_secret_key",
  "retryPolicy": {
    "maxRetries": 3,
    "backoffMultiplier": 2,
    "initialDelay": 1000
  }
}
```

#### GET /api/providers/webhooks
List configured webhooks.

#### PUT /api/providers/webhooks/{webhookId}
Update webhook configuration.

#### DELETE /api/providers/webhooks/{webhookId}
Delete webhook.

### 7.2 Webhook Events

```typescript
type ProviderWebhookEvent = 
  | 'provider.approved'
  | 'provider.suspended'
  | 'product.created'
  | 'product.published'
  | 'product.suspended'
  | 'policy.created'
  | 'policy.activated'
  | 'policy.paid_out'
  | 'policy.expired'
  | 'quote.generated'
  | 'revenue.updated'
  | 'revenue.payout_processed'
  | 'api_key.created'
  | 'api_key.revoked';
```

**Sample Webhook Payload:**
```json
{
  "event": "policy.paid_out",
  "data": {
    "policy": {
      "id": "pol_123456789",
      "productId": "prod_weather_plus_123",
      "providerId": "prov_acme_123456",
      "premium": 75.00,
      "payout": 500.00,
      "userId": "user_789012"
    },
    "payout": {
      "amount": 500.00,
      "reason": "THRESHOLD_EXCEEDED",
      "processedAt": "2025-01-27T14:30:00Z",
      "txHash": "0x..."
    },
    "revenue": {
      "providerShare": 63.75,
      "platformFee": 11.25
    }
  },
  "timestamp": "2025-01-27T14:30:05Z",
  "apiVersion": "v1",
  "signature": "sha256=..."
}
```

## 8. Error Handling

### 8.1 Provider-Specific Error Codes

```typescript
export const PROVIDER_API_ERRORS = {
  // Authentication
  INVALID_PROVIDER_KEY: 'INVALID_PROVIDER_KEY',
  PROVIDER_SUSPENDED: 'PROVIDER_SUSPENDED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Product Management
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_ALREADY_PUBLISHED: 'PRODUCT_ALREADY_PUBLISHED',
  INVALID_PRODUCT_CONFIG: 'INVALID_PRODUCT_CONFIG',
  REGULATORY_APPROVAL_REQUIRED: 'REGULATORY_APPROVAL_REQUIRED',
  
  // Revenue
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  PAYOUT_MINIMUM_NOT_MET: 'PAYOUT_MINIMUM_NOT_MET',
  PAYOUT_ALREADY_SCHEDULED: 'PAYOUT_ALREADY_SCHEDULED',
  
  // Rate Limiting
  PROVIDER_RATE_LIMIT_EXCEEDED: 'PROVIDER_RATE_LIMIT_EXCEEDED',
  MONTHLY_QUOTA_EXCEEDED: 'MONTHLY_QUOTA_EXCEEDED',
  
  // Compliance
  MISSING_REQUIRED_LICENSE: 'MISSING_REQUIRED_LICENSE',
  JURISDICTION_NOT_SUPPORTED: 'JURISDICTION_NOT_SUPPORTED',
  KYC_VERIFICATION_REQUIRED: 'KYC_VERIFICATION_REQUIRED'
} as const;
```

### 8.2 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PRODUCT_CONFIG",
    "message": "Product configuration validation failed",
    "details": {
      "field": "quotingRules.baseRate",
      "issue": "Base rate must be between 0.01 and 0.50",
      "provided": 0.75
    },
    "requestId": "req_prov_123456",
    "documentation": "https://docs.triggerr.com/errors/invalid-product-config"
  }
}
```

## 9. SDKs & Integration Tools

### 9.1 Official SDKs

```typescript
// Provider SDK Example (JavaScript/TypeScript)
import { InsureInnieProvider } from '@triggerr/provider-sdk';

const provider = new InsureInnieProvider({
  apiKey: 'pk_live_acme_...',
  environment: 'production'
});

// Create product
const product = await provider.products.create({
  name: 'Travel Delay Protection',
  category: 'TRAVEL_DELAY',
  quotingRules: {
    baseRate: 0.05,
    minimumPremium: 15.00
  }
});

// Track policies
const policies = await provider.policies.list({
  status: 'ACTIVE',
  limit: 100
});

// Set up webhooks
await provider.webhooks.create({
  url: 'https://mycompany.com/webhooks',
  events: ['policy.created', 'policy.paid_out']
});
```

### 9.2 Integration Helpers

```typescript
// Quote generation helper
export class ProviderQuoteHelper {
  static calculatePremium(
    baseRate: number,
    coverage: number,
    riskFactors: RiskFactors
  ): number {
    let premium = coverage * baseRate;
    
    // Apply risk multipliers
    premium *= riskFactors.historical || 1.0;
    premium *= riskFactors.seasonal || 1.0;
    premium *= riskFactors.geographic || 1.0;
    
    return Math.round(premium * 100) / 100;
  }
  
  static validateProductConfig(config: ProductConfig): ValidationResult {
    const errors = [];
    
    if (config.quotingRules.baseRate > 0.5) {
      errors.push('Base rate cannot exceed 50%');
    }
    
    if (config.quotingRules.minimumPremium < 1) {
      errors.push('Minimum premium must be at least $1');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

## 10. Testing & Sandbox

### 10.1 Sandbox Environment

```
Base URL: https://api-sandbox.triggerr.com/v1/providers
Test API Key: pk_test_provider_1234567890
```

### 10.2 Test Data & Scenarios

```typescript
export const TEST_SCENARIOS = {
  standardQuote: {
    coverage: 1000,
    location: 'test_location_us_ny',
    riskLevel: 'medium'
  },
  highRiskQuote: {
    coverage: 5000,
    location: 'test_location_hurricane_zone',
    riskLevel: 'high'
  },
  payoutTrigger: {
    eventType: 'weather_threshold_exceeded',
    location: 'test_location_us_fl',
    severity: 'major'
  }
};
```

## 11. Monitoring & Analytics

### 11.1 Provider API Metrics

```typescript
export const providerApiMetrics = {
  requestsTotal: new Counter({
    name: 'provider_api_requests_total',
    help: 'Total provider API requests',
    labelNames: ['provider_id', 'endpoint', 'status']
  }),
  
  responseTime: new Histogram({
    name: 'provider_api_response_time_seconds',
    help: 'Provider API response time',
    labelNames: ['provider_id', 'endpoint']
  }),
  
  productPerformance: new Gauge({
    name: 'provider_product_performance',
    help: 'Product performance metrics',
    labelNames: ['provider_id', 'product_id', 'metric']
  }),
  
  revenueGenerated: new Counter({
    name: 'provider_revenue_generated_total',
    help: 'Total revenue generated by provider',
    labelNames: ['provider_id', 'product_id']
  })
};
```

### 11.2 Provider Dashboard

```typescript
interface ProviderDashboard {
  overview: {
    activeProducts: number;
    totalPolicies: number;
    monthlyRevenue: number;
    conversionRate: number;
  };
  performance: {
    topPerformingProducts: ProductMetrics[];
    recentPolicies: Policy[];
    revenueChart: ChartData;
  };
  alerts: {
    lowPerformance: Alert[];
    complianceIssues: Alert[];
    systemNotifications: Alert[];
  };
}
```

## 12. Implementation Timeline

### Week 1-2: Core Provider API
- Provider registration and authentication
- Basic product management endpoints
- API key management system
- Rate limiting implementation

### Week 3: Advanced Features
- Revenue management APIs
- Analytics endpoints
- Webhook system
- Error handling and validation

### Week 4: Integration & Polish
- SDK development
- Documentation and testing
- Sandbox environment setup
- Performance optimization

## 13. Success Metrics

### Business Metrics
- **Provider Onboarding**: 10 providers in first 6 months
- **Product Diversity**: 20+ different product types
- **Revenue Growth**: 25% monthly growth in marketplace GMV
- **Provider Satisfaction**: >90% satisfaction score

### Technical Metrics
- **API Uptime**: >99.9%
- **Response Time**: <300ms for 95th percentile
- **Error Rate**: <1% for provider API calls
- **SDK Adoption**: >80% of providers use official SDKs

---

**Dependencies**: PRD-ENGINE-004 (Provider Management), PRD-API-001 (Public API), PRD-CORE-002 (Auth)  
**Integration**: Enables multi-provider marketplace expansion  
**Status**: Implementation Ready for Phase 5