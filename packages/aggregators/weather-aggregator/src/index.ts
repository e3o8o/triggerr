/**
 * Weather Aggregator Package
 *
 * This package provides weather data aggregation capabilities by orchestrating
 * multiple weather API sources, caching results, and resolving conflicts between data sources.
 */

// Main aggregator class
export { WeatherAggregator } from "./aggregator";
export type {
  WeatherAggregatorConfig,
  WeatherIdentifier,
  WeatherAggregationResult,
} from "./aggregator";

// Source routing
export { WeatherSourceRouter } from "./source-router";
export type { IWeatherApiClient } from "./source-router";

// Conflict resolution
export { WeatherConflictResolver } from "./conflict-resolver";

// Re-export weather API client interface for convenience
export type { IWeatherApiClient as GoogleWeatherApiClient } from "@triggerr/shared";

// Re-export canonical types for convenience
export type {
  CanonicalWeatherObservation,
  CanonicalWeatherObservationModel,
  StandardWeatherCondition,
  SourceContributions,
} from "@triggerr/shared";
