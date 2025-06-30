// ============================================================================
// MAIN SHARED PACKAGE ENTRY POINT
// ============================================================================

// Re-exports all shared modules for easy importing across the triggerr platform

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Export all types from the types directory
export * from "./types";

// ============================================================================
// BUSINESS CONSTANTS
// ============================================================================

// Export business constants (insurance products, providers, limits, etc.)
export * from "./constants";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Export Zod validation schemas for API requests/responses
export * from "./validators";

// ============================================================================
// NOTIFICATION UTILITIES
// ============================================================================

// Export notification templates and utilities
// Note: Only export specific items to avoid conflicts with types
export {
  EMAIL_TEMPLATES,
  renderNotification,
  type NotificationContext,
  defaultPlatformName,
  defaultSupportEmail,
} from "./notifications";

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

// Common utility types are already exported via the wildcard export above
// No need to re-export them specifically to avoid conflicts

// ============================================================================
// VERSION INFO
// ============================================================================

export const SHARED_PACKAGE_VERSION = "0.1.0";
export const SHARED_PACKAGE_NAME = "@triggerr/shared";
