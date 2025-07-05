// ===========================================================================
// TRIGGERR API CONTRACTS - MAIN PACKAGE EXPORTS
//
// This file serves as the primary entry point for the @triggerr/api-contracts package.
// It provides both domain-driven namespace imports and individual exports for maximum flexibility.
//
// **RECOMMENDED USAGE (Domain-Driven Namespaces):**
//
// import { Insurance, Policy, Wallet, Chat, User } from '@triggerr/api-contracts';
//
// // Type usage
// const quote: Insurance.InsuranceQuoteRequest = { ... };
// const policy: Policy.PolicyPurchaseRequest = { ... };
// const wallet: Wallet.WalletCreateRequest = { ... };
//
// // Validation usage
// const isValidQuote = Insurance.validators.quoteRequest.safeParse(quote);
// const isValidPolicy = Policy.validators.cancelRequest.safeParse(policy);
//
// // Utility usage
// const formattedAmount = Wallet.utils.formatBalance(1000);
// const policyNumber = Policy.utils.generatePolicyNumber();
//
// ===========================================================================

// === API VERSIONING INFORMATION & STRATEGY ===
export * from "./schemas/versioning";

// === COMMON TYPES & UTILITIES (FOUNDATION) ===
export {
  type ApiResponse,
  type ApiError,
  type PaginatedResponse,
  type PaginationRequest,
  type PaginationResponse,
  type SearchRequest,
  type MoneyAmount,
  type Address,
  type GeoLocation,
  type DateRange,
  type Currency,
  type TimeZone,
  type FileUpload,
  type HealthCheckResponse,
  type ServiceHealthStatus,
  type RateLimitInfo,
  type RequestMetadata,
  type AuditLogEntry,
  type SystemConfig,
  type FeatureFlag,
  ErrorCode,
  type HttpMethod as HttpMethodType,
  type HttpStatusCode as HttpStatusCodeType,
  type ContentType as ContentTypeType,
  type ApiStatus as ApiStatusType,
  type Environment as EnvironmentType,
  type LogLevel as LogLevelType,
  isApiError,
  isApiSuccess,
  createApiError,
  createApiResponse,
  createPaginatedResponse,
  API_BASE_PATHS,
  PAGINATION_DEFAULTS,
  RATE_LIMIT_DEFAULTS,
  SUPPORTED_CURRENCIES,
} from "./dtos/common";

// === DOMAIN IMPORTS ===
import {
  InsuranceDomain,
  type InsuranceDomainNamespace,
} from "./domains/insurance";

import { PolicyDomain, type PolicyDomainNamespace } from "./domains/policy";

import { WalletDomain, type WalletDomainNamespace } from "./domains/wallet";

import { ChatDomain, type ChatDomainNamespace } from "./domains/chat";

import { UserDomain, type UserDomainNamespace } from "./domains/user";

// === DOMAIN NAMESPACE EXPORTS (RECOMMENDED) ===
export const Insurance = InsuranceDomain;
export const Policy = PolicyDomain;
export const Wallet = WalletDomain;
export const Chat = ChatDomain;
export const User = UserDomain;

// === INTERNAL DOMAIN EXPORTS ===
export * from "./domains/internal";

// === INSURANCE DOMAIN INDIVIDUAL EXPORTS (BACKWARD COMPATIBILITY) ===
export type {
  InsuranceQuoteRequest,
  InsuranceQuoteResponse,
  InsuranceProduct,
  InsuranceProductsResponse,
  InsuranceProductType,
  CoverageTier,
  PolicyPurchaseRequest,
  PolicyPurchaseResponse,
  PolicyTrackingRequest,
  PolicyTrackingResponse,
  AddToCartRequest,
  AddToCartResponse,
  FlightDetailsForQuote,
  CoverageRequest,
  PremiumBreakdown,
  FlightRiskAssessment,
  ProviderInfo,
  ClaimStatus,
  PaymentMethod,
  PayoutStructure,
  PayoutTier,
  CoverageTierDefinition,
  QuoteCoverage,
  PremiumComponent,
  PolicyCoverage,
  PaymentConfirmation,
  EscrowInfo,
  CustomerSummary,
  ClaimSummary,
  FlightStatus,
  ProductCategory,
  CartItem,
  AnonymousCartResponse,
  PassengerDetails,
  CustomerInfo,
  EmergencyContact,
  TravelPreferences,
  NotificationPreferences,
  CommunicationPreferences,
  PaymentDetails,
} from "./domains/insurance";

