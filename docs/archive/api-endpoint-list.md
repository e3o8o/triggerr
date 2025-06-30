# triggerr API Endpoints Overview
**Version:** 1.0
**Status:** All endpoints for Phase F.3.1 are implemented.

This document provides a comprehensive list and description of all implemented API endpoints for the triggerr platform.

---

## 1. Public & Shared APIs

These endpoints are accessible to both anonymous and authenticated users.

### Chat Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/chat/message` | Sends a message to the conversational AI. Handles session management and creates conversations. |
| `POST` | `/api/v1/chat/quote` | Generates an insurance quote directly from a chat message containing flight details. |

### Insurance Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/insurance/quote` | Generates a detailed insurance quote based on flight and passenger information. |
| `GET` | `/api/v1/insurance/products` | Retrieves a list of all available insurance products. |

### Policy Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/policy/track` | Tracks the status of a specific policy using its reference number or ID. |
| `POST`| `/api/v1/policy/purchase`| Handles the purchase of an insurance policy by an anonymous user. |

---

## 2. Authenticated User APIs

These endpoints require user authentication and operate on user-specific data.

### User & Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/user/auth/complete-signup` | Finalizes user registration after first login, creating wallets and migrating anonymous data. |

### Conversation Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/user/conversations` | Retrieves a paginated list of all conversations for the authenticated user. |
| `POST`| `/api/v1/user/conversations/:id/sync-anonymous`| Merges an anonymous conversation session into the user's authenticated account. |

### Policy Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/user/policies` | Retrieves a paginated list of all policies owned by the authenticated user. |
| `GET` | `/api/v1/user/policies/:id` | Gets detailed information for a specific policy owned by the user. |
| `POST`| `/api/v1/user/policies/purchase`| Handles the purchase of an insurance policy by an authenticated user. |

### Wallet Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/user/wallet/info` | Retrieves detailed information about the user's primary custodial PayGo wallet. |
| `GET` | `/api/v1/user/wallet/balance` | Gets the current balance of the user's primary wallet. |
| `POST`| `/api/v1/user/wallet/send`| Initiates a transfer of PayGo tokens from the user's wallet. |
| `GET` | `/api/v1/user/wallet/transactions` | Retrieves a paginated list of transactions for the user's wallet. |
| `GET` | `/api/v1/user/wallet/transactions/:hash`| Gets details for a single transaction by its hash. |
| `POST`| `/api/v1/user/wallet/faucet`| **(Testnet Only)** Funds a user's wallet from a testnet faucet. |

### Escrow Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/user/wallet/escrows` | Retrieves a paginated list of escrows related to the user. |
| `POST`| `/api/v1/user/wallet/escrows/create`| Creates a new user-initiated escrow (non-policy related). |
| `GET` | `/api/v1/user/wallet/escrows/:id` | Gets detailed information for a single user-related escrow. |
| `POST`| `/api/v1/user/wallet/escrows/fulfill`| Fulfills a user-initiated escrow (e.g., by a designated recipient). |
| `POST`| `/api/v1/user/wallet/escrows/release`| Releases an expired, unfulfilled user-initiated escrow back to the creator. |

---

## 3. Internal System APIs

These endpoints are for internal service-to-service communication and require an internal API key for authentication.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/internal/flight-context-lookup` | Retrieves comprehensive, aggregated context about a specific flight for other services. |
| `POST` | `/api/v1/internal/monitoring/flight-status-check` | Checks the real-time status of a flight; intended to be called by a scheduler. |
| `POST` | `/api/v1/internal/payouts/process-triggered` | Initiates the payout process for policies whose claim conditions have been met. |

---

## 4. Webhooks

These endpoints are designed to receive events from external services.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/webhooks/stripe` | Handles incoming webhook events from Stripe (e.g., `checkout.session.completed`). |

---

## 5. Advanced Chat & LLM Interfaces (Authenticated)

These endpoints provide more direct control over the conversational AI.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/chat/sessions` | Retrieves a paginated list of conversations for the current session (auth or anonymous). |
| `GET` | `/api/v1/chat/sessions/:id` | Gets details for a specific conversation, ensuring ownership. |
| `GET` | `/api/v1/chat/sessions/:id/messages`| Gets a paginated list of all messages within a specific conversation. |
| `POST`| `/api/v1/chat/model/query`| Provides direct query access to the underlying LLM, bypassing conversational context. |
| `POST`| `/api/v1/chat/model/context`| Injects custom context or instructions into a conversation. |
| `POST`| `/api/v1/chat/interfaces/cli`| Handles chat interactions specifically from a Command Line Interface. |
| `POST`| `/api/v1/chat/interfaces/terminal`| Handles chat interactions specifically from a Terminal interface. |
