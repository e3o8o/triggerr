# COMPREHENSIVE TODO: MVP COMPLETION PLAN

**Document Version**: 2.0
**Date**: January 2025
**Status**: ACTIVE IMPLEMENTATION PLAN
**Based On**: TypeScript compiler analysis and build system diagnostics

---

## 🚨 **CRITICAL ERRORS IDENTIFIED**

### **Build System Failures:**
1. **Turbo Workspace Resolution Error**: Missing `name` field at line 65 in package.json (likely a malformed package.json)
2. **TypeScript Compilation Errors**: 18+ critical type errors blocking build
3. **Drizzle ORM Version Conflicts**: Multiple incompatible SQL type definitions
4. **Service Integration Mismatches**: API routes cannot instantiate required services

### **Service Integration Failures:**
1. **DataRouter Constructor Mismatch**: API expects `new DataRouter(logger)` but constructor requires `(flightAggregator, weatherAggregator)`
2. **Quote Request Type Mismatch**: Service expects `coverageType` (string) but API provides `coverageTypes` (array)
3. **Policy Engine Dependencies**: Missing proper dependency injection setup

---

## 📋 **PHASE 1: FOUNDATION REPAIR (CRITICAL - BLOCKING ALL DEVELOPMENT)**

### **Task 1.1: Fix Build System Configuration** ✅ **COMPLETED**
**Priority**: 🔴 **BLOCKER**
**Estimated Time**: 2 hours
**Dependencies**: None

**Actions:**
- [x] **Fix Turbo workspace configuration**
  - ✅ Fixed malformed package.json causing line 65 error
  - ✅ Verified all workspace packages have proper `name` fields
  - ✅ Test: `bun run build` now shows 27/27 successful builds

- [x] **Migrated to TypeScript Project References**
  - ✅ Created standardized tsconfig templates (`tsconfig.core.json`, `tsconfig.integration.json`, `tsconfig.base.json`)
  - ✅ Migrated all 27 packages from `tsup` to `tsc` build system
  - ✅ Fixed dependency resolution issues in `@triggerr/data-router`
  - ✅ Added missing workspace dependencies to package.json files
  - ✅ Resolved strict TypeScript errors (`TS7006`, `TS2307`)
  - ✅ Test: All packages now build successfully with strict type checking

### **Task 1.2: Resolve Drizzle ORM Version Conflicts** ✅ **COMPLETED**
**Priority**: 🔴 **BLOCKER**
**Estimated Time**: 3 hours
**Dependencies**: Task 1.1

**Actions:**
- [x] **Audit Drizzle dependencies across all packages**
  - ✅ Identified version mismatch: policy-engine had `^0.31.2` (fixed to `^0.44.2` now), others had `^0.44.2`
  - ✅ Root package.json `overrides` field ensures consistent `^0.44.2` across all packages
  - ✅ All packages now use consistent drizzle-orm version via override mechanism

- [x] **Fix SQL type conflicts in affected files:**
  - ✅ No actual conflicts found - all files compile successfully
  - ✅ Version override resolves compatibility issues at runtime
  - ✅ Database operations work correctly with current configuration

- [x] **Test database connection and queries**
  - ✅ All database operations compile without type errors
  - ✅ Database is working as expected in development environment
  - ✅ All 27 packages build successfully including database-dependent ones

---

## 📋 **PHASE 1B: BUILD SYSTEM STABILIZATION & VALIDATION**

### **Task 1.3: Fix Turbo Configuration & Validate Build Chain** ✅ **COMPLETED**
**Priority**: 🔴 **BLOCKER**
**Estimated Time**: 2 hours
**Dependencies**: Task 1.2

**Actions:**
- [x] **Fix `turbo.json` Configuration**
  - ✅ Verified turbo.json has correct schema and task dependencies
  - ✅ Added DATABASE_URL to globalEnv for database-dependent packages
  - ✅ Build dependencies properly configured with `dependsOn: ["^build"]`
  - ✅ Output paths correctly specified for caching

- [x] **Validate Full Build Process**
  - ✅ TypeScript Project References ensure proper build order automatically
  - ✅ All 27 packages build successfully in correct dependency order
  - ✅ Build validation commands pass:
    - `bun run build`: 27/27 successful builds
    - `bun tsc --noEmit`: No type errors
  - ✅ Verified compiled output: 25/25 packages have dist folders (2 apps use different output)

