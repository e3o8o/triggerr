# triggerr Implementation TODO

# triggerr Phased Implementation Roadmap Overview

**Last Updated**: [Current Date - User to Fill]
**Status**: Master Vision v1.0 Finalized. Prerequisite documentation and foundational code (schema/seed) alignment in progress.
**Source of Truth**: `triggerr/docs/triggerr_vision.md v1.0`
**Current Focus**: Completing prerequisites, then commencing Phase 1 (MVP) development.
**Detailed MVP Tasks**: See `triggerr/docs/MVP_todo.md`.

---

## 📋 PRD Implementation Tracking

## 📋 Key Document Alignment Status

- **`triggerr_vision.md`**: ✅ v1.0 Finalized (Master Blueprint)
- **`PROJECT_CONTEXT.md`**: ✅ v1.0 Finalized (Master Blueprint)
- **`MVP_todo.md`**: 🔄 Needs update for Phase 1 MVP execution (custodial wallet, insurance-only focus)
- **`business_structure.md`**: 🔄 Needs update for `FlightHub Connect` & MVP roles.
- **`packages/core/database/schema.ts`**: 🔄 Needs update for MVP tables (user_wallets, conversations, etc.)
- **`packages/core/database/seed.ts`**: 🔄 Needs update for MVP seeding.
- **`PRD-CORE-001-Database-Schema.md`**: 🔄 Review & align with schema.ts changes.
- **`PRD-BLOCKCHAIN-003-Wallet-Service.md`**: 🔄 CRITICAL update for custodial `UserWalletService` & KMS.
   ... (list other critical PRDs needing alignment for MVP)


### ✅ Completed PRDs (Initial Foundation Ready)
- **PRD-CORE-001**: Database Schema (✅ Drizzle implementation with core operational tables & 14 escrow models)
- **PRD-CORE-002**: Authentication (✅ Better-auth server setup with Google OAuth)
- **PRD-CORE-003**: Shared Types (✅ Drizzle types for core tables generated, Escrow ID utilities ✅; Canonical Models & API types 🔄)
- **PRD-API-001**: Public API (✅ Docs updated for Better-auth)
- **PRD-APP-001**: Web Application (✅ Docs updated for Better-auth client)

### 🔄 Currently Active PRDs (Documentation & Planning Phase)
- **PRD-DATA-004**: Data Persistence & Caching Strategy (🔄 Needs major update for long-term persistence schema & workflows)
- **PRD-DATA-001**: Flight Data Aggregator (🔄 Needs update for outputting CanonicalFlightDataModel & flow to persistence layer)
- **PRD-DATA-003**: Data Router & Source Management (🔄 Needs update for internal-first query prioritization)
- **PRD-INTEGRATION-00X**: All Integration PRDs (🔄 Need update for "Data Points for Persistent Storage" sections)
- **PRD-CORE-001 (Schema Part 2)**: Database Schema (🔄 Needs update for historical & all reference tables)

### 📝 PRDs Ready for Implementation (Post-Foundation Enhancement)
- **PRD-ENGINE-001**: Quote Engine (❌ Needs escrow model cost integration & internal historical data querying)
- **PRD-ENGINE-002**: Policy Engine (❌ Needs escrow manager integration & Escrow ID usage)
- **PRD-ENGINE-003**: Payout Engine (❌ Needs multi-escrow model support & Escrow ID validation)

---

## 📊 Current Implementation State Summary

### ✅ CORE FOUNDATION COMPLETE (Initial)
- **✅ Database (Operational Tables)**: Drizzle schema for users, providers, policies, operational flights, escrows, payouts.
- **✅ Authentication System (Server)**: Better-auth configured with Google OAuth + Drizzle adapter.
- **✅ Project Structure & Env Setup**: Complete.
- **✅ Escrow ID Generator**: Sophisticated system implemented.
- **✅ Core PRD Docs Updated**: PRD-CORE-003, PRD-API-001, PRD-APP-001 aligned with Drizzle/Better-auth.

### 🚧 IN PROGRESS (Current Sprint - Foundational Data Enhancements & Better-Auth Integration)

**Data Foundation Enhancements (New Priority):**
-   **🔄 Define Drizzle Schema for Data Persistence**:
    -   [ ] `historical_flight_segments` table
    -   [ ] `historical_weather_observations` table
    -   [ ] `raw_api_call_logs` table (if adopted)
-   ** ✅ Define Drizzle Schema for ALL Reference Data**:
    -    ✅ `countries` table
    -    ✅ `regions` table
    -    ✅ `airlines` table (enhance existing)
    -    ✅ `airports` table (enhance existing, critical timezone augmentation)
    -    ✅ `runways` table
    -    ✅ `aircraft_types` table
    -    ✅ `routes` table
-   ** ✅ Develop Comprehensive Seeding Script**:
    -    ✅ For `countries` (from `countries.dat`)
    -    ✅ For `regions` (from `regions.csv`)
    *    ✅ For `airlines` (from `airlines.dat`)
    *    ✅ For `airports` (from `airports.csv` + `airports.dat` for timezones)
    *    ✅ For `runways` (from `runways.csv`)
    *    ✅ For `aircraft_types` (from `planes.dat`)
    *    ✅ For `routes` (from `routes.dat`)
