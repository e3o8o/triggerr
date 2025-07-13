# Project triggerr: Pre-Flight Checklist & Phase 1 MVP Development Blueprint

**Document Version:** 1.0
**Based on:** `triggerr_vision.md v1.0` (The definitive source of truth)
**Date:** [Current Date - To be filled by user]

**Purpose:** This document consolidates the current project status following the finalization of `triggerr_vision.md v1.0`. It outlines:
1.  Mandatory prerequisite updates to existing documentation and foundational code (database schema, seeding scripts) that must be completed *before* Phase 1 (MVP) development work begins.
2.  A detailed plan for the creation and structuring of new files, services, and API route handlers for the Phase 1 MVP.

This blueprint ensures all development efforts are synchronized with the master vision, promoting clarity, consistency, and efficient execution.

graph TD
    subgraph "User Interaction Layer (Client: apps/web/src/frontend)"
        WebApp["Web Application (Next.js Frontend + React Router)"]
    end

    subgraph "API Gateway Layer (apps/web/app/api/v1)"
        APIRoutes["Next.js API Routes"]
    end

    subgraph "Authentication & Session Management"
        BetterAuth["Better-Auth Library (Google OAuth, Session JWTs)"]
    end

    subgraph "Core Business Services (packages/services)"
        ConversationService["ConversationService (LLM, Chat Logic)"]
        QuoteEngineService["QuoteEngineService (Insurance Premium Calc)"]
        PolicyService["PolicyService (Lifecycle, Escrow Orchestration, Payouts)"]
        UserWalletService["UserWalletService (Custodial Wallets, Faucet)"]
        PaymentService["PaymentService (Stripe Orchestration)"]
        FlightDataService["FlightDataService (Flight Info for Insurance)"]
        FlightMonitorService["FlightMonitorService (Background Task - Flight Tracking)"]
    end

    subgraph "Integration Layer (packages/integrations)"
        PayGoService["PayGoService (Direct `@witnessco/paygo-ts-client` Usage)"]
        StripeService["StripeService"]
        LLMService["LLMService (e.g., Gemini/Claude Client or Self-Hosted Llama Wrapper)"]
        KmsService["KmsService (Key Encryption/Decryption for Custodial Wallets)"]
        AviationStackClient["AviationStackClient"]
        FlightAwareClient["FlightAwareClient"]
        OpenSkyClient["OpenSkyClient"]
    end

    subgraph "Shared Core & Data Layer (packages/core, packages/shared)"
        Database["Database (PostgreSQL + Drizzle ORM - `schema.ts`)"]
        SharedTypes["Shared Types (`packages/shared-types`)"]
        SharedConstants["Constants (`packages/shared/constants`)"]
        SharedValidators["Validators (`packages/shared/validators`)"]
        SharedNotifications["Notifications (`packages/shared/notifications`)"]
    end

    %% User to API
    WebApp -->|HTTP Requests| APIRoutes

    %% API Routes to Services & Auth
    APIRoutes -->|User Requests: Chat, Quote, Policy| ConversationService
    APIRoutes -->|Policy Purchase, User Data| PolicyService
    APIRoutes -->|Wallet Info, Faucet| UserWalletService
    APIRoutes -->|Stripe Payment Intent, Webhooks| PaymentService
    APIRoutes -->|Authentication Handling| BetterAuth

    %% Service to Service Interactions
    ConversationService -->|Get Flight Context via internal API| FlightDataService
    ConversationService -->|Request Quotes| QuoteEngineService
    ConversationService -->|LLM Interaction| LLMService
    ConversationService -->|Save/Load Chat| Database

    PolicyService -->|Manage User Wallet for Escrow| UserWalletService
    PolicyService -->|Stripe Payment Confirmation| PaymentService
    PolicyService -->|Create/Release PayGo Escrow| PayGoService
    PolicyService -->|Store/Update Policy| Database
    PolicyService -->|Triggered by| FlightMonitorService

    UserWalletService -->|Create/Manage PayGo Wallet Ops| PayGoService
    UserWalletService -->|Encrypt/Decrypt Private Keys| KmsService
    UserWalletService -->|Store/Update Wallet Info| Database

    QuoteEngineService -->|Get Flight Risk Data| FlightDataService
    QuoteEngineService -->|Access Product Rules| Database

    PaymentService -->|Stripe API Calls| StripeService
    PaymentService -->|Store Payment Records| Database

    FlightMonitorService -->|Get Flight Status| FlightDataService

    %% Services to Integration Layer
    FlightDataService -->|Fetch Data| AviationStackClient
    FlightDataService -->|Fetch Data| FlightAwareClient
    FlightDataService -->|Fetch Data| OpenSkyClient

    %% Services to Core Infrastructure
    UserWalletService --> Database
    PolicyService --> Database
    ConversationService --> Database
    QuoteEngineService --> Database
    PaymentService --> Database

    %% Shared Packages Usage (Conceptual - Many services use these)
    ConversationService --> SharedTypes
    PolicyService --> SharedTypes
    UserWalletService --> SharedTypes
    SharedValidators --> APIRoutes
    SharedNotifications --> PolicyService
    SharedNotifications --> UserWalletService

    classDef service fill:#D6EAF8,stroke:#3498DB,stroke-width:2px;
    classDef integration fill:#D1F2EB,stroke:#1ABC9C,stroke-width:2px;
    classDef core fill:#FCF3CF,stroke:#F1C40F,stroke-width:2px;
    classDef api fill:#EBDEF0,stroke:#8E44AD,stroke-width:2px;
    classDef user fill:#FDEDEC,stroke:#E74C3C,stroke-width:2px;
    classDef auth fill:#E8DAEF,stroke:#9B59B6,stroke-width:2px;

    class WebApp user;
    class APIRoutes api;
    class BetterAuth auth;
    class ConversationService,QuoteEngineService,PolicyService,UserWalletService,PaymentService,FlightDataService,FlightMonitorService service;
    class PayGoService,StripeService,LLMService,KmsService,AviationStackClient,FlightAwareClient,OpenSkyClient integration;
    class Database,SharedTypes,SharedConstants,SharedValidators,SharedNotifications core;

