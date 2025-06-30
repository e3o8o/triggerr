# PRD-ENGINE-004: Provider Management System

**Status**: Ready for Implementation  
**Priority**: Medium - Future Marketplace Functionality  
**Dependencies**: PRD-CORE-001 (Database), PRD-CORE-002 (Auth), PRD-ENGINE-002 (Policy Engine)  
**Estimated Timeline**: 3-4 weeks  

## 1. Overview

### 1.1 Purpose
The Provider Management System enables third-party insurance providers to join the triggerr marketplace, offer their own parametric insurance products, and manage their business operations through comprehensive APIs and dashboards.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Provider Portal │    │ Provider Engine  │    │ Revenue Engine  │
│                 │────▶│                  │────▶│                 │
│ Onboarding      │    │ Product Mgmt     │    │ Fee Calculation │
│ Dashboard       │    │ Approval Flow    │    │ Payout Tracking │
│ Analytics       │    │ API Management   │    │ Revenue Reports │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Core Components

### 2.1 Provider Management Engine

```typescript
export class ProviderManagementEngine {
  private onboardingService: ProviderOnboardingService;
  private productManager: ProviderProductManager;
  private revenueEngine: RevenueEngine;
  private approvalWorkflow: ApprovalWorkflow;

  constructor(config: ProviderEngineConfig) {
    this.onboardingService = new ProviderOnboardingService(config.onboarding);
    this.productManager = new ProviderProductManager(config.products);
    this.revenueEngine = new RevenueEngine(config.revenue);
    this.approvalWorkflow = new ApprovalWorkflow(config.approval);
  }

  async registerProvider(application: ProviderApplication): Promise<Provider> {
    // Validate application
    await this.validateApplication(application);

    // Create provider record
    const provider = await this.createProviderRecord({
      ...application,
      status: 'PENDING_APPROVAL',
      appliedAt: new Date()
    });

    // Generate API credentials
    const credentials = await this.generateAPICredentials(provider.id);

    // Create provider wallet
    const wallet = await this.createProviderWallet(provider.id);

    // Start approval workflow
    await this.approvalWorkflow.initiate(provider.id);

    // Send confirmation
    await this.notifyProviderRegistration(provider, credentials);

    providerManagementMetrics.providersRegistered.inc({ 
      category: application.category 
    });

    return provider;
  }

  async approveProvider(providerId: string, approver: string): Promise<void> {
    const provider = await this.getProviderById(providerId);
    
    if (provider.status !== 'PENDING_APPROVAL') {
      throw new ProviderManagementError(
        'INVALID_STATUS_TRANSITION', 
        'Provider not in pending approval status'
      );
    }

    // Update provider status
    await this.updateProviderStatus(providerId, 'APPROVED', {
      approvedBy: approver,
      approvedAt: new Date()
    });

    // Enable API access
    await this.enableAPIAccess(providerId);

    // Set up revenue sharing
    await this.revenueEngine.setupRevenueSharing(provider);

    // Send approval notification
    await this.notifyProviderApproval(provider);

    providerManagementMetrics.providersApproved.inc({ 
      category: provider.category 
    });
  }

  async createProduct(
    providerId: string, 
    productSpec: ProductSpecification
  ): Promise<ProviderProduct> {
    const provider = await this.validateProviderAccess(providerId);
    
    // Validate product specification
    await this.validateProductSpec(productSpec);

    // Create product record
    const product = await this.productManager.createProduct({
      providerId,
      ...productSpec,
      status: 'DRAFT',
      createdAt: new Date()
    });

    // Generate product API endpoints
    await this.generateProductEndpoints(product);

    providerManagementMetrics.productsCreated.inc({ 
      provider: provider.name,
      category: productSpec.category 
    });

    return product;
  }
}
```

### 2.2 Provider Onboarding Service

