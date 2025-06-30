// ============================================================================
// WALLET & USER MANAGEMENT API TYPES
// ============================================================================

import type {
  NotificationPreferences,
  CommunicationPreferences,
  PolicyStatus,
  InsuranceProductType,
} from "./insurance";

/**
 * Wallet types supported by the platform
 */
export type WalletType = "custodial" | "external" | "multisig";

/**
 * Wallet status types
 */
export type WalletStatus = "active" | "inactive" | "frozen" | "pending_setup";

/**
 * Transaction types
 */
export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "escrow_fund"
  | "escrow_release"
  | "premium_payment"
  | "claim_payout"
  | "faucet_request"
  | "transfer";

/**
 * Transaction status
 */
export type TransactionStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "cancelled";

/**
 * User account status
 */
export type UserStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending_verification";

/**
 * User role types
 */
export type UserRole = "customer" | "provider" | "admin" | "support";

/**
 * KYC verification status
 */
export type KYCStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

// ============================================================================
// WALLET TYPES
// ============================================================================

/**
 * User wallet information
 */
export interface UserWallet {
  id: string;
  userId: string;
  address: string;
  walletName: string;
  walletType: WalletType;
  status: WalletStatus;
  isPrimary: boolean;
  balance: WalletBalance;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lastActivity?: string; // ISO 8601
  metadata?: Record<string, any>;
}

/**
 * Wallet balance information
 */
export interface WalletBalance {
  total: number; // in cents
  available: number; // in cents
  locked: number; // in cents (in escrows)
  pending: number; // in cents (pending transactions)
  currency: string; // 'USD' equivalent
  lastUpdated: string; // ISO 8601
}

/**
 * Wallet info response
 */
export interface UserWalletInfoResponse {
  wallet: UserWallet;
  recentTransactions: WalletTransaction[];
  activeEscrows: EscrowSummary[];
  pendingOperations: PendingOperation[];
}

/**
 * Wallet transaction
 */
export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number; // in cents
  fee?: number; // in cents
  status: TransactionStatus;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
  blockNumber?: number;
  confirmations?: number;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string; // ISO 8601
  confirmedAt?: string; // ISO 8601
}

/**
 * Escrow summary for wallet
 */
export interface EscrowSummary {
  id: string;
  internalId: string;
  blockchainId: string;
  type: "POLICY" | "USER";
  purpose?: string;
  amount: number; // in cents
  status: "created" | "funded" | "fulfilled" | "released" | "expired";
  expiresAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  relatedPolicy?: string;
}

/**
 * Pending wallet operation
 */
export interface PendingOperation {
  id: string;
  type: "transfer" | "escrow_create" | "escrow_fulfill" | "faucet_request";
  amount?: number; // in cents
  status: "pending" | "processing" | "confirming";
  estimatedCompletion?: string; // ISO 8601
  description: string;
}

/**
 * Wallet send request
 */
export interface WalletSendRequest {
  toAddress: string;
  amount: number; // in cents
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Wallet send response
 */
export interface WalletSendResponse {
  transactionId: string;
  txHash: string;
  status: TransactionStatus;
  amount: number; // in cents
  fee: number; // in cents
  estimatedConfirmation?: string; // ISO 8601
  message: string;
}

/**
 * Wallet receive request (generate receive address/QR)
 */
export interface WalletReceiveRequest {
  amount?: number; // in cents, optional for specific amount requests
  description?: string;
  expiresAt?: string; // ISO 8601
}

/**
 * Wallet receive response
 */
export interface WalletReceiveResponse {
  address: string;
  qrCode?: string; // Base64 encoded QR code image
  amount?: number; // in cents
  description?: string;
  expiresAt?: string; // ISO 8601
  paymentUrl?: string; // Deep link for mobile wallets
}

/**
 * Transaction history request
 */
export interface TransactionHistoryRequest {
  walletId?: string; // Optional, defaults to primary wallet
  limit?: number;
  offset?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
}

/**
 * Transaction history response
 */
export interface TransactionHistoryResponse {
  transactions: WalletTransaction[];
  total: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
  };
  summary: TransactionSummary;
}

/**
 * Transaction summary
 */
export interface TransactionSummary {
  totalIn: number; // in cents
  totalOut: number; // in cents
  totalFees: number; // in cents
  transactionCount: number;
  period: {
    from: string; // ISO 8601
    to: string; // ISO 8601
  };
}

/**
 * Faucet request (for testnet/alpha)
 */
export interface FaucetRequest {
  amount?: number; // in cents, optional (defaults to standard amount)
  reason?: string; // Optional reason for audit
}

/**
 * Faucet response
 */
export interface UserFaucetResponse {
  success: boolean;
  amount: number; // in cents
  txHash?: string;
  newBalance: number; // in cents
  message: string;
  nextRequestAt?: string; // ISO 8601, when next request is allowed
}

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  phone?: string;
  status: UserStatus;
  role: UserRole;
  kycStatus: KYCStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lastLoginAt?: string; // ISO 8601
  preferences: UserPreferences;
  metadata?: Record<string, any>;
}

/**
 * User preferences
 */
