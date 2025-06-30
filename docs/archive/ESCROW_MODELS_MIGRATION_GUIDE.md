# Escrow Models Migration Guide

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Status**: Implementation Ready  
**Technology Stack**: Better-Auth + Drizzle + PayGo + Multi-Escrow Models  

## 📋 Overview

This guide documents the complete migration to support multiple escrow models in the triggerr platform from MVP launch. Our first-party provider **InsureCo** will use the **Single-Sided Escrow** model for the MVP, while the architecture supports all escrow models for future providers.

## 🎯 Migration Objectives

✅ **Support Multiple Escrow Models**: Enable providers to choose their preferred escrow model  
✅ **Start with Single-Sided**: InsureCo uses the simplest, most capital-efficient model for MVP  
✅ **Marketplace Ready**: Database and code architecture ready for provider onboarding  
✅ **Drizzle Implementation**: Converted from Prisma to Drizzle for better performance  
✅ **Better-Auth Integration**: Modern authentication system replacing NextAuth  

## 🔄 Changes Completed

### 1. Database Schema Updates (Drizzle)

#### New Enums Added
```typescript
// packages/core/database/schema.ts
export const escrowModelEnum = pgEnum('escrow_model_type', [
  // Basic Models
  'SINGLE_SIDED',                // MVP - InsureCo default
  'DUAL_SIDED',                  
  'COMBINED',                    
  'HYBRID_PARTIAL_COLLATERAL',   
  
  // Pooled Models
  'COLLATERALIZED_PROVIDER_POOL',
  'BONDED_LIABILITY_POOL',        
  'PEER_TO_PEER_POOL',           
  'SUBSCRIPTION_BASED_POOL',      
  
  // Advanced Models
  'DYNAMIC_RISK_POOL',           
  'PREDICTION_MARKET',           
  'SYNTHETIC_DEFI_COVERAGE',     
  'NFT_POLICY',                  
  'DAO_GOVERNED_POOL',           
  'MULTI_ORACLE_VERIFIED'        
]);

export const premiumReturnPolicyEnum = pgEnum('premium_return_policy', [
  'PROVIDER_KEEPS_PREMIUM',      // Default for InsureCo
  'RETURN_TO_CUSTOMER'           
]);
```

#### Updated Provider Table
```typescript
export const provider = pgTable("provider", {
  // ... existing fields
  
  // NEW: Escrow Model Configuration
  escrowModel: escrowModelEnum("escrow_model").notNull().default('SINGLE_SIDED'),
  premiumReturnPolicy: premiumReturnPolicyEnum("premium_return_policy").notNull().default('PROVIDER_KEEPS_PREMIUM'),
  collateralRequirement: decimal("collateral_requirement", { precision: 15, scale: 2 }).default('0.00'),
  poolAddress: text("pool_address"),
  poolMinimumBalance: decimal("pool_minimum_balance", { precision: 15, scale: 2 }).default('0.00'),
  escrowConfiguration: jsonb("escrow_configuration"), // Model-specific config
});
```

#### Updated Escrow Table
```typescript
export const escrow = pgTable("escrow", {
  // ... existing fields
  
  // NEW: Multi-Model Support
  escrowModel: escrowModelEnum("escrow_model").notNull().default('SINGLE_SIDED'),
  premiumReturnPolicy: premiumReturnPolicyEnum("premium_return_policy").notNull().default('PROVIDER_KEEPS_PREMIUM'),
  collateralAmount: decimal("collateral_amount", { precision: 15, scale: 6 }).default('0.00'),
  poolId: text("pool_id").references(() => escrowPool.id),
  escrowConfiguration: jsonb("escrow_configuration"),
});
```

#### New Escrow Pool Tables
```typescript
// For pooled escrow models
export const escrowPool = pgTable("escrow_pool", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => provider.id),
  name: text("name").notNull(),
  escrowModel: escrowModelEnum("escrow_model").notNull(),
  totalCapacity: decimal("total_capacity", { precision: 15, scale: 2 }).notNull(),
  availableBalance: decimal("available_balance", { precision: 15, scale: 2 }).notNull().default('0.00'),
  poolAddress: text("pool_address").unique(),
  // ... additional pool management fields
});

export const escrowPoolParticipant = pgTable("escrow_pool_participant", {
  id: text("id").primaryKey(),
  poolId: text("pool_id").notNull().references(() => escrowPool.id),
  userId: text("user_id").references(() => user.id),
  contributionAmount: decimal("contribution_amount", { precision: 15, scale: 2 }).notNull(),
  sharePercentage: decimal("share_percentage", { precision: 8, scale: 6 }).notNull(),
  // ... P2P and subscription model fields
});
```

