# triggerr: Parametric Insurance - Vision v2.0

**Document Version**: 2.0
**Last Updated**: June 15, 2025
**Status**: Master Architectural Blueprint (Definitive Source of Truth)
**Primary Goal**: Build and launch `triggerr.com` as the leading parametric insurance platform with a chat-based interface, custodial PayGo wallets, and automated payouts (Phase 1), expand with new products and wallet self-custody (Phase 2), and integrate flight booking via `FlightHub Connect` (Phase 3).

---

## Table of Contents

1. **Executive Summary & Strategic Vision**
   - Strategic Objectives
   - Phased Approach Overview
2. **Strategic Overview & Core Principles**
   - Phased Rollout Strategy
   - Brand Positioning & Key Differentiators
   - Anonymous-to-Authenticated User Journey
3. **Business Model & Entity Structure**
   - Platform Strategy & Revenue Streams
   - Entity Roles & Operations
   - Regulatory Compliance & Risk Management
4. **API Architecture & Endpoints**
   - API-First Architecture Principles
   - Public APIs (Anonymous Access)
   - Authenticated APIs (User Management)
   - Internal APIs (System Use)
   - B2B Integration APIs
   - API Tracking & Versioning
   - Phase-Based API Rollout
5. **User Experience & Interface Design**
   - Chat-First Interface Architecture
   - Three-Panel Layout System
   - Key Pages & UI Components
   - Mobile-First Responsive Design
   - User Dashboard & Anonymous Policy Tracking
   - Footer Design
6. **Technical Architecture**
   - Technology Stack & Project Structure
   - Data Flow Architecture
   - Security Model (RLS + Better-Auth)
7. **Database Architecture**
   - Core Philosophy & Schema Overview
   - Key Table Definitions
   - Enum Definitions
   - Reference Data & Seeding Strategy
   - Row Level Security (RLS) Implementation
8. **Core User Flows**
   - Phase 1 (Insurance Platform Launch)
   - Phase 2 (Enhanced Features & Wallet Evolution)
   - Phase 3 (FlightHub Connect OTA Integration)
9. **PayGo Wallet Management**
   - Custodial Wallet (Phase 1)
   - Phase 2 Evolution (Self-Custody & External Wallets)
   - Security Architecture
   - Faucet Functionality (Alpha/Testnet)
10. **Payment Integration Strategy**
    - Multi-Provider Architecture
    - Fiat-to-Crypto & Direct Crypto Flows
    - Flight Payments (Phase 3)
11. **Conversational AI (LLM Integration)**
    - Phase 1 Scope
    - Phase 2 Enhancements
    - Phase 3 Scope (OTA Integration)
    - Technology & Data Storage
12. **Flight Data & Booking APIs**
    - Phase 1 (Insurance Monitoring)
    - Phase 3 (OTA - FlightHub Connect)
13. **Analytics & Reporting**
    - Phase 2 Analytics Scope
    - User Behavior & Market Intelligence
    - Provider & Platform Dashboards
14. **Implementation Roadmap & Timeline**
    - Phase 1 (Months 1-4)
    - Phase 2 (Months 5-8)
    - Phase 3 (Months 9-14)
15. **Future Considerations & Advanced Features**

---

## 1. Executive Summary & Strategic Vision

### Strategic Objectives
triggerr aims to revolutionize parametric insurance by launching `triggerr.com` as a user-friendly, chat-based platform specializing in flight delay insurance, with plans to expand into a comprehensive travel ecosystem. Key objectives:
- **Phase 1**: Launch a parametric insurance platform with a Chat0-inspired interface, custodial PayGo wallets, and automated payouts, establishing `triggerr` as "The Parametric Insurance Experts."
- **Phase 2**: Introduce new insurance products (baggage delay, weather disruptions), enable wallet self-custody, onboard third-party insurers, and implement advanced analytics.
- **Phase 3**: Integrate flight booking via `FlightHub Connect` (independent OTA at `flighthubconnect.com`), offering bundled insurance and flight purchases.
- **Long-Term**: Expand into DeFi, NFT-based policies, and a full travel ecosystem (hotels, car rentals).

### Phased Approach Overview
- **Phase 1 (Months 1-4)**: Build core insurance platform with API-first architecture, focusing on flight delay insurance, custodial wallets, and conversational AI.
- **Phase 2 (Months 5-8)**: Enhance with new products, wallet self-custody, external wallet linking, and analytics for B2B growth.
- **Phase 3 (Months 9-14)**: Launch `FlightHub Connect` for flight booking, integrated with `triggerr.com`.

---

## 2. Strategic Overview & Core Principles

### Phased Rollout Strategy

#### Phase 1: Insurance Platform Launch (Months 1-4)
- **Goal**: Establish `triggerr.com` as the premier platform for parametric flight delay insurance.
- **Key Features**:
  - Chat-based interface for quoting and purchasing.
  - Anonymous browsing with seamless authentication.
  - Custodial PayGo wallets for payouts and payments.
  - Real-time flight monitoring (AviationStack, FlightAware, OpenSky).
  - Automated payouts via PayGo escrows.
  - API-first architecture for B2B integration.
- **Brand**: `triggerr` - "The Parametric Insurance Experts."

