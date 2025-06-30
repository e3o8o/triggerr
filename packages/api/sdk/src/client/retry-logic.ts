// ===========================================================================
// API SDK - RETRY LOGIC & STRATEGIES
// ===========================================================================

import { errorHandler } from './error-handler';
import type { EnhancedApiError } from './error-handler';

// ===========================================================================
// RETRY CONFIGURATION TYPES
// ===========================================================================

/**
 * Backoff strategy for retry delays
 */
export type BackoffStrategy =
  | 'linear'      // Linear increase
  | 'exponential' // Exponential increase (default)
  | 'fixed'       // Fixed delay
  | 'none';       // No delay between retries

/**
 * Condition that determines if a request should be retried
 */
export type RetryCondition =
  | 'on_error'    // Retry on errors determined by error classification
  | 'on_status'   // Retry on specific HTTP status codes
  | 'always'      // Always retry up to max attempts
  | 'custom';     // Custom condition function

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxAttempts: number;             // Maximum number of retry attempts
  condition: RetryCondition;       // When to retry
  backoffStrategy: BackoffStrategy; // How to calculate delay between retries
  baseDelay: number;               // Base delay in milliseconds
  maxDelay?: number | undefined;   // Maximum delay in milliseconds
  statusCodesToRetry?: number[] | undefined;   // HTTP status codes to retry if condition is 'on_status'
  customCondition?: ((error: any, attempt: number) => boolean) | undefined; // Custom retry condition
  timeout?: number | undefined;    // Timeout for each attempt in milliseconds
  onRetry?: ((error: any, attempt: number, delayMs: number) => void) | undefined; // Callback on retry
  circuitBreaker?: CircuitBreakerConfig | undefined; // Circuit breaker configuration
}

/**
 * Configuration for circuit breaker
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;     // Number of failures before opening circuit
  resetTimeoutMs: number;       // Time to wait before trying again
  halfOpenSuccessThreshold: number; // Successes needed in half-open state to close
  monitoringPeriodMs: number;   // Time window for counting failures
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  success: boolean;
  data: T;
  error?: EnhancedApiError;
  attempts: number;
  totalDelayMs: number;
  circuitBreakerTripped?: boolean | undefined;
}

/**
 * Information about a retry attempt
 */
export interface RetryAttempt {
  timestamp: number;
  error?: EnhancedApiError;
  delayMs?: number;
}

// ===========================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// ===========================================================================

/**
 * Circuit breaker implementation to prevent repeated calls to failing services
 */
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Determines if a request can be executed based on circuit state
   */
  public canExecute(): boolean {
    const now = Date.now();

    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      // Check if it's time to try again
      if (now >= this.nextAttemptTime) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }

    if (this.state === 'half-open') {
      // In half-open state, we allow limited requests
      return true;
    }

    return true;
  }

  /**
   * Records a successful request
   */
  public recordSuccess(): void {
    if (this.state === 'half-open') {
      this.failures = 0;
      this.state = 'closed';
    }
  }

  /**
   * Records a failed request
   */
  public recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;

    if (this.state === 'half-open') {
      this.state = 'open';
      this.nextAttemptTime = now + this.config.resetTimeoutMs;
      return;
    }

    this.failures++;
    if (this.state === 'closed' && this.failures >= this.config.failureThreshold) {
      this.state = 'open';
      this.nextAttemptTime = now + this.config.resetTimeoutMs;
    }
  }

  /**
   * Gets the current state of the circuit
   */
  public getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  /**
   * Gets circuit breaker metrics
   */
  public getMetrics(): {
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    lastFailureTime: number;
    nextAttemptTime: number;
    remainingTimeMs: number;
  } {
    const now = Date.now();
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      remainingTimeMs: Math.max(0, this.nextAttemptTime - now),
    };
  }

  /**
   * Resets the circuit breaker to its initial state
   */
  public reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
}

// ===========================================================================
// BACKOFF CALCULATION
// ===========================================================================

/**
 * Calculates backoff delays based on different strategies
 */
