# PRD-CORE-001: Database Schema & Data Models

**Status**: ✅ IMPLEMENTED & SEEDED  
**Priority**: Critical - Foundation Complete  
**Dependencies**: None (foundational)  
**Last Updated**: 2025-01-27  

## 1. Overview

### 1.1 Purpose
The Database Schema defines the complete, implemented data model for the triggerr parametric insurance marketplace. This schema supports API-first architecture, multi-provider marketplace functionality, comprehensive audit trails, and 14 different escrow models for flexible insurance product offerings.

### 1.2 Current Implementation Status
- ✅ **Schema**: Complete Drizzle ORM implementation with PostgreSQL
- ✅ **Row Level Security**: Comprehensive RLS policies supporting anonymous quote generation
- ✅ **Reference Data**: Fully seeded with ~249 countries, ~3,929 regions, ~5,731 airlines, ~9,079 airports, ~10,115 runways, 64,100+ routes
- ✅ **Application Data**: Seeded with providers, products, and data sources
- ✅ **Security Model**: Anonymous access for flight search and quotes, authentication required for purchases

### 1.3 Design Principles
- **API-First**: Schema designed to support REST API patterns with public access
- **Extensible**: Ready for multi-provider marketplace expansion with 14 escrow models
- **Auditable**: Complete event tracking and policy lifecycle management
- **Performance**: Optimized indexes for common query patterns
- **Security**: Field-level encryption + comprehensive RLS policies
- **Anonymous-Friendly**: Public flight search and quote generation

### 1.4 Technology Stack
- **Database**: PostgreSQL 15+ (Supabase)
- **ORM**: Drizzle ORM with TypeScript
- **Migration**: Drizzle Kit migrations
- **Security**: Row Level Security (RLS) + field-level encryption
- **Seeding**: Comprehensive reference data population completed

## 2. Security Model & Row Level Security

### 2.1 Access Levels
```sql
-- ANONYMOUS ACCESS (unauthenticated users):
-- - Can search flights and view flight data
-- - Can view all reference data (countries, regions, airlines, airports, etc.)
-- - Can view provider information and products
-- - Quote generation handled through API endpoints (service role)

-- AUTHENTICATED ACCESS (logged-in users):
-- - All anonymous permissions plus:
-- - Can manage their own quotes, policies, and related data
-- - Can access their financial records and escrow information

-- SERVICE ROLE:
-- - Full access to all data for backend operations
-- - Handles quote generation for anonymous users
-- - Manages system configuration and maintenance
```

### 2.2 Public Tables (Anonymous Read Access)
- Reference Data: `countries`, `regions`, `airline`, `airport`, `aircraft_types`, `runways`, `routes`
- Business Data: `provider`, `provider_product`, `flight`
- Quote generation handled via API endpoints using service role

### 2.3 Protected Tables (Authentication Required)
- User Data: `user`, `session`, `account`, `verification`
- Insurance Business: `policy`, `payout`, `policy_event`
- Financial: `escrow`, `revenue`, `escrow_pool`

## 3. Schema Structure

### 3.1 Core Enums