#### Phase 2: Enhanced Features & Wallet Evolution (Months 5-8)
- **Goal**: Broaden insurance offerings, empower users with wallet control, and enable B2B growth.
- **Key Features**:
  - New parametric products (baggage delay, weather disruptions).
  - Secure private key export and self-custody education.
  - External PayGo wallet linking.
  - Advanced conversational AI (context retention, complex queries).
  - Third-party insurer onboarding (pilot).
  - Analytics: User behavior, market intelligence, dashboards.
  - Predictive delay alerts (beta).
  - B2B APIs for providers and white-label platforms.

#### Phase 3: OTA Integration - FlightHub Connect Launch (Months 9-14)
- **Goal**: Integrate flight booking under `FlightHub Connect` at `flighthubconnect.com`.
- **Key Features**:
  - Unified flight and insurance search.
  - Flight booking via Duffel (primary) and Amadeus (secondary) APIs.
  - Bundled flight + insurance purchases.
  - Dedicated UI section on `triggerr.com`.
  - B2B provider portal and white-label APIs.

### Brand Positioning & Key Differentiators
- **Brand Identity**: `triggerr` - "The Parametric Insurance Experts."
- **Tagline**: "Flight Delays, Instantly Covered."
- **Key Differentiators**:
  - **Conversational First**: Chat-based interface inspired by Chat0.
  - **Automatic Payouts**: Transparent PayGo escrows.
  - **User Simplicity**: Anonymous quoting, custodial wallets (Phase 1) evolving to self-custody.
  - **Insurance Specialization**: Focused parametric expertise.
  - **API-First**: Robust APIs for B2B and x402 compatibility.
  - **Transparency**: Clear terms, verifiable escrow transactions.

### Anonymous-to-Authenticated User Journey
- **Anonymous Experience**:
  - Search and receive quotes via natural language.
  - Temporary conversation history in browser localStorage.
  - Save quotes to Insurance Navigator (cart-like).
  - Track policies via verification code on `/track-policy`.
- **Authentication Triggers**:
  - Policy purchase, saving quotes/history, accessing dashboard/wallet.
- **Post-Authentication Benefits**:
  - Persistent conversation history in `conversations` table.
  - Custodial wallet creation, external wallet linking (Phase 2).
  - Personalized recommendations and saved policies.
  - Seamless sync of anonymous data to user account.

---

## 3. Business Model & Entity Structure

### Platform Strategy & Revenue Streams
- **Primary Revenue**:
  - **Platform Commission**: 15-25% on third-party insurer premiums.
  - **Direct Insurance**: 100% of `triggerr Direct` premiums minus reinsurance costs.
  - **Data Licensing**: Anonymized risk data to airlines/airports.
  - **API Access**: B2B parametric insurance APIs via Preterag Financial Solutions.
  - **B2B Financial Services**: SaaS, consulting, white-label platforms.
  - **Flight Bookings (Phase 3)**: Booking fees and insurance cross-selling via `FlightHub Connect`.

### Entity Roles & Operations
1. **triggerr (Platform & Technology)**:
   - Operates `triggerr.com`, chat interface, and marketplace.
   - Manages technology (APIs, AI, PayGo), user acquisition, and analytics.
   - Revenue: Commissions, API licensing, data products.
   - Domain: `triggerr.com`.
2. **triggerr Direct (First-Party Insurer)**:
   - Underwrites parametric flight delay (Phase 1) and new products (Phase 2).
   - Manages risk models, compliance, and operational PayGo wallet.
   - Revenue: Premiums minus reinsurance/operational costs.
   - Domain: `direct.triggerr.com` (B2B/regulatory interface).
3. **Preterag Financial Solutions (B2B Financial Services)**:
   - Offers API-as-a-Service, white-label platforms, risk analytics, compliance consulting.
   - Targets: Travel agencies, airlines, corporate travel firms.
   - Revenue: SaaS fees, revenue sharing, analytics subscriptions.
4. **FlightHub Connect (OTA Entity - Phase 3)**:
   - Independent OTA at `flighthubconnect.com` for flight search and booking.
   - Integrates with `triggerr.com` for unified experience.
   - Revenue: Booking fees, insurance cross-selling.

### Regulatory Compliance & Risk Management
- **Insurance Licensing**:
  - `triggerr Direct` to secure licenses for parametric insurance in target markets (US, EU, UK).
  - Compliance with NAIC (US), EIOPA (EU), and FCA (UK) regulations.
  - Coordinate with reinsurers for capital requirements.
- **Data Privacy**:
  - GDPR compliance: Data minimization, user consent, right to erasure, data portability.
  - CCPA (California) and PIPEDA (Canada) for additional markets.
  - Encryption at rest/transit, anonymized analytics.
- **Blockchain Compliance**:
  - AML/KYC for PayGo transactions, especially for external wallet linking.
  - Audit trails for escrow creation/payouts, compliant with FinCEN (US) and FATF standards.
- **OTA Compliance (Phase 3)**:
  - `FlightHub Connect` to secure IATA accreditation and comply with seller of travel laws.
  - PCI DSS for payment processing.
- **Risk Management**:
  - Reinsurance partnerships to mitigate underwriting risk.
  - Regular security audits of APIs, wallet management, and KMS.
  - Business continuity plans for API downtime, data breaches, or regulatory changes.

---

## 4. API Architecture & Endpoints

