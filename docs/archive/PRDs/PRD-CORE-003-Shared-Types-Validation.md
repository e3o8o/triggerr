# PRD-CORE-003: Shared Types & Validation Schemas

**Status**: ✅ FOUNDATION COMPLETE - Enhancement in Progress  
**Priority**: Critical - Foundation Component  
**Dependencies**: PRD-CORE-001 (Database Schema) ✅ Complete  
**Last Updated**: 2025-01-27  

## 1. Overview

### 1.1 Purpose
The Shared Types & Validation Schemas package provides type-safe TypeScript definitions and runtime validation for the entire triggerr platform. Built on Drizzle ORM with comprehensive row-level security, it ensures type safety across all packages while supporting anonymous quote generation and authenticated user flows.

### 1.2 Current Implementation Status
- ✅ **Drizzle Types**: Complete generated types from schema
- ✅ **Escrow ID System**: Advanced ID generation with 14 escrow models
- ✅ **Security Types**: RLS-aware types for anonymous/authenticated access
- ✅ **Reference Data Types**: Complete types for seeded geographical data
- ✅ **Better-Auth Integration**: Session and authentication types
- 🔄 **API Validation**: Zod schemas for endpoints (in progress)
- 🔄 **Business Logic Types**: Quote engine and payout types (in progress)

### 1.3 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Drizzle       │    │   Shared Types   │    │  All Packages   │
│                 │────▶│                  │────▶│                 │
│ Database Schema │    │ TypeScript Types │    │ Type-Safe Code  │
│ RLS Policies    │    │ Zod Validation   │    │ Runtime Checks  │
│ Generated Types │    │ Security Context │    │ Access Control  │
│ 14 Escrow Models│    │ Escrow ID Gen    │    │ Business Logic  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 1.4 Design Principles
- **Type Safety**: Compile-time type checking with Drizzle-generated types
- **Security-Aware**: Types that understand RLS context (anon/auth/service)
- **Runtime Validation**: Zod schemas for API boundaries and user input
- **Escrow Flexibility**: Types supporting 14 different escrow models
- **Anonymous-First**: Types supporting public quote generation flow
- **Single Source of Truth**: All types derived from Drizzle schema

## 2. Database Entity Types

### 2.1 Core Drizzle Schema Types

```typescript
// packages/core/types/database.ts
// Generated and enhanced from Drizzle schema

import type { 
  User,
  Session,
  Account,
  Provider,
  ProviderProduct,
  Policy,
  Quote,
  Flight,
  Escrow,
  EscrowPool,
  EscrowPoolParticipant,
  Payout,
  PolicyEvent,
  PolicyVerificationCode,
  Revenue,
  RevenueSharingRule,
  Webhook,
  WebhookDelivery,
  ApiKey,
  
  // Reference Data Types (Seeded)
  Countries,
  Regions,
  Airline,
  Airport,
  Routes,
  AircraftTypes,
  Runways,
  
  // Historical Data Types
  HistoricalFlightSegments,
  HistoricalWeatherObservations,
  RawApiCallLogs,
  
  // System Types
  SystemConfiguration,
  ScheduledTask,
  TaskExecution,
  CacheEntry,
  AuditLog,
  FlightDataSource
} from '@triggerr/core/database/schema';

// Export enum types for runtime use
export {
  providerStatusEnum,
  providerCategoryEnum,
  providerTierEnum,
  productStatusEnum,
  productCategoryEnum,
  policyStatusEnum,
  coverageTypeEnum,
  flightStatusEnum,
  escrowModelEnum,
  escrowStatusEnum,
  escrowTypeEnum,
  escrowPurposeEnum,
  payoutStatusEnum,
  revenueTypeEnum,
  webhookEventTypeEnum,
  continentEnum,
  apiKeyTypeEnum
} from '@triggerr/core/database/schema';
```

### 2.2 Enhanced Entity Types with Business Logic

