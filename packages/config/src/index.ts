/**
 * Configuration Package Index
 *
 * Central configuration management for the triggerr platform.
 * This package provides environment-specific configuration for all
 * external services and internal settings.
 */

// ============================================================================
// STRIPE CONFIGURATION
// ============================================================================

export {
  stripeConfig,
  stripeSettings,
  getStripeConfigForEnv,
  getCurrentStripeEnvironment,
} from './stripe';

export type {
  StripeConfig,
  StripeApiVersion,
  StripeEnvironment,
} from './stripe';

// ============================================================================
// ENVIRONMENT UTILITIES
// ============================================================================

/**
 * Gets the current environment
 */
export function getCurrentEnvironment(): 'development' | 'staging' | 'production' | 'test' {
  const env = (process.env.NODE_ENV || 'development') as string; // Cast to string

  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  if (env === 'test') return 'test';
  return 'development';
}

/**
 * Checks if we're in development environment
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'development';
}

/**
 * Checks if we're in production environment
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

/**
 * Checks if we're in staging environment
 */
export function isStaging(): boolean {
  return getCurrentEnvironment() === 'staging';
}

// ============================================================================
// COMMON CONFIGURATION
// ============================================================================

/**
 * Base URLs for different environments
 */
export const baseUrls = {
  development: 'http://localhost:3000',
  staging: process.env.STAGING_URL || 'https://staging.triggerr.com',
  production: process.env.PRODUCTION_URL || 'https://triggerr.com',
  test: process.env.TEST_URL || 'http://localhost:3000', // Add test environment URL
} as const;

/**
 * API configuration
 */
export const apiConfig = {
  version: 'v1',
  timeout: 30000, // 30 seconds
  retries: 3,
  baseUrl: baseUrls[getCurrentEnvironment()],
} as const;

/**
 * Database configuration constants
 */
export const dbConfig = {
  maxConnections: 20,
  connectionTimeout: 30000,
  idleTimeout: 600000, // 10 minutes
  ssl: isProduction(),
} as const;

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

/**
 * Security-related configuration
 */
export const securityConfig = {
  // JWT settings
  jwt: {
    expiresIn: '24h',
    refreshExpiresIn: '7d',
    issuer: 'triggerr',
  },

  // Session settings
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: isProduction(),
    sameSite: 'lax' as const,
  },

  // CORS settings
  cors: {
    origins: isDevelopment()
      ? ['http://localhost:3000', 'http://localhost:3001']
      : [baseUrls[getCurrentEnvironment()]],
    credentials: true,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment() ? 1000 : 100, // requests per window
  },
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Feature flags for different environments
 */
export const featureFlags = {
  // PayGo integration
  paygoEnabled: true,
  paygoTestMode: !isProduction(),

  // Stripe integration
  stripeEnabled: true,

  // Chat features
  chatEnabled: true,
  chatDebugMode: isDevelopment(),

  // Monitoring and analytics
  analyticsEnabled: isProduction(),
  debugLogging: isDevelopment(),

  // External API integrations
  flightDataEnabled: true,
  weatherDataEnabled: true,

  // Experimental features
  experimentalFeaturesEnabled: isDevelopment(),
} as const;

// ============================================================================
// EXTERNAL SERVICE CONFIGURATION
// ============================================================================

/**
 * Configuration for external APIs and services
 */
export const externalServices = {
  // Flight data APIs
  aviationStack: {
    baseUrl: 'http://api.aviationstack.com/v1',
    timeout: 10000,
    retries: 2,
  },

  flightAware: {
    baseUrl: 'https://aeroapi.flightaware.com/aeroapi',
    timeout: 10000,
    retries: 2,
  },

  openSky: {
    baseUrl: 'https://opensky-network.org/api',
    timeout: 15000,
    retries: 1,
  },

  // Weather APIs
  openWeather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    timeout: 5000,
    retries: 2,
  },

  // LLM APIs
  deepSeek: {
    baseUrl: 'https://api.deepseek.com',
    timeout: 30000,
    retries: 1,
  },
} as const;

// ============================================================================
// PACKAGE INFO
// ============================================================================

export const CONFIG_PACKAGE_INFO = {
  name: '@triggerr/config',
  version: '1.0.0',
  description: 'Configuration management for triggerr platform',
} as const;
