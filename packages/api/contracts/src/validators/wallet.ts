// ============================================================================
// WALLET API VALIDATORS (ZOD SCHEMAS)
// ============================================================================

import { z } from "zod";

// ============================================================================
// ENUMS & CONSTANTS (aligned with database schema)
// ============================================================================

export const walletTypeSchema = z.enum(["custodial", "external", "multisig"]);

export const walletStatusSchema = z.enum([
  "active",
  "inactive",
  "frozen",
  "pending_setup",
]);

export const transactionTypeSchema = z.enum([
  "deposit",
  "withdrawal",
  "escrow_fund",
  "escrow_release",
  "premium_payment",
  "claim_payout",
  "faucet_request",
  "transfer",
]);

export const transactionStatusSchema = z.enum([
  "pending",
  "confirmed",
  "failed",
  "cancelled",
]);

export const userStatusSchema = z.enum([
  "active",
  "inactive",
  "suspended",
  "pending_verification",
]);

export const userRoleSchema = z.enum([
  "customer",
  "provider",
  "admin",
  "support",
]);

export const kycStatusSchema = z.enum([
  "not_required",
  "pending",
  "approved",
  "rejected",
  "expired",
]);

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const walletBalanceSchema = z.object({
  total: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  locked: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  currency: z.string().length(3).default("USD"),
  lastUpdated: z.string().datetime(),
});

export const walletTransactionSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  type: transactionTypeSchema,
  amount: z.number().int().positive(),
  fee: z.number().int().nonnegative().optional(),
  status: transactionStatusSchema,
  fromAddress: z.string().optional(),
  toAddress: z.string().optional(),
  txHash: z.string().optional(),
  blockNumber: z.number().int().positive().optional(),
  confirmations: z.number().int().nonnegative().optional(),
  description: z.string().max(500),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  confirmedAt: z.string().datetime().optional(),
});

export const escrowSummarySchema = z.object({
  id: z.string().uuid(),
  internalId: z.string(),
  blockchainId: z.string(),
  type: z.enum(["POLICY", "USER"]),
  purpose: z.string().max(50).optional(),
  amount: z.number().int().positive(),
  status: z.enum(["created", "funded", "fulfilled", "released", "expired"]),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  relatedPolicy: z.string().uuid().optional(),
});

export const pendingOperationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    "transfer",
    "escrow_create",
    "escrow_fulfill",
    "faucet_request",
  ]),
  amount: z.number().int().positive().optional(),
  status: z.enum(["pending", "processing", "confirming"]),
  estimatedCompletion: z.string().datetime().optional(),
  description: z.string().max(200),
});

export const transactionLimitsSchema = z.object({
  dailyLimit: z.number().int().positive(),
  monthlyLimit: z.number().int().positive(),
  singleTransactionLimit: z.number().int().positive(),
  requireApprovalAbove: z.number().int().positive(),
});

export const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  push: z.boolean().default(true),
  inApp: z.boolean().default(true),
  flightUpdates: z.boolean().default(true),
  policyUpdates: z.boolean().default(true),
  claimUpdates: z.boolean().default(true),
  walletTransactions: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

export const communicationPreferencesSchema = z.object({
  language: z.string().length(2).default("en"),
  timezone: z.string().max(50).default("UTC"),
  preferredMethod: z.enum(["email", "sms", "push", "in_app"]).default("email"),
  frequency: z
    .enum(["immediate", "daily", "weekly", "monthly"])
    .default("immediate"),
});

export const privacyPreferencesSchema = z.object({
  profileVisibility: z
    .enum(["public", "private", "limited"])
    .default("private"),
  dataSharing: z.boolean().default(false),
  analyticsOptOut: z.boolean().default(false),
  marketingOptOut: z.boolean().default(false),
});

export const tradingPreferencesSchema = z.object({
  autoRenewal: z.boolean().default(false),
  riskTolerance: z.enum(["low", "medium", "high"]).default("medium"),
  preferredCurrency: z.string().length(3).default("USD"),
  transactionLimits: transactionLimitsSchema,
});

export const userPreferencesSchema = z.object({
  notifications: notificationPreferencesSchema,
  communications: communicationPreferencesSchema,
  privacy: privacyPreferencesSchema,
  trading: tradingPreferencesSchema,
});

// ============================================================================
// REQUEST VALIDATORS
// ============================================================================