```typescript
// Enhanced User type with computed properties
export interface EnhancedUser extends User {
  displayName: string;
  hasWallet: boolean;
  activePoliciesCount: number;
  totalCoverage: number;
  isEmailVerified: boolean;
}

// Enhanced Provider with escrow model capabilities
export interface EnhancedProvider extends Provider {
  products?: ProviderProduct[];
  activePoliciesCount: number;
  totalRevenue: number;
  escrowPoolsCount: number;
  healthScore: number;
  canCreatePolicies: boolean;
  supportedEscrowModels: EscrowModelType[];
}

// Enhanced Policy with full relationship context
export interface EnhancedPolicy extends Policy {
  user: User;
  provider: EnhancedProvider;
  flight: EnhancedFlight;
  quote?: Quote;
  escrows: Escrow[]; // Multiple escrows possible per policy
  payouts: Payout[];
  events: PolicyEvent[];
  verificationCode?: PolicyVerificationCode;
  
  // Computed properties
  isActive: boolean;
  canPayout: boolean;
  delayMinutesThreshold: number;
  currentStatus: PolicyStatusDisplay;
  escrowModel: EscrowModelType;
  totalEscrowAmount: number;
}

// Enhanced Flight with real-time status
export interface EnhancedFlight extends Flight {
  airline?: Airline;
  departureAirport: Airport;
  arrivalAirport: Airport;
  aircraftType?: AircraftTypes;
  
  // Computed properties
  isDelayed: boolean;
  delayMinutes: number;
  isActive: boolean;
  canTriggerPayout: boolean;
  statusDisplay: string;
  estimatedArrival?: Date;
  route?: Routes;
}

// Enhanced Quote with validation context
export interface EnhancedQuote extends Quote {
  provider: Provider;
  flight: EnhancedFlight;
  user?: User; // Nullable for anonymous quotes
  
  // Computed properties
  isValid: boolean;
  isExpired: boolean;
  canPurchase: boolean;
  riskScore: number;
  escrowModelRequired: EscrowModelType;
}
```

### 2.3 Escrow System Types

```typescript
// Escrow ID Generator Types (from packages/core/utils/escrow-id-generator.ts)
export interface EscrowIdComponents {
  escrowType: 'POLICY' | 'USER_WALLET';
  entityId: string; // Policy ID or User ID
  purpose?: EscrowPurpose;
  timestamp: number;
  randomComponent: string;
  checksum: string;
}

export interface ParsedEscrowId {
  internalId: string;
  components: EscrowIdComponents;
  isValid: boolean;
  errorMessage?: string;
}

// 14 Escrow Model Configurations
export interface EscrowModelConfiguration {
  modelType: EscrowModelType;
  requiresCollateral: boolean;
  collateralRatio?: number;
  requiresPool: boolean;
  poolConfiguration?: EscrowPoolConfiguration;
  premiumReturnPolicy: PremiumReturnPolicy;
  supportedPurposes: EscrowPurpose[];
  minimumAmount: number;
  maximumAmount?: number;
  timeoutHours: number;
}

export interface EscrowPoolConfiguration {
  poolType: 'PROVIDER' | 'PEER_TO_PEER' | 'DAO_GOVERNED';
  minimumParticipants?: number;
  maximumParticipants?: number;
  rebalanceFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  governanceModel?: 'TOKEN' | 'STAKE' | 'VOTE';
}

// Enhanced Escrow with full context
export interface EnhancedEscrow extends Escrow {
  user?: User;
  policy?: Policy;
  provider?: Provider;
  pool?: EscrowPool;
  
  // Computed properties
  isExpired: boolean;
  canRelease: boolean;
  modelConfiguration: EscrowModelConfiguration;
  blockchainStatus: 'PENDING' | 'CONFIRMED' | 'FAILED';
}
```

## 3. Security Context Types

### 3.1 Row Level Security Context

```typescript
// Security context for RLS-aware operations
export interface SecurityContext {
  role: 'anon' | 'authenticated' | 'service_role';
  userId?: string;
  providerId?: string;
  permissions: Permission[];
  canAccessTable: (tableName: string) => boolean;
  canPerformAction: (action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE', table: string) => boolean;
}

export interface Permission {
  table: string;
  actions: ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[];
  conditions?: Record<string, any>;
}

// Anonymous access types
export interface AnonymousSession {
  role: 'anon';
  ipAddress: string;
  userAgent: string;
  canSearchFlights: true;
  canGenerateQuotes: true;
  canPurchasePolicies: false;
}

// Authenticated session types (Better-auth integration)
export interface AuthenticatedSession extends Session {
  user: User;
  role: 'authenticated';
  permissions: Permission[];
  escrowCapabilities: EscrowModelType[];
}
```

### 3.2 API Access Types

