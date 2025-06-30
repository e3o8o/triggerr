// ============================================================================\
// USER MANAGEMENT API DTOS (ADMIN & DISTINCT SETTINGS)\
// ============================================================================\

// Most user-related DTOs (UserProfile, UserPreferences, etc.) are in wallet.ts
// as they are closely tied to the user's primary interaction point.
// This file is for DTOs specifically for user management by administrators
// or for user settings/data not directly part of the standard UserProfile in wallet.ts.

import type { UserProfile, UserStatus, UserRole, KYCStatus } from './wallet';
import type { PaginationRequest, PaginationResponse } from './common';

// ============================================================================\
// ENUMS (Aligned with database schema where applicable)\
// ============================================================================\

export type AdminUserActionType =
  | 'SUSPEND_USER'
  | 'UNSUSPEND_USER'
  | 'VERIFY_KYC'
  | 'REJECT_KYC'
  | 'RESET_PASSWORD_ADMIN'
  | 'UPDATE_USER_ROLE'
  | 'DELETE_USER_DATA'
  | 'GRANT_ADMIN_PRIVILEGE'
  | 'REVOKE_ADMIN_PRIVILEGE';

// ============================================================================\
// ADMIN USER MANAGEMENT DTOS\
// ============================================================================\

export interface AdminListUsersRequest extends PaginationRequest {
  email?: string;
  status?: UserStatus;
  role?: UserRole;
  kycStatus?: KYCStatus;
  createdAtFrom?: string; // ISO 8601
  createdAtTo?: string; // ISO 8601
  lastLoginFrom?: string; // ISO 8601
  lastLoginTo?: string; // ISO 8601
  sortBy?: 'email' | 'createdAt' | 'lastLoginAt' | 'status' | 'role';
  sortOrder?: 'asc' | 'desc';
}

export interface AdminListUsersResponse {
  users: UserProfile[]; // Re-using UserProfile from wallet.ts
  pagination: PaginationResponse;
}

export interface AdminGetUserRequest {
  userId: string; // UUID
}

export type AdminGetUserResponse = UserProfile; // Re-using UserProfile from wallet.ts

export interface AdminUpdateUserRequest {
  userId: string; // UUID
  status?: UserStatus;
  role?: UserRole;
  kycStatus?: KYCStatus;
  name?: string;
  // Admin should not directly update email/phone without re-verification,
  // those are typically user-driven or support-driven with specific flows.
  // Admin should not update preferences directly.
  metadata?: Record<string, any>; // For admin-specific notes or flags
}

export type AdminUpdateUserResponse = UserProfile;

export interface AdminPerformUserActionRequest {
  userId: string; // UUID
  action: AdminUserActionType;
  reason?: string; // For audit logging
  payload?: Record<string, any>; // Action-specific payload, e.g., new role for UPDATE_USER_ROLE
}

export interface AdminPerformUserActionResponse {
  success: boolean;
  message: string;
  updatedUser?: UserProfile; // If action results in user update
  auditLogId?: string;
}

// ============================================================================\
// USER SETTINGS/DATA DISTINCT FROM PROFILE (Example - could be expanded)\
// ============================================================================\

// Example: User activity logs (more detailed than dashboard recent activity)
export interface UserActivityLog {
  id: string;
  timestamp: string; // ISO 8601
  activityType: string; // e.g., 'LOGIN', 'POLICY_PURCHASE', 'WALLET_TRANSFER'
  description: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string; // e.g., "San Francisco, CA, USA"
  metadata?: Record<string, any>;
}

export interface GetUserActivityLogRequest extends PaginationRequest {
  userId: string; // UUID
  activityType?: string;
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
}

export interface GetUserActivityLogResponse {
  logs: UserActivityLog[];
  pagination: PaginationResponse;
}

// Example: User consent management
export interface UserConsent {
  id: string; // e.g., 'TERMS_OF_SERVICE_V2', 'MARKETING_EMAIL_OPT_IN'
  granted: boolean;
  version?: string;
  grantedAt?: string; // ISO 8601
  updatedAt: string; // ISO 8601
  source?: string; // e.g., 'SIGNUP_FORM', 'PROFILE_SETTINGS'
}

export interface GetUserConsentsRequest {
  userId: string; // UUID
}

export interface GetUserConsentsResponse {
  consents: UserConsent[];
}

export interface UpdateUserConsentRequest {
  userId: string; // UUID
  consentId: string;
  granted: boolean;
  version?: string;
  source?: string;
}

export type UpdateUserConsentResponse = UserConsent;

// Note: Ensure that types from wallet.ts (like UserProfile) are correctly imported
// and that there's no unintentional duplication. This file aims to supplement, not replace.