export const walletSendRequestSchema = z
  .object({
    toAddress: z.string().min(1).max(100),
    amount: z.number().int().positive(),
    description: z.string().max(200).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strict();

export const walletReceiveRequestSchema = z
  .object({
    amount: z.number().int().positive().optional(),
    description: z.string().max(200).optional(),
    expiresAt: z.string().datetime().optional(),
  })
  .strict();

export const transactionHistoryRequestSchema = z
  .object({
    walletId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().nonnegative().default(0),
    type: transactionTypeSchema.optional(),
    status: transactionStatusSchema.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  })
  .strict();

export const faucetRequestSchema = z
  .object({
    amount: z.number().int().positive().optional(),
    reason: z.string().max(200).optional(),
  })
  .strict();

export const generateAnonymousWalletRequestSchema = z
  .object({
    chain: z.enum(["PAYGO", "SOLANA", "ETHEREUM", "BASE"]).optional(),
  })
  .strict();

export const linkExistingWalletRequestSchema = z
  .object({
    address: z.string().min(1),
    chain: z.enum(["PAYGO", "SOLANA", "ETHEREUM", "BASE"]),
    publicKey: z.string().optional(),
  })
  .strict();

export const userSignupCompletionRequestSchema = z
  .object({
    completeProfile: z.boolean().default(false),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Terms must be accepted",
    }),
    preferences: userPreferencesSchema.partial().optional(),
  })
  .strict();

export const userProfileUpdateRequestSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).optional(),
    avatar: z.string().url().optional(),
    preferences: userPreferencesSchema.partial().optional(),
  })
  .strict();

export const userPolicyListRequestSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(10),
    offset: z.number().int().nonnegative().default(0),
    status: z
      .enum(["pending", "active", "expired", "claimed", "cancelled"])
      .optional(),
    productType: z
      .enum([
        "flight_delay",
        "flight_cancellation",
        "baggage_delay",
        "weather_disruption",
        "travel_comprehensive",
      ])
      .optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  })
  .strict();

export const userDashboardRequestSchema = z
  .object({
    includeRecentActivity: z.boolean().default(true),
    includePolicySummary: z.boolean().default(true),
    includeWalletSummary: z.boolean().default(true),
    activityLimit: z.number().int().min(1).max(50).default(10),
  })
  .strict();

// ============================================================================
// RESPONSE VALIDATORS
// ============================================================================

export const userWalletSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  address: z.string().min(1).max(100),
  walletName: z.string().min(1).max(100),
  walletType: walletTypeSchema,
  status: walletStatusSchema,
  isPrimary: z.boolean(),
  balance: walletBalanceSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastActivity: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

export const userWalletInfoResponseSchema = z.object({
  wallet: userWalletSchema,
  recentTransactions: z.array(walletTransactionSchema).max(20),
  activeEscrows: z.array(escrowSummarySchema).max(50),
  pendingOperations: z.array(pendingOperationSchema).max(20),
});

export const walletSendResponseSchema = z.object({
  transactionId: z.string().uuid(),
  txHash: z.string(),
  status: transactionStatusSchema,
  amount: z.number().int().positive(),
  fee: z.number().int().nonnegative(),
  estimatedConfirmation: z.string().datetime().optional(),
  message: z.string().max(200),
});

export const walletReceiveResponseSchema = z.object({
  address: z.string(),
  qrCode: z.string().optional(), // Base64 encoded
  amount: z.number().int().positive().optional(),
  description: z.string().max(200).optional(),
  expiresAt: z.string().datetime().optional(),
  paymentUrl: z.string().url().optional(),
});

export const transactionSummarySchema = z.object({
  totalIn: z.number().int().nonnegative(),
  totalOut: z.number().int().nonnegative(),
  totalFees: z.number().int().nonnegative(),
  transactionCount: z.number().int().nonnegative(),
  period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
});

export const transactionHistoryResponseSchema = z.object({
  transactions: z.array(walletTransactionSchema),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  pagination: z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
  }),
  summary: transactionSummarySchema,
});

export const userFaucetResponseSchema = z.object({
  success: z.boolean(),
  amount: z.number().int().nonnegative(),
  txHash: z.string().optional(),
  newBalance: z.number().int().nonnegative(),
  message: z.string().max(200),
  nextRequestAt: z.string().datetime().optional(),
});

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().max(100).optional(),
  avatar: z.string().url().optional(),
  phone: z.string().max(20).optional(),
  status: userStatusSchema,
  role: userRoleSchema,
  kycStatus: kycStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional(),
  preferences: userPreferencesSchema,
  metadata: z.record(z.any()).optional(),
});

