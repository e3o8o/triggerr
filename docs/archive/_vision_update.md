# triggerr: Parametric Insurance & Future Travel Platform - Vision & Architecture v2.0

**Document Version**: 2.0
**Last Updated**: 2025-01-27
**Status**: Master Architectural Blueprint (API-First Implementation)
**Primary Goal (MVP - Phase 1)**: Establish `triggerr.com` as the leading platform for parametric flight delay insurance, featuring an API-first architecture that enables seamless anonymous quote generation with conversion to authenticated policy purchases. Built on a robust data foundation with comprehensive reference data and Row Level Security (RLS) supporting public access.

---

## Table of Contents

1.  **Executive Summary & Current State**
    *   Foundation Achievements
    *   Strategic Pivot to API-First Architecture
    *   Implementation Readiness Assessment
2.  **Strategic Overview & Core Principles**
    *   Phased Rollout Strategy
    *   Brand Positioning & Key Differentiators
    *   Anonymous-to-Authenticated User Journey
3.  **Technical Architecture & Implementation Strategy**
    *   API-First Development Approach
    *   Technology Stack & Project Structure
    *   Data Flow Architecture
    *   Security Model (RLS + Better-Auth)
4.  **Database Architecture & Data Foundation**
    *   Comprehensive Reference Data (Seeded & Operational)
    *   Row Level Security Implementation
    *   Escrow & Blockchain Integration
5.  **API Architecture & Endpoints**
    *   Public APIs (Anonymous Access)
    *   Authenticated APIs (User Management)
    *   Integration APIs (External Services)
    *   Phase-Based API Rollout
6.  **User Experience & Frontend Design**
    *   Design Inspirations & Core Principles
    *   Conversational Interface Architecture
    *   Key Pages & UI Components
    *   Mobile-First Responsive Design
7.  **Implementation Roadmap & Timeline**
    *   Phase 1: Core APIs & Business Logic (Weeks 1-4)
    *   Phase 2: Frontend Development (Weeks 5-6)
    *   Phase 3: Better-Auth Integration (Weeks 7-8)
    *   Phase 4: Testing & Launch Preparation (Weeks 9-10)
8.  **Business Model & Entity Structure**
    *   Platform Strategy & Revenue Streams
    *   Provider Management & Escrow Models
    *   Regulatory Compliance & Risk Management

---

## 1. Executive Summary & Current State

### Foundation Achievements ✅

**Robust Data Foundation Completed:**
- **Comprehensive Database Schema**: Fully implemented with 14 escrow models, complete provider/policy management
- **Reference Data Seeded**: ~249 countries, ~3,929 regions, ~5,731 airlines, ~9,079 airports, ~10,115 runways, 64,100+ routes
- **Row Level Security (RLS)**: Anonymous access model implemented enabling public quote generation
- **Better-Auth Configuration**: Server-side setup complete with Google OAuth integration
- **External API Integration**: Tested integrations with AviationStack, FlightAware, OpenSky, Weather APIs
- **Monorepo Structure**: Well-organized API-first architecture with clear separation of concerns

**Key Technical Achievements:**
- PostgreSQL + Drizzle ORM with comprehensive schema migrations
- Escrow ID generator supporting 14 different blockchain escrow models
- Historical data persistence tables for flight segments and weather observations
- Comprehensive seeding scripts with data integrity validation
- PayGo blockchain integration foundation

### Strategic Pivot to API-First Architecture

**Decision Rationale:**
The API-first approach leverages our completed data foundation and RLS security model to enable rapid development and testing of core business logic without authentication complexity blocking progress.

**Key Benefits:**
- **Immediate Development**: Core APIs can be built and tested using seeded reference data
- **Anonymous Access**: RLS enables public quote generation, improving conversion rates
- **Parallel Development**: Frontend and backend can be developed simultaneously
- **External Integration Ready**: API-first supports planned B2B integrations
- **Better-Auth as Layer**: Authentication becomes an enhancement, not a blocker

### Implementation Readiness Assessment

