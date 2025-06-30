// ===========================================================================
// API SDK - ENHANCED ERROR TYPES
// ===========================================================================

import type { ApiError } from '@triggerr/api-contracts';
import type { HttpMethod } from './config';

/**
 * Base SDK error class that extends the standard Error
 */
export class SdkError extends Error {
  public override readonly name: string = 'SdkError';
  public readonly timestamp: number;
  public readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.timestamp = Date.now();
    if (context !== undefined) {
      this.context = context;
    }
    Object.setPrototypeOf(this, SdkError.prototype);
  }

  /**
   * Convert error to JSON for logging/debugging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends SdkError {
  public override readonly name = 'NetworkError';
  public readonly code: string;
  public readonly url: string;
  public readonly method: HttpMethod;

  constructor(message: string, code: string, url: string, method: HttpMethod, context?: Record<string, any>) {
    super(message, context);
    this.code = code;
    this.url = url;
    this.method = method;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * HTTP-related errors
 */
export class HttpError extends SdkError {
  public override readonly name = 'HttpError';
  public readonly status: number;
  public readonly statusText: string;
  public readonly url: string;
  public readonly method: HttpMethod;
  public readonly responseHeaders: Record<string, string>;
  public readonly responseBody?: any;

  constructor(
    message: string,
    status: number,
    statusText: string,
    url: string,
    method: HttpMethod,
    responseHeaders: Record<string, string> = {},
    responseBody?: any,
    context?: Record<string, any>
  ) {
    super(message, context);
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.method = method;
    this.responseHeaders = responseHeaders;
    this.responseBody = responseBody;
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  /**
   * Check if error is client-side (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is server-side (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }
}

/**
 * API-specific errors that include structured error information
 */
export class ApiSdkError extends SdkError {
  public override readonly name = 'ApiSdkError';
  public readonly apiError?: ApiError;
  public readonly status?: number;
  public readonly url: string;
  public readonly method: HttpMethod;
  public readonly requestId?: string;
  public readonly retryAttempts: number;

  constructor(
    message: string,
    url: string,
    method: HttpMethod,
    retryAttempts: number = 0,
    status?: number,
    apiError?: ApiError,
    requestId?: string,
    context?: Record<string, any>
  ) {
    super(message, context);
    this.url = url;
    this.method = method;
    this.retryAttempts = retryAttempts;

    if (status !== undefined) {
      this.status = status;
    }
    if (apiError !== undefined) {
      this.apiError = apiError;
    }
    if (requestId !== undefined) {
      this.requestId = requestId;
    }

    Object.setPrototypeOf(this, ApiSdkError.prototype);
  }

  /**
   * Get the error code from the API error or HTTP status
   */
  getErrorCode(): string {
    return this.apiError?.code || `HTTP_${this.status}` || 'UNKNOWN_ERROR';
  }

  /**
   * Check if error is retryable based on status code and error type
   */
  isRetryable(): boolean {
    if (this.status) {
      // Retryable status codes
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(this.status);
    }
    return false;
  }
}

/**
 * Authentication-related errors
 */
export class AuthenticationError extends SdkError {
  public override name = 'AuthenticationError';
  public readonly reason: string;
  public readonly suggestion: string;

  constructor(message: string, reason: string, suggestion?: string, context?: Record<string, any>) {
    super(message, context);
    this.reason = reason;
    this.suggestion = suggestion !== undefined ? suggestion : 'Please check your authentication credentials';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Validation error for input parameters
 */
export class ValidationError extends SdkError {
  public override name = 'ValidationError';
  public readonly field: string;
  public readonly value: any;
  public readonly validationRule: string;

  constructor(
    message: string,
    value: any,
    field?: string,
    validationRule?: string,
    context?: Record<string, any>
  ) {
    super(message, context);
    this.value = value;
    this.field = field !== undefined ? field : 'unknown';
    this.validationRule = validationRule !== undefined ? validationRule : 'unknown';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Configuration error for SDK initialization
 */
export class ConfigurationError extends SdkError {
  public override name = 'ConfigurationError';
  public readonly configKey: string;
  public readonly configValue: any;

  constructor(message: string, configKey?: string, configValue?: any, context?: Record<string, any>) {
    super(message, context);
    this.configKey = configKey !== undefined ? configKey : 'unknown';
    this.configValue = configValue;
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Timeout-related errors
 */
export class TimeoutError extends SdkError {
  public override readonly name = 'TimeoutError';
  public readonly timeoutMs: number;
  public readonly operation: string;

  constructor(message: string, timeoutMs: number, operation: string, context?: Record<string, any>) {
    super(message, context);
    this.timeoutMs = timeoutMs;
    this.operation = operation;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error for rate-limiting issues
 */
export class RateLimitError extends SdkError {
  public override name = 'RateLimitError';
  public readonly retryAfter: number;
  public readonly limit: number;
  public readonly remaining: number;
  public readonly resetTime: string;

  constructor(
    message: string,
    retryAfter?: number,
    limit?: number,
    remaining: number = 0,
    resetTime: string = new Date(Date.now() + (retryAfter || 60) * 1000).toISOString(),
    context?: Record<string, any>
  ) {
    super(message, context);
    this.retryAfter = retryAfter !== undefined ? retryAfter : 60; // Default 60 seconds
    this.limit = limit !== undefined ? limit : 100; // Default limit
    this.remaining = remaining;
    this.resetTime = resetTime;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Cache-related errors
 */
export class CacheError extends SdkError {
  public override readonly name = 'CacheError';
  public readonly operation: CacheOperation;
  public readonly cacheKey?: string;

  constructor(message: string, operation: CacheOperation, cacheKey?: string, context?: Record<string, any>) {
    super(message, context);
    this.operation = operation;
    this.cacheKey = cacheKey || 'unknown';
    Object.setPrototypeOf(this, CacheError.prototype);
  }
}

/**
 * Serialization/Deserialization errors
 */
export class SerializationError extends SdkError {
  public override readonly name = 'SerializationError';
  public readonly operation: 'serialize' | 'deserialize';
  public readonly dataType?: string;

  constructor(message: string, operation: 'serialize' | 'deserialize', dataType?: string, context?: Record<string, any>) {
    super(message, context);
    this.operation = operation;
    this.dataType = dataType !== undefined ? dataType : 'unknown';
    Object.setPrototypeOf(this, SerializationError.prototype);
  }
}

/**
 * Business logic errors (specific to triggerr domain)
 */
export class BusinessLogicError extends SdkError {
  public override readonly name = 'BusinessLogicError';
  public readonly businessRule: string;
  public readonly entityType?: string;
  public readonly entityId?: string;

  constructor(
    message: string,
    businessRule: string,
    entityType?: string,
    entityId?: string,
    context?: Record<string, any>
  ) {
    super(message, context);
    this.businessRule = businessRule;
    this.entityType = entityType || 'unknown';
    this.entityId = entityId || 'unknown';
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

// ===========================================================================
// ENUMS AND TYPES
// ===========================================================================

/**
 * Authentication failure reasons
 */
export enum AuthFailureReason {
  INVALID_TOKEN = 'invalid_token',
  EXPIRED_TOKEN = 'expired_token',
  MISSING_TOKEN = 'missing_token',
  MALFORMED_TOKEN = 'malformed_token',
  INSUFFICIENT_PRIVILEGES = 'insufficient_privileges',
  AUTH_PROVIDER_ERROR = 'auth_provider_error',
  GOOGLE_OAUTH_ERROR = 'google_oauth_error',
  SESSION_EXPIRED = 'session_expired',
}

/**
 * Cache operations
 */
export enum CacheOperation {
  GET = 'get',
  SET = 'set',
  DELETE = 'delete',
  CLEAR = 'clear',
  SERIALIZE = 'serialize',
  INVALIDATE = 'invalidate',
  DESERIALIZE = 'deserialize',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = 'network',
  HTTP = 'http',
  API = 'api',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  CACHE = 'cache',
  SERIALIZATION = 'serialization',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown',
}

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  /** Whether the error is recoverable */
  recoverable: boolean;

  /** Automatic recovery actions */
  autoActions: RecoveryAction[];

  /** Manual recovery suggestions */
  manualActions: RecoveryAction[];

  /** Retry configuration */
  retry?: {
    enabled: boolean;
    maxAttempts: number;
    delay: number;
    backoffStrategy: 'linear' | 'exponential';
  };
}

/**
 * Recovery action definition
 */
export interface RecoveryAction {
  /** Action identifier */
  id: string;

  /** Human-readable description */
  description: string;

  /** Action type */
  type: 'retry' | 'refresh_auth' | 'clear_cache' | 'fallback' | 'manual';

  /** Whether action can be automated */
  automated: boolean;

  /** Priority level (lower = higher priority) */
  priority: number;

  /** Estimated success probability (0-1) */
  successProbability?: number;
}

/**
 * Enhanced error information
 */
export interface ErrorInfo {
  /** Error instance */
  error: SdkError;

  /** Error category */
  category: ErrorCategory;

  /** Severity level */
  severity: ErrorSeverity;

  /** Recovery strategy */
  recovery: ErrorRecoveryStrategy;

  /** Additional metadata */
  metadata: {
    /** User-friendly message */
    userMessage?: string;

    /** Technical details for developers */
    technicalDetails?: string;

    /** Documentation links */
    documentation?: string[];

    /** Support contact information */
    support?: string;

    /** Error tracking ID */
    trackingId?: string;
  };
}

// ===========================================================================
// ERROR UTILITIES
// ===========================================================================

/**
 * Error classification utility
 */
export class ErrorClassifier {
  /**
   * Classify an error into a category
   */
  static classify(error: Error): ErrorCategory {
    if (error instanceof NetworkError) return ErrorCategory.NETWORK;
    if (error instanceof HttpError) return ErrorCategory.HTTP;
    if (error instanceof ApiSdkError) return ErrorCategory.API;
    if (error instanceof AuthenticationError) return ErrorCategory.AUTHENTICATION;
    if (error instanceof ValidationError) return ErrorCategory.VALIDATION;
    if (error instanceof ConfigurationError) return ErrorCategory.CONFIGURATION;
    if (error instanceof TimeoutError) return ErrorCategory.TIMEOUT;
    if (error instanceof RateLimitError) return ErrorCategory.RATE_LIMIT;
    if (error instanceof CacheError) return ErrorCategory.CACHE;
    if (error instanceof SerializationError) return ErrorCategory.SERIALIZATION;
    if (error instanceof BusinessLogicError) return ErrorCategory.BUSINESS_LOGIC;

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  static getSeverity(error: Error): ErrorSeverity {
    if (error instanceof AuthenticationError) return ErrorSeverity.HIGH;
    if (error instanceof ConfigurationError) return ErrorSeverity.CRITICAL;
    if (error instanceof BusinessLogicError) return ErrorSeverity.MEDIUM;
    if (error instanceof NetworkError) return ErrorSeverity.MEDIUM;
    if (error instanceof TimeoutError) return ErrorSeverity.LOW;
    if (error instanceof ValidationError) return ErrorSeverity.LOW;

    if (error instanceof HttpError) {
      if (error.status >= 500) return ErrorSeverity.HIGH;
      if (error.status >= 400) return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * Generate recovery strategy
   */
  static getRecoveryStrategy(error: Error): ErrorRecoveryStrategy {
    const category = this.classify(error);

    switch (category) {
      case ErrorCategory.NETWORK:
      case ErrorCategory.TIMEOUT:
        return {
          recoverable: true,
          autoActions: [
            {
              id: 'retry',
              description: 'Retry the request',
              type: 'retry',
              automated: true,
              priority: 1,
              successProbability: 0.7,
            },
          ],
          manualActions: [
            {
              id: 'check_connection',
              description: 'Check your internet connection',
              type: 'manual',
              automated: false,
              priority: 1,
            },
          ],
          retry: {
            enabled: true,
            maxAttempts: 3,
            delay: 1000,
            backoffStrategy: 'exponential',
          },
        };

      case ErrorCategory.AUTHENTICATION:
        return {
          recoverable: true,
          autoActions: [
            {
              id: 'refresh_auth',
              description: 'Refresh authentication token',
              type: 'refresh_auth',
              automated: true,
              priority: 1,
              successProbability: 0.8,
            },
          ],
          manualActions: [
            {
              id: 'login_again',
              description: 'Please log in again',
              type: 'manual',
              automated: false,
              priority: 1,
            },
          ],
        };

      case ErrorCategory.RATE_LIMIT:
        return {
          recoverable: true,
          autoActions: [
            {
              id: 'wait_and_retry',
              description: 'Wait and retry after rate limit window',
              type: 'retry',
              automated: true,
              priority: 1,
              successProbability: 0.9,
            },
          ],
          manualActions: [],
          retry: {
            enabled: true,
            maxAttempts: 3,
            delay: (error as RateLimitError).retryAfter ? (error as RateLimitError).retryAfter! * 1000 : 60000,
            backoffStrategy: 'linear',
          },
        };

      default:
        return {
          recoverable: false,
          autoActions: [],
          manualActions: [
            {
              id: 'contact_support',
              description: 'Contact support if the problem persists',
              type: 'manual',
              automated: false,
              priority: 1,
            },
          ],
        };
    }
  }
}

/**
 * Error factory for creating typed errors
 */
export class ErrorFactory {
  /**
   * Create a network error
   */
  static network(message: string, code: string, url: string, method: HttpMethod, context?: Record<string, any>): NetworkError {
    return new NetworkError(message, code, url, method, context);
  }

  /**
   * Create an HTTP error
   */
  static http(
    status: number,
    statusText: string,
    url: string,
    method: HttpMethod,
    responseHeaders?: Record<string, string>,
    responseBody?: any,
    context?: Record<string, any>
  ): HttpError {
    const message = `HTTP ${status}: ${statusText}`;
    return new HttpError(message, status, statusText, url, method, responseHeaders, responseBody, context);
  }

  /**
   * Create an API error
   */
  static api(
    message: string,
    url: string,
    method: HttpMethod,
    retryAttempts: number = 0,
    status?: number,
    apiError?: ApiError,
    requestId?: string,
    context?: Record<string, any>
  ): ApiSdkError {
    return new ApiSdkError(message, url, method, retryAttempts, status, apiError, requestId, context);
  }

  /**
   * Create an authentication error
   */
  static auth(message: string, reason: AuthFailureReason, suggestion?: string, context?: Record<string, any>): AuthenticationError {
    return new AuthenticationError(message, reason, suggestion, context);
  }

  /**
   * Create a validation error
   */
  static validation(
    message: string,
    field?: string,
    value?: any,
    validationRule?: string,
    context?: Record<string, any>
  ): ValidationError {
    return new ValidationError(message, field || 'unknown', value || null, validationRule, context);
  }

  /**
   * Create a timeout error
   */
  static timeout(message: string, timeoutMs: number, operation: string, context?: Record<string, any>): TimeoutError {
    return new TimeoutError(message, timeoutMs, operation, context);
  }

  /**
   * Create a rate limit error
   */
  static rateLimit(
    message: string,
    retryAfter?: number,
    limit?: number,
    remaining?: number,
    resetTime?: string,
    context?: Record<string, any>
  ): RateLimitError {
    return new RateLimitError(message, retryAfter, limit, remaining, resetTime, context);
  }
}

/**
 * Type guards for error instances
 */
export const ErrorTypeGuards = {
  isNetworkError(error: Error): error is NetworkError {
    return error instanceof NetworkError;
  },

  isHttpError(error: Error): error is HttpError {
    return error instanceof HttpError;
  },

  isApiSdkError(error: Error): error is ApiSdkError {
    return error instanceof ApiSdkError;
  },

  isAuthenticationError(error: Error): error is AuthenticationError {
    return error instanceof AuthenticationError;
  },

  isValidationError(error: Error): error is ValidationError {
    return error instanceof ValidationError;
  },

  isTimeoutError(error: Error): error is TimeoutError {
    return error instanceof TimeoutError;
  },

  isRateLimitError(error: Error): error is RateLimitError {
    return error instanceof RateLimitError;
  },

  isSdkError(error: Error): error is SdkError {
    return error instanceof SdkError;
  },

  isRetryableError(error: Error): boolean {
    if (this.isApiSdkError(error)) {
      return error.isRetryable();
    }
    if (this.isNetworkError(error)) {
      return true;
    }
    if (this.isTimeoutError(error)) {
      return true;
    }
    if (this.isRateLimitError(error)) {
      return true;
    }
    if (this.isHttpError(error)) {
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(error.status);
    }
    return false;
  },
};