export const userSignupCompletionResponseSchema = z.object({
  user: userProfileSchema,
  wallet: userWalletSchema,
  message: z.string().max(200),
  nextSteps: z.array(z.string().max(100)).max(10),
});

export const userProfileUpdateResponseSchema = z.object({
  user: userProfileSchema,
  message: z.string().max(200),
  updatedFields: z.array(z.string().max(50)).max(20),
});

export const userPolicySummarySchema = z.object({
  id: z.string().uuid(),
  policyNumber: z.string().max(50),
  productType: z.enum([
    "flight_delay",
    "flight_cancellation",
    "baggage_delay",
    "weather_disruption",
    "travel_comprehensive",
  ]),
  status: z.enum(["pending", "active", "expired", "claimed", "cancelled"]),
  coverageAmount: z.number().int().positive(),
  premium: z.number().int().positive(),
  flightNumber: z.string().max(10).optional(),
  departureDate: z.string().datetime().optional(),
  expiresAt: z.string().datetime(),
  purchasedAt: z.string().datetime(),
  provider: z.object({
    id: z.string().uuid(),
    name: z.string().max(100),
    displayName: z.string().max(100),
  }),
});

export const userPolicyListResponseSchema = z.object({
  policies: z.array(userPolicySummarySchema),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  pagination: z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
  }),
  summary: z.object({
    activePolicies: z.number().int().nonnegative(),
    totalCoverage: z.number().int().nonnegative(),
    upcomingExpirations: z.number().int().nonnegative(),
    recentClaims: z.number().int().nonnegative(),
    totalPremiumsPaid: z.number().int().nonnegative(),
  }),
});

export const activityItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    "policy_purchased",
    "claim_filed",
    "payment_received",
    "wallet_transaction",
    "flight_update",
  ]),
  title: z.string().max(100),
  description: z.string().max(500),
  timestamp: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
  actionUrl: z.string().url().optional(),
});

export const userNotificationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["info", "warning", "success", "error"]),
  title: z.string().max(100),
  message: z.string().max(500),
  read: z.boolean(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().max(50).optional(),
});

export const quickActionSchema = z.object({
  id: z.string(),
  label: z.string().max(50),
  description: z.string().max(200),
  icon: z.string().optional(),
  url: z.string().url(),
  category: z.enum(["policy", "wallet", "account", "support"]),
});

export const userDashboardResponseSchema = z.object({
  user: userProfileSchema,
  walletSummary: z.object({
    totalBalance: z.number().int().nonnegative(),
    availableBalance: z.number().int().nonnegative(),
    lockedBalance: z.number().int().nonnegative(),
    recentTransactionCount: z.number().int().nonnegative(),
    activeEscrowCount: z.number().int().nonnegative(),
  }),
  policySummary: z.object({
    activePolicies: z.number().int().nonnegative(),
    totalCoverage: z.number().int().nonnegative(),
    upcomingExpirations: z.number().int().nonnegative(),
    recentClaims: z.number().int().nonnegative(),
    totalPremiumsPaid: z.number().int().nonnegative(),
  }),
  recentActivity: z.array(activityItemSchema).max(50),
  notifications: z.array(userNotificationSchema).max(20),
  quickActions: z.array(quickActionSchema).max(10),
});

export const anonymousSessionDataSchema = z.object({
  cartItems: z.array(z.string().uuid()).max(50),
  conversationIds: z.array(z.string().uuid()).max(100),
  preferences: userPreferencesSchema.partial().optional(),
  flightSearches: z
    .array(
      z.object({
        id: z.string().uuid(),
        origin: z.string().length(3),
        destination: z.string().length(3),
        departureDate: z.string().datetime(),
        searchedAt: z.string().datetime(),
        results: z.number().int().nonnegative().optional(),
      }),
    )
    .max(20)
    .optional(),
  metadata: z.record(z.any()).optional(),
});

export const anonymousSessionSchema = z.object({
  sessionId: z.string().min(1).max(255),
  createdAt: z.string().datetime(),
  lastActivity: z.string().datetime(),
  expiresAt: z.string().datetime(),
  data: anonymousSessionDataSchema,
});