```typescript
// Public API types (anonymous access)
export interface PublicFlightSearch {
  origin: string; // IATA code
  destination: string; // IATA code
  departureDate: string; // ISO date
  returnDate?: string;
  passengers?: number;
}

export interface PublicQuoteRequest {
  flightId: string;
  coverageType: CoverageType;
  coverageAmount: number;
  providerId?: string; // Optional provider preference
  userPreferences?: {
    escrowModel?: EscrowModelType;
    maxPremium?: number;
  };
}

// Authenticated API types
export interface AuthenticatedPolicyPurchase {
  quoteId: string;
  userConfirmation: boolean;
  paymentMethod: PaymentMethod;
  escrowPreferences?: EscrowPreferences;
}

export interface EscrowPreferences {
  preferredModel: EscrowModelType;
  poolParticipation?: boolean;
  stakingPreferences?: StakingPreferences;
}
```

## 4. Reference Data Types (Seeded)

### 4.1 Geographic Data Types

```typescript
// Complete geographic hierarchy (seeded with real data)
export interface EnhancedCountry extends Countries {
  regions: Regions[];
  airlines: Airline[];
  airports: Airport[];
  totalFlights: number;
  insuranceAvailable: boolean;
}

export interface EnhancedRegion extends Regions {
  country: Countries;
  airports: Airport[];
  majorCities: string[];
}

export interface EnhancedAirline extends Airline {
  country?: Countries;
  routes: Routes[];
  aircraftFleet: AircraftTypes[];
  partneredProviders: Provider[];
  averageDelayMinutes: number;
  reliabilityScore: number;
}

export interface EnhancedAirport extends Airport {
  country: Countries;
  region?: Regions;
  runways: Runways[];
  airlines: Airline[];
  departingRoutes: Routes[];
  arrivingRoutes: Routes[];
  weatherData?: HistoricalWeatherObservations[];
  
  // Computed properties
  timezoneOffset: number;
  localTime: Date;
  averageDelayMinutes: number;
  insuranceDemand: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

### 4.2 Route and Flight Data Types

```typescript
export interface EnhancedRoute extends Routes {
  airline?: Airline;
  sourceAirport: Airport;
  destinationAirport: Airport;
  aircraftTypes: AircraftTypes[];
  
  // Computed from historical data
  averageFlightTime: number;
  averageDelayMinutes: number;
  cancellationRate: number;
  seasonalPatterns: SeasonalPattern[];
  riskScore: number;
  insuranceBasePremium: number;
}

export interface SeasonalPattern {
  season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';
  averageDelay: number;
  cancellationRate: number;
  weatherImpact: number;
}

export interface FlightRiskAssessment {
  route: EnhancedRoute;
  weather: WeatherRisk;
  airline: AirlineRisk;
  seasonal: SeasonalRisk;
  overall: RiskScore;
}

export interface RiskScore {
  score: number; // 0-100
  category: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  factors: RiskFactor[];
}
```

## 5. Validation Schemas (Zod)

### 5.1 Core Validation Schemas

```typescript
// packages/core/types/validation.ts
import { z } from 'zod';

// Flight search validation (anonymous)
export const FlightSearchSchema = z.object({
  origin: z.string().length(3, 'Origin must be 3-letter IATA code').toUpperCase(),
  destination: z.string().length(3, 'Destination must be 3-letter IATA code').toUpperCase(),
  departureDate: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  returnDate: z.string().optional(),
  passengers: z.number().int().min(1).max(9).default(1),
}).refine(data => data.origin !== data.destination, 'Origin and destination must be different');

// Quote generation validation (anonymous)
export const QuoteRequestSchema = z.object({
  flightId: z.string().uuid('Invalid flight ID'),
  coverageType: z.enum(['DELAY_60', 'DELAY_120', 'CANCELLATION', 'BAGGAGE', 'COMPREHENSIVE']),
  coverageAmount: z.number().positive().max(10000, 'Maximum coverage is $10,000'),
  providerId: z.string().uuid().optional(),
  escrowModel: z.enum([
    'SINGLE_SIDED', 'DUAL_SIDED', 'COMBINED', 'HYBRID_PARTIAL_COLLATERAL',
    'COLLATERALIZED_PROVIDER_POOL', 'BONDED_LIABILITY_POOL', 'PEER_TO_PEER_POOL', 
    'SUBSCRIPTION_BASED_POOL', 'DYNAMIC_RISK_POOL', 'PREDICTION_MARKET',
    'SYNTHETIC_DEFI_COVERAGE', 'NFT_POLICY', 'DAO_GOVERNED_POOL', 'MULTI_ORACLE_VERIFIED'
  ]).optional(),
});

