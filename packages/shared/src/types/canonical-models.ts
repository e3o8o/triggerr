// ============================================================================
// CANONICAL DATA MODEL TYPES (Standalone Definitions)
// ============================================================================

// Core canonical data model types without external dependencies
// These represent the standardized data structures for flight and weather data

// ============================================================================
// CANONICAL FLIGHT DATA TYPES
// ============================================================================

// Canonical flight data model for database insertion
export interface CanonicalFlightDataModel {
  id?: string;
  flightNumber: string;
  airlineIcaoCode?: string;
  airlineIataCode?: string;
  originAirportIataCode: string;
  originAirportIcaoCode?: string;
  destinationAirportIataCode: string;
  destinationAirportIcaoCode?: string;
  aircraftTypeIcaoCode?: string;
  scheduledDepartureTimestampUTC: string;
  scheduledArrivalTimestampUTC?: string;
  actualDepartureTimestampUTC?: string;
  actualArrivalTimestampUTC?: string;
  estimatedDepartureTimestampUTC?: string;
  estimatedArrivalTimestampUTC?: string;
  flightStatus: StandardFlightStatus;
  departureDelayMinutes?: number;
  arrivalDelayMinutes?: number;
  cancelledAt?: string;
  cancellationReason?: string;
  divertedTo?: string;
  divertedAt?: string;
  gate?: string;
  terminal?: string;
  sourceContributions: SourceContributions;
  dataQualityScore: number;
  lastUpdatedUTC: string;
  createdAt?: string;
  updatedAt?: string;
}