### 2. Escrow Engine Framework

#### Core Engine Interface
```typescript
// packages/services/escrow-engine/index.ts
export interface IEscrowEngine {
  createEscrow(params: EscrowCreateParams): Promise<EscrowResult>;
  fulfillEscrow(escrowId: string, fulfillerAddress: string): Promise<EscrowResult>;
  releaseEscrow(escrowId: string, reason: string, metadata?: any): Promise<EscrowResult>;
  getEscrowStatus(escrowId: string): Promise<EscrowStatus>;
  validateConfiguration(config: EscrowConfiguration): boolean;
  getModelType(): EscrowModelType;
}
```

#### Single-Sided Engine (MVP - InsureCo)
```typescript
export class SingleSidedEscrowEngine extends BaseEscrowEngine {
  constructor(paygoClient: PaygoClient) {
    super(paygoClient, 'SINGLE_SIDED');
  }

  async createEscrow(params: EscrowCreateParams): Promise<EscrowResult> {
    // Only user premium goes into escrow
    // Provider maintains separate reserves
    const escrowId = this.generateEscrowId(params.policyId);
    const amount = this.convertToPayGoAmount(params.premiumAmount);

    const createEscrow = new CreateEscrow(
      escrowId,
      amount,
      params.expirationDate,
      params.providerAddress,
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );

    return await this.executePayGoTransaction(createEscrow);
  }
}
```

#### Engine Factory Pattern
```typescript
export class EscrowEngineFactory {
  private static engines: Map<EscrowModelType, typeof BaseEscrowEngine> = new Map([
    ['SINGLE_SIDED', SingleSidedEscrowEngine],
    ['DUAL_SIDED', DualSidedEscrowEngine], // To be implemented
    // More engines added as needed
  ]);

  static createEngine(modelType: EscrowModelType, paygoClient: PaygoClient): IEscrowEngine {
    const EngineClass = this.engines.get(modelType);
    if (!EngineClass) {
      throw new Error(`Escrow engine for model ${modelType} not implemented yet`);
    }
    return new EngineClass(paygoClient);
  }
}
```

### 3. Database Seeding with InsureCo

#### InsureCo Provider Configuration
```typescript
// packages/core/database/seed.ts
const seedProviders = [
  {
    id: "provider_triggerr_co_001",
    name: "InsureCo",
    slug: "insureco",
    category: "FLIGHT_DELAY",
    status: "ACTIVE",
    
    // MVP: Single-Sided Escrow Configuration
    escrowModel: "SINGLE_SIDED",
    premiumReturnPolicy: "PROVIDER_KEEPS_PREMIUM",
    collateralRequirement: "0.00", // No collateral for single-sided
    poolAddress: null, // No pool for single-sided
    
    escrowConfiguration: {
      description: "Single-sided escrow model where only user premium is held in escrow.",
      reserveRequirements: {
        minimumReserve: "100000.00", // $100k minimum reserve
        reserveRatio: "2.0", // 200% of outstanding liability
        rebalanceFrequency: "daily"
      }
    }
  }
];
```

#### Product Configuration
```typescript
const seedProviderProducts = [
  {
    id: "product_flight_delay_60",
    providerId: "provider_triggerr_co_001",
    name: "Flight Delay 60+ Minutes",
    coverageType: "DELAY_60",
    baseRate: "0.0250", // 2.5% base rate
    maxCoverage: "5000.00",
    minCoverage: "50.00",
  },
  {
    id: "product_flight_delay_120", 
    providerId: "provider_triggerr_co_001",
    name: "Flight Delay 120+ Minutes",
    coverageType: "DELAY_120",
    baseRate: "0.0150", // 1.5% base rate (lower for higher threshold)
    maxCoverage: "10000.00",
    minCoverage: "100.00",
  }
];
```

### 4. Updated Documentation

#### Escrow Models Document
- **File**: `docs/escrow-models-drizzle.md`
- **Status**: ✅ Complete - Converted from Prisma to Drizzle
- **Content**: All 14 escrow models with Drizzle schema examples
- **Implementation Phases**: MVP → Multi-Provider → Pooled → Advanced

