// ============================================================================
// TRIGGERR CONFIG PACKAGE - ENVIRONMENT-DRIVEN BARREL EXPORTS
// ============================================================================

// ============================================================================
// ENVIRONMENT-SPECIFIC NAMESPACE EXPORTS
// ============================================================================

// Environment Management
export * as Environment from "./lib/environment";

// Payment Configuration
export * as Payment from "./stripe";

// Security Configuration
export * as Security from "./lib/security";

// External Services Configuration
export * as Services from "./lib/services";

// Feature Flags
export * as Features from "./lib/features";

// ============================================================================
// DIRECT EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Stripe Configuration
export {
  stripeConfig,
  stripeSettings,
  getStripeConfigForEnv,
  getCurrentStripeEnvironment,
} from "./stripe";

export type {
  StripeConfig,
  StripeApiVersion,
  StripeEnvironment,
} from "./stripe";

// ============================================================================
// RE-EXPORTED CONFIGURATION FROM MODULES
// ============================================================================

// Re-export from environment module
export {
  getCurrentEnvironment,
  isDevelopment,
  isProduction,
  isStaging,
  baseUrls,
  apiUrls,
  getCurrentEnvironmentConfig,
  getCurrentBaseUrl,
  getCurrentApiUrl,
  isDebugMode,
  getLogLevel,
} from "./lib/environment";

// Re-export from security module
export {
  jwtConfig,
  sessionConfig,
  corsConfig,
  rateLimitConfig,
  passwordPolicyConfig,
  encryptionConfig,
  securityHeadersConfig,
  apiKeyConfig,
  endpointRateLimits,
  getSecurityHeaders,
  generateApiKey,
} from "./lib/security";

// Re-export from services module
export {
  externalServices,
  flightDataServices,
  weatherServices,
  paymentServices,
  llmServices,
  getEnabledFlightDataServices,
  getEnabledWeatherServices,
  getEnabledPaymentServices,
  getEnabledLLMServices,
} from "./lib/services";

// Re-export from features module
export {
  features as featureFlags,
  isFeatureEnabled,
  getEnabledFeatures,
  getCurrentPhase,
  getFeatureFlagSummary,
} from "./lib/features";

// ============================================================================
// LEGACY CONFIGURATION (for backward compatibility)
// ============================================================================

import {
  getCurrentEnvironment as getEnv,
  isDevelopment as isDev,
  isProduction as isProd,
  baseUrls,
} from "./lib/environment";

/**
 * API configuration
 */
export const apiConfig = {
  version: "v1",
  timeout: 30000, // 30 seconds
  retries: 3,
  baseUrl: baseUrls[getEnv()],
} as const;

/**
 * Database configuration constants
 */
export const dbConfig = {
  maxConnections: 20,
  connectionTimeout: 30000,
  idleTimeout: 600000, // 10 minutes
  ssl: isProd(),
} as const;

// Legacy securityConfig removed - use individual exports from ./lib/security instead

// ============================================================================
// COMMONLY USED CONFIGURATION (DIRECT EXPORTS)
// ============================================================================

// Most commonly used utilities are already re-exported above

// ============================================================================
// PACKAGE METADATA
// ============================================================================

export const CONFIG_PACKAGE_VERSION = "1.0.0";
export const CONFIG_PACKAGE_NAME = "@triggerr/config";
export const CONFIG_PACKAGE_INFO = {
  name: "@triggerr/config",
  version: "1.0.0",
  description: "Configuration management for triggerr platform",
} as const;