export interface UserPreferences {
  notifications: NotificationPreferences;
  communications: CommunicationPreferences;
  privacy: PrivacyPreferences;
  trading: TradingPreferences;
}

/**
 * Privacy preferences
 */
export interface PrivacyPreferences {
  profileVisibility: "public" | "private" | "limited";
  dataSharing: boolean;
  analyticsOptOut: boolean;
  marketingOptOut: boolean;
}

/**
 * Trading preferences
 */
export interface TradingPreferences {
  autoRenewal: boolean;
  riskTolerance: "low" | "medium" | "high";
  preferredCurrency: string;
  transactionLimits: TransactionLimits;
}

/**
 * Transaction limits for user
 */
export interface TransactionLimits {
  dailyLimit: number; // in cents
  monthlyLimit: number; // in cents
  singleTransactionLimit: number; // in cents
  requireApprovalAbove: number; // in cents
}

/**
 * User signup completion request
 */
export interface UserSignupCompletionRequest {
  completeProfile?: boolean;
  acceptTerms: boolean;
  preferences?: Partial<UserPreferences>;
}

/**
 * User signup completion response
 */
export interface UserSignupCompletionResponse {
  user: UserProfile;
  wallet: UserWallet;
  message: string;
  nextSteps: string[];
}

/**
 * User profile update request
 */
export interface UserProfileUpdateRequest {
  name?: string;
  phone?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

/**
 * User profile update response
 */
export interface UserProfileUpdateResponse {
  user: UserProfile;
  message: string;
  updatedFields: string[];
}

/**
 * User policy list request
 */
export interface UserPolicyListRequest {
  limit?: number;
  offset?: number;
  status?: PolicyStatus;
  productType?: InsuranceProductType;
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
}

/**
 * User policy list response
 */
export interface UserPolicyListResponse {
  policies: UserPolicySummary[];
  total: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
  };
  summary: UserPolicySummary;
}

/**
 * User policy summary
 */
export interface UserPolicySummary {
  id: string;
  policyNumber: string;
  productType: InsuranceProductType;
  status: PolicyStatus;
  coverageAmount: number; // in cents
  premium: number; // in cents
  flightNumber?: string;
  departureDate?: string; // ISO 8601
  expiresAt: string; // ISO 8601
  purchasedAt: string; // ISO 8601
  provider: {
    id: string;
    name: string;
    displayName: string;
  };
}

/**
 * User dashboard data request
 */
export interface UserDashboardRequest {
  includeRecentActivity?: boolean;
  includePolicySummary?: boolean;
  includeWalletSummary?: boolean;
  activityLimit?: number;
}

/**
 * User dashboard response
 */
export interface UserDashboardResponse {
  user: UserProfile;
  walletSummary: WalletSummary;
  policySummary: PolicySummaryStats;
  recentActivity: ActivityItem[];
  notifications: UserNotification[];
  quickActions: QuickAction[];
}

/**
 * Wallet summary for dashboard
 */
export interface WalletSummary {
  totalBalance: number; // in cents
  availableBalance: number; // in cents
  lockedBalance: number; // in cents
  recentTransactionCount: number;
  activeEscrowCount: number;
}

/**
 * Policy summary stats for dashboard
 */
export interface PolicySummaryStats {
  activePolicies: number;
  totalCoverage: number; // in cents
  upcomingExpirations: number;
  recentClaims: number;
  totalPremiumsPaid: number; // in cents
}

/**
 * Activity item for dashboard
 */
export interface ActivityItem {
  id: string;
  type:
    | "policy_purchased"
    | "claim_filed"
    | "payment_received"
    | "wallet_transaction"
    | "flight_update";
  title: string;
  description: string;
  timestamp: string; // ISO 8601
  metadata?: Record<string, any>;
  actionUrl?: string;
}

/**
 * User notification
 */
export interface UserNotification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO 8601
  expiresAt?: string; // ISO 8601
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Quick action for dashboard
 */
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon?: string;
  url: string;
  category: "policy" | "wallet" | "account" | "support";
}

/**
 * Anonymous session data
 */
export interface AnonymousSession {
  sessionId: string;
  createdAt: string; // ISO 8601
  lastActivity: string; // ISO 8601
  expiresAt: string; // ISO 8601
  data: AnonymousSessionData;
}

/**
 * Anonymous session data structure
 */
export interface AnonymousSessionData {
  cartItems: string[]; // Quote IDs
  conversationIds: string[];
  preferences?: Partial<UserPreferences>;
  flightSearches?: FlightSearchHistory[];
  metadata?: Record<string, any>;
}

/**
 * Flight search history for anonymous users
 */
export interface FlightSearchHistory {
  id: string;
  origin: string;
  destination: string;
  departureDate: string; // ISO 8601
  searchedAt: string; // ISO 8601
  results?: number;
}

/**
 * Anonymous data migration summary
 */
export interface AnonymousDataMigrationSummary {
  sessionId: string;
  userId: string;
  migratedAt: string; // ISO 8601
  cartItems: number;
  conversations: number;
  searches: number;
  success: boolean;
  errors?: string[];
}
