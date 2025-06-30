// ===========================================================================
// API SDK - HTTP CLIENT
// ===========================================================================

import { ApiClient, ApiClientConfig, ApiClientError } from './index';
import { errorHandler } from './error-handler';
import { RetryPolicy, RetryConfig, RetryPolicies } from './retry-logic';
import type { ApiResponse } from '@triggerr/api-contracts';
import type { CacheManager } from '../utils';
import { createLogger, type LogLevel } from '../utils';

// ===========================================================================
// HTTP CLIENT CONFIGURATION
// ===========================================================================

export interface HttpClientConfig extends ApiClientConfig {
  /**
   * Retry configuration for failed requests
   */
  retry?: Partial<RetryConfig> | false;

  /**
   * Cache configuration
   */
  cache?: {
    enabled: boolean;
    manager?: CacheManager;
    defaultTtl?: number; // Time to live in milliseconds
  };

  /**
   * Debug mode configuration
   */
  debug?: {
    enabled: boolean;
    logLevel?: LogLevel;
  };
}

// ===========================================================================
// HTTP CLIENT IMPLEMENTATION
// ===========================================================================

export class HttpClient {
  private apiClient: ApiClient;
  private retryPolicy?: RetryPolicy;
  private cacheManager?: CacheManager;
  private logger: ReturnType<typeof createLogger>;
  private config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
    this.apiClient = new ApiClient(config);

    // Initialize logger
    this.logger = createLogger({
      enabled: config.debug?.enabled ?? false,
      level: config.debug?.logLevel ?? 'info',
      prefix: '[HttpClient]'
    });

    // Initialize retry policy if configured
    if (config.retry !== false) {
      this.retryPolicy = config.retry ?
        new RetryPolicy(config.retry) :
        RetryPolicies.standard();
      this.logger.debug('Retry policy initialized', this.retryPolicy);
    }