---

## Part A: Current Project Status & Key Achievements

The project has reached a significant milestone with the finalization of **`triggerr/docs/triggerr_vision.md v1.0`**. This master document establishes:

1.  **A Clear Phased Rollout Strategy:**
    *   **Phase 1 (MVP):** Laser-focus on `triggerr.com` as "The Parametric Insurance Experts," offering flight delay insurance with a chat-first UI and **custodial PayGo wallets** (system-managed encrypted keys via KMS) for seamless user onboarding and transactions.
    *   **Phase 2:** Introduction of new insurance products, user wallet evolution towards **self-custody options** (secure private key export), and onboarding of third-party insurers.
    *   **Phase 3:** Launch of **`FlightHub Connect`** as a distinct OTA entity for flight bookings (Duffel/Amadeus APIs), integrated with `triggerr.com`.

2.  **Defined Business & Entity Structures:** Roles for `triggerr` (platform), `triggerr Direct` (MVP insurer), `FlightHub Connect` (Phase 3 OTA), and `Parametrigger Financial Solutions` are clarified.

3.  **Confirmed Technology Stack & Architecture:**
    *   Next.js (App Router shell + React Router client-side), TailwindCSS.
    *   PostgreSQL with Drizzle ORM.
    *   Better-Auth (Google OAuth).
    *   PayGo Protocol.
    *   Stripe (MVP payments), LLM (MVP for conversational UI - managed API recommended initially).
    *   Flight Data APIs (AviationStack, etc. for MVP insurance logic).
    *   Modular monorepo structure (`apps/web`, `packages/core`, `packages/integrations`, `packages/services`, `packages/shared`, `packages/shared-types`).

4.  **Detailed API Endpoints for Phase 1 MVP:** Documented in `triggerr/docs/api/phase_1_mvp_endpoints.md`.

5.  **Documentation Strategy:** Older vision documents are to be archived. Key supporting documents require immediate alignment.

---

## Part B: Prerequisite Updates Required *Before* Phase 1 Coding

The following documentation and foundational code elements **MUST BE UPDATED AND ALIGNED** with `triggerr/docs/triggerr_vision.md v1.0` *before* active development of Phase 1 MVP features commences.

### B.1. Foundational Code (Database & Seeding)

**Target Files:**
*   `triggerr/packages/core/database/schema.ts` (Drizzle ORM Schema)
*   `triggerr/packages/core/database/seed.ts` (Seeding Script)

