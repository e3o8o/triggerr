# triggerr Developer Dashboard: The Complete Guide
**Version:** 1.0
**Status:** In Progress
**Purpose:** This document serves as the single source of truth for the **triggerr Developer Dashboard**. The dashboard is designated as **MVP v0**, a feature-complete, high-fidelity internal tool for the end-to-end testing of all user flows and backend services defined in the Phase 1 MVP.

---

## **Table of Contents**

### **1.0 Overview & Guiding Principles**
*   **1.1 Purpose of the Dashboard (MVP v0)**
    *   1.1.1 High-Fidelity Testing Environment
    *   1.1.2 Reference Implementation for Production UI
*   **1.2 Core Architectural Principles**
    *   1.2.1 Component-Based Architecture
    *   1.2.2 State Management & Prop Drilling
    *   1.2.3 Simulation vs. Live API Calls

### **2.0 System Architecture**
*   **2.1 Frontend Component Structure**
    *   2.1.1 The Parent Controller: `page.tsx`
    *   2.1.2 Directory Structure: `components/`
*   **2.2 State Management Strategy**
    *   2.2.1 Global State in `page.tsx` (`user`, `cartItems`, etc.)
    *   2.2.2 Local State in Child Components (`chatInput`, etc.)
*   **2.3 API Interaction Model**
    *   2.3.1 Role of the Manual API Router: `apps/api/src/index.ts`
    *   2.3.2 List of Consumed API Endpoints & Integration Plan

### **3.0 Feature Guide (By Tab)**
*   **3.1 The "System & Auth" Tab**
    *   3.1.1 System Health Status Card
    *   3.1.2 Authentication Status Card
    *   3.1.3 User & Session Detail Display
*   **3.2 The "Chat" Tab**
    *   3.2.1 Dynamic Search-to-Chat Interface
    *   3.2.2 Dynamic Rotating Backgrounds (Unsplash & Pexels)
    *   3.2.3 Simulated "Add to Cart" CTA
*   **3.3 The "Cart" Tab**
    *   3.3.1 Displaying Cart Items
    *   3.3.2 Removing Items from Cart
    *   3.3.3 The "Proceed to Checkout" Trigger
*   **3.4 The "Checkout" Tab**
    *   3.4.1 Order Summary & Policyholder Details
    *   3.4.2 Differentiated Payment Flows (Anonymous vs. Authenticated)
    *   3.4.3 Anonymous User Wallet Creation (Simulation)
    *   3.4.4 Anonymous User Private Key Export
*   **3.5 The "Track Policy" Tab**
    *   3.5.1 Public Policy Tracking via Verification Code
    *   3.5.2 Displaying Simulated Policy Status
*   **3.6 The "My Policies" Tab**
    *   3.6.1 Conditional Visibility (Authenticated Users Only)
    *   3.6.2 Displaying a User's Policy List (Simulation)
*   **3.7 The "Wallet" Tab**
    *   3.7.1 Three-Column Layout Explained
    *   3.7.2 Core Wallet Actions (Info, Send, Faucet)
    *   3.7.3 Escrow Management (Create, Fulfill, Release)
    *   3.7.4 Transaction & Escrow History Sub-Tabs

### **4.0 Testing Critical User Journeys**
*   **4.1 Journey 1: The Anonymous User**
    *   4.1.1 Step 1: Getting a Quote (Chat)
    *   4.1.2 Step 2: Adding to Cart
    *   4.1.3 Step 3: Proceeding to Checkout
    *   4.1.4 Step 4: Paying via a Newly Created Temporary Wallet
    *   4.1.5 Step 5: Exporting the Private Key
    *   4.1.6 Step 6: Tracking the Policy Anonymously
*   **4.2 Journey 2: The New User (Signup & Migration)**
    *   4.2.1 Prerequisite: Complete Journey 1 up to Step 5
    *   4.2.2 Step 2: Clicking "Create a Secure Account"
    *   4.2.3 Step 3: Authenticating with a *new* Google account
    *   4.2.4 Step 4: Verifying the "Migrating Data..." Screen
    *   4.2.5 Step 5: Landing on the "My Policies" Tab with the Migrated Policy
*   **4.3 Journey 3: The Existing User (Wallet Reconciliation)**
    *   4.3.1 Prerequisite: An existing account
    *   4.3.2 Step 2: Log out, and complete Journey 1 up to Step 5
    *   4.3.3 Step 3: Clicking "Create a Secure Account"
    *   4.3.4 Step 4: Authenticating with the *existing* Google account
    *   4.3.5 Step 5: Verifying the "Wallet Reconciliation" Modal Appears
    *   4.3.6 Step 6: Testing the "Consolidate" and "Keep Separate" options

### **5.0 Technical Reference**
*   **5.1 Key Frontend Components**
*   **5.2 Key API Endpoints Used & Integration Plan**
*   **5.3 Environment Variables**
*   **5.4 Known Issues & Fixes Implemented**

### **6.0 Brand & Marketing Considerations**
*   **6.1 Subtitle & Tagline Options**

---
---

### **1.0 Overview & Guiding Principles**

This document details the architecture, features, and testing procedures for the **triggerr Developer Dashboard**. This dashboard is more than a simple testing page; it has been designated as **MVP v0**. This means it is an internal, feature-complete product designed to be a comprehensive, high-fidelity environment that mirrors the entire functionality of the Phase 1 application.

Its primary mandate is to serve two critical functions: to be a robust testing ground for all backend services and user flows, and to act as a clear, architectural reference for the development of the final consumer-facing user interface.

#### **1.1 Purpose of the Dashboard (MVP v0)**

The `dev-dashboard` is the foundational tool for building and verifying the triggerr platform. Its purpose is twofold:

##### **1.1.1 High-Fidelity Testing Environment**

The dashboard's most critical role is to provide a complete, end-to-end testing environment that proves every component of the system works together as designed in the `01_VISION_MASTER.md`. It allows developers to:

*   **Verify Backend Services:** Every feature tab on the dashboard (Wallet, Policies, Chat, etc.) will be wired to its respective live API endpoint. This allows for direct, immediate testing of the backend services in a realistic context.
*   **Test Complex User Journeys:** The dashboard fully simulates the most complex and critical user flows, from an anonymous user purchasing a policy to an existing user reconciling a temporary wallet. This is essential for identifying and fixing edge cases and race conditions before they reach production.
*   **Monitor System Health:** The "System & Auth" tab provides an at-a-glance view of the health of all microservices (Database, Auth, Wallet Engine, etc.), enabling rapid debugging of infrastructure issues.

##### **1.1.2 Reference Implementation for Production UI**

The dashboard serves as a living, architectural blueprint for the final, polished consumer-facing application.

*   **Architectural Pattern:** The dashboard is built using a clean, modern, component-based architecture. The main `page.tsx` acts as a "controller" that manages shared state and renders the appropriate tab component (`SystemTab.tsx`, `WalletTab.tsx`, etc.). This separation of concerns is the pattern that should be replicated in the production UI.

    *   **Primary File:** `triggerr/apps/web/src/app/dev-dashboard/page.tsx`
    ```typescript
    // A simplified view of the page.tsx structure
    const DevDashboardPage: FC = () => {
      // --- HOOKS ---
      const { user, isAuthenticated, ... } = useAuth();
      const { anonymousSessionId } = useAnonymousSession();

      // --- STATE MANAGEMENT ---
      const [activeTab, setActiveTab] = useState("system");
      const [cartItems, setCartItems] = useState<CartItem[]>([]);
      // ... other shared states

      // --- ACTION HANDLERS ---
      const handleAddToCart = (item: CartItem) => { ... };
      // ... other handlers to be passed as props

      // --- RENDER LOGIC ---
      const renderTabContent = () => {
        switch (activeTab) {
          case "chat":
            return <ChatTab handleAddToCart={handleAddToCart} />;
          case "cart":
            return <CartTab cartItems={cartItems} ... />;
          // ... other cases
        }
      };

      return (
        // ... main layout with tab navigation
        <div>{renderTabContent()}</div>
      );
    };
    ```

