/**
 * Google Weather API Adapter Package
 *
 * This package provides integration with the Google Weather API for weather data collection.
 * It transforms Google Weather API responses into our canonical weather data format.
 */

// Main client class
export { GoogleWeatherClient } from './client';

// Re-export weather API client interface for convenience
export type { IWeatherApiClient } from './client';

// Re-export canonical types for convenience
export type {
  CanonicalWeatherObservation,
  CanonicalWeatherObservationModel,
  StandardWeatherCondition,
  SourceContributions
} from '@triggerr/shared/models/canonical-models';
