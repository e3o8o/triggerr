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

### **Task 1.1: Fix Build System Configuration**
**Priority**: 🔴 **BLOCKER**  
**Estimated Time**: 2 hours  
**Dependencies**: None  

**Actions:**
- [ ] **Fix Turbo workspace configuration**
  - Identify and fix malformed package.json causing line 65 error
  - Verify all workspace packages have proper `name` fields
  - Test: `bun run build` should not show workspace resolution errors

- [ ] **Fix Root TypeScript Configuration & Workspace Resolution**
  - Update root `tsconfig.json` with:
    - `"target": "ES2022"` to fix BigInt literal errors
    - `"module": "ESNext"` to support top-level await
    - `"moduleResolution": "bundler"` for better workspace resolution
    - `"esModuleInterop": true` globally
  - Add path mapping to root `tsconfig.json`: `"paths": { "@triggerr/*": ["./packages/*", "./apps/*"] }`
  - Fix `packages/services/quote-engine/tsconfig.json` - remove overly aggressive exclude patterns
  - Fix `packages/services/policy-engine/tsconfig.json` - ensure consistent with other services  
  - Update exclude patterns to: `["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]`
  - **Action**: In each package's `package.json`, ensure the `exports` and `types` fields are present and correct to support module resolution
  - **Action**: Create `scripts/validate-build.ts` to programmatically build packages in the correct dependency order and validate their exports
  - Test: `tsc --noEmit` should show fewer config-related errors

### **Task 1.2: Resolve Drizzle ORM Version Conflicts**
**Priority**: 🔴 **BLOCKER**  
**Estimated Time**: 3 hours  
**Dependencies**: Task 1.1  

**Actions:**
- [ ] **Audit Drizzle dependencies across all packages**
  - Run: `bun list | grep drizzle` to identify version mismatches
  - Ensure all packages use same drizzle-orm version
  - Update package.json files to use consistent versions

- [ ] **Fix SQL type conflicts in affected files:**
  - `packages/integrations/stripe-adapter/src/webhook-handler.ts` (lines 83, 114)
  - `scripts/apply-new-migration.ts` (lines 19, 30, 45, 50, 61, 69)
  - `scripts/check-schema.ts` (lines 21, 35)
  - Replace incompatible `sql` template usage with compatible alternatives

- [ ] **Test database connection and queries**
  - Verify: All database operations compile without type errors
  - Test: Basic CRUD operations work in development environment

---

## 📋 **PHASE 1B: BUILD SYSTEM STABILIZATION & VALIDATION**

### **Task 1.3: Fix Turbo Configuration & Validate Build Chain**
**Priority**: 🔴 **BLOCKER**  
**Estimated Time**: 3 hours  
**Dependencies**: Task 1.1  

**Actions:**
- [ ] **Fix `turbo.json` Configuration**
  - Ensure the file has the correct schema and task dependencies.
  - **Example `turbo.json`**:
    ```json
    {
      "$schema": "https://turbo.build/schema.json",
      "globalDependencies": ["bun.lockb"],
      "globalEnv": ["NODE_ENV", "DATABASE_URL"],
      "tasks": {
        "dev": {
          "cache": false,
          "persistent": true,
          "dependsOn": ["^build"]
        },
        "build": {
          "dependsOn": ["^build"],
          "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
        }
      },
      "ui": "tui"
    }
    ```
- [ ] **Validate Full Build Process**
  - **Run build commands in dependency order**:
    ```bash
    # Build packages in dependency order to ensure proper type generation
    1. packages/shared (contains canonical models)
    2. packages/core (contains utilities and database)
    3. packages/blockchain/* (interface, adapter, registry)
    4. packages/aggregators/* (data layer)
    5. packages/integrations/* (external API adapters)
    6. packages/services/* (business logic)
    ```
  - **Validation commands**:
    ```bash
    bun run clean
    bun run build
    bun tsc --noEmit
    ```
  - **Verify compiled output**: `find packages -name "dist" -type d | wc -l` should match the number of packages
- [ ] **Test Development Server**
  - Run `bun dev` and ensure the API and web app start without errors
  - Both web app and API should be accessible

---

## 📋 **PHASE 2: SERVICE IMPLEMENTATION & INTEGRATION (HIGH PRIORITY)**

### **Task 2.1: Fix DataRouter Integration**
**Priority**: 🟠 **HIGH**  
**Estimated Time**: 4 hours  
**Dependencies**: Task 1.2  

**Actions:**
- [ ] **Modify DataRouter constructor** in `packages/aggregators/data-router/src/router.ts`
  - **Current Issue**: API expects `new DataRouter(logger)` but constructor requires `(flightAggregator, weatherAggregator, config?)`
  - **Solution**: Change to factory pattern that encapsulates dependency instantiation
  - **Example Implementation**:
    ```typescript
    constructor(config: {
      logger: Logger;
      flightApiClients?: IFlightApiClient[];
      weatherApiClients?: IWeatherApiClient[];
    }) {
      this.logger = config.logger;
      // Initialize aggregators internally using provided clients
      this.flightAggregator = new FlightAggregator(config.flightApiClients || []);
      this.weatherAggregator = new WeatherAggregator(config.weatherApiClients || []);
    }
    ```

- [ ] **Update API route** in `apps/api/src/routes/v1/insurance/quote.ts`
  - **Fix DataRouter instantiation**:
    ```typescript
    // Current (broken):
    const dataRouter = new DataRouter(logger);

    // Fixed:
    const dataRouter = new DataRouter({
      logger,
      flightApiClients: [
        new FlightAwareClient(process.env.FLIGHTAWARE_API_KEY),
        new AviationStackClient(process.env.AVIATIONSTACK_API_KEY),
        new OpenSkyClient(process.env.OPENSKY_USERNAME, process.env.OPENSKY_PASSWORD)
      ],
      weatherApiClients: [
        new GoogleWeatherClient(process.env.GOOGLE_WEATHER_API_KEY)
      ]
    });
    ```
  - Test: API route compiles without TypeScript errors

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