// ============================================================================
// COMMON API VALIDATORS (ZOD SCHEMAS)
// ============================================================================

import { z } from "zod";

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const errorCodeSchema = z.enum([
  // Authentication & Authorization
  "UNAUTHORIZED",
  "FORBIDDEN",
  "TOKEN_EXPIRED",
  "INVALID_SESSION",

  // Validation
  "VALIDATION_ERROR",
  "INVALID_INPUT",
  "MISSING_REQUIRED_FIELD",
  "INVALID_FORMAT",

  // Business Logic
  "INSUFFICIENT_FUNDS",
  "QUOTE_EXPIRED",
  "POLICY_NOT_FOUND",
  "ESCROW_CREATION_FAILED",
  "PAYMENT_FAILED",

  // External Services
  "FLIGHT_DATA_UNAVAILABLE",
  "PAYGO_SERVICE_ERROR",
  "WEATHER_SERVICE_ERROR",

  // System
  "INTERNAL_SERVER_ERROR",
  "SERVICE_UNAVAILABLE",
  "RATE_LIMIT_EXCEEDED",
  "MAINTENANCE_MODE",

  // Resource
  "NOT_FOUND",
  "ALREADY_EXISTS",
  "RESOURCE_LOCKED",
  "RESOURCE_EXPIRED",
]);

export const httpStatusCodeSchema = z.enum([
  "200",
  "201",
  "202",
  "204",
  "400",
  "401",
  "403",
  "404",
  "405",
  "409",
  "422",
  "429",
  "500",
  "502",
  "503",
  "504",
]);

export const contentTypeSchema = z.enum([
  "application/json",
  "application/xml",
  "text/html",
  "text/plain",
  "text/csv",
  "application/pdf",
  "application/octet-stream",
]);

export const httpMethodSchema = z.enum([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
]);

export const apiStatusSchema = z.enum([
  "operational",
  "degraded",
  "partial_outage",
  "major_outage",
  "maintenance",
]);

export const environmentSchema = z.enum([
  "development",
  "staging",
  "production",
  "test",
]);

export const logLevelSchema = z.enum([
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
]);

export const policyStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "AWAITING_ACTIVATION",
  "ACTIVE_MONITORING",
  "EVENT_TRIGGERED",
  "PAYOUT_PROCESSING",
  "PAYOUT_COMPLETED",
  "PAYOUT_FAILED",
  "EXPIRED_NO_EVENT",
  "CANCELLED_USER",
  "CANCELLED_SYSTEM",
  "REFUNDED",
]);

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const apiErrorSchema = z.object({
  code: errorCodeSchema,
  message: z.string().min(1).max(500),
  details: z.record(z.any()).optional(),
  field: z.string().max(100).optional(),
  stack: z.string().optional(), // Only in development
});

export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: apiErrorSchema.optional(),
  message: z.string().max(500).optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
});

export const paginationRequestSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(10),
    offset: z.number().int().nonnegative().default(0),
    cursor: z.string().optional(),
  })
  .strict();

export const paginationResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
  prevCursor: z.string().optional(),
});

export const sortOptionsSchema = z.object({
  field: z.string().min(1).max(50),
  direction: z.enum(["asc", "desc"]),
});

export const filterOptionsSchema = z.object({
  field: z.string().min(1).max(50),
  operator: z.enum([
    "eq",
    "ne",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "nin",
    "contains",
    "startsWith",
    "endsWith",
  ]),
  value: z.any(),
});

export const searchRequestSchema = paginationRequestSchema.extend({
  query: z.string().max(200).optional(),
  filters: z.array(filterOptionsSchema).max(20).optional(),
  sort: z.array(sortOptionsSchema).max(5).optional(),
});

export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()).optional(),
  error: apiErrorSchema.optional(),
  message: z.string().max(500).optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  pagination: paginationResponseSchema,
});

export const apiVersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  major: z.number().int().nonnegative(),
  minor: z.number().int().nonnegative(),
  patch: z.number().int().nonnegative(),
  deprecated: z.boolean().default(false),
  deprecationDate: z.string().datetime().optional(),
  sunsetDate: z.string().datetime().optional(),
});

export const serviceHealthStatusSchema = z.object({
  name: z.string().min(1).max(100),
  status: z.enum(["healthy", "degraded", "unhealthy", "unknown"]),
  responseTime: z.number().int().nonnegative().optional(),
  lastChecked: z.string().datetime(),
  error: z.string().max(500).optional(),
});

export const healthCheckResponseSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  timestamp: z.string().datetime(),
  uptime: z.number().int().nonnegative(),
  dependencies: z.array(serviceHealthStatusSchema).max(50),
  metadata: z.record(z.any()).optional(),
});

export const rateLimitInfoSchema = z.object({
  limit: z.number().int().positive(),
  remaining: z.number().int().nonnegative(),
  resetTime: z.string().datetime(),
  retryAfter: z.number().int().nonnegative().optional(),
});

