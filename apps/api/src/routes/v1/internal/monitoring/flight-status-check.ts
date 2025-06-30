import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";

/**
 * Handles POST requests for the /api/v1/internal/monitoring/flight-status-check endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
// Define a Zod schema for the expected request body
const flightStatusRequestBodySchema = z.object({
  flightNumber: z.string().min(3, "Flight number seems too short."),
  // Could also include policyId or other identifiers
});

export async function handleFlightStatusCheck(req: Request): Promise<Response> {
  let body;
  try {
    const rawBody = await req.json();
    body = flightStatusRequestBodySchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify(
          createApiError("VALIDATION_ERROR", "Invalid request body.", {
            details: error.format(),
          }),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify(
        createApiError("INVALID_JSON", "Invalid JSON in request body."),
      ),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(
    `[API Flight Status Check] Received request for flight: ${body.flightNumber}`,
  );

  // TODO: Implement logic to check flight status from aggregated data source.

  const responseData = {
    flightNumber: body.flightNumber,
    status: "On Time", // Mocked status
    lastUpdated: new Date().toISOString(),
    message: "Flight status check successful (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