#### Updated PRDs
- **PRD-CORE-001**: ✅ Updated to Drizzle schema with escrow model support
- **PRD-CORE-002**: ✅ Updated to better-auth instead of NextAuth
- **PRD-ENGINE-002**: ✅ Updated to include multi-escrow model support

## 📋 Still Required (Implementation Priorities)

### Priority 1: Complete MVP Foundation (Week 1-2)

#### 1.1 Complete PRD Updates
- [ ] **PRD-CORE-003**: Update shared types for Drizzle and escrow models
- [ ] **PRD-API-001**: Update API endpoints to use better-auth middleware
- [ ] **PRD-APP-001**: Update frontend components for better-auth client
- [ ] **PRD-ENGINE-001**: Update quote engine to consider escrow model in pricing
- [ ] **PRD-ENGINE-003**: Update payout engine for multi-model support

#### 1.2 Middleware & API Updates
- [ ] Create Next.js middleware for better-auth
- [ ] Update API routes to use better-auth session handling
- [ ] Update authentication components to use better-auth client

#### 1.3 Environment Setup
- [ ] Update environment variables for better-auth
- [ ] Configure Google OAuth credentials
- [ ] Set up PayGo wallet for InsureCo

### Priority 2: Core Implementation (Week 3-4)

#### 2.1 Policy Engine Integration
```typescript
// packages/services/policy-engine/index.ts
export class PolicyEngine {
  private escrowManager: EscrowManager;

  async createPolicy(request: PolicyCreateRequest): Promise<Policy> {
    const provider = await this.getProvider(request.providerId);
    
    // Get provider's escrow configuration
    const escrowConfig: EscrowConfiguration = {
      escrowModel: provider.escrowModel,
      premiumReturnPolicy: provider.premiumReturnPolicy,
      collateralRequirement: provider.collateralRequirement,
      poolAddress: provider.poolAddress,
      modelSpecificConfig: provider.escrowConfiguration
    };

    // Create escrow using appropriate engine
    const escrowResult = await this.escrowManager.createEscrowForPolicy({
      policyId: policy.id,
      providerId: provider.id,
      userAddress: request.userWalletAddress,
      providerAddress: provider.walletAddress,
      premiumAmount: quote.premium,
      coverageAmount: quote.coverageAmount,
      expirationDate: policy.expiresAt,
      configuration: escrowConfig
    });

    return policy;
  }
}
```

#### 2.2 Quote Engine Updates
```typescript
// Factor in escrow model costs when calculating quotes
export class QuoteEngine {
  async generateQuote(request: QuoteRequest): Promise<Quote> {
    const provider = await this.getProvider(request.providerId);
    
    // Adjust pricing based on escrow model
    const escrowModelMultiplier = this.getEscrowModelMultiplier(provider.escrowModel);
    const basePremium = this.calculateBasePremium(request);
    const adjustedPremium = basePremium * escrowModelMultiplier;
    
    return {
      premium: adjustedPremium,
      escrowModel: provider.escrowModel,
      // ... other quote fields
    };
  }

  private getEscrowModelMultiplier(model: EscrowModelType): number {
    switch (model) {
      case 'SINGLE_SIDED': return 1.0; // No adjustment - most efficient
      case 'DUAL_SIDED': return 1.1; // 10% higher for full collateralization
      case 'COMBINED': return 1.05; // 5% higher for combined escrow
      default: return 1.0;
    }
  }
}
```

### Priority 3: Frontend Integration (Week 5-6)

#### 3.1 Provider Selection UI
```typescript
// Show escrow model information during provider selection
export function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <div className="provider-card">
      <h3>{provider.name}</h3>
      <div className="escrow-info">
        <Badge variant="outline">{provider.escrowModel}</Badge>
        <p className="text-sm text-muted-foreground">
          {getEscrowModelDescription(provider.escrowModel)}
        </p>
      </div>
      {/* Trust indicators based on escrow model */}
      <TrustIndicators 
        escrowModel={provider.escrowModel}
        collateralRequirement={provider.collateralRequirement}
      />
    </div>
  );
}
```

#### 3.2 Policy Details UI
```typescript
// Show escrow model details in policy information
export function PolicyDetails({ policy }: { policy: Policy }) {
  return (
    <div className="policy-details">
      <section className="escrow-section">
        <h4>Escrow Protection</h4>
        <EscrowModelExplanation 
          model={policy.escrowModel}
          premiumReturnPolicy={policy.premiumReturnPolicy}
        />
        <EscrowStatusTracker escrowId={policy.escrowId} />
      </section>
    </div>
  );
}
```