export const requestMetadataSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.string().datetime(),
  userAgent: z.string().max(500).optional(),
  clientIp: z.string().ip().optional(),
  sessionId: z.string().max(255).optional(),
  userId: z.string().uuid().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
});

export const auditLogEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().max(255).optional(),
  action: z.string().min(1).max(100),
  resource: z.string().min(1).max(100),
  resourceId: z.string().max(100).optional(),
  timestamp: z.string().datetime(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().max(500).optional(),
  success: z.boolean(),
  error: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

export const geoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
  altitude: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
  timestamp: z.string().datetime().optional(),
});

export const addressSchema = z.object({
  street: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  country: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  countryCode: z.string().length(2),
  formatted: z.string().max(500).optional(),
  location: geoLocationSchema.optional(),
});

export const currencySchema = z.object({
  code: z.string().length(3),
  symbol: z.string().min(1).max(5),
  name: z.string().min(1).max(100),
  decimals: z.number().int().min(0).max(8),
});

export const moneyAmountSchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: currencySchema,
  formatted: z.string().max(50).optional(),
});

export const dateRangeSchema = z
  .object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  })
  .refine((data) => new Date(data.from) <= new Date(data.to), {
    message: "From date must be before or equal to to date",
    path: ["from"],
  });

export const timeZoneSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  abbreviation: z.string().min(1).max(10),
  offset: z
    .number()
    .int()
    .min(-12 * 60)
    .max(14 * 60),
  dst: z.boolean(),
});

export const fileUploadSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024), // 100MB max
  url: z.string().url(),
  uploadedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

export const bulkOperationSchema = z.object({
  operation: z.enum(["create", "update", "delete"]),
  id: z.string().optional(),
  data: z.any().optional(),
});

export const bulkOperationRequestSchema = z.object({
  operations: z.array(bulkOperationSchema).min(1).max(1000),
  stopOnError: z.boolean().default(true),
  batchSize: z.number().int().min(1).max(100).default(10),
});

export const bulkOperationResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: apiErrorSchema.optional(),
  operation: bulkOperationSchema,
});

export const bulkOperationSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  successful: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  processingTime: z.number().int().nonnegative(),
});

export const bulkOperationResponseSchema = z.object({
  success: z.boolean(),
  results: z.array(bulkOperationResultSchema),
  summary: bulkOperationSummarySchema,
});

export const webhookPayloadSchema = z.object({
  id: z.string().uuid(),
  event: z.string().min(1).max(100),
  data: z.any(),
  timestamp: z.string().datetime(),
  signature: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  retryCount: z.number().int().nonnegative().optional(),
});

export const systemConfigSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(),
  type: z.enum(["string", "number", "boolean", "json", "array"]),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  isSecret: z.boolean(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().max(100).optional(),
});

export const featureFlagConditionSchema = z.object({
  type: z.enum(["user", "session", "geo", "custom"]),
  operator: z.enum(["eq", "ne", "in", "nin", "contains"]),
  value: z.any(),
});

export const featureFlagSchema = z.object({
  key: z.string().min(1).max(100),
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  conditions: z.array(featureFlagConditionSchema).max(20).optional(),
  description: z.string().max(500).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const cacheInfoSchema = z.object({
  key: z.string().min(1).max(255),
  ttl: z.number().int().positive(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  hitCount: z.number().int().nonnegative().optional(),
  lastAccessed: z.string().datetime().optional(),
});

export const performanceMetricsSchema = z.object({
  requestDuration: z.number().nonnegative(),
  dbQueryTime: z.number().nonnegative().optional(),
  externalServiceTime: z.number().nonnegative().optional(),
  cacheHit: z.boolean().optional(),
  memoryUsage: z.number().int().nonnegative().optional(),
  cpuUsage: z.number().min(0).max(100).optional(),
});

export const apiEndpointSchema = z.object({
  path: z.string().min(1).max(200),
  method: httpMethodSchema,
  description: z.string().min(1).max(500),
  tags: z.array(z.string().max(50)).max(20),
  deprecated: z.boolean().default(false),
  rateLimit: z
    .object({
      requests: z.number().int().positive(),
      window: z.number().int().positive(),
    })
    .optional(),
  authentication: z.enum(["none", "optional", "required"]),
});

export const validationRuleSchema = z.object({
  field: z.string().min(1).max(100),
  required: z.boolean().optional(),
  type: z
    .enum([
      "string",
      "number",
      "boolean",
      "array",
      "object",
      "date",
      "email",
      "url",
    ])
    .optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  enum: z.array(z.any()).optional(),
  custom: z.string().max(100).optional(),
});

export const apiExampleSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  request: z.any().optional(),
  response: z.any().optional(),
  code: z.string().optional(),
  language: z.string().max(20).optional(),
});

export const apiDocumentationSectionSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  order: z.number().int().nonnegative(),
  subsections: z.array(z.any()).max(50).optional(),
  examples: z.array(apiExampleSchema).max(20).optional(),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validatePaginationRequest(data: unknown) {
  return paginationRequestSchema.parse(data);
}

export function validateSearchRequest(data: unknown) {
  return searchRequestSchema.parse(data);
}

export function validateApiResponse(data: unknown) {
  return apiResponseSchema.parse(data);
}

export function validateHealthCheckResponse(data: unknown) {
  return healthCheckResponseSchema.parse(data);
}

export function validateBulkOperationRequest(data: unknown) {
  return bulkOperationRequestSchema.parse(data);
}

export function validateWebhookPayload(data: unknown) {
  return webhookPayloadSchema.parse(data);
}

export function safeValidatePaginationRequest(data: unknown) {
  const result = paginationRequestSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.issues,
  };
}