*   **Best Practices:** The dashboard demonstrates key best practices that should be carried forward, including:
    *   **Dynamic UI:** The interface intelligently adapts based on user authentication state.
    *   **Clear User Feedback:** Actions provide immediate feedback through loading states, success messages, and error notifications.
    *   **Robust State Management:** It provides a clear example of managing global (shared) and local (component-specific) state.

#### **1.2 Core Architectural Principles**

The `dev-dashboard` was deliberately designed with a set of core principles to ensure it is robust, maintainable, and serves as a high-quality technical reference.

##### **1.2.1 Component-Based Architecture**

The foundation of the dashboard's architecture is the **separation of concerns** achieved by breaking down the UI into logical, self-contained components. Instead of a single, monolithic file, the dashboard is composed of a parent "controller" component and several child "tab" components.

*   **Parent Controller (`page.tsx`):**
    *   **File:** `triggerr/apps/web/src/app/dev-dashboard/page.tsx`
    *   **Responsibilities:** This component acts as the central hub. It does not contain any significant JSX for the features themselves. Its sole responsibilities are:
        1.  Managing shared, global state that needs to be accessible across multiple tabs (e.g., authentication status, cart contents).
        2.  Handling the primary tab navigation logic.
        3.  Conditionally rendering the appropriate child component based on the active tab.
        4.  Passing down the necessary state and action handlers (props) to its children.

*   **Child Components (`components/*.tsx`):**
    *   **Directory:** `triggerr/apps/web/src/app/dev-dashboard/components/`
    *   **Responsibilities:** Each file in this directory (e.g., `WalletTab.tsx`, `ChatTab.tsx`) is responsible for only its own view and logic. This encapsulation makes them easy to understand, debug, and modify without causing unintended side effects in other parts of the application.

This structure is the blueprint for how the final production application should be organized.

##### **1.2.2 State Management & Prop Drilling**

The dashboard employs a straightforward and effective state management strategy suitable for its level of complexity. It avoids complex third-party state management libraries (like Redux or Zustand) in favor of React's built-in state and context mechanisms, which are perfectly suited for the application's current scale. The strategy is divided into two clear categories: global (shared) state and local (component-specific) state.

*   **Global State in `page.tsx` (`user`, `cartItems`, etc.)**

    Any piece of state that needs to be read or modified by more than one child component is "lifted up" and managed centrally within the parent `page.tsx` component. This ensures a single source of truth and prevents state synchronization issues.

    **Key Global States:**
    *   `activeTab`: Determines which main tab component is visible.
    *   `healthStatus`: Stores the results from the `/api/v1/health` check, used by the `SystemTab`.
    *   `isAuthenticated`, `user`, `isLoading`: The core authentication context provided by the `useAuth` hook. This is passed down to multiple components that need to alter their UI based on the user's status.
    *   `cartItems`: The array of items in the shopping cart. It is updated by `ChatTab` and read by `CartTab` and `CheckoutTab`.
    *   `policies`: A list of mock policies for the authenticated user, used by `MyPoliciesTab`.
    *   `isUserSetupComplete`, `isMigrating`, `reconciliationData`: Critical flags that manage the complex post-authentication lifecycle and race conditions.

    *   **File Reference:** All of these states are defined and managed in `triggerr/apps/web/src/app/dev-dashboard/page.tsx`.

*   **Local State in Child Components (`chatInput`, etc.)**

    To maximize encapsulation and prevent unnecessary re-renders of the entire dashboard, state that is only relevant to a single component is kept local to that component using the `useState` hook.

    **Examples of Local State:**
    *   **`ChatTab.tsx`**: Manages the `chatInput` (the text the user is currently typing) and the `chatMessages` array (the history of the current conversation).
    *   **`WalletTab.tsx`**: Manages the state for its various forms (e.g., `sendForm`, `faucetForm`, `createEscrowForm`) and the currently active sub-tab (`activeSubTab`).
    *   **`TrackPolicyTab.tsx`**: Manages the `verificationCode` input and the `policyStatus` result object.
    *   **`CheckoutTab.tsx`**: Manages the `paymentResult` and the state of the anonymous wallet creation flow (`anonymousWallet`).

    This approach ensures that typing in the chat input field, for example, only causes the `ChatTab` component to re-render, not the entire dashboard page, leading to a more performant application.

##### **1.2.3 Simulation vs. Live API Calls**

The `dev-dashboard` is designed to evolve from a high-fidelity prototype to a fully functional, API-driven tool. This evolution follows a clear principle: **"Build and verify the UI flow first, then connect the live data."**

*   **Initial State (Current):** In its current implementation, most of the complex user flows (like anonymous wallet creation, data migration, and policy tracking) are **simulated**. This is achieved by:
    *   Using `setTimeout` to mimic network latency.
    *   Displaying hardcoded or mock data instead of making real API calls.
    *   This approach allowed us to perfect the complex UI logic and user experience without waiting for the backend services to be built.
    *   **Example:** The `TrackPolicyTab.tsx` component uses a `setTimeout` to simulate fetching a policy status.

    ```typescript
    // In triggerr/apps/web/src/app/dev-dashboard/components/TrackPolicyTab.tsx
    // Simulate an API call
    setTimeout(() => {
      if (verificationCode.toLowerCase() === "error") {
        setError("Could not find a policy with this code.");
      } else {
        setPolicyStatus({
          policyId: verificationCode,
          flightSummary: "Flight BA245 - LHR to JFK",
          status: "ACTIVE",
          // ... more mock data
        });
      }
      setIsLoading(false);
    }, 1000);
    ```

*   **Final State (The Goal of MVP v0):** The next phase of development is to replace every one of these simulations with live `fetch` calls to their corresponding backend API endpoints. The dashboard will be considered "feature-complete" only when no simulations remain and all data is sourced directly from the live API server.

---

### **2.0 System Architecture**

The developer dashboard is architected to be both robust and maintainable, serving as a clear blueprint for the production application. It follows a standard "controller-view" pattern where a central parent component manages state and logic, while child components are responsible for rendering specific parts of the UI.

