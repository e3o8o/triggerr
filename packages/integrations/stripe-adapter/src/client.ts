/**
 * Stripe Client Service
 *
 * Centralized Stripe client initialization and configuration.
 * This module provides a singleton Stripe client instance that can be
 * safely imported and used throughout the application.
 */

import Stripe from 'stripe';
import { stripeConfig, getCurrentStripeEnvironment } from '@triggerr/config';

/**
 * Stripe client instance
 * Initialized as a singleton to ensure consistency across the application
 */
let stripeClient: Stripe | null = null;

/**
 * Initialize and return the Stripe client instance
 */
function initializeStripeClient(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  console.log(`[Stripe Client] Initializing Stripe client for ${getCurrentStripeEnvironment()} environment`);

  stripeClient = new Stripe(stripeConfig.secretKey, {
    apiVersion: stripeConfig.apiVersion as Stripe.LatestApiVersion,
    typescript: true,
    telemetry: false, // Disable telemetry for privacy
    maxNetworkRetries: 3,
    timeout: 10000, // 10 second timeout
    host: 'api.stripe.com',
    protocol: 'https',
    appInfo: {
      name: 'triggerr',
      version: '1.0.0',
      url: 'https://triggerr.com',
    },
  });

  // Test the client initialization
  if (stripeConfig.isTestMode) {
    console.log('[Stripe Client] Using test mode with sandbox keys');
  } else {
    console.log('[Stripe Client] Using live mode with production keys');
  }

  return stripeClient;
}

/**
 * Get the initialized Stripe client
 * This is the main export that should be used throughout the application
 */
export const stripe = initializeStripeClient();

/**
 * Reset the Stripe client (mainly for testing purposes)
 */
export function resetStripeClient(): void {
  stripeClient = null;
  console.log('[Stripe Client] Client instance reset');
}

/**
 * Check if Stripe client is initialized
 */
export function isStripeClientInitialized(): boolean {
  return stripeClient !== null;
}

/**
 * Get Stripe client configuration info (safe for logging)
 */
export function getStripeClientInfo() {
  return {
    isInitialized: isStripeClientInitialized(),
    environment: getCurrentStripeEnvironment(),
    isTestMode: stripeConfig.isTestMode,
    apiVersion: stripeConfig.apiVersion,
  };
}

/**
 * Utility function to safely handle Stripe API calls with error handling
 */
export async function safeStripeCall<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await operation();
    console.log(`[Stripe Client] ${operationName} completed successfully`);
    return { success: true, data };
  } catch (error) {
    console.error(`[Stripe Client] ${operationName} failed:`, error);

    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: `Stripe ${error.type}: ${error.message}`,
      };
    }

    return {
      success: false,
      error: (error as Error).message || 'Unknown error occurred',
    };
  }
}

/**
 * Type exports for convenience
 */
export type StripeInstance = typeof stripe;
export type { Stripe };

// Export Stripe error types for error handling
export const StripeErrors = Stripe.errors;