- [x] **Test Development Server**
  - ✅ `bun dev` starts all services successfully
  - ✅ Web app accessible at http://localhost:3000
  - ✅ API service compiles and runs without errors
  - ✅ All TypeScript watch modes working properly

---

### **Task 1.4: Eliminate Deep Imports (Enterprise SDK Readiness)** ✅ **COMPLETED**
**Priority**: 🔴 **CRITICAL** (Blocking Enterprise SDK Distribution)
**Estimated Time**: 5 weeks (cross-repo effort)
**Dependencies**: Task 1.3, All core architectural decisions

**Actions:**
- [x] **Implemented Domain-Driven Barrel Export Strategy**:
  - ✅ Reorganized `@triggerr/core` with namespace exports (Database, Auth, Utils, Schema).
  - ✅ Reorganized `@triggerr/api-contracts` with domain-specific barrel exports (Insurance, Policy, Wallet, Chat, User, Auth, Payment).
  - ✅ Updated `@triggerr/blockchain` exports for clean consumption.
  - ✅ Updated all other `@triggerr/services/*`, `@triggerr/integrations/*`, `@triggerr/aggregators/*` packages to use barrel imports.
- [x] **Cleaned `@triggerr/api-sdk`**:
  - ✅ Eliminated all 14 deep import violations within the SDK.
  - ✅ Ensured SDK exports a clean, enterprise-ready API surface.
- [x] **Migrated Applications**:
  - ✅ Updated all `apps/api` endpoint files (40+ locations) to use new barrel imports.
  - ✅ Fixed `apps/web` frontend components and utilities, including Next.js `"use client"` directive placements.
  - ✅ Updated `apps/admin` to conform to new import standards.
- [x] **Developed & Utilized Validation Tools**:
  - ✅ Created `scripts/validate-deep-imports.ts` for continuous monitoring.
  - ✅ Ensured `scripts/validate-enterprise-sdk.ts` (now part of `validate-deep-imports.ts`) passed.
  - ✅ Leveraged `tsconfig.json` references and `turbo.json` for build order.
- [x] **Updated Documentation**:
  - ✅ Created `DEEP_IMPORT_REMOVAL_PLAN.md` for detailed tracking.
  - ✅ Created `DEEP_IMPORT_REMOVAL_COMPLETION_SUMMARY.md` as an archive.
  - ✅ Marked all related tasks in these documents as complete.

**Results:**
- ✅ **Zero deep import violations** detected across the entire codebase (317 files scanned).
- ✅ **All 28 packages build successfully** with 100% reliability.
- ✅ **Enterprise SDK is ready for distribution** with a clean public API surface.
- ✅ **Improved developer experience** due to intuitive import patterns.
- ✅ **Project `DEEP_IMPORT_REMOVAL_PLAN.md` successfully archived**.

---

## 📋 **PHASE 2: SERVICE IMPLEMENTATION & INTEGRATION (HIGH PRIORITY)**

### **Task 2.1: Fix DataRouter Integration** ✅ **COMPLETED**
**Priority**: 🟠 **HIGH**
**Estimated Time**: 4 hours
**Dependencies**: Task 1.2

**Actions:**
- [x] **Modify DataRouter constructor** in `packages/aggregators/data-router/src/router.ts` ✅ **COMPLETED**
  - ✅ **Current Issue**: API expects `new DataRouter(logger)` but constructor requires `(flightAggregator, weatherAggregator, config?)`
  - ✅ **Solution**: DataRouter constructor already properly implemented to accept configuration object with factory pattern:
    ```typescript
    constructor(config: DataRouterConfig) {
      this.logger = config.logger;
      // Aggregators are initialized internally using provided clients
      this.flightAggregator = new FlightAggregator(config.flightApiClients || []);
      this.weatherAggregator = new WeatherAggregator(config.weatherApiClients || []);
    }
    ```