*   **2.1 Frontend Component Structure**

    The entire dashboard resides within the `triggerr/apps/web/src/app/dev-dashboard/` directory. This encapsulation ensures that all its specific logic, components, and styling do not leak into the rest of the main web application.

    *   **2.1.1 The Parent Controller: `page.tsx`**

        The primary component, `page.tsx`, is the brain of the dashboard. It is intentionally lean on JSX and heavy on logic, fulfilling the role of a "controller." Its core responsibilities are:
        1.  **State Management:** It holds all critical state that must be shared across multiple tabs, such as `isAuthenticated`, the `user` object, `cartItems`, and the `isUserSetupComplete` flag.
        2.  **Data Fetching & Actions:** It defines all the primary data-fetching functions (e.g., `fetchWalletInfo`, `fetchHealthStatus`) and user action handlers (e.g., `handleAddToCart`, `handleProceedToCheckout`).
        3.  **Prop Drilling:** It passes down the necessary state and handler functions as props to the appropriate child components.
        4.  **Lifecycle Management:** It contains the crucial `useEffect` hooks that manage the application's lifecycle, such as handling the post-authentication data migration flow.
        5.  **Tab Navigation:** It renders the main tab navigation UI and controls which child component is visible based on the `activeTab` state.

        *   **File Location:** `triggerr/apps/web/src/app/dev-dashboard/page.tsx`

    *   **2.1.2 Directory Structure: `components/`**

        To ensure a clean separation of concerns, all UI components that make up the individual tabs are located in a dedicated subdirectory. This makes the project easy to navigate and allows developers to work on one feature tab without interfering with another.

        *   **File Location:** `triggerr/apps/web/src/app/dev-dashboard/components/`

        *   **Component Breakdown:**
            *   `SystemTab.tsx`: Renders the system health grid and authentication status.
            *   `ChatTab.tsx`: Contains the dynamic search-to-chat interface.
            *   `CartTab.tsx`: Displays the contents of the shopping cart.
            *   `CheckoutTab.tsx`: Manages the entire checkout and payment simulation process.
            *   `TrackPolicyTab.tsx`: Provides the UI for anonymous policy tracking.
            *   `MyPoliciesTab.tsx`: Displays an authenticated user's list of policies.
            *   `WalletTab.tsx`: Renders the three-column layout for all financial operations.
            *   `ReconciliationModal.tsx`: The modal dialog for handling the wallet reconciliation choice.

*   **2.2 State Management Strategy**

    The dashboard employs a deliberate and straightforward state management strategy designed for clarity and maintainability. It avoids complex third-party state management libraries (like Redux or Zustand) in favor of React's built-in state and context mechanisms, which are perfectly suited for the application's current scale. The strategy is divided into two clear categories: global (shared) state and local (component-specific) state.

    *   **2.2.1 Global State in `page.tsx` (`user`, `cartItems`, etc.)**

        Any piece of state that needs to be read or modified by more than one child component is "lifted up" and managed centrally within the parent `page.tsx` component. This ensures a single source of truth and prevents state synchronization issues.

        **Key Global States:**
        *   `activeTab`: Determines which main tab component is visible.
        *   `healthStatus`: Stores the results from the `/api/v1/health` check, used by the `SystemTab`.
        *   `isAuthenticated`, `user`, `isLoading`: The core authentication context provided by the `useAuth` hook. This is passed down to multiple components that need to alter their UI based on the user's status.
        *   `cartItems`: The array of items in the shopping cart. It is updated by `ChatTab` and read by `CartTab` and `CheckoutTab`.
        *   `policies`: A list of mock policies for the authenticated user, used by `MyPoliciesTab`.
        *   `isUserSetupComplete`, `isMigrating`, `reconciliationData`: Critical flags that manage the complex post-authentication lifecycle and race conditions.

        *   **File Reference:** All of these states are defined and managed in `triggerr/apps/web/src/app/dev-dashboard/page.tsx`.

    *   **2.2.2 Local State in Child Components (`chatInput`, etc.)**

        To maximize encapsulation and prevent unnecessary re-renders of the entire dashboard, state that is only relevant to a single component is kept local to that component using the `useState` hook.

        **Examples of Local State:**
        *   **`ChatTab.tsx`**: Manages the `chatInput` (the text the user is currently typing) and the `chatMessages` array (the history of the current conversation).
        *   **`WalletTab.tsx`**: Manages the state for its various forms (e.g., `sendForm`, `faucetForm`, `createEscrowForm`) and the currently active sub-tab (`activeSubTab`).
        *   **`TrackPolicyTab.tsx`**: Manages the `verificationCode` input and the `policyStatus` result object.
        *   **`CheckoutTab.tsx`**: Manages the `paymentResult` and the state of the anonymous wallet creation flow (`anonymousWallet`).

        This approach ensures that typing in the chat input field, for example, only causes the `ChatTab` component to re-render, not the entire dashboard page, leading to a more performant application.

*   **2.3 API Interaction Model**

    The developer dashboard is not just a static UI; it is an active client that interacts with a backend API to fetch data and perform actions. Understanding this interaction model is key to understanding how the dashboard functions as a testing tool.

    *   **2.3.1 Role of the Manual API Router: `apps/api/src/index.ts`**

        A critical architectural aspect of the triggerr backend is its **manual API router**. Unlike frameworks that automatically discover routes based on file structure, this project uses a central file to explicitly register every valid API endpoint.

        *   **Mechanism:** The server (`Bun.serve`) in this file receives every incoming request. It then uses a series of `if` statements to match the request's `pathname` (e.g., `/api/v1/health`) and `method` (e.g., `GET`) to a specific handler function that has been imported at the top of the file.

        *   **Impact on Development:** This means that simply creating a new route file in the `apps/api/src/routes/` directory is **not sufficient**. For a new endpoint to be active, it must be manually:
            1.  **Imported** at the top of `index.ts`.
            2.  **Registered** with a corresponding `if` block in the router's `fetch` function.

        *   **Example from the `check-existence` fix:**

            ```typescript
            // 1. Import the handler
            import { handleCheckExistence } from "./routes/v1/auth/check-existence";

            // ... inside the Bun.serve fetch function
            const server = Bun.serve({
              async fetch(request: Request) {
                // ...
                // 2. Register the route
                if (pathname === "/api/v1/auth/check-existence" && method === "POST")
                  return handleCheckExistence(request);
                // ...
              }
            });
            ```

        *   **File Location:** `triggerr/apps/api/src/index.ts`

    *   **2.3.2 List of Consumed API Endpoints & Integration Plan**

        The `dev-dashboard` is designed to be the primary testing client for the entire suite of Phase 1 MVP APIs. The current implementation uses key endpoints for auth and health, while the remaining UI components are prepared for their final integration. This section lists all relevant endpoints and details their integration plan.

        #### **Endpoints Currently Integrated**

        *   **`GET /api/v1/health`**
            *   **Status:** ✅ **Live**
            *   **Integration:** The `SystemTab.tsx` component calls this endpoint on load and periodically to populate the system health grid.
        *   **`POST /api/v1/auth/check-existence`**
            *   **Status:** ✅ **Live**
            *   **Integration:** The main `page.tsx` calls this endpoint after a user authenticates to correctly route them to either the new user migration flow or the wallet reconciliation modal.

        #### **Endpoints Pending Full Integration**

        The following endpoints have their UI and action handlers prepared in the dashboard. The final step is to replace the current simulations with live `fetch` calls.

        **Wallet & Escrow Endpoints (`WalletTab.tsx`)**
        *   **`GET /api/v1/user/wallet/info`**
            *   **Integration Plan:** The `fetchWalletInfo` function in `page.tsx` will call this to populate the "My Wallet" card with the user's real address and balance.
        *   **`GET /api/v1/user/wallet/transactions`**
            *   **Integration Plan:** The `fetchTransactions` function will call this to populate the "Transactions" sub-tab with the user's real transaction history.
        *   **`GET /api/v1/user/wallet/escrows`**
            *   **Integration Plan:** The `fetchEscrows` function will call this to populate the "My Escrows" and "Assigned to Me" sub-tabs.
        *   **`POST /api/v1/user/wallet/faucet`**
            *   **Integration Plan:** The `handleFaucetRequest` action will call this endpoint. The response `txHash` will be displayed in the success notification.
        *   **`POST /api/v1/user/wallet/send`**
            *   **Integration Plan:** The `handleSendFunds` action will call this endpoint with the recipient and amount from the form.
        *   **`POST /api/v1/user/wallet/escrows/create`**
            *   **Integration Plan:** The `handleCreateEscrow` action will call this endpoint with the form data.
        *   **`POST /api/v1/user/wallet/escrows/fulfill`**
            *   **Integration Plan:** The `handleFulfillEscrow` action will call this endpoint with the specified Escrow ID.
        *   **`POST /api/v1/user/wallet/escrows/release`**
            *   **Integration Plan:** The `handleReleaseEscrow` action will call this endpoint with the specified Escrow ID.

        **Policy & Checkout Endpoints (`CheckoutTab.tsx`, `MyPoliciesTab.tsx`, `TrackPolicyTab.tsx`)**
        *   **`POST /api/v1/user/policies/purchase`**
            *   **Integration Plan:** The `CheckoutTab.tsx` component's payment handlers will call this endpoint. The logic will need to correctly pass the `payment_method_type` ('STRIPE' or 'CUSTODIAL_PAYGO') and handle the different response shapes (e.g., a `stripe_client_secret` for Stripe).
        *   **`GET /api/v1/user/policies`**
            *   **Integration Plan:** The `MyPoliciesTab.tsx` component will call this endpoint (via a handler in `page.tsx`) to fetch and display the list of policies associated with the authenticated user's account.
        *   **`GET /api/v1/policy/track`**
            *   **Integration Plan:** The `TrackPolicyTab.tsx` component's `handleTrackPolicy` function will call this endpoint with the user-provided verification code and display the returned policy status.

        **Chat Endpoints (`ChatTab.tsx`)**
        *   **`POST /api/v1/chat/message`**
            *   **Integration Plan:** This is the final and most significant integration. The `handleSendMessage` function in `ChatTab.tsx` will be updated to send the user's input to this endpoint. The component will then need to parse the `assistant_response_content` and `ui_elements` from the response to render both the text reply and any special components, like real `QuoteCard`s with actionable data.

