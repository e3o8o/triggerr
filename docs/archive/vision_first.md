# triggerr: Parametric Insurance & Future Travel Platform - Vision & Architecture v1.0

**Document Version**: 1.0
**Last Updated**: [Current Date - To be filled by user]
**Status**: Master Architectural Blueprint (Definitive Vision)
**Primary Goal (MVP - Phase 1)**: Establish `triggerr.com` as the leading platform for parametric flight delay insurance, focusing on ease of use, transparency, and automatic payouts via PayGo, featuring a custodial PayGo wallet experience for users at launch to ensure seamless onboarding. Solidify the `triggerr` brand as "The Parametric Insurance Experts."

---

## Table of Contents

1.  **Strategic Overview & Core Principles**
    *   Phased Rollout Strategy
        *   Phase 1: Insurance Platform Launch ("The Parametric Insurance Experts") - Custodial Wallet MVP
        *   Phase 2: Enhanced Insurance Features & User Wallet Evolution (Towards Self-Custody)
        *   Phase 3: OTA Integration - `FlightHub Connect` Launch
    *   Brand Positioning & Key Differentiators (MVP Focus for `triggerr`)
2.  **Business & Entity Structure**
    *   `triggerr` (Insurance Platform & Brand)
    *   `triggerr Direct` (First-Party Parametric Insurer - MVP Focus)
    *   `FlightHub Connect` (Independent OTA Entity - Phase 3)
    *   `Parametrigger Financial Solutions` (B2B Financial Services Provider)
3.  **Technical Architecture**
    *   Overall Technology Stack
    *   API-First, Modular Design & Project Structure
    *   Data Flow for Parametric Insurance (MVP - Custodial Wallet)
    *   Data Flow for Flight Booking (Phase 3 - `FlightHub Connect`)
4.  **Database Architecture**
    *   Core Philosophy (PostgreSQL, Drizzle ORM)
    *   Key Table Definitions (Conceptual DDL for `schema.ts` implementation)
        *   `user_wallets` (Custodial PayGo Wallets for MVP, evolving to support user-managed keys)
        *   `user_payment_methods` (For Stripe, future Polar.sh)
        *   `conversation_threads`, `conversation_messages` (For LLM Support)
        *   `flight_offers`, `flight_bookings` (Detailed for Phase 3 OTA)
    *   Relevant Enum Definitions
    *   Seeding Strategy (MVP & Future Phases)
5.  **User Experience (UX) & Frontend Design**
    *   Design Inspirations & Core Principles
    *   Key Pages & UI Components (Phase 1: `triggerr` Insurance Focus)
    *   Key Pages & UI Components (Phase 3: `FlightHub Connect` OTA Integration on `triggerr.com`)
    *   Footer Design
6.  **Core User Flows**
    *   Phase 1 (MVP - `triggerr` Insurance Focus):
        *   User Onboarding (Better-Auth & Custodial PayGo Wallet Creation)
        *   Conversational Insurance Quoting (LLM-assisted)
        *   Policy Purchase (Stripe & Custodial PayGo Wallet)
        *   Flight Monitoring & Automated Payouts
        *   Dashboard: Policy Management, Custodial Wallet Management (View Balance, Transactions, Faucet)
        *   Anonymous Policy Tracking
    *   Phase 2: User Wallet Evolution (Private Key Export, Education, Linking External Wallets)
    *   Phase 3 (`FlightHub Connect` OTA Integration):
        *   Flight Search & Offer Display
        *   Flight Booking & Payment
        *   Bundled Flight + `triggerr` Insurance Purchase
7.  **PayGo Wallet Management (Custodial MVP, Path to Semi/Non-Custodial)**
    *   MVP: Custodial Wallet Creation & Secure Management by `triggerr`
    *   Phase 2 Evolution: Introducing Secure Private Key Export, User Education on Self-Custody, Option to Link External Wallets
    *   Security Architecture for Custodial Keys
    *   Faucet Functionality for Alpha/Testnet Testing