```typescript
export class ProviderOnboardingService {
  async validateApplication(application: ProviderApplication): Promise<void> {
    const validationRules = [
      this.validateBusinessInfo,
      this.validateFinancialInfo,
      this.validateTechnicalCapabilities,
      this.validateCompliance,
      this.validateInsuranceProducts
    ];

    for (const rule of validationRules) {
      await rule(application);
    }
  }

  private async validateBusinessInfo(app: ProviderApplication): Promise<void> {
    const required = ['name', 'description', 'website', 'contactEmail', 'businessAddress'];
    
    for (const field of required) {
      if (!app[field]) {
        throw new ProviderManagementError(
          'MISSING_BUSINESS_INFO', 
          `Missing required field: ${field}`
        );
      }
    }

    // Validate business registration
    if (!app.businessRegistrationNumber) {
      throw new ProviderManagementError(
        'MISSING_BUSINESS_REGISTRATION', 
        'Business registration number required'
      );
    }
  }

  private async validateFinancialInfo(app: ProviderApplication): Promise<void> {
    // Validate minimum capital requirements
    if (app.capitalRequirement < 100000) { // $100k minimum
      throw new ProviderManagementError(
        'INSUFFICIENT_CAPITAL', 
        'Minimum capital requirement not met'
      );
    }

    // Validate financial statements
    if (!app.financialStatements || app.financialStatements.length === 0) {
      throw new ProviderManagementError(
        'MISSING_FINANCIAL_STATEMENTS', 
        'Financial statements required'
      );
    }
  }

  private async validateTechnicalCapabilities(app: ProviderApplication): Promise<void> {
    // Validate API integration capabilities
    if (!app.technicalContact) {
      throw new ProviderManagementError(
        'MISSING_TECHNICAL_CONTACT', 
        'Technical contact required'
      );
    }

    // Validate webhook endpoints
    if (app.webhookEndpoints) {
      for (const endpoint of app.webhookEndpoints) {
        await this.validateWebhookEndpoint(endpoint);
      }
    }
  }

  private async validateInsuranceProducts(app: ProviderApplication): Promise<void> {
    if (!app.proposedProducts || app.proposedProducts.length === 0) {
      throw new ProviderManagementError(
        'NO_PRODUCTS_PROPOSED', 
        'At least one insurance product must be proposed'
      );
    }

    for (const product of app.proposedProducts) {
      await this.validateProductProposal(product);
    }
  }
}
```

### 2.3 Provider Product Manager

```typescript
export class ProviderProductManager {
  async createProduct(productData: CreateProductRequest): Promise<ProviderProduct> {
    // Generate product configuration
    const config = await this.generateProductConfig(productData);

    // Create database record
    const product = await this.createProductRecord({
      ...productData,
      config,
      status: 'DRAFT'
    });

    // Set up product-specific quote engine rules
    await this.setupQuoteRules(product);

    // Create product API endpoints
    await this.createProductEndpoints(product);

    return product;
  }

  private async generateProductConfig(data: CreateProductRequest): Promise<ProductConfig> {
    return {
      id: generateProductId(data.providerId, data.name),
      quotingRules: {
        baseRate: data.baseRate,
        riskFactors: data.riskFactors,
        minimumPremium: data.minimumPremium,
        maximumCoverage: data.maximumCoverage
      },
      payoutRules: {
        conditions: data.payoutConditions,
        calculations: data.payoutCalculations,
        timeouts: data.timeouts
      },
      escrowSettings: {
        collateralRatio: data.collateralRatio || 1.0,
        escrowModel: data.escrowModel || 'SINGLE_SIDED',
        autoRelease: data.autoRelease !== false
      },
      apiSettings: {
        rateLimit: data.rateLimit || { requests: 1000, window: 'hour' },
        allowedOrigins: data.allowedOrigins || [],
        requiresApproval: data.requiresApproval !== false
      }
    };
  }

  async publishProduct(productId: string, providerId: string): Promise<void> {
    const product = await this.validateProductOwnership(productId, providerId);
    
    if (product.status !== 'DRAFT') {
      throw new ProviderManagementError(
        'INVALID_PRODUCT_STATUS', 
        'Only draft products can be published'
      );
    }

    // Validate product is ready for publishing
    await this.validateProductReadiness(product);

    // Update status
    await this.updateProductStatus(productId, 'PUBLISHED');

    // Enable product endpoints
    await this.enableProductEndpoints(product);

    // Notify marketplace
    await this.notifyProductPublished(product);

    providerManagementMetrics.productsPublished.inc({ 
      provider: product.providerId,
      category: product.category 
    });
  }
}
```

### 2.4 Revenue Engine