**Actions & Detailed Tasks for `schema.ts`:**
1.  **Implement `user_wallets` Table:**
    *   Drizzle schema: `id` (UUID, PK), `user_id` (UUID, FK to `users.id`, unique), `paygo_address` (text, unique, not null), `encrypted_private_key` (text, not null - for KMS encrypted key), `wallet_name` (text, default 'My triggerr Wallet'), `is_primary` (boolean, default true), `key_exported_at` (timestamp, nullable - for Phase 2), `created_at`, `updated_at`, `last_balance_check` (timestamp, nullable), `cached_balance_amount` (text, default '0'), `balance_currency` (text, default 'PAYGO_TOKEN').
2.  **Implement `user_payment_methods` Table:**
    *   Drizzle schema: `id` (UUID, PK), `user_id` (UUID, FK to `users.id`), `payment_provider` (enum: 'STRIPE'), `provider_customer_id` (text, nullable), `provider_method_id` (text, unique, not null - Stripe PaymentMethod ID), `method_type` (text, nullable - e.g., 'CARD'), `details` (jsonb, nullable - for card brand, last4), `is_default` (boolean), `is_active` (boolean), `created_at`, `updated_at`.
3.  **Implement `conversations` Table (Standardized Name):**
    *   Drizzle schema: `id` (UUID, PK), `user_id` (UUID, FK to `users.id`, nullable), `anonymous_session_id` (text, unique, nullable), `title` (text, nullable), `initial_search_query` (text, nullable), context JSONB fields (`current_flight_context`, `current_insurance_preferences`, `current_ota_context` - OTA for Phase 3), `created_at`, `updated_at`, `metadata` (jsonb, nullable).
4.  **Implement `conversation_messages` Table:**
    *   Drizzle schema: `id` (UUID, PK), `conversation_id` (UUID, FK to `conversations.id`), `role` (enum: 'user', 'assistant', 'system'), `content` (text, not null), `ui_elements` (jsonb, nullable), `metadata` (jsonb, nullable), `created_at`.
5.  **Implement `quote_cart_items` Table (Standardized Name for "Insurance Navigator" items):**
    *   Drizzle schema: `id` (UUID, PK), `user_id` (UUID, FK to `users.id`, nullable), `anonymous_session_id` (text, nullable), `insurance_product_id` (text, not null - or FK to a products table), `flight_context_snapshot` (jsonb, not null), `quoted_premium_cents` (integer, not null), `quoted_coverage_cents` (integer, not null), `quote_details` (jsonb, not null - full quote parameters), `added_at`, `status` (enum: 'ACTIVE', 'PURCHASED', 'EXPIRED', 'REMOVED'). Include unique constraints.
6.  **Review & Update `providers` Table:**
    *   Drizzle schema: `id` (UUID, PK), `name` (text, unique), `category` (enum), `status` (enum: 'ACTIVE', 'INACTIVE', 'PENDING_APPROVAL'), `api_key` (text, nullable, unique), `configuration_details` (jsonb, nullable), `created_at`, `updated_at`.
7.  **Review & Update `policies` Table:**
    *   Drizzle schema: `id`, `user_id`, `provider_id`, `paygo_escrow_id` (text, unique - on-chain Escrow ID from PayGo), `policy_verification_code` (text, unique - user-facing), `flight_details_snapshot` (jsonb), premium/coverage amounts & currencies, `status` (enum), `payment_transaction_id` (text), `payout_transaction_hash` (text), `effective_at`, `expires_at`, `created_at`, `updated_at`.
8.  **Review & Update/Implement `policy_escrows` (or adapt existing `escrow` table):**
    *   Decision needed: New `policy_escrows` table or adapt existing `escrow` Drizzle object. Must link `policies.id` and `user_wallets.id`. Store `paygo_escrow_address` (on-chain ID), amounts, status, relevant tx hashes.
9.  **Implement `api_logs` Table:**
    *   Drizzle schema: `id` (BigSerial, PK), `request_id` (UUID), `timestamp`, `user_id` (nullable), `api_key_id` (nullable), `endpoint` (text), `method` (text), `status_code` (integer), `latency_ms` (integer), `ip_address` (inet), `user_agent` (text), `request_payload_hash` (text), `response_payload_hash` (text), `error_message` (text, nullable).
10. **Define Structure for Phase 3 Tables (Placeholders in Drizzle):**
    *   `flight_offers`: Drizzle schema based on `vision_update.md v1.0` Section 7.
    *   `flight_bookings`: Drizzle schema based on `vision_update.md v1.0` Section 7.