8.  **Payment Integration Strategy**
    *   Multi-Provider Architecture (PayGo, Stripe for MVP; Polar.sh as future option)
    *   Fiat-to-Crypto for Escrow Funding (Stripe payments converted by `triggerr Direct` to fund PayGo escrows)
    *   Direct Crypto for Escrow Funding (From user's custodial PayGo wallet)
    *   Flight Payments (Phase 3 - `FlightHub Connect` via OTA API payment processing)
9.  **Conversational AI (LLM Integration)**
    *   MVP Scope (Insurance Focus): Natural language flight query parsing for insurance, conversational quote presentation, RAG-based FAQ, guided interaction.
    *   Phase 3 Scope (OTA Integration): Extend to flight search queries, basic booking assistance.
    *   Technology & Data Storage.
10. **Flight Data & Booking APIs**
    *   MVP (Insurance Underwriting & Monitoring): AviationStack, FlightAware, OpenSky.
    *   Phase 3 (OTA - `FlightHub Connect`): Duffel (primary), Amadeus Self-Service (secondary) for flight search, offers, and booking.
11. **API Endpoints (Backend)**
    *   Phase 1: MVP Insurance Focused Endpoints
    *   Phase 3: `FlightHub Connect` OTA Focused Endpoints
12. **Phased Implementation Roadmap (Summary)**
    *   Phase 1: Insurance Platform Launch ("The Parametric Insurance Experts")
    *   Phase 2: Enhanced Insurance Features & User Wallet Evolution
    *   Phase 3: OTA Integration - `FlightHub Connect` Launch
13. **Future Considerations & Advanced Features (Post-MVP)**

---

## 1. Strategic Overview & Core Principles

### Phased Rollout Strategy

triggerr will launch and grow in distinct, strategically planned phases to ensure focused execution, market penetration, and sustainable development:

*   **Phase 1: Insurance Platform Launch ("The Parametric Insurance Experts") (MVP - Target: Next 3-4 Months)**
    *   **Goal**: Establish `triggerr.com` as the premier, user-friendly, and trusted platform for parametric flight delay insurance, characterized by its simplicity and automatic payouts.
    *   **Product Focus**: Exclusively parametric flight delay insurance offered by `triggerr Direct`.
    *   **Wallet Strategy (MVP)**: **Custodial PayGo wallets**. `triggerr` will create and manage user PayGo wallets. Private keys will be securely encrypted and stored by the system, ensuring the smoothest possible onboarding and transaction experience for users unfamiliar with crypto wallets. Users will have full visibility and control over their custodial wallet's funds via the platform dashboard.
    *   **Key Features (MVP Detail)**:
        *   User Onboarding: Seamless Google sign-up via Better-Auth. Upon first successful login, the backend automatically creates a PayGo wallet for the user; the private key is encrypted using a robust system-managed key (e.g., via a Key Management Service - KMS) and stored securely. The user is informed their wallet is ready.
        *   Smart Flight Search: Intuitive input (flight number, or route + date) for contextual insurance quoting.
        *   Conversational UI: LLM-assisted interface for presenting insurance quotes, answering basic FAQs (using RAG on curated knowledge), and guiding users.
        *   Policy Purchase:
            *   **Stripe (Fiat Gateway):** User pays premium with a credit/debit card. `triggerr Direct` (system) receives fiat, then uses its operational PayGo wallet to fund the policy-specific PayGo escrow.
            *   **Custodial PayGo Wallet:** User authorizes payment directly from their `triggerr`-managed custodial PayGo wallet. The backend temporarily decrypts the user's private key for this specific transaction, signs, and funds the policy escrow.
        *   Automated Flight Monitoring: Continuous tracking of insured flights using AviationStack, FlightAware, and OpenSky.
        *   Automated Parametric Payouts: Upon validated delay, funds from the policy escrow are automatically transferred to the user's custodial PayGo wallet.
        *   User Dashboard: Sections for "My Policies" (view status, details, verification codes) and "My Wallet" (view PayGo address, current balance fetched live, transaction history link, Alpha/Testnet Faucet request button).
        *   Anonymous Policy Tracking: Public page to check policy status using a verification code (Escrow ID).
    *   **Brand**: `triggerr` - "The Parametric Insurance Experts." All branding, marketing, and user experience will be 100% focused on insurance to establish strong brand recognition in this niche.

*   **Phase 2: Enhanced Insurance Features & User Wallet Evolution (Target: Months 5-8)**
    *   **Goal**: Expand `triggerr`'s insurance product suite, improve platform intelligence, and begin empowering users with greater control over their PayGo wallets, fostering education on self-custody.
    *   **Product Focus**: Introduce new parametric insurance products (e.g., weather-related travel disruptions, baggage delay insurance, potentially basic trip interruption coverage elements).
    *   **Wallet Strategy (Evolution)**:
        *   **Secure Private Key Export**: Implement a robust and secure feature in the User Dashboard allowing users to export the private key for their `triggerr`-managed custodial wallet. This process will require re-authentication (and ideally 2FA if implemented) and present very clear warnings about the responsibilities of self-custody.
        *   **User Education**: Develop and provide clear, accessible educational materials (FAQs, guides, tooltips) on what a private key is, how to store it securely, and the benefits/risks of self-custody versus custodial solutions.
        *   **(Optional Exploration) Link External Wallet**: Investigate functionality for users to link an existing, externally managed PayGo wallet to their `triggerr` account for receiving payouts or potentially paying for policies (if they prefer not to use the custodial wallet for payments).
    *   **Platform Features**: More sophisticated LLM conversational abilities (better context handling, follow-up questions). Begin onboarding 1-2 selected third-party insurance providers to the `triggerr` marketplace. Refine admin tools for multi-provider management.

*   **Phase 3: OTA Integration - `FlightHub Connect` Launch (Target: Months 9-14)**
    *   **Goal**: Introduce comprehensive flight search and booking capabilities as a valuable, complementary service to `triggerr`'s insurance offerings, operated under a distinct brand to maintain `triggerr`'s core insurance identity.
    *   **Entity & Brand**: `FlightHub Connect` will be launched as a new, independent brand and potentially entity, functioning as the Online Travel Agency (OTA).
    *   **Platform Integration**: `FlightHub Connect`'s flight search and booking services will be seamlessly integrated into the `triggerr.com` user experience. For example, users searching for "flights to Paris" on `triggerr.com` could be presented with flight options sourced by `FlightHub Connect`, alongside the option to add `triggerr` travel insurance.
    *   **Product Focus**: Full-fledged flight search (one-way, round-trip, multi-city, flexible dates), offer display, booking, and potentially ancillary services (e.g., seat selection, baggage if supported by APIs). A key offering will be conveniently bundled flight + `triggerr` insurance packages.
    *   **Technology**: Integration with Duffel (as a primary provider for its modern API and diverse airline connections) and Amadeus Self-Service APIs (as a secondary provider for broader GDS content and data source diversity).
    *   **Payment for Flights**: Primarily processed via standard credit/debit card mechanisms integrated within the Duffel/Amadeus booking flows. `FlightHub Connect` will act as the merchant of record for these flight transactions. Exploration of PayGo as a B2B settlement layer or even a direct consumer payment option for flights if airline/aggregator support becomes viable.

### Brand Positioning & Key Differentiators (MVP Focus for `triggerr`)

*   **Brand**: `triggerr` - The most reliable, transparent, and user-friendly platform for parametric travel insurance.
*   **Tagline Concepts**: "Flight Delays, Instantly Covered.", "Parametric Insurance: Simple, Transparent, Automatic.", "triggerr: Smart Insurance for Smarter Travel."
*   **Key Differentiators (MVP)**:
    *   **Automatic & Instant Payouts**: The core value proposition, leveraging PayGo blockchain for efficient and transparent settlement of validated claims.
    *   **Utmost User Simplicity**: No complex claims forms or lengthy processes. An intuitive, conversational user experience guides users from quote to policy and payout.
    *   **Transparency**: Clear, easy-to-understand policy terms. Escrowed funds and payouts are conceptually verifiable on the PayGo blockchain via Escrow IDs (Policy Verification Codes).
    *   **Seamless Custodial Wallet Experience (MVP)**: Hassle-free onboarding for all users, regardless of crypto familiarity, with `triggerr` managing the PayGo wallet. Future phases will empower users with self-custody options.
    *   **Insurance Specialization**: A deep and singular focus on providing the best parametric insurance products and experience, building trust and expertise in this specific domain.

---

## 2. Business & Entity Structure

*(Aligned with `triggerr/docs/business_structure.md` and detailed for the phased vision)*

1.  **`triggerr` (Insurance Platform & Brand)**
    *   **Role**: Operates the `triggerr.com` platform. Serves as the master brand for parametric travel insurance. Acts as the primary technology provider for all insurance-related services and for the integrated `FlightHub Connect` experience.
    *   **Functions**: Marketplace operations for insurance products (from `triggerr Direct` and future third-party insurers). Development and maintenance of core platform technology including the quoting engines, flight monitoring services, PayGo integration layer, user wallet management system, LLM conversational services, and frontend applications. Manages customer relationships for insurance products. Oversees branding, marketing, and user acquisition for all insurance offerings on the platform.
    *   **Domain**: `triggerr.com`

2.  **`triggerr Direct` (First-Party Parametric Insurer - MVP Focus)**
    *   **Role**: The flagship and primary insurance provider on the `triggerr.com` platform, especially critical for the MVP launch. Operates as a distinct (potentially legally separate) entity licensed or structured to underwrite and issue parametric insurance policies, utilizing the `triggerr` platform's technology stack.
    *   **Functions**: Direct issuance of parametric flight delay insurance policies (MVP). Manages its own underwriting risk models, capital reserves, and specific regulatory compliance related to its insurance products. Pays standard platform fees to `triggerr` (Parent Company/Platform) for use of the marketplace and technology, ensuring a fair model if/when third-party insurers are onboarded. Manages an operational PayGo wallet for funding policy escrows after fiat (Stripe) payments.
    *   **Domain**: `direct.triggerr.com` (primarily for operational, B2B, or regulatory interface purposes; all user-facing interactions occur via `triggerr.com`).

3.  **`FlightHub Connect` (Independent OTA Entity - Phase 3)**
    *   **Role**: A separate Online Travel Agency (OTA) dedicated to flight search and booking. Will operate with a distinct brand identity (e.g., "FlightHub Connect, powered by triggerr technology" or completely separate) to ensure `triggerr` maintains its clear focus as an insurance specialist.
    *   **Functions**: Flight aggregation from multiple sources (Duffel, Amadeus). Execution of flight bookings. Management of payment processing for flight tickets (primarily card payments via OTA API providers). Handling airline and GDS partnerships. Ensuring compliance with all OTA-specific regulations, IATA licensing (if pursued), and seller of travel laws.
    *   **Platform Integration**: Onboarded onto `triggerr.com` as a strategic partner or an integrated service. Users on `triggerr.com` looking for flights will interact with `FlightHub Connect`'s services, potentially through a dedicated UI section or a seamless API integration. A revenue sharing or referral fee model will be established with the `triggerr` platform for flight bookings generated.
    *   **Domain**: To be determined (e.g., `flighthubconnect.com`, or potentially a subdomain like `fly.triggerr.com` which clearly presents `FlightHub Connect` services).

4.  **`Parametrigger Financial Solutions` (B2B Financial Services Provider)**
    *   **Role**: A specialized B2B provider that can be onboarded to the `triggerr` platform in Phase 2 or later.
    *   **Functions**: Offers financial products and services such as reinsurance to other insurance providers on the platform (including `triggerr Direct`), risk assessment tools, or specialized data products related to travel risk.

---

## 3. Technical Architecture

*   **Overall Technology Stack**:
    *   **Frontend**: Next.js (using App Router, with `apps/web/src/app/shell/page.tsx` acting as a bootstrap for a client-side React Router application defined in `apps/web/src/frontend/app.tsx`), TailwindCSS, and a UI component library like Shadcn/UI.
    *   **Backend**: Next.js API Routes (located primarily within `apps/web/app/api/`).
    *   **Database**: PostgreSQL, with Drizzle ORM for schema definition and queries (`packages/core/database/schema.ts`).
    *   **Authentication**: Better-Auth, configured for Google OAuth as the primary method. Core auth logic and adapter in `packages/core/auth/`.
    *   **Blockchain**: PayGo Protocol, interacted with via the `@witnessco/paygo-ts-client` library. Client management and core PayGo operations abstracted in `packages/integrations/paygo/PayGoService.ts` (or similar).
    *   **Payments (MVP)**:
        *   **PayGo**: Used for creating policy escrows, making payouts to users' custodial wallets, and allowing users to pay for policies from their custodial wallets.
        *   **Stripe**: Primary fiat payment gateway for users to pay insurance premiums with credit/debit cards. Integrated via `packages/integrations/stripe/StripeService.ts`.
    *   **Payments (Future Considerations)**: Polar.sh (as an alternative or additional payment processor, especially for digital products or different billing models).
    *   **Flight Data APIs (MVP - for Insurance Underwriting & Monitoring)**:
        *   `AviationStack`: Primary source for flight schedules, routes, airport data, historical flight data, and live flight status.
        *   `FlightAware`, `OpenSky Network`: Secondary/verification sources for live flight status and delay information, providing redundancy.
        *   Integration via dedicated modules in `packages/integrations/` (e.g., `packages/integrations/aviationstack/`) and consumed by `FlightDataService`.
    *   **Flight Data & Booking APIs (Phase 3 - for OTA `FlightHub Connect`)**:
        *   `Duffel`: Primary API for flight search, offer retrieval, and booking execution due to its modern API and diverse airline integrations.
        *   `Amadeus Self-Service APIs`: Secondary API for broader GDS content, potentially different airline/LCC coverage, and to promote data source independence.
        *   Integration via `packages/integrations/duffel/`, `packages/integrations/amadeus/` and consumed by `FlightBookingService`.
    *   **Conversational AI (LLM - MVP)**: A small, focused, and instruction-following LLM. Options include:
        *   Fine-tuned open-source models (e.g., quantized Llama-3-8B-Instruct, Mistral-7B-Instruct) if self-hosting is viable.
        *   Efficient commercial APIs (e.g., Gemini 1.5 Flash, Claude 3 Haiku) for ease of use and performance.
        *   Integrated via a backend `ConversationService` in `packages/services/conversation/`.

*   **API-First, Modular Design & Project Structure**:
    *   **`apps/web/`**: The main Next.js application, containing:
        *   `src/app/`: Next.js App Router specific files (e.g., `shell/page.tsx`, API route handlers in `app/api/`).
        *   `src/frontend/`: Client-side React application (bootstrapped by `shell/page.tsx`), including React Router setup (`app.tsx`), pages, components, hooks, and client-side state management.
    *   **`packages/core/`**: Shared foundational logic:
        *   `database/`: Drizzle schema (`schema.ts`), Drizzle client instance, migration scripts, seeding logic (`seed.ts`).
        *   `auth/`: Better-Auth configuration and Drizzle adapter.
    *   **`packages/integrations/`**: Client libraries and service wrappers for all third-party APIs:
        *   `paygo/`: `PayGoService` abstracting `@witnessco/paygo-ts-client`.
        *   `stripe/`: `StripeService` for Stripe API interactions.
        *   `aviationstack/`, `flightaware/`, `opensky/`: Clients for flight data APIs.
        *   `llm/`: Client for the chosen LLM API/model.
        *   (Phase 3) `duffel/`, `amadeus/`: Clients for OTA APIs.
    *   **`packages/services/`**: Core business logic, decoupled from specific API route handlers:
        *   `UserWalletService.ts`: Manages user PayGo wallet creation (custodial), encryption/decryption of keys, balance checks, faucet requests.
        *   `PolicyService.ts`: Handles policy creation, updates, escrow management, payout triggers.
        *   `QuoteEngineService.ts`: Calculates insurance premiums based on risk data.
        *   `FlightDataService.ts`: Aggregates and normalizes data from AviationStack, FlightAware, OpenSky for insurance logic.
        *   `PaymentService.ts`: Orchestrates payments via Stripe and PayGo.
        *   `ConversationService.ts`: Manages LLM interactions, conversation state, RAG.
        *   `FlightMonitorService.ts`: (Likely implemented as scheduled tasks/workers) Tracks flight statuses for active policies.
        *   (Phase 3) `FlightBookingService.ts`: Manages interactions with Duffel/Amadeus for flight search and booking.
    *   **`packages/shared-types/`**: TypeScript interfaces, enums, and utility types shared across the monorepo to ensure consistency.

*   **Data Flow for Parametric Insurance (MVP - Custodial Wallet)**:
    1.  User submits a flight insurance query via `triggerr.com`'s conversational UI.
    2.  Frontend (`InsuranceChatPage.tsx`) sends the message to the backend API endpoint (`/api/conversation/message`).
    3.  The backend `ConversationService` receives the message. It uses an LLM for Natural Language Understanding (NLU) to parse the flight details (flight number, route, date). It may also use Retrieval Augmented Generation (RAG) for answering FAQs.
    4.  `ConversationService` calls `FlightDataService` to validate flight details and gather risk-assessment data (historical delays, weather forecasts, etc.) from AviationStack, FlightAware, and OpenSky.
    5.  `ConversationService` passes flight risk data to `QuoteEngineService`, which calculates premiums for `triggerr Direct`'s parametric flight delay products.
    6.  `ConversationService` formats the LLM's response, including contextual flight information and insurance quote options (as `QuoteCard` data structures), and sends it back to the frontend.
    7.  User reviews quotes in the chat UI and selects a policy to purchase, then proceeds to checkout. Frontend calls `/api/policy/create`.
    8.  The backend `PolicyService` receives the request. It interacts with `PaymentService` based on the user's chosen payment method:
        *   **Stripe Chosen**:
            a.  `PaymentService` creates a Stripe Payment Intent for the premium amount. The client secret is returned to the frontend.
            b.  Frontend uses Stripe Elements to collect card details and confirm the payment with Stripe.
            c.  A Stripe webhook (`/api/webhooks/stripe`) notifies the backend of successful payment.
            d.  `PaymentService` confirms payment to `PolicyService`.
            e.  `PolicyService` instructs `UserWalletService` (acting on behalf of `triggerr Direct`'s operational PayGo wallet) to create and fund a new PayGo escrow for the policy's coverage amount. The `escrowId` is generated and linked to the policy record in the database.
        *   **Custodial PayGo Wallet Chosen**:
            a.  User confirms they want to pay from their `triggerr`-managed custodial wallet.
            b.  `PolicyService` (via `UserWalletService` and `PayGoService`) securely retrieves and temporarily decrypts the user's stored `encrypted_private_key`.
            c.  A `CreateEscrow` transaction is constructed, signed server-side using the user's decrypted key, and broadcast to the PayGo network to fund the policy escrow from the user's custodial wallet. The decrypted key is immediately discarded from memory.
            d.  The `escrowId` is generated/retrieved and linked to the policy record.
    9.  `PolicyService` confirms successful policy creation to the user, providing a Policy Verification Code (which maps to the `escrowId`).
    10. `FlightMonitorService` (running as scheduled background tasks) periodically queries `FlightDataService` for status updates on all active insured flights.
    11. If `FlightMonitorService` detects a validated delay that meets the policy's parametric trigger conditions, it notifies `PolicyService`.
    12. `PolicyService` (via `UserWalletService` and `PayGoService`) initiates the automatic PayGo escrow payout from the policy-specific escrow directly to the user's custodial PayGo wallet (`user_wallets.paygo_address`).
    13. The user is notified of the successful payout via dashboard notification and/or email.

*   **Data Flow for Flight Booking (Phase 3 - `FlightHub Connect`)**:
    1.  User initiates a flight search on `triggerr.com` through the `FlightHub Connect` integrated interface (e.g., "flights from London to New York on August 15th").
    2.  Frontend sends the structured search parameters to a backend API endpoint (e.g., `/api/flighthub/search-offers`).
    3.  The backend `FlightBookingService` receives the request. It queries both Duffel and Amadeus APIs in parallel (or sequentially with fallback) for flight offers matching the criteria.
    4.  `FlightBookingService` aggregates, normalizes (if necessary), and potentially de-duplicates the offers, then returns a list of flight options (as `FlightOfferCard` data structures) to the frontend.
    5.  User selects a specific flight offer. Frontend may call an endpoint like `/api/flighthub/offer/:offerId/verify-price` to ensure price and availability haven't changed.
    6.  User proceeds to book the selected flight. Frontend collects passenger details and sends them along with the selected `external_offer_id` to `/api/flighthub/create-booking`.
    7.  `FlightBookingService` communicates with the respective OTA API (Duffel or Amadeus) to create the booking (order). This step typically involves:
        *   Passing passenger information.
        *   Handling payment: The OTA API provider (Duffel/Amadeus) usually manages the card payment processing directly. The frontend might embed their payment elements, or `FlightHub Connect` might process payment and then settle with the provider. For MVP Phase 3, leveraging the OTA provider's direct payment processing is simpler.
    8.  Upon successful booking and payment, the OTA API returns a booking confirmation (PNR, e-ticket numbers, etc.).
    9.  `FlightBookingService` stores this confirmation in the `flight_bookings` table and returns success to the frontend.
    10. The frontend displays the booking confirmation to the user. At this point, the user can be seamlessly offered `triggerr` flight delay insurance for their newly booked flight.

---

## 4. Database Architecture

*   **Core Philosophy**: PostgreSQL as the relational database, with Drizzle ORM providing type-safe schema definition (`packages/core/database/schema.ts`), migrations, and query building. Data integrity, clear relations, and scalability are key design goals.
*   **Key Table Definitions (Conceptual DDL for clarity; Drizzle schema is the source of truth)**:

    ```sql
    -- User Wallets (Custodial for MVP, with evolution path)
    CREATE TABLE IF NOT EXISTS user_wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE UNIQUE, -- Ensures one primary custodial wallet per user
      paygo_address VARCHAR(255) NOT NULL UNIQUE, -- The user's PayGo wallet address
      encrypted_private_key TEXT NOT NULL, -- The user's PayGo private key, encrypted with a system-managed KMS key
      -- encryption_metadata JSONB, -- Optional: Stores details like salt, IV, KMS key version if not part of the ciphertext itself
      wallet_name VARCHAR(100) DEFAULT 'My triggerr Wallet',
      is_primary BOOLEAN DEFAULT true, -- For future if multiple wallets (e.g., linked external) are supported
      key_exported_at TIMESTAMPTZ, -- Timestamp indicating when/if the user exported their key (for Phase 2+)
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      last_balance_check TIMESTAMPTZ, -- When the balance was last synced from PayGo
      cached_balance_amount TEXT DEFAULT '0', -- Balance stored as string to handle BigInt precision from PayGo
      balance_currency VARCHAR(20) DEFAULT 'PAYGO_TOKEN' -- Or a specific stablecoin identifier if used on PayGo
    );

    -- User Payment Methods (Primarily for Stripe in MVP)
    CREATE TABLE IF NOT EXISTS user_payment_methods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      payment_provider VARCHAR(50) NOT NULL, -- Enum: 'STRIPE', 'POLAR_SH' (Future)
      provider_customer_id VARCHAR(255), -- e.g., Stripe Customer ID, helps manage multiple payment methods for one customer
      provider_method_id VARCHAR(255) NOT NULL UNIQUE, -- e.g., Stripe PaymentMethod ID (pm_xxx)
      method_type VARCHAR(50), -- e.g., 'CARD', 'BANK_ACCOUNT'
      details JSONB, -- Stores non-sensitive details like card brand, last4, expiry month/year for display
      is_default BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true, -- Can be deactivated if a card expires or is removed
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Conversation AI Support
    CREATE TABLE IF NOT EXISTS conversation_threads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES "user"(id) ON DELETE SET NULL, -- Nullable for anonymous user conversations
      anonymous_session_id VARCHAR(255) UNIQUE, -- Used if user_id is NULL to track anonymous conversation continuity
      thread_title VARCHAR(255), -- Auto-generated or user-editable title, e.g., "Insurance for BA123 LHR-JFK on Aug 15"
      initial_search_query TEXT, -- The first user message or interpreted search
      current_flight_context JSONB, -- Stores structured data about the flight(s) being discussed (from, to, date, flight_no)
      current_insurance_preferences JSONB, -- User's expressed preferences (e.g., coverage level, specific risks)
      current_ota_context JSONB, -- For Phase 3: stores flight search criteria, selected offers etc.
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversation_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id UUID NOT NULL REFERENCES conversation_threads(id) ON DELETE CASCADE,
      sender_type VARCHAR(20) NOT NULL, -- Enum: 'USER', 'ASSISTANT'
      content TEXT NOT NULL, -- The textual content of the message
      ui_elements JSONB, -- Structured data for rendering special UI, e.g., { "type": "quote_cards", "data": [{"quote_id": "xyz"}, ...]}
      metadata JSONB, -- For LLM call details (model, tokens, latency), or other processing info
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- OTA Related Tables (Detailed for Phase 3 `FlightHub Connect`)
    CREATE TABLE IF NOT EXISTS flight_offers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      api_source VARCHAR(50) NOT NULL, -- Enum: 'DUFFEL', 'AMADEUS'. Identifies the flight aggregator.
      external_offer_id TEXT NOT NULL, -- The unique Offer ID provided by the source API (Duffel/Amadeus).
      offer_data JSONB NOT NULL, -- The complete, raw offer payload received from the source API. Includes itinerary details, pricing components, fare rules, baggage allowance, etc.
      -- Denormalized quick access fields (optional, for performance, but source of truth is offer_data):
      -- total_price_amount_cents INTEGER NOT NULL,
      -- total_price_currency VARCHAR(3) NOT NULL,
      -- main_airline_iata_code VARCHAR(3),
      -- number_of_segments INTEGER,
      expires_at TIMESTAMPTZ, -- When this specific offer (price point) expires, if provided by source.
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT uq_flight_offer_source_id UNIQUE (api_source, external_offer_id) -- Ensures we don't store the same offer from the same source multiple times.
    );

    CREATE TABLE IF NOT EXISTS flight_bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      api_source VARCHAR(50) NOT NULL, -- Enum: 'DUFFEL', 'AMADEUS'. Source of the booking.
      external_booking_id TEXT NOT NULL, -- The PNR (Passenger Name Record) or unique Order ID from the source API.
      booking_data JSONB NOT NULL, -- The complete, raw booking confirmation payload from the source API. Includes e-ticket numbers, passenger details, final itinerary, payment status.
      status VARCHAR(50) NOT NULL, -- Enum: 'PENDING_PAYMENT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'TICKETED', 'FAILED'.
      total_amount_paid_cents INTEGER NOT NULL,
      payment_currency VARCHAR(3) NOT NULL,
      payment_gateway_reference_id TEXT, -- e.g., Stripe Charge ID if `FlightHub Connect` processes payment before calling OTA API, or reference from OTA API's payment system.
      linked_insurance_policy_id UUID REFERENCES policy(id) ON DELETE SET NULL, -- If an `triggerr` policy was bundled/purchased with this flight.
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT uq_flight_booking_source_id UNIQUE (api_source, external_booking_id)
    );
    ```

*   **Existing Table Enhancements (to be reviewed in `schema.ts`)**:
    *   `provider`: Ensure `category` field can accommodate `OTA_PROVIDER` (for `FlightHub Connect` itself, if it's modeled as a provider on the platform) and `FLIGHT_AGGREGATOR` (for Duffel, Amadeus as sources).
    *   `policy`: Ensure robust fields to link payment transactions (e.g., Stripe charge ID, PayGo transaction hash for escrow funding) and cross-reference with `escrow.id`.
    *   `escrow`: Must have clear foreign keys to `policy.id` and `user_wallets.id` (for both beneficiary and funder if user's custodial wallet is used).
    *   `user`: Add fields like `last_login_at`, `preferences JSONB` (for storing user UX choices).
*   **Relevant Enum Definitions (to be defined/updated in `schema.ts`)**:
    *   `providerCategoryEnum`: Add `OTA_PROVIDER`, `FLIGHT_AGGREGATOR`. (Existing: `FIRST_PARTY_INSURER`, `THIRD_PARTY_INSURER`, `B2B_FINANCIAL_SERVICES`).
    *   `paymentProviderEnum` (New or adapt existing): `PAYGO`, `STRIPE`, `POLAR_SH`.
    *   `productCategoryEnum`: Add `FLIGHT_TICKET` (for Phase 3). (Existing may include `PARAMETRIC_FLIGHT_DELAY`, `PARAMETRIC_WEATHER`).
    *   `flightBookingStatusEnum`: `PENDING_PAYMENT`, `PENDING_CONFIRMATION`, `CONFIRMED`, `CANCELLED`, `TICKETED`, `FAILED`.
    *   `flightApiSourceEnum`: `DUFFEL`, `AMADEUS`.
*   **Seeding Strategy (`seed.ts`)**:
    *   **MVP (Phase 1)**:
        *   Providers: `triggerr Direct` (ID: `TRIGGERR_DIRECT_PROVIDER_ID`, category: `FIRST_PARTY_INSURER`), `Parametrigger Financial Solutions` (category: `B2B_FINANCIAL_SERVICES`).
        *   Products: Parametric flight delay insurance products offered by `triggerr Direct`, linked to its provider ID.
        *   Flight Data Sources: Seed `AviationStack`, `FlightAware`, `OpenSky` records into the `flightDataSource` table.
        *   Admin User and basic System Configuration. Core reference data (countries, regions, airlines, airports, aircraft_types, runways, routes) must be comprehensively seeded.
    *   **Phase 3 (Additions for OTA)**:
        *   Providers: `FlightHub Connect` (category: `OTA_PROVIDER`), `Duffel` (category: `FLIGHT_AGGREGATOR`), `Amadeus` (category: `FLIGHT_AGGREGATOR`).
        *   Products: Placeholder "Flight Ticket" product types, potentially linked to `FlightHub Connect` as the offering entity.

---

## 5. User Experience (UX) & Frontend Design

*   **Design Inspirations & Core Principles**:
    *   **Clarity & Trust**: Paramount for financial transactions (insurance & flights). Clean, professional aesthetic.
    *   **Simplicity**: Minimize user effort, especially for MVP insurance flows.
    *   **Conversational Interface**: For search and quoting (insurance MVP, potentially extended to flights), making complex choices feel more guided and natural (`chat0`-inspired).
    *   **Visual Hierarchy**: Guide the user's eye to primary actions.
    *   **Responsiveness**: Mobile-first or fully responsive design for all pages.
    *   **Inspirations**:
        *   Landing Page (`HomePage.tsx`): `scira`-inspired (modern, trustworthy, single clear call-to-action/search).
        *   Search/Quote Results (`InsuranceChatPage.tsx` for MVP): `chat0`-inspired (two-column: history/context + main interactive chat panel).
        *   Search Input (on `HomePage.tsx`): `flights.google.com`-inspired (single smart input capable of parsing diverse queries, with an option for "Advanced Search" revealing structured fields like Origin, Destination, Dates, Passengers).
        *   Footer (`Footer.tsx`): `Polar.sh`-inspired (well-structured, comprehensive links, professional).

*   **Key Pages & UI Components (Phase 1: `triggerr` Insurance Focus - in `apps/web/src/frontend/`)**:
    *   **`pages/HomePage.tsx` (`/`)**:
        *   **Navbar (`components/layout/Navbar.tsx`)**:
            *   Left: `triggerr` Logo.
            *   Right (Conditional UI):
                *   Anonymous User: "Login" button.
                *   Authenticated User: User Avatar > Dropdown (displays User Email, "Wallet: [Balance] [Token]" - balance fetched asynchronously for custodial wallet, links to Dashboard sections: My Policies, My Wallet, Settings; Logout option). A "Cart" icon (showing count of insurance policies selected).
        *   **Hero Section**:
            *   Headline: Clear, benefit-driven for insurance (e.g., "Flight Delayed? Get Paid Instantly.").
            *   Smart Search Input: Single field, placeholder: "Enter flight number, or 'City to City & Date' for an insurance quote".
            *   (Optional) Small link/icon for "Advanced Insurance Search" (reveals specific fields if needed: Flight No, Departure Date, Origin, Destination).
        *   **"How It Works" Section**: 3-4 simple, illustrated steps explaining parametric insurance with `triggerr`.
        *   **Value Propositions/Trust Badges**: Icons & brief text (e.g., "Automatic Payouts," "PayGo Secured," "Transparent Terms").
        *   **Social Proof (Optional)**: Testimonials or partner logos (if any at launch).
    *   **`pages/InsuranceChatPage.tsx` (e.g., route `/quote` or dynamically updates on `/` after initial search)**:
        *   **Layout**: `components/search/ChatViewLayout.tsx` (two-column).
        *   **Left Sidebar (`components/search/SearchHistorySidebar.tsx`)**: List of user's past insurance search "conversations" (e.g., "Insurance for BA245 - Aug 15"). Clicking reloads the conversation. "New Search" button.
        *   **Right Main Panel (`components/search/ChatConversationPanel.tsx`)**:
            *   Displays user queries (e.g., "You: Insurance for BA245").
            *   Displays assistant responses generated by LLM: confirms flight understanding, provides brief flight context (from `FlightDataService`), presents insurance options using `components/insurance/QuoteCard.tsx`.
            *   `components/insurance/QuoteCard.tsx`: Displays provider (`triggerr Direct` for MVP), premium price, key coverage details (e.g., "Covers delays >60 mins"), "View Policy Terms" button (opens modal/drawer with full terms), "Add to Cart" button.
    *   **`pages/CheckoutPage.tsx` (`/checkout`)**:
        *   Review selected insurance policy/policies from cart.
        *   Display policyholder details (prefill if authenticated).
        *   Payment Method Selection:
            *   "Pay with my triggerr Wallet (PayGo)" - uses custodial wallet.
            *   "Pay with Card (via Stripe)".
        *   Handles anonymous user flow by guiding them through payment (Stripe primarily for anonymous if PayGo wallet isn't created pre-auth, or prompts login for PayGo option). Post-purchase, provides Policy Verification Code.
        *   Authenticated flow confirms payment and policy activation.
    *   **`pages/DashboardPage.tsx` (`/dashboard`)**:
        *   Tabbed interface or distinct sections:
            *   "My Policies": List of active/past policies, status (Active, Expired, Paid Out, Pending Payout), Policy Verification Code, link to view policy details.
            *   "My Wallet": Displays user's custodial `paygo_address`, current balance (fetched live via backend API). Link to PayGo block explorer for transaction history. "Request Test Tokens (Alpha)" button. **In Phase 2, this section will add "Export Private Key"**.
            *   "Settings": Basic user profile settings, notification preferences.
    *   **`pages/TrackPolicyPage.tsx` (`/track`)**: Publicly accessible page. Input field for anonymous users to enter their Policy Verification Code (Escrow ID). Displays policy status, relevant flight status, and any payout information.
    *   **Static Pages**: `AboutPage.tsx`, `FaqPage.tsx` (can be LLM RAG-powered + static), `TermsPage.tsx`, `PrivacyPage.tsx`, `ContactPage.tsx`.
    *   **Modal Components (`components/modals/`)**:
        *   `LoginModal.tsx` (BetterAuth Google flow).
        *   `WalletReadyModal.tsx` (MVP): Informs user their custodial wallet is set up.
        *   `PolicyTermsModal.tsx` (Displays full policy wording).
        *   `FaucetRequestModal.tsx` (Confirms test token request).
        *   (Phase 2) `PrivateKeyExportModal.tsx`: Securely displays private key with warnings and acknowledgment step.

*   **Key Pages & UI Components (Phase 3: `FlightHub Connect` OTA Integration on `triggerr.com`)**:
    *   **`HomePage.tsx` Search Evolution**: The smart search input will be enhanced to robustly parse queries for *both* insurance (e.g., "insurance for BA245") and flights (e.g., "flights from London to New York next Tuesday", "LHR to JFK Sep 10-15, 2 adults"). The "Advanced Search" option will show relevant fields based on initial query type (insurance-specific or flight-specific fields like # of passengers, cabin class).
    *   **`pages/FlightSearchPage.tsx` (e.g., route `/flights`, or dynamic update on `/` after flight search query)**:
        *   **Layout Choice**: Can be the same two-column `ChatViewLayout.tsx` for a conversational flight search, OR a more traditional flight search results page layout (like Google Flights, with filters on left/top and result cards in main area). *Decision to be made based on UX testing, but conversational is consistent with `triggerr`.*
        *   If Chat-style: `SearchHistorySidebar.tsx` shows flight search "conversations". `ChatConversationPanel.tsx` handles interaction. LLM assists in refining search ("Any non-stop options?", "Cheapest for that week?").
        *   **Flight Results**: Displayed using `components/flights/FlightOfferCard.tsx`.
            *   `FlightOfferCard.tsx`: Airline logo(s), full itinerary (departure/arrival times, airports, duration, stops, layover details), total price for selected passengers. "Select Flight" or "View Details" button. Clear branding that flights are provided by `FlightHub Connect`.
        *   **Filtering & Sorting**: If not fully conversational, UI elements for filtering (stops, airlines, price, times) and sorting (price, duration).
    *   **Flight Booking Flow (Can be multi-step process within modals or dedicated sub-pages of `/flights/book/`)**:
        1.  **Offer Confirmation/Review**: Detailed review of selected flight offer.
        2.  **Passenger Details**: Forms to input details for all travelers.
        3.  **Ancillaries (Optional)**: Seat selection, baggage options (if supported by Duffel/Amadeus and implemented).
        4.  **Payment**: Primarily card payment, processed securely via the OTA API provider's (Duffel/Amadeus) mechanisms. `FlightHub Connect` branding.
        5.  **Bundled Insurance Option**: At checkout, a clear option: "Add triggerr Delay Insurance for this trip for $X?" (with link to terms). If selected, adds insurance premium to total or handles as separate linked transaction.
        6.  **Booking Confirmation**: Displays PNR, e-ticket information, links to manage booking (via airline/OTA provider).
    *   **`DashboardPage.tsx` Enhancements for Phase 3**:
        *   New "My Flight Bookings" section: Lists all flights booked via `FlightHub Connect`, showing PNR, itinerary, status, links to manage booking on airline site.

*   **Footer Design (`components/layout/Footer.tsx`)**:
    *   Inspired by `Polar.sh`: Clean, multi-column layout.
    *   **Columns**:
        *   `triggerr` (Insurance): Flight Delay Insurance, How It Works, Track Policy, FAQs (Insurance).
        *   `FlightHub Connect` (Flights - Phase 3): Search Flights, Manage Bookings (link), Flight Deals (future).
        *   Company: About Us, Careers, Press, Blog.
        *   Support: Contact Us, Help Center (common for both), System Status.
        *   Legal: Terms of Service (separate for `triggerr` & `FlightHub Connect` if needed), Privacy Policy, Cookie Policy.
    *   Copyright notice, social media links.

---

## 6. Core User Flows

### Phase 1 (MVP - `triggerr` Insurance Focus):

1.  **User Onboarding & Custodial Wallet Creation**:
    *   User visits `triggerr.com`, clicks "Login," chooses "Continue with Google."
    *   Successful Better-Auth redirection. Frontend calls backend `POST /auth/complete-signup`.
    *   Backend `UserWalletService` creates a new PayGo wallet: generates address and private key. Private key is immediately encrypted using a strong system-level encryption key (managed via KMS). `paygo_address` and `encrypted_private_key` stored in `user_wallets` table.
    *   Frontend displays `WalletReadyModal.tsx`: "Welcome! Your secure triggerr PayGo Wallet is ready. You can manage it in your Dashboard." (No private key shown to user in MVP to maximize simplicity).
    *   **Alpha/Testnet**: User navigates to Dashboard -> My Wallet. Clicks "Request Test Tokens." Frontend calls `/api/wallet/faucet`. Backend `UserWalletService` uses `triggerr Direct`'s operational wallet to send test tokens to the user's custodial `paygo_address`. User sees balance update.
2.  **Conversational Insurance Quoting (LLM-assisted)**:
    *   User on `HomePage.tsx` enters flight details (e.g., "insurance for BA245 tomorrow") into the smart search bar.
    *   UI transitions to `InsuranceChatPage.tsx`. User's query is displayed.
    *   Frontend sends query to `/api/conversation/message`.
    *   Backend `ConversationService` (with LLM & `FlightDataService` for flight context/risk) processes query. `QuoteEngineService` calculates premiums for `triggerr Direct` policies.
    *   Assistant's response is streamed/sent to frontend, including flight context and `QuoteCard(s)` for delay insurance.
    *   LLM handles basic FAQs about the quotes or process, retrieved via RAG.
3.  **Policy Purchase (Stripe & Custodial PayGo Wallet)**:
    *   User clicks "Add to Cart" on a `QuoteCard.tsx`, then proceeds from cart to `CheckoutPage.tsx`.
    *   Reviews policy details. Selects payment method:
        *   **Stripe**:
            a.  Frontend calls `/api/payment/stripe/create-intent`. Backend `PaymentService` returns Stripe client secret.
            b.  Frontend uses Stripe Elements for secure card input and payment confirmation.
            c.  Stripe webhook (`/api/webhooks/stripe`) confirms `payment_intent.succeeded` to backend.
            d.  Backend `PolicyService` is notified. It then instructs `UserWalletService` (acting for `triggerr Direct`'s operational PayGo wallet) to create and fund the PayGo escrow for the policy's coverage amount. The `escrowId` is recorded against the policy.
        *   **Custodial PayGo Wallet**:
            a.  User selects "Pay with my triggerr Wallet." Frontend confirms intent to `/api/policy/create` (or similar) with payment type `CUSTODIAL_PAYGO`.
            b.  Backend `PolicyService` verifies user has sufficient balance in their custodial wallet (via `UserWalletService`).
            c.  `PolicyService` (via `UserWalletService` and `PayGoService`) orchestrates the creation of the `CreateEscrow` transaction. This involves temporarily decrypting the user's `encrypted_private_key` server-side, signing the transaction, and broadcasting it. The decrypted key is immediately discarded.
            d.  `escrowId` is recorded against the policy.
    *   Successful purchase: Frontend displays a confirmation page with policy details, status "Active," and the unique Policy Verification Code (Escrow ID).
4.  **Flight Monitoring & Automated Payouts**:
    *   Backend `FlightMonitorService` (scheduled tasks) queries `FlightDataService` (AviationStack, etc.) for status updates on active insured flights.
    *   If a validated delay meets policy terms: `FlightMonitorService` notifies `PolicyService`.
    *   `PolicyService` identifies the affected policy and its `escrow_id`.
    *   `PolicyService` (via `UserWalletService` and `PayGoService`) triggers the PayGo escrow payout. For user's custodial wallet, the funds are released from escrow directly into their `user_wallets.paygo_address`.
    *   User receives a notification (dashboard, email) of the payout.
5.  **Dashboard: Policy Management, Custodial Wallet Management**:
    *   Authenticated user accesses `/dashboard`.
    *   "My Policies": Lists policies with status, verification code.
    *   "My Wallet": Shows `paygo_address`, current balance (fetched live). "Request Test Tokens" button.
6.  **Anonymous Policy Tracking**:
    *   User visits `/track`. Enters Policy Verification Code.
    *   Frontend calls `/api/policy/track`. Backend retrieves and displays policy status, flight status, and payout status (if any).

### Phase 2: User Wallet Evolution:

1.  **Secure Private Key Export**:
    *   User navigates to Dashboard -> "My Wallet". Clicks "Export Private Key."
    *   System requires re-authentication (e.g., re-enter password or fresh OAuth token).
    *   Backend API `/api/wallet/export-key-request` is called.
    *   `UserWalletService` decrypts the user's `encrypted_private_key`.
    *   The private key is securely transmitted to the frontend (e.g., over HTTPS, displayed once).
    *   Frontend `PrivateKeyExportModal.tsx` shows the key with strong warnings: "Copy this key immediately and store it securely offline. If you lose it, triggerr cannot recover it. Once exported, you are solely responsible for its security."
    *   User must check an acknowledgment: "I understand the risks and have saved my private key securely."
    *   Backend records `user_wallets.key_exported_at`. (System may still retain encrypted key for custodial use unless user explicitly requests deletion and transitions to fully self-managed).
2.  **Linking External Wallet (Optional Feature)**:
    *   User provides their external PayGo address in dashboard.
    *   Platform verifies ownership (e.g., by signing a message).
    *   User can then choose this external wallet for receiving payouts or making PayGo payments.

### Phase 3 (`FlightHub Connect` OTA Integration):

1.  **Flight Search & Offer Display**:
    *   User on `triggerr.com` uses enhanced smart search for flights (e.g., "flights London to NYC next week").
    *   UI routes to `FlightSearchPage.tsx` (or dynamic equivalent).
    *   Frontend calls `/api/flighthub/search-offers`. Backend `FlightBookingService` queries Duffel/Amadeus.
    *   Results display `FlightOfferCard(s)` with flight details and prices, clearly branded as "Flights by FlightHub Connect."
2.  **Flight Booking & Payment**:
    *   User selects a `FlightOfferCard.tsx`.
    *   Proceeds through booking flow: passenger details, (optional) ancillaries.
    *   Payment for flights (credit/debit card) is handled via the integrated payment solutions of Duffel or Amadeus, orchestrated by `FlightBookingService` via `/api/flighthub/create-booking`. `FlightHub Connect` is the merchant.
    *   Booking confirmed: PNR shown. Booking saved to `flight_bookings`.
3.  **Bundled Flight + `triggerr` Insurance Purchase**:
    *   During flight booking checkout (or immediately after flight confirmation), user is presented with a clear option: "Add triggerr Flight Delay Insurance for this trip for $X?"
    *   If selected, user proceeds to a streamlined insurance checkout (can use stored payment methods or custodial wallet), linking the policy to the `flight_bookings.id`.

---

## 7. PayGo Wallet Management (Custodial MVP, Path to Semi/Non-Custodial)

*   **MVP - Custodial Wallet Creation & Secure Management by `triggerr`**:
    *   **Creation**: Automatically on first successful user login (Better-Auth). `UserWalletService` generates PayGo address and private key.
    *   **Private Key Storage**: The private key is **immediately encrypted** using a strong, industry-standard symmetric encryption algorithm (e.g., AES-256-GCM). The encryption key itself is managed by a secure Key Management Service (KMS) like HashiCorp Vault, AWS KMS, or Google Cloud KMS. The `encrypted_private_key` is stored in the `user_wallets` table.
    *   **Transaction Signing (Custodial)**: For operations requiring the user's signature from their custodial wallet (e.g., paying for a policy escrow from their wallet balance), the backend service (`UserWalletService` or `PolicyService`):
        1.  Authenticates and authorizes the user action.
        2.  Retrieves the `encrypted_private_key` from the database.
        3.  Makes a secure call to the KMS to decrypt the private key *in memory*.
        4.  Uses the decrypted private key to sign the PayGo transaction.
        5.  **Immediately discards the decrypted private key from memory.** It is never logged or stored unencrypted.
    *   **User Interface**: Users see their wallet address and balance in the dashboard. They authorize transactions through platform UI elements (e.g., "Confirm Payment" button), not by directly handling keys in MVP.
*   **Phase 2 Evolution - Introducing User Control**:
    *   **Secure Private Key Export**: A feature will be added to the dashboard allowing users to export their private key. This will:
        *   Require strong re-authentication (password and/or 2FA if implemented).
        *   Clearly explain the implications of self-custody (responsibility for security, no recovery by `triggerr` if lost).
        *   Display the private key for copying, with strong advice to store it offline securely.
        *   Update `user_wallets.key_exported_at`. The platform may still offer to keep the encrypted key for custodial convenience unless the user explicitly requests its deletion (advanced option, with more warnings).
    *   **User Education**: Comprehensive guides and FAQs on blockchain, private keys, self-custody best practices, and the benefits/risks compared to custodial services.
    *   **Option to Link External Wallet (Exploratory for Phase 2, solid for Phase 3)**: Users can link an existing, self-managed PayGo wallet to their `triggerr` account. This external wallet can then be designated for receiving payouts or making payments, bypassing the custodial wallet for users who prefer full control.
*   **Security Architecture for Custodial Keys (Essential for MVP)**:
    *   Use of a reputable KMS for managing the master encryption keys.
    *   Strong encryption algorithms (e.g., AES-256-GCM).
    *   Principle of least privilege: Backend services that need to perform signing operations will have tightly controlled, audited access to the KMS decryption function.
    *   Regular security audits of the key management and transaction signing processes.
    *   Defense-in-depth: Multiple layers of security controls (network, application, database).
*   **Faucet Functionality for Alpha/Testnet Testing**:
    *   User-initiated from their dashboard ("My Wallet" section).
    *   Frontend calls an authenticated API endpoint (e.g., `/api/wallet/faucet`).
    *   Backend `UserWalletService` uses `triggerr Direct`'s pre-funded operational PayGo wallet to send a small amount of test tokens to the requesting user's custodial `paygo_address`.

---

## 8. Payment Integration Strategy

*   **Multi-Provider Architecture Goal**: To provide flexibility for users and operational resilience for the platform.
*   **MVP Providers (for `triggerr` Insurance Premiums)**:
    *   **PayGo**:
        *   The core blockchain for managing policy escrows (funded by `triggerr Direct` or user's wallet).
        *   The medium for users (via their custodial wallet) to directly pay insurance premiums.
        *   The channel for users to receive automated insurance payouts into their custodial wallet.
    *   **Stripe**:
        *   The primary fiat payment gateway for users to pay insurance premiums using credit/debit cards.
*   **Future Provider Considerations**: Polar.sh can be evaluated for its specific strengths (e.g., developer-focused tooling, alternative digital product models) as an additional or alternative payment processor in later phases.
*   **Fiat-to-Crypto for Escrow Funding (Stripe Flow for `triggerr Direct`)**:
    1.  User pays insurance premium in fiat via Stripe on `triggerr.com`.
    2.  `triggerr Direct` receives the fiat funds into its bank account.
    3.  `triggerr Direct` (through its system-managed, operational PayGo wallet) then funds the corresponding PayGo policy escrow with the required crypto amount. This implies `triggerr Direct` manages a crypto float or has a process for converting fiat to crypto for these operations.
*   **Direct Crypto for Escrow Funding (User's Custodial PayGo Wallet Flow)**:
    1.  User opts to pay premium from their `triggerr`-managed custodial PayGo wallet.
    2.  User authorizes the transaction on `triggerr.com`.
    3.  Backend `PolicyService` (with `UserWalletService`) uses the user's securely stored (and temporarily decrypted) private key to sign and broadcast the `CreateEscrow` transaction from the user's custodial wallet.
*   **Flight Payments (Phase 3 - `FlightHub Connect`)**:
    *   Flight booking APIs like Duffel and Amadeus typically have their own integrated payment processing capabilities for credit/debit cards. `FlightHub Connect` will primarily leverage these, acting as the merchant or sub-merchant as per the API provider's model.
    *   Exploration of PayGo for flight ticket payments (e.g., user paying `FlightHub Connect` with PayGo, or `FlightHub Connect` using PayGo for B2B settlements with airlines/aggregators) is a longer-term research item, highly dependent on industry adoption and the technical feasibility of integrating PayGo into these complex settlement chains.

---

## 9. Conversational AI (LLM Integration)

*   **MVP Scope (Insurance Focus for `triggerr`)**:
    *   **Natural Language Query Parsing**: Understand user intent from free-text flight search queries specifically for obtaining insurance (e.g., "I need insurance for my trip from London to NYC next Tuesday," "Cover for flight BA 245," "What if my flight to Paris is delayed?"). Extract key entities: origin, destination, dates, flight numbers.
    *   **Conversational Quote Presentation**: After backend services generate quote options, the LLM will help present these within the chat interface in a clear, easy-to-understand, and guided manner. E.g., "Okay, for your flight BA245, triggerr Direct offers two delay policies: one for delays over 60 minutes at $25, and another for delays over 120 minutes at $18. Both offer automatic PayGo payouts."
    *   **FAQ Answering (RAG-based)**: Answer common user questions about parametric insurance, how PayGo is used, policy terms, the payout process, and using the `triggerr` platform. The knowledge base for RAG will be `triggerr`'s own documentation, policy wordings, and curated FAQs.
    *   **Guided Interaction & Clarification**: Basic turn-based conversation to clarify ambiguous queries or guide users. E.g., "Which date were you thinking of for your flight to Paris?", "Would you like to see more details about the 60-minute policy, add it to your cart, or perhaps search for a different flight?"
*   **Phase 3 Scope (Extend for `FlightHub Connect` OTA Integration)**:
    *   **Flight Search Query Parsing**: Enhance NLU to robustly handle detailed flight search queries (e.g., "Find me a round trip flight from LHR to JFK, departing Sep 10, returning Sep 17, for 2 adults in economy").
    *   **Conversational Flight Booking Assistance (Basic)**: Potentially assist users in clarifying flight options presented by `FlightHub Connect` (e.g., "What's the baggage allowance on that Lufthansa flight?", "Are there any earlier departures?"). This depends heavily on the capabilities of the chosen LLM and the structured data available from flight booking APIs.
    *   **FAQ for Flight Booking**: Extend RAG knowledge base to cover common questions about flight bookings, cancellations, changes (linking to `FlightHub Connect` policies and airline rules).
*   **Technology**:
    *   Select a small, efficient, and instruction-following LLM optimized for conversational tasks and entity extraction. Candidates:
        *   Self-hosted fine-tuned open-source models (e.g., quantized versions of Llama-3-8B-Instruct, Mistral-7B-Instruct) if infrastructure and MLOps capabilities are in place.
        *   Cost-effective commercial LLM APIs known for strong instruction following, low latency, and good safety features (e.g., Gemini 1.5 Flash, Claude 3 Haiku).
    *   Backend `ConversationService` (in `packages/services/conversation/ConversationService.ts`) will:
        *   Manage conversation state and history using `conversation_threads` and `conversation_messages` tables.
        *   Pre-process user input (e.g., sanitization, intent classification hint).
        *   Construct well-engineered prompts for the LLM, incorporating RAG context for FAQs or grounding responses with policy/flight data.
        *   Interface with the chosen LLM (API calls or model inference).
        *   Post-process LLM responses (e.g., extracting structured data, ensuring safety, formatting for UI).
*   **Data Storage**:
    *   `conversation_threads`: Stores the overall context of each user's interaction (links to `user_id` or `anonymous_session_id`, captures initial query, evolving flight/insurance context).
    *   `conversation_messages`: Stores each individual message (sender: 'USER' or 'ASSISTANT', text content, any structured UI elements like presented quote card IDs, LLM metadata for analysis). This data is valuable for debugging, understanding user journeys, and potential future fine-tuning of LLMs.

---

## 10. Flight Data & Booking APIs

*   **MVP (Phase 1 - `triggerr` Insurance Underwriting, Monitoring & Contextual Information)**:
    *   **Primary Data Source**: `AviationStack` - Chosen for its comprehensive data on flight schedules, routes, airport information, historical flight data (crucial for risk assessment), and live flight status tracking.
    *   **Secondary/Verification Sources**: `FlightAware`, `OpenSky Network` - Utilized primarily for redundant live flight status tracking, cross-verification of delay information, and potentially different update latencies or coverage for specific regions/airlines.
    *   **Integration Method**: All flight data API interactions are centralized through a backend `FlightDataService` (e.g., `packages/services/flightdata/FlightDataService.ts`). This service abstracts the specific API client calls, handles API key management, implements caching strategies, and normalizes data structures from different sources before providing it to other services like `QuoteEngineService` or `FlightMonitorService`.
*   **Phase 3 (OTA - `FlightHub Connect` - Flight Search, Offers & Booking)**:
    *   **Primary Booking API**: `Duffel` - Selected for its modern REST API, developer-friendly approach, good documentation, direct airline connections (NDC content), and clear path for searching offers and creating booking orders. Ideal for building the core flight booking engine for `FlightHub Connect`.
    *   **Secondary Booking API/Content Source**: `Amadeus Self-Service APIs` - Chosen to provide access to broader GDS content, potentially including different airlines, LCCs, or fare types not available through Duffel. Also serves as a strategic step towards data source independence and resilience for `FlightHub Connect`.
    *   **Integration Method**: A new backend `FlightBookingService` (e.g., `packages/services/flightbooking/FlightBookingService.ts`) will be developed specifically for Phase 3. This service will:
        *   Interface with both Duffel and Amadeus client libraries (located in `packages/integrations/duffel/` and `packages/integrations/amadeus/`).
        *   Handle flight search requests, sending them to one or both providers.
        *   Aggregate and normalize flight offers.
        *   Manage the flight booking lifecycle (creating orders, handling payments via provider mechanisms, retrieving booking confirmations).
        *   Interface with `ConversationService` if conversational flight booking assistance is implemented.

---

## 11. API Endpoints (Backend)

All backend API endpoints will be implemented as Next.js API Routes, primarily located within `apps/web/app/api/`. They will be versioned if necessary (e.g., `/api/v1/...`).

### Phase 1: MVP Insurance Focused Endpoints

*   **Authentication (`/api/auth/...`)**:
    *   Standard Better-Auth routes for Google OAuth: `/api/auth/google` (initiate), `/api/auth/callback` (handle redirect), `/api/auth/session` (get current session), `/api/auth/signout`.
    *   `POST /api/auth/complete-signup`: Called by frontend after first successful Better-Auth new user login. Triggers `UserWalletService` for custodial PayGo wallet creation. Returns success/failure status.
*   **User Wallet (`/api/wallet/...`)** (All Authenticated):
    *   `GET /api/wallet/info`: Returns the authenticated user's custodial `paygo_address` and `cached_balance_amount` from `user_wallets`. Triggers an asynchronous background task to refresh the balance from the PayGo node if `last_balance_check` is stale.
    *   `POST /api/wallet/faucet`: (Alpha/Testnet Environment ONLY) Allows authenticated user to request test tokens for their custodial wallet. `UserWalletService` orchestrates transfer from system faucet wallet.
*   **Conversation & Insurance Quoting (`/api/conversation/...`)**:
    *   `POST /api/conversation/message`: (Authenticated or Anonymous with `anonymous_session_id`) Accepts user message (`content`, `thread_id` if part of existing conversation). `ConversationService` processes it (LLM for NLU/RAG, calls `QuoteEngineService` if insurance query). Returns assistant's message, which may include flight context and structured data for insurance quote cards. Manages `conversation_threads` and `conversation_messages`.
*   **Insurance Policy (`/api/policy/...`)**:
    *   `POST /api/policy/create`: (Authenticated) Takes selected quote ID (from `ConversationService` response), chosen payment method (`STRIPE` or `CUSTODIAL_PAYGO`), and any necessary policyholder details.
        *   If `STRIPE`: `PaymentService` creates Stripe Payment Intent, returns client secret.
        *   If `CUSTODIAL_PAYGO`: `PolicyService` (via `UserWalletService`) will initiate escrow creation from user's custodial wallet.
        *   This endpoint is responsible for starting the policy creation process. Actual confirmation and escrow ID linking might happen via webhooks or subsequent calls.
    *   `POST /api/policy/confirm-stripe-escrow`: (Internal, called after Stripe webhook success) Takes policy ID/reference. `PolicyService` instructs `triggerr Direct` system wallet to fund PayGo escrow. Returns final policy info & verification code.
    *   `POST /api/policy/confirm-custodial-paygo-escrow`: (Internal, called after PayGo escrow creation from custodial wallet is confirmed) Takes policy ID/reference and `escrow_id`. `PolicyService` finalizes policy. Returns final policy info & verification code.
    *   `GET /api/policy/track`: (Anonymous) Accepts `policy_verification_code` (Escrow ID). Returns status of the policy, relevant flight, and any payout.
    *   `GET /api/policy/list`: (Authenticated) Returns a list of policies (summary: ID, flight, status, premium, coverage) for the authenticated user from the `policy` table.
    *   `GET /api/policy/:policyId`: (Authenticated) Returns detailed information for a specific policy owned by the user.
*   **Payment Webhooks (`/api/webhooks/...`)**:
    *   `POST /api/webhooks/stripe`: Securely handles incoming webhook events from Stripe (e.g., `payment_intent.succeeded`, `charge.refunded`). Triggers relevant backend processes (e.g., confirm payment for policy, initiate escrow funding).
*   **Internal / System Endpoints** (Protected, not directly user-facing, require special auth/IP whitelisting):
    *   Endpoints for `FlightMonitorService` to receive triggers or for admin to manually trigger checks.
    *   Admin endpoints for managing `triggerr Direct`'s operational PayGo wallet, system configurations, viewing platform metrics.

### Phase 2: API Additions for Wallet Evolution

*   **User Wallet (`/api/wallet/...`)** (Authenticated):
    *   `POST /api/wallet/export-key-request`: Initiates the secure flow for a user to retrieve their (decrypted) private key. Requires re-authentication. Returns the key securely for one-time display/copy.

### Phase 3: `FlightHub Connect` OTA Focused Endpoints (e.g., prefixed `/api/flighthub/...`)

*   **Flight Search & Offers**:
    *   `POST /api/flighthub/search-offers`: (Authenticated or Anonymous) Accepts flight search parameters (origin, destination, dates, passenger count, cabin class, etc.). `FlightBookingService` queries Duffel/Amadeus. Returns a list of structured flight offers.
    *   `GET /api/flighthub/offer/:externalOfferId/verify-price`: (Authenticated or Anonymous) Re-validates the price and availability of a specific flight offer (identified by `externalOfferId` from Duffel/Amadeus) before proceeding to booking.
*   **Flight Booking**:
    *   `POST /api/flighthub/create-booking`: (Authenticated, or anonymous leading to guest checkout/signup) Accepts selected `external_offer_id`, detailed passenger information, and payment details (or a tokenized payment reference if client-side handles card capture with OTA provider's SDK). `FlightBookingService` creates the booking with Duffel/Amadeus. Returns booking confirmation (PNR, status).
    *   `GET /api/flighthub/booking/:bookingId`: (Authenticated) Retrieves details of a specific flight booking made by the user (using internal `bookingId` or `external_booking_id`).
    *   `POST /api/flighthub/booking/:bookingId/cancel`: (Authenticated, if API supports) Initiates a flight booking cancellation request through the OTA API provider.
*   **Ancillaries & Seat Maps (If supported by Duffel/Amadeus and implemented)**:
    *   `GET /api/flighthub/offer/:externalOfferId/seatmap`: Retrieves seat map for selected flights in an offer.
    *   `POST /api/flighthub/booking/:bookingId/add-ancillaries`: Adds selected ancillaries (e.g., extra baggage) to an existing booking.

---

## 12. Phased Implementation Roadmap (Summary)

*(Detailed tasks, user stories, and sprint planning will be managed in dedicated project tracking tools like `MVP_todo.md`, Jira, or similar. This section provides a high-level strategic sequence.)*

### Phase 1: Insurance Platform Launch ("The Parametric Insurance Experts") - Custodial Wallet MVP

*   **Primary Focus**: Deliver a fully functional parametric flight delay insurance platform (`triggerr.com`) with a seamless custodial PayGo wallet experience. Establish `triggerr` as the go-to brand for this insurance type.
*   **Key Deliverables (Recap)**:
    1.  User Onboarding: Google Better-Auth, automatic server-side custodial PayGo wallet creation (encrypted keys stored by `triggerr`).
    2.  Smart Flight Search for Insurance Context (MVP: Flight Number, Route + Date parsing).
    3.  Conversational UI (`InsuranceChatPage`): LLM for query understanding, basic RAG-based FAQ, and guided presentation of insurance quotes (`QuoteCard.tsx`) from `triggerr Direct`.
    4.  Policy Purchase Flow:
        *   Stripe for fiat payments (backend `triggerr Direct` system wallet funds PayGo escrow).
        *   Payment from user's custodial PayGo wallet (backend signs `CreateEscrow` using temporarily decrypted user key).
    5.  Automated Flight Monitoring (AviationStack, FlightAware, OpenSky via `FlightDataService` & `FlightMonitorService`).
    6.  Automated Parametric Payouts (PayGo escrow release to user's custodial PayGo wallet).
    7.  User Dashboard: View Policies (status, verification code), Manage Custodial Wallet (view address, balance, Alpha/Testnet Faucet button).
    8.  Anonymous Policy Tracking (via verification code/Escrow ID).
    9.  Essential Legal Pages (Terms of Service, Privacy Policy).
*   **Key Success Metrics (Phase 1)**: Number of policies issued, Gross Written Premium (GWP) for `triggerr Direct`, rate of successful automated payouts, customer satisfaction (NPS/CSAT), user acquisition cost for insurance policies, average time-to-payout for claims.

### Phase 2: Enhanced Insurance Features & User Wallet Evolution

*   **Primary Focus**: Broaden the parametric insurance product suite, improve platform intelligence, begin onboarding third-party insurers, and empower users with options for PayGo wallet self-custody.
*   **Key Deliverables**:
    1.  New Parametric Insurance Products: Research, develop, and launch at least one additional product (e.g., weather-related travel delay, baggage delay).
    2.  User Wallet Self-Custody Option: Implement secure private key export feature in User Dashboard, accompanied by comprehensive user education.
    3.  (Optional) Link External Wallet: Allow users to use their own self-managed PayGo wallets for transactions.
    4.  Enhanced LLM Capabilities: More nuanced conversational flows, better context retention, ability to handle more complex insurance-related queries.
    5.  Third-Party Insurer Onboarding (Pilot): Develop basic provider portal functionalities and onboard 1-2 pilot third-party insurance providers to the `triggerr` marketplace.
    6.  Predictive Delay Alerts (Beta): Experiment with notifying users of potential flight issues based on aggregated data.

### Phase 3: OTA Integration - `FlightHub Connect` Launch

*   **Primary Focus**: Introduce comprehensive flight search and booking capabilities as a distinct but seamlessly integrated service under the `FlightHub Connect` brand, complementing `triggerr`'s insurance offerings.
*   **Key Deliverables**:
    1.  Legal and Brand Setup for `FlightHub Connect`.
    2.  Backend `FlightBookingService`: Robust integration with Duffel (primary) and Amadeus Self-Service (secondary) APIs for flight search, offer management, booking, and post-booking operations.
    3.  Frontend UI on `triggerr.com` (or a clearly linked portal) for `FlightHub Connect` services:
        *   Enhanced smart search to handle flight queries.
        *   Dedicated flight search results page/view (`FlightSearchPage.tsx`) displaying `FlightOfferCard(s)`.
        *   Full flight booking funnel (passenger details, payment via OTA provider's system).
    4.  Bundled Offers: UI and logic to easily add `triggerr` insurance to `FlightHub Connect` flight bookings.
    5.  User Dashboard: Addition of "My Flight Bookings" section, showing PNRs, itineraries, and links to manage bookings (typically on airline sites).
    6.  Payment processing for flight tickets (leveraging OTA API provider's payment solutions).

---

## 13. Future Considerations & Advanced Features (Post-MVP Phases)

*   **Deeper DeFi & PayGo Ecosystem Integrations**: Exploring more complex PayGo escrow models (e.g., multi-party conditional escrows, programmatic dispute resolution), yield generation opportunities for escrowed funds (if permissible), or using PayGo for B2B settlements with providers.
*   **NFT-Based Policies & Travel Collectibles**: Representing insurance policies or unique travel experiences/benefits as Non-Fungible Tokens (NFTs) for provable ownership, transferability, or access to exclusive perks.
*   **Advanced Risk Modeling & Dynamic Pricing**: Leveraging machine learning and expanded datasets (e.g., real-time airport congestion, ATC communications sentiment) for highly dynamic and personalized insurance premium calculations.
*   **Full Multi-Provider Insurance Marketplace**: Comprehensive self-service provider portal for onboarding, product management, analytics, and settlement for third-party insurers. Rich tools for providers to customize their offerings.
*   **Dedicated Mobile Application**: Native iOS and Android applications for `triggerr` (and potentially `FlightHub Connect`) for enhanced user experience, push notifications, and offline access to policy/booking details.
*   **Global Expansion & Localization**: Systematically expanding support for multiple languages, currencies, regional payment methods, and navigating diverse regulatory environments for both insurance and OTA operations.
*   **Advanced AI & Personalization**:
    *   Proactive insurance offers based on users' travel patterns or upcoming bookings detected.
    *   Personalized travel assistance: LLM-powered concierge services integrated with flight bookings (e.g., "My flight is delayed, what are my rebooking options?", "Find a hotel near JFK for tonight").
    *   Automated support for simpler flight booking modifications via LLM and OTA APIs.
*   **Community Building & Decentralized Governance**: Exploring mechanisms for community engagement, feedback loops, and potentially decentralized governance aspects for the `triggerr` platform or its interaction with the PayGo ecosystem, if aligned with PayGo's evolution.
*   **Integration with other Travel Services**: Partnerships or API integrations for hotels, car rentals, local experiences to create a more holistic travel platform (potentially under `FlightHub Connect` or a broader travel brand).

---