// ============================================================================
// SECURITY CONFIGURATION MODULE
// ============================================================================

/**
 * Security configuration for the triggerr platform.
 * This module provides authentication, authorization, session management,
 * and other security-related configuration across all environments.
 */

import {
  getCurrentEnvironment,
  isProduction,
  isDevelopment,
} from "./environment";

// ============================================================================
// SECURITY TYPES
// ============================================================================

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience?: string;
  algorithm: "HS256" | "HS384" | "HS512" | "RS256" | "RS384" | "RS512";
}

export interface SessionConfig {
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: "strict" | "lax" | "none";
  rolling: boolean;
  name: string;
  domain?: string | undefined;
}

export interface CORSConfig {
  origins: string[] | string | boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  preventReuse: number; // number of previous passwords to check
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
}

export interface SecurityHeadersConfig {
  contentSecurityPolicy: string;
  frameOptions: "DENY" | "SAMEORIGIN" | "ALLOW-FROM";
  contentTypeOptions: boolean;
  xssProtection: boolean;
  referrerPolicy: string;
  strictTransportSecurity: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
}

// ============================================================================
// JWT CONFIGURATION
// ============================================================================

/**
 * JWT configuration for different environments
 */
export const jwtConfig: JWTConfig = {
  secret:
    process.env.JWT_SECRET ||
    "your-super-secret-jwt-key-change-this-in-production",
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  issuer: process.env.JWT_ISSUER || "triggerr",
  audience: process.env.JWT_AUDIENCE || "triggerr-api",
  algorithm: (process.env.JWT_ALGORITHM as JWTConfig["algorithm"]) || "HS256",
};

/**
 * Validates JWT configuration
 */
