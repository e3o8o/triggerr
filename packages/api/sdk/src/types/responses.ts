// ===========================================================================
// API SDK - RESPONSE TYPES
// ===========================================================================

import type { ApiResponse, ApiError } from '@triggerr/api-contracts';

/**
 * Cache metadata for enhanced responses
 */
export interface CacheMetadata {
  /**
   * Whether the response was served from cache
   */
  fromCache: boolean;

  /**
   * The cache key used to store/retrieve the response
   */
  cacheKey?: string;

  /**
   * When the cached item was created
   */
  cachedAt?: string;

  /**
   * When the cached item will expire
   */
  expiresAt?: string;
}

/**
 * Enhanced metadata for SDK responses
 */
export interface ResponseMetadata {
  /**
   * Time taken to process the request (in milliseconds)
   */
  duration?: number;

  /**
   * Number of retry attempts made
   */
  retryAttempts?: number;

  /**
   * Cache information (if caching is enabled)
   */
  cache?: CacheMetadata;
}

/**
 * Utility for working with API responses
 */
export const ResponseUtils = {
  /**
   * Checks if a response is successful
   */
  isSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true } {
    return response.success === true;
  },

  /**
   * Checks if a response is an error
   */
  isError<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: false } {
    return response.success === false;
  },

  /**
   * Extracts data from a successful response or returns a default value
   */
  getData<T>(response: ApiResponse<T>, defaultValue: T): T {
    return this.isSuccess(response) && response.data !== undefined ? response.data : defaultValue;
  },

  /**
   * Enhances an API response with SDK-specific metadata
   */
  enhance<T>(response: ApiResponse<T>, metadata: ResponseMetadata): ApiResponse<T> & { metadata?: ResponseMetadata } {
    return {
      ...response,
      metadata
    };
  },

  /**
   * Creates a standardized error response
   */
  createErrorResponse<T = any>(error: ApiError): ApiResponse<T> {
    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      requestId: `err-${Date.now()}`,
      version: '1.0.0'
    };
  }
};

/**
 * Response status types
 */
export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  PARTIAL = 'partial'
}

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}