```typescript
export class RevenueEngine {
  private feeCalculator: FeeCalculator;
  private payoutScheduler: PayoutScheduler;

  async setupRevenueSharing(provider: Provider): Promise<RevenueSharing> {
    const revenueConfig = await this.calculateRevenueSharing(provider);
    
    const sharing = await this.createRevenueSharingRecord({
      providerId: provider.id,
      platformFeePercentage: revenueConfig.platformFee,
      providerSharePercentage: revenueConfig.providerShare,
      payoutSchedule: revenueConfig.payoutSchedule,
      minimumPayout: revenueConfig.minimumPayout,
      createdAt: new Date()
    });

    return sharing;
  }

  private async calculateRevenueSharing(provider: Provider): Promise<RevenueConfig> {
    // Base revenue sharing: 80/20 (provider/platform)
    let platformFee = 0.20;
    let providerShare = 0.80;

    // Adjust based on provider tier
    switch (provider.tier) {
      case 'PREMIUM':
        platformFee = 0.15; // Lower fee for premium providers
        providerShare = 0.85;
        break;
      case 'ENTERPRISE':
        platformFee = 0.10; // Lowest fee for enterprise providers
        providerShare = 0.90;
        break;
      case 'STARTUP':
        platformFee = 0.25; // Higher fee for startups (more support needed)
        providerShare = 0.75;
        break;
    }

    return {
      platformFee,
      providerShare,
      payoutSchedule: provider.payoutPreference || 'WEEKLY',
      minimumPayout: provider.minimumPayout || 100 // $100 minimum
    };
  }

  async processPolicyRevenue(policy: Policy, premium: number): Promise<void> {
    const provider = await this.getProviderById(policy.providerId);
    const revenueSharing = await this.getRevenueSharing(provider.id);

    const platformFee = premium * revenueSharing.platformFeePercentage;
    const providerShare = premium * revenueSharing.providerSharePercentage;

    // Create revenue records
    await Promise.all([
      this.createRevenueRecord({
        policyId: policy.id,
        providerId: provider.id,
        type: 'PLATFORM_FEE',
        amount: platformFee,
        createdAt: new Date()
      }),
      this.createRevenueRecord({
        policyId: policy.id,
        providerId: provider.id,
        type: 'PROVIDER_SHARE',
        amount: providerShare,
        createdAt: new Date()
      })
    ]);

    // Update provider balance
    await this.updateProviderBalance(provider.id, providerShare);

    providerManagementMetrics.revenueProcessed.inc({ 
      provider: provider.id,
      type: 'PREMIUM'
    }, premium);
  }

  async processScheduledPayouts(): Promise<void> {
    const dueParsouts = await this.getDuePayouts();
    
    for (const payout of dueParsouts) {
      try {
        await this.processProviderPayout(payout);
      } catch (error) {
        providerManagementMetrics.payoutFailures.inc({ 
          provider: payout.providerId,
          error: error.constructor.name 
        });
      }
    }
  }
}
```

## 3. Data Types

```typescript
interface Provider {
  id: string;
  name: string;
  description: string;
  category: ProviderCategory;
  tier: ProviderTier;
  status: ProviderStatus;
  contactEmail: string;
  website: string;
  businessAddress: string;
  businessRegistrationNumber: string;
  walletAddress: string;
  apiCredentials: APICredentials;
  revenueSharing: RevenueSharing;
  appliedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

type ProviderCategory = 
  | 'TRADITIONAL_INSURER'
  | 'INSURTECH_STARTUP'
  | 'REINSURER'
  | 'MGA'
  | 'BROKER'
  | 'TECHNOLOGY_PROVIDER';

type ProviderTier = 'STARTUP' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';

type ProviderStatus = 
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'INACTIVE';

interface ProviderProduct {
  id: string;
  providerId: string;
  name: string;
  description: string;
  category: ProductCategory;
  config: ProductConfig;
  status: ProductStatus;
  endpoints: ProductEndpoint[];
  createdAt: Date;
  publishedAt?: Date;
}

type ProductCategory = 
  | 'FLIGHT_DELAY'
  | 'WEATHER'
  | 'CRYPTO_VOLATILITY'
  | 'DEFI_PROTOCOL'
  | 'SUPPLY_CHAIN'
  | 'NATURAL_DISASTER'
  | 'SPORTS_BETTING'
  | 'CUSTOM';

interface ProductConfig {
  id: string;
  quotingRules: QuotingRules;
  payoutRules: PayoutRules;
  escrowSettings: EscrowSettings;
  apiSettings: APISettings;
}

interface RevenueSharing {
  providerId: string;
  platformFeePercentage: number;
  providerSharePercentage: number;
  payoutSchedule: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  minimumPayout: number;
  lastPayoutAt?: Date;
}
```

