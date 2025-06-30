# triggerr Project File Structure & Implementation Status
Robust Data Foundation & Seeding ✅ → Better-Auth Integration

**Last Updated**: 2025-06-19
**Status**: Phase F – API Server Implementation (in progress)
**Tech Stack**: Next.js + Better-Auth + Drizzle + PayGo + Multi-Source Data

---

## 🏗️ System Architecture Overview

### **Foundation Status: ✅ COMPLETE**
- **✅ Database**: Drizzle ORM with PostgreSQL (all 14 escrow models)
- **✅ Row Level Security**: Comprehensive RLS policies with anonymous access model
- **✅ Authentication**: Better-auth with Google OAuth + Drizzle adapter
- **✅ Project Structure**: Complete monorepo with all packages
- **✅ Environment**: Better-auth + Drizzle configuration ready

### **Current Implementation Phase: F.3 – API Server Implementation**
### **Current Implementation Phase: F.3.1 API Route Structure (🚧 PARTIALLY COMPLETED)**
- **Stripe E2E Integration**: ✅ COMPLETED. All Stripe-related API routes (`webhooks/stripe`, `policy/purchase`, `user/policies/purchase`) are fully implemented and end-to-end tested.
- **Other API Routes**: 🚧 All other API routes are structured and interface-ready, but their full business logic integration and comprehensive testing is ongoing.
### **Current Implementation Phase: F.3.1 API Route Structure (🚧 PARTIALLY COMPLETED)**
- **Stripe E2E Integration**: ✅ COMPLETED. All Stripe-related API routes (`webhooks/stripe`, `policy/purchase`, `user/policies/purchase`) are fully implemented and end-to-end tested.
- **Other API Routes**: 🚧 All other API routes are structured and interface-ready, but their full business logic integration and comprehensive testing is ongoing.
- **✅ API Routes Implemented**: Core `/api/v1/` endpoints for chat (message, quote, sessions, session details, session messages, direct LLM query, LLM context, CLI, Terminal), insurance (quote, products), and policy (track, anonymous purchase), user (conversations, sync anonymous, policies, policy details, authenticated purchase).
- **✅ Better-Auth Integration**: Middleware & client components integrated and utilized in implemented API routes.
- **🚧 PayGo Wallet (API)**: Custodial wallet APIs functional for purchase flows; dedicated wallet endpoints in progress.
- **🚧 Services Wiring (API)**: API routes are designed to integrate with upcoming service layer.

### **Upcoming Work (After F.3.1 Completion)**
- **🎯 F.3.2 Critical Business Logic Services**: Implementation of Quote Engine, Policy Engine, LLM Service, Flight Data Service, Weather Service, and enhanced PayGo Service.
- **🚧 External Integrations**: Building out API clients for AviationStack, FlightAware, OpenSky, Weather APIs.
- **🚧 Data Aggregation**: Implementation of Flight & Weather aggregators.
- **🚧 Testing & Documentation**: Comprehensive unit, integration, e2e testing, and API documentation (Swagger/OpenAPI spec).
- **🚧 Admin Panel**: `apps/admin` development.

---

## 📁 Complete File Structure

### **Root Level Configuration**
```
triggerr/
├── .env.example                     # ✅ Environment template (used for local env vars)
├── .gitignore                       # ✅ Git ignore rules
├── bun.lock                         # ✅ Bun lockfile
├── components.json                  # ✅ shadcn/ui configuration
├── drizzle.config.ts                # ✅ Drizzle ORM configuration
├── LICENSE                          # ✅ Project license
├── next-env.d.ts                    # ✅ Next.js environment type definitions
├── next.config.ts                   # ✅ Next.js configuration
├── package.json                     # ✅ Root package.json with workspaces for monorepo
├── postcss.config.mjs               # ✅ PostCSS configuration for TailwindCSS
├── README.md                        # ✅ Project README and overview
├── tailwind.config.ts               # ✅ TailwindCSS configuration
└── tsconfig.json                    # ✅ TypeScript root configuration
```