- [x] **Update API route** in `apps/api/src/routes/v1/insurance/quote.ts` ✅ **COMPLETED**
  - ✅ **Problem**: `DataRouter` constructor call was incomplete, missing required API clients
  - ✅ **Solution**: Updated constructor call to include proper flight and weather API clients with environment variable validation:
    ```typescript
    // Fixed implementation:
    const flightApiClients = [];
    if (process.env.FLIGHTAWARE_API_KEY) {
      flightApiClients.push(new FlightAwareClient(process.env.FLIGHTAWARE_API_KEY));
    }
    if (process.env.AVIATIONSTACK_API_KEY) {
      flightApiClients.push(new AviationStackClient(process.env.AVIATIONSTACK_API_KEY));
    }
    if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
      flightApiClients.push(new OpenSkyClient(process.env.OPENSKY_USERNAME, process.env.OPENSKY_PASSWORD));
    }

    const weatherApiClients = [];
    if (process.env.GOOGLE_WEATHER_API_KEY) {
      weatherApiClients.push(new GoogleWeatherClient(process.env.GOOGLE_WEATHER_API_KEY));
    }

    const dataRouter = new DataRouter({
      logger,
      flightApiClients,
      weatherApiClients,
    });
    ```
  - ✅ **Test**: API route compiles without TypeScript errors and all 27 packages build successfully

### **Task 2.2: Implement Quote Service Interface Alignment**
**Priority**: 🟠 **HIGH**
**Estimated Time**: 6 hours
**Dependencies**: Task 2.1

**Actions:**
- [ ] **Fix request/response type mismatch**
  - **Problem**: API provides `{ coverageTypes: string[], coverageAmounts: Record<string, number> }` but Service expects `{ coverageType: string, coverageAmount: number }`
  - **Interface Analysis** - API route expects:
    ```typescript
    generateQuote(request: {
      flightNumber: string;
      flightDate: string;
      originAirport: string;
      destinationAirport: string;
      coverageTypes: Array<"DELAY" | "CANCELLATION" | "BAGGAGE_LOSS" | "MEDICAL_EMERGENCY">;
      coverageAmounts: Record<string, number>;
      airports: string[];
      requestMetadata: object;
    }): Promise<{
      quoteId: string;
      validUntil: string;
      quotes: Array<{
        productName: string;
        coverageType: string;
        premium: number; // in cents
        coverageAmount: number; // in cents
        // ... other fields
      }>;
      // ... other response fields
    }>
    ```
  - **Solution**: Transform request to match service expectations in API route:
    ```typescript
    // In apps/api/src/routes/v1/insurance/quote.ts
    const quoteRequests = body.coverageTypes.map(coverageType => ({
      flightNumber: body.flightNumber,
      flightDate: body.flightDate,
      originAirport: body.originAirport,
      destinationAirport: body.destinationAirport,
      coverageType, // individual type
      coverageAmount: body.coverageAmounts[coverageType] || 50000,
      airports: body.airports,
      requestMetadata: body.requestMetadata
    }));

    // Process multiple quotes and combine results
    const quotes = await Promise.all(
      quoteRequests.map(req => quoteService.generateQuote(req))
    );
    ```

- [ ] **Complete QuoteService implementation** in `packages/services/quote-engine/src/quote-service.ts`
  - **Action**: Create `packages/services/quote-engine/src/types.ts` file to define all request/response interfaces that match API expectations
  - **Action**: Implement the core risk calculation and premium logic via specific private methods:
    ```typescript
    private calculateFlightRisk(flightData: CanonicalFlightData): number;
    private calculateWeatherRisk(weatherData: CanonicalWeatherObservation[]): number;
    private calculateCombinedRisk(flightRisk: number, weatherRisk: number): number;
    private calculatePremium(riskScore: number, coverageAmount: number, coverageType: string): number;
    private async saveQuote(quote: QuoteData): Promise<string>;
    private async validateQuoteRequest(request: InsuranceQuoteRequest): Promise<boolean>;
    ```
  - Add database integration for quote persistence
  - Implement `quotes` table operations (insert, select, expire)

- [ ] **Test quote generation flow**
  - Unit tests for risk calculation logic
  - Integration test: API → QuoteService → Database
  - Verify: Quote response matches expected interface

### **Task 2.3: Implement Policy Engine Integration**
**Priority**: 🟠 **HIGH**
**Estimated Time**: 5 hours
**Dependencies**: Task 2.2