11. **Implement/Update Enum Definitions (using Drizzle `pgEnum`):**
    *   `providerCategoryEnum`: ('FIRST_PARTY_INSURER', 'THIRD_PARTY_INSURER', 'B2B_FINANCIAL_SERVICES', 'OTA_PROVIDER', 'FLIGHT_AGGREGATOR').
    *   `paymentProviderEnum`: ('STRIPE', 'POLAR_SH', 'PAYGO_CUSTODIAL', 'PAYGO_EXTERNAL').
    *   `productCategoryEnum`: ('PARAMETRIC_FLIGHT_DELAY', 'PARAMETRIC_WEATHER', 'PARAMETRIC_BAGGAGE_DELAY', 'FLIGHT_TICKET').
    *   `flightBookingStatusEnum`: ('PENDING_PAYMENT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'TICKETED', 'FAILED').
    *   `flightApiSourceEnum`: ('DUFFEL', 'AMADEUS').
    *   `conversationMessageRoleEnum`: ('user', 'assistant', 'system').
    *   `policyStatusEnum`: ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'PAYOUT_PENDING', 'PAID_OUT', 'CANCELLED', 'ERROR').
    *   `quoteCartItemStatusEnum`: ('ACTIVE', 'PURCHASED', 'EXPIRED', 'REMOVED').
12. **Define/Update Drizzle Relations:** Ensure all table relationships are correctly defined.
13. **Update RLS Policies for New Tables:**
    *   Create RLS policy for `user_wallets`: `CREATE POLICY "Users can access their own wallets" ON user_wallets FOR ALL USING (auth.uid() = user_id);`
    *   Create RLS policy for `quote_cart_items`: `CREATE POLICY "Users can manage their own quote cart items" ON quote_cart_items FOR ALL USING (auth.uid() = user_id OR anonymous_session_id = current_setting('app.anonymous_session_id', true));`
    *   Create RLS policy for `conversations`: `CREATE POLICY "Users can access their own conversations" ON conversations FOR ALL USING (auth.uid() = user_id OR anonymous_session_id = current_setting('app.anonymous_session_id', true));`
    *   Create RLS policy for `conversation_messages`: `CREATE POLICY "Users can access messages from their conversations" ON conversation_messages FOR ALL USING (conversation_id IN (SELECT id FROM conversations WHERE auth.uid() = user_id OR anonymous_session_id = current_setting('app.anonymous_session_id', true)));`
    *   Create RLS policy for `user_payment_methods`: `CREATE POLICY "Users can manage their own payment methods" ON user_payment_methods FOR ALL USING (auth.uid() = user_id);`
14. **Define Anonymous Session Handling Strategy:**
    *   Document anonymous session structure: `{ sessionId: string, cartItems: QuoteCartItem[], conversationId?: string, expiresAt: Date }`
    *   Plan client-side session generation and storage (localStorage/sessionStorage)
    *   Define session expiration policy (24-48 hours)
    *   Plan anonymous-to-authenticated migration strategy for cart and conversation data

**Actions & Detailed Tasks for `seed.ts`:**
1.  **Seed `providers`:** `triggerr Direct` (category: `FIRST_PARTY_INSURER`), `Parametrigger Financial Solutions` (category: `B2B_FINANCIAL_SERVICES`).
2.  **Seed Products (linked to `triggerr Direct`):** "Flight Delay Shield 60+", "Flight Delay Shield 120+".
3.  **Seed `flight_data_sources`:** `AviationStack`, `FlightAware`, `OpenSky`.
4.  **Seed Admin User** for Better-Auth.
5.  **Seed Core Reference Data:** Verify robust seeding for `countries`, `regions`, `airlines`, `airports`, `aircraft_types`, `runways`, `routes`.
6.  **Phase 3 Placeholders (Commented Out/Conditional):** `FlightHub Connect`, `Duffel`, `Amadeus` providers; "Flight Ticket" products.

### B.2. Core Project Documentation Alignment

1.  **File:** `triggerr/docs/PROJECT_CONTEXT.md`
    *   **Tasks:** Update all sections (Overview, Strategy, Architecture, Stack, State, Database, API, Flows, Security, Next Steps) to reflect `triggerr_vision.md v1.0`'s Phase 1 MVP (insurance focus, custodial wallets, specific tech choices).