-   **🔄 Update Data-Related PRDs**: `PRD-DATA-004`, `PRD-DATA-001`, `PRD-DATA-003`, `PRD-INTEGRATION-00X`.
-   **🔄 Update `PRD-CORE-001` & `PRD-CORE-003`**: For new schemas & canonical models.

**Better-Auth Integration (Code Implementation - Follows Data Foundation Schema Work):**
-   **🔄 API Integration**: Middleware and routes for Better-auth.
-   **🔄 Frontend Components**: Auth components for Better-auth client.

### ❌ CRITICAL IMPLEMENTATION GAPS (Post Current Sprint)
- **❌ External API Client Implementations**: AviationStack, FlightAware, OpenSky, Weather (porting from `working_tests/`).
- **❌ Flight Data Aggregator (Code)**: Normalization to Canonical Model, data flow to persistence layer.
- **❌ PayGo Integration (Code)**: PayGo Adapter, Escrow Manager.
- **❌ Business Logic Engines (Code)**: Quote/Policy/Payout engines.
- **❌ Frontend Insurance Flows & UI**: Quote, policy, dashboard.

---

## 🎯 REVISED Implementation Roadmap

### PHASE 1: Robust Foundation (Current Focus)
**Status**: 🔄 In Progress - Extending initial foundation with comprehensive data persistence and reference data.

#### 1.1 Data Persistence & Reference Schema Definition (`packages/core/database/schema.ts`)
-   [ ] **Define Historical Data Tables**:
    -   [ ] `historical_flight_segments`
    -   [ ] `historical_weather_observations`
    -   [ ] `raw_api_call_logs` (optional)
-   [ ] **Define/Enhance ALL Reference Data Tables**:
    -   [ ] `countries`
    -   [ ] `regions`
    -   [ ] `airlines` (enhance)
    -   [ ] `airports` (enhance with timezone strategy)
    -   [ ] `runways`
    -   [ ] `aircraft_types`
    -   [ ] `routes`
-   [ ] **Define Drizzle Relations** for all new/enhanced tables.
-   [ ] **Run `db:generate`** to create migrations.
-   **PRD Link**: `PRD-CORE-001` (update needed)

#### 1.2 Comprehensive Data Seeding (`packages/core/database/seed.ts`)
-   ✅ **Implement Seeding Logic for `countries`** (from `countries.dat`)
-   ✅ **Implement Seeding Logic for `regions`** (from `regions.csv`)
-   ✅ **Implement Seeding Logic for `airlines`** (from `airlines.dat`, link to `countries`)
-   ✅ **Implement Seeding Logic for `airports`** (from `airports.csv` + `airports.dat` for timezones, link to `countries`, `regions`)
-   ✅ **Implement Seeding Logic for `runways`** (from `runways.csv`, link to `airports`)
-   ✅ **Implement Seeding Logic for `aircraft_types`** (from `planes.dat`)
-   ✅ **Implement Seeding Logic for `routes`** (from `routes.dat`, link to `airlines`, `airports`)
-   ✅ **Run `db:migrate` and `db:seed`**. Thoroughly verify all seeded data.

#### 1.3 Update Core Data PRDs & Types
-   [ ] **Update `PRD-DATA-004`**: Detail persistent store schema, ingestion, retention.
-   [ ] **Update `PRD-CORE-003`**: Define `CanonicalFlightDataModel`, `CanonicalWeatherObservationModel`, `FlightSearchInput`.
-   [ ] **Update `PRD-DATA-001` (Aggregator)**: Specify output as Canonical Models, flow to persistence.
-   [ ] **Update `PRD-DATA-003` (Router)**: Add internal-first query logic for historical/reference data.
-   [ ] **Update `PRD-INTEGRATION-00X` (All)**: Add "Data Points for Persistent Storage" sections.
-   [ ] **Update `PRD-API-001`**: Detail handling of diverse search inputs, prioritization of internal data.
-   [ ] **Update `PROJECT_CONTEXT.md`**: Align all relevant sections.

#### 1.4 Initial Foundation (Already Accounted For)
-   ✅ Drizzle Schema for Operational Tables & Escrow Models
-   ✅ Better-Auth Server Configuration
-   ✅ Escrow ID Generator

### PHASE 2: Better-Auth Integration (Follows Data Foundation Schema/Seed)
**Goal**: Fully integrate Better-auth into the application.
#### 2.1 Better-Auth Code Implementation
-   [ ] **Next.js Middleware** (`apps/web/middleware.ts`) for route protection.
-   [ ] **API Routes Update** (`apps/web/app/api/`) to use Better-auth sessions.
-   [ ] **Frontend Auth Components** (`apps/web/components/auth/`) for Better-auth client.
-   **Acceptance**: Secure authentication, session management, protected routes.

