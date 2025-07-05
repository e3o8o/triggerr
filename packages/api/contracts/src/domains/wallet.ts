// ===========================================================================
// WALLET DOMAIN BARREL - API CONTRACTS
//
// This file provides clean, domain-specific exports for all wallet-related
// DTOs, validators, and utilities by first importing them locally from the
// actual DTO/validator files and then re-exporting them.
// ===========================================================================

// === STEP 1: IMPORT DTOS & TYPES FOR LOCAL USE AND RE-EXPORT ===
import type {
  // Basic Enums
  WalletType,
  WalletStatus,
  TransactionType,
  TransactionStatus,
  UserStatus,
  UserRole,
  KYCStatus,

  // Core Wallet & User Types
  UserWallet,
  UserWalletInfoResponse,
  WalletTransaction,
  WalletBalance,
  WalletSummary,
  TransactionSummary,
  EscrowSummary,
  PendingOperation,
  UserProfile,
  UserPreferences,
  PrivacyPreferences,
  TradingPreferences,
  TransactionLimits,

  // User Activity & Notifications
  ActivityItem,
  UserNotification,
  UserPolicySummary,
  PolicySummaryStats,
  QuickAction,
  FlightSearchHistory,

  // Request/Response Types
  WalletSendRequest,
  WalletSendResponse,
  WalletReceiveRequest,
  WalletReceiveResponse,
  TransactionHistoryRequest,
  TransactionHistoryResponse,
  FaucetRequest,
  UserFaucetResponse,
  UserSignupCompletionRequest,
  UserSignupCompletionResponse,
  UserProfileUpdateRequest,
  UserProfileUpdateResponse,
  UserPolicyListRequest,
  UserPolicyListResponse,
  UserDashboardRequest,
  UserDashboardResponse,

  // Anonymous Session Types
  AnonymousSession,
  AnonymousSessionData,
  AnonymousDataMigrationSummary,
} from "../dtos/wallet";

// === STEP 2: IMPORT VALIDATORS FOR LOCAL USE AND RE-EXPORT ===
import {
  // Enum Validators
  walletTypeSchema,
  walletStatusSchema,
  transactionTypeSchema,
  transactionStatusSchema,
  userStatusSchema,
  userRoleSchema,
  kycStatusSchema,

  // Base Schema Validators
  walletBalanceSchema,
  walletTransactionSchema,
  escrowSummarySchema,
  pendingOperationSchema,
  transactionLimitsSchema,
  // Note: DTO is in insurance.ts, but schema is here
  notificationPreferencesSchema,
  communicationPreferencesSchema,
  privacyPreferencesSchema,
  tradingPreferencesSchema,
  userPreferencesSchema,
  userWalletSchema,
  userProfileSchema,
  anonymousSessionDataSchema,
  anonymousSessionSchema,
  anonymousDataMigrationSummarySchema,

  // Request Validators
  walletSendRequestSchema,
  walletReceiveRequestSchema,
  transactionHistoryRequestSchema,
  faucetRequestSchema,
  // Note: DTOs do not exist for these, but validators do
  generateAnonymousWalletRequestSchema,
  linkExistingWalletRequestSchema,
  userSignupCompletionRequestSchema,
  userProfileUpdateRequestSchema,
  userPolicyListRequestSchema,
  userDashboardRequestSchema,

  // Response Validators
  userWalletInfoResponseSchema,
  walletSendResponseSchema,
  walletReceiveResponseSchema,
  transactionSummarySchema,
  transactionHistoryResponseSchema,
  userFaucetResponseSchema,
  userSignupCompletionResponseSchema,
  userProfileUpdateResponseSchema,
  // Note: DTOs do not exist for these, but validators do
  userPolicySummarySchema,
  userPolicyListResponseSchema,
  activityItemSchema,
  userNotificationSchema,
  quickActionSchema,
  userDashboardResponseSchema,

  // Escrow schemas
  escrowCreateRequestSchema,

  // Validation Functions
  validateWalletSendRequest,
  validateWalletReceiveRequest,
  validateTransactionHistoryRequest,
  validateFaucetRequest,
  validateUserSignupCompletionRequest,
  validateUserProfileUpdateRequest,
  validateUserPolicyListRequest,
  validateUserDashboardRequest,
  safeValidateWalletSendRequest,
  safeValidateTransactionHistoryRequest,
  safeValidateUserProfileUpdateRequest,
} from "../validators/wallet";