export const anonymousDataMigrationSummarySchema = z.object({
  sessionId: z.string(),
  userId: z.string().uuid(),
  migratedAt: z.string().datetime(),
  cartItems: z.number().int().nonnegative(),
  conversations: z.number().int().nonnegative(),
  searches: z.number().int().nonnegative(),
  success: z.boolean(),
  errors: z.array(z.string().max(200)).optional(),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateWalletSendRequest(data: unknown) {
  return walletSendRequestSchema.parse(data);
}

export function validateWalletReceiveRequest(data: unknown) {
  return walletReceiveRequestSchema.parse(data);
}

export function validateTransactionHistoryRequest(data: unknown) {
  return transactionHistoryRequestSchema.parse(data);
}

export function validateFaucetRequest(data: unknown) {
  return faucetRequestSchema.parse(data);
}

export function validateUserSignupCompletionRequest(data: unknown) {
  return userSignupCompletionRequestSchema.parse(data);
}

export function validateUserProfileUpdateRequest(data: unknown) {
  return userProfileUpdateRequestSchema.parse(data);
}

export function validateUserPolicyListRequest(data: unknown) {
  return userPolicyListRequestSchema.parse(data);
}

export function validateUserDashboardRequest(data: unknown) {
  return userDashboardRequestSchema.parse(data);
}

export function safeValidateWalletSendRequest(data: unknown) {
  const result = walletSendRequestSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.issues,
  };
}

export function safeValidateTransactionHistoryRequest(data: unknown) {
  const result = transactionHistoryRequestSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.issues,
  };
}

export function safeValidateUserProfileUpdateRequest(data: unknown) {
  const result = userProfileUpdateRequestSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.issues,
  };
}

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type WalletSendRequest = z.infer<typeof walletSendRequestSchema>;
export type WalletSendResponse = z.infer<typeof walletSendResponseSchema>;
export type WalletReceiveRequest = z.infer<typeof walletReceiveRequestSchema>;
export type WalletReceiveResponse = z.infer<typeof walletReceiveResponseSchema>;
export type TransactionHistoryRequest = z.infer<
  typeof transactionHistoryRequestSchema
>;
export type TransactionHistoryResponse = z.infer<
  typeof transactionHistoryResponseSchema
>;
export type UserFaucetResponse = z.infer<typeof userFaucetResponseSchema>;
export type UserWallet = z.infer<typeof userWalletSchema>;
export type UserWalletInfoResponse = z.infer<
  typeof userWalletInfoResponseSchema
>;
export type WalletTransaction = z.infer<typeof walletTransactionSchema>;
export type WalletBalance = z.infer<typeof walletBalanceSchema>;
export type EscrowSummary = z.infer<typeof escrowSummarySchema>;
export type PendingOperation = z.infer<typeof pendingOperationSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UserSignupCompletionRequest = z.infer<
  typeof userSignupCompletionRequestSchema
>;
export type UserSignupCompletionResponse = z.infer<
  typeof userSignupCompletionResponseSchema
>;
export type UserProfileUpdateRequest = z.infer<
  typeof userProfileUpdateRequestSchema
>;
export type UserProfileUpdateResponse = z.infer<
  typeof userProfileUpdateResponseSchema
>;
export type UserPolicyListRequest = z.infer<typeof userPolicyListRequestSchema>;
export type UserPolicyListResponse = z.infer<
  typeof userPolicyListResponseSchema
>;
export type UserDashboardRequest = z.infer<typeof userDashboardRequestSchema>;
export type UserDashboardResponse = z.infer<typeof userDashboardResponseSchema>;
export type AnonymousSession = z.infer<typeof anonymousSessionSchema>;
export type AnonymousSessionData = z.infer<typeof anonymousSessionDataSchema>;
export type AnonymousDataMigrationSummary = z.infer<
  typeof anonymousDataMigrationSummarySchema
>;

// Enum type exports
export type WalletType = z.infer<typeof walletTypeSchema>;
export type WalletStatus = z.infer<typeof walletStatusSchema>;
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type KYCStatus = z.infer<typeof kycStatusSchema>;

export const escrowCreateRequestSchema = z.object({
  recipientAddress: z
    .string()
    .refine((val) => /^0x[a-fA-F0-9]{40}$/.test(val), {
      message: "Recipient address must be a valid Ethereum-style address.",
    }),
  amount: z.string().refine((val) => /^\d+$/.test(val), {
    message: "Amount must be a string representing a positive integer.",
  }),
  expirationInMinutes: z.number().int().positive({
    message:
      "Expiration must be a positive integer representing minutes from now.",
  }),
  purpose: z.enum([
    "DEPOSIT",
    "WITHDRAW",
    "STAKE",
    "BOND",
    "COLLATERAL",
    "INVESTMENT",
    "RESERVE",
    "POOL",
    "CUSTOM",
  ]),
});