```typescript
// Geographic & General
export const continentEnum = pgEnum("continent_enum", ["AF", "AN", "AS", "EU", "NA", "OC", "SA"]);
export const apiKeyTypeEnum = pgEnum("api_key_type", ["PUBLIC", "SECRET", "WEBHOOK"]);

// Provider & Product Management
export const providerStatusEnum = pgEnum("provider_status", ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"]);
export const providerCategoryEnum = pgEnum("provider_category", [
  "FLIGHT_DELAY", "WEATHER", "TRAVEL", "CARGO", "FINANCIAL_SERVICES"
]);
export const providerTierEnum = pgEnum("provider_tier_enum", ["STARTUP", "STANDARD", "PREMIUM", "ENTERPRISE"]);
export const productStatusEnum = pgEnum("product_status_enum", [
  "DRAFT", "PENDING_APPROVAL", "PUBLISHED", "SUSPENDED", "ARCHIVED"
]);
export const productCategoryEnum = pgEnum("product_category_enum", [
  "FLIGHT_PARAMETRIC", "TRAVEL_COMPREHENSIVE", "GADGET_INSURANCE", 
  "WEATHER_PARAMETRIC", "EVENT_CANCELLATION", "SHIPPING_CARGO", 
  "CUSTOM_PARAMETRIC", "GENERAL_INSURANCE"
]);

// Insurance Business Logic
export const policyStatusEnum = pgEnum("policy_status", ["PENDING", "ACTIVE", "EXPIRED", "CLAIMED", "CANCELLED"]);
export const coverageTypeEnum = pgEnum("coverage_type", ["DELAY_60", "DELAY_120", "CANCELLATION", "BAGGAGE", "COMPREHENSIVE", "CUSTOM"]);
export const flightStatusEnum = pgEnum("flight_status", ["SCHEDULED", "ACTIVE", "LANDED", "CANCELLED", "DIVERTED", "DELAYED"]);

// Escrow & Financial (14 Models)
export const escrowModelEnum = pgEnum("escrow_model_type", [
  // Basic Models
  "SINGLE_SIDED", "DUAL_SIDED", "COMBINED", "HYBRID_PARTIAL_COLLATERAL",
  // Pooled Models  
  "COLLATERALIZED_PROVIDER_POOL", "BONDED_LIABILITY_POOL", "PEER_TO_PEER_POOL", "SUBSCRIPTION_BASED_POOL",
  // Advanced Models
  "DYNAMIC_RISK_POOL", "PREDICTION_MARKET", "SYNTHETIC_DEFI_COVERAGE", 
  "NFT_POLICY", "DAO_GOVERNED_POOL", "MULTI_ORACLE_VERIFIED"
]);

export const escrowStatusEnum = pgEnum("escrow_status", ["PENDING", "FULFILLED", "RELEASED", "EXPIRED", "CANCELLED"]);
export const payoutStatusEnum = pgEnum("payout_status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]);
export const escrowTypeEnum = pgEnum("escrow_type_enum", ["POLICY", "USER_WALLET"]);
export const escrowPurposeEnum = pgEnum("escrow_purpose_enum", [
  "DEPOSIT", "WITHDRAW", "STAKE", "BOND", "COLLATERAL", "INVESTMENT", "RESERVE", "POOL", "CUSTOM"
]);
```

### 3.2 User Management (Better-Auth Compatible)

```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  walletAddress: text("wallet_address").unique(), // Encrypted
  walletPrivateKey: text("wallet_private_key"), // Encrypted
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  // ... additional session fields
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  // ... OAuth provider fields
});
```

### 3.3 Provider Management (Marketplace Architecture)

```typescript
export const provider = pgTable("provider", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: providerCategoryEnum("category").notNull(),
  status: providerStatusEnum("status").notNull().default("PENDING"),
  tier: providerTierEnum("tier").notNull().default("STANDARD"),
  
  // Wallet & Business Details
  walletAddress: text("wallet_address").notNull().unique(), // Encrypted
  businessAddress: text("business_address"),
  businessRegistrationNumber: text("business_registration_number"),
  
  // Escrow Model Configuration
  escrowModel: escrowModelEnum("escrow_model").notNull().default("SINGLE_SIDED"),
  premiumReturnPolicy: premiumReturnPolicyEnum("premium_return_policy").notNull().default("PROVIDER_KEEPS_PREMIUM"),
  collateralRequirement: decimal("collateral_requirement", { precision: 15, scale: 2 }).default("0.00"),
  poolAddress: text("pool_address"), // For pooled models
  escrowConfiguration: jsonb("escrow_configuration"), // Model-specific configuration
  
  // ... additional provider fields
});

export const providerProduct = pgTable("provider_product", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => provider.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  coverageType: coverageTypeEnum("coverage_type").notNull(),
  baseRate: decimal("base_rate", { precision: 10, scale: 6 }).notNull(),
  maxCoverage: decimal("max_coverage", { precision: 15, scale: 2 }).notNull(),
  status: productStatusEnum("status").notNull().default("DRAFT"),
  // ... additional product fields
});
```