export class BackoffCalculator {
  public static calculate(
    attempt: number,
    baseDelay: number,
    maxDelay: number | undefined,
    strategy: BackoffStrategy
  ): number {
    // Always return 0 for the first attempt (which is number 1)
    if (attempt <= 1) {
      return 0;
    }

    let delay: number;

    switch (strategy) {
      case 'none':
        delay = 0;
        break;

      case 'fixed':
        delay = baseDelay;
        break;

      case 'linear':
        // Linear: baseDelay * attemptNumber
        delay = baseDelay * (attempt - 1);
        break;

      case 'exponential':
      default:
        // Exponential: baseDelay * 2^(attemptNumber-1)
        // Example: 100ms, 200ms, 400ms, 800ms, etc.
        delay = baseDelay * Math.pow(2, attempt - 2);
        break;
    }

    // Add small random jitter (±10%) to prevent thundering herd
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    delay = Math.max(0, delay + jitter);

    // Apply maxDelay if specified
    if (maxDelay !== undefined && maxDelay > 0) {
      delay = Math.min(delay, maxDelay);
    }

    return Math.round(delay);
  }
}

// ===========================================================================
// RETRY POLICY IMPLEMENTATION
// ===========================================================================

/**
 * Main retry policy class that handles retry logic
 */
export class RetryPolicy {
  private config: RetryConfig;
  private circuitBreaker?: CircuitBreaker;
  private attempts: RetryAttempt[] = [];

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = this.mergeWithDefaults(config);

    // Initialize circuit breaker if enabled
    if (this.config.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
    }
  }

  /**
   * Executes an operation with retry logic
   */
  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Reset attempts array for this execution
    this.attempts = [];
    // Track total delay time
    let totalDelay = 0;
    let lastError: any = null;

    // Check circuit breaker before starting
    if (this.circuitBreaker && !this.circuitBreaker.canExecute()) {
      const error = new Error('Circuit breaker is open due to multiple failures');
      error.name = 'CircuitBreakerOpenError';
      throw error;
    }

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      // Create a new retry attempt record
      const retryAttempt: RetryAttempt = {
        timestamp: Date.now()
      };
      this.attempts.push(retryAttempt);

      try {
        // Execute the operation with timeout if configured
        let result: T;
        if (this.config.timeout && this.config.timeout > 0) {
          result = await this.executeWithTimeout(operation, this.config.timeout);
        } else {
          result = await operation();
        }

        // Record success to circuit breaker
        if (this.circuitBreaker) {
          this.circuitBreaker.recordSuccess();
        }

        return result;
      } catch (error) {
        // Record the error in the attempt
        lastError = error;
        retryAttempt.error = errorHandler.classifyError(error instanceof Error ? error : new Error(String(error)));

        // Record failure in circuit breaker
        if (this.circuitBreaker) {
          this.circuitBreaker.recordFailure();
        }

        // Last attempt - don't retry, just throw
        if (attempt >= this.config.maxAttempts) {
          throw error;
        }

        // Determine if we should retry
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        // Calculate and apply backoff delay
        const delay = this.calculateDelay(error, attempt);
        retryAttempt.delayMs = delay;
        totalDelay += delay;

        // Call retry callback
        if (this.config.onRetry) {
          try {
            this.config.onRetry(error, attempt, delay);
          } catch (callbackError) {
            // Ignore errors in the callback
          }
        }

        // Wait for the delay before the next attempt
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // This should not be reached if config.maxAttempts > 0
    // because the last attempt will either return or throw
    throw lastError || new Error('Maximum retry attempts reached');
  }

  /**
   * Returns all retry attempts made during the last execute() call
   */
  public getAttempts(): RetryAttempt[] {
    return [...this.attempts];
  }

  /**
   * Gets circuit breaker metrics
   */
  public getCircuitBreakerMetrics() {
    return this.circuitBreaker?.getMetrics();
  }

  /**
   * Resets the retry policy state
   */
  public reset(): void {
    this.attempts = [];
    this.circuitBreaker?.reset();
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Executes an operation with a timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;
      let completed = false;

      // Create timeout error
      const timeoutError = new Error(`Operation timed out after ${timeoutMs}ms`);
      timeoutError.name = 'TimeoutError';

      // Set timeout
      timeoutId = setTimeout(() => {
        if (!completed) {
          completed = true;
          reject(timeoutError);
        }
      }, timeoutMs);

      // Execute operation
      operation()
        .then((result) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutId);
            resolve(result);
          }
        })
        .catch((error) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeoutId);
            reject(error);
          }
        });
    });
  }

  /**
   * Determines if a request should be retried based on the error and attempt number
   */
  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // Check circuit breaker
    if (this.circuitBreaker && !this.circuitBreaker.canExecute()) {
      return false;
    }

    switch (this.config.condition) {
      case 'always':
        return true;

      case 'on_status':
        // Retry based on status code
        const status = error?.status || error?.statusCode || error?.response?.status;
        return status && this.config.statusCodesToRetry?.includes(status) || false;

      case 'on_error':
        // Use error handler to determine if error is retryable
        return errorHandler.isErrorRetryable(error);

      case 'custom':
        // Use custom condition function
        return this.config.customCondition?.(error, attempt) || false;

      default:
        return false;
    }
  }

  /**
   * Calculates the delay for the next retry
   */
  private calculateDelay(_error: any, attempt: number): number {
    return BackoffCalculator.calculate(
      attempt,
      this.config.baseDelay,
      this.config.maxDelay,
      this.config.backoffStrategy
    );
  }

  /**
   * Merges user config with defaults
   */
  private mergeWithDefaults(config: Partial<RetryConfig>): RetryConfig {
    const defaults: RetryConfig = {
      maxAttempts: config.maxAttempts ?? 3,
      condition: config.condition ?? 'on_error',
      backoffStrategy: config.backoffStrategy ?? 'exponential',
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      statusCodesToRetry: config.statusCodesToRetry ?? [408, 429, 500, 502, 503, 504],
      customCondition: config.customCondition ?? undefined,
      timeout: config.timeout ?? undefined,
      onRetry: config.onRetry ?? undefined,
      circuitBreaker: config.circuitBreaker ?? undefined,
    };
    return defaults;
  }
}