**Ready for Development:**
- ✅ Database schema and seeded data
- ✅ Security model (RLS + Better-Auth foundation)
- ✅ External API integrations tested
- ✅ Project structure and build system
- ✅ Business logic architecture defined

**Next Phase Requirements:**
- 🔄 Core API endpoints implementation
- 🔄 Business logic engines (Quote, Policy, Payout)
- 🔄 Frontend conversational interface
- 🔄 Payment system integration (Stripe + PayGo)

---

## 2. Strategic Overview & Core Principles

### Phased Rollout Strategy

**Phase 1: Insurance Platform Launch (API-First MVP - Weeks 1-10)**
- **Goal**: Establish core parametric insurance functionality with seamless anonymous-to-authenticated flow
- **Focus**: Flight delay insurance by triggerr Direct
- **Key Features**:
  - Anonymous flight search and quote generation
  - Conversational AI-powered insurance guidance
  - Seamless authentication at purchase point
  - Automatic flight monitoring and payouts
  - Custodial PayGo wallet management
  - Policy tracking with verification codes

**Phase 2: Enhanced Features & Wallet Evolution (Months 3-6)**
- **Goal**: Expand insurance products and introduce user wallet control
- **Features**: Private key export, external wallet linking, additional insurance products
- **Platform**: Multi-provider marketplace foundation

**Phase 3: OTA Integration - FlightHub Connect (Months 7-12)**
- **Goal**: Integrate flight booking capabilities
- **Features**: Duffel/Amadeus integration, bundled flight + insurance offerings
- **Brand**: FlightHub Connect as complementary service

### Brand Positioning & Key Differentiators

**Primary Brand**: triggerr - "The Parametric Insurance Experts"

**Core Differentiators:**
- **Instant Quotes**: Anonymous access enables immediate quote generation
- **Conversational Interface**: Natural language flight search and insurance guidance
- **Automatic Payouts**: Blockchain-secured escrow with parametric triggers
- **Data Intelligence**: Comprehensive reference data for accurate risk assessment
- **Seamless Onboarding**: Custodial wallet removes crypto complexity

### Anonymous-to-Authenticated User Journey

**Anonymous Experience (No Barriers):**
1. Natural language flight search ("BA245 tomorrow insurance")
2. Instant quote generation with flight risk data
3. Policy terms and coverage explanation
4. Anonymous policy tracking capability

**Authentication Trigger (Conversion Point):**
5. Policy purchase requires Google OAuth login
6. Automatic custodial PayGo wallet creation
7. Seamless payment processing (Stripe or PayGo)
8. Policy activation and monitoring

**Authenticated Experience (Value-Added):**
9. Policy dashboard and history
10. Wallet management and balance tracking
11. Automatic payout notifications
12. Advanced features and preferences

---

## 3. Technical Architecture & Implementation Strategy

### API-First Development Approach

**Core Philosophy:**
Build robust, testable APIs first, then layer on authentication and frontend interfaces. This approach enables rapid iteration and external integration while maintaining security.

**Development Sequence:**
1. **Reference Data APIs** → Leverage seeded data for immediate functionality
2. **Flight Search APIs** → Integrate external aggregators with cached data
3. **Quote Generation APIs** → Core business logic with risk assessment
4. **Policy Management APIs** → Escrow integration and lifecycle management
5. **Payment APIs** → Stripe and PayGo integration
6. **Frontend Interface** → React SPA with conversational UI
7. **Better-Auth Integration** → Authentication layer over existing APIs

### Technology Stack & Project Structure

**Core Technologies:**
- **Database**: PostgreSQL + Drizzle ORM (schema-first approach)
- **Backend**: Next.js API Routes with API-first architecture
- **Frontend**: React SPA (chat0-inspired) bootstrapped by Next.js shell
- **Authentication**: Better-Auth with Google OAuth
- **Blockchain**: PayGo Protocol for escrow management
- **Payments**: Stripe (fiat) + PayGo (crypto) integration
- **AI**: LLM integration for conversational interface

