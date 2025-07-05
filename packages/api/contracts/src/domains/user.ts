// ===========================================================================
// USER DOMAIN BARREL - API CONTRACTS
//
// This file provides clean, domain-specific exports for all user-related
// DTOs, validators, and utilities by first importing them locally from the
// actual DTO/validator files and then re-exporting them.
// ===========================================================================

// === STEP 1: IMPORT DTOS & TYPES FOR LOCAL USE AND RE-EXPORT ===
import type {
  // Admin Types
  AdminUserActionType,
  AdminListUsersRequest,
  AdminListUsersResponse,
  AdminGetUserRequest,
  AdminGetUserResponse,
  AdminUpdateUserRequest,
  AdminUpdateUserResponse,
  AdminPerformUserActionRequest,
  AdminPerformUserActionResponse,

  // User Activity Types
  UserActivityLog,
  GetUserActivityLogRequest,
  GetUserActivityLogResponse,

  // User Consent Types
  UserConsent,
  GetUserConsentsRequest,
  GetUserConsentsResponse,
  UpdateUserConsentRequest,
  UpdateUserConsentResponse,
} from "../dtos/user";

// === STEP 2: IMPORT VALIDATORS FOR LOCAL USE AND RE-EXPORT ===
import {
  adminUserActionTypeSchema,
  adminListUsersRequestSchema,
  adminListUsersResponseSchema,
  adminGetUserRequestSchema,
  adminGetUserResponseSchema,
  adminUpdateUserRequestSchema,
  adminUpdateUserResponseSchema,
  adminPerformUserActionRequestSchema,
  adminPerformUserActionResponseSchema,
  userActivityLogSchema,
  getUserActivityLogRequestSchema,
  getUserActivityLogResponseSchema,
  userConsentSchema,
  getUserConsentsRequestSchema,
  getUserConsentsResponseSchema,
  updateUserConsentRequestSchema,
  updateUserConsentResponseSchema,
} from "../validators/user";

// Import shared schemas that are used by user validators
import {
  userProfileSchema,
  userStatusSchema,
  userRoleSchema,
  kycStatusSchema,
} from "../validators/wallet";

// Import Zod-inferred types for re-export
import type {
  AdminUserActionType as ZodAdminUserActionType,
  AdminListUsersRequest as ZodAdminListUsersRequest,
  AdminListUsersResponse as ZodAdminListUsersResponse,
  AdminGetUserRequest as ZodAdminGetUserRequest,
  AdminGetUserResponse as ZodAdminGetUserResponse,
  AdminUpdateUserRequest as ZodAdminUpdateUserRequest,
  AdminUpdateUserResponse as ZodAdminUpdateUserResponse,
  AdminPerformUserActionRequest as ZodAdminPerformUserActionRequest,
  AdminPerformUserActionResponse as ZodAdminPerformUserActionResponse,
  UserActivityLog as ZodUserActivityLog,
  GetUserActivityLogRequest as ZodGetUserActivityLogRequest,
  GetUserActivityLogResponse as ZodGetUserActivityLogResponse,
  UserConsent as ZodUserConsent,
  GetUserConsentsRequest as ZodGetUserConsentsRequest,
  GetUserConsentsResponse as ZodGetUserConsentsResponse,
  UpdateUserConsentRequest as ZodUpdateUserConsentRequest,
  UpdateUserConsentResponse as ZodUpdateUserConsentResponse,
} from "../validators/user";

// === STEP 3: RE-EXPORT ALL IMPORTED ITEMS FOR EXTERNAL USE ===

// DTO re-exports
export type {
  AdminUserActionType,
  AdminListUsersRequest,
  AdminListUsersResponse,
  AdminGetUserRequest,
  AdminGetUserResponse,
  AdminUpdateUserRequest,
  AdminUpdateUserResponse,
  AdminPerformUserActionRequest,
  AdminPerformUserActionResponse,
  UserActivityLog,
  GetUserActivityLogRequest,
  GetUserActivityLogResponse,
  UserConsent,
  GetUserConsentsRequest,
  GetUserConsentsResponse,
  UpdateUserConsentRequest,
  UpdateUserConsentResponse,
};

