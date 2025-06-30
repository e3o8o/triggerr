// ===========================================================================
// API SDK - CONFIGURATION TYPES
// ===========================================================================

import type { AuthHeaderProvider } from '../auth/types';

/**
 * Retry strategy options for failed requests
 */
export type RetryStrategy = 'none' | 'linear' | 'exponential' | 'custom';

/**
 * HTTP methods supported by the SDK
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Log levels for SDK logging
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger function interface
 */
export type Logger = (level: LogLevel, message: string, context?: any) => void;

/**
 * Environment types for different deployment targets
 */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  attempts: number;
  /** Retry strategy to use */
  strategy: RetryStrategy;
  /** Base delay in milliseconds (used with exponential/linear strategies) */
  baseDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** HTTP status codes that should trigger retries */
  retryableStatusCodes?: number[];
  /** Custom retry function for 'custom' strategy */
  customRetryFn?: (attempt: number, error: any) => number | false;
}

/**
 * Cache configuration for request/response caching
 */
export interface CacheConfig {
  /** Enable/disable caching */
  enabled: boolean;
  /** Default TTL in milliseconds */
  defaultTtl?: number;
  /** Maximum cache size (number of entries) */
  maxSize?: number;
  /** Cache key prefix */
  keyPrefix?: string;
  /** Methods that should be cached */
  cacheableMethods?: HttpMethod[];
  /** Custom cache implementation */
  customCache?: CacheProvider;
}

/**
 * Cache provider interface for custom cache implementations
 */
export interface CacheProvider {
  get(key: string): Promise<any> | any;
  set(key: string, value: any, ttl?: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
  has(key: string): Promise<boolean> | boolean;
}

/**
 * Request interceptor function
 */
export type RequestInterceptor = (
  url: string,
  init: RequestInit
) => Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit };

/**
 * Response interceptor function
 */
export type ResponseInterceptor = (
  response: Response
) => Promise<Response> | Response;

/**
 * Error interceptor function
 */
export type ErrorInterceptor = (error: any) => Promise<any> | any;

/**
 * Interceptor configuration
 */
export interface InterceptorConfig {
  /** Request interceptors (executed in order) */
  request?: RequestInterceptor[];
  /** Response interceptors (executed in order) */
  response?: ResponseInterceptor[];
  /** Error interceptors (executed in order) */
  error?: ErrorInterceptor[];
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Enable/disable rate limiting */
  enabled: boolean;
  /** Maximum requests per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Queue requests when rate limit is exceeded */
  queueWhenLimited?: boolean;
  /** Maximum queue size */
  maxQueueSize?: number;
}

/**
 * Request timeout configuration
 */
export interface TimeoutConfig {
  /** Default request timeout in milliseconds */
  request?: number;
  /** Connection timeout in milliseconds */
  connection?: number;
  /** Response timeout in milliseconds */
  response?: number;
}

/**
 * SDK performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Enable performance tracking */
  enabled: boolean;
  /** Track request duration */
  trackRequestDuration?: boolean;
  /** Track response size */
  trackResponseSize?: boolean;
  /** Track retry attempts */
  trackRetries?: boolean;
  /** Custom performance callback */
  onPerformanceMetric?: (metric: PerformanceMetric) => void;
}

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  /** Metric type */
  type: 'request_duration' | 'response_size' | 'retry_attempt' | 'cache_hit' | 'cache_miss';
  /** Metric value */
  value: number;
  /** Request path */
  path: string;
  /** HTTP method */
  method: HttpMethod;
  /** Timestamp */
  timestamp: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Development/debugging configuration
 */
export interface DebugConfig {
  /** Enable debug mode */
  enabled: boolean;
  /** Log all requests */
  logRequests?: boolean;
  /** Log all responses */
  logResponses?: boolean;
  /** Log request/response bodies */
  logBodies?: boolean;
  /** Log headers */
  logHeaders?: boolean;
  /** Mock responses for testing */
  mockResponses?: Record<string, any>;
}

/**
 * Main SDK configuration interface
 */
export interface ApiSdkConfig {
  /** Base URL for the API */
  baseURL: string;

  /** Authentication provider for generating auth headers */
  authHeaderProvider?: AuthHeaderProvider;

  /** Environment the SDK is running in */
  environment?: Environment;

  /** Default headers to include with all requests */
  defaultHeaders?: Record<string, string>;

  /** Timeout configuration */
  timeout?: number | TimeoutConfig;