### **Documentation (`docs/`) ✅ COMPREHENSIVE & UP-TO-DATE**
```
docs/
├── api/                             # 🚧 API Documentation (e.g., OpenAPI spec, usage guides)
├── archive/                         # 🗄️ Archive of older or deprecated documents
├── business_structure.md            # ✅ Business model and entity structure
├── deployment/                      # 🚧 Deployment Guides (e.g., CI/CD, hosting, monitoring setup)
├── file.md                          # 🔄 This document (Current Project Status & Structure)
├── integration/                     # 🚧 External Integrations Documentation (e.g., detailed API hooks)
├── MVP_todo.md                      # ✅ MVP specific timeline and tasks
├── paygo_test_suite_learnings.md    # ✅ Learnings from Paygo Client Test Suite
├── phase_f_completion_plan.md       # ✅ Detailed Phase F Completion Plan
├── PROJECT_CONTEXT.md               # ✅ Project context and core concepts
├── todo.md                           # ✅ High-level implementation roadmap
├── IMPROVED_MONOREPO_STRUCTURE.md    # ✅ Detailed monorepo architecture
├── triggerr_vision.md             # ✅ Overall project vision and strategic roadmap
├── project-synchrony.md              # ✅ Pre-Flight Checklist & Phase 1 MVP Development Blueprint
├── vision_foundation.md              # ✅ Detailed breakdown of initial foundation phases (A-H)
├── prds/                             # ✅ All 27 Product Requirement Documents
│   ├── PRD-CORE-001-Database-Schema.md
│   ├── PRD-CORE-002-Authentication.md
│   ├── PRD-CORE-003-Shared-Types.md
│   └── [... 24 more PRDs]
│   └── README.md
├── Integration Details (from working_tests/docs/ - copied for reference)
│   ├── paygo_test_suite_learnings.md     # ✅ Learnings from Paygo Client Test Suite
│   ├── QUOTE_SYSTEM_DOCUMENTATION.md     # ✅ Overview of Quote System Architecture
│   ├── QUOTE_GENERATION_FLOW.md          # ✅ Detailed Quote Generation Workflow
│   ├── QUOTE_CALCULATION.md              # ✅ Premium Calculation Methodology
│   ├── WEATHER_API_INTEGRATION.md        # ✅ Google/OpenWeather API Integration Details
│   ├── OPENSKY_INTEGRATION.md            # ✅ OpenSky Network API Integration Details
│   ├── FLIGHTAWARE_INTEGRATION.md        # ✅ FlightAware AeroAPI Integration Details
│   └── AVIATIONSTACK_INTEGRATION.md      # ✅ AviationStack API Integration Details
```

