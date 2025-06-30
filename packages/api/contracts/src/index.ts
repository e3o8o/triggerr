// ===========================================================================
// TRIGGERR API CONTRACTS - MAIN PACKAGE EXPORTS
//
// This file serves as the primary entry point for the @triggerr/api-contracts package.
//
// To avoid namespace collisions and ensure clarity, this main index exports:
// 1. All items from `./schemas/versioning.ts` (e.g., ApiVersionInfo, CURRENT_API_VERSION).
// 2. The `API_CONTRACTS_PACKAGE_VERSION` constant.
// 3. Utility functions and truly common, non-conflicting DTOs from `./dtos/common.ts`.
//
// **IMPORTANT FOR CONSUMERS:**
//
// For most DTO interfaces, Zod validation schemas, and Zod-inferred types,
// you MUST import them from their specific sub-module paths to ensure clarity
// and avoid ambiguity. This is because DTO interfaces (e.g., `interface Policy`)
// and Zod-inferred types (e.g., `type Policy = z.infer<typeof policySchema>`)
// often share the same name by design.
//
// **Recommended Import Paths:**
//
// - **DTO Interfaces (Shape of data):**
//   `import type { ChatMessage } from '@triggerr/api-contracts/dtos/chat';`
//   `import type { InsuranceQuoteRequest } from '@triggerr/api-contracts/dtos/insurance';`
//   `import type { Policy } from '@triggerr/api-contracts/dtos/policy';`
//   `import type { UserProfile } from '@triggerr/api-contracts/dtos/wallet';` // (or user.ts if moved)
//   `import type { AdminListUsersRequest } from '@triggerr/api-contracts/dtos/user';`
//
// - **Zod Schemas (For runtime validation):**
//   `import { chatMessageRequestSchema } from '@triggerr/api-contracts/validators/chat';`
//   `import { policySchema } from '@triggerr/api-contracts/validators/policy';`
//   // Or from the validators aggregate index:
//   `import { userProfileSchema } from '@triggerr/api-contracts/validators';`
//
// - **Zod-Inferred Types (For static typing with validated data):**
//   `import type { ChatMessageRequest } from '@triggerr/api-contracts/validators/chat';`
//   `import type { Policy } from '@triggerr/api-contracts/validators/policy';`
//   // Or from the validators aggregate index:
//   `import type { UserProfile } from '@triggerr/api-contracts/validators';`
//
// The `validators/index.ts` file re-exports all Zod schemas and their inferred types
// from individual validator files (chat, common, insurance, policy, user, wallet),
// so `import { someSchema } from '@triggerr/api-contracts/validators';` is a convenient way
// to access any validation-related export.
//
// ===========================================================================

// --- API Versioning Information & Strategy ---
export * from "./schemas/versioning";

// --- Common DTOs, Utility Functions, and Non-Conflicting Enums ---
// Be cautious about re-exporting everything from common.ts if names might clash.
// It's safer to export specific, non-conflicting items or guide users to import from './dtos/common'.
export {
  // Common Interfaces & Types that are less likely to clash or are fundamental
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
  // Common Enums (exported directly, Zod enums are in validators)
  // Note: ErrorCode is exported as an enum for runtime usage
  // The Zod enum schemas (e.g., errorCodeSchema) are available via validators.
  ErrorCode, // Direct export of the enum
  type HttpMethod as HttpMethodType,
  type HttpStatusCode as HttpStatusCodeType,
  type ContentType as ContentTypeType,
  type ApiStatus as ApiStatusType,
  type Environment as EnvironmentType,
  type LogLevel as LogLevelType,
  // Utility Functions
  isApiError,
  isApiSuccess,
  createApiError,
  createApiResponse,
  createPaginatedResponse,
  // Common Constants
  API_BASE_PATHS,
  PAGINATION_DEFAULTS,
  RATE_LIMIT_DEFAULTS,
  SUPPORTED_CURRENCIES,
  CHAT_INTERFACES, // From dtos/common via dtos/chat
  INSURANCE_PRODUCT_TYPES, // From dtos/common via dtos/insurance
  WALLET_TYPES, // From dtos/common via dtos/wallet
  TRANSACTION_TYPES, // From dtos/common via dtos/wallet
} from "./dtos/common";

// --- Specific Wallet DTOs (Non-conflicting) ---
export type { AnonymousSession, AnonymousSessionData } from "./dtos/wallet";

// NOTE: `export * from './dtos/chat';` etc. are NOT used here to prevent name collisions
// with Zod-inferred types exported from `./validators`.
// Consumers MUST import DTOs from their specific dtos/* path.

// NOTE: `export * from './validators';` is NOT used here for the same reason.
// Consumers MUST import Zod schemas and Zod-inferred types from
// `'@triggerr/api-contracts/validators'` or specific `validators/*` path.

// ===========================================================================
// API CONTRACTS PACKAGE VERSION
// (This is the version of the @triggerr/api-contracts package itself,
// not the version of the API endpoints it describes).
// ===========================================================================

export const API_CONTRACTS_PACKAGE_VERSION = "0.1.0";
