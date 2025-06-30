// Core auth exports for Better-Auth integration
export { auth, type User, type Session } from './auth';
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
} from './utils';

// Re-export Better-Auth client for frontend
export { createAuthClient } from 'better-auth/client';
