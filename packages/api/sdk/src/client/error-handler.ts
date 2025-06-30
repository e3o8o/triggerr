// ===========================================================================
// API SDK - ERROR HANDLER
// ===========================================================================

import { ErrorCode, type ApiError } from "@triggerr/api-contracts";
import { ApiClientError } from "./index";
import {
  HttpError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  ValidationError,
  BusinessLogicError,
  RateLimitError,
  ConfigurationError,
  SerializationError,
  CacheError,
} from "../types/errors";

// ===========================================================================
// ENHANCED ERROR INTERFACES
// ===========================================================================

export interface EnhancedApiError extends ApiError {
  originalError?: Error;
  httpStatus?: number;
  requestInfo?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  details?: Record<string, any>;
  metadata?: {
    stack?: string;
    context?: Record<string, any>;
    timestamp: string;
    retryable: boolean;
  };
}

// ===========================================================================
// ERROR HANDLER IMPLEMENTATION
// ===========================================================================

export class ErrorHandler {
  /**
   * Maps HTTP status codes and error types to ErrorCode enum values
   */
  public inferErrorCode(error: Error | ApiClientError): ErrorCode {
    // Handle ApiClientError with apiError already set
    if (error instanceof ApiClientError && error.apiError?.code) {
      return error.apiError.code as ErrorCode;
    }

    // Map based on error instance type
    if (error instanceof HttpError) {
      if (error.status === 401) return ErrorCode.UNAUTHORIZED;
      if (error.status === 403) return ErrorCode.FORBIDDEN;
      if (error.status === 404) return ErrorCode.NOT_FOUND;
      if (error.status === 422) return ErrorCode.VALIDATION_ERROR;
      if (error.status === 429) return ErrorCode.RATE_LIMIT_EXCEEDED;
      if (error.status >= 500) return ErrorCode.INTERNAL_SERVER_ERROR;
      return ErrorCode.VALIDATION_ERROR; // Default for other 4xx errors
    }

    if (error instanceof NetworkError) return ErrorCode.SERVICE_UNAVAILABLE;
    if (error instanceof TimeoutError) return ErrorCode.SERVICE_UNAVAILABLE;
    if (error instanceof AuthenticationError) return ErrorCode.UNAUTHORIZED;
    if (error instanceof ValidationError) return ErrorCode.VALIDATION_ERROR;
    if (error instanceof BusinessLogicError)
      return ErrorCode.INTERNAL_SERVER_ERROR;
    if (error instanceof RateLimitError) return ErrorCode.RATE_LIMIT_EXCEEDED;
    if (error instanceof ConfigurationError)
      return ErrorCode.INTERNAL_SERVER_ERROR;
    if (error instanceof SerializationError) return ErrorCode.VALIDATION_ERROR;
    if (error instanceof CacheError) return ErrorCode.INTERNAL_SERVER_ERROR;

    // Default fallback
    return ErrorCode.INTERNAL_SERVER_ERROR;
  }

  /**
   * Extracts detailed error information from various error types
   */
  public extractErrorDetails(
    error: Error | ApiClientError,
  ): Record<string, any> {
    const details: Record<string, any> = {
      timestamp: new Date().toISOString(),
      retryable: this.isErrorRetryable(error),
    };

    if (error.stack) {
      details.stack = error.stack;
    }

    // Extract additional context based on error type
    if (error instanceof ApiClientError) {
      details.context = {
        status: error.status,
        responseData: error.responseData,
      };
    } else if (error instanceof HttpError) {
      details.context = {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        method: error.method,
        responseHeaders: error.responseHeaders,
        responseBody: error.responseBody,
      };
    } else if (error instanceof NetworkError) {
      details.context = {
        url: error.url,
        method: error.method,
      };
    }

    return details;
  }

  /**
   * Determines if an error is retryable based on its type and properties
   */
  public isErrorRetryable(error: Error | ApiClientError): boolean {
    // Network errors are typically retryable
    if (error instanceof NetworkError) {
      return true;
    }

    // Timeout errors are retryable
    if (error instanceof TimeoutError) {
      return true;
    }

    // Some HTTP errors are retryable (5xx, but not 4xx except 429)
    if (error instanceof HttpError) {
      if (error.status === 429) return true; // Rate limit - can retry after waiting
      if (error.status >= 500 && error.status < 600) return true; // Server errors
      return false; // Client errors are not retryable
    }

    // Rate limit errors are retryable (after waiting)
    if (error instanceof RateLimitError) {
      return true;
    }

    // ApiClientError - check status code if available
    if (error instanceof ApiClientError && error.status) {
      if (error.status === 429) return true;
      if (error.status >= 500 && error.status < 600) return true;
      return false;
    }

    // By default, most application errors are not retryable
    return false;
  }

  /**
   * Creates an enhanced error object with additional context and metadata
   */
  public classifyError(error: Error | ApiClientError): EnhancedApiError {
    const errorCode = this.inferErrorCode(error);
    let message = error.message;
    let apiError: ApiError | undefined;

    // Extract API error if available
    if (error instanceof ApiClientError && error.apiError) {
      apiError = error.apiError;
    }

    // Create or enhance the API error
    const enhancedError: EnhancedApiError = apiError
      ? {
          ...apiError,
          details: apiError.details || {},
        }
      : {
          code: errorCode,
          message: message || "An error occurred during API request",
          details: {},
        };

    // Add HTTP status if available
    if (error instanceof ApiClientError && error.status) {
      enhancedError.httpStatus = error.status;
    } else if (error instanceof HttpError) {
      enhancedError.httpStatus = error.status;
    }

    // Add request info if available
    if (error instanceof HttpError) {
      enhancedError.requestInfo = {
        method: error.method,
        url: error.url,
      };
    }

    // Add detailed information
    enhancedError.details = {
      timestamp: new Date().toISOString(),
      retryable: this.isErrorRetryable(error),
      stack: error.stack,
      context: {},
    };

    enhancedError.originalError = error;

    return enhancedError;
  }

  /**
   * Creates a standardized error response message from different error types
   */
  public formatErrorMessage(error: Error | ApiClientError): string {
    const enhancedError = this.classifyError(error);

    // Start with the error code and message
    let message = `[${enhancedError.code}] ${enhancedError.message}`;

    // Add HTTP status if available
    if (enhancedError.httpStatus) {
      message += ` (HTTP ${enhancedError.httpStatus})`;
    }

    // Add field information for validation errors
    if (enhancedError.field) {
      message += ` - Field: ${enhancedError.field}`;
    }

    return message;
  }
}

// Create a singleton instance for export
export const errorHandler = new ErrorHandler();