### 3.4 Reference Data Tables (Fully Seeded)

```typescript
// Countries (~249 records seeded)
export const countries = pgTable("countries", {
  isoCode: char("iso_code", { length: 2 }).primaryKey(),
  name: text("name").notNull(),
  isoAlpha3Code: char("iso_alpha3_code", { length: 3 }),
  continent: continentEnum("continent"),
});

// Regions (~3,929 records seeded)
export const regions = pgTable("regions", {
  code: text("code").primaryKey(),
  localCode: text("local_code"),
  name: text("name").notNull(),
  continent: continentEnum("continent"),
  countryIsoCode: char("country_iso_code", { length: 2 }).references(() => countries.isoCode).notNull(),
});

// Airlines (~5,731 records seeded)
export const airline = pgTable("airline", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  iataCode: char("iata_code", { length: 2 }),
  icaoCode: char("icao_code", { length: 3 }),
  countryIsoCode: char("country_iso_code", { length: 2 }).references(() => countries.isoCode),
  // ... additional airline fields
});

// Airports (~9,079 records seeded with timezone support)
export const airport = pgTable("airport", {
  iataCode: char("iata_code", { length: 3 }).primaryKey(),
  icaoCode: char("icao_code", { length: 4 }),
  name: text("name").notNull(),
  countryIsoCode: char("country_iso_code", { length: 2 }).references(() => countries.isoCode).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  timezoneOlson: text("timezone_olson"), // Enhanced timezone support
  // ... additional airport fields
});

// Routes (64,100+ records seeded)
export const routes = pgTable("routes", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  airlineIcaoCode: char("airline_icao_code", { length: 3 }).references(() => airline.icaoCode),
  sourceAirportIataCode: char("source_airport_iata_code", { length: 3 }).notNull().references(() => airport.iataCode),
  destinationAirportIataCode: char("destination_airport_iata_code", { length: 3 }).notNull().references(() => airport.iataCode),
  equipment: text("equipment"), // Aircraft types for this route
  // ... additional route fields
});
```

### 3.5 Flight Data Management

```typescript
export const flight = pgTable("flight", {
  id: text("id").primaryKey(),
  flightNumber: text("flight_number").notNull(),
  airlineIcaoCode: char("airline_icao_code", { length: 3 }).references(() => airline.icaoCode),
  departureAirportIataCode: char("departure_airport_iata_code", { length: 3 }).notNull().references(() => airport.iataCode),
  arrivalAirportIataCode: char("arrival_airport_iata_code", { length: 3 }).notNull().references(() => airport.iataCode),
  departureScheduledAt: timestamp("departure_scheduled_at", { withTimezone: true }).notNull(),
  arrivalScheduledAt: timestamp("arrival_scheduled_at", { withTimezone: true }).notNull(),
  status: flightStatusEnum("status").notNull().default("SCHEDULED"),
  delayMinutes: integer("delay_minutes").default(0),
  sourceData: jsonb("source_data"), // Aggregated flight data from multiple APIs
  // ... additional flight tracking fields
});
```

### 3.6 Insurance Business Logic

```typescript
export const quote = pgTable("quote", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }), // Nullable for anonymous quotes
  providerId: text("provider_id").notNull().references(() => provider.id),
  flightId: text("flight_id").notNull().references(() => flight.id),
  coverageType: coverageTypeEnum("coverage_type").notNull(),
  coverageAmount: decimal("coverage_amount", { precision: 15, scale: 2 }).notNull(),
  premium: decimal("premium", { precision: 15, scale: 6 }).notNull(),
  validUntil: timestamp("valid_until").notNull(),
  ipAddress: text("ip_address"), // For anonymous quote tracking
  // ... additional quote fields
});

export const policy = pgTable("policy", {
  id: text("id").primaryKey(),
  policyNumber: text("policy_number").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull().references(() => provider.id),
  flightId: text("flight_id").notNull().references(() => flight.id),
  quoteId: text("quote_id").references(() => quote.id),
  status: policyStatusEnum("status").notNull().default("PENDING"),
  coverageAmount: decimal("coverage_amount", { precision: 15, scale: 2 }).notNull(),
  premium: decimal("premium", { precision: 15, scale: 6 }).notNull(),
  payoutAmount: decimal("payout_amount", { precision: 15, scale: 2 }).notNull(),
  delayThreshold: integer("delay_threshold").notNull().default(60),
  expiresAt: timestamp("expires_at").notNull(),
  // ... additional policy fields
});
```