**Project Structure:**
```
apps/web/
├── src/app/                 # Next.js App Router
│   ├── api/                 # API-first endpoints
│   └── shell/              # SPA bootstrap
├── src/frontend/           # React SPA (chat0-inspired)
│   ├── components/         # UI components
│   ├── pages/             # Route components
│   └── hooks/             # Custom hooks

packages/
├── core/                  # Database, auth, shared logic
├── api/                   # API route handlers and validation
├── services/              # Business logic services
├── integrations/          # External API clients
└── shared/               # Types, utilities, constants
```

### Data Flow Architecture

**Anonymous Quote Generation Flow:**
1. User inputs flight query → Smart parsing (LLM-assisted)
2. Flight data aggregation → Reference data + live APIs
3. Risk assessment → Historical data analysis
4. Quote generation → Provider-specific pricing
5. Quote presentation → Conversational interface

**Policy Purchase Flow:**
1. Quote selection → Authentication prompt (Better-Auth)
2. User verification → Custodial wallet creation
3. Payment processing → Stripe or PayGo
4. Escrow creation → PayGo blockchain
5. Policy activation → Monitoring initiation

**Automated Payout Flow:**
1. Flight monitoring → Multi-source verification
2. Delay detection → Parametric trigger evaluation
3. Claim validation → Automated assessment
4. Payout execution → Escrow release to user wallet
5. Notification → User dashboard and email

### Security Model (RLS + Better-Auth)

**Row Level Security (RLS) Implementation:**
- **Anonymous Access**: Reference data, flight search, quote generation
- **Authenticated Access**: Policy management, user data, wallet operations
- **Service Role**: Backend operations, data management, escrow handling

**Better-Auth Integration:**
- Google OAuth as primary authentication method
- Session-based authentication for API access
- Middleware for route protection
- User management and profile handling

---

## 4. Database Architecture & Data Foundation

### Comprehensive Reference Data (Seeded & Operational)

**Reference Data Status:**
- ✅ **Countries**: ~249 entries with ISO codes and continent mapping
- ✅ **Regions**: ~3,929 entries with country relationships
- ✅ **Airlines**: ~5,731 entries with IATA/ICAO codes and fleet data
- ✅ **Airports**: ~9,079 entries with timezone and location data
- ✅ **Runways**: ~10,115 entries with airport relationships
- ✅ **Aircraft Types**: 231 entries with manufacturer data
- ✅ **Routes**: 64,100+ entries with airline and airport relationships

**Historical Data Tables:**
- `historical_flight_segments` - Normalized flight data with timestamps
- `historical_weather_observations` - Weather data for risk assessment
- `raw_api_call_logs` - Complete API response logging for audit

### Row Level Security Implementation

**Security Policies:**
```sql
-- Anonymous users can access public reference data
-- Authenticated users can access their own policies and data
-- Service role can perform backend operations
-- Providers can access their own products and policies
```

**Key Benefits:**
- Enables anonymous quote generation
- Protects user data and policies
- Supports multi-provider marketplace
- Facilitates external API integration

### Escrow & Blockchain Integration

**Escrow Models Supported (14 Types):**
- Single-sided, Dual-sided, Combined escrow
- Pooled models (Collateralized, Bonded, P2P)
- Advanced models (Dynamic, Prediction Market, NFT)

**PayGo Integration:**
- Custodial wallet management for users
- Automatic escrow creation and funding
- Parametric payout triggers
- Transparent blockchain verification

---

## 5. API Architecture & Endpoints

### Public APIs (Anonymous Access)

**Reference Data APIs:**
```
GET /api/public/countries
GET /api/public/regions
GET /api/public/airlines
GET /api/public/airports
GET /api/public/aircraft-types
```

**Flight Search APIs:**
```
GET /api/public/flights/search
GET /api/public/flights/{flightNumber}/status
GET /api/public/flights/{flightNumber}/history
```

**Quote Generation APIs:**
```
POST /api/public/quotes/generate
GET /api/public/quotes/{quoteId}
POST /api/public/quotes/{quoteId}/validate
```

**Policy Tracking APIs:**
```
GET /api/public/policies/{verificationCode}/status
```

### Authenticated APIs (User Management)