### **Applications (`apps/`) 🚧 PARTIAL**
```
apps/
├── web/                             # ✅ Next.js web application (main frontend)
│   ├── .dist/                       # ⚙️ Build output directory
│   ├── .next/                       # ⚙️ Next.js build cache
│   ├── node_modules/                # ⚙️ Project dependencies
│   ├── public/                      # ✅ Static assets (images, fonts, etc.)
│   ├── src/                         # ✅ Application source code
│   │   ├── app/                     # ✅ Next.js App Router structure
│   │   │   ├── api/                 # ✅ API routes (Phase F.3.1 Complete)
│   │   │   │   └── v1/              # ✅ Versioned API base path
│   │   │   │       ├── chat/        # ✅ Chat API routes
│   │   │   │       │   ├── message/ # ✅ POST /api/v1/chat/message
│   │   │   │       │   ├── quote/   # ✅ POST /api/v1/chat/quote
│   │   │   │       │   ├── sessions/ # ✅ GET /api/v1/chat/sessions
│   │   │   │       │   │   └── [id]/ # ✅ GET /api/v1/chat/sessions/:id
│   │   │   │       │   │       └── messages/ # ✅ GET /api/v1/chat/sessions/:id/messages
│   │   │   │       │   ├── model/   # ✅ LLM interaction routes
│   │   │   │       │   │   ├── query/ # ✅ POST /api/v1/chat/model/query
│   │   │   │       │   │   └── context/ # ✅ POST /api/v1/chat/model/context
│   │   │   │       │   └── interfaces/ # ✅ Chat interface routes
│   │   │   │       │       ├── cli/ # ✅ POST /api/v1/chat/interfaces/cli
│   │   │   │       │       └── terminal/ # ✅ POST /api/v1/chat/interfaces/terminal
│   │   │   │       ├── insurance/   # ✅ Insurance API routes
│   │   │   │       │   ├── quote/   # ✅ POST /api/v1/insurance/quote
│   │   │   │       │   └── products/ # ✅ GET /api/v1/insurance/products
│   │   │   │       ├── policy/      # ✅ Policy API routes
│   │   │   │       │   ├── track/   # ✅ GET /api/v1/policy/track
│   │   │   │       │   └── purchase/ # ✅ POST /api/v1/policy/purchase (anonymous)
│   │   │   │       ├── internal/    # ✅ Internal System Routes
│   │   │   │       │   ├── flight-context-lookup/ # ✅ POST /api/v1/internal/flight-context-lookup
│   │   │   │       │   ├── monitoring/ # ✅ Flight Monitoring Routes
│   │   │   │       │   │   └── flight-status-check/ # ✅ POST /api/v1/internal/monitoring/flight-status-check
│   │   │   │       │   └── payouts/ # ✅ Payout Processing Routes
│   │   │   │       │       └── process-triggered/ # ✅ POST /api/v1/internal/payouts/process-triggered
│   │   │   │       ├── user/        # ✅ User API routes
│   │   │   │       │   ├── auth/    # ✅ User authentication routes
│   │   │   │       │   │   └── complete-signup/ # ✅ POST /api/v1/user/auth/complete-signup
│   │   │   │       │   ├── conversations/ # ✅ User conversation routes
│   │   │   │       │   │   ├── route.ts # ✅ GET /api/v1/user/conversations
│   │   │   │       │   │   └── [id]/    # (Subdirectory for :id routes)
│   │   │   │       │   │       └── sync-anonymous/ # ✅ POST /api/v1/user/conversations/:id/sync-anonymous
│   │   │   │       │   ├── policies/ # ✅ User policy routes
│   │   │   │       │   │   ├── route.ts # ✅ GET /api/v1/user/policies
│   │   │   │       │   │   ├── purchase/ # ✅ POST /api/v1/user/policies/purchase (authenticated)
│   │   │   │       │   │   └── [id]/ # ✅ GET /api/v1/user/policies/:id
│   │   │   │       │   └── wallet/  # ✅ User wallet API routes
│   │   │   │       │       ├── info/ # ✅ GET /api/v1/user/wallet/info
│   │   │   │       │       ├── balance/ # ✅ GET /api/v1/user/wallet/balance
│   │   │   │       │       ├── send/ # ✅ POST /api/v1/user/wallet/send
│   │   │   │       │       ├── transactions/ # ✅ GET /api/v1/user/wallet/transactions & /:hash
│   │   │   │       │       │   └── [hash]/ # (Subdirectory for :hash routes)
│   │   │   │       │       └── escrows/ # ✅ User escrow management routes
│   │   │   │       │           ├── route.ts # ✅ GET /api/v1/user/wallet/escrows (list)
│   │   │   │       │           ├── create/ # ✅ POST /api/v1/user/wallet/escrows/create
│   │   │   │       │           ├── fulfill/ # ✅ POST /api/v1/user/wallet/escrows/fulfill
│   │   │   │       │           ├── release/ # ✅ POST /api/v1/user/wallet/escrows/release
│   │   │   │       │           └── [id]/ # ✅ GET /api/v1/user/wallet/escrows/:id
│   │   │   │       └── webhooks/    # ✅ Webhook handlers
│   │   │   │           └── stripe/  # ✅ POST /api/v1/webhooks/stripe
│   │   │   ├── auth/        # ✅ Auth routes for Next-Auth/Better-Auth
│   │   │   ├── shell/       # 🚧 Shell layout/components for app router
│   │   │   ├── test-auth/   # 🧪 Test authentication routes/pages
│   │   │   ├── error.tsx    # ✅ Root error boundary for app router
│   │   │   ├── layout.tsx   # ✅ Root layout for app router
│   │   │   └── NotFound.tsx # ✅ Not found page for app router
│   │   ├── components/      # 🔄 React components (general purpose)
│   │   │   ├── ui/          # ✅ shadcn/ui components
│   │   │   ├── auth/        # 🚧 Auth components (needs integration with API routes)
│   │   │   ├── insurance/   # ❌ Insurance-specific components (frontend UI)
│   │   │   └── layout/      # ✅ Layout components
│   │   ├── config/          # ✅ Frontend-specific configuration
│   │   ├── frontend/        # 🚧 Legacy or separate frontend entry points/assets (if applicable)
│   │   ├── lib/             # ✅ Utility libraries
│   │   │   ├── utils.ts     # ✅ General utilities
│   │   │   └── auth.ts      # ✅ Better-auth client (implemented and used by API routes)
│   │   ├── styles/          # ✅ Global styles or Tailwind CSS base
│   │   └── types/           # ✅ Frontend-specific TypeScript types
│   ├── middleware.ts        # ✅ Better-auth middleware (implemented)
│   ├── .env                 # ⚙️ Environment variables for web app (local only)
│   ├── next-env.d.ts        # ✅ Next.js environment type declarations
│   ├── next.config.js       # ✅ Next.js configuration
│   ├── package.json         # ✅ Web app dependencies
│   ├── postcss.config.js    # ✅ PostCSS configuration
│   ├── tailwind.config.js   # ✅ TailwindCSS configuration
│   └── tsconfig.json        # ✅ TypeScript config
├── admin/                           # ❌ Admin dashboard (future phase)
└── docs/                            # ❌ API documentation site (future phase)
```

### **Core Packages (`packages/core/`) ✅ FOUNDATION COMPLETE + Reference Data Seeded**
```
packages/core/
├── database/                        # ✅ COMPLETE - Drizzle implementation
│   └── seedfiles/                   # ✅ Data files for database seeding
│   ├── schema.ts                    # ✅ Complete schema with all tables and enums
│   ├── index.ts                     # ✅ Database client export
│   ├── migrate.ts                   # ✅ Migration utilities
│   ├── seed.ts                      # ✅ Seed data
│   ├── RLS_sql.txt                  # ✅ Row Level Security policies
│   └── package.json                # ✅ Database dependencies
├── logging/                         # ✅ Logger utility
├── auth/                            # ✅ COMPLETE - Better-auth setup (server and client)
│   ├── index.ts                     # ✅ Better-auth server config & utilities
│   ├── client.ts                    # ✅ Better-auth client config
│   └── package.json                # ✅ Auth dependencies
├── types/                           # ✅ COMPLETE - Types are defined elsewhere (api-contracts, shared)
│   ├── database.ts                  # ✅ Drizzle-generated types
│   ├── api.ts                       # ❌ (Redundant - types from api-contracts)
│   ├── insurance.ts                 # ❌ (Redundant - types from api-contracts)
│   └── package.json                # ✅ Types dependencies
└── utils/                           # 🔄 PARTIAL - Core utilities
    ├── validation.ts                # 🚧 (Move to packages/shared/validators)
    ├── constants.ts                 # 🚧 (Move to packages/shared/constants)
    └── package.json                 # ✅ Utils dependencies
```