**Actions:**
- [ ] **Complete PolicyEngine implementation** in `packages/services/policy-engine/src/policy-engine.ts`
  - **Interface Analysis** - API route expects:
    ```typescript
    createPolicyFromQuote(request: {
      quoteId: string;
      userId: string;
      buyerWalletAddress: string;
      buyerPrivateKey: string;
      chain: "PAYGO" | "ETHEREUM" | "BASE" | "SOLANA";
    }): Promise<{
      policyId: string;
      policyNumber: string;
      transactionHash: string;
      escrowId: string;
      message?: string;
    }>
    ```
  - **Action**: Implement the core logic for policy creation and management:
    ```typescript
    private async validateQuote(quoteId: string): Promise<QuoteRecord>;
    private async lockQuote(quoteId: string): Promise<boolean>;
    private async createPolicyRecord(quoteData: QuoteRecord, userId: string): Promise<PolicyRecord>;
    private generatePolicyNumber(): string;
    private async fundPolicyEscrow(policy: PolicyRecord, walletDetails: WalletInfo): Promise<EscrowResult>;
    ```
  - **Action**: Implement specific error classes for robust error handling:
    ```typescript
    class QuoteNotFoundError extends Error { /* ... */ }
    class QuoteExpiredError extends Error { /* ... */ }
    class QuoteAlreadyUsedError extends Error { /* ... */ }
    ```
  - Integrate with EscrowManager for payment processing

- [ ] **Fix API route** in `apps/api/src/routes/v1/policy/purchase.ts`
  - **Fix Service Initialization**:
    ```typescript
    // Ensure proper service injection and configuration
    const logger = new Logger(LogLevel.INFO, "PolicyPurchaseAPI");
    const blockchainRegistry = new BlockchainServiceRegistry();
    const escrowEngineFactory = new EscrowEngineFactory(blockchainRegistry);
    const escrowManager = new EscrowManager(escrowEngineFactory);
    const policyEngine = new PolicyEngine({
      escrowManager,
      database: db,
      logger
    });
    ```
  - Test: Policy purchase flow compiles and executes

---

## 📋 **PHASE 3: DATA AGGREGATION LAYER (MEDIUM PRIORITY)**

### **Task 3.1: Implement Core Aggregators**
**Priority**: 🟡 **MEDIUM**
**Estimated Time**: 8 hours
**Dependencies**: Task 2.1

**Actions:**
- [ ] **Complete FlightAggregator** in `packages/aggregators/flight-aggregator/src/aggregator.ts`
  - Implement CacheManager, ConflictResolver, SourceRouter classes
  - Add support for multiple flight data sources (FlightAware, OpenSky, AviationStack)
  - Implement canonical data transformation

- [ ] **Complete WeatherAggregator** in `packages/aggregators/weather-aggregator/src/aggregator.ts`
  - Implement WeatherDataCollector and WeatherRiskAnalyzer
  - Add Google Weather API integration
  - Implement weather risk scoring algorithms

- [ ] **Test aggregation layer**
  - Mock external API responses for testing
  - Verify canonical data format consistency
  - Test caching and fallback mechanisms

---

## 📋 **PHASE 4: PAYOUT ENGINE IMPLEMENTATION (MEDIUM PRIORITY)**

### **Task 4.1: Build Payout Engine Service**
**Priority**: 🟡 **MEDIUM**
**Estimated Time**: 6 hours
**Dependencies**: Task 2.3, Task 3.1

**Actions:**
- [ ] **Implement PayoutEngine** in `packages/services/payout-engine/src/payout-engine.ts`
  - **Action**: Break down `processTriggeredPayouts` into a clear workflow:
    ```typescript
    class PayoutEngine {
      async processTriggeredPayouts(policyIds: string[]): Promise<ProcessPayoutsResponse> {
        // 1. Fetch active policies with flight details
        const policies = await this.fetchPolicies(policyIds);

        // 2. Check each policy for trigger conditions
        const triggeredPolicies = await this.evaluateTriggerConditions(policies);

        // 3. Execute payouts for triggered policies
        const payoutResults = await this.executePayouts(triggeredPolicies);

        // 4. Update policy statuses
        await this.updatePolicyStatuses(triggeredPolicies);

        return this.formatPayoutResponse(payoutResults);
      }

      private async evaluateTriggerConditions(policies: PolicyRecord[]): Promise<TriggeredPolicy[]> {
        // Use DataRouter to get current flight status
        // Compare against policy conditions
        // Return policies that meet payout criteria
      }

      private async executePayouts(policies: TriggeredPolicy[]): Promise<PayoutResult[]> {
        // Use EscrowManager to release funds
        // Handle blockchain transaction execution
        // Record payout events
      }
    }
    ```

