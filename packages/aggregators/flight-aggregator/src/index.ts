/**
 * Flight Aggregator Package
 *
 * This package provides flight data aggregation capabilities by orchestrating
 * multiple API sources, caching results, and resolving conflicts between data sources.
 */

// Main aggregator class
export { FlightAggregator } from "./aggregator";
export type {
  FlightAggregatorConfig,
  FlightIdentifier,
  AggregationResult,
} from "./aggregator";

// Source routing
export { SourceRouter } from "./source-router";
export type { IFlightApiClient } from "@triggerr/shared";

// Conflict resolution
export { ConflictResolver } from "./conflict-resolver";

// Cache management
export { CacheManager } from "@triggerr/core";

// Re-export canonical types for convenience
export type {
  CanonicalFlightData,
  StandardFlightStatus,
  SourceContributions,
} from "@triggerr/shared";