// Validator and Zod-inferred type re-exports
export {
  adminUserActionTypeSchema,
  adminListUsersRequestSchema,
  adminListUsersResponseSchema,
  adminGetUserRequestSchema,
  adminGetUserResponseSchema,
  adminUpdateUserRequestSchema,
  adminUpdateUserResponseSchema,
  adminPerformUserActionRequestSchema,
  adminPerformUserActionResponseSchema,
  userActivityLogSchema,
  getUserActivityLogRequestSchema,
  getUserActivityLogResponseSchema,
  userConsentSchema,
  getUserConsentsRequestSchema,
  getUserConsentsResponseSchema,
  updateUserConsentRequestSchema,
  updateUserConsentResponseSchema,
  userProfileSchema, // re-export shared
  userStatusSchema, // re-export shared
  userRoleSchema, // re-export shared
  kycStatusSchema, // re-export shared
};
export type {
  ZodAdminUserActionType,
  ZodAdminListUsersRequest,
  ZodAdminListUsersResponse,
  ZodAdminGetUserRequest,
  ZodAdminGetUserResponse,
  ZodAdminUpdateUserRequest,
  ZodAdminUpdateUserResponse,
  ZodAdminPerformUserActionRequest,
  ZodAdminPerformUserActionResponse,
  ZodUserActivityLog,
  ZodGetUserActivityLogRequest,
  ZodGetUserActivityLogResponse,
  ZodUserConsent,
  ZodGetUserConsentsRequest,
  ZodGetUserConsentsResponse,
  ZodUpdateUserConsentRequest,
  ZodUpdateUserConsentResponse,
};

// === NAMESPACE EXPORTS ===

/**
 * User & Admin validators namespace.
 */
export const validators = {
  // Request validators
  adminListUsersRequest: adminListUsersRequestSchema,
  adminGetUserRequest: adminGetUserRequestSchema,
  adminUpdateUserRequest: adminUpdateUserRequestSchema,
  adminPerformUserActionRequest: adminPerformUserActionRequestSchema,
  getUserActivityLogRequest: getUserActivityLogRequestSchema,
  getUserConsentsRequest: getUserConsentsRequestSchema,
  updateUserConsentRequest: updateUserConsentRequestSchema,

  // Response validators
  adminListUsersResponse: adminListUsersResponseSchema,
  adminGetUserResponse: adminGetUserResponseSchema,
  adminUpdateUserResponse: adminUpdateUserResponseSchema,
  adminPerformUserActionResponse: adminPerformUserActionResponseSchema,
  getUserActivityLogResponse: getUserActivityLogResponseSchema,
  getUserConsentsResponse: getUserConsentsResponseSchema,
  updateUserConsentResponse: updateUserConsentResponseSchema,

  // Core validators
  userActivityLog: userActivityLogSchema,
  userConsent: userConsentSchema,
  userProfile: userProfileSchema,

  // Enum validators
  adminUserActionType: adminUserActionTypeSchema,
  userStatus: userStatusSchema,
  userRole: userRoleSchema,
  kycStatus: kycStatusSchema,
} as const;

/**
 * User & Admin utilities namespace.
 */
export const utils = {
  /**
   * Generate a unique user ID
   */
  generateUserId: (): string => {
    // This is a placeholder. In a real app, this would likely be handled by the database.
    return `user_${crypto.randomUUID()}`;
  },
} as const;

/**
 * User & Admin constants namespace.
 */
export const constants = {
  ADMIN_ACTIONS: {
    SUSPEND_USER: "SUSPEND_USER" as const,
    UNSUSPEND_USER: "UNSUSPEND_USER" as const,
    VERIFY_KYC: "VERIFY_KYC" as const,
    REJECT_KYC: "REJECT_KYC" as const,
    RESET_PASSWORD_ADMIN: "RESET_PASSWORD_ADMIN" as const,
    UPDATE_USER_ROLE: "UPDATE_USER_ROLE" as const,
    DELETE_USER_DATA: "DELETE_USER_DATA" as const,
    GRANT_ADMIN_PRIVILEGE: "GRANT_ADMIN_PRIVILEGE" as const,
    REVOKE_ADMIN_PRIVILEGE: "REVOKE_ADMIN_PRIVILEGE" as const,
  },
  CONSENT_IDS: {
    TERMS_OF_SERVICE: "TERMS_OF_SERVICE" as const,
    PRIVACY_POLICY: "PRIVACY_POLICY" as const,
    MARKETING_EMAILS: "MARKETING_EMAILS" as const,
  },
} as const;

// === COMBINED NAMESPACE EXPORT ===
export const UserDomain = {
  validators,
  utils,
  constants,
} as const;

// === TYPE DEFINITIONS ===
export type UserDomainNamespace = typeof UserDomain;
export type UserValidators = typeof validators;
export type UserUtils = typeof utils;
export type UserConstants = typeof constants;
