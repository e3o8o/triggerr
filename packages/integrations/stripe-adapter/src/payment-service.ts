/**
 * Stripe Payment Service
 *
 * Handles all payment-related operations with Stripe including:
 * - Creating checkout sessions for policy purchases
 * - Managing products and prices
 * - Handling one-time payments and subscriptions
 * - Processing refunds and partial refunds
 */

import { stripe, safeStripeCall } from "./client";
import { stripeSettings } from "@triggerr/config";
import type {
  PolicyPurchaseRequest,
  PaymentConfirmation,
} from "@triggerr/api-contracts";

export interface CreateCheckoutSessionParams {
  policyId: string;
  premiumInCents: number;
  customerEmail?: string;
  customerName?: string;
  userId?: string;
  flightDetails?: {
    flightNumber: string;
    airline: string;
    departureDate: string;
    route: string;
  };
  successUrl?: string;
  cancelUrl?: string;
}

export interface StripePurchaseInitiationResponse {
  sessionId: string;
  checkoutUrl: string;
  sessionStatus: string;
  expiresAt: string;
  metadata: {
    policyId: string;
    premiumInCents: number;
    productId: string;
    priceId: string;
  };
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
}

export interface StripePrice {
  id: string;
  productId: string;
  amountInCents: number;
  currency: string;
}

/**
 * Creates or retrieves a Stripe product for insurance policies
 */
export async function createOrGetInsuranceProduct(
  productName?: string,
  description?: string,
): Promise<
  { success: true; product: StripeProduct } | { success: false; error: string }
> {
  const defaultName =
    productName || stripeSettings.products.defaultProductData.name;
  const defaultDescription =
    description || stripeSettings.products.defaultProductData.description;

  // First, try to find an existing product with the same name
  const existingProductsResult = await safeStripeCall(
    () =>
      stripe.products.list({
        active: true,
        limit: 100,
      }),
    "List existing products",
  );

  if (!existingProductsResult.success) {
    return { success: false, error: existingProductsResult.error };
  }

  const existingProduct = existingProductsResult.data.data.find(
    (product) => product.name === defaultName,
  );

  if (existingProduct) {
    return {
      success: true,
      product: {
        id: existingProduct.id,
        name: existingProduct.name,
        description: existingProduct.description || "",
      },
    };
  }

  // Create new product if none exists
  const createProductResult = await safeStripeCall(
    () =>
      stripe.products.create({
        name: defaultName,
        description: defaultDescription,
        type: stripeSettings.products.defaultProductData.type,
        tax_code: stripeSettings.products.defaultProductData.tax_code,
        metadata: {
          category: "insurance",
          type: "flight_insurance",
          created_by: "triggerr",
        },
      }),
    "Create new insurance product",
  );

  if (!createProductResult.success) {
    return { success: false, error: createProductResult.error };
  }

  return {
    success: true,
    product: {
      id: createProductResult.data.id,
      name: createProductResult.data.name,
      description: createProductResult.data.description || "",
    },
  };
}

/**
 * Creates a Stripe price for a specific premium amount
 */
export async function createStripePrice(
  productId: string,
  amountInCents: number,
  currency: string = "usd",
): Promise<
  { success: true; price: StripePrice } | { success: false; error: string }
> {
  const createPriceResult = await safeStripeCall(
    () =>
      stripe.prices.create({
        product: productId,
        unit_amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: {
          created_by: "triggerr",
          amount_cents: amountInCents.toString(),
        },
      }),
    "Create Stripe price",
  );

  if (!createPriceResult.success) {
    return { success: false, error: createPriceResult.error };
  }

  return {
    success: true,
    price: {
      id: createPriceResult.data.id,
      productId: productId,
      amountInCents: amountInCents,
      currency: currency,
    },
  };
}

/**
 * Creates a Stripe checkout session for policy purchase
 */
export async function createPolicyCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<
  | { success: true; data: StripePurchaseInitiationResponse }
  | { success: false; error: string }
