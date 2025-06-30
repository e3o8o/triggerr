// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Standard API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId?: string;
  version?: string;
}

// API error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string; // For validation errors
  stack?: string; // Only in development
}

// Pagination request parameters
export interface PaginationRequest {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

// Pagination response metadata
export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated API response
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationResponse;
}

// ============================================================================
// HTTP TYPES
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export type HttpStatusCode =
  | 200 | 201 | 202 | 204  // Success
  | 400 | 401 | 403 | 404 | 409 | 422 | 429  // Client errors
  | 500 | 502 | 503 | 504;  // Server errors

// Request headers
export interface RequestHeaders {
  'Content-Type'?: string;
  'Authorization'?: string;
  'X-API-Key'?: string;
  'X-User-ID'?: string;
  'X-Anonymous-Session-ID'?: string;
  'X-Request-ID'?: string;
  'User-Agent'?: string;
  [key: string]: string | undefined;
}

// Response headers
export interface ResponseHeaders {
  'Content-Type'?: string;
  'X-Rate-Limit-Limit'?: string;
  'X-Rate-Limit-Remaining'?: string;
  'X-Rate-Limit-Reset'?: string;
  'X-Request-ID'?: string;
  [key: string]: string | undefined;
}

// ============================================================================
// API ENDPOINT TYPES
// ============================================================================

// API endpoint configuration
export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  version?: string;
  authenticated?: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  timeout?: number;
}

// API client configuration
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  defaultHeaders?: RequestHeaders;
  apiKey?: string;
}

// ============================================================================
// CHAT API TYPES
// ============================================================================

// Chat message types moved to chat-types.ts to avoid conflicts
// Use ChatMessageRequest and ChatMessageResponse from @triggerr/shared/types/chat-types

// ============================================================================
// INSURANCE API TYPES
// ============================================================================

// Quote request
export interface QuoteRequest {
  flightContext: {
    flightNumber?: string;
    origin?: string;
    destination?: string;
    date?: string;
  };
  insurancePreferences?: {
    coverageType?: string;
    delayThreshold?: number;
    maxPremium?: number;
  };
  passengerCount?: number;
}

// Quote response
export interface QuoteResponse {
  quoteId: string;
  provider: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  product: {
    id: string;
    name: string;
    description: string;
  };
  pricing: {
    premiumCents: number;
    coverageCents: number;
    fees: number;
    total: number;
  };
  coverage: {
    delayThreshold: number;
    maxPayout: number;
    terms: string[];
  };
  validUntil: string;
  riskFactors?: any[];
}

// Policy purchase request
export interface PolicyPurchaseRequest {
  quoteCartItemIds: string[];
  paymentMethod: {
    type: 'STRIPE_PAYMENT_METHOD_ID' | 'CUSTODIAL_WALLET';
    stripePaymentMethodId?: string;
  };
  policyholderDetails: {
    firstName: string;
    lastName: string;
    email: string;
  };
  agreeToTerms: boolean;
}

// Policy purchase response
export interface PolicyPurchaseResponse {
  policyId: string;
  policyNumber: string;
  status: 'PENDING' | 'ACTIVE' | 'FAILED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  coverageDetails: {
    effectiveFrom: string;
    effectiveTo: string;
    coverageAmount: number;
  };
  verificationCode?: string;
}

// ============================================================================
// USER API TYPES
// ============================================================================

// User signup completion request
export interface UserSignupCompletionRequest {
  username?: string;
  preferences?: Record<string, any>;
}

// User signup completion response
export interface UserSignupCompletionResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
    username?: string;
  };
  wallet?: {
    address: string;
    balance: number;
  };
}

// User profile response
export interface UserProfileResponse {
  id: string;
  email: string;
  name?: string;
  username?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// WALLET API TYPES
// ============================================================================

// Wallet info response
export interface WalletInfoResponse {
  address: string;
  balance: {
    amount: number;
    currency: string;
    formatted: string;
  };
  transactions?: {
    recent: WalletTransaction[];
    count: number;
  };
}

// Wallet transaction
export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  transactionHash?: string;
}

// Faucet request response
export interface FaucetResponse {
  success: boolean;
  amount: number;
  newBalance: number;
  transactionHash?: string;
  nextFaucetAvailable?: string;
}

// ============================================================================
// ADMIN API TYPES
// ============================================================================

// System health response
export interface SystemHealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  services: {
    database: 'UP' | 'DOWN';
    redis?: 'UP' | 'DOWN';
    paygo: 'UP' | 'DOWN';
    flightApis: 'UP' | 'DEGRADED' | 'DOWN';
  };
  version: string;
  uptime: number;
  timestamp: string;
}

// API metrics response
export interface ApiMetricsResponse {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  endpoints: {
    path: string;
    method: string;
    count: number;
    averageResponseTime: number;
    errorRate: number;
  }[];
  timeRange: {
    start: string;
    end: string;
  };
}

// ============================================================================
// WEBHOOK API TYPES
// ============================================================================

// Webhook payload base
export interface WebhookPayload {
  eventType: string;
  eventId: string;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
}

// Stripe webhook payload
export interface StripeWebhookPayload extends WebhookPayload {
  eventType: 'payment_intent.succeeded' | 'payment_intent.failed' | 'customer.created';
  data: {
    object: any;
  };
}

// PayGo webhook payload
export interface PayGoWebhookPayload extends WebhookPayload {
  eventType: 'ESCROW_FUNDED' | 'ESCROW_RELEASED' | 'TRANSACTION_CONFIRMED';
  data: {
    escrowId: string;
    transactionHash: string;
    amount: number;
    fromAddress: string;
    toAddress: string;
  };
}

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string;
  blocked: boolean;
}

// Rate limit exceeded error
export interface RateLimitError extends ApiError {
  code: 'RATE_LIMIT_EXCEEDED';
  rateLimitInfo: RateLimitInfo;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

// Validation error details
export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  field: string;
  value?: any;
  constraint?: string;
}

// Field validation result
export interface FieldValidation {
  field: string;
  valid: boolean;
  errors?: string[];
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

// File upload request
export interface FileUploadRequest {
  filename: string;
  contentType: string;
  size: number;
  purpose: 'POLICY_DOCUMENT' | 'PROFILE_IMAGE' | 'CLAIM_EVIDENCE';
}

// File upload response
export interface FileUploadResponse {
  fileId: string;
  uploadUrl: string;
  downloadUrl?: string;
  expiresAt: string;
}

// ============================================================================
// SEARCH API TYPES
// ============================================================================

// Search request
export interface SearchRequest {
  query: string;
  type?: 'FLIGHTS' | 'POLICIES' | 'PROVIDERS' | 'ALL';
  filters?: Record<string, any>;
  pagination?: PaginationRequest;
}

// Search result item
export interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  url?: string;
  metadata?: Record<string, any>;
  relevanceScore?: number;
}

// Search response
export interface SearchResponse extends PaginatedApiResponse<SearchResultItem> {
  query: string;
  totalResults: number;
  searchTime: number;
  suggestions?: string[];
}

// ============================================================================
// EXPORT UTILITY TYPES
// ============================================================================

// Generic API request type
export type ApiRequest<T = any> = T & {
  headers?: RequestHeaders;
  metadata?: Record<string, any>;
};

// Generic API success response
export type ApiSuccessResponse<T = any> = Omit<ApiResponse<T>, 'error'> & {
  success: true;
  data: T;
};

// Generic API error response
export type ApiErrorResponse = Omit<ApiResponse, 'data'> & {
  success: false;
  error: ApiError;
};

// API response union type
export type ApiResponseUnion<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;
