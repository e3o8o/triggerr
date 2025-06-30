// ============================================================================
// COMMON API TYPES & UTILITIES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string; // ISO 8601
  requestId: string;
  version: string;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string; // For validation errors
  stack?: string; // Only in development
}

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_SESSION = 'INVALID_SESSION',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Business Logic
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',
  POLICY_NOT_FOUND = 'POLICY_NOT_FOUND',
  ESCROW_CREATION_FAILED = 'ESCROW_CREATION_FAILED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // External Services
  FLIGHT_DATA_UNAVAILABLE = 'FLIGHT_DATA_UNAVAILABLE',
  PAYGO_SERVICE_ERROR = 'PAYGO_SERVICE_ERROR',
  WEATHER_SERVICE_ERROR = 'WEATHER_SERVICE_ERROR',

  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',

  // Resource
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  RESOURCE_EXPIRED = 'RESOURCE_EXPIRED'
}

/**
 * Pagination request parameters
 */
export interface PaginationRequest {
  limit?: number; // Default: 10, Max: 100
  offset?: number; // Default: 0
  cursor?: string; // For cursor-based pagination
}

/**
 * Pagination response metadata
 */
export interface PaginationResponse {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationResponse;
}

/**
 * Sort options
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter options
 */
export interface FilterOptions {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

/**
 * Search and filter request
 */
export interface SearchRequest extends PaginationRequest {
  query?: string;
  filters?: FilterOptions[];
  sort?: SortOptions[];
}

/**
 * API versioning information
 */
export interface ApiVersion {
  version: string; // e.g., "1.0.0"
  major: number;
  minor: number;
  patch: number;
  deprecated?: boolean;
  deprecationDate?: string; // ISO 8601
  sunsetDate?: string; // ISO 8601
}

/**
 * API health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string; // ISO 8601
  uptime: number; // seconds
  dependencies: ServiceHealthStatus[];
  metadata?: Record<string, any>;
}

/**
 * Service health status
 */
export interface ServiceHealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime?: number; // milliseconds
  lastChecked: string; // ISO 8601
  error?: string;
}

/**
 * Rate limiting information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string; // ISO 8601
  retryAfter?: number; // seconds
}

/**
 * API request metadata
 */
export interface RequestMetadata {
  requestId: string;
  timestamp: string; // ISO 8601
  userAgent?: string;
  clientIp?: string;
  sessionId?: string; // Anonymous session ID if not authenticated
  userId?: string; // If authenticated
  version: string;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string; // ISO 8601
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Geographic location
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
  altitude?: number; // meters
  heading?: number; // degrees
  speed?: number; // m/s
  timestamp?: string; // ISO 8601
}

/**
 * Address information
 */
export interface Address {
  street?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  countryCode: string; // ISO 3166-1 alpha-2
  formatted?: string;
  location?: GeoLocation;
}

/**
 * Currency information
 */
export interface Currency {
  code: string; // ISO 4217
  symbol: string;
  name: string;
  decimals: number;
}

/**
 * Money amount (always in cents to avoid floating point issues)
 */
export interface MoneyAmount {
  amount: number; // in cents
  currency: Currency;
  formatted?: string; // Human readable format
}

/**
 * Date range
 */
export interface DateRange {
  from: string; // ISO 8601
  to: string; // ISO 8601
}

/**
 * Time zone information
 */
export interface TimeZone {
  id: string; // IANA timezone ID
  name: string;
  abbreviation: string;
  offset: number; // minutes from UTC
  dst: boolean;
}

/**
 * File upload information
 */
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // bytes
  url: string;
  uploadedAt: string; // ISO 8601
  expiresAt?: string; // ISO 8601
  metadata?: Record<string, any>;
}

/**
 * Bulk operation request
 */
export interface BulkOperationRequest<T> {
  operations: BulkOperation<T>[];
  stopOnError?: boolean;
  batchSize?: number;
}

/**
 * Bulk operation
 */
export interface BulkOperation<T> {
  operation: 'create' | 'update' | 'delete';
  id?: string; // Required for update/delete
  data?: T; // Required for create/update
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse<T> {
  success: boolean;
  results: BulkOperationResult<T>[];
  summary: BulkOperationSummary;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  operation: BulkOperation<T>;
}

/**
 * Bulk operation summary
 */
export interface BulkOperationSummary {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  processingTime: number; // milliseconds
}

/**
 * Webhook payload
 */
export interface WebhookPayload<T = any> {
  id: string;
  event: string;
  data: T;
  timestamp: string; // ISO 8601
  signature: string;
  version: string;
  retryCount?: number;
}

/**
 * System configuration
 */
export interface SystemConfig {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description?: string;
  category?: string;
  isSecret: boolean;
  updatedAt: string; // ISO 8601
  updatedBy?: string;
}

/**
 * Feature flag
 */
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: FeatureFlagCondition[];
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Feature flag condition
 */
export interface FeatureFlagCondition {
  type: 'user' | 'session' | 'geo' | 'custom';
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'contains';
  value: any;
}

/**
 * Cache information
 */
export interface CacheInfo {
  key: string;
  ttl: number; // seconds
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  hitCount?: number;
  lastAccessed?: string; // ISO 8601
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  requestDuration: number; // milliseconds
  dbQueryTime?: number; // milliseconds
  externalServiceTime?: number; // milliseconds
  cacheHit?: boolean;
  memoryUsage?: number; // bytes
  cpuUsage?: number; // percentage
}

/**
 * API status
 */
export type ApiStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Log levels
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Common HTTP status codes
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

/**
 * Content types
 */
export enum ContentType {
  JSON = 'application/json',
  XML = 'application/xml',
  HTML = 'text/html',
  PLAIN = 'text/plain',
  CSV = 'text/csv',
  PDF = 'application/pdf',
  BINARY = 'application/octet-stream'
}

/**
 * API method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/**
 * API endpoint definition
 */
export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  description: string;
  tags: string[];
  deprecated?: boolean;
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
  authentication: 'none' | 'optional' | 'required';
}

