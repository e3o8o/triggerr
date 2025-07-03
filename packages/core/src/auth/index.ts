// Core auth exports for Better-Auth integration
export { auth, type User, type Session } from "./auth";
export {
  getAuthContext,
  requireAuth,
  getAnonymousSessionId,
  setRLSContext,
  withAuthContext,
  withAuth,
  createAnonymousSessionId,
  isValidAnonymousSessionId,
  migrateAnonymousDataToUser,
  type AuthContext,
} from "./utils";

// Note: Client-side auth exports are available in separate client module
// Import from @triggerr/core/auth/client for React components