// Policy purchase validation (authenticated)
export const PolicyPurchaseSchema = z.object({
  quoteId: z.string().uuid('Invalid quote ID'),
  userConfirmation: z.boolean().refine(val => val === true, 'User confirmation required'),
  escrowPreferences: z.object({
    preferredModel: z.enum([/* all escrow models */]).optional(),
    poolParticipation: z.boolean().default(false),
    maxCollateralRatio: z.number().min(0).max(2).optional(),
  }).optional(),
});
```

### 5.2 User Input Validation

```typescript
// User registration/update validation
export const UserUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address').optional(),
  preferences: z.object({
    defaultCoverageType: z.enum(['DELAY_60', 'DELAY_120', 'CANCELLATION', 'COMPREHENSIVE']).optional(),
    defaultEscrowModel: z.enum([/* all escrow models */]).optional(),
    notifications: z.object({
      email: z.boolean().default(true),
      webhook: z.boolean().default(false),
    }).optional(),
  }).optional(),
});

// Provider onboarding validation
export const ProviderOnboardingSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.enum(['FLIGHT_DELAY', 'WEATHER', 'TRAVEL', 'CARGO', 'FINANCIAL_SERVICES']),
  businessAddress: z.string().min(10).max(500),
  businessRegistrationNumber: z.string().min(5).max(50),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  escrowModel: z.enum([/* all 14 escrow models */]),
  collateralRequirement: z.number().min(0).max(1000000).optional(),
  tier: z.enum(['STARTUP', 'STANDARD', 'PREMIUM', 'ENTERPRISE']).default('STANDARD'),
});
```

### 5.3 Escrow Validation Schemas

```typescript
// Escrow creation validation
export const EscrowCreateSchema = z.object({
  escrowType: z.enum(['POLICY', 'USER_WALLET']),
  amount: z.number().positive().max(1000000),
  purpose: z.enum(['DEPOSIT', 'WITHDRAW', 'STAKE', 'BOND', 'COLLATERAL', 'INVESTMENT', 'RESERVE', 'POOL', 'CUSTOM']).optional(),
  escrowModel: z.enum([/* all 14 models */]),
  expirationHours: z.number().int().min(1).max(8760), // 1 hour to 1 year
  configuration: z.record(z.any()).optional(),
}).refine(data => {
  // Validate purpose is provided for USER_WALLET type
  if (data.escrowType === 'USER_WALLET') {
    return data.purpose !== undefined;
  }
  return true;
}, 'Purpose required for USER_WALLET escrow type');

// Escrow pool participation validation
export const EscrowPoolParticipationSchema = z.object({
  poolId: z.string().uuid(),
  contributionAmount: z.number().positive(),
  riskTolerance: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  lockupPeriod: z.number().int().min(1).max(365), // Days
  preferredCategories: z.array(z.enum(['FLIGHT_DELAY', 'WEATHER', 'TRAVEL'])).optional(),
});
```

## 6. API Response Types

### 6.1 Public API Responses

```typescript
// Flight search response (anonymous)
export interface FlightSearchResponse {
  flights: PublicFlightInfo[];
  totalCount: number;
  searchMetadata: {
    origin: Airport;
    destination: Airport;
    route?: Routes;
    searchTime: string;
    dataFreshness: string;
  };
}

export interface PublicFlightInfo {
  id: string;
  flightNumber: string;
  airline: {
    name: string;
    iataCode: string;
    logoUrl?: string;
  };
  departure: {
    airport: PublicAirportInfo;
    scheduled: string;
    estimated?: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: PublicAirportInfo;
    scheduled: string;
    estimated?: string;
    terminal?: string;
    gate?: string;
  };
  status: FlightStatus;
  delayMinutes: number;
  aircraftType?: string;
  availableInsurance: InsuranceAvailability[];
}

export interface InsuranceAvailability {
  providerId: string;
  providerName: string;
  coverageTypes: CoverageType[];
  basePrice: number;
  escrowModelsSupported: EscrowModelType[];
  canQuote: boolean;
}
```

### 6.2 Quote Response Types

```typescript
// Quote response (anonymous)
export interface QuoteResponse {
  quote: PublicQuoteInfo;
  provider: PublicProviderInfo;
  flight: PublicFlightInfo;
  riskAssessment: PublicRiskAssessment;
  nextSteps: QuoteNextSteps;
}