export function validateJWTConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (
    isProduction() &&
    jwtConfig.secret === "your-super-secret-jwt-key-change-this-in-production"
  ) {
    errors.push("JWT_SECRET must be set to a secure value in production");
  }

  if (jwtConfig.secret.length < 32) {
    errors.push("JWT_SECRET should be at least 32 characters long");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================

/**
 * Session configuration for different environments
 */
export const sessionConfig: SessionConfig = {
  maxAge: parseInt(process.env.SESSION_MAX_AGE || "86400000"), // 24 hours
  secure: isProduction(),
  httpOnly: true,
  sameSite: isProduction() ? "strict" : "lax",
  rolling: true,
  name: process.env.SESSION_NAME || "triggerr-session",
  ...(process.env.SESSION_DOMAIN && { domain: process.env.SESSION_DOMAIN }),
};

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

/**
 * CORS configuration for different environments
 */
export const corsConfig: CORSConfig = {
  origins: isDevelopment()
    ? [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
      ]
    : process.env.CORS_ORIGINS?.split(",") || ["https://triggerr.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-API-Key",
    "X-Anonymous-Session-ID",
    "X-Client-Version",
    "X-Request-ID",
  ],
  exposedHeaders: [
    "X-Total-Count",
    "X-Page-Count",
    "X-Rate-Limit-Limit",
    "X-Rate-Limit-Remaining",
    "X-Rate-Limit-Reset",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================

/**
 * Rate limiting configuration for different environments
 */
export const rateLimitConfig: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(
    process.env.RATE_LIMIT_MAX || (isDevelopment() ? "1000" : "100"),
  ),
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

/**
 * Specific rate limits for different endpoints
 */
export const endpointRateLimits = {
  auth: {
    windowMs: 900000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  api: {
    windowMs: 900000, // 15 minutes
    max: isDevelopment() ? 1000 : 100,
  },
  chat: {
    windowMs: 60000, // 1 minute
    max: isDevelopment() ? 100 : 10,
  },
  wallet: {
    windowMs: 300000, // 5 minutes
    max: isDevelopment() ? 100 : 20,
  },
  faucet: {
    windowMs: 3600000, // 1 hour
    max: isDevelopment() ? 100 : 5,
  },
} as const;

// ============================================================================
// PASSWORD POLICY CONFIGURATION
// ============================================================================

/**
 * Password policy configuration
 */
export const passwordPolicyConfig: PasswordPolicyConfig = {
  minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || "8"),
  requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== "false",
  requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== "false",
  requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== "false",
  requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS !== "false",
  maxAge: parseInt(process.env.PASSWORD_MAX_AGE || "90"), // 90 days
  preventReuse: parseInt(process.env.PASSWORD_PREVENT_REUSE || "5"),
};

// ============================================================================
// ENCRYPTION CONFIGURATION
// ============================================================================

/**
 * Encryption configuration for sensitive data
 */
export const encryptionConfig: EncryptionConfig = {
  algorithm: process.env.ENCRYPTION_ALGORITHM || "aes-256-gcm",
  keyLength: parseInt(process.env.ENCRYPTION_KEY_LENGTH || "32"),
  ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH || "16"),
  tagLength: parseInt(process.env.ENCRYPTION_TAG_LENGTH || "16"),
};

// ============================================================================
// SECURITY HEADERS CONFIGURATION
// ============================================================================

/**
 * Security headers configuration
 */
export const securityHeadersConfig: SecurityHeadersConfig = {
  contentSecurityPolicy:
    process.env.CSP_POLICY ||
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.triggerr.com",
  frameOptions:
    (process.env.FRAME_OPTIONS as SecurityHeadersConfig["frameOptions"]) ||
    "DENY",
  contentTypeOptions: process.env.CONTENT_TYPE_OPTIONS !== "false",
  xssProtection: process.env.XSS_PROTECTION !== "false",
  referrerPolicy:
    process.env.REFERRER_POLICY || "strict-origin-when-cross-origin",
  strictTransportSecurity: {
    maxAge: parseInt(process.env.HSTS_MAX_AGE || "31536000"), // 1 year
    includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== "false",
    preload: process.env.HSTS_PRELOAD === "true",
  },
};

// ============================================================================
// API KEY CONFIGURATION
// ============================================================================

/**
 * API key configuration
 */
export const apiKeyConfig = {
  headerName: process.env.API_KEY_HEADER_NAME || "X-API-Key",
  length: parseInt(process.env.API_KEY_LENGTH || "32"),
  expiresIn: process.env.API_KEY_EXPIRES_IN || "30d",
  prefix: process.env.API_KEY_PREFIX || "triggerr_",
} as const;

// ============================================================================
// SECURITY VALIDATION
// ============================================================================

/**
 * Validates all security configuration
 */
export function validateSecurityConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate JWT config
  const jwtValidation = validateJWTConfig();
  errors.push(...jwtValidation.errors);

  // Validate session config
  if (sessionConfig.maxAge < 300000) {
    // 5 minutes
    warnings.push("Session max age is very short (less than 5 minutes)");
  }

  // Validate encryption config
  if (encryptionConfig.keyLength < 32) {
    errors.push("Encryption key length should be at least 32 bytes");
  }

  // Production-specific validations
  if (isProduction()) {
    if (!sessionConfig.secure) {
      errors.push("Session secure flag must be true in production");
    }

    if (
      corsConfig.origins === true ||
      (Array.isArray(corsConfig.origins) && corsConfig.origins.includes("*"))
    ) {
      errors.push("CORS origins should not be wildcard (*) in production");
    }

    if (rateLimitConfig.max > 1000) {
      warnings.push("Rate limit max is very high for production");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets the appropriate security headers for the current environment
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  if (securityHeadersConfig.contentSecurityPolicy) {
    headers["Content-Security-Policy"] =
      securityHeadersConfig.contentSecurityPolicy;
  }

  headers["X-Frame-Options"] = securityHeadersConfig.frameOptions;

  if (securityHeadersConfig.contentTypeOptions) {
    headers["X-Content-Type-Options"] = "nosniff";
  }

  if (securityHeadersConfig.xssProtection) {
    headers["X-XSS-Protection"] = "1; mode=block";
  }

  headers["Referrer-Policy"] = securityHeadersConfig.referrerPolicy;

  if (isProduction()) {
    const { maxAge, includeSubDomains, preload } =
      securityHeadersConfig.strictTransportSecurity;
    let hstsValue = `max-age=${maxAge}`;
    if (includeSubDomains) hstsValue += "; includeSubDomains";
    if (preload) hstsValue += "; preload";
    headers["Strict-Transport-Security"] = hstsValue;
  }

  return headers;
}

/**
 * Generates a secure random API key
 */
export function generateApiKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = apiKeyConfig.prefix;
  for (let i = 0; i < apiKeyConfig.length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================================
// SECURITY CONSTANTS
// ============================================================================

/**
 * Security validation result
 */
export const SECURITY_VALIDATION = validateSecurityConfig();

/**
 * Current security headers
 */
export const CURRENT_SECURITY_HEADERS = getSecurityHeaders();

// ============================================================================
// EXPORTS
// ============================================================================

export {
  jwtConfig as JWT,
  sessionConfig as Session,
  corsConfig as CORS,
  rateLimitConfig as RateLimit,
  passwordPolicyConfig as PasswordPolicy,
  encryptionConfig as Encryption,
  securityHeadersConfig as SecurityHeaders,
  apiKeyConfig as APIKey,
  endpointRateLimits as EndpointRateLimits,
};