---

### **3.0 Feature Guide (By Tab)**

This section provides a detailed breakdown of the functionality of each tab within the developer dashboard. Each tab is designed to be a self-contained module for testing a specific domain of the application's features.

*   **3.1 The "System & Auth" Tab**

    This is the default view when the dashboard loads. Its purpose is to provide an immediate, at-a-glance overview of the entire system's operational status and the current user's authentication context.

    *   **Component File:** `triggerr/apps/web/src/app/dev-dashboard/components/SystemTab.tsx`

    *   **3.1.1 System Health Status Card**
        *   **Purpose:** To monitor the health of all critical backend services.
        *   **Functionality:**
            *   Upon loading and every five minutes thereafter, the dashboard calls the `GET /api/v1/health` endpoint.
            *   An **Overall System Health** card displays the aggregate health percentage and a summary status message (e.g., "All critical systems operational").
            *   A grid displays the status of each individual microservice (Database, Better-Auth, PayGo Wallet, etc.).
            *   The status of each service is color-coded for immediate visual feedback:
                *   **Green:** Healthy and operational.
                *   **Yellow:** Degraded performance or minor issue detected.
                *   **Red:** Service is unhealthy or has an error.
            *   A "Refresh" button allows developers to manually trigger a new health check at any time.

    *   **3.1.2 Authentication Status Card**
        *   **Purpose:** To manage and verify the user's authentication state.
        *   **Functionality:**
            *   This card provides clear buttons to **"Sign In with Google"** for logged-out users and **"Sign Out"** for logged-in users.
            *   The sign-in action correctly initiates the Better-Auth Google OAuth flow.
            *   The sign-out action clears the user's session.

    *   **3.1.3 User & Session Detail Display**
        *   **Purpose:** To provide detailed context for debugging session-related issues.
        *   **Functionality:**
            *   **If Authenticated:** The card displays the logged-in user's Name, Email, and a profile picture rendered using the Next.js `<Image />` component.
            *   **If Anonymous:** It clearly indicates that the user is not authenticated.
            *   **Anonymous Session ID:** Crucially, this card *always* displays the `anonymousSessionId` provided by the `useAnonymousSession` hook. This is essential for testing flows that involve migrating data from a guest session to a newly created account.

*   **3.2 The "Chat" Tab**

    This tab is the primary entry point for the core user journey and serves as the testing ground for the application's "chat-first" vision. It is designed to simulate the complete conversational quoting experience.

    *   **Component File:** `triggerr/apps/web/src/app/dev-dashboard/components/ChatTab.tsx`

    *   **3.2.1 Dynamic Search-to-Chat Interface**
        *   **Purpose:** To create a modern, engaging, and focused user experience for initiating a conversation.
        *   **Functionality:**
            1.  **Initial State:** When first opened, the tab displays a large, centered search bar, prompting the user to ask a question (e.g., "Insurance for flight BA245 tomorrow"). This is the "pre-chat" or "search" mode.
            2.  **Transformation:** Upon submitting the first query, the entire UI dynamically transforms. The centered search bar fades out, and a traditional chat interface fades in.
            3.  **Chat View:** The user's query appears as the first message, followed by the assistant's reply. A new input bar is now permanently at the bottom, allowing the conversation to continue.
        *   **State Management:** This is controlled by a local `hasStartedChat` boolean state within the component.

    *   **3.2.2 Dynamic Rotating Backgrounds (Unsplash & Pexels)**
        *   **Purpose:** To provide a visually appealing and dynamic background for the initial "search" mode, enhancing the user experience.
        *   **Functionality:**
            *   The component utilizes a custom `ImageFetcher` service (`triggerr/apps/web/src/lib/image-fetcher.ts`) to fetch images.
            *   The fetcher first attempts to use the Unsplash API. If the Unsplash key is missing or the API fails, it has a built-in fallback to use the Pexels API.
            *   A `setInterval` timer cycles to a new image from the fetched collection every 30 minutes, with a smooth cross-fade transition.
        *   **Configuration:** This feature requires valid API keys to be set in `.env.local`: `NEXT_PUBLIC_UNSPLASH_API_KEY` and `NEXT_PUBLIC_PEXELS_API_KEY`.
        *   **Attribution:** As per API guidelines, a link to the photographer's profile is always displayed in the bottom corner.

    *   **3.2.3 Simulated "Add to Cart" CTA**
        *   **Purpose:** To simulate the core action of the chatbot—presenting a user with a quote and allowing them to act on it.
        *   **Functionality:**
            *   The simulated assistant's response includes a "Sample Quote" with an **"Add Sample Quote to Cart"** button.
            *   Clicking this button calls the `handleAddToCart` function, which is passed down as a prop from the parent `page.tsx`.
            *   This action updates the global `cartItems` state, which in turn causes the badge on the "Cart" tab to appear or increment, providing immediate visual feedback of a successful action.

