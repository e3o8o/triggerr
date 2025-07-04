// ============================================================================
// TRIGGERR SHARED PACKAGE - DOMAIN-DRIVEN BARREL EXPORTS
// ============================================================================

// ============================================================================
// DOMAIN-SPECIFIC NAMESPACE EXPORTS
// ============================================================================

// Common/Core Domain
export * as Common from "./types/api-types";
export * as Business from "./types/business-types";
export * as Models from "./models";
export * as Constants from "./constants";
export * as Validators from "./validators";

// Authentication Domain
export * as Auth from "./types/auth-types";

// Chat Domain
export * as Chat from "./types/chat-types";

// Integration Domain
export * as Integrations from "./types/integrations";

// Notification Domain
export * as Notifications from "./notifications";

// ============================================================================
// FLAT EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Export all types for backward compatibility
export * from "./types";
export * from "./models";
export * from "./constants";
export * from "./validators";

// Export specific notification items to avoid conflicts
export {
  EMAIL_TEMPLATES,
  renderNotification,
  type NotificationContext,
  defaultPlatformName,
  defaultSupportEmail,
} from "./notifications";

// ============================================================================
// COMMON UTILITY TYPES (MOST FREQUENTLY USED)
// ============================================================================

// Re-export the most commonly used types directly for convenience
export type {
  UUID,
  Timestamp,
  EmailAddress,
  PhoneNumber,
  CurrencyCode,
  CountryCode,
  LanguageCode,
  PaginationParams,
  PaginatedResponse,
  MoneyAmount,
  Address,
  Coordinates,
  TimeRange,
  FileUpload,
  ContactInfo,
  AuditMetadata,
  Environment,
  LogLevel,
  Status,
} from "./types";

// Re-export canonical data models
export type {
  CanonicalFlightData,
  CanonicalWeatherObservation,
  StandardFlightStatus,
  StandardWeatherCondition,
} from "./models";

// ============================================================================
// PACKAGE METADATA
// ============================================================================

export const SHARED_PACKAGE_VERSION = "0.1.0";
export const SHARED_PACKAGE_NAME = "@triggerr/shared";