export interface PublicQuoteInfo {
  id: string;
  coverageType: CoverageType;
  coverageAmount: number;
  premium: number;
  validUntil: string;
  confidence: number;
  escrowModel: EscrowModelType;
  escrowRequirements: EscrowRequirements;
}

export interface EscrowRequirements {
  userPremium: number;
  providerCollateral?: number;
  poolParticipation?: boolean;
  estimatedGasFees: number;
  totalUserCost: number;
}

export interface QuoteNextSteps {
  requiresAuthentication: boolean;
  authenticationUrl?: string;
  directPurchaseAvailable: boolean;
  estimatedProcessingTime: string;
}
```

## 7. Error Types and Handling

### 7.1 Typed Error Responses

```typescript
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  fieldErrors: {
    field: string;
    message: string;
    code: string;
  }[];
}

export interface AuthenticationError extends ApiError {
  code: 'AUTHENTICATION_REQUIRED' | 'INVALID_TOKEN' | 'SESSION_EXPIRED';
  authenticationUrl?: string;
  requiredPermissions?: string[];
}

export interface EscrowError extends ApiError {
  code: 'INSUFFICIENT_FUNDS' | 'ESCROW_EXPIRED' | 'UNSUPPORTED_MODEL' | 'BLOCKCHAIN_ERROR';
  escrowId?: string;
  blockchainDetails?: {
    network: string;
    txHash?: string;
    gasUsed?: number;
  };
}
```

## 8. Integration Types

### 8.1 Better-Auth Integration

```typescript
// Better-auth session types
export interface BetterAuthSession {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    emailVerified: boolean;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

// Better-auth middleware context
export interface AuthMiddlewareContext {
  session?: BetterAuthSession;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  canAccessResource: (resource: string) => boolean;
  requiredPermissions: string[];
}
```

### 8.2 External API Integration Types

```typescript
// Flight data source types
export interface FlightDataSourceConfig {
  name: string;
  type: 'AVIATIONSTACK' | 'FLIGHTAWARE' | 'OPENSKY';
  priority: number;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  rateLimit: number;
  costPerRequest: number;
  supportsRealTime: boolean;
  supportsHistorical: boolean;
}

// Aggregated flight data
export interface CanonicalFlightData {
  flightId: string;
  sources: FlightDataContribution[];
  confidence: number;
  lastUpdated: string;
  data: EnhancedFlight;
}

export interface FlightDataContribution {
  source: string;
  timestamp: string;
  confidence: number;
  fields: string[];
}
```

## 9. Implementation Status

### 9.1 Completed (✅)
- Core Drizzle-generated types exported and available
- Escrow ID generator types with 14 model support
- Basic security context types for RLS
- Reference data types matching seeded data structure
- Basic validation schemas for core entities

### 9.2 In Progress (🔄)
- Complete API request/response type definitions
- Advanced Zod validation schemas for all endpoints
- Better-auth integration type refinements
- Business logic type enhancements
- Error handling type system

### 9.3 Next Steps (❌)
- Complete validation schema implementation
- API contract enforcement
- Runtime type checking middleware
- Performance optimization for type checking
- Documentation generation from types

## 10. Usage Examples

### 10.1 Type-Safe Flight Search

```typescript
import { FlightSearchSchema, type FlightSearchResponse } from '@triggerr/core/types';

// Validate input
const searchParams = FlightSearchSchema.parse({
  origin: 'JFK',
  destination: 'LAX',
  departureDate: '2024-03-15',
  passengers: 2
});

// Type-safe API call
const response: FlightSearchResponse = await api.searchFlights(searchParams);
```

### 10.2 Anonymous Quote Generation

```typescript
import { QuoteRequestSchema, type QuoteResponse } from '@triggerr/core/types';

// Anonymous quote request
const quoteRequest = QuoteRequestSchema.parse({
  flightId: 'flight-uuid',
  coverageType: 'DELAY_120',
  coverageAmount: 500,
  escrowModel: 'SINGLE_SIDED'
});

const quote: QuoteResponse = await api.generateQuote(quoteRequest);
```

---

**Implementation Notes:**
- All types are derived from the current Drizzle schema implementation
- Security context types support the implemented RLS policies
- Escrow types support all 14 implemented escrow models
- Reference data types match the comprehensive seeded data structure
- Anonymous access patterns are fully supported in type definitions