*   **3.3 The "Cart" Tab**

    This tab serves as the user's shopping cart or staging area. It provides a clear summary of the insurance quotes they have selected from the chat interface and acts as the final gateway before the checkout process.

    *   **Component File:** `triggerr/apps/web/src/app/dev-dashboard/components/CartTab.tsx`

    *   **3.3.1 Displaying Cart Items**
        *   **Purpose:** To give the user a clear, itemized view of their selected quotes.
        *   **Functionality:**
            *   The component receives the `cartItems` array as a prop from the parent `page.tsx`.
            *   It maps over this array to render a list of all items. Each item in the list displays its name, description, and price (e.g., "Sample Flight Insurance," "Coverage for BA245," "$25.00").
            *   A running total of the cart's value is calculated and displayed at the bottom of the list.
            *   If the cart is empty, a message like "Your quote cart is empty" is displayed instead.

    *   **3.3.2 Removing Items from Cart**
        *   **Purpose:** To allow users to manage their cart contents before proceeding to payment.
        *   **Functionality:**
            *   Each item in the cart list has a "Remove" (X) button next to it.
            *   Clicking this button calls the `handleRemoveFromCart` function, which is passed down as a prop from `page.tsx`.
            *   This function updates the global `cartItems` state by filtering out the selected item, causing the UI to re-render with the updated list and total.

    *   **3.3.3 The "Proceed to Checkout" Trigger**
        *   **Purpose:** To serve as the primary call-to-action to begin the final purchase flow.
        *   **Functionality:**
            *   A prominent "Proceed to Checkout" button is displayed at the bottom of the cart.
            *   Clicking this button calls the `handleProceedToCheckout` function, passed down as a prop from `page.tsx`.
            *   This function changes the global `activeTab` state to `"checkout"`, which automatically navigates the user to the "Checkout" tab to complete their purchase.

*   **3.4 The "Checkout" Tab**

    The Checkout tab is one of the most complex components in the dashboard. It simulates the entire payment and policy creation process, intelligently adapting its behavior based on the user's authentication state to handle all critical user journeys.

    *   **Component File:** `triggerr/apps/web/src/app/dev-dashboard/components/CheckoutTab.tsx`

    *   **3.4.1 Order Summary & Policyholder Details**
        *   **Purpose:** To present a final confirmation of the purchase details and collect necessary user information.
        *   **Functionality:**
            *   **Order Summary:** A non-editable card displays the items from the cart and the final total, giving the user one last chance to review before paying.
            *   **Policyholder Form:** A form for the user's Full Name and Email Address.
                *   If the user is **authenticated**, these fields are pre-filled and disabled, using the data from the `user` object.
                *   If the user is **anonymous**, these fields are empty and optional, allowing for a fully anonymous purchase as per the vision document.

    *   **3.4.2 Differentiated Payment Flows (Anonymous vs. Authenticated)**
        *   **Purpose:** To provide the correct payment options based on the user's status.
        *   **Functionality:** The "Payment" card displays different options and behaviors:
            *   **For Authenticated Users:** It shows buttons for "Pay with Card (Stripe)" and "Pay with triggerr Wallet". Both are fully enabled.
            *   **For Anonymous Users:** It also shows both buttons, but the "Pay with PayGo Wallet" button triggers the anonymous wallet creation flow instead of a direct payment. This provides a seamless entry point into the PayGo ecosystem.

    *   **3.4.3 Anonymous User Wallet Creation (Simulation)**
        *   **Purpose:** To simulate the backend process of creating a temporary, on-the-fly wallet for a guest user.
        *   **Functionality:**
            1.  When an anonymous user clicks "Pay with PayGo Wallet", the UI enters a "creating" state, showing a spinner.
            2.  After a simulated delay, the UI updates to a "funding" state. It displays a mock wallet address and a QR code, instructing the user to send the exact purchase amount to this new address.
            3.  A new button appears: **"I have sent the funds. Finalize Payment."** Clicking this triggers the final step.
        *   This flow is managed by a local state machine (`anonymousWallet.state`) within the component.

    *   **3.4.4 Anonymous User Private Key Export**
        *   **Purpose:** To ensure an anonymous user has a way to control the temporary wallet and access any future policy payouts. This is a critical step for self-custody.
        *   **Functionality:**
            1.  After an anonymous user "finalizes" their payment, the success message card appears.
            2.  Embedded within this success card is a special, attention-grabbing section titled **"Action Required: Save Your Key"**.
            3.  This section displays the mock **private key** associated with the temporary wallet and provides a "Copy Key" button.
            4.  A strong warning message instructs the user that this is their only chance to save the key.

*   **3.5 The "Track Policy" Tab**

    This tab serves a critical function outlined in the vision document: allowing any user, particularly those who purchased a policy anonymously, to check the status of their coverage without needing to log in.

    *   **Component File:** `triggerr/apps/web/src/app/dev-dashboard/components/TrackPolicyTab.tsx`

    *   **3.5.1 Public Policy Tracking via Verification Code**
        *   **Purpose:** To provide a public, secure, and account-agnostic method for retrieving policy information.
        *   **Functionality:**
            *   The UI consists of a single input field prompting the user to enter their **Policy Verification Code**. This code would be the PayGo Escrow ID provided to them upon successful purchase.
            *   A "Track" button initiates the status check. The process is public and does not require any authentication.

    *   **3.5.2 Displaying Simulated Policy Status**
        *   **Purpose:** To demonstrate the user experience of a successful policy lookup.
        *   **Functionality:**
            *   When the "Track" button is clicked, the component simulates an API call with a loading spinner.
            *   Upon completion, it displays a "Policy Found" card containing mock data, such as:
                *   The verification code that was entered.
                *   Flight details (e.g., "Flight BA245 - LHR to JFK").
                *   The current policy status (e.g., "ACTIVE").
                *   The current payout status (e.g., "Not Triggered").
            *   The simulation is also designed to handle errors. For example, typing "error" into the input field will result in a "Could not find a policy with this code" message, testing the UI's error state.

*   **3.6 The "My Policies" Tab**

    This tab provides authenticated users with a personal, centralized dashboard to view all policies associated with their account. It offers a more convenient and comprehensive alternative to the public "Track Policy" tool.

    *   **Component File:** `triggerr/apps/web/src/app/dev-dashboard/components/MyPoliciesTab.tsx`

    *   **3.6.1 Conditional Visibility (Authenticated Users Only)**
        *   **Purpose:** To create a clean and relevant UI by only showing features that are applicable to the user's current state.
        *   **Functionality:** The "My Policies" tab is a "smart" tab. Its visibility in the main navigation bar is directly tied to the user's authentication status, which is managed in the parent `page.tsx`.
            *   **If Authenticated:** The tab appears in the navigation bar, typically after "Track Policy."
            *   **If Anonymous:** The tab is completely hidden from the UI.
        *   **Code Reference:** This logic is handled in the `navTabs` array construction within `triggerr/apps/web/src/app/dev-dashboard/page.tsx`.
            ```typescript
            const navTabs = [
              // ... other tabs
              ...(isAuthenticated ? [{ id: "policies", label: "My Policies" }] : []),
              // ... other tabs
            ];
            ```

    *   **3.6.2 Displaying a User's Policy List (Simulation)**
        *   **Purpose:** To display a user's entire policy history in a clear and organized manner.
        *   **Functionality:**
            *   The component receives a `policies` array as a prop from the parent `page.tsx`.
            *   It maps over this array to render a list of policy cards. Each card is styled to clearly present key information:
                *   Flight summary (e.g., "Flight UA123 - SFO to EWR").
                *   The policy's `verificationCode`.
                *   The premium and coverage amounts.
                *   The current **Status** (e.g., "ACTIVE", "PAID_OUT"), which is highlighted with a distinct color and icon for quick visual identification.
            *   If the `policies` array is empty, it displays a helpful message prompting the user to purchase a policy.
            *   For the simulation, this list is populated with mock data, including a special "(Migrated)" entry if the user has just completed the anonymous-to-authenticated signup flow.