**User Management:**
```
GET /api/user/profile
PUT /api/user/profile
GET /api/user/policies
GET /api/user/wallet
POST /api/user/wallet/faucet
```

**Policy Management:**
```
POST /api/policies/create
GET /api/policies
GET /api/policies/{policyId}
PUT /api/policies/{policyId}
DELETE /api/policies/{policyId}
```

**Payment APIs:**
```
POST /api/payments/stripe/create-intent
POST /api/payments/paygo/create-escrow
POST /api/payments/paygo/release-escrow
```

### Integration APIs (External Services)

**Webhook Endpoints:**
```
POST /api/webhooks/stripe
POST /api/webhooks/paygo
POST /api/webhooks/flightaware
```

**Conversational AI:**
```
POST /api/conversation/message
GET /api/conversation/{threadId}
GET /api/conversation/{threadId}/messages
```

### Phase-Based API Rollout

**Phase 1 (Weeks 1-4): Core APIs**
- Reference data endpoints
- Flight search and data aggregation
- Quote generation engine
- Policy management foundation

**Phase 2 (Weeks 5-6): Enhanced APIs**
- Payment processing integration
- Webhook handlers
- Conversational AI endpoints
- User management APIs

**Phase 3 (Weeks 7-8): Authentication Layer**
- Better-Auth middleware integration
- Protected route implementation
- User session management
- Wallet management APIs

---

## 6. User Experience & Frontend Design

### Design Inspirations & Core Principles

**Scira-Inspired Landing Page:**
- Clean, professional design with clear value proposition
- Smart search interface supporting natural language input
- Trustworthy aesthetic appropriate for financial services
- Single clear call-to-action focused on insurance quotes

**Chat0-Inspired Search Interface:**
- Two-column layout: sidebar for context, main panel for interaction
- Conversational approach to insurance guidance
- History/context management for user sessions
- Sidebar adaptation: conversation history + policy cart

**Flight.google.com Advanced Search:**
- Intelligent single-input field parsing multiple query types
- Advanced search reveals structured fields when needed
- Support for "BA245 tomorrow" and "London to NYC Aug 15 insurance"

**Polar.sh Footer Design:**
- Comprehensive, well-structured navigation
- Professional appearance with clear categorization
- Multi-column layout with proper information hierarchy

### Conversational Interface Architecture

**Chat Interface Components:**
- **Left Sidebar**: Conversation history, policy cart, user context
- **Main Panel**: Chat interface with message history and input
- **Quote Cards**: Rich UI elements for insurance options
- **Policy Cards**: Interactive policy management and tracking

**Natural Language Processing:**
- Flight query parsing ("BA245 delayed insurance")
- Insurance preference extraction ("coverage for 2-hour delays")
- Follow-up question handling ("What about cancellation coverage?")
- FAQ responses with retrieval-augmented generation (RAG)

### Key Pages & UI Components

**Landing Page (`/`):**
- Hero section with smart search input
- Value proposition highlighting automatic payouts
- Trust indicators and security badges
- "How it works" section for parametric insurance

**Chat Interface (`/quote`):**
- Conversational quote generation
- Real-time flight data integration
- Policy comparison and selection
- Seamless transition to purchase

**Policy Dashboard (`/dashboard`):**
- Active policy management
- Wallet balance and transaction history
- Flight monitoring status
- Payout notifications and history

**Anonymous Tracking (`/track`):**
- Policy status lookup by verification code
- Flight monitoring updates
- Payout status and history
- No authentication required

### Mobile-First Responsive Design

**Design Principles:**
- Mobile-first approach for all interfaces
- Progressive enhancement for desktop
- Touch-friendly interactive elements
- Optimized for conversation flow on mobile

**Performance Optimization:**
- Lazy loading for non-critical components
- Optimized images and assets
- Efficient API calls and caching
- Fast page transitions and loading states

---

## 7. Implementation Roadmap & Timeline

### Phase 1: Core APIs & Business Logic (Weeks 1-4)

**Week 1-2: Foundation APIs**
- Reference data endpoints implementation
- Flight search API with aggregator integration
- Basic quote generation engine
- Database query optimization