### **Business Services (`packages/services/`) 🚧 PARTIAL (Planned for F.3.2)**
```
packages/services/
├── chat-service/                    # 🚧 PLANNED (foundation to add in F.3.2)
├── quote-engine/                    # 🚧 PLANNED – pricing logic scaffolding (F.3.2)
│   ├── src/
│   │   ├── calculator.ts            # 🚧 PLANNED: Premium calculation logic
│   │   ├── risk-assessment.ts       # 🚧 PLANNED: Multi-factor risk analysis
│   │   └── provider-pricing.ts      # 🚧 PLANNED: Provider-specific rules
│   └── package.json
├── policy-engine/                   # 🚧 PLANNED: Policy lifecycle management (F.3.2)
│   ├── src/
│   │   ├── creator.ts               # 🚧 PLANNED: Policy creation from quotes
│   │   ├── manager.ts               # 🚧 PLANNED: Policy status tracking
│   │   └── escrow-integration.ts    # 🚧 PLANNED: Escrow manager integration
│   └── package.json
├── payout-engine/                   # 🚧 PLANNED: Automated payout processing (F.3.2)
│   ├── src/
│   │   ├── monitor.ts               # 🚧 PLANNED: Flight status monitoring
│   │   ├── processor.ts             # 🚧 PLANNED: Payout calculation and execution
│   │   └── escrow-release.ts        # 🚧 PLANNED: Multi-escrow model handling
│   └── package.json
├── provider-service/                # ❌ NOT IMPLEMENTED (future phase)
│   ├── src/
│   │   ├── onboarding.ts            # ❌ Provider registration
│   │   ├── wallet-manager.ts        # ❌ Provider wallet operations
│   │   └── escrow-config.ts         # ❌ Escrow model selection
│   └── package.json
└── user-service/                    # ❌ NOT IMPLEMENTED (future phase)
    ├── src/
    │   ├── profile.ts               # ❌ User profile management
    │   └── preferences.ts           # ❌ User preferences
    └── package.json
```

### **Data Aggregation (`packages/aggregators/`) 🚧 PARTIAL (Planned for F.3.2)**
```
packages/aggregators/
├── flight-aggregator/               # 🚧 PLANNED: Multi-source flight data (F.3.2)
│   ├── src/
│   │   ├── aggregator.ts            # 🚧 PLANNED: Main aggregation logic
│   │   ├── source-router.ts         # 🚧 PLANNED: Intelligent source selection
│   │   ├── conflict-resolver.ts     # 🚧 PLANNED: Data conflict resolution
│   │   └── cache-manager.ts         # 🚧 PLANNED: Multi-layer caching
│   └── package.json
├── weather-aggregator/              # 🚧 PLANNED: Weather data integration (F.3.2)
│   ├── src/
│   │   ├── collector.ts             # 🚧 PLANNED: Weather data collection
│   │   └── risk-analyzer.ts         # 🚧 PLANNED: Weather risk assessment
│   └── package.json
└── data-router/                     # ❌ NOT IMPLEMENTED (future phase)
    ├── src/
    │   ├── health-checker.ts         # ❌ Source health monitoring
    │   ├── cost-optimizer.ts         # ❌ Cost optimization logic
    │   └── fallback-manager.ts       # ❌ Automatic failover
    └── package.json
```