> {
  // Validate input
  if (params.premiumInCents <= 0) {
    return { success: false, error: "Premium amount must be greater than 0" };
  }

  if (params.premiumInCents < 50) {
    // Stripe minimum is $0.50
    return { success: false, error: "Premium amount must be at least $0.50" };
  }

  // Create or get product
  const productResult = await createOrGetInsuranceProduct(
    params.flightDetails
      ? `Flight Insurance - ${params.flightDetails.flightNumber}`
      : undefined,
    params.flightDetails
      ? `Insurance coverage for ${params.flightDetails.airline} flight ${params.flightDetails.flightNumber} on ${params.flightDetails.route}`
      : undefined,
  );

  if (!productResult.success) {
    return {
      success: false,
      error: `Failed to create product: ${productResult.error}`,
    };
  }

  // Create price
  const priceResult = await createStripePrice(
    productResult.product.id,
    params.premiumInCents,
  );

  if (!priceResult.success) {
    return {
      success: false,
      error: `Failed to create price: ${priceResult.error}`,
    };
  }

  // Prepare metadata (Stripe has limits on metadata size)
  const metadata: Record<string, string> = {
    policyId: params.policyId,
    premiumInCents: params.premiumInCents.toString(),
    createdBy: "triggerr",
    ...(params.userId && { userId: params.userId }),
    ...(params.flightDetails && {
      flightNumber: params.flightDetails.flightNumber.substring(
        0,
        stripeSettings.metadata.maxValueLength,
      ),
      airline: params.flightDetails.airline.substring(
        0,
        stripeSettings.metadata.maxValueLength,
      ),
      departureDate: params.flightDetails.departureDate,
    }),
  };

  // Create checkout session
  const sessionResult = await safeStripeCall(
    () =>
      stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceResult.price.id,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: params.successUrl || stripeSettings.checkout.successUrl,
        cancel_url: params.cancelUrl || stripeSettings.checkout.cancelUrl,
        metadata: metadata,
        ...(params.customerEmail && {
          customer_email: params.customerEmail,
        }),
        billing_address_collection: "auto",
        shipping_address_collection: {
          allowed_countries: [...stripeSettings.checkout.allowedCountries],
        },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes from now
        allow_promotion_codes: true,
        automatic_tax: {
          enabled: true,
        },
      }),
    "Create checkout session",
  );

  if (!sessionResult.success) {
    return { success: false, error: sessionResult.error };
  }

  const session = sessionResult.data;

  if (!session.url) {
    return {
      success: false,
      error: "Stripe checkout session URL not generated",
    };
  }

  return {
    success: true,
    data: {
      sessionId: session.id,
      checkoutUrl: session.url,
      sessionStatus: session.status || "unknown",
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
      metadata: {
        policyId: params.policyId,
        premiumInCents: params.premiumInCents,
        productId: productResult.product.id,
        priceId: priceResult.price.id,
      },
    },
  };
}

/**
 * Retrieves a checkout session by ID
 */
export async function getCheckoutSession(sessionId: string) {
  return await safeStripeCall(
    () =>
      stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "payment_intent"],
      }),
    `Retrieve checkout session ${sessionId}`,
  );
}

/**
 * Creates a refund for a payment
 */
export async function createRefund(
  paymentIntentId: string,
  amountInCents?: number,
  reason?: "duplicate" | "fraudulent" | "requested_by_customer",
): Promise<{ success: true; refund: any } | { success: false; error: string }> {
  const refundData: any = {
    payment_intent: paymentIntentId,
    reason: reason || "requested_by_customer",
    metadata: {
      created_by: "triggerr",
      refund_date: new Date().toISOString(),
    },
  };

  if (amountInCents !== undefined) {
    refundData.amount = amountInCents;
  }

  const result = await safeStripeCall(
    () => stripe.refunds.create(refundData),
    `Create refund for payment ${paymentIntentId}`,
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, refund: result.data };
}

/**
 * Lists all refunds for a payment intent
 */
export async function listRefunds(paymentIntentId: string) {
  return await safeStripeCall(
    () =>
      stripe.refunds.list({
        payment_intent: paymentIntentId,
        limit: 100,
      }),
    `List refunds for payment ${paymentIntentId}`,
  );
}

/**
 * Utility function to convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Utility function to convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Validates a checkout session for policy purchase
 */
export function validateCheckoutSessionForPolicy(session: any): {
  isValid: boolean;
  policyId?: string;
  premiumInCents?: number;
  error?: string;
} {
  if (!session.metadata?.policyId) {
    return {
      isValid: false,
      error: "No policy ID found in session metadata",
    };
  }

  if (!session.metadata?.premiumInCents) {
    return {
      isValid: false,
      error: "No premium amount found in session metadata",
    };
  }

  const premiumInCents = parseInt(session.metadata.premiumInCents);
  if (isNaN(premiumInCents) || premiumInCents <= 0) {
    return {
      isValid: false,
      error: "Invalid premium amount in session metadata",
    };
  }

  return {
    isValid: true,
    policyId: session.metadata.policyId,
    premiumInCents: premiumInCents,
  };
}

/**
 * Format amount for display
 */
export function formatAmount(
  amountInCents: number,
  currency: string = "USD",
): string {
  const amount = centsToDollars(amountInCents);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}
