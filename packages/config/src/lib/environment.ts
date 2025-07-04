// ============================================================================
// ENVIRONMENT CONFIGURATION MODULE
// ============================================================================

/**
 * Environment configuration and utilities for the triggerr platform.
 * This module provides environment detection, validation, and configuration
 * management across development, staging, production, and test environments.
 */

// ============================================================================
// ENVIRONMENT TYPES
// ============================================================================

export type Environment = "development" | "staging" | "production" | "test";

export interface EnvironmentConfig {
  name: Environment;
  baseUrl: string;
  apiUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  isTest: boolean;
  debugMode: boolean;
  logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
  features: {
    analytics: boolean;
    monitoring: boolean;
    debugLogging: boolean;
    experimentalFeatures: boolean;
  };
}

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Gets the current environment from NODE_ENV with fallback to development
 */
export function getCurrentEnvironment(): Environment {
  const env = (process.env.NODE_ENV || "development") as string;

  if (env === "production") return "production";
  if (env === "staging") return "staging";
  if (env === "test") return "test";
  return "development";
}

/**
 * Checks if we're in development environment
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === "development";
}

/**
 * Checks if we're in production environment
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === "production";
}

/**
 * Checks if we're in staging environment
 */
export function isStaging(): boolean {
  return getCurrentEnvironment() === "staging";
}

/**
 * Checks if we're in test environment
 */
export function isTest(): boolean {
  return getCurrentEnvironment() === "test";
}

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

/**
 * Base URLs for different environments
 */
export const baseUrls = {
  development: "http://localhost:3000",
  staging: process.env.STAGING_URL || "https://staging.triggerr.com",
  production: process.env.PRODUCTION_URL || "https://triggerr.com",
  test: process.env.TEST_URL || "http://localhost:3000",
} as const;

/**
 * API URLs for different environments
 */
export const apiUrls = {
  development: "http://localhost:3000/api",
  staging: process.env.STAGING_API_URL || "https://staging.triggerr.com/api",
  production: process.env.PRODUCTION_API_URL || "https://triggerr.com/api",
  test: process.env.TEST_API_URL || "http://localhost:3000/api",
} as const;

/**
 * Environment-specific configuration
 */
export const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  development: {
    name: "development",
    baseUrl: baseUrls.development,
    apiUrl: apiUrls.development,
    isDevelopment: true,
    isProduction: false,
    isStaging: false,
    isTest: false,
    debugMode: true,
    logLevel: "DEBUG",
    features: {
      analytics: false,
      monitoring: false,
      debugLogging: true,
      experimentalFeatures: true,
    },
  },
  staging: {
    name: "staging",
    baseUrl: baseUrls.staging,
    apiUrl: apiUrls.staging,
    isDevelopment: false,
    isProduction: false,
    isStaging: true,
    isTest: false,
    debugMode: true,
    logLevel: "INFO",
    features: {
      analytics: true,
      monitoring: true,
      debugLogging: true,
      experimentalFeatures: true,
    },
  },
  production: {
    name: "production",
    baseUrl: baseUrls.production,
    apiUrl: apiUrls.production,
    isDevelopment: false,
    isProduction: true,
    isStaging: false,
    isTest: false,
    debugMode: false,
    logLevel: "WARN",
    features: {
      analytics: true,
      monitoring: true,
      debugLogging: false,
      experimentalFeatures: false,
    },
  },
  test: {
    name: "test",
    baseUrl: baseUrls.test,
    apiUrl: apiUrls.test,
    isDevelopment: false,
    isProduction: false,
    isStaging: false,
    isTest: true,
    debugMode: true,
    logLevel: "ERROR",
    features: {
      analytics: false,
      monitoring: false,
      debugLogging: false,
      experimentalFeatures: false,
    },
  },
};

// ============================================================================
// ENVIRONMENT UTILITIES
// ============================================================================

/**
 * Gets the current environment configuration
 */
export function getCurrentEnvironmentConfig(): EnvironmentConfig {
  return environmentConfigs[getCurrentEnvironment()];
}

/**
 * Gets the base URL for the current environment
 */
export function getCurrentBaseUrl(): string {
  return getCurrentEnvironmentConfig().baseUrl;
}

/**
 * Gets the API URL for the current environment
 */
export function getCurrentApiUrl(): string {
  return getCurrentEnvironmentConfig().apiUrl;
}

/**
 * Checks if debug mode is enabled for the current environment
 */
export function isDebugMode(): boolean {
  return getCurrentEnvironmentConfig().debugMode;
}

/**
 * Gets the log level for the current environment
 */
export function getLogLevel(): "DEBUG" | "INFO" | "WARN" | "ERROR" {
  return getCurrentEnvironmentConfig().logLevel;
}

/**
 * Checks if a feature is enabled for the current environment
 */
export function isFeatureEnabled(feature: keyof EnvironmentConfig["features"]): boolean {
  return getCurrentEnvironmentConfig().features[feature];
}

/**
 * Validates that all required environment variables are present
 */
export function validateEnvironmentConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const currentEnv = getCurrentEnvironment();

  // Check for required environment variables based on environment
  if (currentEnv === "production") {
    if (!process.env.DATABASE_URL) {
      errors.push("DATABASE_URL is required in production");
    }
    if (!process.env.PRODUCTION_URL) {
      errors.push("PRODUCTION_URL is required in production");
    }
  }

  if (currentEnv === "staging") {
    if (!process.env.STAGING_URL) {
      errors.push("STAGING_URL is required in staging");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// ENVIRONMENT CONSTANTS
// ============================================================================

/**
 * Current environment instance
 */
export const CURRENT_ENVIRONMENT = getCurrentEnvironment();

/**
 * Current environment configuration instance
 */
export const CURRENT_CONFIG = getCurrentEnvironmentConfig();

/**
 * Environment validation result
 */
export const ENV_VALIDATION = validateEnvironmentConfig();

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

export {
  getCurrentEnvironment as getEnvironment,
  getCurrentEnvironmentConfig as getConfig,
  getCurrentBaseUrl as getBaseUrl,
  getCurrentApiUrl as getApiUrl,
};