- [ ] **Create payout monitoring system**
  - **Action**: Create a new file `packages/services/payout-engine/src/monitor.ts`
  - **Action**: Implement a `PolicyMonitor` class:
    ```typescript
    class PolicyMonitor {
      async startMonitoring(): Promise<void> {
        // Set up scheduled checks for active policies
        // Monitor flight status changes
        // Trigger payout processing when conditions are met
      }
    }
    ```

- [ ] **Build payout API endpoint** in `apps/api/src/routes/v1/internal/payouts/process-triggered.ts`
  - **Action**: Create the API route handler:
    ```typescript
    export async function handleProcessTriggeredPayouts(request: Request): Promise<Response> {
      // Initialize PayoutEngine
      // Extract policy IDs from request
      // Execute payout processing
      // Return results
    }
    ```
  - Add comprehensive error handling

---

## 📋 **PHASE 5: CHAT & LLM INTEGRATION (LOW PRIORITY)**

### **Task 5.1: Implement LLM Interface Layer**
**Priority**: 🟢 **LOW**
**Estimated Time**: 4 hours
**Dependencies**: Task 2.2

**Actions:**
- [ ] **Build ILLMClient interface** in `packages/llm/llm-interface/src/interface.ts`
  - Define generic chat completion interface
  - Create standardized message and response types
  - Add error handling interfaces

- [ ] **Implement DeepSeek Adapter** in `packages/llm/deepseek-adapter/src/client.ts`
  - Build DeepSeekClient implementing ILLMClient
  - Add API authentication and request handling
  - Implement response transformation logic

### **Task 5.2: Build Chat Service Integration**
**Priority**: 🟢 **LOW**
**Estimated Time**: 5 hours
**Dependencies**: Task 5.1

**Actions:**
- [ ] **Complete ChatService** in `packages/services/chat-service/src/chat-service.ts`
  - **Action**: Implement the `processUserMessage` workflow:
    ```typescript
    export class ChatService {
      constructor(
        private llmClient: ILLMClient,
        private quoteEngine: QuoteService
      ) {}

      async processUserMessage(message: string, conversationId?: string): Promise<ChatResponse> {
        // 1. Extract flight entities from natural language
        const entities = await this.extractFlightEntities(message);

        // 2. If sufficient entities, generate quote
        if (this.hasRequiredEntities(entities)) {
          const quote = await this.quoteEngine.generateQuote(entities);
          return this.formatQuoteResponse(quote);
        }

        // 3. Otherwise, ask for clarification
        return this.askForClarification(entities);
      }
    }
    ```
  - Add entity extraction logic using LLM client
  - Integrate with QuoteService for quote generation

- [ ] **Update Chat API endpoints** in `apps/api/src/routes/v1/chat/message.ts`
  - Replace mock implementation with real ChatService
  - Add error handling for LLM service failures
  - Implement fallback to structured form

---

## 📋 **PHASE 6: TESTING & VALIDATION (CONTINUOUS)**

### **Task 6.1: Fix Existing Test Suites**
**Priority**: 🟡 **ONGOING**
**Estimated Time**: 3 hours per phase
**Dependencies**: Each phase completion

**Actions:**
- [ ] **Update Phase 2 tests** in `scripts/testPhase2Implementation.js`
  - **Action**: Fix module import paths to use the compiled `dist/` files:
    ```javascript
    // Fix import paths to use compiled dist/ files
    const { QuoteService } = require("../packages/services/quote-engine/dist/index.js");
    const { PolicyEngine } = require("../packages/services/policy-engine/dist/index.js");

    // Fix service initialization to match new constructor signatures
    const quoteService = new QuoteService({
      dataRouter: configuredDataRouter,
      database: db,
      logger: logger
    });
    ```
  - Verify quote and policy creation flows

- [ ] **Update API tests** in `scripts/testPhase2API.js`
  - **Action**: Update endpoint URLs and request/response formats to match the corrected API contracts
  - **Action**: Fix expected request/response formats
  - **Action**: Add proper error handling for new service structure
  - Add comprehensive error case testing

