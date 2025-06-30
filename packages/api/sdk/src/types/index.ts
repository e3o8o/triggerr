// ===========================================================================
// API SDK - TYPES INDEX
// ===========================================================================

// Configuration types
export * from './config';

// Response types
export * from './responses';

// Import types from api-contracts
import type { ApiResponse } from '@triggerr/api-contracts';

// Error types
export * from './errors';

// Re-export error types for convenience
export {
  SdkError,
  NetworkError,
  HttpError,
  ApiSdkError,
  AuthenticationError,
  ValidationError,
  ConfigurationError,
  TimeoutError,
  RateLimitError,
  CacheError,
  SerializationError,
  BusinessLogicError,
} from './errors';

// Error enums and types
export {
  AuthFailureReason,
  CacheOperation,
  ErrorSeverity,
  ErrorCategory,
} from './errors';

// Error interfaces
export type {
  ErrorRecoveryStrategy,
  RecoveryAction,
  ErrorInfo,
} from './errors';

// Error utilities
export {
  ErrorClassifier,
  ErrorFactory,
  ErrorTypeGuards,
} from './errors';

// Re-export HTTP client config
export type { HttpClientConfig } from '../client/http-client';

// Utility types for working with SDK responses
export type ExtractData<T> = T extends ApiResponse<infer U> ? U : never;
export type ExtractError<T> = T extends ApiResponse<any> ? (T extends { error: infer E } ? E : never) : never;

// Type helpers for service methods
export type ServiceMethod<TRequest = any, TResponse = any> = (
  request?: TRequest
) => Promise<ApiResponse<TResponse>>;

// Note: These types are reserved for future use when pagination and streaming are implemented
// Currently using the standard ApiResponse from api-contracts
export type PaginatedServiceMethod<TRequest = any, TResponse = any> = (
  request?: TRequest
) => Promise<ApiResponse<TResponse>>;

export type StreamingServiceMethod<TRequest = any, TResponse = any> = (
  request?: TRequest
) => Promise<ApiResponse<TResponse>>;

// Configuration presets for common scenarios
export const ConfigPresets = {
  /**
   * Development configuration with debugging enabled
   */
  development: (baseURL: string): Partial<HttpClientConfig> => ({
    baseURL,
    timeout: 60000, // Longer timeout for development
    retry: {
      maxAttempts: 1, // Fewer retries for faster feedback
      backoffStrategy: 'linear',
      baseDelay: 500,
    },
    debug: {
      enabled: true,
      logLevel: 'debug',
    },
  }),

  /**
   * Production configuration optimized for performance
   */
  production: (baseURL: string): Partial<HttpClientConfig> => ({
    baseURL,
    timeout: 30000,
    retry: {
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 10000,
    },
    cache: {
      enabled: true,
      defaultTtl: 300000, // 5 minutes
    },
    debug: {
      enabled: false,
    },
  }),

  /**
   * Testing configuration with mocking capabilities
   */
  testing: (baseURL: string): Partial<HttpClientConfig> => ({
    baseURL,
    timeout: 5000, // Short timeout for tests
    retry: {
      maxAttempts: 0, // No retries in tests
      backoffStrategy: 'none',
    },
    cache: {
      enabled: false, // Disable caching in tests
    },
    debug: {
      enabled: true,
      logLevel: 'error', // Only log errors in tests
    },
  }),
};

// Type assertion helpers
export const TypeAssertions = {
  /**
   * Assert that a response is successful
   */
  assertSuccess<T>(response: ApiResponse<T>): asserts response is ApiResponse<T> & { success: true } {
    if (!response.success) {
      throw new Error(`Expected successful response, got error: ${response.error?.message}`);
    }
  },

  /**
   * Assert that a response is an error
   */
  assertError<T>(response: ApiResponse<T>): asserts response is ApiResponse<T> & { success: false } {
    if (response.success) {
      throw new Error('Expected error response, got successful response');
    }
  },

  /**
   * Assert that a value is not null or undefined
   */
  assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
    if (value == null) {
      throw new Error(message || 'Expected value to be defined');
    }
  },
};

// Common type patterns used throughout the SDK
export type AsyncResult<T, E = Error> = Promise<{ success: true; data: T } | { success: false; error: E }>;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Re-export HttpClientConfig for use in preset types
import type { HttpClientConfig } from '../client/http-client';

// SDK version information
export const SDK_VERSION = '0.1.0';
export const SDK_NAME = '@triggerr/api-sdk';

// User agent helper
export const getUserAgent = (customAgent?: string): string => {
  const baseAgent = `${SDK_NAME}/${SDK_VERSION}`;
  return customAgent ? `${baseAgent} ${customAgent}` : baseAgent;
};