## 4. API Endpoints

### 4.1 Provider Registration
```
POST /api/providers/register
```

**Request:**
```json
{
  "name": "AcmeCorp Insurance",
  "description": "Leading provider of parametric insurance solutions",
  "category": "INSURTECH_STARTUP",
  "contactEmail": "partnerships@acmecorp.com",
  "website": "https://acmecorp.com",
  "businessAddress": "123 Insurance St, New York, NY 10001",
  "businessRegistrationNumber": "REG123456789",
  "proposedProducts": [
    {
      "name": "Flight Delay Pro",
      "category": "FLIGHT_DELAY",
      "description": "Enhanced flight delay insurance with real-time tracking"
    }
  ]
}
```

### 4.2 Provider Dashboard
```
GET /api/providers/{providerId}/dashboard
```

**Response:**
```json
{
  "provider": {
    "id": "prov_1234567890",
    "name": "AcmeCorp Insurance",
    "status": "APPROVED",
    "tier": "STANDARD"
  },
  "metrics": {
    "activePolicies": 1250,
    "totalPremium": 45000.00,
    "pendingPayouts": 15,
    "revenueThisMonth": 36000.00
  },
  "products": [
    {
      "id": "prod_1234567890",
      "name": "Flight Delay Pro",
      "status": "PUBLISHED",
      "policiesCount": 1250
    }
  ]
}
```

### 4.3 Create Product
```
POST /api/providers/{providerId}/products
```

### 4.4 Revenue Analytics
```
GET /api/providers/{providerId}/revenue?period=month
```

## 5. Error Handling

```typescript
export class ProviderManagementError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProviderManagementError';
  }
}

export const PROVIDER_ERROR_CODES = {
  MISSING_BUSINESS_INFO: 'MISSING_BUSINESS_INFO',
  INSUFFICIENT_CAPITAL: 'INSUFFICIENT_CAPITAL',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  INVALID_PRODUCT_CONFIG: 'INVALID_PRODUCT_CONFIG'
} as const;
```

## 6. Monitoring & Metrics

```typescript
export const providerManagementMetrics = {
  providersRegistered: new Counter({
    name: 'provider_management_providers_registered_total',
    help: 'Providers registered',
    labelNames: ['category']
  }),
  
  productsCreated: new Counter({
    name: 'provider_management_products_created_total',
    help: 'Products created',
    labelNames: ['provider', 'category']
  }),
  
  revenueProcessed: new Counter({
    name: 'provider_management_revenue_processed',
    help: 'Revenue processed',
    labelNames: ['provider', 'type']
  }),
  
  providerResponseTime: new Histogram({
    name: 'provider_management_response_time_seconds',
    help: 'Provider API response time',
    labelNames: ['provider', 'endpoint']
  })
};
```

## 7. Implementation Timeline

### Week 1-2: Core Provider Management
- Provider registration and approval workflow
- Basic provider dashboard
- API credential management
- Database models and relationships

### Week 3: Product Management
- Product creation and configuration
- Product publishing workflow
- API endpoint generation
- Product-specific quote rules

### Week 4: Revenue & Analytics
- Revenue sharing calculations
- Payout processing
- Provider analytics dashboard
- Performance monitoring

## 8. Success Metrics

### Business
- Provider onboarding time: < 48 hours
- Provider satisfaction: > 85%
- Average revenue per provider: > $10k/month
- Product time-to-market: < 1 week

### Technical
- API response time: < 500ms
- System uptime: > 99.9%
- Provider API success rate: > 99%

---

**Dependencies**: PRD-CORE-001 (Database), PRD-ENGINE-002 (Policy Engine)  
**Integration**: Enables multi-provider marketplace expansion  
**Status**: Implementation Ready for Phase 4