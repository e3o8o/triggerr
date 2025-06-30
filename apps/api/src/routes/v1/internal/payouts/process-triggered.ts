import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";
import { PayoutEngine } from "@triggerr/payout-engine";

// Request validation schema
const processPayoutsRequestSchema = z.object({
  policyIds: z
    .array(z.string().min(1))
    .min(1, "At least one policy ID is required"),
  reason: z.string().optional(),
  requestedBy: z.string().optional(),
});

type ProcessPayoutsRequest = z.infer<typeof processPayoutsRequestSchema>;

// Internal API key validation (simplified for MVP)
async function validateInternalApiKey(request: Request): Promise<boolean> {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) {
    console.warn("[API Payouts] No INTERNAL_API_KEY configured");
    return false;
  }

  return apiKey === expectedKey;
}

/**
 * Handles POST requests for the /api/v1/internal/payouts/process-triggered endpoint.
 *
 * This internal endpoint is called to process payouts for policies that have been triggered.
 *
 * NOTE: The implementation for this service is pending.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleProcessTriggeredPayouts(
  request: Request,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(
    `[API Payouts] [${requestId}] Received process triggered payouts request`,
  );

  try {
    // 1. Validate internal API key
    const isAuthorized = await validateInternalApiKey(request);
    if (!isAuthorized) {
      console.warn(
        `[API Payouts] [${requestId}] Unauthorized request - invalid API key`,
      );
      const errorResponse = createApiError(
        "UNAUTHORIZED",
        "Valid internal API key required for this operation.",
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = processPayoutsRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.warn(
        `[API Payouts] [${requestId}] Request validation failed:`,
        validationResult.error.format(),
      );
      const errorResponse = createApiError(
        "VALIDATION_ERROR",
        "Invalid request format",
        { details: validationResult.error.format() },
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data: ProcessPayoutsRequest = validationResult.data;
    const { policyIds, reason, requestedBy } = data;

    console.log(
      `[API Payouts] [${requestId}] Processing payouts for ${policyIds.length} policies. Reason: ${reason || "Not specified"}. Requested by: ${requestedBy || "Unknown"}`,
    );

    // 3. Initialize PayoutEngine and process payouts
    const payoutEngine = new PayoutEngine();
    const result = await payoutEngine.processTriggeredPayouts(policyIds);

    // 4. Log the results
    console.log(
      `[API Payouts] [${requestId}] Processing complete. Summary:`,
      result.summary,
    );

    // 5. Format the response
    const response = {
      requestId,
      processedCount: result.processedCount,
      failedCount: result.failedCount,
      totalAmount: result.totalAmount,
      summary: result.summary,
      results: result.results,
      processedAt: new Date().toISOString(),
      reason: reason || null,
      requestedBy: requestedBy || null,
    };

    // Return a standardized success response
    const successResponse = createApiResponse(response);
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Payouts] [${requestId}] Error processing payouts:`,
      error,
    );

    // Enhanced error handling for specific, predictable errors
    if (error.message) {
      // Handle PayGo initialization errors
      if (
        error.message.toLowerCase().includes("paygo") ||
        error.message.toLowerCase().includes("client")
      ) {
        const errorResponse = createApiError(
          "SERVICE_UNAVAILABLE",
          "Blockchain service is temporarily unavailable. Please try again later.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle database connection errors
      if (
        error.message.toLowerCase().includes("database") ||
        error.message.toLowerCase().includes("connection")
      ) {
        const errorResponse = createApiError(
          "DATABASE_ERROR",
          "Database service is temporarily unavailable. Please try again later.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle escrow errors
      if (
        error.message.toLowerCase().includes("escrow") ||
        error.message.toLowerCase().includes("release")
      ) {
        const errorResponse = createApiError(
          "ESCROW_ERROR",
          "Error occurred during escrow processing. Some payouts may have failed.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Handle insufficient funds errors
      if (
        error.message.toLowerCase().includes("insufficient funds") ||
        error.message.toLowerCase().includes("balance")
      ) {
        const errorResponse = createApiError(
          "INSUFFICIENT_FUNDS",
          "Insufficient funds in system accounts to process all payouts.",
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Return a generic server error for any other cases
    const errorResponse = createApiError(
      "SERVER_ERROR",
      "An unexpected error occurred while processing payouts. Please contact support.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