export function safeValidateSearchRequest(data: unknown) {
  const result = searchRequestSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.issues,
  };
}

export function safeValidateApiResponse(data: unknown) {
  const result = apiResponseSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.issues,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a success API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string,
): z.infer<typeof apiResponseSchema> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId: requestId || crypto.randomUUID(),
    version: "1.0.0",
  };
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  code: z.infer<typeof errorCodeSchema>,
  message: string,
  details?: Record<string, any>,
  field?: string,
  requestId?: string,
): z.infer<typeof apiResponseSchema> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      field,
    },
    timestamp: new Date().toISOString(),
    requestId: requestId || crypto.randomUUID(),
    version: "1.0.0",
  };
}

/**
 * Create pagination metadata
 */
export function createPaginationResponse(
  total: number,
  limit: number,
  offset: number,
  nextCursor?: string,
  prevCursor?: string,
): z.infer<typeof paginationResponseSchema> {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
    nextCursor,
    prevCursor,
  };
}

/**
 * Validate and sanitize pagination parameters
 */
export function sanitizePaginationParams(params: {
  limit?: number;
  offset?: number;
  cursor?: string;
}): z.infer<typeof paginationRequestSchema> {
  const result = paginationRequestSchema.parse(params);
  return result;
}

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type ApiResponse<T = any> = Omit<
  z.infer<typeof apiResponseSchema>,
  "data"
> & { data?: T };
export type ApiError = z.infer<typeof apiErrorSchema>;
export type PaginationRequest = z.infer<typeof paginationRequestSchema>;
export type PaginationResponse = z.infer<typeof paginationResponseSchema>;
export type PaginatedResponse<T> = Omit<
  z.infer<typeof paginatedResponseSchema>,
  "data"
> & { data?: T[] };
export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SortOptions = z.infer<typeof sortOptionsSchema>;
export type FilterOptions = z.infer<typeof filterOptionsSchema>;
export type ApiVersion = z.infer<typeof apiVersionSchema>;
export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
export type ServiceHealthStatus = z.infer<typeof serviceHealthStatusSchema>;
export type RateLimitInfo = z.infer<typeof rateLimitInfoSchema>;
export type RequestMetadata = z.infer<typeof requestMetadataSchema>;
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type GeoLocation = z.infer<typeof geoLocationSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Currency = z.infer<typeof currencySchema>;
export type MoneyAmount = z.infer<typeof moneyAmountSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type TimeZone = z.infer<typeof timeZoneSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type BulkOperationRequest<T> = Omit<
  z.infer<typeof bulkOperationRequestSchema>,
  "operations"
> & {
  operations: Array<
    Omit<z.infer<typeof bulkOperationSchema>, "data"> & { data?: T }
  >;
};
export type BulkOperationResponse<T> = Omit<
  z.infer<typeof bulkOperationResponseSchema>,
  "results"
> & {
  results: Array<
    Omit<z.infer<typeof bulkOperationResultSchema>, "data"> & { data?: T }
  >;
};
export type BulkOperation<T> = Omit<
  z.infer<typeof bulkOperationSchema>,
  "data"
> & { data?: T };
export type BulkOperationResult<T> = Omit<
  z.infer<typeof bulkOperationResultSchema>,
  "data"
> & { data?: T };
export type BulkOperationSummary = z.infer<typeof bulkOperationSummarySchema>;
export type WebhookPayload<T = any> = Omit<
  z.infer<typeof webhookPayloadSchema>,
  "data"
> & { data: T };
export type SystemConfig = z.infer<typeof systemConfigSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type FeatureFlagCondition = z.infer<typeof featureFlagConditionSchema>;
export type CacheInfo = z.infer<typeof cacheInfoSchema>;
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>;
export type ApiEndpoint = z.infer<typeof apiEndpointSchema>;
export type ValidationRule = z.infer<typeof validationRuleSchema>;
export type ApiExample = z.infer<typeof apiExampleSchema>;
export type ApiDocumentationSection = z.infer<
  typeof apiDocumentationSectionSchema
>;

// Enum type exports
export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type HttpStatusCode = z.infer<typeof httpStatusCodeSchema>;
export type ContentType = z.infer<typeof contentTypeSchema>;
export type HttpMethod = z.infer<typeof httpMethodSchema>;
export type ApiStatus = z.infer<typeof apiStatusSchema>;
export type Environment = z.infer<typeof environmentSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;
export type PolicyStatus = z.infer<typeof policyStatusSchema>;
