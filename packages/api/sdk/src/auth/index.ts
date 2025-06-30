// ===========================================================================
// API SDK - AUTH MODULE EXPORTS
// ===========================================================================

/**
 * Re-exports all types and interfaces related to authentication
 * from the `types.ts` file within this auth module.
 *
 * This typically includes:
 * - `AuthHeaderProvider`: The core interface for supplying auth headers.
 * - `ApiKey`: Type alias for API keys.
 * - `JwtToken`: Type alias for JWT tokens.
 * - `AnonymousSessionId`: Type alias for anonymous session IDs.
 */
export * from './types';

// Export AnonymousSessionManager and related utilities
export {
  AnonymousSessionManager,
  createAnonymousSessionManager,
  createMemoryAnonymousSessionManager,
  type SessionStorage,
  type AnonymousSessionManagerConfig,
} from './anonymous-session-manager';

// Authentication utility constants
export const ANONYMOUS_SESSION_HEADER_KEY = 'x-anonymous-session-id';
export const API_KEY_HEADER_KEY = 'x-api-key';
export const AUTHORIZATION_HEADER_KEY = 'Authorization';