export {
  insuranceQuoteRequestSchema,
  insuranceQuoteResponseSchema,
  insuranceProductSchema,
  insuranceProductsResponseSchema,
  policyPurchaseRequestSchema,
  policyPurchaseResponseSchema,
  policyTrackingRequestSchema,
  policyTrackingResponseSchema,
  addToCartRequestSchema,
  addToCartResponseSchema,
  flightDetailsForQuoteSchema,
  coverageRequestSchema,
  premiumBreakdownSchema,
  flightRiskAssessmentSchema,
  providerInfoSchema,
  validateInsuranceQuoteRequest,
  validatePolicyPurchaseRequest,
  validatePolicyTrackingRequest,
  validateAddToCartRequest,
  safeValidateInsuranceQuoteRequest,
  safeValidatePolicyPurchaseRequest,
  insuranceProductTypeSchema,
  coverageTierSchema,
  claimStatusSchema,
  paymentMethodSchema,
  payoutTypeSchema,
  quoteCoverageSchema,
  passengerDetailsSchema,
  payoutTierSchema,
  payoutStructureSchema,
  premiumComponentSchema,
  insuranceProductsListRequestSchema,
} from "./domains/insurance";

// === POLICY DOMAIN INDIVIDUAL EXPORTS (BACKWARD COMPATIBILITY) ===
export type {
  PolicyStatus,
  AutomatedPayoutStatus,
  PolicyEventType,
  DocumentType,
  BeneficiaryType,
  EndorsementType,
  PolicyCoverageDetails,
  FlightPolicyDetails,
  Policy as PolicyType,
  PolicySummary,
  AutomatedPayoutRecord,
  PolicyEvent,
  PolicyDocument,
  Beneficiary,
  Endorsement,
  GetPolicyDetailsRequest,
  GetPolicyDetailsResponse,
  ListUserPoliciesRequest,
  ListUserPoliciesResponse,
  GetAutomatedPayoutRecordRequest,
  GetAutomatedPayoutRecordResponse,
  ListPolicyAutomatedPayoutsRequest,
  ListPolicyAutomatedPayoutsResponse,
  CancelPolicyRequest,
  CancelPolicyResponse,
  AddPolicyDocumentRequest,
  AddPolicyDocumentResponse,
  GetPolicyTimelineRequest,
  GetPolicyTimelineResponse,
  ManuallyReviewPayoutRequest,
  ManuallyReviewPayoutResponse,
} from "./domains/policy";

export {
  policySchema,
  policySummarySchema,
  policyEventSchema,
  policyDocumentSchema,
  policyCoverageDetailsSchema,
  flightPolicyDetailsSchema,
  automatedPayoutRecordSchema,
  getPolicyDetailsRequestSchema,
  getPolicyDetailsResponseSchema,
  listUserPoliciesRequestSchema,
  listUserPoliciesResponseSchema,
  getAutomatedPayoutRecordRequestSchema,
  getAutomatedPayoutRecordResponseSchema,
  listPolicyAutomatedPayoutsRequestSchema,
  listPolicyAutomatedPayoutsResponseSchema,
  cancelPolicyRequestSchema,
  cancelPolicyResponseSchema,
  addPolicyDocumentRequestSchema,
  addPolicyDocumentResponseSchema,
  getPolicyTimelineRequestSchema,
  getPolicyTimelineResponseSchema,
  manuallyReviewPayoutRequestSchema,
  manuallyReviewPayoutResponseSchema,
  automatedPayoutStatusSchema,
  policyEventTypeSchema,
  documentTypeSchema,
  policyStatusSchema,
  beneficiaryTypeSchema,
  endorsementTypeSchema,
  beneficiarySchema,
  endorsementSchema,
} from "./domains/policy";

// === WALLET DOMAIN INDIVIDUAL EXPORTS (BACKWARD COMPATIBILITY) ===
export type {
  WalletType,
  WalletStatus,
  TransactionType,
  TransactionStatus,
  UserStatus,
  UserWallet,
  UserWalletInfoResponse,
  WalletTransaction,
  EscrowSummary,
  PendingOperation,
  WalletSendRequest,
  WalletSendResponse,
  WalletReceiveRequest,
  WalletReceiveResponse,
  FaucetRequest,
  UserFaucetResponse,
  UserProfile,
  UserPreferences,
  AnonymousSession,
  AnonymousSessionData,
  UserSignupCompletionRequest,
  UserSignupCompletionResponse,
  UserProfileUpdateRequest,
  UserProfileUpdateResponse,
  UserPolicyListRequest,
  UserPolicyListResponse,
  UserDashboardRequest,
  UserDashboardResponse,
  TransactionHistoryRequest,
  TransactionHistoryResponse,
} from "./domains/wallet";

