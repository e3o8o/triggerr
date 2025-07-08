import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { z } from "zod";
import { QuoteService } from "@triggerr/quote-engine";
import { DataRouter } from "@triggerr/data-router";
import { Logger, LogLevel } from "@triggerr/core";
import { FlightAwareClient } from "@triggerr/flightaware-adapter";
import { AviationStackClient } from "@triggerr/aviationstack-adapter";
import { OpenSkyClient } from "@triggerr/opensky-adapter";
import { GoogleWeatherClient } from "@triggerr/google-weather-adapter";

// Request validation schema
const insuranceQuoteRequestSchema = z.object({
  flightNumber: z.string().min(1, "Flight number is required"),
  flightDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Flight date must be in YYYY-MM-DD format"),
  originAirport: z
    .string()
    .length(3, "Origin airport must be 3-letter IATA code"),
  destinationAirport: z
    .string()
    .length(3, "Destination airport must be 3-letter IATA code"),
  coverageTypes: z
    .array(
      z.enum(["DELAY", "CANCELLATION", "BAGGAGE_LOSS", "MEDICAL_EMERGENCY"]),
    )
    .min(1, "At least one coverage type is required"),
  coverageAmounts: z
    .record(z.string(), z.number().positive("Coverage amount must be positive"))
    .optional(),
  airports: z.array(z.string()).optional(), // For weather data collection
});

type InsuranceQuoteRequest = z.infer<typeof insuranceQuoteRequestSchema>;

/**
 * Handles POST requests for the /api/v1/insurance/quote endpoint.
 *
 * Generates insurance quotes using the QuoteService with real flight and weather data.
 */
