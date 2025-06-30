// ===========================================================================
// API SDK - SERVICE TYPES RE-EXPORTS
// ===========================================================================

/**
 * This file re-exports types from the API contracts package to make them available
 * throughout the SDK without triggering TypeScript unused declaration errors.
 *
 * These types are part of the public API surface of the SDK and can be imported
 * by consumers of the SDK when needed.
 */

// Common types
import type {
  PaginationRequest,
  ErrorCode,
} from "@triggerr/api-contracts/dtos/common";

// Admin types
import type { AdminGetUserRequest as AdminGetUserRequestDto } from "@triggerr/api-contracts/dtos/user";

// Policy types
import type {
  GetPolicyDetailsRequest as GetPolicyDetailsRequestDto,
  PolicySummary as PolicySummaryDto,
  PolicyEvent as PolicyEventDto,
  PolicyDocument as PolicyDocumentDto,
} from "@triggerr/api-contracts/dtos/policy";

// Re-export all types
export type {
  // Common types
  PaginationRequest,
  ErrorCode,

  // Admin types
  AdminGetUserRequestDto,

  // Policy types
  GetPolicyDetailsRequestDto,
  PolicySummaryDto,
  PolicyEventDto,
  PolicyDocumentDto,
};

/**
 * Maps API ErrorCode enum values to their string representation
 * Useful for error handling and validation
 */
export const errorCodeMap: Record<ErrorCode, string> = {
  UNAUTHORIZED: "User is not authorized",
  FORBIDDEN: "Access is forbidden",
  TOKEN_EXPIRED: "Authentication token has expired",
  INVALID_SESSION: "Invalid or expired session",
  VALIDATION_ERROR: "Validation error occurred",
  INVALID_INPUT: "Invalid input provided",
  MISSING_REQUIRED_FIELD: "Required field is missing",
  INVALID_FORMAT: "Data format is invalid",
  INSUFFICIENT_FUNDS: "Insufficient funds",
  QUOTE_EXPIRED: "Insurance quote has expired",
  POLICY_NOT_FOUND: "Policy was not found",
  ESCROW_CREATION_FAILED: "Failed to create escrow",
  PAYMENT_FAILED: "Payment processing failed",
  FLIGHT_DATA_UNAVAILABLE: "Flight data is unavailable",
  PAYGO_SERVICE_ERROR: "PayGo service error occurred",
  WEATHER_SERVICE_ERROR: "Weather service error occurred",
  INTERNAL_SERVER_ERROR: "Internal server error occurred",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
  MAINTENANCE_MODE: "System is in maintenance mode",
  NOT_FOUND: "Resource not found",
  ALREADY_EXISTS: "Resource already exists",
  RESOURCE_LOCKED: "Resource is locked",
  RESOURCE_EXPIRED: "Resource has expired",
};
