/**
 * Stripe Webhook Handler Service
 *
 * Handles all incoming Stripe webhook events including:
 * - checkout.session.completed (policy activation)
 * - payment_intent.succeeded/failed
 * - invoice events for subscriptions
 * - refund events
 */

import { stripe } from "./client";
import {
  validateCheckoutSessionForPolicy,
  getCheckoutSession,
} from "./payment-service";
import { stripeConfig, stripeSettings } from "@triggerr/config";
import { edgeDb } from "@triggerr/core/database/edge";
import { policy, policyEvent, payout } from "@triggerr/core/database/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export interface WebhookEventResult {
  success: boolean;
  message: string;
  policyId?: string;
  eventType?: string;
  error?: string;
}

/**
 * Verifies and constructs a Stripe event from webhook payload
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string,
): { success: true; event: Stripe.Event } | { success: false; error: string } {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
    console.log(`[Stripe Webhook] Successfully verified event: ${event.type}`);
    return { success: true, event };
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Signature verification failed",
    };
  }
}

/**
 * Handles checkout.session.completed events
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<WebhookEventResult> {
  console.log(
    `[Stripe Webhook] Processing checkout.session.completed for session: ${session.id}`,
  );

  // Validate the session contains our required metadata
  const validation = validateCheckoutSessionForPolicy(session);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.error || "Invalid session data",
      error: validation.error,
    };
  }

  const { policyId, premiumInCents } = validation;

  try {
    // Find the policy in our database
    const policyRecord = await edgeDb.query.policy.findFirst({
      where: eq(policy.id, policyId!),
    });

    if (!policyRecord) {
      console.error(`[Stripe Webhook] Policy ${policyId} not found`);
      return {
        success: false,
        message: `Policy ${policyId} not found`,
        policyId,
        error: "Policy not found",
      };
    }

    // Check if policy is already active
    if (policyRecord.status === "ACTIVE") {
      console.log(`[Stripe Webhook] Policy ${policyId} is already active`);
      return {
        success: true,
        message: `Policy ${policyId} already active`,
        policyId,
        eventType: "already_active",
      };
    }

    // Update policy status to ACTIVE
    await edgeDb
      .update(policy)
      .set({
        status: "ACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(policy.id, policyId!));

    // Create policy events for audit trail
    const eventData = {
      stripeSessionId: session.id,
      paymentIntent: session.payment_intent,
      amountPaid: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_email,
      paymentStatus: session.payment_status,
    };

    await edgeDb.insert(policyEvent).values([
      {
        policyId: policyId!,
        type: "PAYMENT_RECEIVED",
        notes: `Stripe payment successful. Session: ${session.id}, Amount: ${session.amount_total} ${session.currency?.toUpperCase()}`,
        data: eventData,
        createdAt: new Date(),
      },
      {
        policyId: policyId!,
        type: "POLICY_ACTIVATED",
        notes: "Policy activated after payment confirmation.",
        data: {
          activationTime: new Date().toISOString(),
          paymentMethod: "stripe",
          sessionId: session.id,
        },
        createdAt: new Date(),
      },
    ]);

    console.log(`[Stripe Webhook] Successfully activated policy ${policyId}`);

    return {
      success: true,
      message: `Policy ${policyId} activated successfully`,
      policyId,
      eventType: "policy_activated",
    };
  } catch (error) {
    console.error(
      `[Stripe Webhook] Database error handling checkout.session.completed:`,
      error,
    );
    return {
      success: false,
      message: "Database update failed",
      policyId,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

/**
 * Handles checkout.session.expired events
 */
