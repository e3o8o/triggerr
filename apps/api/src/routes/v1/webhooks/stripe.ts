import {
  verifyStripeWebhook,
  handleStripeWebhookEvent,
  updateWebhookStats,
  stripeConfig,
} from "@triggerr/stripe";
import { createApiError, createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles POST requests for the /api/v1/webhooks/stripe endpoint.
 *
 * This is a critical endpoint that receives asynchronous events from Stripe
 * to confirm payment success and update policy statuses.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleStripeWebhook(request: Request): Promise<Response> {
  console.log(`[API Stripe Webhook] Received request`);

  try {
    const body = await request.text();
    const signature = request.headers.get("Stripe-Signature") ?? "";

    if (!stripeConfig.webhookSecret) {
      console.error(
        "[API Stripe Webhook] Stripe webhook secret is not configured.",
      );
      return new Response(
        JSON.stringify(
          createApiError("INTERNAL_SERVER_ERROR", "Webhook secret not configured"),
        ),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // 1. Verify the webhook signature to ensure it's from Stripe
    const verificationResult = verifyStripeWebhook(
      body,
      signature,
      stripeConfig.webhookSecret,
    );

    if (!verificationResult.success) {
      console.error(
        `[API Stripe Webhook] Signature verification failed: ${verificationResult.error}`,
      );
      return new Response(
        JSON.stringify(
          createApiError("BAD_REQUEST", `Webhook Error: ${verificationResult.error}`),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const event = verificationResult.event;
    console.log(`[API Stripe Webhook] Successfully verified event: ${event.type}`);

    // 2. Handle the verified event using our dedicated service
    const handleResult = await handleStripeWebhookEvent(event);

    // 3. Update internal stats for monitoring
    updateWebhookStats(event.type, handleResult.success);

    if (handleResult.success) {
      console.log(
        `[API Stripe Webhook] Event ${event.type} handled successfully: ${handleResult.message}`,
      );
      const response = createApiResponse({
        eventType: event.type,
        message: handleResult.message,
        ...("policyId" in handleResult &&
          handleResult.policyId && { policyId: handleResult.policyId }),
      });
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      console.error(
        `[API Stripe Webhook] Event ${event.type} handling failed: ${handleResult.message}`,
      );
      // Return a 200 to Stripe even on failure to prevent retries for handled errors.
      const response = createApiResponse({
        eventType: event.type,
        error: handleResult.message,
        ...("policyId" in handleResult &&
          handleResult.policyId && { policyId: handleResult.policyId }),
      });
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error(`[API Stripe Webhook] Unexpected error handling event:`, error);
    // Acknowledge receipt to Stripe with a 200 even if our internal processing fails catastrophically.
    const response = createApiResponse({
        error: "Internal server error during event processing",
      });
    return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
  }
}