### API-First Architecture Principles
- **Design**: RESTful APIs with JSON payloads, versioned (`/api/v1/`), documented via OpenAPI/Swagger.
- **B2B Focus**: APIs support third-party insurers, travel agencies, and white-label platforms, with extensibility for x402 (API orchestration standard).
- **Scalability**: Rate limiting, caching, async processing via message queues (e.g., RabbitMQ).
- **Security**: JWT-based authentication, RLS, OWASP-compliant validation.
- **Tracking**: Logs (request/response, status, latency), metrics (usage, errors), and analytics integration.
- **Deployment**: APIs in `apps/web/app/api/v1/`, containerized with Docker, orchestrated via Kubernetes.

### Public APIs (Anonymous Access)
```typescript
// POST /api/v1/public/chat/message
interface ChatMessageRequest {
  message: string;
  conversationId?: string;
  anonymousSessionId?: string;
}
interface ChatMessageResponse {
  response: string;
  conversationId: string;
  insuranceCards?: InsuranceCard[];
  flightData?: FlightInformation;
  suggestedQuestions?: string[];
}

// POST /api/v1/public/insurance/quote
interface QuoteRequest {
  flightNumber: string;
  departureDate: string;
  passengers: number;
  coveragePreferences?: {
    maxPremium?: number;
    minCoverage?: number;
    triggerTime?: number; // Hours of delay
  };
}
interface QuoteResponse {
  quotes: InsuranceQuote[];
  flightRisk: RiskAssessment;
  recommendations: string[];
}

// GET /api/v1/public/insurance/products
interface ProductsResponse {
  products: InsuranceProduct[];
}

// GET /api/v1/public/policy/track
interface TrackRequest {
  verificationCode: string;
}
interface TrackResponse {
  policy: Policy;
  flightStatus: FlightStatus;
  payoutStatus: PayoutStatus;
}

// POST /api/v1/public/flights/search
interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
}
interface FlightSearchResponse {
  flights: Flight[];
}
```

### Authenticated APIs (User Management)
```typescript
// POST /api/v1/auth/complete-signup
interface SignupResponse {
  walletCreated: boolean;
  paygoAddress: string;
}

// GET /api/v1/user/conversations
interface ConversationListResponse {
  conversations: {
    id: string;
    title: string;
    lastMessage: string;
    lastUpdated: string;
    messageCount: number;
  }[];
  pagination: PaginationInfo;
}

// POST /api/v1/user/conversations/{id}/sync
interface SyncRequest {
  anonymousMessages: ChatMessage[];
  anonymousSelections: InsuranceSelection[];
}
interface SyncResponse {
  conversationId: string;
}

// GET /api/v1/user/policies
interface PolicyListResponse {
  activePolicies: Policy[];
  pastPolicies: Policy[];
  upcomingFlights: FlightMonitoring[];
  totalCoverage: number;
  totalPremiumsPaid: number;
}

// POST /api/v1/user/policies/purchase
interface PurchaseRequest {
  quoteId: string;
  paymentMethod: 'STRIPE' | 'CUSTODIAL_PAYGO' | 'EXTERNAL_PAYGO' (Phase 2);
}
interface PurchaseResponse {
  policyId: string;
  verificationCode: string;
}

// GET /api/v1/wallet/info
interface WalletInfoResponse {
  paygoAddress: string;
  balance: string;
  externalWallets?: { address: string; isVerified: boolean }[] (Phase 2);
}

// POST /api/v1/wallet/faucet
interface FaucetResponse {
  transactionHash: string;
}

// POST /api/v1/wallet/export-key-request
interface ExportKeyResponse {
  privateKey: string;
}

// POST /api/v1/wallet/link-external
interface LinkExternalRequest {
  paygoAddress: string;
  signature: string;
}
interface LinkExternalResponse {
  walletId: string;
}
```

### Internal APIs (System Use)
```typescript
// POST /api/v1/internal/monitoring/check
interface MonitoringCheckRequest {
  policyIds: string[];
}
interface MonitoringCheckResponse {
  updatedPolicies: Policy[];
}

// POST /api/v1/internal/payouts/process
interface PayoutProcessRequest {
  escrowIds: string[];
}
interface PayoutProcessResponse {
  processedPayouts: Payout[];
}

// GET /api/v1/internal/analytics/metrics
interface MetricsResponse {
  platformStats: PlatformMetrics;
  providerStats: ProviderMetrics[];
}
```

### B2B Integration APIs
```typescript
// POST /api/v1/b2b/provider/register
interface ProviderRegisterRequest {
  providerName: string;
  category: 'THIRD_PARTY_INSURER' | 'B2B_FINANCIAL_SERVICES';
}
interface ProviderRegisterResponse {
  providerId: string;
  apiKey: string;
}

// POST /api/v1/b2b/insurance/product/create
interface ProductCreateRequest {
  providerId: string;
  name: string;
  description: string;
  basePremium: number;
  coverageAmount: number;
}
interface ProductCreateResponse {
  productId: string;
}

// GET /api/v1/b2b/policies/list
interface B2BPolicyListRequest {
  providerId: string;
}
interface B2BPolicyListResponse {
  policies: Policy[];
}

// POST /api/v1/b2b/white-label/config
interface WhiteLabelConfigRequest {
  clientId: string;
  branding: BrandingConfig;
}
interface WhiteLabelConfigResponse {
  configId: string;
}

// POST /api/v1/b2b/risk-assessment
interface RiskAssessmentRequest {
  flightNumber: string;
  departureDate: string;
}
interface RiskAssessmentResponse {
  riskScore: number;
  delayProbability: number;
}
```