### **External Integrations (`packages/integrations/`) ✅ STRIPE COMPLETE (Others Partial / Planned for F.3.2)**
```
packages/integrations/
├── stripe/                          # ✅ COMPLETE: Stripe payment processing
│   ├── src/
│   │   ├── client.ts                # ✅ Stripe client initialization and configuration
│   │   ├── index.ts                 # ✅ Main exports and type definitions
│   │   ├── payment-service.ts       # ✅ Payment processing logic
│   │   └── webhook-handler.ts       # ✅ Webhook event handling
│   ├── package.json                 # ✅ @triggerr/stripe package
│   └── tsconfig.json                # ✅ TypeScript configuration
├── aviationstack/                   # 🚧 PLANNED: Primary flight data (F.3.2)
│   ├── src/
│   │   ├── client.ts                # 🚧 PLANNED: AviationStack API client
│   │   ├── transformer.ts           # 🚧 PLANNED: Data transformation
│   │   └── rate-limiter.ts          # 🚧 PLANNED: Rate limiting logic
│   ├── package.json
│   └── README.md                    # 🚧 PLANNED: Integration documentation
├── flightaware/                     # 🚧 PLANNED: Premium flight data (F.3.2)
│   ├── src/
│   │   ├── client.ts                # 🚧 PLANNED: FlightAware API client
│   │   ├── real-time.ts             # 🚧 PLANNED: Real-time tracking
│   │   └── premium-features.ts      # 🚧 PLANNED: Premium API features
│   └── package.json
├── opensky/                         # 🚧 PLANNED: Backup flight data (F.3.2)
│   ├── src/
│   │   ├── client.ts                # 🚧 PLANNED: OpenSky API client
│   │   ├── crowd-sourced.ts         # 🚧 PLANNED: Crowd-sourced data processing
│   │   └── fallback.ts              # 🚧 PLANNED: Backup data source logic
│   └── package.json
├── weather-apis/                    # 🚧 PLANNED: Weather data sources (F.3.2)
│   ├── src/
│   │   ├── google-weather.ts         # 🚧 PLANNED: Google Weather API
│   │   ├── airport-weather.ts        # 🚧 PLANNED: Airport-specific data
│   │   └── risk-factors.ts           # 🚧 PLANNED: Weather risk calculation
│   └── package.json
└── llm-apis/                        # 🚧 PLANNED: LLM client integrations (F.3.2)
    ├── src/
    │   ├── deepseek.ts              # 🚧 PLANNED: DeepSeek API client
    │   ├── custom-llm.ts            # 🚧 PLANNED: Custom/Self-hosted LLM wrapper
    │   └── index.ts                 # 🚧 PLANNED: LLM client exports/orchestration
    └── package.json
```

### **Blockchain Integration (`packages/blockchain/`) 🚧 PARTIAL (Planned for F.3.2)**
```
packages/blockchain/
├── paygo-adapter/                   # 🚧 PayGo blockchain integration (via PayGoClientService in F.4.1)
│   ├── src/
│   │   ├── client.ts                # 🚧 PayGo client wrapper (will integrate PaygoClientService)
│   │   ├── escrow-ops.ts            # 🚧 Escrow operations (leveraging PaygoClientService)
│   │   └── transaction-handler.ts   # 🚧 PLANNED: Transaction management
│   └── package.json
├── escrow-manager/                  # 🚧 Multi-escrow model support (SingleSidedEscrowEngine is done)
│   ├── src/
│   │   ├── model-selector.ts        # 🚧 Escrow model selection (Factory is done)
│   │   ├── multi-escrow.ts          # 🚧 PLANNED: Support for all 14 models (conceptually via factory, full implementation in F.3.2)
│   │   └── provider-escrow.ts       # ❌ NOT IMPLEMENTED (future phase)
│   └── package.json
└── blockchain-interface/            # ❌ NOT IMPLEMENTED (future phase)
    ├── src/
    │   ├── abstract-chain.ts         # ❌ Blockchain abstraction layer
    │   └── transaction-types.ts      # ❌ Transaction type definitions
    └── package.json
```

### **API Layer (`packages/api/`) ✅ COMPLETED (Contracts & SDK Restructured)**

Core packages for API contracts and client SDK implementation. This layer provides type safety and a consistent interface for all API interactions.

```
packages/api/
├── contracts/                   # ✅ COMPLETED (Phase F.1) - API Contracts & Schemas
│   ├── src/
│   │   ├── dtos/                    # ✅ Data Transfer Objects (DTOs) for API requests/responses
│   │   │   ├── chat.ts             # Chat-related DTOs (messages, sessions)
│   │   │   ├── common.ts           # Shared DTOs (pagination, sorting, filtering)
│   │   │   ├── insurance.ts        # Insurance product and quote DTOs
│   │   │   ├── policy.ts           # Policy management DTOs
│   │   │   ├── user.ts             # User profile and authentication DTOs
│   │   │   └── wallet.ts           # Wallet and transaction DTOs
│   │   │
│   │   ├── schemas/                 # Core schemas and type definitions
│   │   │   ├── api-version.ts      # API versioning schema
│   │   │   └── index.ts            # Schema exports
│   │   │
│   │   └── validators/              # Zod validation schemas
│   │       ├── chat.validator.ts   # Chat request/response validation
│   │       ├── common.validator.ts # Shared validation utilities
│   │       ├── insurance.validator.ts # Insurance data validation
│   │       ├── policy.validator.ts # Policy validation
│   │       ├── user.validator.ts   # User data validation
│   │       └── wallet.validator.ts # Wallet operations validation
│   │
│   ├── package.json                 # @triggerr/api-contracts package
│   ├── README.md                     # Package documentation
│   └── tsconfig.json                # TypeScript configuration
│
├── sdk/                         # ✅ COMPLETED (Phase F.2) - TypeScript SDK
│   ├── src/
│   │   ├── client/                  # Core HTTP client implementation
│   │   │   ├── api-client.ts        # Base API client with request/response handling
│   │   │   ├── auth-provider.ts     # Authentication and token management
│   │   │   ├── error-handler.ts     # Error handling and transformation
│   │   │   ├── http-client.ts       # HTTP request/response handling
│   │   │   └── retry-strategy.ts    # Request retry logic
│   │   │
│   │   ├── services/                # API service clients
│   │   │   ├── admin/               # Admin API client
│   │   │   ├── chat/                # Chat API client
│   │   │   ├── insurance/           # Insurance API client
│   │   │   ├── policy/              # Policy management client
│   │   │   ├── user/                # User management client
│   │   │   └── wallet/              # Wallet operations client
│   │   │
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── api.types.ts        # API response types
│   │   │   ├── common.types.ts     # Shared type definitions
│   │   │   └── ...
│   │   │
│   │   ├── utils/                  # Utility functions
│   │   │   ├── formatters.ts       # Data formatting utilities
│   │   │   └── validators.ts       # Runtime validation
│   │   │
│   │   └── index.ts                # Public API exports
│   │
│   ├── package.json                 # @triggerr/api-sdk package
│   ├── README.md                     # SDK documentation
│   └── tsconfig.json                # TypeScript configuration
│
├── public-api/                  # ❌ DEPRECATED - API routes moved to `apps/web/app/api/v1/`
│   └── package.json
│
└── provider-api/                # ❌ PLANNED - External provider API integration (Future Phase)
│   └── package.json
│
└── webhook-api/                # ❌ PLANNED - Webhook handling for external services (Future Phase)
    └── package.json
```