2.  **File:** `triggerr/docs/MVP_todo.md`
    *   **Tasks:** Rigorously scope all tasks to Phase 1 MVP as defined in `triggerr_vision.md v1.0`. Detail tasks for custodial wallet implementation, insurance-focused conversational UI, specific policy purchase flows (Stripe, custodial PayGo), flight monitoring (for insurance), and automated payouts. Remove/defer Phase 2/3 tasks.

3.  **File:** `triggerr/docs/api/phase_1_mvp_endpoints.md`
    *   **Tasks:** Perform a final cross-check against API definitions in `triggerr_vision.md v1.0` (Section 11, Phase 1 part). Ensure endpoint `POST /api/v1/internal/flight-context-lookup` is correctly categorized and its purpose for `ConversationService` is clear.

4.  **File:** `triggerr/docs/business_structure.md`
    *   **Tasks:** Update entity roles, especially for `triggerr Direct` (MVP insurer, custodial wallet ops) and `FlightHub Connect` (Phase 3 OTA). Align revenue stream descriptions with the phased approach.

5.  **Relevant PRDs in `triggerr/docs/PRDs/` (Prioritized for MVP):**
    *   `PRD-CORE-001-Database-Schema.md`: Reflect all schema changes.
    *   `PRD-CORE-002-Authentication-Authorization.md`: Align with Better-Auth and `complete-signup` flow.
    *   `PRD-APP-001-Web-Application.md`: Update UX/UI for Phase 1 (insurance chat, custodial wallet dashboard).
    *   `PRD-BLOCKCHAIN-003-Wallet-Service.md`: CRITICAL - Detail `UserWalletService` for custodial operations: KMS encryption, ephemeral decryption for signing by backend services.
    *   `PRD-DATA-001-Flight-Data-Aggregator.md`: Clarify MVP role (insurance context/monitoring only).
    *   `PRD-ENGINE-001-Quote-Engine.md` & `PRD-ENGINE-002-Policy-Engine.md`: Align logic with custodial wallet payments and the defined policy purchase/payout flows.

### B.2.5. Schema Validation & Migration Test
*   **Critical Validation Step Before Proceeding to Development:**
    *   Run `bun run db:generate` to verify Drizzle schema compiles without errors
    *   Run `bun run db:migrate` to test migration path on development database
    *   Run `bun run db:seed` to verify all seeded data loads correctly with new schema
    *   Test RLS policies manually: Create test queries to ensure anonymous and authenticated access patterns work as expected
    *   Validate foreign key relationships and constraints
    *   Verify enum definitions are correctly implemented and used

### B.3. Document Archival
*   **Task:** Move older vision documents (`vision_update.md` drafts, `foundation_update.md`, any other superseded vision files) from `triggerr/docs/` to `triggerr/docs/archive/`.

---

## Part C: Phase 1 MVP Development Plan - File Creation & Structure

This section details where new files for API route handlers and `packages/` modules will be created or modified for Phase 1 MVP.

### C.1. API Route Handlers (within `apps/web/app/api/v1/`)

*   **Better-Auth Middleware Setup (CRITICAL FIRST STEP):**
    *   `apps/web/middleware.ts`: Implement route protection for authenticated endpoints
    *   Configure middleware to check session for `/api/v1/user/*` routes
    *   Add anonymous session handling for `/api/v1/chat/*` and `/api/v1/quotes/*` routes
    *   Set up proper error responses (401 Unauthorized) for protected routes
    *   Configure matcher patterns for protected vs. public routes
*   **Authentication (Better-Auth standard paths + custom):**
    *   `apps/web/app/api/auth/[...betterauth].ts` (or similar for Better-Auth library)
    *   `apps/web/app/api/v1/user/auth/complete-signup/route.ts`
*   **User Wallet:**
    *   `apps/web/app/api/v1/user/wallet/info/route.ts`
    *   `apps/web/app/api/v1/user/wallet/faucet/route.ts`
*   **Chat & Insurance Quoting:**
    *   `apps/web/app/api/v1/chat/message/route.ts`
    *   `apps/web/app/api/v1/insurance/quote/route.ts`
    *   `apps/web/app/api/v1/insurance/products/route.ts`
*   **Insurance Policy:**
    *   `apps/web/app/api/v1/policy/track/route.ts`
    *   `apps/web/app/api/v1/user/policies/purchase/route.ts`
    *   `apps/web/app/api/v1/user/policies/route.ts` (for listing)
    *   `apps/web/app/api/v1/user/policies/[policyId]/route.ts` (for specific policy)
*   **Webhooks:**
    *   `apps/web/app/api/v1/webhooks/stripe/route.ts`
