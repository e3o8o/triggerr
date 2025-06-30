/**
 * @file fallback-manager.ts
 * @description This component manages the logic for retries and fallbacks between data sources.
 *
 * When a primary data source fails (e.g., due to an API error or timeout), the
 * FallbackManager determines the next course of action. This could involve an
 * immediate retry, a retry with exponential backoff, or failing over to the next
 * data source in the prioritized list provided by the SourceRouter.
 */

// We will need a generic interface for our data source clients later.
// import type { IApiClient } from '@triggerr/integrations/types';
type ApiClient = any;

interface FallbackOptions {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
}

export class FallbackManager {
  private defaultOptions: FallbackOptions;

  constructor(options?: Partial<FallbackOptions>) {
    this.defaultOptions = {
      maxRetries: 3,
      initialDelayMs: 200,
      backoffFactor: 2,
      ...options,
    };
    console.log("FallbackManager instantiated with options:", this.defaultOptions);
  }

  /**
   * Executes a given data fetching function with a retry/fallback policy.
   * @param {() => Promise<any>} fn - The function to execute (e.g., an API call).
   * @returns {Promise<any>} A promise that resolves with the data if successful, or rejects if all retries fail.
   */
  public async executeWithFallback(fn: () => Promise<any>): Promise<any> {
    let lastError: any;

    for (let i = 0; i < this.defaultOptions.maxRetries; i++) {
      try {
        console.log(`[FallbackManager] Attempt ${i + 1} of ${this.defaultOptions.maxRetries}...`);
        return await fn(); // Attempt the operation
      } catch (error) {
        lastError = error;
        console.warn(`[FallbackManager] Attempt ${i + 1} failed:`, error);
        if (i < this.defaultOptions.maxRetries - 1) {
          const delay = this.defaultOptions.initialDelayMs * Math.pow(this.defaultOptions.backoffFactor, i);
          console.log(`[FallbackManager] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error("[FallbackManager] All retry attempts failed.");
    throw lastError; // Re-throw the last error if all attempts fail
  }
}