### **Shared Packages (`packages/shared/`) ✅ COMPLETE (Core Shared Assets)**
```
packages/shared/
├── types/                           # ✅ COMPLETE - Canonical models, API types, etc.
│   ├── canonical-models.ts          # ✅ Canonical data models (Flight, Weather)
│   ├── api-types.ts                 # ✅ API request/response types (from api-contracts)
│   ├── auth-types.ts                # ✅ Authentication related types
│   ├── business-types.ts            # ✅ Business domain types
│   ├── chat-types.ts                # ✅ Chat related types
│   └── index.ts                     # ✅ Type exports
├── ui/                              # ✅ UI components (shadcn/ui)
│   ├── src/
│   │   ├── components/              # ✅ Reusable UI components
│   │   └── styles/                  # ✅ Shared styles
│   └── package.json                # ✅ UI dependencies
├── utils/                           # 🚧 PARTIAL - Utility functions
│   ├── src/
│   │   ├── format.ts                # 🚧 PLANNED: Data formatting utilities
│   │   ├── validation.ts            # 🚧 PLANNED: Validation helpers
│   │   └── crypto.ts                # 🚧 PLANNED: Cryptographic utilities
│   └── package.json
├── constants/                       # ✅ COMPLETE - Application constants
│   ├── src/
│   │   ├── insurance.ts             # 🚧 Insurance-related constants
│   │   ├── api.ts                   # 🚧 API constants
│   │   └── escrow-models.ts         # 🚧 Escrow model definitions
│   └── package.json
├── validators/                      # 🚧 COMPLETE - Data validation schemas
│   ├── src/
│   │   ├── insurance.ts             # 🚧 Insurance validation schemas
│   │   ├── api.ts                   # 🚧 API validation schemas
│   │   └── user.ts                  # 🚧 User validation schemas
│   ├── chat.ts                      # 🚧 Chat validation schemas
│   ├── common.ts                    # 🚧 Common validation schemas
│   ├── policy.ts                    # 🚧 Policy validation schemas
│   ├── wallet.ts                    # 🚧 Wallet validation schemas
│   └── package.json
└── notifications/                   # ❌ NOT IMPLEMENTED (future phase)
    ├── src/
    │   ├── email.ts                 # ❌ Email notifications
    │   ├── sms.ts                   # ❌ SMS notifications
    │   └── push.ts                  # ❌ Push notifications
    └── package.json
```

### **Configuration (`packages/config/`) ✅ COMPLETE**
```
packages/config/
├── src/
│   ├── env.ts                       # ✅ Environment configuration
│   ├── database.ts                  # ✅ Database configuration
│   ├── stripe.ts                    # ✅ Stripe environment configuration
│   └── index.ts                     # ✅ Main exports for config package
│   ├── auth.ts                      # ✅ Authentication configuration
│   ├── api.ts                       # 🚧 PLANNED: API configuration (needs service endpoint mapping)
│   ├── blockchain.ts                # 🚧 PLANNED: Blockchain configuration
│   ├── integrations.ts              # 🚧 PLANNED: External Integrations configuration (API keys, etc.)
│   └── llm.ts                       # 🚧 PLANNED: LLM service configuration
└── package.json                     # ✅ Config dependencies
```