### 3.7 Enhanced Escrow System (14 Models)

```typescript
export const escrow = pgTable("escrow", {
  id: text("id").primaryKey(),
  internalId: text("internal_id").notNull(), // Generated by escrow-id-generator
  blockchainId: text("blockchain_id"), // PayGo blockchain escrow ID
  
  // Discriminator System
  escrowType: escrowTypeEnum("escrow_type").notNull(), // POLICY or USER_WALLET
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  policyId: text("policy_id").references(() => policy.id, { onDelete: "cascade" }),
  providerId: text("provider_id").references(() => provider.id, { onDelete: "set null" }),
  purpose: escrowPurposeEnum("purpose"), // For USER_WALLET type escrows
  
  // Escrow Configuration
  amount: decimal("amount", { precision: 15, scale: 6 }).notNull(),
  status: escrowStatusEnum("status").notNull().default("PENDING"),
  escrowModel: escrowModelEnum("escrow_model").notNull().default("SINGLE_SIDED"),
  premiumReturnPolicy: premiumReturnPolicyEnum("premium_return_policy").notNull().default("PROVIDER_KEEPS_PREMIUM"),
  collateralAmount: decimal("collateral_amount", { precision: 15, scale: 6 }).default("0.00"),
  poolId: text("pool_id").references(() => escrowPool.id),
  escrowConfiguration: jsonb("escrow_configuration"), // Model-specific settings
  
  // Blockchain Integration
  txHash: text("tx_hash"),
  blockNumber: integer("block_number"),
  expiresAt: timestamp("expires_at").notNull(),
  // ... additional escrow fields
});

// Advanced Escrow Pool System
export const escrowPool = pgTable("escrow_pool", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => provider.id),
  name: text("name").notNull(),
  escrowModel: escrowModelEnum("escrow_model").notNull(),
  totalCapacity: decimal("total_capacity", { precision: 15, scale: 2 }).notNull(),
  availableBalance: decimal("available_balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
  poolAddress: text("pool_address"), // Blockchain pool address
  isActive: boolean("is_active").notNull().default(true),
  // ... additional pool management fields
});
```

### 3.8 Historical Data & Analytics

```typescript
// Comprehensive flight history tracking
export const historicalFlightSegments = pgTable("historical_flight_segments", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  iataFlightNumber: text("iata_flight_number"),
  airlineIcaoCode: char("airline_icao_code", { length: 3 }).references(() => airline.icaoCode),
  originAirportIataCode: char("origin_airport_iata_code", { length: 3 }).references(() => airport.iataCode).notNull(),
  destinationAirportIataCode: char("destination_airport_iata_code", { length: 3 }).references(() => airport.iataCode).notNull(),
  scheduledDepartureTimestampUTC: timestamp("scheduled_departure_timestamp_utc", { withTimezone: true }).notNull(),
  actualDepartureTimestampUTC: timestamp("actual_departure_timestamp_utc", { withTimezone: true }),
  departureDelayMinutes: integer("departure_delay_minutes"),
  arrivalDelayMinutes: integer("arrival_delay_minutes"),
  sourceContributions: jsonb("source_contributions"), // Multi-source data attribution
  // ... comprehensive flight tracking fields
});

// Weather data for risk assessment
export const historicalWeatherObservations = pgTable("historical_weather_observations", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  airportIataCode: char("airport_iata_code", { length: 3 }).references(() => airport.iataCode).notNull(),
  observationTimestampUTC: timestamp("observation_timestamp_utc", { withTimezone: true }).notNull(),
  temperatureCelsius: decimal("temperature_celsius", { precision: 5, scale: 2 }),
  windSpeedKph: decimal("wind_speed_kph", { precision: 5, scale: 2 }),
  precipitationMm: decimal("precipitation_mm_last_hour", { precision: 5, scale: 2 }),
  visibilityKm: decimal("visibility_km", { precision: 5, scale: 2 }),
  // ... comprehensive weather data
});
```

