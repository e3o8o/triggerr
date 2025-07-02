/**
 * Shared Models Package Index
 *
 * This file serves as the main export point for all shared model types,
 * interfaces, and utilities used across the Triggerr platform.
 */

// Re-export all canonical data model types
export * from './canonical-models';

// Export specific commonly used types for convenience
export type {
  CanonicalFlightData,
  CanonicalFlightDataModel,
  CanonicalWeatherObservation,
  CanonicalWeatherObservationModel,
  StandardFlightStatus,
  StandardWeatherCondition,
  SourceContributions,
  SourceContribution,
  DataQualityMetrics,
  FlightDataWithReferences,
  WeatherDataWithReferences,
  CanonicalFlightDataWithQuality,
  CanonicalWeatherDataWithQuality,
  FlightPerformanceStats,
  WeatherImpactAnalysis,
  FlightDataTransformation,
  WeatherDataTransformation,
  PartialCanonicalFlightData,
  PartialCanonicalWeatherData,
  DataMergeResult
} from './canonical-models';

// Export validation functions
export {
  isCanonicalFlightData,
  isCanonicalWeatherData,
  validateFlightData,
  validateWeatherData
} from './canonical-models';

// Export constants
export {
  DATA_QUALITY_THRESHOLDS,
  SOURCE_RELIABILITY_SCORES
} from './canonical-models';
