/**
 * Quote Engine Service Exports
 *
 * This package provides insurance quote generation capabilities including:
 * - Risk assessment and scoring
 * - Premium calculation based on flight and weather data
 * - Multiple coverage options and product types
 * - Database integration for quote persistence
 */

// Main service class
export { QuoteService } from "./quote-service";

// Request and Response types
export type {
  InsuranceQuoteRequest,
  InsuranceQuoteResponse,
  QuoteOption,
} from "./quote-service";

// Re-export useful types from the service
export type {
  RiskCalculationResult,
  FlightRiskFactors,
  WeatherRiskFactors,
} from "./quote-service";
