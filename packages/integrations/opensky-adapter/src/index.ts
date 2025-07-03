/**
 * OpenSky Network API Adapter Package
 *
 * This package provides integration with the OpenSky Network API for flight data collection.
 * It is primarily useful for real-time aircraft state information.
 */

// Main client class
export { OpenSkyClient } from "./client";

// Re-export flight API client interface for convenience
export type { IFlightApiClient } from "@triggerr/shared";

// Re-export canonical types for convenience
export type {
  CanonicalFlightData,
  StandardFlightStatus,
  SourceContributions,
} from "@triggerr/shared";