### API Tracking & Versioning
- **Versioning**: `/api/v1/` for initial release, `/api/v2/` for breaking changes.
- **Tracking**:
  - Logs: Request/response, status, latency, user/provider ID (stored in `api_logs` table).
  - Metrics: Usage, error rates, B2B client activity (integrated with PostHog/Grafana).
  - Dashboard: Real-time API performance in admin panel.
- **Documentation**: OpenAPI spec at `/api/docs`, auto-generated.
- **x402 Compatibility**: Modular payloads, extensible headers, and event-driven hooks for future orchestration.

### Phase-Based API Rollout
- **Phase 1**:
  - Public: `/chat/message`, `/insurance/quote`, `/policy/track`, `/flights/search`.
  - Authenticated: `/auth/complete-signup`, `/user/conversations`, `/user/policies`, `/wallet/info`, `/wallet/faucet`.
  - Internal: `/monitoring/check`, `/payouts/process`.
- **Phase 2**:
  - New: `/wallet/export-key-request`, `/wallet/link-external`, `/b2b/provider/register`, `/b2b/insurance/product/create`, `/b2b/risk-assessment`.
  - Enhanced: `/chat/message` (advanced AI), `/analytics/metrics`.
- **Phase 3**:
  - New: `/flighthub/search-offers`, `/flighthub/create-booking`, `/b2b/white-label/config`.

---

## 5. User Experience & Interface Design

### Chat-First Interface Architecture
Inspired by Chat0, the interface prioritizes conversational interaction for insurance quoting, evolving to support flight booking in Phase 3.

### Three-Panel Layout System
1. **Left Panel: Conversation History & Navigation**:
   - Lists search threads (e.g., “BA245 - Jan 28 Insurance”).
   - Quick actions: New search, settings, profile.
   - History management: Archive, delete, organize.
   - Visual: Clean sidebar with hover states.
2. **Center Panel: Chat Interface & Insurance Cards**:
   - Smart input for natural language queries (e.g., “insurance for BA245”).
   - Displays conversation flow and `InsuranceCard.tsx`:
     - Premium, coverage, flight details, risk score.
     - Buttons: Buy Now, Add to Navigator, View Terms.
   - Real-time flight status updates.
3. **Right Panel: Insurance Navigator (Cart)**:
   - Saved quotes for comparison.
   - Policy summary and checkout progress.
   - Tools: Calculator, FAQ, support chat.
   - Collapsible on mobile, persistent on desktop.

### Key Pages & UI Components
- **HomePage.tsx (`/`)**:
  - **Navbar**: Logo (left), smart search (center), cart icon, user avatar (right; dropdown: Dashboard, Policies, Wallet, Settings, Sign Out).
  - **Hero**: “Flight Delayed? Get Paid Instantly.” with smart search.
  - **How It Works**: 3-4 illustrated steps for parametric insurance.
  - **Trust Badges**: “Automatic Payouts,” “PayGo Secured,” “Transparent Terms.”
  - **Social Proof**: Testimonials or partner logos (if available).
- **ChatPage.tsx (`/quote` or dynamic `/`)**:
  - Three-panel layout for quoting.
  - `InsuranceCard.tsx`: Expandable details, quick actions.
- **CheckoutPage.tsx (`/checkout`)**:
  - Review quotes, select payment (Stripe, PayGo).
  - Anonymous flow: Stripe or login for PayGo.
  - Post-purchase: Policy verification code.
- **DashboardPage.tsx (`/dashboard`)**:
  - **Header**: Welcome, quick stats (policies, coverage, wallet balance).
  - **My Policies**: Active/past policies, status, verification codes.
  - **My Wallet**: PayGo address, balance, transactions, faucet (Alpha/Testnet), export key/link external (Phase 2).
  - **Insurance Navigator**: Saved quotes, AI recommendations.
  - **Settings**: Profile, notifications, 2FA (Phase 2).
- **TrackPolicyPage.tsx (`/track-policy`)**:
  - Public page for anonymous tracking via verification code, email + policy reference, or escrow ID.
  - Displays policy status, flight info, payout history, downloadable documents.
- **Static Pages**: About, FAQ (RAG-powered), Terms, Privacy, Contact.
- **Modals**:
  - `LoginModal.tsx`: Google OAuth.
  - `WalletReadyModal.tsx`: Confirms custodial wallet creation.
  - `PolicyTermsModal.tsx`: Full policy terms.
  - `FaucetRequestModal.tsx`: Test token confirmation.
  - `PrivateKeyExportModal.tsx` (Phase 2): Secure key display.
- **Phase 3**:
  - **FlightSearchPage.tsx (`/flights`)**: Conversational or traditional results with `FlightOfferCard.tsx` (airline, itinerary, price).
  - **Flight Booking Flow**: Multi-step (offer review, passenger details, payment, insurance bundling).
  - **Dashboard Enhancements**: “My Flight Bookings” section.

### Mobile-First Responsive Design
- **Mobile (<768px)**: Single-panel, swipeable navigation, touch-optimized.
- **Tablet (768-1024px)**: Two-panel (history + chat), slide-out navigator.
- **Desktop (>1024px)**: Full three-panel, keyboard shortcuts.

