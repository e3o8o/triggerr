# triggerr MVP Implementation TODO

**Last Updated**: 2025-01-27
**Status**: Reference Data Foundation COMPLETE. Seeding ✅ → PRD Updates & Better-Auth Integration
**Target**: Minimal Viable Product - Flight Delay Insurance with Automatic Payouts, built on a Robust Data Foundation.
**Timeline**: 6-8 weeks remaining to MVP launch (adjusted for foundational data work)

## 🎯 MVP Scope Definition

### **What's IN the MVP**
- ✅ **Core User Flow**: Quote → Policy → Automatic Payout (for InsureCo's initial product).
- ✅ **Marketplace Foundation**: triggerr (platform) + InsureCo (first provider, single-sided escrow model).
- ✅ **Multi-Source Flight Data**: Aggregation from AviationStack, FlightAware, OpenSky, Weather APIs.
- ✅ **Authentication**: Better-auth with Google OAuth.
- ✅ **Multi-Escrow Architecture (Schema & Core Logic)**: All 14 escrow models supported in DB schema; MVP policy engine uses InsureCo's chosen model.
- ✅ **Comprehensive Reference Data**: Database seeded with countries, regions, airlines, airports (with timezones), runways, aircraft types, and routes.
- ✅ **Historical Data Persistence (Schema & Basic Ingestion)**: Tables for `historical_flight_segments` and `historical_weather_observations` defined; initial data ingestion from aggregator.
- ✅ **Payment**: PayGo escrow with automatic release (utilizing robust Escrow ID system).
- ✅ **Frontend**: Web application for MVP user flows.
- ✅ **Monitoring**: Automated flight status checking for active policies.

### **What's OUT of MVP** (Post-MVP / Phase 2 Features)
- ❌ Advanced multi-provider onboarding UI (InsureCo is configured directly).
- ❌ Full UI/logic for all 14 escrow models by providers (MVP uses one default).
- ❌ Advanced admin dashboard (basic logging/DB queries for monitoring).
- ❌ Provider revenue sharing automation.
- ❌ Complex historical data analysis features or ML model training (data will be collected).
- ❌ Full utilization of all seeded reference data (e.g., runway details in risk, all route permutations for suggestions) by MVP features. Data is present for robustness and future use.

---

## 📊 MVP Implementation Status

### **✅ INITIAL FOUNDATION COMPLETE**
- **✅ Database (Operational Tables)**: Drizzle schema for users, providers, policies, operational flights, escrows, payouts (with 14 escrow model support).
- **✅ Authentication System (Server)**: Better-auth configured with Google OAuth + Drizzle adapter.
- **✅ Project Structure & Env Setup**: Complete.
- **✅ Escrow ID Generator**: Sophisticated system implemented and documented.
- **✅ Core PRD Docs Updated**: PRD-CORE-003, PRD-API-001, PRD-APP-001 aligned with Drizzle/Better-auth.

### 🚧 CURRENT PRIORITY: ROBUST DATA FOUNDATION & SCHEMA EXPANSION
-   ✅ **Define Drizzle Schema for ALL Reference Tables**: `countries`, `regions`, `airlines`, `airports` (enhanced), `runways`, `aircraft_types`, `routes`. Enhanced `escrow` schema.
-   🔄 **Define Drizzle Schema for Historical Data Persistence**: `historical_flight_segments`, `historical_weather_observations`, `raw_api_call_logs` (optional).
-   ✅ **Develop Comprehensive Seeding Script**: For ALL reference tables using provided seed files.
-   🔄 **Update ALL Data-Related PRDs**: `PRD-DATA-004`, `PRD-DATA-001`, `PRD-DATA-003`, `PRD-INTEGRATION-00X`, `PRD-CORE-001`.

### **⏳ NEXT UP: Better-Auth Integration (Code Implementation)**
- **❌ Next.js Middleware**: Route protection.
- **❌ API Routes**: Update all endpoints to use Better-auth.
- **❌ Frontend Auth Components**: Update to Better-auth client.

### **❌ REMAINING MVP IMPLEMENTATION (Post Data Foundation & Auth Integration)**
- **❌ External API Client Implementations**: AviationStack, FlightAware, OpenSky, Weather.
- **❌ Flight Data Aggregator (Code)**: Normalization, data flow to persistence.
- **❌ PayGo Integration (Code)**: PayGo Adapter, Escrow Manager.
- **❌ Business Logic Engines (Code)**: Quote/Policy/Payout.
- **❌ Frontend Insurance Flows & UI**: Quote, policy, dashboard.

---

## 🚀 REVISED MVP Implementation Roadmap

### **PHASE 1: ✅ Reference Data Schema & Seeding COMPLETE. Historical Schema & PRD Updates Pending.**
**Goal**: Establish a comprehensive and durable data layer.
**Tasks**:
-   ✅ **Define ALL Reference Table Schemas** (`packages/core/database/schema.ts`)
    -   ✅ `countries`, `regions`, `airlines`, `airports` (enhanced), `runways`, `aircraft_types`, `routes`.
-   ✅ **Define Historical Data Persistence Schemas** (`packages/core/database/schema.ts`)
    -   ✅ `historical_flight_segments`, `historical_weather_observations`, `raw_api_call_logs` (optional).
-   ✅ **Define Drizzle Relations** for all new/enhanced tables.
-   ✅ **Run `db:generate`** to create migrations.
-   ✅ **Develop Comprehensive Seeding Script** (`packages/core/database/seed.ts`)
    -   ✅ Logic for `countries` (from `countries.dat`)
    -   ✅ Logic for `regions` (from `regions.csv`)
    -   ✅ Logic for `airlines` (from `airlines.dat`)
    -   ✅ Logic for `airports` (from `airports.csv` + `airports.dat` for timezones)
    -   ✅ Logic for `runways` (from `runways.csv`)
    -   ✅ Logic for `aircraft_types` (from `planes.dat`)
    -   ✅ Logic for `routes` (from `routes.dat`)
-   ✅ **Run `db:migrate` and `db:seed`**. **Thoroughly verify ALL seeded data.**
-   🔄 **Update ALL Data-Related PRDs** (`PRD-CORE-001`, `PRD-CORE-003`, `PRD-DATA-001`, `PRD-DATA-003`, `PRD-DATA-004`, `PRD-INTEGRATION-00X`, `PROJECT_CONTEXT.md`).
    -   Define Canonical Data Models in `PRD-CORE-003`.
    -   Detail persistence schemas & workflows in `PRD-DATA-004`.
**Acceptance**: All reference and historical data tables defined in Drizzle, seeded with data, and documented in PRDs.

### **PHASE 2: Better-Auth Integration (Follows Data Foundation)**
**Goal**: Fully integrate Better-auth.
**Tasks**:
-   [ ] **Next.js Middleware**: Implement for route protection.
-   [ ] **API Routes Update**: Integrate Better-auth session management.
-   [ ] **Frontend Auth Components**: Update UI for Better-auth client.
**Acceptance**: Secure authentication, session management, protected routes functional.

### **PHASE 3: External API Clients & Aggregator Core (Timeline: ~Weeks 4-5 of original plan)**
**Goal**: Fetch, normalize, and prepare data for persistence and MVP use.
**Tasks**:
-   [ ] **Implement External API Clients**: AviationStack, FlightAware, OpenSky, Weather.
-   [ ] **Flight Data Aggregator (Initial)**: Normalization to `CanonicalFlightDataModel`, basic data flow to `historical_flight_segments`.
-   [ ] **Weather Aggregator/Client (Initial)**: Normalization to `CanonicalWeatherObservationModel`, basic data flow to `historical_weather_observations`.
**Acceptance**: Able to fetch data from all sources, normalize it, and perform initial writes to historical tables.

### **PHASE 4: Blockchain & Escrow Logic (Timeline: ~Week 6 of original plan)**
**Goal**: Integrate PayGo and establish core escrow management.
**Tasks**:
-   [ ] **PayGo Adapter**: Integrate PayGo client, using `EscrowIdPair`.
-   [ ] **Escrow Manager**: Logic for InsureCo's chosen escrow model (e.g., single-sided), using `EscrowIdPair`.
**Acceptance**: Can programmatically create and manage PayGo escrows for MVP's chosen escrow model.

### **PHASE 5: Business Logic Engines (Timeline: ~Weeks 7-8 of original plan)**
**Goal**: Implement core insurance logic.
**Tasks**:
-   [ ] **Quote Engine**: Query internal historical data first (via Data Router), then live data (via Aggregator). Factor in InsureCo's rules.
-   [ ] **Policy Engine**: Create policies, integrate with Escrow Manager (using `EscrowIdPair`).
-   [ ] **Payout Engine**: Monitor flights (via Aggregator/internal data), process payouts (via Escrow Manager, using `EscrowIdPair`).
**Acceptance**: Accurate quotes, policies created with escrows, automated payouts for valid claims.

### **PHASE 6: API Layer Completion (Timeline: ~Week 9 of original plan)**
**Goal**: Expose all MVP functionality via secure APIs.
**Tasks**:
-   [ ] **Finalize Public API Endpoints**: Fully integrated with Better-auth & business logic.
-   [ ] **Input Normalization for Flight Search**: Basic implementation for flight numbers and IATA routes.
**Acceptance**: All MVP API endpoints functional and secure.

### **PHASE 7: Frontend Implementation (Timeline: ~Week 10 of original plan)**
**Goal**: Build the MVP user-facing application.
**Tasks**:
-   [ ] **Implement MVP User Flows**: Quote search, quote display, policy purchase, user dashboard (policy list & status).
**Acceptance**: Complete and functional user journey for MVP scope.

### PHASE 8: Provider Foundation (InsureCo) & Testing (Timeline: ~Weeks 11-12 of original plan)
**Goal**: Finalize InsureCo setup and conduct thorough testing.
**Tasks**:
-   ✅ InsureCo Configuration**: Ensure InsureCo provider record is correctly set up with its chosen escrow model.
-   [ ] **End-to-End Testing**: Comprehensive testing of all MVP flows.
**Acceptance**: MVP is stable, tested, and ready for limited launch.

---

## 📋 MVP Success Criteria

### **Functional Requirements**
- [ ] User can sign in with Google (Better-auth).
- [ ] User can get flight delay insurance quotes using aggregated data (prioritizing internal historical store).
- [ ] User can purchase policies with automatic PayGo escrow creation (InsureCo provider, using defined Escrow ID system).
- [ ] System automatically monitors flight status using aggregated data.
- [ ] System automatically pays out when flight delayed >60 minutes based on verified data.
- [ ] User can view policy status and basic transaction history.
- ✅ Database contains seeded reference data (airports, airlines, countries, regions, runways, aircraft_types, routes).
- [ ] System logs historical flight segments and weather observations from API calls.

### **Technical Requirements**
- [ ] All reference data tables defined in Drizzle and seeded.
- [ ] Historical data tables (`historical_flight_segments`, `historical_weather_observations`) defined and capable of ingesting data.
- [ ] Better-auth integration complete across frontend and backend.
- ✅ Escrow ID system correctly implemented and schema (`escrow` table) supports its use for policy/user escrows.

### **Performance Requirements**
- [ ] Quote generation: < 3-5 seconds (allowing for potential internal historical data queries).
- [ ] Policy creation: < 10 seconds (including escrow creation).
- [ ] API response times (p95): < 500ms.

---

## 🔧 MVP Technology Stack (Confirmed)
✅ Database**: PostgreSQL + Drizzle ORM (schema defined and ALL REFERENCE DATA SEEDED for all reference & historical tables).
- ✅ Authentication**: Better-auth + Google OAuth (server config done, client/middleware integration pending).
- **Backend**: Next.js API Routes.
- **Frontend**: Next.js + Better-auth client + TailwindCSS + shadcn/ui.
- **Blockchain**: PayGo Protocol (`@witnessco/paygo-ts-client`).
- **External APIs**: AviationStack, FlightAware, OpenSky, Weather APIs.

---

## 📊 Weekly Milestones & Demos (Adjusted)

- **Current Sprint Demo (End of "Robust Foundation" Phase)**:
    -   ✅ Show Drizzle schema with all new reference and historical tables.
    -   ✅ Demonstrate successful seeding of ALL reference datasets (`countries`, `regions`, `airlines`, `airports` with timezones, `runways`, `aircraft_types`, `routes`).
    -   🔄 Show PRDs updated to reflect this comprehensive data foundation.
- **Next Sprint Demo (Better-Auth Integration)**:
    -   Protected routes, API endpoints with authentication, user session management working.
- **Subsequent Demos**: Follow the revised phase plan (External API clients, Aggregator with persistence, Blockchain, Engines, API, Frontend).

---

**🎯 Current Focus**: Updating Data-Related PRDs, Better-Auth Integration, and Defining/Implementing Historical Data Persistence Schemas.
**⏰ Revised Timeline**: Original 2-4 weeks remaining, current sprint focuses on data foundation, then Better-Auth integration, before resuming original MVP feature timeline.