// Canonical flight data for database selection (includes generated fields)
export interface CanonicalFlightData extends CanonicalFlightDataModel {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// CANONICAL WEATHER DATA TYPES
// ============================================================================

// Canonical weather observation model for database insertion
export interface CanonicalWeatherObservationModel {
  id?: string;
  airportIataCode: string;
  observationTimestampUTC: string;
  temperature?: number; // Celsius
  temperatureFahrenheit?: number;
  humidity?: number; // Percentage
  windSpeed?: number; // km/h
  windDirection?: number; // Degrees
  windGust?: number; // km/h
  visibility?: number; // Kilometers
  pressure?: number; // hPa
  dewPoint?: number; // Celsius
  weatherCondition: StandardWeatherCondition;
  cloudCover?: string;
  precipitation?: number; // mm
  precipitationType?: string;
  uvIndex?: number;
  sourceContributions: SourceContributions;
  dataQualityScore: number;
  lastUpdatedUTC: string;
  createdAt?: string;
  updatedAt?: string;
}

// Canonical weather observation for database selection (includes generated fields)
export interface CanonicalWeatherObservation extends CanonicalWeatherObservationModel {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SOURCE CONTRIBUTION TRACKING
// ============================================================================

// Source contribution interface for multi-API data merging
export interface SourceContribution {
  source: 'aviationstack' | 'flightaware' | 'opensky' | 'weatherapi' | 'openweather';
  fields: string[]; // Which fields this source provided
  timestamp: string; // When this data was fetched
  confidence: number; // 0.0 to 1.0 reliability score
  sourceId?: string; // Original API's identifier for this data
  apiVersion?: string; // API version used
  responseTime?: number; // API response time in ms
  cost?: number; // API call cost if applicable
}

// Source contributions array type for the JSONB field
export type SourceContributions = SourceContribution[];

// ============================================================================
// ENHANCED TYPES WITH REFERENCE DATA
// ============================================================================

// Enhanced flight data with joined reference information
export interface FlightDataWithReferences extends CanonicalFlightData {
  airline?: {
    name: string;
    icaoCode: string;
    iataCode: string;
    country: string;
  };
  originAirport?: {
    name: string;
    iataCode: string;
    icaoCode: string;
    timezone: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  destinationAirport?: {
    name: string;
    iataCode: string;
    icaoCode: string;
    timezone: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  aircraftType?: {
    manufacturer: string;
    model: string;
    icaoCode: string;
    iataCode?: string;
  };
}

// Enhanced weather data with airport reference information
export interface WeatherDataWithReferences extends CanonicalWeatherObservation {
  airport?: {
    name: string;
    iataCode: string;
    city: string;
    country: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
}

// ============================================================================
// FLIGHT STATUS STANDARDIZATION
// ============================================================================

// Standardized flight status (used in canonical model)
export type StandardFlightStatus =
  | 'SCHEDULED'     // Flight is scheduled
  | 'ACTIVE'        // Flight is in progress
  | 'DEPARTED'      // Flight has departed
  | 'LANDED'        // Flight has landed
  | 'CANCELLED'     // Flight was cancelled
  | 'DELAYED'       // Flight is delayed
  | 'DIVERTED'      // Flight was diverted
  | 'UNKNOWN';      // Status unknown

// Weather condition standardization
export type StandardWeatherCondition =
  | 'CLEAR'
  | 'PARTLY_CLOUDY'
  | 'CLOUDY'
  | 'OVERCAST'
  | 'LIGHT_RAIN'
  | 'MODERATE_RAIN'
  | 'HEAVY_RAIN'
  | 'THUNDERSTORM'
  | 'SNOW'
  | 'FOG'
  | 'MIST'
  | 'WIND'
  | 'UNKNOWN';

// ============================================================================
// DATA QUALITY AND CONFIDENCE
// ============================================================================

// Data quality assessment
export interface DataQualityMetrics {
  completeness: number; // 0.0 to 1.0 - how many expected fields are populated
  accuracy: number; // 0.0 to 1.0 - estimated accuracy based on source reliability
  timeliness: number; // 0.0 to 1.0 - how recent the data is
  consistency: number; // 0.0 to 1.0 - consistency across multiple sources
  overall: number; // 0.0 to 1.0 - overall quality score
}

// Enhanced canonical models with quality metrics
export interface CanonicalFlightDataWithQuality extends CanonicalFlightData {
  quality: DataQualityMetrics;
  sourceContributions: SourceContributions;
}

export interface CanonicalWeatherDataWithQuality extends CanonicalWeatherObservation {
  quality: DataQualityMetrics;
  sourceContributions: SourceContributions;
}

// ============================================================================
// AGGREGATION AND ANALYSIS TYPES
// ============================================================================

// Flight performance statistics
export interface FlightPerformanceStats {
  flightNumber: string;
  route: {
    origin: string;
    destination: string;
  };
  period: {
    start: string;
    end: string;
  };
  statistics: {
    totalFlights: number;
    onTimePercentage: number;
    averageDelayMinutes: number;
    cancellationRate: number;
    diversionRate: number;
  };
}

// Weather impact analysis
export interface WeatherImpactAnalysis {
  airport: string;
  period: {
    start: string;
    end: string;
  };
  conditions: {
    condition: StandardWeatherCondition;
    frequency: number;
    averageFlightDelays: number;
    cancellationRate: number;
  }[];
}

// ============================================================================
// DATA TRANSFORMATION TYPES
// ============================================================================

// Raw API response transformation
export interface FlightDataTransformation {
  source: string;
  rawData: Record<string, any>;
  transformedData: Partial<CanonicalFlightDataModel>;
  transformationRules: string[];
  confidence: number;
  warnings: string[];
  errors: string[];
}

// Weather data transformation
export interface WeatherDataTransformation {
  source: string;
  rawData: Record<string, any>;
  transformedData: Partial<CanonicalWeatherObservationModel>;
  transformationRules: string[];
  confidence: number;
  warnings: string[];
  errors: string[];
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

// Type guard functions
export function isCanonicalFlightData(data: any): data is CanonicalFlightData {
  return data && typeof data.id === 'string' && data.scheduledDepartureTimestampUTC;
}

export function isCanonicalWeatherData(data: any): data is CanonicalWeatherObservation {
  return data && typeof data.id === 'string' && data.observationTimestampUTC;
}

// Validation functions
export function validateFlightData(data: Partial<CanonicalFlightDataModel>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.flightNumber) errors.push('Flight number is required');
  if (!data.originAirportIataCode) errors.push('Origin airport IATA code is required');
  if (!data.destinationAirportIataCode) errors.push('Destination airport IATA code is required');
  if (!data.scheduledDepartureTimestampUTC) errors.push('Scheduled departure time is required');

  if (data.dataQualityScore !== undefined && (data.dataQualityScore < 0 || data.dataQualityScore > 1)) {
    errors.push('Data quality score must be between 0 and 1');
  }

  if (!data.flightStatus) warnings.push('Flight status not provided');
  if (!data.airlineIcaoCode && !data.airlineIataCode) warnings.push('No airline code provided');

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateWeatherData(data: Partial<CanonicalWeatherObservationModel>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.airportIataCode) errors.push('Airport IATA code is required');
  if (!data.observationTimestampUTC) errors.push('Observation timestamp is required');

  if (data.dataQualityScore !== undefined && (data.dataQualityScore < 0 || data.dataQualityScore > 1)) {
    errors.push('Data quality score must be between 0 and 1');
  }

  if (data.temperature !== undefined && (data.temperature < -100 || data.temperature > 100)) {
    warnings.push('Temperature value seems unusual');
  }

  if (data.humidity !== undefined && (data.humidity < 0 || data.humidity > 100)) {
    errors.push('Humidity must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Utility type for partial canonical data (useful for updates)
export type PartialCanonicalFlightData = Partial<CanonicalFlightDataModel>;
export type PartialCanonicalWeatherData = Partial<CanonicalWeatherObservationModel>;

// Data merge utilities
export interface DataMergeResult<T> {
  merged: T;
  conflicts: Array<{
    field: string;
    values: Array<{ source: string; value: any; confidence: number; }>;
    resolution: 'highest_confidence' | 'most_recent' | 'manual_review';
    chosenValue: any;
  }>;
  qualityScore: number;
}

// Export constants for data quality thresholds
export const DATA_QUALITY_THRESHOLDS = {
  EXCELLENT: 0.9,
  GOOD: 0.75,
  FAIR: 0.6,
  POOR: 0.4,
  MINIMUM_ACCEPTABLE: 0.3
} as const;

export const SOURCE_RELIABILITY_SCORES = {
  flightaware: 0.95,
  aviationstack: 0.85,
  opensky: 0.75,
  weatherapi: 0.9,
  openweather: 0.8
} as const;
