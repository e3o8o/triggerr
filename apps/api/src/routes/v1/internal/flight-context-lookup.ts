import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";

/**
 * Handles POST requests for the /api/v1/internal/flight-context-lookup endpoint.
 *
 * NOTE: This is a shell implementation. The business logic is not yet implemented.
 */
// Define a Zod schema for the expected request body
const flightContextRequestBodySchema = z.object({
  flightNumber: z.string().min(3, "Flight number seems too short."),
  departureDate: z.string().date("Invalid departure date format."),
});

export async function handleFlightContextLookup(
  req: Request,
): Promise<Response> {
  // In a real implementation, we would add internal service-to-service authentication here.
  const internalAuthKey = req.headers.get("x-internal-auth-key");
  // A real check would be against a securely stored key.
  if (internalAuthKey !== "dummy-internal-key") {
    // Return a 401 Unauthorized error if the key is missing or incorrect.
  }

  let body;
  try {
    const rawBody = await req.json();
    body = flightContextRequestBodySchema.parse(rawBody);
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
    `[API Flight Context Lookup] Received request for flight: ${body.flightNumber}`,
  );

  // TODO: Implement logic to call external flight data APIs and aggregate context.

  const responseData = {
    flightNumber: body.flightNumber,
    departure: {
      airport: "SFO",
      scheduled: new Date(body.departureDate).toISOString(),
      actual: new Date(body.departureDate).toISOString(),
      gate: "A1",
    },
    arrival: {
      airport: "JFK",
      scheduled: new Date().toISOString(),
      estimated: new Date().toISOString(),
      gate: "B2",
    },
    message: "Flight context retrieved successfully (mocked).",
  };

  return new Response(JSON.stringify(createApiResponse(responseData)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