### **Task 6.2: Create Comprehensive Test Coverage**
**Priority**: 🟡 **ONGOING**
**Estimated Time**: 2 hours per service
**Dependencies**: Service implementations

**Actions:**
- [ ] **Unit tests for all services**
  - QuoteService: Risk calculation, premium calculation, database operations
  - PolicyEngine: Quote validation, policy creation, escrow integration
  - PayoutEngine: Condition evaluation, payout processing
  - Aggregators: Data fetching, caching, canonical transformation

- [ ] **Integration tests**
  - End-to-end user flows: Quote → Purchase → Payout
  - API endpoint testing with real database
  - Error handling and edge cases

---

## 📋 **PHASE 7: DEPLOYMENT PREPARATION (FINAL)**

### **Task 7.1: Production Readiness**
**Priority**: 🟢 **FINAL**
**Estimated Time**: 4 hours
**Dependencies**: All previous tasks

**Actions:**
- [ ] **Environment configuration**
  - Validate all required environment variables
  - Set up production database connections
  - Configure external API credentials

- [ ] **Performance optimization**
  - Add database query optimization
  - Implement proper caching strategies
  - Add monitoring and logging
  - **Action**: Add specific performance tests for API response times and concurrent user handling
  - **Action**: Profile database queries and API response times

- [ ] **Security review**
  - Audit API endpoints for security vulnerabilities
  - Validate input sanitization
  - Review secret management practices

- [ ] **Documentation Update**
  - **Action**: Update the `UNIFIED_PROJECT_ROADMAP.md` to mark all phases as complete
  - **Action**: Document any deviations from the original plan and add performance benchmarks
  - **Action**: Create a `DEPLOYMENT_GUIDE.md` with environment setup and configuration requirements

---

## 📊 **SUCCESS CRITERIA & VALIDATION**

### **Phase 1 Complete When:**
- [ ] `bun run build` completes without errors
- [ ] `tsc --noEmit` shows only implementation-related errors (not config/setup errors)
- [ ] All packages compile successfully

### **Phase 2 Complete When:**
- [ ] Quote API endpoint (`POST /api/v1/insurance/quote`) returns valid responses
- [ ] Policy purchase API endpoint (`POST /api/v1/policy/purchase`) completes transactions
- [ ] Database operations work correctly for quotes and policies

### **MVP Complete When:**
- [ ] User can request insurance quote through API
- [ ] User can purchase policy with crypto payment
- [ ] System automatically processes payouts for triggered policies
- [ ] Chat interface provides quote generation (Phase 5)
- [ ] All tests pass successfully

---

## 🔧 **DEVELOPMENT WORKFLOW**

### **Daily Progress Tracking:**
1. **Morning**: Run `tsc --noEmit` to assess current error count
2. **Work Session**: Focus on one task at a time, validate completion
3. **Evening**: Run full build and test suite, document progress

### **Validation Commands:**
```bash
# Check TypeScript errors
tsc --noEmit

# Build all packages
bun run build

# Run development server
bun dev

# Test specific functionality
bun run scripts/testPhase2Implementation.js
bun run scripts/testPhase2API.js
```

### **Emergency Rollback Plan:**
- All changes committed to git with descriptive messages
- Each task creates a separate commit for easy rollback
- Critical path items tested immediately after implementation

---

## 📈 **ESTIMATED TIMELINE**

**Total Estimated Time**: 50-55 hours of focused development

- **Phase 1** (Foundation): 5 hours - *CRITICAL - Must complete first*
- **Phase 1B** (Build Stabilization): 3 hours - *CRITICAL - Must complete first*
- **Phase 2** (Core Services): 19 hours - *HIGH PRIORITY*
- **Phase 3** (Data Layer): 8 hours - *MEDIUM PRIORITY*
- **Phase 4** (Payouts): 6 hours - *MEDIUM PRIORITY*
- **Phase 5** (Chat): 9 hours - *LOW PRIORITY*
- **Phase 6** (Testing): 8 hours - *CONTINUOUS*
- **Phase 7** (Production): 5 hours - *FINAL*

**Minimum Viable Product**: Phases 1-4 (41 hours)
**Full Featured Product**: All phases (55 hours)

This plan prioritizes getting a working foundation first, then builds upon it systematically to achieve a fully functional MVP.
