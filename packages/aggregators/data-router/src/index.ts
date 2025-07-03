/**
 * Data Router Package
 *
 * This package provides the main orchestration layer for collecting both flight
 * and weather data required for insurance policy generation. It coordinates
 * between FlightAggregator and WeatherAggregator to provide a unified data interface.
 */

// Main router class
export { DataRouter } from "./router";
export type {
  PolicyDataRequest,
  PolicyDataResponse,
  DataRouterConfig,
} from "./router";

// Re-export aggregator types for convenience
export type {
  FlightIdentifier,
  AggregationResult as FlightAggregationResult,
} from "@triggerr/flight-aggregator";

export type {
  WeatherIdentifier,
  WeatherAggregationResult,
} from "@triggerr/weather-aggregator";

// Re-export canonical types for convenience
export type {
  CanonicalFlightData,
  CanonicalWeatherObservation,
  StandardFlightStatus,
  StandardWeatherCondition,
  SourceContributions,
} from "@triggerr/shared";