*   **3.7 The "Wallet" Tab**

    This tab is the financial hub of the dashboard, providing a comprehensive interface for all wallet and escrow-related operations. It has been specifically designed with a three-column layout to present a high density of information clearly and efficiently, making it a powerful tool for testing the core financial functions of the application.

    *   **Component File:** `triggerr/apps/web/src/app/dev-dashboard/components/WalletTab.tsx`

    *   **3.7.1 Three-Column Layout Explained**
        *   **Purpose:** To logically group related functions and make all primary actions visible without scrolling.
        *   **Structure:**
            *   **Column 1 (Left): Wallet & Core Actions:** Contains the user's primary wallet balance and address, along with the most frequent actions: sending funds and requesting test tokens from the faucet.
            *   **Column 2 (Center): Escrow Management:** Dedicated exclusively to all escrow operations, including forms to create a new escrow and to manage (fulfill or release) an existing one.
            *   **Column 3 (Right): History & Lists:** Contains the sub-tabbed view for viewing historical data, ensuring that transaction and escrow lists are always visible alongside the action forms.

    *   **3.7.2 Core Wallet Actions (Info, Send, Faucet)**
        *   **Purpose:** To test the fundamental financial operations of a user's wallet.
        *   **Functionality:**
            *   **My Wallet:** Displays the user's wallet address, a QR code for receiving funds, and the current balance, fetched from `/api/v1/user/wallet/info`.
            *   **Send Funds:** A form that (in the final version) will call `POST /api/v1/user/wallet/send` to transfer funds.
            *   **Request Faucet Funds:** A form that will call `POST /api/v1/user/wallet/faucet` to receive testnet tokens.

    *   **3.7.3 Escrow Management (Create, Fulfill, Release)**
        *   **Purpose:** To test the complete lifecycle of user-initiated PayGo escrows.
        *   **Functionality:**
            *   **Create Escrow:** A form captures all necessary details (fulfiller address, amount, expiration) and will call `POST /api/v1/user/wallet/escrows/create`.
            *   **Manage Escrow:** A separate form allows a user to input an existing Escrow ID and then either **Fulfill** it (calling `POST /api/v1/user/wallet/escrows/fulfill`) or **Release** it (calling `POST /api/v1/user/wallet/escrows/release`).

    *   **3.7.4 Transaction & Escrow History Sub-Tabs**
        *   **Purpose:** To provide a clear and organized view of all financial records associated with the user's wallet.
        *   **Functionality:** The right-hand column features a sub-tab navigation system:
            *   **Transactions:** Displays a list of all incoming and outgoing transfers, fetched from `GET /api/v1/user/wallet/transactions`.
            *   **My Escrows:** Shows a list of escrows created by the user.
            *   **Assigned to Me:** Shows a list of escrows where the user is the designated fulfiller.
            *   Both escrow lists are populated from the data fetched by `GET /api/v1/user/wallet/escrows`.

---

### **4.0 Testing Critical User Journeys**

The primary value of the `dev-dashboard` is its ability to test the application's most critical and complex user flows from end to end. This section provides step-by-step instructions for executing these tests.

*   **4.1 Journey 1: The Anonymous User**

    This journey tests the full "guest checkout" experience, which is essential for minimizing user friction and allowing purchases without requiring immediate account creation.

    *   **Prerequisite:** Ensure you are logged out. The **System & Auth** tab should show "Authenticated: No".

    *   **4.1.1 Step 1: Getting a Quote (Chat)**
        1.  Navigate to the **Chat** tab.
        2.  Verify that the initial "search" interface with the dynamic Unsplash background is displayed.
        3.  In the central input bar, type a sample query like `insurance for flight to JFK` and press Enter.
        4.  **Expected Result:** The UI should transform into the chat view. Your message should appear, followed by a simulated assistant response containing an **"Add Sample Quote to Cart"** button.

    *   **4.1.2 Step 2: Adding to Cart**
        1.  In the chat response from the previous step, click the **"Add Sample Quote to Cart"** button.
        2.  **Expected Result:** A success notification should briefly appear. A badge with the number "1" should instantly appear on the **Cart** tab in the main navigation.

    *   **4.1.3 Step 3: Proceeding to Checkout**
        1.  Navigate to the **Cart** tab.
        2.  Verify that the sample quote is listed correctly with its price and that the total is calculated.
        3.  Click the **"Proceed to Checkout"** button.
        4.  **Expected Result:** The view should automatically switch to the **Checkout** tab.

    *   **4.1.4 Step 4: Paying via a Newly Created Temporary Wallet**
        1.  On the **Checkout** tab, locate the "Payment" card.
        2.  Click the **"Pay with PayGo Wallet"** button.
        3.  **Expected Result:** The card's content should change to show a loading message: "Creating your secure, temporary wallet...". After a brief delay, it should update again to the "funding" state, displaying a mock QR code and wallet address. A new button, **"I have sent the funds. Finalize Payment,"** will appear.
        4.  Click the **"Finalize Payment"** button.
        5.  **Expected Result:** The payment card should now transform into a final success state.

    *   **4.1.5 Step 5: Exporting the Private Key**
        1.  In the success card from the previous step, locate the section titled **"Action Required: Save Your Key"**.
        2.  Verify that a mock private key is displayed.
        3.  Click the **"Copy Private Key"** button.
        4.  **Expected Result:** A browser alert should confirm that the key has been copied to the clipboard. This step confirms the critical key export functionality for the anonymous user.

    *   **4.1.6 Step 6: Tracking the Policy Anonymously**
        1.  In the success card from the previous step, copy the **Policy Verification Code** (e.g., `MOCK_CODE_...`).
        2.  Navigate to the **Track Policy** tab.
        3.  Paste the code into the input field and click **"Track"**.
        4.  **Expected Result:** After a short loading state, a "Policy Found" card should appear, displaying the details for the policy code you entered. This confirms the entire anonymous lifecycle is complete and functional.

*   **4.2 Journey 2: The New User (Signup & Migration)**

    This journey tests the critical flow of converting an anonymous user who has just purchased a policy into a fully authenticated user, ensuring their data is seamlessly migrated to their new account.

    *   **4.2.1 Prerequisite: Complete Journey 1 up to Step 5**
        1.  Follow all the steps in **Journey 1** to complete an anonymous purchase.
        2.  You must be on the **Checkout** tab viewing the final success message which includes both the private key export option and the "Create a Secure Account" button.
        3.  Crucially, ensure you are using a Google account that has **never** been used to log into this application before to properly simulate a *new* user.

    *   **4.2.2 Step 2: Clicking "Create a Secure Account"**
        1.  In the success card on the **Checkout** tab, find and click the **"Create a Secure Account (with Google)"** button.
        2.  **Expected Result:** The application should redirect you to the standard Google OAuth login screen. This action also stores the `anonymousSessionId` and the `policy_verification_code` in the browser's `sessionStorage` to be retrieved after you return.

    *   **4.2.3 Step 3: Authenticating with a *new* Google account**
        1.  Complete the sign-in process using your **new** Google account credentials.
        2.  After successful authentication, Google will redirect you back to the `dev-dashboard` page.
        3.  **Expected Result:** You should be redirected back to the dashboard.

    *   **4.2.4 Step 4: Verifying the "Migrating Data..." Screen**
        1.  Immediately upon returning to the dashboard, the application will detect that you are a newly authenticated user with pending migration data.
        2.  **Expected Result:** The entire page should be replaced by a full-screen loading state with the message: **"Welcome! We're linking the policy from your guest session to your new account. Please wait..."**. This confirms the correct logical path for a new user is being triggered.

    *   **4.2.5 Step 5: Landing on the "My Policies" Tab with the Migrated Policy**
        1.  After a simulated delay of 2.5 seconds, the migration process will complete.
        2.  **Expected Result:**
            *   The loading screen will disappear.
            *   A success notification will appear: "Welcome! Your policy `[MOCK_CODE_...]` has been linked to your new account."
            *   The application will automatically switch to the **"My Policies"** tab.
            *   You will see a new policy card in the list with the flight summary ending in **"(Migrated)"**, confirming that the policy from your anonymous session is now successfully associated with your new account.