// Import Zod-inferred types for re-export
import type {
  WalletSendRequest as ZodWalletSendRequest,
  WalletSendResponse as ZodWalletSendResponse,
  UserWallet as ZodUserWallet,
  UserProfile as ZodUserProfile,
} from "../validators/wallet";

// === STEP 3: RE-EXPORT ALL IMPORTED ITEMS FOR EXTERNAL USE ===

// DTO re-exports
export type {
  WalletType,
  WalletStatus,
  TransactionType,
  TransactionStatus,
  UserStatus,
  UserRole,
  KYCStatus,
  UserWallet,
  UserWalletInfoResponse,
  WalletTransaction,
  EscrowSummary,
  PendingOperation,
  UserProfile,
  UserPreferences,
  PrivacyPreferences,
  TradingPreferences,
  TransactionLimits,
  WalletSendRequest,
  WalletSendResponse,
  WalletReceiveRequest,
  WalletReceiveResponse,
  TransactionHistoryRequest,
  TransactionHistoryResponse,
  FaucetRequest,
  UserFaucetResponse,
  UserSignupCompletionRequest,
  UserSignupCompletionResponse,
  UserProfileUpdateRequest,
  UserProfileUpdateResponse,
  UserPolicyListRequest,
  UserPolicyListResponse,
  UserDashboardRequest,
  UserDashboardResponse,
  ActivityItem,
  UserNotification,
  UserPolicySummary,
  PolicySummaryStats,
  QuickAction,
  FlightSearchHistory,
  WalletBalance,
  WalletSummary,
  TransactionSummary,
  AnonymousSession,
  AnonymousSessionData,
  AnonymousDataMigrationSummary,
};

// Validator and Zod-inferred type re-exports
export {
  walletTypeSchema,
  walletStatusSchema,
  transactionTypeSchema,
  transactionStatusSchema,
  userStatusSchema,
  userRoleSchema,
  kycStatusSchema,
  walletBalanceSchema,
  walletTransactionSchema,
  escrowSummarySchema,
  pendingOperationSchema,
  transactionLimitsSchema,
  notificationPreferencesSchema,
  communicationPreferencesSchema,
  privacyPreferencesSchema,
  tradingPreferencesSchema,
  userPreferencesSchema,
  userWalletSchema,
  userProfileSchema,
  anonymousSessionDataSchema,
  anonymousSessionSchema,
  anonymousDataMigrationSummarySchema,
  walletSendRequestSchema,
  walletReceiveRequestSchema,
  transactionHistoryRequestSchema,
  faucetRequestSchema,
  generateAnonymousWalletRequestSchema,
  linkExistingWalletRequestSchema,
  userSignupCompletionRequestSchema,
  userProfileUpdateRequestSchema,
  userPolicyListRequestSchema,
  userDashboardRequestSchema,
  userWalletInfoResponseSchema,
  walletSendResponseSchema,
  walletReceiveResponseSchema,
  transactionSummarySchema,
  transactionHistoryResponseSchema,
  userFaucetResponseSchema,
  userSignupCompletionResponseSchema,
  userProfileUpdateResponseSchema,
  userPolicySummarySchema,
  userPolicyListResponseSchema,
  activityItemSchema,
  userNotificationSchema,
  quickActionSchema,
  userDashboardResponseSchema,
  escrowCreateRequestSchema,
  validateWalletSendRequest,
  validateWalletReceiveRequest,
  validateTransactionHistoryRequest,
  validateFaucetRequest,
  validateUserSignupCompletionRequest,
  validateUserProfileUpdateRequest,
  validateUserPolicyListRequest,
  validateUserDashboardRequest,
  safeValidateWalletSendRequest,
  safeValidateTransactionHistoryRequest,
  safeValidateUserProfileUpdateRequest,
};
export type {
  ZodWalletSendRequest,
  ZodWalletSendResponse,
  ZodUserWallet,
  ZodUserProfile,
};