### Priority 4: Multi-Provider Support (Week 7-8)

#### 4.1 Provider Onboarding Flow
```typescript
// Provider can select their preferred escrow model during onboarding
export function ProviderOnboardingWizard() {
  const [escrowModel, setEscrowModel] = useState<EscrowModelType>('SINGLE_SIDED');
  
  return (
    <WizardStep title="Choose Escrow Model">
      <EscrowModelSelector
        selectedModel={escrowModel}
        onModelChange={setEscrowModel}
        availableModels={getSupportedEscrowModels()}
      />
      
      <EscrowModelComparison models={getSupportedEscrowModels()} />
      
      <CollateralRequirements 
        model={escrowModel}
        onRequirementChange={setCollateralRequirement}
      />
    </WizardStep>
  );
}
```

#### 4.2 Admin Dashboard
```typescript
// Admin can view and manage different escrow models
export function ProviderManagement() {
  return (
    <div className="provider-management">
      <ProvidersTable 
        columns={[
          'name',
          'escrowModel', 
          'collateralRequirement',
          'activePolicies',
          'reserveHealth',
          'actions'
        ]}
      />
      
      <EscrowModelAnalytics />
      <ReserveMonitoring />
    </div>
  );
}
```

## 🗂️ File Structure After Migration

```
triggerr/
├── packages/
│   ├── core/
│   │   ├── auth/                     # ✅ Better-auth implementation
│   │   ├── database/                 # ✅ Drizzle schema with escrow models
│   │   │   ├── schema.ts            # ✅ Multi-escrow model schema
│   │   │   ├── index.ts             # ✅ Drizzle connection
│   │   │   ├── migrate.ts           # ✅ Migration script
│   │   │   └── seed.ts              # ✅ InsureCo seed data
│   │   └── types/                   # ❌ TODO: Update for Drizzle types
│   │
│   ├── services/
│   │   ├── escrow-engine/           # ✅ Multi-model escrow engines
│   │   │   └── index.ts            # ✅ SingleSidedEscrowEngine + factory
│   │   ├── quote-engine/           # ❌ TODO: Update for escrow model pricing
│   │   ├── policy-engine/          # ❌ TODO: Update for multi-escrow support  
│   │   └── payout-engine/          # ❌ TODO: Update for multi-escrow release
│   │
│   └── integrations/               # ✅ Ready for flight data APIs
│
├── apps/web/                       # ❌ TODO: Update for better-auth
│
├── docs/
│   ├── escrow-models-drizzle.md    # ✅ Complete escrow model guide
│   ├── PRDs/
│   │   ├── PRD-CORE-001-*.md      # ✅ Updated for Drizzle
│   │   ├── PRD-CORE-002-*.md      # ✅ Updated for better-auth
│   │   ├── PRD-ENGINE-002-*.md    # ✅ Updated for multi-escrow
│   │   ├── PRD-CORE-003-*.md      # ❌ TODO: Update for Drizzle types
│   │   └── PRD-API-001-*.md       # ❌ TODO: Update for better-auth
│   │
│   └── ESCROW_MODELS_MIGRATION_GUIDE.md # ✅ This document
│
├── drizzle.config.ts              # ✅ Drizzle configuration
├── .env.example                   # ✅ Updated with better-auth vars
└── package.json                   # ✅ Updated dependencies + scripts
```

## 🚀 Implementation Timeline

### Week 1-2: Foundation Completion
- [ ] Complete PRD updates (CORE-003, API-001, APP-001)
- [ ] Implement better-auth middleware and API updates
- [ ] Update frontend authentication components
- [ ] Set up environment variables and OAuth

### Week 3-4: Core Business Logic
- [ ] Update quote engine for escrow model pricing
- [ ] Implement policy engine with multi-escrow support
- [ ] Update payout engine for different release patterns
- [ ] Create escrow status monitoring

### Week 5-6: Frontend Integration
- [ ] Build provider selection with escrow model info
- [ ] Create policy details with escrow explanations
- [ ] Implement escrow status tracking UI
- [ ] Add trust indicators and educational content

### Week 7-8: Multi-Provider Ready
- [ ] Build provider onboarding with escrow model selection
- [ ] Create admin dashboard for escrow model management
- [ ] Implement reserve monitoring and health checks
- [ ] Add escrow model analytics and reporting

