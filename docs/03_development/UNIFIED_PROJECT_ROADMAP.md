# Unified Project Roadmap: MVP Completion

**Document Version**: 1.0
**Date**: June 24, 2025
**Status**: Master Implementation Plan
**Objective**: To serve as the **single source of truth** for all remaining work required to deliver a feature-complete MVP. This document synthesizes and supersedes all previous planning documents, including the `paygo_integration_tracker.md` and `COMPREHENSIVE_ARCHITECTURE_REPORT.md`.

---

## ✅ **I. Current State & Foundation Assessment**

The project's foundation is **stable, tested, and substantially complete**.

-   **PayGo Integration**: The `paygo-adapter` is robust, handling all core wallet, escrow, and delegation operations. A solution for reliable transaction hash generation is implemented, and transaction history is functional.
-   **API Foundation**: The API has a complete route structure, a feature-complete SDK, and validated data contracts.
-   **Core Services**: The `wallet-service` and `escrow-engine` are functional and tested.
-   **Testing**: A comprehensive suite of 147 unit tests is passing, ensuring a stable base for development.

The focus now shifts from foundational work to implementing the **core business logic** required for the end-to-end user journey.

---

## 🎯 **II. The Critical Path: Remaining MVP Tasks**

The following tasks are ordered by their **strict technical dependencies**. Each phase must be completed before the next can begin.

### **Phase 1: Foundational Logic & Data Layer (Prerequisite Phase)**

**Objective**: To build the data aggregation layer and fix existing inconsistencies, which are prerequisites for all business logic.

*   **Task 1.1: Implement Foundational Aggregators**
    *   **Priority**: **BLOCKER**
    *   **Status**: ❌ **NOT IMPLEMENTED**
    *   **Description**: The `packages/aggregators` directory is currently empty. This is the highest priority task as the `QuoteEngine` cannot function without it.
    *   **Deliverables**:
        1.  Create and implement a basic `FlightAggregator` class within `packages/aggregators/flight-aggregator/`. For MVP, this can use a mock data source but must have the correct interface.
        2.  Create and implement a basic `WeatherAggregator` class within `packages/aggregators/weather-aggregator/`.
        3.  Create and implement a `DataRouter` class within `packages/aggregators/data-router/` to select the correct aggregator based on product type.

*   **Task 1.2: Migrate to Transaction Parser Utilities**
    *   **Priority**: **HIGH**
    *   **Status**: ❌ **NOT IMPLEMENTED**
    *   **Description**: As identified in the architecture report, several endpoints are using deprecated utility functions from `utils.ts` instead of the more robust, type-safe functions in the `transaction-parser.ts`. This must be corrected to ensure data consistency.
    *   **Deliverables**:
        1.  Update `apps/api/src/routes/v1/user/wallet/info.ts` to import and use `convertPayGoAmount` and `formatAmountDisplay` from the `transaction-parser`.
        2.  Once all references are removed, delete the deprecated `convertFromPayGoAmount` and `formatBalanceDisplay` functions from `packages/blockchain/paygo-adapter/src/utils.ts`.
        3.  Run the full test suite to ensure no regressions were introduced.

### **Phase 2: Core Business Logic (Quote & Policy Engines)**

**Objective**: To implement the services that allow users to receive a quote and purchase a policy.

*   **Task 2.1: Implement Quote Engine**
    *   **Priority**: **CRITICAL**
    *   **Status**: ❌ **NOT IMPLEMENTED**
    *   **Description**: Create the service responsible for generating insurance quotes.
    *   **Dependencies**: Task 1.1 (Aggregators).
    *   **Deliverables**:
        1.  Flesh out the `QuoteService` class in `packages/services/quote-engine/`.
        2.  Implement a `generateQuote` method that uses the `FlightAggregator`.
        3.  Define a `quote` table in the database schema (`packages/core/src/database/schema.ts`) to store generated quotes with an expiration time.
        4.  Implement the `POST /api/v1/insurance/quote` endpoint, connecting it to the `QuoteService`.

*   **Task 2.2: Implement Policy Purchase Endpoint**
    *   **Priority**: **CRITICAL**
    *   **Status**: ❌ **NOT IMPLEMENTED**
    *   **Description**: Activate the core business endpoint to finalize a policy purchase.
    *   **Dependencies**: Task 2.1 (Quote Engine).
    *   **Deliverables**:
        1.  Implement the `handleAnonymousPolicyPurchase` function in `apps/api/src/routes/v1/policy/purchase.ts`.
        2.  The handler must accept a `quoteId`, look up the quote from the database to ensure its validity and price integrity.
        3.  Create a `policy` record in the database, linking it to the user/session and the quote.
        4.  Call the existing `EscrowManager` to create a `POLICY`-type escrow for the verified premium amount.
        5.  Return a success response containing the `policyId` and `transactionHash`.

### **Phase 3: Finalizing the Lifecycle (Payout Engine)**

**Objective**: To automate the policy payout process, completing the MVP lifecycle.

*   **Task 3.1: Implement Payout Engine**
    *   **Priority**: **HIGH**
    *   **Status**: ❌ **NOT IMPLEMENTED**
    *   **Description**: Build the service that monitors policy conditions and triggers automated payouts.
    *   **Dependencies**: Task 2.2 (Policy Purchase).
    *   **Deliverables**:
        1.  Implement the `processTriggeredPayouts` method in `packages/services/payout-engine/`.
        2.  The method must fetch active policies, use the `FlightAggregator` to check for trigger conditions (e.g., flight delay), and if conditions are met, call `escrowManager.releaseEscrow()` for the corresponding policy escrow.
        3.  Update the policy status in the database to `CLAIMED` and record the event.
        4.  Connect this logic to the `POST /api/v1/internal/payouts/process-triggered/` endpoint.

---

### **III. Secondary Tasks (Enhancements & Post-MVP)**

These tasks are not on the critical path to the core MVP but should be addressed as time permits or in a subsequent phase.

*   **Task 4: Implement Full Chat Service Logic**
    *   **Priority**: **MEDIUM**
    *   **Description**: The chat endpoints are currently mocks. This task involves integrating a real LLM client and building out the conversation management and chat-driven quote generation logic.

*   **Task 5: Implement Delegation Features**
    *   **Priority**: **MEDIUM**
    *   **Description**: Build out the API endpoints (`/delegations/create`, `/delegations/send`, `/delegations/get`) and the corresponding UI in the `dev-dashboard` to expose the full delegation capabilities of the PayGo client. This will require adding a `delegations` table to the database schema.

*   **Task 6: Implement Full Anonymous Session Manager**
    *   **Priority**: **LOW**
    *   **Description**: Create the client-side `AnonymousSessionManager` class to handle quote carts and persist conversation history for anonymous users in `localStorage`.

*   **Task 7: Complete Testing Coverage**
    *   **Priority**: **CONTINUOUS**
    *   **Description**: Write unit tests for all new services (`Aggregators`, `QuoteEngine`, `PolicyEngine`, `PayoutEngine`) and add integration/E2E tests for the full quote-to-payout user flow.

---

### **IV. Blocked & Future Considerations**

*   **`getEscrowStatus` Implementation**: 🔵 **BLOCKED**. This remains blocked pending the availability of a network query API from the PayGo client.
*   **Secure Key Management**: 🔵 **POST-MVP**. A full integration with a KMS for secure private key handling is a critical security enhancement planned for after the initial MVP launch.

---

This unified roadmap provides a clear, dependency-aware plan to achieve 100% MVP completion.