*   **4.3 Journey 3: The Existing User (Wallet Reconciliation)**

    This is the most complex user journey to test. It validates the critical scenario where a user who already has an account performs a new purchase while logged out, and then signs back in. The system must recognize this and prompt the user to reconcile their wallets.

    *   **4.3.1 Prerequisite: An existing account**
        1.  First, ensure you are logged in with an existing account (e.g., `elemoghenekaro@gmail.com`). You can verify this on the **System & Auth** tab.
        2.  Navigate a few tabs to ensure the application recognizes you as an existing user.

    *   **4.3.2 Step 2: Log out, and complete Journey 1 up to Step 5**
        1.  Go to the **System & Auth** tab and click the **"Sign Out"** button.
        2.  Once you are logged out, follow the **Anonymous User Journey (4.1)** completely, from getting a quote in the chat to finalizing the anonymous payment on the checkout screen.
        3.  You must end up on the **Checkout** tab viewing the success message with the private key export option.

    *   **4.3.3 Step 3: Clicking "Create a Secure Account"**
        1.  In the success card on the **Checkout** tab, click the **"Create a Secure Account (with Google)"** button.
        2.  **Expected Result:** You will be redirected to the Google OAuth login screen.

    *   **4.3.4 Step 4: Authenticating with the *existing* Google account**
        1.  Complete the sign-in process using the **same existing account** you used in the prerequisite step (e.g., `elemoghenekaro@gmail.com`).
        2.  After successful authentication, Google will redirect you back to the `dev-dashboard` page.

    *   **4.3.5 Step 5: Verifying the "Wallet Reconciliation" Modal Appears**
        1.  Immediately upon returning to the dashboard, the application will detect that you are an *existing* user with pending migration data.
        2.  **Expected Result:** Instead of the full-screen "Migrating..." message, a modal dialog box titled **"Welcome Back! Action Required"** should appear over the dashboard. This confirms the correct logical path for an existing user has been triggered. The modal will explain that a policy was purchased as a guest and will present the user with two choices.

    *   **4.3.6 Step 6: Testing the "Consolidate" and "Keep Separate" options (Simulation)**
        1.  **Test Option 1:** Click the **"Consolidate Wallet"** button.
            *   **Expected Result:** The modal should close, and a success notification should appear: "Consolidating... Policy and funds moved to your primary wallet."
        2.  **Test Option 2 (Requires repeating steps 1-5):** Click the **"Keep Separate"** button.
            *   **Expected Result:** The modal should close, and a browser `alert()` should appear with the message: "This would trigger the private key export flow for the temporary wallet." This confirms that the system correctly distinguishes between the two user choices.
        3.  **Test Option 3:** Click the **"Decide Later"** button.
            *   **Expected Result:** The modal should simply close, allowing the user to interact with the app. The system should (in a production scenario) retain the state to prompt the user again later.

---

### **5.0 Technical Reference**

This section provides a quick reference to the key files and configurations that make up the developer dashboard.

*   **5.1 Key Frontend Components**

    The dashboard's frontend is built on a modular, component-based architecture. All core component files are located within `triggerr/apps/web/src/app/dev-dashboard/`.

    *   **`page.tsx`**
        *   **Role:** The main parent component and state controller.
        *   **Responsibilities:** Manages all shared state (authentication, cart items, etc.), defines global action handlers, and renders the active tab component. It is the central nervous system of the dashboard.

    *   **`components/SystemTab.tsx`**
        *   **Role:** Renders the "System & Auth" tab.
        *   **Responsibilities:** Displays the system health grid by calling and interpreting the `/api/v1/health` endpoint. Manages the UI for user sign-in and sign-out, and displays user and session information.

    *   **`components/ChatTab.tsx`**
        *   **Role:** Renders the "Chat" tab.
        *   **Responsibilities:** Manages the dynamic search-to-chat UI transformation. Handles user input and simulates chat responses. Integrates with the Unsplash and Pexels APIs for its dynamic background feature. Triggers the `handleAddToCart` action.

    *   **`components/CartTab.tsx`**
        *   **Role:** Renders the "Cart" tab.
        *   **Responsibilities:** Displays the list of items in the cart, calculates the total, handles item removal, and triggers the navigation to the checkout tab.

    *   **`components/CheckoutTab.tsx`**
        *   **Role:** Renders the "Checkout" tab.
        *   **Responsibilities:** A complex component that manages the entire simulated checkout flow. It adapts its UI for anonymous vs. authenticated users and handles the anonymous wallet creation and private key export flow.

    *   **`components/TrackPolicyTab.tsx`**
        *   **Role:** Renders the "Track Policy" tab.
        *   **Responsibilities:** Provides a public interface for checking a policy's status via a verification code.

    *   **`components/MyPoliciesTab.tsx`**
        *   **Role:** Renders the "My Policies" tab.
        *   **Responsibilities:** Displays an authenticated user's list of policies. This component is conditionally rendered by `page.tsx` only when a user is logged in.

    *   **`components/WalletTab.tsx`**
        *   **Role:** Renders the "Wallet" tab.
        *   **Responsibilities:** Implements the three-column layout for all financial operations, including sending funds, using the faucet, managing escrows, and viewing transaction history.

    *   **`components/ReconciliationModal.tsx`**
        *   **Role:** Renders the modal dialog for wallet reconciliation.
        *   **Responsibilities:** Presents the choice to consolidate a temporary wallet or keep it separate. This component is rendered by `page.tsx` when the specific `needsReconciliation` state is triggered.