## 4. Data Population Status

### 4.1 Reference Data (✅ Complete)
- **Countries**: 249 records with ISO codes and continent mapping
- **Regions**: 3,929 regional subdivisions with country relationships
- **Airlines**: 5,731 airlines with IATA/ICAO codes and country links
- **Airports**: 9,079 airports with coordinates, timezones, and comprehensive metadata
- **Runways**: 10,115 runway records linked to airports
- **Aircraft Types**: 231 aircraft types with ICAO/IATA codes
- **Routes**: 64,100+ operational routes between airports

### 4.2 Application Data (✅ Seeded)
- **Providers**: InsureCo and other test providers configured
- **Provider Products**: Sample insurance products with different coverage types
- **Flight Data Sources**: AviationStack, FlightAware, OpenSky, Weather APIs configured
- **System Configuration**: Basic operational parameters

## 5. Performance Optimizations

### 5.1 Indexes
- **Primary Keys**: All tables have optimized primary key indexes
- **Foreign Keys**: Comprehensive foreign key indexing for relations
- **Search Indexes**: Flight number, airport codes, airline codes
- **Temporal Indexes**: Flight schedules, policy expiration, escrow expiration
- **Composite Indexes**: Multi-column indexes for common query patterns

### 5.2 Query Patterns
- **Flight Search**: Optimized for origin/destination/date queries
- **Policy Lookup**: Fast user policy retrieval
- **Provider Dashboard**: Efficient provider-scoped data access
- **Historical Analysis**: Time-series data access patterns

## 6. Security Implementation

### 6.1 Implemented RLS Policies
```sql
-- File: packages/core/database/RLS_sql.txt
-- Comprehensive policies for all 40+ tables
-- Anonymous access patterns for public flight search
-- Authenticated user data protection
-- Service role administrative access
```

### 6.2 Encryption Strategy
- **Wallet Addresses**: Field-level encryption for blockchain credentials
- **API Keys**: Encrypted webhook secrets and authentication tokens
- **Business Data**: Encrypted sensitive provider information

## 7. Monitoring & Maintenance

### 7.1 Health Monitoring
- **Data Source Health**: Tracking API reliability and response times
- **Escrow Pool Health**: Monitoring pool balances and collateralization
- **System Performance**: Query performance and index utilization

### 7.2 Data Lifecycle Management
- **Cache Management**: Automatic expiration of cached flight data
- **Historical Data**: Automated archival of completed policies
- **Audit Trails**: Comprehensive logging of all data modifications

## 8. Integration Points

### 8.1 External APIs
- **Flight Data**: AviationStack, FlightAware, OpenSky integration points
- **Weather Data**: Weather API integration for risk assessment
- **Blockchain**: PayGo adapter for escrow management

### 8.2 Internal Services
- **Authentication**: Better-auth integration with database sessions
- **Quote Engine**: Risk calculation and pricing integration
- **Payout Engine**: Automated payout processing based on flight data

## 9. Next Steps

### 9.1 Immediate (Week 3-4)
- ✅ Schema and RLS implementation complete
- 🔄 Better-auth middleware integration
- 🔄 API endpoints for anonymous quote generation

### 9.2 Short Term (Weeks 5-8)
- ❌ Historical data population from external APIs
- ❌ Advanced escrow model implementations
- ❌ Real-time flight monitoring system

### 9.3 Long Term (Post-MVP)
- ❌ Additional escrow models (DAO-governed, prediction markets)
- ❌ Advanced analytics and machine learning integration
- ❌ Multi-blockchain support expansion

---

**Implementation Notes:**
- This schema is production-ready and fully operational
- All reference data has been seeded and verified
- RLS policies enable public quote generation with secure user data protection
- The escrow system supports 14 different models for flexible insurance products
- Comprehensive audit trails and monitoring capabilities are built-in