### User Dashboard & Anonymous Policy Tracking
- **Dashboard**:
  - Quick stats: Policies, coverage, wallet balance.
  - Policy cards: Flight details, coverage, monitoring status.
  - Wallet: Balance, transactions, faucet, export key (Phase 2).
  - Navigator: Saved quotes, recommendations.
- **Anonymous Tracking**:
  - Inputs: Verification code, email + reference, escrow ID.
  - Outputs: Policy status, flight info, claims, documents.
  - Security: Rate limiting, no sensitive data exposed.

### Footer Design (`Footer.tsx`)
- Inspired by Polar.sh, multi-column layout:
  - **triggerr (Insurance)**: Flight Delay Insurance, How It Works, Track Policy, FAQs.
  - **FlightHub Connect (Phase 3)**: Search Flights, Manage Bookings, Flight Deals.
  - **Company**: About, Careers, Press, Blog.
  - **Support**: Contact, Help Center, System Status.
  - **Legal**: Terms (separate for `triggerr`, `FlightHub Connect`), Privacy, Cookies.
  - Copyright, social media links.

---

## 6. Technical Architecture

### Technology Stack & Project Structure
- **Frontend**:
  - Next.js (App Router, `apps/web/src/app/shell/page.tsx` bootstraps `apps/web/src/frontend/app.tsx`).
  - React Router, TailwindCSS, Shadcn/UI.
  - Structure:
    ```
    apps/web/src/frontend/
    ├── app.tsx
    ├── layouts/
    │   ├── ChatLayout.tsx
    │   └── AuthLayout.tsx
    ├── pages/
    │   ├── HomePage.tsx
    │   ├── ChatPage.tsx
    │   ├── DashboardPage.tsx
    │   ├── CheckoutPage.tsx
    │   ├── TrackPolicyPage.tsx
    │   └── FlightSearchPage.tsx (Phase 3)
    ├── components/
    │   ├── chat/
    │   │   ├── ChatSidebar.tsx
    │   │   ├── ChatInterface.tsx
    │   │   └── ChatNavigator.tsx
    │   ├── cards/
    │   │   ├── InsuranceCard.tsx
    │   │   └── FlightCard.tsx
    │   ├── modals/
    │   │   ├── LoginModal.tsx
    │   │   └── PrivateKeyExportModal.tsx
    │   └── ui/
    ├── hooks/
    │   ├── useChat.tsx
    │   ├── useInsurance.tsx
    │   └── useConversation.tsx
    ```
- **Backend**:
  - Next.js API Routes (`apps/web/app/api/`).
  - Structure:
    ```
    apps/web/app/api/
    ├── v1/
    │   ├── public/
    │   │   ├── chat/
    │   │   ├── insurance/
    │   │   ├── flights/
    │   │   └── policy/
    │   ├── auth/
    │   ├── user/
    │   ├── wallet/
    │   ├── b2b/
    │   ├── internal/
    │   └── flighthub/ (Phase 3)
    ├── webhooks/
    └── docs/
    ```
- **Database**: PostgreSQL with Drizzle ORM (`packages/core/database/schema.ts`).
- **Authentication**: Better-Auth (Google OAuth, `packages/core/auth/`).
- **Blockchain**: PayGo (`@witnessco/paygo-ts-client`, `packages/integrations/paygo/PayGoService.ts`).
- **Payments**:
  - Stripe (`packages/integrations/stripe/StripeService.ts`).
  - Polar.sh (Phase 2 exploration, `packages/integrations/polar/`).
- **Flight Data APIs**:
  - Phase 1: AviationStack, FlightAware, OpenSky (`packages/integrations/aviationstack/`, etc.).
  - Phase 3: Duffel, Amadeus (`packages/integrations/duffel/`, `packages/integrations/amadeus/`).
- **Conversational AI**:
  - Fine-tuned Llama-3-8B-Instruct (self-hosted, `packages/services/conversation/ConversationService.ts`).
- **Services**:
  - `UserWalletService.ts`: Wallet creation, encryption, faucet.
  - `PolicyService.ts`: Policy creation, escrow management.
  - `QuoteEngineService.ts`: Premium calculations.
  - `FlightDataService.ts`: Flight data aggregation.
  - `PaymentService.ts`: Stripe, PayGo orchestration.
  - `FlightMonitorService.ts`: Scheduled flight tracking.
  - `FlightBookingService.ts` (Phase 3): OTA API management.
- **Shared Types**: TypeScript interfaces/enums in `packages/shared-types/`.

### Data Flow Architecture
- **Conversational Insurance (Phase 1-2)**:
  1. User submits query via chat.
  2. Frontend calls `/api/v1/public/chat/message`.
  3. `ConversationService` uses LLM for NLU, queries `FlightDataService` for risk data, and `QuoteEngineService` for premiums.
  4. Response renders `InsuranceCard` in chat.
  5. User selects quote, proceeds to checkout via `/api/v1/user/policies/purchase`.
- **Policy Purchase**:
  - **Stripe**: `/api/v1/user/policies/purchase` creates Payment Intent, webhook (`/api/webhooks/stripe`) confirms, `triggerr Direct` funds escrow.
  - **PayGo**: Backend signs escrow transaction using custodial/external key.
- **Flight Booking (Phase 3)**:
  1. User searches flights via `/api/v1/flighthub/search-offers`.
  2. `FlightBookingService` queries Duffel/Amadeus.
  3. Booking via `/api/v1/flighthub/create-booking`, OTA payment flow.
  4. Optional insurance bundling.

