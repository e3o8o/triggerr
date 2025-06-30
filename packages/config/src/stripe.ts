/**
 * Stripe Configuration
 *
 * Centralized configuration for Stripe integration including API keys,
 * webhook secrets, and environment-specific settings.
 */

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  isTestMode: boolean;
  apiVersion: string;
}

// Test keys for development/sandbox environment (from .env)
const TEST_PUBLISHABLE_KEY = process.env.TEST_PUBLISHABLE_KEY || 'pk_test_51RTwKbQp5AIEchPoopPhZS5qIXyGhQqiSCZHynImUnXQiamOAEBVfD9Z4iVSeiGRoLjneDaqlJzQ9sCF6bhUprrb00cLmEmbIC';
const TEST_SECRET_KEY = process.env.TEST_SECRET_KEY || 'sk_test_51RTwKbQp5AIEchPor3750aq2aMAvJ0qB7pHQPC7SR7Jd5Fi5X8tECW1YgNauf1xiowtzi9XTzyck508VrNHLjqXQ00B7cO02kZ';

/**
 * Determines if we're in test mode based on the secret key
 */
function isTestMode(secretKey: string): boolean {
  return secretKey.startsWith('sk_test_');
}

/**
 * Validates that required Stripe configuration is present
 */
function validateStripeConfig(config: Partial<StripeConfig>): asserts config is StripeConfig {
  if (!config.secretKey) {
    throw new Error('Stripe secret key is required');
  }

  if (!config.publishableKey) {
    throw new Error('Stripe publishable key is required');
  }

  if (!config.webhookSecret) {
    throw new Error('Stripe webhook secret is required');
  }

  // Validate key consistency (both should be test or both should be live)
  const secretIsTest = config.secretKey.startsWith('sk_test_');
  const publishableIsTest = config.publishableKey.startsWith('pk_test_');

  if (secretIsTest !== publishableIsTest) {
    throw new Error('Stripe key mismatch: secret and publishable keys must both be test or both be live');
  }
}

/**
 * Creates Stripe configuration from environment variables with fallbacks
 */
function createStripeConfig(): StripeConfig {
  const secretKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY || TEST_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || TEST_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_default';

  const config: StripeConfig = {
    secretKey,
    publishableKey,
    webhookSecret,
    isTestMode: isTestMode(secretKey),
    apiVersion: '2024-06-20', // Latest Stripe API version
  };

  validateStripeConfig(config);

  return config;
}

/**
 * Global Stripe configuration instance
 */
export const stripeConfig = createStripeConfig();

/**
 * Environment-specific settings
 */
export const stripeSettings = {
  // Checkout session settings
  checkout: {
    successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
    cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/cancel',
    // Allowed countries for checkout
    allowedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK'],
  },

  // Product settings
  products: {
    // Default product settings for insurance policies
    defaultProductData: {
      name: 'Flight Insurance Policy',
      description: 'Parametric flight insurance coverage',
      type: 'service' as const,
      tax_code: 'txcd_99999999', // Generic service tax code
    },
  },

  // Webhook settings
  webhooks: {
    // Events we want to listen for
    enabledEvents: [
      'checkout.session.completed',
      'checkout.session.expired',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ],
  },

  // Retry and timeout settings
  retries: {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
  },

  // Metadata settings
  metadata: {
    // Maximum metadata size per Stripe's limits
    maxValueLength: 500,
    maxKeyLength: 40,
  },
} as const;

/**
 * Helper function to get Stripe configuration for specific environments
 */
export function getStripeConfigForEnv(environment: 'development' | 'staging' | 'production' = 'development'): StripeConfig {
  if (environment === 'production') {
    // In production, we require live keys to be explicitly set
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!secretKey || !publishableKey) {
      throw new Error('Production Stripe keys must be explicitly set via environment variables');
    }

    if (secretKey.startsWith('sk_test_') || publishableKey.startsWith('pk_test_')) {
      throw new Error('Cannot use test keys in production environment');
    }
  }

  return stripeConfig;
}

/**
 * Type exports for use in other modules
 */
export type StripeApiVersion = typeof stripeConfig.apiVersion;
export type StripeEnvironment = 'test' | 'live';

/**
 * Utility to determine current Stripe environment
 */
export const getCurrentStripeEnvironment = (): StripeEnvironment => {
  return stripeConfig.isTestMode ? 'test' : 'live';
};