  /** Retry configuration */
  retry?: RetryConfig;

  /** Cache configuration */
  cache?: CacheConfig;

  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig;

  /** Interceptor configuration */
  interceptors?: InterceptorConfig;

  /** Performance monitoring configuration */
  performance?: PerformanceConfig;

  /** Debug/development configuration */
  debug?: DebugConfig;

  /** Custom fetch implementation */
  fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

  /** Logger function */
  logger?: Logger;

  /** User agent string */
  userAgent?: string;

  /** API version to use */
  apiVersion?: string;

  /** Custom configuration for specific services */
  serviceConfig?: {
    chat?: Partial<ServiceConfig>;
    insurance?: Partial<ServiceConfig>;
    policy?: Partial<ServiceConfig>;
    user?: Partial<ServiceConfig>;
    wallet?: Partial<ServiceConfig>;
    admin?: Partial<ServiceConfig>;
  };
}

/**
 * Service-specific configuration
 */
export interface ServiceConfig {
  /** Service-specific timeout overrides */
  timeout?: number | TimeoutConfig;

  /** Service-specific retry overrides */
  retry?: RetryConfig;

  /** Service-specific cache overrides */
  cache?: CacheConfig;

  /** Service-specific rate limit overrides */
  rateLimit?: RateLimitConfig;

  /** Service-specific default headers */
  defaultHeaders?: Record<string, string>;

  /** Service-specific base path override */
  basePath?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<ApiSdkConfig> = {
  timeout: 30000, // 30 seconds
  retry: {
    attempts: 3,
    strategy: 'exponential',
    baseDelay: 1000,
    maxDelay: 10000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  },
  cache: {
    enabled: false,
    defaultTtl: 300000, // 5 minutes
    maxSize: 100,
    cacheableMethods: ['GET'],
  },
  rateLimit: {
    enabled: false,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    queueWhenLimited: true,
    maxQueueSize: 50,
  },
  performance: {
    enabled: false,
    trackRequestDuration: true,
    trackResponseSize: false,
    trackRetries: true,
  },
  debug: {
    enabled: false,
    logRequests: false,
    logResponses: false,
    logBodies: false,
    logHeaders: false,
  },
  environment: 'production',
  apiVersion: 'v1',
  userAgent: 'triggerr-sdk/0.1.0',
};

/**
 * Configuration validation utility
 */
export function validateConfig(config: ApiSdkConfig): string[] {
  const errors: string[] = [];

  if (!config.baseURL) {
    errors.push('baseURL is required');
  }

  if (config.baseURL && !isValidUrl(config.baseURL)) {
    errors.push('baseURL must be a valid URL');
  }

  if (config.timeout && typeof config.timeout === 'number' && config.timeout <= 0) {
    errors.push('timeout must be a positive number');
  }

  if (config.retry?.attempts && config.retry.attempts < 0) {
    errors.push('retry.attempts must be non-negative');
  }

  if (config.cache?.maxSize && config.cache.maxSize <= 0) {
    errors.push('cache.maxSize must be positive');
  }

  return errors;
}

/**
 * URL validation utility
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for timeout configuration
 */
export function isTimeoutConfig(timeout: number | TimeoutConfig): timeout is TimeoutConfig {
  return typeof timeout === 'object' && timeout !== null;
}

/**
 * Configuration builder utility
 */
export class ApiSdkConfigBuilder {
  private config: Partial<ApiSdkConfig> = {};

  constructor(baseURL: string) {
    this.config.baseURL = baseURL;
  }

  withAuth(authProvider: AuthHeaderProvider): this {
    this.config.authHeaderProvider = authProvider;
    return this;
  }

  withTimeout(timeout: number | TimeoutConfig): this {
    this.config.timeout = timeout;
    return this;
  }

  withRetry(retry: RetryConfig): this {
    this.config.retry = retry;
    return this;
  }

  withCache(cache: CacheConfig): this {
    this.config.cache = cache;
    return this;
  }

  withLogger(logger: Logger): this {
    this.config.logger = logger;
    return this;
  }

  withEnvironment(env: Environment): this {
    this.config.environment = env;
    return this;
  }

  withDebug(debug: DebugConfig): this {
    this.config.debug = debug;
    return this;
  }

  build(): ApiSdkConfig {
    const errors = validateConfig(this.config as ApiSdkConfig);
    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }

    return {
      ...DEFAULT_CONFIG,
      ...this.config,
    } as ApiSdkConfig;
  }
}