/**
 * Validation rule
 */
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'url';
  min?: number;
  max?: number;
  pattern?: string; // regex
  enum?: any[];
  custom?: string; // custom validation function name
}

/**
 * API documentation section
 */
export interface ApiDocumentationSection {
  id: string;
  title: string;
  content: string;
  order: number;
  subsections?: ApiDocumentationSection[];
  examples?: ApiExample[];
}

/**
 * API example
 */
export interface ApiExample {
  title: string;
  description?: string;
  request?: any;
  response?: any;
  code?: string;
  language?: string;
}

// ============================================================================
// COMMON CONSTANTS
// ============================================================================

/**
 * Default pagination limits
 */
export const PAGINATION_DEFAULTS = {
  LIMIT: 10,
  MAX_LIMIT: 100,
  OFFSET: 0,
} as const;

/**
 * Rate limiting defaults
 */
export const RATE_LIMIT_DEFAULTS = {
  DEFAULT_REQUESTS: 100,
  DEFAULT_WINDOW: 60, // seconds
  BURST_REQUESTS: 20,
  BURST_WINDOW: 1, // seconds
} as const;

/**
 * API endpoint base paths
 */
export const API_BASE_PATHS = {
  V1: '/api/v1',
  USER: '/api/v1/user',
  ADMIN: '/api/v1/admin', // Added for admin-specific endpoints
  INTERNAL: '/api/v1/internal',
  B2B: '/api/v1/b2b',
  WEBHOOKS: '/api/v1/webhooks',
} as const;

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
  },
  // Add other currencies as needed, e.g., EUR, GBP
  // Ensure PayGo also supports these if used for payouts
} as const;

/**
 * Chat interface types (consistent with ChatInterface type in dtos/chat.ts)
 */
export const CHAT_INTERFACES = ['web', 'api', 'cli', 'terminal'] as const;

/**
 * Insurance product types (consistent with InsuranceProductType in dtos/insurance.ts)
 */
export const INSURANCE_PRODUCT_TYPES = [
  'flight_delay',
  'flight_cancellation',
  'baggage_delay',
  'weather_disruption',
  'travel_comprehensive',
] as const;

/**
 * Wallet types (consistent with WalletType in dtos/wallet.ts)
 */
export const WALLET_TYPES = ['custodial', 'external', 'multisig'] as const;

/**
 * Transaction types (consistent with TransactionType in dtos/wallet.ts)
 */
export const TRANSACTION_TYPES = [
  'deposit',
  'withdrawal',
  'escrow_fund',
  'escrow_release',
  'premium_payment',
  'claim_payout', // Note: For parametric, this would be 'automated_payout'
  'faucet_request',
  'transfer',
] as const;

// Consider renaming 'claim_payout' to 'automated_payout' in TRANSACTION_TYPES
// if 'claim_payout' is misleading for parametric system.
// For now, keeping as per previous definitions.

// ============================================================================
// API RESPONSE UTILITY FUNCTIONS
// ============================================================================

/**
 * Type guard to check if a response is an error response
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: false; error: ApiError } {
  return !response.success && !!response.error;
}

/**
 * Type guard to check if a response is a successful response
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success && !!response.data;
}

/**
 * Create a standardized API error response
 */
export function createApiError(
  code: string, // Should ideally be ErrorCode type but causes circular dependency if ErrorCode is Zod enum
  message: string,
  details?: Record<string, any>,
  field?: string,
  requestId?: string,
  version?: string
): ApiResponse<never> { // Ensure the data part is never for an error
  const errorObject: ApiError = { code, message };
  if (details) errorObject.details = details;
  if (field) errorObject.field = field;

  return {
    success: false,
    error: errorObject,
    timestamp: new Date().toISOString(),
    requestId: requestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'unknown-request-id'),
    version: version || '1.0.0', // Default version
  };
}

/**
 * Create a standardized API success response
 */
export function createApiResponse<T>(
  data: T,
  message?: string,
  requestId?: string,
  version?: string
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: requestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'unknown-request-id'),
    version: version || '1.0.0', // Default version
  };
  if (message) response.message = message;
  return response;
}

/**
 * Create a standardized paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationResponse,
  message?: string,
  requestId?: string,
  version?: string
): PaginatedResponse<T> {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString(),
    requestId: requestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'unknown-request-id'),
    version: version || '1.0.0', // Default version
  };
  if (message) response.message = message;
  return response;
}