### **Infrastructure (`packages/infrastructure/`) ❌ NOT IMPLEMENTED (Future Phase)**
```
packages/infrastructure/
├── scheduler/                       # ❌ Task scheduling
│   ├── src/
│   │   ├── cron-jobs.ts             # ❌ Cron job definitions
│   │   ├── flight-monitor.ts        # ❌ Flight monitoring scheduler
│   │   └── payout-processor.ts      # ❌ Payout processing scheduler
│   └── package.json
├── monitoring/                      # ❌ Health checks & metrics
│   ├── src/
│   │   ├── health-checks.ts         # ❌ System health monitoring
│   │   ├── metrics.ts               # ❌ Performance metrics
│   │   └── alerts.ts                # ❌ Alert system
│   └── package.json
└── logging/                         # ❌ (Moved to packages/core/logging and packages/services/audit-service)
    ├── src/
    │   ├── logger.ts                # ❌ Structured logger (Core already has basic logging)
    │   ├── audit.ts                 # ❌ Audit logging
    │   └── performance.ts           # ❌ Performance logging
    └── package.json
```

### **Development Tools (`tools/`) ❌ NOT IMPLEMENTED (Future Phase)**
```
tools/
├── scripts/                         # ❌ Build & deployment scripts
│   ├── build.sh                     # ❌ Build script
│   ├── deploy.sh                    # ❌ Deployment script
│   └── setup.sh                     # ❌ Environment setup
├── generators/                      # ❌ Code generators
│   ├── component-generator.ts       # ❌ Component generator
│   └── api-generator.ts             # ❌ API generator
└── testing/                         # ❌ Testing utilities
    ├── setup.ts                     # ❌ Test environment setup
    └── helpers.ts                   # ❌ Test helper functions
```

---

## 📊 Implementation Status by Category

### **✅ COMPLETE (Ready for Use)**
- **Database Schema**: Complete Drizzle implementation with all tables and enums
- **Authentication Configuration**: Better-auth with Google OAuth + Drizzle adapter
- **Project Structure**: Monorepo with core packages and apps established
- **Environment Setup**: Development environment configured
- **F.1 API Contracts**: `packages/api/contracts` (Canonical Models, API, Auth, Business, Chat)
- **F.2 API SDK**: `packages/api/sdk` development
- **Shared Types**: `packages/shared/types/` (Canonical Models, API, Auth, Business, Chat)
- **Shared Constants**: `packages/shared/constants/` (Insurance, API, Escrow Models)
- **Shared Validators**: `packages/shared/validators/` (Insurance, API, User)
- **Core Auth**: `packages/core/auth/` (Better-auth server & client config, utilities)
- **Core Database**: `packages/core/database/` (Drizzle, migrations, seeding, RLS)
- **Web App Middleware**: `apps/web/src/middleware.ts` (Better-auth, anonymous session)
- **Web App Core API Routes (F.3.1 - Core Set)**:
    - `/api/v1/chat/message`
    - `/api/v1/chat/quote`
    - `/api/v1/chat/sessions` (list)
    - `/api/v1/chat/sessions/[id]` (details)
    - `/api/v1/chat/sessions/[id]/messages` (messages)
    - `/api/v1/chat/model/query` (direct LLM)
    - `/api/v1/chat/model/context` (context injection)
    - `/api/v1/chat/interfaces/cli`
    - `/api/v1/chat/interfaces/terminal`
    - `/api/v1/insurance/quote`
    - `/api/v1/insurance/products`
    - `/api/v1/policy/track`
    - `/api/v1/policy/purchase` (anonymous)
    - `/api/v1/user/auth/complete-signup`
    - `/api/v1/user/conversations` (list)
    - `/api/v1/user/conversations/[id]/sync-anonymous`
    - `/api/v1/user/policies` (list)
    - `/api/v1/user/policies/[id]` (details)
    - `/api/v1/user/policies/purchase` (authenticated)
- **Configuration**: `packages/config/` (Env, DB, Auth, API, Blockchain configs)

### **🚧 PARTIAL (In Progress / Planned for Immediate Next Steps)**
- **Business Services (`packages/services/`)**: Planning complete, implementation to begin in F.3.2.
- **Data Aggregation (`packages/aggregators/`)**: Planning complete, implementation to begin in F.3.2.
- **External Integrations (`packages/integrations/`)**: Planning complete for core API clients (Flight, Weather, LLM), implementation to begin in F.3.2.
- **Blockchain Integration (`packages/blockchain/`)**: Planning complete for PayGo adapter and escrow manager, implementation to begin in F.3.2.
- **Frontend Applications (`apps/web/`)**: Core app structure complete, specific pages and components (dashboard, quote flow, policies, auth components) are placeholders or partial.
- **Shared Utilities (`packages/shared/utils/`)**: To be implemented as needed by services.

### **❌ NOT IMPLEMENTED (Future Phases / Low Current Priority)**
- **Admin Application (`apps/admin/`)**: Full admin dashboard.
- **API Documentation Site (`apps/docs/`)**: Swagger/OpenAPI UI.
- **Shared Notifications (`packages/shared/notifications/`)**: Email, SMS, Push notification services.
- **Infrastructure (`packages/infrastructure/`)**: Scheduling, monitoring, advanced logging.
- **Development Tools (`tools/`)**: Build scripts, code generators, advanced testing utilities.
- **Provider Management APIs (`packages/api/provider-api/`)**: B2B interfaces.
- **Webhook Management APIs (`packages/api/webhook-api/`)**: Centralized webhook management.

