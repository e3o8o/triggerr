/**
 * FlightAware API Adapter Package
 *
 * This package provides integration with the FlightAware AeroAPI for flight data collection.
 * It transforms FlightAware's API responses into our canonical flight data format.
 */

// Main client class
export { FlightAwareClient } from "./client";

// Re-export flight API client interface for convenience
export type { IFlightApiClient } from "@triggerr/shared/types/integrations";

// Re-export canonical types for convenience
export type {
  CanonicalFlightData,
  StandardFlightStatus,
  SourceContributions,
} from "@triggerr/shared/models/canonical-models";
