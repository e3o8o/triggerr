/**
 * Stripe Integration Package
 *
 * This package provides a complete Stripe integration for the triggerr platform,
 * including payment processing, webhook handling, and related utilities.
 *
 * Main features:
 * - Stripe client initialization and configuration
 * - Policy payment checkout session creation
 * - Webhook event handling for payment confirmations
 * - Refund and dispute management
 * - Payment utilities and formatting
 *
 * @package @triggerr/stripe
 * @version 1.0.0
 */

// ============================================================================
// CLIENT EXPORTS
// ============================================================================

export {
  stripe,
  safeStripeCall,
  getStripeClientInfo,
  resetStripeClient,
  isStripeClientInitialized,
  StripeErrors,
} from './client';

export type {
  StripeInstance,
  Stripe,
} from './client';

// ============================================================================
// PAYMENT SERVICE EXPORTS
// ============================================================================

export {
  createPolicyCheckoutSession,
  createOrGetInsuranceProduct,
  createStripePrice,
  getCheckoutSession,
  createRefund,
  listRefunds,
  dollarsToCents,
  centsToDollars,
  validateCheckoutSessionForPolicy,
  formatAmount,
} from './payment-service';

export type {
  CreateCheckoutSessionParams,
  StripeProduct,
  StripePrice,
} from './payment-service';

// Import functions for StripeIntegration class
import { createPolicyCheckoutSession } from './payment-service';
import { handleStripeWebhookEvent, verifyStripeWebhook } from './webhook-handler';
import { getStripeClientInfo } from './client';
import { formatAmount } from './payment-service';
import type { CreateCheckoutSessionParams } from './payment-service';

// ============================================================================
// WEBHOOK HANDLER EXPORTS
// ============================================================================

export {
  verifyStripeWebhook,
  handleStripeWebhookEvent,
  shouldProcessEvent,
  updateWebhookStats,
  getWebhookStats,
  resetWebhookStats,
} from './webhook-handler';

export type {
  WebhookEventResult,
} from './webhook-handler';

// ============================================================================
// CONFIGURATION EXPORTS
// ============================================================================

export {
  stripeConfig,
  stripeSettings,
  getStripeConfigForEnv,
  getCurrentStripeEnvironment,
} from '@triggerr/config';

export type {
  StripeConfig,
  StripeApiVersion,
  StripeEnvironment,
} from '@triggerr/config';

// ============================================================================
// CONVENIENCE EXPORTS & UTILITIES
// ============================================================================

/**
 * Main Stripe integration class that combines all functionality
 */
export class StripeIntegration {
  /**
   * Create a checkout session for policy purchase
   */
  static async createPolicyCheckout(params: CreateCheckoutSessionParams) {
    return createPolicyCheckoutSession(params);
  }

  /**
   * Handle a webhook event
   */
  static async handleWebhookEvent(event: Stripe.Event) {
    return handleStripeWebhookEvent(event);
  }

  /**
   * Verify a webhook signature and construct event
   */
  static verifyWebhook(payload: string | Buffer, signature: string, secret: string) {
    return verifyStripeWebhook(payload, signature, secret);
  }

  /**
   * Get current Stripe client information
   */
  static getClientInfo() {
    return getStripeClientInfo();
  }

  /**
   * Format amount for display
   */
  static formatAmount(amountInCents: number, currency = 'USD') {
    return formatAmount(amountInCents, currency);
  }

  /**
   * Convert dollars to cents
   */
  static dollarsToCents(dollars: number): number {
    return Math.round(dollars * 100);
  }

  /**
   * Convert cents to dollars
   */
  static centsToDollars(cents: number): number {
    return cents / 100;
  }
}

// ============================================================================
// TYPE RE-EXPORTS FOR CONVENIENCE
// ============================================================================

// Re-export commonly used Stripe types
import type { Stripe } from './client';

export type StripeCheckoutSession = Stripe.Checkout.Session;
export type StripePaymentIntent = Stripe.PaymentIntent;
export type StripeEvent = Stripe.Event;
export type StripeCustomer = Stripe.Customer;
export type StripeInvoice = Stripe.Invoice;
export type StripeSubscription = Stripe.Subscription;
export type StripeRefund = Stripe.Refund;
export type StripeDispute = Stripe.Dispute;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Stripe API constants
 */
export const STRIPE_CONSTANTS = {
  MIN_CHARGE_AMOUNT_CENTS: 50, // $0.50 minimum
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_METADATA_KEY_LENGTH: 40,
  MAX_METADATA_VALUE_LENGTH: 500,
  CHECKOUT_SESSION_EXPIRY_MINUTES: 30,
} as const;

/**
 * Common Stripe error codes
 */
export const STRIPE_ERROR_CODES = {
  CARD_DECLINED: 'card_declined',
  EXPIRED_CARD: 'expired_card',
  INCORRECT_CVC: 'incorrect_cvc',
  PROCESSING_ERROR: 'processing_error',
  INCORRECT_NUMBER: 'incorrect_number',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
} as const;

/**
 * Policy-specific payment metadata keys
 */
export const POLICY_METADATA_KEYS = {
  POLICY_ID: 'policyId',
  PREMIUM_IN_CENTS: 'premiumInCents',
  USER_ID: 'userId',
  FLIGHT_NUMBER: 'flightNumber',
  AIRLINE: 'airline',
  DEPARTURE_DATE: 'departureDate',
  CREATED_BY: 'createdBy',
} as const;

// ============================================================================
// VERSION & PACKAGE INFO
// ============================================================================

export const PACKAGE_INFO = {
  name: '@triggerr/stripe',
  version: '1.0.0',
  description: 'Stripe integration for triggerr platform',
  features: [
    'Payment processing',
    'Webhook handling',
    'Refund management',
    'Subscription support (future)',
    'Comprehensive error handling',
    'Type-safe API',
  ],
} as const;