async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
): Promise<WebhookEventResult> {
  console.log(
    `[Stripe Webhook] Processing checkout.session.expired for session: ${session.id}`,
  );

  const validation = validateCheckoutSessionForPolicy(session);
  if (!validation.isValid) {
    return {
      success: true, // Not an error, just no policy to update
      message: "Session expired but no valid policy metadata found",
    };
  }

  const { policyId } = validation;

  try {
    // Log the session expiration
    await edgeDb.insert(policyEvent).values({
      policyId: policyId!,
      type: "PAYMENT_PENDING",
      notes: `Stripe checkout session expired without payment. Session: ${session.id}`,
      data: {
        sessionId: session.id,
        expirationTime: new Date().toISOString(),
      },
      createdAt: new Date(),
    });

    return {
      success: true,
      message: `Session expiration logged for policy ${policyId}`,
      policyId,
      eventType: "session_expired",
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error logging session expiration:`, error);
    return {
      success: false,
      message: "Failed to log session expiration",
      policyId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles payment_intent.succeeded events
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
): Promise<WebhookEventResult> {
  console.log(
    `[Stripe Webhook] Processing payment_intent.succeeded: ${paymentIntent.id}`,
  );

  const policyId = paymentIntent.metadata?.policyId;

  if (!policyId) {
    return {
      success: true,
      message: "Payment succeeded but no policy ID in metadata",
    };
  }

  try {
    // Log the successful payment intent
    await edgeDb.insert(policyEvent).values({
      policyId,
      type: "PAYMENT_RECEIVED",
      notes: `Payment intent succeeded. Amount: ${paymentIntent.amount} ${paymentIntent.currency?.toUpperCase()}`,
      data: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method_types[0],
        status: paymentIntent.status,
      },
      createdAt: new Date(),
    });

    return {
      success: true,
      message: `Payment confirmation logged for policy ${policyId}`,
      policyId,
      eventType: "payment_confirmed",
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error logging payment success:`, error);
    return {
      success: false,
      message: "Failed to log payment success",
      policyId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles payment_intent.payment_failed events
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
): Promise<WebhookEventResult> {
  console.log(
    `[Stripe Webhook] Processing payment_intent.payment_failed: ${paymentIntent.id}`,
  );

  const policyId = paymentIntent.metadata?.policyId;

  if (!policyId) {
    return {
      success: true,
      message: "Payment failed but no policy ID in metadata",
    };
  }

  try {
    const failureReason =
      paymentIntent.last_payment_error?.message || "Unknown payment failure";

    // Log the payment failure
    await edgeDb.insert(policyEvent).values({
      policyId,
      type: "PAYOUT_FAILED",
      notes: `Payment intent failed. Reason: ${failureReason}`,
      data: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        failureReason,
        errorCode: paymentIntent.last_payment_error?.code,
        errorType: paymentIntent.last_payment_error?.type,
      },
      createdAt: new Date(),
    });

    // Optionally update policy status to indicate payment failure
    // This depends on business logic - you might want to keep it as PENDING
    // and allow retry, or mark it as PAYMENT_FAILED

    return {
      success: true,
      message: `Payment failure logged for policy ${policyId}`,
      policyId,
      eventType: "payment_failed",
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error logging payment failure:`, error);
    return {
      success: false,
      message: "Failed to log payment failure",
      policyId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles charge.dispute.created events (chargebacks)
 */
async function handleChargeDisputeCreated(
  dispute: Stripe.Dispute,
): Promise<WebhookEventResult> {
  console.log(
    `[Stripe Webhook] Processing charge.dispute.created: ${dispute.id}`,
  );

  // Get the charge to find associated metadata
  const charge = dispute.charge as Stripe.Charge;
  const policyId = charge.metadata?.policyId;

  if (!policyId) {
    return {
      success: true,
      message: "Dispute created but no policy ID found",
    };
  }

  try {
    // Log the dispute
    await edgeDb.insert(policyEvent).values({
      policyId,
      type: "REFUND_PROCESSED",
      notes: `Payment disputed. Reason: ${dispute.reason}. Amount: ${dispute.amount} ${dispute.currency?.toUpperCase()}`,
      data: {
        disputeId: dispute.id,
        chargeId: typeof charge === "string" ? charge : charge.id,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
        status: dispute.status,
        evidenceDueBy: dispute.evidence_details?.due_by
          ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
          : null,
      },
      createdAt: new Date(),
    });

    return {
      success: true,
      message: `Dispute logged for policy ${policyId}`,
      policyId,
      eventType: "dispute_created",
    };
  } catch (error) {
    console.error(`[Stripe Webhook] Error logging dispute:`, error);
    return {
      success: false,
      message: "Failed to log dispute",
      policyId,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Main webhook event handler
 */
export async function handleStripeWebhookEvent(
  event: Stripe.Event,
): Promise<WebhookEventResult> {
  console.log(`[Stripe Webhook] Handling event type: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        return await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );

      case "checkout.session.expired":
        return await handleCheckoutSessionExpired(
          event.data.object as Stripe.Checkout.Session,
        );

      case "payment_intent.succeeded":
        return await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );

      case "payment_intent.payment_failed":
        return await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );

      case "charge.dispute.created":
        return await handleChargeDisputeCreated(
          event.data.object as Stripe.Dispute,
        );

      // Subscription events (for future use)
      case "invoice.payment_succeeded":
        console.log(
          `[Stripe Webhook] Invoice payment succeeded: ${event.data.object.id}`,
        );
        return {
          success: true,
          message: "Invoice payment succeeded (logged)",
          eventType: "invoice_paid",
        };

      case "invoice.payment_failed":
        console.log(
          `[Stripe Webhook] Invoice payment failed: ${event.data.object.id}`,
        );
        return {
          success: true,
          message: "Invoice payment failed (logged)",
          eventType: "invoice_failed",
        };

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        console.log(
          `[Stripe Webhook] Subscription event: ${event.type} for ${event.data.object.id}`,
        );
        return {
          success: true,
          message: `Subscription event ${event.type} handled`,
          eventType: event.type,
        };

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        return {
          success: true,
          message: `Event type ${event.type} acknowledged but not processed`,
          eventType: event.type,
        };
    }
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error handling event ${event.type}:`,
      error,
    );
    return {
      success: false,
      message: `Failed to handle event ${event.type}`,
      eventType: event.type,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validates that an event is one we should process
 */
export function shouldProcessEvent(eventType: string): boolean {
  return stripeSettings.webhooks.enabledEvents.includes(eventType as any);
}

/**
 * Gets a summary of webhook processing statistics
 */
export interface WebhookStats {
  totalProcessed: number;
  successfulProcessed: number;
  failedProcessed: number;
  eventTypes: Record<string, number>;
}

// Simple in-memory stats (in production, you'd want to persist this)
let webhookStats: WebhookStats = {
  totalProcessed: 0,
  successfulProcessed: 0,
  failedProcessed: 0,
  eventTypes: {},
};

/**
 * Updates webhook processing statistics
 */
export function updateWebhookStats(eventType: string, success: boolean): void {
  webhookStats.totalProcessed++;

  if (success) {
    webhookStats.successfulProcessed++;
  } else {
    webhookStats.failedProcessed++;
  }

  webhookStats.eventTypes[eventType] =
    (webhookStats.eventTypes[eventType] || 0) + 1;
}

/**
 * Gets current webhook statistics
 */
export function getWebhookStats(): WebhookStats {
  return { ...webhookStats };
}

/**
 * Resets webhook statistics (mainly for testing)
 */
export function resetWebhookStats(): void {
  webhookStats = {
    totalProcessed: 0,
    successfulProcessed: 0,
    failedProcessed: 0,
    eventTypes: {},
  };
}