### Security Model
- **Better-Auth**: Google OAuth, anonymous JWTs for sessions.
- **RLS**:
  ```sql
  CREATE POLICY user_own_data ON conversations
    FOR ALL USING (user_id = auth.user_id());
  CREATE POLICY public_insurance_read ON insurance_products
    FOR SELECT USING (is_public = true);
  CREATE POLICY provider_own_policies ON policies
    FOR ALL USING (provider_id = auth.provider_id());
  ```
- **Data Protection**: AES-256-GCM encryption, rate limiting, OWASP validation.
- **API Security**: JWT verification, IP whitelisting for internal APIs.

---

## 7. Database Architecture

### Core Philosophy & Schema Overview
- PostgreSQL with Drizzle ORM for type-safe schema, migrations, and queries (`packages/core/database/schema.ts`).
- Goals: Data integrity, scalability, RLS for security.

### Key Table Definitions
```sql
-- User Wallets
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  paygo_address VARCHAR(255) NOT NULL UNIQUE,
  encrypted_private_key TEXT NOT NULL,
  wallet_name VARCHAR(100) DEFAULT 'My triggerr Wallet',
  is_primary BOOLEAN DEFAULT true,
  key_exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_balance_check TIMESTAMPTZ,
  cached_balance_amount TEXT DEFAULT '0',
  balance_currency VARCHAR(20) DEFAULT 'PAYGO_TOKEN'
);

-- User Payment Methods
CREATE TABLE user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_provider VARCHAR(50) NOT NULL, -- 'STRIPE', 'POLAR_SH'
  provider_customer_id VARCHAR(255),
  provider_method_id VARCHAR(255) NOT NULL UNIQUE,
  method_type VARCHAR(50), -- 'CARD', 'BANK_ACCOUNT'
  details JSONB, -- Card brand, last4, expiry
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_session_id VARCHAR(255) UNIQUE,
  title TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  initial_search_query TEXT,
  current_flight_context JSONB,
  current_insurance_preferences JSONB,
  current_ota_context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  ui_elements JSONB, -- e.g., { "type": "quote_cards", "data": [...] }
  metadata JSONB, -- LLM call details
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Navigator
CREATE TABLE insurance_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  insurance_product_id TEXT REFERENCES insurance_products(id),
  flight_data JSONB NOT NULL,
  quoted_premium DECIMAL(10,2) NOT NULL,
  coverage_details JSONB NOT NULL,
  selected_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'purchased', 'expired'))
);

-- Flight Offers (Phase 3)
CREATE TABLE flight_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_source VARCHAR(50) NOT NULL, -- 'DUFFEL', 'AMADEUS'
  external_offer_id TEXT NOT NULL,
  offer_data JSONB NOT NULL, -- Raw API payload
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_flight_offer_source_id UNIQUE (api_source, external_offer_id)
);

-- Flight Bookings (Phase 3)
CREATE TABLE flight_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_source VARCHAR(50) NOT NULL,
  external_booking_id TEXT NOT NULL,
  booking_data JSONB NOT NULL, -- PNR, e-ticket, passengers
  status VARCHAR(50) NOT NULL, -- 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'TICKETED', 'FAILED'
  total_amount_paid_cents INTEGER NOT NULL,
  payment_currency VARCHAR(3) NOT NULL,
  payment_gateway_reference_id TEXT,
  linked_insurance_policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_flight_booking_source_id UNIQUE (api_source, external_booking_id)
);

-- Providers
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'FIRST_PARTY_INSURER', 'THIRD_PARTY_INSURER', 'B2B_FINANCIAL_SERVICES', 'OTA_PROVIDER', 'FLIGHT_AGGREGATOR'
  api_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES providers(id),
  escrow_id UUID REFERENCES escrows(id),
  verification_code VARCHAR(255) NOT NULL UNIQUE,
  flight_data JSONB NOT NULL,
  premium_amount_cents INTEGER NOT NULL,
  coverage_amount_cents INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'ACTIVE', 'EXPIRED', 'PAID_OUT', 'PENDING_PAYOUT'
  payment_transaction_id TEXT, -- Stripe charge ID or PayGo hash
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escrows
CREATE TABLE escrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id),
  beneficiary_wallet_id UUID NOT NULL REFERENCES user_wallets(id),
  funder_wallet_id UUID NOT NULL REFERENCES user_wallets(id),
  escrow_id TEXT NOT NULL UNIQUE, -- PayGo escrow ID
  amount TEXT NOT NULL, -- BigInt string
  status VARCHAR(50) NOT NULL, -- 'FUNDED', 'RELEASED', 'DISPUTED'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enum Definitions
```sql
CREATE TYPE provider_category AS ENUM (
  'FIRST_PARTY_INSURER',
  'THIRD_PARTY_INSURER',
  'B2B_FINANCIAL_SERVICES',
  'OTA_PROVIDER',
  'FLIGHT_AGGREGATOR'
);

CREATE TYPE payment_provider AS ENUM ('STRIPE', 'POLAR_SH', 'PAYGO');

CREATE TYPE product_category AS ENUM (
  'PARAMETRIC_FLIGHT_DELAY',
  'PARAMETRIC_WEATHER',
  'PARAMETRIC_BAGGAGE_DELAY',
  'FLIGHT_TICKET'
);