### PHASE 3: External API Clients & Aggregator Core (Weeks ~4-5 of original MVP timeline)
**Goal**: Fetch, normalize, and prepare data for persistence.
#### 3.1 External API Client Implementation
-   [ ] **AviationStack Client** (`packages/integrations/aviationstack/`)
-   [ ] **FlightAware Client** (`packages/integrations/flightaware/`)
-   [ ] **OpenSky Client** (`packages/integrations/opensky/`)
-   [ ] **Weather API Client** (`packages/integrations/weather-apis/`)
    *   Port from `working_tests/`, implement error handling, rate limiting.
    *   Ensure clients fetch all data points specified for persistence in their respective PRDs.
#### 3.2 Flight Data Aggregator (Initial Implementation)
-   [ ] **Normalization Logic**: To `CanonicalFlightDataModel`.
-   [ ] **Data Flow**: Send normalized data to Data Persistence Layer/Service (for `historical_flight_segments`).
-   [ ] **(Optional) Raw Data Logging**: Send raw API responses to `raw_api_call_logs`.
#### 3.3 Weather Data Aggregator/Client (Initial Implementation)
-   [ ] **Normalization Logic**: To `CanonicalWeatherObservationModel`.
-   [ ] **Data Flow**: Send normalized data to Data Persistence Layer/Service (for `historical_weather_observations`).

### PHASE 4: Blockchain & Escrow Logic (Week ~6 of original MVP timeline)
**Goal**: Integrate PayGo and manage escrows.
#### 4.1 PayGo Adapter & Escrow Manager
-   [ ] **PayGo Adapter**: Integrate PayGo client, utilizing `EscrowIdPair` from generator.
-   [ ] **Escrow Manager**: Develop logic for multi-escrow models (MVP starts with InsureCo's chosen model), using `EscrowIdPair` for tracking.

### PHASE 5: Business Logic Engines (Weeks ~7-8 of original MVP timeline)
**Goal**: Implement core insurance logic using internal and live data.
#### 5.1 Quote Engine
-   [ ] Query internal `historical_flight_segments`, `historical_weather_observations`, `routes` first via Data Router.
-   [ ] Integrate live data from Flight Data Aggregator.
-   [ ] Factor in escrow model costs, provider rules.
#### 5.2 Policy Engine
-   [ ] Create policies, generate `EscrowIdPair`, integrate with Escrow Manager.
#### 5.3 Payout Engine
-   [ ] Monitor flights (using Aggregator/internal data), process payouts via Escrow Manager, validate with `EscrowIdPair`.

### PHASE 6: API Layer Completion (Week ~9 of original MVP timeline)
**Goal**: Expose all functionality via secure APIs.
#### 6.1 Public API Endpoints
-   [ ] Finalize all core endpoints, fully integrated with Better-auth and business logic.
-   [ ] Implement flight search input normalization.

### PHASE 7: Frontend Implementation (Week ~10 of original MVP timeline)
**Goal**: Build the user-facing application.
#### 7.1 Web Application
-   [ ] Implement all MVP user flows (quote, policy purchase, dashboard) using Better-auth client.

### PHASE 8: Provider Foundation & Testing (Weeks ~11-12 of original MVP timeline)
**Goal**: Finalize InsureCo setup and test thoroughly.
#### 8.1 Provider Management (MVP)
-   [ ] Ensure InsureCo is configured with its chosen escrow model. Basic display, no complex UI for provider onboarding in MVP.
#### 8.2 Testing
-   [ ] Comprehensive E2E testing of all flows.

---

## 🚀 Implementation Guidelines

- **Data First**: Prioritize schema definition and data seeding for the robust foundation.
- **Iterative PRD Updates**: Update PRDs in parallel with schema/seed work.
- **Test Seeded Data**: After seeding, write simple DB queries to verify data integrity and counts.
- **Align with Vision**: All development must align with `triggerr_vision.md v1.0`.
- **Phased Execution**: Focus efforts on the current active phase's deliverables.
- **Modular Design**: Adhere to the package structure for services, integrations, and shared code.
- **API-First**: Define and implement APIs as per specifications before or in tandem with frontend development.
- **Database Integrity**: Ensure schema changes (Drizzle) and seeding are managed carefully.
- **Security by Design**: Incorporate security considerations (auth, data protection, KMS for keys) from the outset.
- **Comprehensive Testing**: Implement unit, integration, and end-to-end tests for all features.
- **Iterative PRD & Doc Alignment**: Keep all relevant documentation (PRDs, `PROJECT_CONTEXT.md`, etc.) synchronized with development progress and any necessary refinements to the vision.

---
(Existing "Daily Tracking", "Quick Reference" sections can remain largely as they are, but sprint goals will need to adjust to this new foundational work first.)

**🎯 Immediate Next Steps**:
1. Complete all prerequisite document updates (`PROJECT_CONTEXT.md`, `MVP_todo.md`, `business_structure.md`, key PRDs).
2. Implement/Update `packages/core/database/schema.ts` & `seed.ts` for Phase 1 MVP.
3. Begin development of Phase 1 Backend APIs and Core Services.