---

## 🎯 Next Implementation Steps

### **CURRENT PRIORITY: Phase F.3.1 API Route Structure - ✅ COMPLETE**

### **NEXT MAJOR PHASE: F.3.2 Critical Business Logic Services (Commencing Now)**

#### **Core Service Implementation**
- **LLM Service**: Integration with DeepSeek (initial) and custom LLM development (`packages/integrations/llm-apis`, `packages/services/chat-service`)
- **Flight Data Service**: Aggregation from AviationStack, FlightAware, OpenSky (`packages/integrations`, `packages/aggregators/flight-aggregator`, `packages/services/flight-data-service`)
- **Weather Service**: Integration with Google Weather, OpenWeather for risk assessment (`packages/integrations/weather-apis`, `packages/aggregators/weather-aggregator`, `packages/services/weather-service`)
- **PayGo Service (Enhanced)**: Production-ready PayGo client and escrow management (`packages/blockchain/paygo-adapter`, `packages/blockchain/escrow-manager`, `packages/services/paygo-service`)
- **Policy Engine**: Comprehensive policy lifecycle, claim evaluation, payout orchestration (`packages/services/policy-engine`)
- **Quote Engine**: Advanced risk calculation and premium generation (`packages/services/quote-engine`)
- **Flight Monitoring Service**: Background worker for real-time flight status and payout triggers (`packages/infrastructure/scheduler`, `packages/services/flight-monitor-service`)

#### **Frontend Components (Parallel Development)**
- **Authentication Components**: Sign-in/out UI, user profile.
- **Insurance Flows**: Quote generation UI, policy dashboard, tracking pages.
- **Chat Interface**: Full chat UI integration with backend.

---

## 🔗 Key Dependencies

### **Critical Path (Current Week)**
1. **Better-Auth Middleware** → API Routes → Frontend Components
2. **External API Clients** → Data Aggregation → Business Engines
3. **PayGo Integration** → Escrow Manager → Policy Engine
4. **Business Engines** → API Endpoints → Frontend UI

### **Parallel Development Possible**
- External API clients can be developed independently
- UI components can be built alongside business logic
- Testing frameworks can be set up in parallel
- Documentation can be updated continuously

---

## 📚 Reference Materials

### **Working Code Patterns (Ready to Port)**
- `working_tests/test-paygo-full.js` → PayGo integration patterns
- `working_tests/testAviationstack.js` → AviationStack client implementation
- `working_tests/testFlightAware.js` → FlightAware client implementation
- `working_tests/testOpensky.js` → OpenSky client implementation
- `working_tests/testWeather.js` → Weather API client implementation

### **Technical Specifications**
- All 27 PRDs in `docs/prds/` with complete implementation specs
- Database schema in `packages/core/database/schema.ts`
- Better-auth configuration in `packages/core/auth/index.ts`
- Environment configuration in `packages/config/src/env.ts`

### **Key Technologies**
- **✅ Database**: PostgreSQL + Drizzle ORM (implemented)
- **✅ Authentication**: Better-auth + Google OAuth (implemented)
- **Backend**: Next.js API Routes + Better-auth middleware
- **Frontend**: Next.js + Better-auth client + TailwindCSS + shadcn/ui
- **Blockchain**: PayGo Protocol (@witnessco/paygo-ts-client)
- **External APIs**: AviationStack + FlightAware + OpenSky + Weather

---

## 🚀 Current Week Focus (Week [Current Week Number]) - Continuously Updated

### **CURRENT PRIORITY: Phase F.3.1 API Route Structure - 🚧 PARTIALLY COMPLETED**
- **Stripe E2E Integration**: ✅ COMPLETED. Tested end-to-end at the package and API route levels.
- **Other API Routes**: 🚧 Structure complete, but full testing and integration of business logic for these endpoints is still required.

### **UPCOMING FOCUS: F.3.2 Critical Business Logic Services**
- **Goal:** Begin implementing core business logic services that the API routes will call.
- **Status:** Planning complete, ready to commence after F.3.1.

### **Success Criteria (F.3.1 Completion)**
- [ ] All API routes defined in F.3.1 are implemented with proper input validation, authentication checks, and database interaction (or mock service calls).
- [ ] API responses adhere to `@triggerr/api-contracts`.
- [ ] Basic internal testing confirms route functionality.
- [ ] API endpoints require authentication and return user context
- [ ] Frontend shows authenticated state and user information
- [ ] Session management works across page refreshes and navigation

---

**🎯 Implementation Status**: Foundation complete (database + auth), business logic implementation starting

**⏰ Timeline**: 6-8 weeks remaining to MVP with marketplace foundation

**🔑 Success Factor**: Complete better-auth integration this week to unblock business logic development
