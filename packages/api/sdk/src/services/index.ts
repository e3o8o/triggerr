// ===========================================================================
// API SDK - SERVICES MODULE EXPORTS
// ===========================================================================

/**
 * This file serves as a central export point for all service classes
 * within the API SDK. Service classes encapsulate logic for interacting
 * with specific domains of the triggerr API (e.g., Chat, Policy, Wallet).
 *
 * Each service class typically takes an instance of the `ApiClient` in its
 * constructor and uses it to make requests to the relevant API endpoints.
 */

// --- Chat Service ---
// Provides methods for interacting with chat and conversation-related API endpoints.
export { ChatService } from './chat';

// --- Insurance Service ---
// Provides methods for insurance quoting, product catalog, purchasing, etc.
export { InsuranceService } from './insurance';

// --- Policy Service (Parametric Model) ---
// Provides methods for managing parametric policies, viewing automated payout records, etc.
export { PolicyService } from './policy';

// --- User Service ---
// Will provide methods for user profile management, dashboard data, etc.
export { UserService } from './user';

// --- Wallet Service ---
// Provides methods for wallet operations, transactions, etc.
export { WalletService } from './wallet';

// --- Admin Service ---
// Provides methods for administrative functions if exposed via SDK.
export { AdminService } from './admin';

// As more services are implemented,
// they should be exported from this file as well. This allows consumers of the
// SDK to import all available services from a single, convenient path:
// `import { ChatService, InsuranceService, PolicyService, WalletService, UserService, AdminService } from '@triggerr/api-sdk/services';`
// Or, if services are re-exported from the main SDK index:
// `import { ChatService, InsuranceService, PolicyService, WalletService, UserService, AdminService } from '@triggerr/api-sdk';`