export {
  walletSendRequestSchema,
  walletSendResponseSchema,
  walletReceiveRequestSchema,
  walletReceiveResponseSchema,
  userWalletInfoResponseSchema,
  generateAnonymousWalletRequestSchema,
  linkExistingWalletRequestSchema,
  faucetRequestSchema,
  userFaucetResponseSchema,
  userWalletSchema,
  walletTransactionSchema,
  escrowSummarySchema,
  pendingOperationSchema,
  userProfileSchema,
  userPreferencesSchema,
  anonymousSessionSchema,
  anonymousSessionDataSchema,
  userSignupCompletionRequestSchema,
  userSignupCompletionResponseSchema,
  userProfileUpdateRequestSchema,
  userProfileUpdateResponseSchema,
  userPolicyListRequestSchema,
  userPolicyListResponseSchema,
  userDashboardRequestSchema,
  userDashboardResponseSchema,
  walletTypeSchema,
  walletStatusSchema,
  transactionTypeSchema,
  transactionStatusSchema,
  userStatusSchema,
  escrowCreateRequestSchema,
  transactionHistoryRequestSchema,
  transactionHistoryResponseSchema,
} from "./domains/wallet";

// === CHAT DOMAIN INDIVIDUAL EXPORTS (BACKWARD COMPATIBILITY) ===
export type {
  ChatMessageRole,
  ChatMessageContentType,
  ChatInterface,
  ChatMessage,
  ChatMessageRequest,
  ChatMessageResponse,
  ChatContext,
  FlightSearchContext,
  QuoteRequestContext,
  PolicyInquiryContext,
  ChatAction,
  Conversation,
  ConversationListRequest,
  ConversationListResponse,
  ConversationMessagesRequest,
  ConversationMessagesResponse,
  SyncAnonymousConversationRequest,
  SyncAnonymousConversationResponse,
  ChatInterfaceConfig,
} from "./domains/chat";

export {
  chatMessageRequestSchema,
  chatMessageSchema,
  chatMessageResponseSchema,
  conversationListRequestSchema,
  conversationListResponseSchema,
  conversationMessagesRequestSchema,
  conversationMessagesResponseSchema,
  syncAnonymousConversationRequestSchema,
  syncAnonymousConversationResponseSchema,
  chatContextSchema,
  chatActionSchema,
  conversationIdSchema,
  chatMessageRoleSchema,
  chatMessageContentTypeSchema,
  chatInterfaceSchema,
  conversationStatusSchema,
  conversationSchema,
  chatInterfaceConfigSchema,
} from "./domains/chat";

// === USER DOMAIN INDIVIDUAL EXPORTS (BACKWARD COMPATIBILITY) ===
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
} from "./domains/user";

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
} from "./domains/user";

// === COMBINED NAMESPACE EXPORTS FOR ADVANCED USAGE ===
export const Domains = {
  Insurance,
  Policy,
  Wallet,
  Chat,
  User,
} as const;

// === TYPE DEFINITIONS FOR NAMESPACE EXPORTS ===
export type DomainsNamespace = typeof Domains;

// Domain-specific namespace types
export type InsuranceNamespace = typeof Insurance;
export type PolicyNamespace = typeof Policy;
export type WalletNamespace = typeof Wallet;
export type ChatNamespace = typeof Chat;
export type UserNamespace = typeof User;

// === PACKAGE VERSION & BUILD INFO ===
export const API_CONTRACTS_PACKAGE_VERSION = "0.1.0";
export const API_CONTRACTS_BUILD_DATE = new Date().toISOString();

// === DEFAULT EXPORT FOR ES MODULE COMPATIBILITY ===
const apiContracts = {
  Insurance,
  Policy,
  Wallet,
  Chat,
  User,
  Domains,
  version: API_CONTRACTS_PACKAGE_VERSION,
  buildDate: API_CONTRACTS_BUILD_DATE,
};

export default apiContracts;
