// ============================================================================
// TRIGGERR UTILS PACKAGE - FUNCTIONAL GROUPING BARREL EXPORTS
// ============================================================================

// ============================================================================
// FUNCTIONAL NAMESPACE EXPORTS
// ============================================================================

// Core Utilities (Data manipulation, formatting, validation)
export * as Core from "./lib";

// Type Utilities (Type guards, type helpers, generic utilities)
export * as Types from "./types";

// Constants (Static values, configuration constants)
export * as Constants from "./constants";

// ============================================================================
// FLAT EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Export all utility functions for backward compatibility
export * from "./lib";

// Export all types for backward compatibility
export * from "./types";

// Export all constants for backward compatibility
export * from "./constants";

// ============================================================================
// COMMONLY USED UTILITIES (DIRECT EXPORTS)
// ============================================================================

// Re-export most commonly used utilities directly for convenience
export { formatDate } from "./lib";

// ============================================================================
// PACKAGE METADATA
// ============================================================================

export const UTILS_PACKAGE_VERSION = "0.1.0";
export const UTILS_PACKAGE_NAME = "@triggerr/utils";