*   **5.2 Key API Endpoints Used & Integration Plan**

    The `dev-dashboard` is designed to be the primary testing client for the entire suite of Phase 1 MVP APIs. The current implementation uses key endpoints for auth and health, while the remaining UI components are prepared for their final integration. This section lists all relevant endpoints and details their integration plan.

    #### **Endpoints Currently Integrated**

    *   **`GET /api/v1/health`**
        *   **Status:** ✅ **Live**
        *   **Integration:** The `SystemTab.tsx` component calls this endpoint on load and periodically to populate the system health grid.
    *   **`POST /api/v1/auth/check-existence`**
        *   **Status:** ✅ **Live**
        *   **Integration:** The main `page.tsx` calls this endpoint after a user authenticates to correctly route them to either the new user migration flow or the wallet reconciliation modal.

    #### **Endpoints Pending Full Integration**

    The following endpoints have their UI and action handlers prepared in the dashboard. The final step is to replace the current simulations with live `fetch` calls.

    **Wallet & Escrow Endpoints (`WalletTab.tsx`)**
    *   **`GET /api/v1/user/wallet/info`**
        *   **Integration Plan:** The `fetchWalletInfo` function in `page.tsx` will call this to populate the "My Wallet" card with the user's real address and balance.
    *   **`GET /api/v1/user/wallet/transactions`**
        *   **Integration Plan:** The `fetchTransactions` function will call this to populate the "Transactions" sub-tab with the user's real transaction history.
    *   **`GET /api/v1/user/wallet/escrows`**
        *   **Integration Plan:** The `fetchEscrows` function will call this to populate the "My Escrows" and "Assigned to Me" sub-tabs.
    *   **`POST /api/v1/user/wallet/faucet`**
        *   **Integration Plan:** The `handleFaucetRequest` action will call this endpoint. The response `txHash` will be displayed in the success notification.
    *   **`POST /api/v1/user/wallet/send`**
        *   **Integration Plan:** The `handleSendFunds` action will call this endpoint with the recipient and amount from the form.
    *   **`POST /api/v1/user/wallet/escrows/create`**
        *   **Integration Plan:** The `handleCreateEscrow` action will call this endpoint with the form data.
    *   **`POST /api/v1/user/wallet/escrows/fulfill`**
        *   **Integration Plan:** The `handleFulfillEscrow` action will call this endpoint with the specified Escrow ID.
    *   **`POST /api/v1/user/wallet/escrows/release`**
        *   **Integration Plan:** The `handleReleaseEscrow` action will call this endpoint with the specified Escrow ID.

    **Policy & Checkout Endpoints (`CheckoutTab.tsx`, `MyPoliciesTab.tsx`, `TrackPolicyTab.tsx`)**
    *   **`POST /api/v1/user/policies/purchase`**
        *   **Integration Plan:** The `CheckoutTab.tsx` component's payment handlers will call this endpoint. The logic will need to correctly pass the `payment_method_type` ('STRIPE' or 'CUSTODIAL_PAYGO') and handle the different response shapes (e.g., a `stripe_client_secret` for Stripe).
    *   **`GET /api/v1/user/policies`**
        *   **Integration Plan:** The `MyPoliciesTab.tsx` component will call this endpoint (via a handler in `page.tsx`) to fetch and display the list of policies associated with the authenticated user's account.
    *   **`GET /api/v1/policy/track`**
        *   **Integration Plan:** The `TrackPolicyTab.tsx` component's `handleTrackPolicy` function will call this endpoint with the user-provided verification code and display the returned policy status.

    **Chat Endpoints (`ChatTab.tsx`)**
    *   **`POST /api/v1/chat/message`**
        *   **Integration Plan:** This is the final and most significant integration. The `handleSendMessage` function in `ChatTab.tsx` will be updated to send the user's input to this endpoint. The component will then need to parse the `assistant_response_content` and `ui_elements` from the response to render both the text reply and any special components, like real `QuoteCard`s with actionable data.

*   **5.3 Environment Variables**

    The developer dashboard relies on environment variables to enable certain features. These must be configured correctly for the dashboard to be fully functional.

    *   **`NEXT_PUBLIC_UNSPLASH_API_KEY`**
        *   **Purpose:** Holds the API Key for the Unsplash API. This is the primary source for the dynamic backgrounds on the Chat tab.
        *   **Configuration:** This key must be placed in a `.env.local` file at the root of the web application directory (`triggerr/apps/web/.env.local`).
        *   **Example:** `NEXT_PUBLIC_UNSPLASH_API_KEY=your_unsplash_api_key_goes_here`

    *   **`NEXT_PUBLIC_PEXELS_API_KEY`**
        *   **Purpose:** Holds the API Key for the Pexels API. This serves as a fallback image source if the Unsplash key is missing or fails.
        *   **Configuration:** This key must also be placed in the `triggerr/apps/web/.env.local` file.
        *   **Example:** `NEXT_PUBLIC_PEXELS_API_KEY=your_pexels_api_key_goes_here`

*   **5.4 Known Issues & Fixes Implemented**

    During the development and testing of the dashboard, several critical issues were identified and resolved. This section documents these issues and their solutions as a reference for future debugging and to provide context on the system's architecture.

    *   **5.4.1 API Route Not Found (`404 Error`)**
        *   **Symptom:** Initial tests of the `POST /api/v1/auth/check-existence` endpoint using `curl` resulted in a `404 Not Found` error.
        *   **Root Cause:** The backend API server at `triggerr/apps/api/src/index.ts` operates as a **manual router**. New endpoints are not automatically discovered. The route and its handler function had been created but were not explicitly imported and registered in the `index.ts` file's routing logic.
        *   **Solution:** The `handleCheckExistence` function was imported, and an `if` block was added to the router to map the `POST /api/v1/auth/check-existence` path to its handler. The server was then restarted to load the new configuration.

    *   **5.4.2 `write EPIPE` Service Crash**
        *   **Symptom:** The main `bun dev` command would crash intermittently, with the error log pointing to an `EPIPE` error originating from `esbuild` within the `@triggerr/utils` package.
        *   **Root Cause:** This indicated instability in the `esbuild` file watcher process, a common issue in complex monorepos. The long-running watch script was likely being terminated unexpectedly.
        *   **Solution:** The `dev` script in `triggerr/packages/utils/package.json` was made more robust by adding an `--onSuccess` flag. This provides a stable action for the watcher to perform after each rebuild, which helps prevent the process from crashing.
            ```json
            // In triggerr/packages/utils/package.json
            "scripts": {
              "dev": "tsup --watch --onSuccess 'echo \"@triggerr/utils build successful\"'"
            }
            ```

    *   **5.4.3 Post-Login `UNAUTHORIZED` Race Condition**
        *   **Symptom:** Immediately after a user logged in, API calls for wallet data would fail with `401 Unauthorized` errors, which would resolve upon a manual page refresh.
        *   **Root Cause:** A client-side race condition. The `useEffect` hooks responsible for fetching data were firing as soon as `isAuthenticated` became `true`, but *before* the browser had fully set the necessary authentication cookie from Better-Auth.
        *   **Solution:** A new state flag, `isUserSetupComplete`, was introduced in `page.tsx`. This flag is now the single source of truth that the entire authentication and post-login setup (including data migration or reconciliation) is finished. All `useEffect` hooks that fetch authenticated data are now dependent on this flag, ensuring they only fire after the user's session is stable and the backend is ready.
            ```typescript
            // In triggerr/apps/web/src/app/dev-dashboard/page.tsx
            useEffect(() => {
              // Only run if user setup is fully complete AND we have wallet info
              if (isUserSetupComplete && walletInfo) {
                fetchTransactions();
                fetchEscrows();
              }
            }, [isUserSetupComplete, walletInfo, fetchTransactions, fetchEscrows]);
            ```
---
### **6.0 Brand & Marketing Considerations**

This section contains creative assets and ideas related to the project's branding, generated during the development process.

*   **6.1 Subtitle & Tagline Options**

    The following subtitles have been proposed to clearly communicate the brand's value proposition beyond simply "parametric insurance."

    *   **Category: Speed & Automation**
        *   _triggerr: Flight Delays, Instantly Covered._ (Highly recommended for its clarity and benefit-focus).
        *   _triggerr: The Payout is Automatic._
        *   _triggerr: Insurance that Pays Before You Land._
        *   _triggerr: No Claims, Just Payouts._

    *   **Category: Simplicity & Transparency**
        *   _triggerr: Insurance, Radically Simplified._
        *   _triggerr: See-Through Insurance._
        *   _triggerr: Insurance Without the Fine Print._

    *   **Category: Tech-Forward Approach**
        *   _triggerr: The Future of On-Chain Insurance._
        *   _triggerr: Smarter Insurance, Built on Code._
        *   _triggerr: Your Policy, On-Chain and On-Time._