// ===========================================================================
// RETRY POLICY PRESETS
// ===========================================================================

/**
 * Factory for creating retry policies with common configurations
 */
export class RetryPolicies {
  /**
   * Conservative retry policy (few retries, long delays)
   * Good for non-critical operations where retries might be expensive
   */
  public static conservative(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 2,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 10000,
      condition: 'on_status',
      statusCodesToRetry: [408, 429, 500, 502, 503, 504],
    });
  }

  /**
   * Standard retry policy (balanced approach)
   * Good default for most API operations
   */
  public static standard(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      baseDelay: 300,
      maxDelay: 10000,
      condition: 'on_error',
    });
  }

  /**
   * Aggressive retry policy (many retries, shorter delays)
   * Good for critical operations that must succeed
   */
  public static aggressive(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 5,
      backoffStrategy: 'exponential',
      baseDelay: 100,
      maxDelay: 5000,
      condition: 'on_error',
    });
  }

  /**
   * No retry policy
   */
  public static none(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 1,
      backoffStrategy: 'none',
      baseDelay: 0,
      condition: 'on_error',
    });
  }

  /**
   * Creates a retry policy with circuit breaker
   */
  public static withCircuitBreaker(config: Partial<RetryConfig> = {}): RetryPolicy {
    return new RetryPolicy({
      ...config,
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeoutMs: 30000, // 30 seconds
        halfOpenSuccessThreshold: 1,
        monitoringPeriodMs: 120000, // 2 minutes
      } as CircuitBreakerConfig,
    });
  }
}

// ===========================================================================
// UTILITY FUNCTIONS
// ===========================================================================

/**
 * Helper function to retry an operation
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const policy = new RetryPolicy(config);
  return policy.execute(operation);
}

/**
 * Higher-order function that wraps a function with retry logic
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  const policy = new RetryPolicy(config);

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return policy.execute(() => fn(...args));
  }) as T;
}

/**
 * Creates an exponential backoff function
 */
export function exponentialBackoff(
  baseDelay: number = 100,
  maxDelay: number = 10000
): (attempt: number) => number {
  return (attempt: number) => {
    const delay = Math.min(
      maxDelay,
      baseDelay * Math.pow(2, attempt - 1)
    );
    return delay;
  };
}

/**
 * Creates a linear backoff function
 */
export function linearBackoff(
  baseDelay: number = 100,
  increment: number = 100,
  maxDelay: number = 10000
): (attempt: number) => number {
  return (attempt: number) => {
    const delay = Math.min(
      maxDelay,
      baseDelay + (attempt - 1) * increment
    );
    return delay;
  };
}