**Week 3-4: Business Logic APIs**
- Advanced quote generation with risk assessment
- Policy management endpoints
- Escrow integration with PayGo
- Payment processing with Stripe

**Deliverables:**
- All core API endpoints functional
- Comprehensive API testing suite
- Integration with external flight APIs
- Basic business logic validation

### Phase 2: Frontend Development (Weeks 5-6)

**Week 5: Core Frontend**
- Landing page with smart search (scira-inspired)
- Chat interface foundation (chat0-inspired)
- Quote generation and display
- Basic responsive design implementation

**Week 6: Enhanced Frontend**
- Policy management interface
- Payment flow integration
- Anonymous policy tracking
- Mobile optimization and testing

**Deliverables:**
- Complete user interface for MVP flows
- Responsive design across devices
- Integration with backend APIs
- User experience testing and refinement

### Phase 3: Better-Auth Integration (Weeks 7-8)

**Week 7: Authentication Implementation**
- Better-Auth middleware setup
- Protected route implementation
- User session management
- Google OAuth integration testing

**Week 8: User Management**
- User dashboard and profile management
- Custodial wallet integration
- Policy history and tracking
- Notification system implementation

**Deliverables:**
- Complete authentication system
- User management functionality
- Secure session handling
- Wallet management interface

### Phase 4: Testing & Launch Preparation (Weeks 9-10)

**Week 9: Comprehensive Testing**
- End-to-end testing of all user flows
- Security testing and vulnerability assessment
- Performance optimization and load testing
- Bug fixes and refinements

**Week 10: Launch Preparation**
- Production deployment preparation
- Monitoring and alerting setup
- Documentation and user guides
- Beta testing with selected users

**Deliverables:**
- Production-ready MVP
- Comprehensive testing coverage
- Deployment and monitoring setup
- Launch readiness validation

---

## 8. Business Model & Entity Structure

### Platform Strategy & Revenue Streams

**triggerr (Platform Operator):**
- Marketplace fees from third-party providers
- Technology licensing and API access
- Data and analytics services
- Transaction processing fees

**triggerr Direct (First-Party Insurer):**
- Premium revenue from direct policies
- Competitive pricing through platform integration
- Standard marketplace fees to ensure neutrality
- Focus on parametric flight delay insurance

**Parametrigger Financial Solutions (B2B Provider):**
- Reinsurance products for platform providers
- Risk assessment tools and data products
- Regulatory compliance services
- Capital and operational support

### Provider Management & Escrow Models

**Multi-Provider Architecture:**
- Support for 14 different escrow models
- Flexible commission and fee structures
- Regulatory compliance tracking
- Automated payout processing

**Escrow Model Categories:**
- **Basic Models**: Single-sided, Dual-sided, Combined
- **Pooled Models**: Collateralized, Bonded, P2P
- **Advanced Models**: Dynamic, Prediction Market, NFT

### Regulatory Compliance & Risk Management

**Compliance Framework:**
- Row Level Security for data protection
- KYC/AML compliance through Better-Auth
- Regulatory reporting and audit trails
- Multi-jurisdiction support planning

**Risk Management:**
- Multi-source flight data verification
- Automated risk assessment algorithms
- Real-time monitoring and alerting
- Parametric payout validation

---

## Conclusion & Next Steps

This updated vision reflects our strong foundation and positions us for rapid API-first development. The combination of comprehensive reference data, Row Level Security, and Better-Auth provides a robust platform for scaling parametric insurance services.

**Immediate Next Steps:**
1. Begin API development starting with reference data endpoints
2. Implement quote generation engine using seeded data
3. Build conversational interface for seamless user experience
4. Integrate payment processing and escrow management
5. Layer on Better-Auth for secure user management

**Success Metrics:**
- Anonymous quote generation within 3 seconds
- 95%+ uptime for all critical APIs
- Seamless authentication conversion rate >80%
- Automated payout processing within 1 hour of trigger
- Mobile-first responsive design across all devices

The foundation is solid, the vision is clear, and the implementation path is well-defined. We're ready to build the future of parametric travel insurance.
