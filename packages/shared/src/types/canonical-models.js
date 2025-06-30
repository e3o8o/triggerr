// ============================================================================
// CANONICAL DATA MODEL TYPES (Standalone Definitions)
// ============================================================================
// ============================================================================
// EXPORT HELPERS
// ============================================================================
// Type guard functions
export function isCanonicalFlightData(data) {
    return data && typeof data.id === 'string' && data.scheduledDepartureTimestampUTC;
}
export function isCanonicalWeatherData(data) {
    return data && typeof data.id === 'string' && data.observationTimestampUTC;
}
// Validation functions
export function validateFlightData(data) {
    const errors = [];
    const warnings = [];
    if (!data.flightNumber)
        errors.push('Flight number is required');
    if (!data.originAirportIataCode)
        errors.push('Origin airport IATA code is required');
    if (!data.destinationAirportIataCode)
        errors.push('Destination airport IATA code is required');
    if (!data.scheduledDepartureTimestampUTC)
        errors.push('Scheduled departure time is required');
    if (data.dataQualityScore !== undefined && (data.dataQualityScore < 0 || data.dataQualityScore > 1)) {
        errors.push('Data quality score must be between 0 and 1');
    }
    if (!data.flightStatus)
        warnings.push('Flight status not provided');
    if (!data.airlineIcaoCode && !data.airlineIataCode)
        warnings.push('No airline code provided');
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
export function validateWeatherData(data) {
    const errors = [];
    const warnings = [];
    if (!data.airportIataCode)
        errors.push('Airport IATA code is required');
    if (!data.observationTimestampUTC)
        errors.push('Observation timestamp is required');
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
// Export constants for data quality thresholds
export const DATA_QUALITY_THRESHOLDS = {
    EXCELLENT: 0.9,
    GOOD: 0.75,
    FAIR: 0.6,
    POOR: 0.4,
    MINIMUM_ACCEPTABLE: 0.3
};
export const SOURCE_RELIABILITY_SCORES = {
    flightaware: 0.95,
    aviationstack: 0.85,
    opensky: 0.75,
    weatherapi: 0.9,
    openweather: 0.8
};
//# sourceMappingURL=canonical-models.js.map