export async function handleInsuranceQuote(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(`[API Insurance Quote] [${requestId}] Received request`);

  let body: InsuranceQuoteRequest;

  try {
    // Step 1: Parse and validate request body
    const rawBody = await req.json();
    body = insuranceQuoteRequestSchema.parse(rawBody);

    console.log(
      `[API Insurance Quote] [${requestId}] Validated request for flight ${body.flightNumber} on ${body.flightDate}`,
    );
  } catch (error) {
    console.warn(
      `[API Insurance Quote] [${requestId}] Request validation failed:`,
      error,
    );

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify(
          createApiError("VALIDATION_ERROR", "Invalid request format", {
            details: error.format(),
          }),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify(
        createApiError("INVALID_JSON", "Invalid JSON in request body"),
      ),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // Step 2: Initialize services
    const logger = new Logger(LogLevel.INFO, "QuoteAPI");

    // Check if we should use real APIs or fallback mode
    const useRealApis = process.env.TRIGGERR_USE_REAL_APIS === "true";
    const hasFlightApiKeys = !!(
      process.env.FLIGHTAWARE_API_KEY ||
      process.env.AVIATIONSTACK_API_KEY ||
      (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD)
    );
    const hasWeatherApiKeys = !!process.env.GOOGLE_WEATHER_API_KEY;

    // Initialize API clients only when API keys are available and real APIs are enabled
    const flightApiClients = [];
    const weatherApiClients = [];

    if (useRealApis && hasFlightApiKeys) {
      logger.info(`[QuoteAPI] [${requestId}] Using real flight data APIs`);

      if (process.env.FLIGHTAWARE_API_KEY) {
        flightApiClients.push(
          new FlightAwareClient(process.env.FLIGHTAWARE_API_KEY),
        );
      }
      if (process.env.AVIATIONSTACK_API_KEY) {
        flightApiClients.push(
          new AviationStackClient(process.env.AVIATIONSTACK_API_KEY),
        );
      }
      if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
        flightApiClients.push(
          new OpenSkyClient(
            process.env.OPENSKY_USERNAME,
            process.env.OPENSKY_PASSWORD,
          ),
        );
      }
    } else {
      logger.info(
        `[QuoteAPI] [${requestId}] Using fallback flight data (real APIs: ${useRealApis ? "enabled" : "disabled"}, keys available: ${hasFlightApiKeys})`,
      );
    }

    if (useRealApis && hasWeatherApiKeys) {
      logger.info(`[QuoteAPI] [${requestId}] Using real weather data APIs`);

      if (process.env.GOOGLE_WEATHER_API_KEY) {
        weatherApiClients.push(
          new GoogleWeatherClient(process.env.GOOGLE_WEATHER_API_KEY),
        );
      }
    } else {
      logger.info(
        `[QuoteAPI] [${requestId}] Using fallback weather data (real APIs: ${useRealApis ? "enabled" : "disabled"}, keys available: ${hasWeatherApiKeys})`,
      );
    }

    const dataRouter = new DataRouter({
      logger,
      flightApiClients,
      weatherApiClients,
    });
    const quoteService = new QuoteService(dataRouter, logger);

    // Step 3: Prepare quote request with defaults
    // Map coverage types from API format to QuoteService format
    const mapCoverageType = (
      apiType: string,
    ): "FLIGHT_DELAY" | "FLIGHT_CANCELLATION" | "WEATHER_DISRUPTION" => {
      switch (apiType) {
        case "CANCELLATION":
          return "FLIGHT_CANCELLATION";
        case "DELAY":
          return "FLIGHT_DELAY";
        case "BAGGAGE_LOSS":
        case "MEDICAL_EMERGENCY":
        default:
          return "FLIGHT_DELAY"; // Default fallback
      }
    };

    const quoteRequest = {
      flightNumber: body.flightNumber,
      flightDate: body.flightDate,
      coverageType: mapCoverageType(body.coverageTypes?.[0] || "DELAY"),
      coverageAmount: body.coverageAmounts?.DELAY
        ? (body.coverageAmounts.DELAY / 100).toString()
        : "500.00", // Convert cents to dollars
      airports: body.airports || [body.originAirport, body.destinationAirport],
      productType: "BASIC" as const,
    };

    console.log(
      `[API Insurance Quote] [${requestId}] Calling QuoteService for flight ${body.flightNumber}`,
    );

    // Step 4: Generate quote using QuoteService
    const quoteResponse = await quoteService.generateQuote(quoteRequest);

    console.log(
      `[API Insurance Quote] [${requestId}] Quote generated successfully: ${quoteResponse.quoteId}`,
    );

    // Step 5: Return successful response
    const responseData = {
      quoteId: quoteResponse.quoteId,
      validUntil: quoteResponse.validUntil,
      flightNumber: quoteResponse.flightNumber,
      flightDate: quoteResponse.flightDate,
      quotes: quoteResponse.quotes.map((quote: any) => ({
        productName: quote.productName,
        coverageType: quote.coverageType,
        premium: quote.premium, // In cents
        coverageAmount: quote.coverageAmount, // In cents
        deductible: quote.deductible,
        confidence: quote.confidence,
        riskFactors: quote.riskFactors,
        terms: quote.terms,
      })),
      dataQuality: quoteResponse.dataQuality,
      message: quoteResponse.message,
    };

    return new Response(JSON.stringify(createApiResponse(responseData)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Insurance Quote] [${requestId}] Quote generation failed:`,
      error,
    );

    // Handle specific error types
    if (error.message?.includes("Unable to retrieve flight information")) {
      return new Response(
        JSON.stringify(
          createApiError(
            "FLIGHT_DATA_UNAVAILABLE",
            "Unable to retrieve flight information for the specified flight. Please verify the flight number and date.",
            { flightNumber: body.flightNumber, flightDate: body.flightDate },
          ),
        ),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    if (error.message?.includes("Invalid flight number")) {
      return new Response(
        JSON.stringify(
          createApiError(
            "INVALID_FLIGHT",
            "The specified flight number appears to be invalid or not found.",
            { flightNumber: body.flightNumber },
          ),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (error.message?.includes("flight date")) {
      return new Response(
        JSON.stringify(
          createApiError(
            "INVALID_FLIGHT_DATE",
            "The specified flight date is invalid. Quotes can only be generated for future flights within the next 365 days.",
            { flightDate: body.flightDate },
          ),
        ),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (error.message?.includes("data quality")) {
      return new Response(
        JSON.stringify(
          createApiError(
            "INSUFFICIENT_DATA_QUALITY",
            "Unable to generate accurate quotes due to insufficient data quality. Please try again later or contact support.",
            { requestId },
          ),
        ),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    // Generic server error for any other cases
    return new Response(
      JSON.stringify(
        createApiError(
          "QUOTE_GENERATION_FAILED",
          "An unexpected error occurred while generating your quote. Please try again later.",
          { requestId },
        ),
      ),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