*   **Internal System APIs:**
    *   `apps/web/app/api/v1/internal/flight-context-lookup/route.ts`
    *   `apps/web/app/api/v1/internal/monitoring/flight-status-check/route.ts`
    *   `apps/web/app/api/v1/internal/payouts/process-triggered/route.ts`

### C.2. `packages/` Directory - New Files & Refactoring Plan

*   **`packages/core/`**:
    *   `database/schema.ts`: **MODIFY** (as per B.1).
    *   `database/seed.ts`: **MODIFY** (as per B.1).
    *   `auth/`: Review/modify Better-Auth config.
    *   `auth/middleware.ts`: **CREATE** - Better-Auth middleware configuration and session utilities.
*   **`packages/shared/`**:
    *   `constants/`: **MODIFY/ADD** new constants for MVP.
    *   `notifications/`: **CREATE/EXPAND** notification logic and templates (welcome, policy confirmation, payout).
    *   `validators/`: **CREATE/EXPAND** Zod/Yup schemas for all new API request payloads.
*   **`packages/shared-types/`**: **CREATE/CONSOLIDATE** all shared TypeScript interfaces (API payloads, service DTOs, Drizzle types if not inferred directly).
*   **`packages/integrations/`**:
    *   `paygo/PayGoService.ts`: **CREATE/REPLACE**. Primary interface for PayGo (wallet ops, signing, balance checks).
    *   `stripe/StripeService.ts`: **CREATE**. For Stripe interactions (Payment Intents, webhooks).
    *   `aviationstack/AviationStackClient.ts`: **CREATE**.
    *   `flightaware/FlightAwareClient.ts`: **CREATE**.
    *   `opensky/OpenSkyClient.ts`: **CREATE**.
    *   `llm/LLMService.ts` (or e.g., `GeminiService.ts`): **CREATE**. Client for chosen LLM.
    *   `kms/KmsService.ts`: **CREATE**. Critical for encrypting/decrypting custodial private keys.
*   **`packages/services/`** (Reconciliation of existing and new):
    *   **`UserWalletService.ts`**: **CREATE (or RENAME/REFACTOR existing `wallet-service/`)**. Handles custodial wallet lifecycle (creation with KMS encryption, balance, faucet, secure signing ops).
    *   **`QuoteEngineService.ts`**: **KEEP & REFINE existing `quote-engine/`**. Focus on insurance premium calculation for `triggerr Direct`.
    *   **`PolicyService.ts`**: **CREATE (Primary Orchestrator)**. Manages policy lifecycle, purchase flows (Stripe/Custodial PayGo), escrow interactions (via `UserWalletService` for keys and `PayGoService` for chain ops), payout triggers. This will absorb and re-orchestrate logic that might have been in older `policy-engine/`, `escrow-engine/`, `payout-engine/`.
    *   **`PaymentService.ts`**: **CREATE**. Orchestrates Stripe payments, interacts with `PolicyService`.
    *   **`ConversationService.ts`**: **CREATE**. Manages chat state, LLM interactions, calls internal flight context API, calls `QuoteEngineService`.
    *   **`FlightDataService.ts`**: **CREATE**. Aggregates/normalizes data from AviationStack, etc., for insurance logic.
    *   **`FlightMonitorService.ts`**: **CREATE** (for background/scheduled tasks). Tracks flights, notifies `PolicyService` of parametric triggers.
    *   **Decommission/Archive Old `*-engine/` folders**: After logic is migrated to the new service structure, old `escrow-engine/`, `payout-engine/`, `policy-engine/` (if distinct from the new `PolicyService.ts`) should be removed or archived to avoid confusion.

---

## Part D: Next Steps After Prerequisite Updates

1.  **Begin Phase 1 API Development:** Implement the backend API endpoints as listed, utilizing the newly structured services and integrations.
2.  **Better Auth Integration:** Deep dive into integrating Better-Auth with the Next.js app, ensuring secure session management and that user context is available to protected API routes and services.
3.  **Frontend Development Planning:** Based on the MVP UX defined in `triggerr_vision.md v1.0` (Section 5, Phase 1 parts), plan and develop the frontend pages and components.
4.  **Iterative Testing:** Implement unit, integration, and end-to-end tests throughout the development process.

This comprehensive plan should provide the necessary clarity to synchronize all foundational elements and then proceed with structured development of the triggerr Phase 1 MVP.