    // Initialize cache manager if enabled
    if (config.cache?.enabled && config.cache.manager) {
      this.cacheManager = config.cache.manager;
      this.logger.debug('Cache manager initialized', {
        defaultTtl: config.cache.defaultTtl,
      });
    }
  }

  /**
   * Executes an HTTP request with retry, caching, and error handling
   */
  private async executeRequest<TResponse, TRequest = undefined>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options?: {
      body?: TRequest;
      queryParams?: Record<string, string | number | boolean | undefined> | undefined;
      headers?: Record<string, string> | undefined;
      skipCache?: boolean;
      cacheTtl?: number;
    }
  ): Promise<ApiResponse<TResponse>> {
    const cacheKey = this.getCacheKey(method, path, options?.queryParams);
    const useCache = method === 'GET' && this.cacheManager && !options?.skipCache;

    // Try to get from cache first
    if (useCache && this.cacheManager) {
      try {
        const cachedResponse = await this.cacheManager.get<ApiResponse<TResponse>>(cacheKey);
        if (cachedResponse) {
          this.logger.debug('Cache hit', { method, path, cacheKey });
          return cachedResponse;
        }
      } catch (error) {
        this.logger.warn('Cache retrieval failed', { error, cacheKey });
      }
    }

    // Execute with retry if configured
    try {
      // Execute the request with or without retry
      const response = this.retryPolicy ?
        // With retry policy
        await this.retryPolicy.execute(() => {
          const requestOptions: {
            body?: TRequest;
            queryParams?: Record<string, string | number | boolean | undefined>;
            headers?: Record<string, string>;
          } = {};

          if (options?.body !== undefined) {
            requestOptions.body = options.body as TRequest;
          }

          if (options?.queryParams) {
            requestOptions.queryParams = options.queryParams;
          }

          if (options?.headers) {
            requestOptions.headers = options.headers;
          }

          return this.apiClient.request<TResponse, TRequest>(method, path, requestOptions);
        }) :
        // Without retry policy
        await this.apiClient.request<TResponse, TRequest>(
          method,
          path,
          options ? {
            ...(options.body !== undefined ? { body: options.body as TRequest } : {}),
            ...(options.queryParams ? { queryParams: options.queryParams } : {}),
            ...(options.headers ? { headers: options.headers } : {})
          } : undefined
        );

      // Store successful response in cache if applicable
      if (useCache && response.success && this.cacheManager) {
        try {
          const ttl = options?.cacheTtl || this.config.cache?.defaultTtl || 60000; // Default 1 minute
          await this.cacheManager.set(cacheKey, response, ttl);
          this.logger.debug('Cached response', { method, path, cacheKey, ttl });
        } catch (error) {
          this.logger.warn('Cache storage failed', { error, cacheKey });
        }
      }

      return response;
    } catch (error) {
      // Handle and enhance error
      const enhancedError = this.handleRequestError(error, method, path);
      throw enhancedError;
    }
  }

  /**
   * Handles and enhances API client errors
   */
  private handleRequestError(error: unknown, method: string, path: string): Error {
    // If it's already an ApiClientError, enhance it
    if (error instanceof ApiClientError) {
      const enhancedError = errorHandler.classifyError(error);
      this.logger.error('API request failed', {
        method,
        path,
        status: error.status,
        errorCode: enhancedError.code,
        message: enhancedError.message,
      });
      return error;
    }

    // For other errors, wrap them in ApiClientError
    const wrappedError = new ApiClientError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined, // status
      {
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    );

    this.logger.error('Request failed with unexpected error', {
      method,
      path,
      error,
    });

    return wrappedError;
  }

  /**
   * Generates a cache key for a request
   */
  private getCacheKey(
    method: string,
    path: string,
    queryParams?: Record<string, string | number | boolean | undefined>
  ): string {
    let key = `${method}:${path}`;

    if (queryParams && Object.keys(queryParams).length > 0) {
      // Sort query params to ensure consistent cache keys regardless of param order
      const sortedParams = Object.entries(queryParams)
        .filter(([, value]) => value !== undefined)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      key += `?${sortedParams}`;
    }

    return key;
  }

  /**
   * Invalidates cache for a specific request or pattern
   */
  public async invalidateCache(pattern: string): Promise<void> {
    if (!this.cacheManager) {
      return;
    }

    try {
      await this.cacheManager.invalidate(pattern);
      this.logger.debug('Cache invalidated', { pattern });
    } catch (error) {
      this.logger.warn('Cache invalidation failed', { error, pattern });
    }
  }

  /**
   * Clears the entire cache
   */
  public async clearCache(): Promise<void> {
    if (!this.cacheManager) {
      return;
    }

    try {
      await this.cacheManager.clear();
      this.logger.debug('Cache cleared');
    } catch (error) {
      this.logger.warn('Cache clearing failed', { error });
    }
  }

  // ===========================================================================
  // HTTP METHOD IMPLEMENTATIONS
  // ===========================================================================

  /**
   * Performs an HTTP GET request
   */
  public async get<TResponse>(
    path: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
    options?: {
      headers?: Record<string, string>;
      skipCache?: boolean;
      cacheTtl?: number;
    }
  ): Promise<ApiResponse<TResponse>> {
    const requestOptions: {
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      skipCache?: boolean;
      cacheTtl?: number;
    } = {};

    if (queryParams) {
      requestOptions.queryParams = queryParams;
    }

    if (options?.headers) {
      requestOptions.headers = options.headers;
    }

    if (options?.skipCache !== undefined) {
      requestOptions.skipCache = options.skipCache;
    }

    if (options?.cacheTtl !== undefined) {
      requestOptions.cacheTtl = options.cacheTtl;
    }

    return this.executeRequest<TResponse>('GET', path, requestOptions);
  }

  /**
   * Performs an HTTP POST request
   */
  public async post<TResponse, TRequest>(
    path: string,
    body: TRequest,
    queryParams?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<TResponse>> {
    const requestOptions: {
      body: TRequest;
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      skipCache: boolean;
    } = {
      body,
      skipCache: true // Always skip cache for POST
    };

    if (queryParams) {
      requestOptions.queryParams = queryParams;
    }

    if (headers) {
      requestOptions.headers = headers;
    }

    return this.executeRequest<TResponse, TRequest>('POST', path, requestOptions);
  }

  /**
   * Performs an HTTP PUT request
   */
  public async put<TResponse, TRequest>(
    path: string,
    body: TRequest,
    queryParams?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<TResponse>> {
    const requestOptions: {
      body: TRequest;
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      skipCache: boolean;
    } = {
      body,
      skipCache: true // Always skip cache for PUT
    };

    if (queryParams) {
      requestOptions.queryParams = queryParams;
    }

    if (headers) {
      requestOptions.headers = headers;
    }

    return this.executeRequest<TResponse, TRequest>('PUT', path, requestOptions);
  }

  /**
   * Performs an HTTP PATCH request
   */
  public async patch<TResponse, TRequest>(
    path: string,
    body: TRequest,
    queryParams?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<TResponse>> {
    const requestOptions: {
      body: TRequest;
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      skipCache: boolean;
    } = {
      body,
      skipCache: true // Always skip cache for PATCH
    };

    if (queryParams) {
      requestOptions.queryParams = queryParams;
    }

    if (headers) {
      requestOptions.headers = headers;
    }

    return this.executeRequest<TResponse, TRequest>('PATCH', path, requestOptions);
  }

  /**
   * Performs an HTTP DELETE request
   */
  public async delete<TResponse>(
    path: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<TResponse>> {
    const requestOptions: {
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      skipCache: boolean;
    } = {
      skipCache: true // Always skip cache for DELETE
    };

    if (queryParams) {
      requestOptions.queryParams = queryParams;
    }

    if (headers) {
      requestOptions.headers = headers;
    }

    return this.executeRequest<TResponse>('DELETE', path, requestOptions);
  }
}

/**
 * Creates an HttpClient with default configuration
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