CREATE TYPE flight_booking_status AS ENUM (
  'PENDING_PAYMENT',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'CANCELLED',
  'TICKETED',
  'FAILED'
);

CREATE TYPE flight_api_source AS ENUM ('DUFFEL', 'AMADEUS');
```

### Reference Data & Seeding Strategy
- **Phase 1**:
  - **Providers**: `triggerr Direct` (`FIRST_PARTY_INSURER`), `Preterag Financial Solutions` (`B2B_FINANCIAL_SERVICES`).
  - **Products**: `flight-delay-basic`, `flight-delay-premium`.
  - **Flight Data**: Airports, airlines, routes, delay statistics (`airports`, `airlines` tables).
  - **System Config**: Admin user, countries, currencies.
- **Phase 2**:
  - Products: `baggage-delay`, `weather-disruption`.
  - Providers: Third-party insurers (pilot).
- **Phase 3**:
  - Providers: `FlightHub Connect` (`OTA_PROVIDER`), `Duffel`, `Amadeus` (`FLIGHT_AGGREGATOR`).
  - Products: `FLIGHT_TICKET`.

### Row Level Security (RLS)
- Ensures users access only their data, providers access their policies, and public data is read-only.

---

## 8. Core User Flows

### Phase 1: Insurance Platform Launch
1. **Onboarding**:
   - User clicks “Login” on `/`, authenticates via Google OAuth (`/api/v1/auth/google`).
   - Backend calls `/api/v1/auth/complete-signup`, creates custodial PayGo wallet.
   - `WalletReadyModal.tsx` confirms wallet setup.
2. **Conversational Quoting**:
   - User enters query (e.g., “insurance for BA245”) on `/`.
   - Frontend calls `/api/v1/public/chat/message`.
   - `ConversationService` returns `InsuranceCard` options.
3. **Policy Purchase**:
   - User selects quote, proceeds to `/checkout`.
   - **Stripe**: `/api/v1/user/policies/purchase` creates Payment Intent, webhook confirms, escrow funded.
   - **PayGo**: Backend signs escrow transaction.
   - Returns verification code.
4. **Flight Monitoring & Payouts**:
   - `FlightMonitorService` queries `/api/v1/internal/monitoring/check`.
   - On delay, `/api/v1/internal/payouts/process` releases escrow to user’s wallet.
5. **Dashboard**:
   - `/dashboard` shows policies, wallet balance, faucet.
6. **Anonymous Tracking**:
   - User enters verification code on `/track-policy`, calls `/api/v1/public/policy/track`.

### Phase 2: Enhanced Features & Wallet Evolution
1. **New Insurance Products**:
   - Query for baggage/weather insurance via `/api/v1/public/chat/message`.
   - New `InsuranceCard` options presented.
2. **Private Key Export**:
   - User navigates to Dashboard -> My Wallet -> Export Key.
   - Calls `/api/v1/wallet/export-key-request`, re-authenticates.
   - `PrivateKeyExportModal.tsx` displays key with warnings.
3. **External Wallet Linking**:
   - User submits address and signature via `/api/v1/wallet/link-external`.
   - Used for payouts or payments.
4. **Third-Party Insurers**:
   - Quotes from pilot providers via `/api/v1/public/insurance/quote`.

### Phase 3: FlightHub Connect OTA Integration
1. **Flight Search**:
   - User searches flights via `/api/v1/flighthub/search-offers`.
   - `FlightOfferCard` results displayed.
2. **Booking**:
   - User selects offer, completes booking via `/api/v1/flighthub/create-booking`.
   - OTA API handles payment.
3. **Bundled Insurance**:
   - Option to add insurance at checkout.

---

## 9. PayGo Wallet Management

### Custodial Wallet (Phase 1)
- **Creation**: Automatic on signup via `/api/v1/auth/complete-signup`.
- **Private Key**: Encrypted with AES-256-GCM, stored in `user_wallets`.
- **Transactions**: Backend signs using temporarily decrypted key.
- **API**: `/api/v1/wallet/info`, `/api/v1/wallet/faucet`.

### Phase 2 Evolution
- **Private Key Export**:
  - API: `/api/v1/wallet/export-key-request`.
  - Re-authentication, warnings in `PrivateKeyExportModal.tsx`.
- **External Wallet Linking**:
  - API: `/api/v1/wallet/link-external`.
  - User provides address, signs message for verification.
- **Education**: API-driven FAQs, guides on self-custody.

### Security Architecture
- KMS (e.g., HashiCorp Vault) for encryption keys.
- Least privilege access, audited signing processes.
- Regular penetration testing and audits.

### Faucet Functionality
- `/api/v1/wallet/faucet` transfers testnet tokens from system wallet.
- UI: Dashboard button, `FaucetRequestModal.tsx`.

---

## 10. Payment Integration Strategy
- **Multi-Provider**:
  - Phase 1: Stripe, PayGo.
  - Phase 2: Polar.sh exploration.
  - Phase 3: Duffel/Amadeus payment APIs.
- **Fiat-to-Crypto (Stripe)**:
  - User pays via `/api/v1/user/policies/purchase`.
  - `triggerr Direct` receives fiat, funds escrow.
- **Direct Crypto (PayGo)**:
  - Backend signs escrow transaction for custodial/external wallet.
- **Flight Payments (Phase 3)**:
  - Card payments via OTA APIs.
  - Explore PayGo for B2B settlements.

---

## 11. Conversational AI (LLM Integration)

### Phase 1 Scope
- **Query Parsing**: Extracts flight details (e.g., “insurance for BA245”).
- **Quote Presentation**: Displays `InsuranceCard` options.
- **FAQ Answering**: RAG-based responses from curated knowledge base.
- **Guided Interaction**: Clarifies ambiguous queries.

### Phase 2 Enhancements
- Improved context retention, complex query handling.
- Personalized recommendations based on history.
- Support for baggage/weather products.
- API: Enhanced `/api/v1/public/chat/message`.

### Phase 3 Scope
- Parse flight search queries (e.g., “LHR to JFK, Sep 10-15”).
- Assist with booking queries (e.g., baggage allowances).
- Extend RAG for flight FAQs.

### Technology & Data Storage
- **LLM**: Fine-tuned Llama-3-8B-Instruct, self-hosted with quantization for efficiency.
- **Storage**: `conversations`, `conversation_messages` tables.
- **API**: `/api/v1/public/chat/message` for all interactions.

---

## 12. Flight Data & Booking APIs

### Phase 1 (Insurance Monitoring)
- **APIs**: AviationStack (primary), FlightAware, OpenSky (secondary).
- **Service**: `FlightDataService` abstracts calls, normalizes data.
- **API**: `/api/v1/public/flights/search`, `/api/v1/internal/monitoring/check`.

### Phase 3 (OTA - FlightHub Connect)
- **APIs**: Duffel (primary), Amadeus (secondary).
- **Service**: `FlightBookingService` manages search, offers, booking.
- **APIs**: `/api/v1/flighthub/search-offers`, `/api/v1/flighthub/create-booking`.

---

## 13. Analytics & Reporting

### Phase 2 Analytics Scope
- **User Behavior**:
  - Track conversation patterns, quote interactions via `/api/v1/user/conversations`.
  - Predictive models for user needs (e.g., frequent routes).
- **Market Intelligence**:
  - Flight delay trends, risk scoring via `/api/v1/b2b/risk-assessment`.
  - Competitive pricing analysis.
- **Dashboards**:
  - **Users**: Policy engagement, wallet activity.
  - **Providers**: API usage, policy performance.
  - **Platform**: Revenue, API metrics, user acquisition.

### APIs
- `/api/v1/internal/analytics/metrics`: Platform and provider stats.
- `/api/v1/b2b/provider/insights`: Provider-specific analytics.

---

## 14. Implementation Roadmap & Timeline

### Phase 1: Insurance Platform Launch (Months 1-4)
- **Month 1**:
  - APIs: Public (`/chat`, `/insurance`, `/policy`), auth (`/auth`), wallet (`/wallet/info`, `/wallet/faucet`).
  - Database: Schema, migrations, seeding.
  - Backend: `ConversationService`, `FlightDataService`, `QuoteEngineService`.
- **Month 2**:
  - APIs: Internal (`/monitoring`, `/payouts`), webhooks.
  - Frontend: `HomePage`, `ChatPage`, `CheckoutPage`, `TrackPolicyPage`.
  - LLM integration for Phase 1 scope.
- **Month 3**:
  - APIs: User (`/user/conversations`, `/user/policies`).
  - Frontend: `DashboardPage`, modals.
  - Security: RLS, KMS setup.
- **Month 4**:
  - Testing: End-to-end, performance, security.
  - Documentation: OpenAPI spec.
  - Launch preparation: Compliance, marketing.

### Phase 2: Enhanced Features & Wallet Evolution (Months 5-8)
- **Months 5-6**:
  - APIs: `/wallet/export-key-request`, `/wallet/link-external`, `/b2b/provider/register`, `/b2b/insurance/product/create`.
  - New products: Baggage, weather.
  - LLM enhancements: Context, personalization.
- **Months 7-8**:
  - APIs: `/b2b/risk-assessment`, `/analytics/metrics`.
  - Third-party provider pilot.
  - Dashboards: User, provider, platform.
  - Beta features: Predictive alerts.
  - Testing and optimization.

### Phase 3: FlightHub Connect Launch (Months 9-14)
- **Months 9-10**:
  - APIs: `/flighthub/search-offers`, `/flighthub/create-booking`.
  - Backend: `FlightBookingService`, Duffel/Amadeus integration.
  - Frontend: `FlightSearchPage`, booking flow.
- **Months 11-12**:
  - APIs: `/b2b/white-label/config`.
  - UI: Insurance bundling, “My Flight Bookings”.
  - B2B portal development.
- **Months 13-14**:
  - Testing, compliance (IATA, PCI DSS).
  - Launch `flighthubconnect.com`.
  - Market expansion planning.

---

## 15. Future Considerations & Advanced Features
- **x402 Integration**: API orchestration for cross-platform compatibility.
- **DeFi**: Multi-signature escrows, yield-bearing pools.
- **NFTs**: Policy certificates, travel collectibles.
- **Advanced AI**: Predictive modeling, travel concierge.
- **Mobile**: Progressive Web App (Phase 2), native iOS/Android (post-Phase 3).
- **Global Expansion**: Multi-currency, localized products, GDPR/CCPA/PIPEDA compliance.
- **Travel Ecosystem**: Hotels, car rentals, experiences via API partnerships.
- **Community**: Decentralized governance, user feedback loops.

---