### Week 9-10: Testing & Optimization
- [ ] End-to-end testing of all escrow models
- [ ] Performance optimization for escrow operations
- [ ] Security review of escrow implementations
- [ ] Load testing with multiple providers

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test escrow engine implementations
describe('SingleSidedEscrowEngine', () => {
  it('should create escrow with only premium amount', async () => {
    const engine = new SingleSidedEscrowEngine(mockPaygoClient);
    const result = await engine.createEscrow({
      premiumAmount: '100.00',
      coverageAmount: '1000.00',
      // ... other params
    });
    
    expect(result.success).toBe(true);
    expect(result.escrowId).toBeDefined();
  });
});
```

### Integration Tests
```typescript
// Test policy creation with different escrow models
describe('Policy Creation', () => {
  it('should create policy with InsureCo single-sided escrow', async () => {
    const policyEngine = new PolicyEngine(config);
    const policy = await policyEngine.createPolicy({
      providerId: 'provider_triggerr_co_001',
      flightNumber: 'AA100',
      // ... other params
    });
    
    expect(policy.escrowModel).toBe('SINGLE_SIDED');
    expect(policy.status).toBe('ACTIVE');
  });
});
```

### E2E Tests
```typescript
// Test complete user journey with escrow
describe('Insurance Purchase Flow', () => {
  it('should complete purchase with automatic escrow creation', async () => {
    // 1. User gets quote
    // 2. User creates policy
    // 3. Escrow is created automatically
    // 4. Policy becomes active
    // 5. User can view escrow status
  });
});
```

## 📚 Key Resources

### Code References
- **Working PayGo Patterns**: `working_tests/test-paygo-full.js`
- **MVP Business Logic**: `working_tests/mvp/triggerrMVPv2.5.js`
- **API Integration Patterns**: `working_tests/testAviationstack.js`, etc.

### Documentation
- **Escrow Models**: `docs/escrow-models-drizzle.md`
- **Database Schema**: `packages/core/database/schema.ts`
- **Escrow Engines**: `packages/services/escrow-engine/index.ts`

### Configuration
- **Environment Setup**: `.env.example`
- **Database Config**: `drizzle.config.ts`
- **Seed Data**: `packages/core/database/seed.ts`

## ✅ Success Criteria

### MVP Success (InsureCo Single-Sided)
- [ ] User can purchase flight delay insurance through InsureCo
- [ ] Premium is held in PayGo escrow using single-sided model
- [ ] Automatic payout works for delayed flights
- [ ] User sees clear escrow status and protection details
- [ ] InsureCo reserves are properly managed

### Multi-Provider Success
- [ ] New providers can onboard with escrow model selection
- [ ] Users can compare providers and their escrow models
- [ ] Different escrow models work correctly for different providers
- [ ] Admin can monitor all escrow models and provider health
- [ ] Marketplace displays trust indicators based on escrow models

### Technical Success
- [ ] All escrow engines implement the common interface
- [ ] Database supports all 14 escrow models
- [ ] Performance is acceptable for all escrow operations
- [ ] Security review passes for all escrow implementations
- [ ] Code is maintainable and extensible

## 🎯 MVP Launch Checklist

### Database Ready
- [ ] Drizzle schema migrated and deployed
- [ ] InsureCo provider seeded with single-sided escrow config
- [ ] Flight data sources configured
- [ ] Admin user created

### Authentication Ready  
- [ ] Better-auth implemented and tested
- [ ] Google OAuth configured
- [ ] Session management working
- [ ] Protected routes secured

### Escrow System Ready
- [ ] SingleSidedEscrowEngine implemented and tested
- [ ] PayGo integration working with direct imports pattern
- [ ] Escrow status monitoring operational
- [ ] Reserve management for InsureCo configured

### Business Logic Ready
- [ ] Quote engine considers escrow model in pricing
- [ ] Policy engine creates escrows automatically
- [ ] Payout engine releases escrows correctly
- [ ] All engines handle single-sided model properly

### Frontend Ready
- [ ] User can purchase insurance through InsureCo
- [ ] Escrow protection clearly explained to users
- [ ] Policy status shows escrow information
- [ ] Trust indicators display InsureCo's model benefits

---

**🎯 Mission**: Launch MVP with InsureCo using single-sided escrow while maintaining architecture for all 14 escrow models

**⏰ Timeline**: 8-10 weeks total (MVP in 4-6 weeks, multi-provider in 8-10 weeks)

**📞 Success Metric**: First automated payout using single-sided escrow model with clear user understanding of protection mechanism