// === NAMESPACE EXPORTS ===

/**
 * Wallet, User Profile, and Escrow validators namespace.
 */
export const validators = {
  // Request validators
  sendRequest: walletSendRequestSchema,
  receiveRequest: walletReceiveRequestSchema,
  transactionHistoryRequest: transactionHistoryRequestSchema,
  faucetRequest: faucetRequestSchema,
  generateAnonymousRequest: generateAnonymousWalletRequestSchema,
  linkExistingRequest: linkExistingWalletRequestSchema,
  signupCompletionRequest: userSignupCompletionRequestSchema,
  profileUpdateRequest: userProfileUpdateRequestSchema,
  policyListRequest: userPolicyListRequestSchema,
  dashboardRequest: userDashboardRequestSchema,
  escrowCreateRequest: escrowCreateRequestSchema,

  // Response validators
  infoResponse: userWalletInfoResponseSchema,
  sendResponse: walletSendResponseSchema,
  receiveResponse: walletReceiveResponseSchema,
  transactionHistoryResponse: transactionHistoryResponseSchema,
  faucetResponse: userFaucetResponseSchema,
  signupCompletionResponse: userSignupCompletionResponseSchema,
  profileUpdateResponse: userProfileUpdateResponseSchema,
  policyListResponse: userPolicyListResponseSchema,
  dashboardResponse: userDashboardResponseSchema,

  // Core validators
  userWallet: userWalletSchema,
  walletTransaction: walletTransactionSchema,
  escrowSummary: escrowSummarySchema,
  pendingOperation: pendingOperationSchema,
  userProfile: userProfileSchema,
  userPreferences: userPreferencesSchema,
  anonymousSession: anonymousSessionSchema,

  // Enum validators
  walletType: walletTypeSchema,
  walletStatus: walletStatusSchema,
  transactionType: transactionTypeSchema,
  transactionStatus: transactionStatusSchema,
  userStatus: userStatusSchema,
  kycStatus: kycStatusSchema,
  userRole: userRoleSchema,
} as const;

/**
 * Wallet, User Profile, and Escrow utilities namespace.
 */
export const utils = {
  formatBalance: (balanceInCents: number, currency = "USD"): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(balanceInCents / 100);
  },
  formatAddress: (address: string): string => {
    return address.length < 10
      ? address
      : `${address.slice(0, 6)}...${address.slice(-4)}`;
  },
  isValidAddress: (address: string): boolean =>
    /^0x[a-fA-F0-9]{40}$/.test(address),
  dollarsToCents: (dollars: number): number => Math.round(dollars * 100),
  centsToDollars: (cents: number): number => cents / 100,
} as const;

/**
 * Wallet, User Profile, and Escrow constants namespace.
 */
export const constants = {
  WALLET_TYPES: { CUSTODIAL: "custodial", SELF_CUSTODY: "self_custody" },
  USER_ROLES: { USER: "user", ADMIN: "admin", SUPPORT: "support" },
  KYC_STATUSES: {
    NOT_STARTED: "not_started",
    PENDING: "pending",
    VERIFIED: "verified",
    REJECTED: "rejected",
  },
} as const;

// === COMBINED NAMESPACE EXPORT ===
export const WalletDomain = {
  validators,
  utils,
  constants,
} as const;

// === TYPE DEFINITIONS ===
export type WalletDomainNamespace = typeof WalletDomain;
export type WalletValidators = typeof validators;
export type WalletUtils = typeof utils;
export type WalletConstants = typeof constants;
