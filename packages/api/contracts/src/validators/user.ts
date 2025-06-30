// ============================================================================
// USER MANAGEMENT API VALIDATORS (ZOD SCHEMAS)
// ============================================================================

import { z } from 'zod';
// Imports from actual Zod schemas in other validator files
import {
  userProfileSchema, // This is a Zod schema
  userStatusSchema,  // This is a Zod schema
  userRoleSchema,    // This is a Zod schema
  kycStatusSchema,   // This is a Zod schema
} from './wallet';

import {
  paginationRequestSchema,    // This is a Zod schema
  paginationResponseSchema,   // This is a Zod schema
} from './common';

// ============================================================================
// ENUMS (FROM user.ts DTOs, converted to Zod enums)
// ============================================================================

export const adminUserActionTypeSchema = z.enum([
  'SUSPEND_USER',
  'UNSUSPEND_USER',
  'VERIFY_KYC',
  'REJECT_KYC',
  'RESET_PASSWORD_ADMIN',
  'UPDATE_USER_ROLE',
  'DELETE_USER_DATA',
  'GRANT_ADMIN_PRIVILEGE',
  'REVOKE_ADMIN_PRIVILEGE',
]);

// ============================================================================
// ADMIN USER MANAGEMENT SCHEMAS
// ============================================================================

// Note: Schemas like userProfileSchema, userStatusSchema, userRoleSchema, kycStatusSchema,
// paginationRequestSchema, and paginationResponseSchema are directly imported
// from their respective validator files (./wallet and ./common) and used below.
// These imported identifiers are already Zod schema objects.

export const adminListUsersRequestSchema = paginationRequestSchema.extend({
  email: z.string().email().optional(),
  status: userStatusSchema.optional(),
  role: userRoleSchema.optional(),
  kycStatus: kycStatusSchema.optional(),
  createdAtFrom: z.string().datetime({ precision: 0, offset: true }).optional(),
  createdAtTo: z.string().datetime({ precision: 0, offset: true }).optional(),
  lastLoginFrom: z.string().datetime({ precision: 0, offset: true }).optional(),
  lastLoginTo: z.string().datetime({ precision: 0, offset: true }).optional(),
  sortBy: z.enum(['email', 'createdAt', 'lastLoginAt', 'status', 'role']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
}).strict();

export const adminListUsersResponseSchema = z.object({
  users: z.array(userProfileSchema),
  pagination: paginationResponseSchema,
});

export const adminGetUserRequestSchema = z.object({
  userId: z.string().uuid(),
}).strict();

export const adminGetUserResponseSchema = userProfileSchema;

export const adminUpdateUserRequestSchema = z.object({
  userId: z.string().uuid(),
  status: userStatusSchema.optional(),
  role: userRoleSchema.optional(),
  kycStatus: kycStatusSchema.optional(),
  name: z.string().min(1).max(100).optional(),
  metadata: z.record(z.any()).optional(),
}).strict();

export const adminUpdateUserResponseSchema = userProfileSchema;

export const adminPerformUserActionRequestSchema = z.object({
  userId: z.string().uuid(),
  action: adminUserActionTypeSchema,
  reason: z.string().min(1).max(500).optional(),
  payload: z.record(z.any()).optional(), // e.g., { newRole: 'admin' }
}).strict();

export const adminPerformUserActionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  updatedUser: userProfileSchema.optional(),
  auditLogId: z.string().uuid().optional(),
});

// ============================================================================
// USER SETTINGS/DATA DISTINCT FROM PROFILE SCHEMAS
// ============================================================================

export const userActivityLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime({ precision: 0, offset: true }),
  activityType: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  metadata: z.record(z.any()).optional(),
});

export const getUserActivityLogRequestSchema = paginationRequestSchema.extend({
  userId: z.string().uuid(),
  activityType: z.string().max(100).optional(),
  dateFrom: z.string().datetime({ precision: 0, offset: true }).optional(),
  dateTo: z.string().datetime({ precision: 0, offset: true }).optional(),
}).strict();

export const getUserActivityLogResponseSchema = z.object({
  logs: z.array(userActivityLogSchema),
  pagination: paginationResponseSchema,
});

export const userConsentSchema = z.object({
  id: z.string().min(1).max(100), // e.g., 'TERMS_OF_SERVICE_V2'
  granted: z.boolean(),
  version: z.string().max(50).optional(),
  grantedAt: z.string().datetime({ precision: 0, offset: true }).optional(),
  updatedAt: z.string().datetime({ precision: 0, offset: true }),
  source: z.string().max(100).optional(),
});

export const getUserConsentsRequestSchema = z.object({
  userId: z.string().uuid(),
}).strict();

export const getUserConsentsResponseSchema = z.object({
  consents: z.array(userConsentSchema),
});

export const updateUserConsentRequestSchema = z.object({
  userId: z.string().uuid(),
  consentId: z.string().min(1).max(100),
  granted: z.boolean(),
  version: z.string().max(50).optional(),
  source: z.string().max(100).optional(),
}).strict();

export const updateUserConsentResponseSchema = userConsentSchema;


// ============================================================================
// TYPE EXPORTS (inferred from schemas for convenience)
// ============================================================================

export type AdminUserActionType = z.infer<typeof adminUserActionTypeSchema>;

export type AdminListUsersRequest = z.infer<typeof adminListUsersRequestSchema>;
export type AdminListUsersResponse = z.infer<typeof adminListUsersResponseSchema>;
export type AdminGetUserRequest = z.infer<typeof adminGetUserRequestSchema>;
export type AdminGetUserResponse = z.infer<typeof adminGetUserResponseSchema>;
export type AdminUpdateUserRequest = z.infer<typeof adminUpdateUserRequestSchema>;
export type AdminUpdateUserResponse = z.infer<typeof adminUpdateUserResponseSchema>;
export type AdminPerformUserActionRequest = z.infer<typeof adminPerformUserActionRequestSchema>;
export type AdminPerformUserActionResponse = z.infer<typeof adminPerformUserActionResponseSchema>;

export type UserActivityLog = z.infer<typeof userActivityLogSchema>;
export type GetUserActivityLogRequest = z.infer<typeof getUserActivityLogRequestSchema>;
export type GetUserActivityLogResponse = z.infer<typeof getUserActivityLogResponseSchema>;

export type UserConsent = z.infer<typeof userConsentSchema>;
export type GetUserConsentsRequest = z.infer<typeof getUserConsentsRequestSchema>;
export type GetUserConsentsResponse = z.infer<typeof getUserConsentsResponseSchema>;
export type UpdateUserConsentRequest = z.infer<typeof updateUserConsentRequestSchema>;
export type UpdateUserConsentResponse = z.infer<typeof updateUserConsentResponseSchema>;
