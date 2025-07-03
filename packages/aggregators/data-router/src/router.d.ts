/**
 * @file router.ts
 * @description The main DataRouter class that orchestrates data collection from multiple aggregators.
 *
 * This is the primary orchestrator responsible for:
 * 1. Coordinating requests between FlightAggregator and WeatherAggregator
 * 2. Managing the data flow for policy-related information gathering
 * 3. Providing a unified interface for the Quote Engine
 * 4. Handling cross-aggregator dependencies and error scenarios
 */
import type { CanonicalFlightData, CanonicalWeatherObservation } from "@triggerr/shared";
import { FlightAggregator } from "@triggerr/flight-aggregator";
import { WeatherAggregator } from "@triggerr/weather-aggregator/aggregator";
export interface PolicyDataRequest {
    flightNumber: string;
    date: string;
    airports?: string[];
    includeWeather?: boolean;
    weatherCoordinates?: Array<{
        latitude: number;
        longitude: number;
        name?: string;
    }>;
}
export interface PolicyDataResponse {
    flight: CanonicalFlightData;
    weather: CanonicalWeatherObservation[];
    aggregationMetadata: {
        flightDataSource: {
            fromCache: boolean;
            sourcesUsed: string[];
            qualityScore: number;
            processingTimeMs: number;
        };
        weatherDataSources: Array<{
            location: string;
            fromCache: boolean;
            sourcesUsed: string[];
            qualityScore: number;
            processingTimeMs: number;
        }>;
        totalProcessingTimeMs: number;
    };
}
export interface DataRouterConfig {
    flightAggregator?: FlightAggregator;
    weatherAggregator?: WeatherAggregator;
    maxConcurrentWeatherRequests?: number;
    defaultIncludeWeather?: boolean;
    timeoutMs?: number;
}
export declare class DataRouter {
    private flightAggregator;
    private weatherAggregator;
    private maxConcurrentWeatherRequests;
    private defaultIncludeWeather;
    private timeoutMs;
    constructor(flightAggregator: FlightAggregator, weatherAggregator: WeatherAggregator, config?: DataRouterConfig);
    /**
     * Main method to get all data required for policy generation.
     * This orchestrates both flight and weather data collection.
     */
    getDataForPolicy(request: PolicyDataRequest): Promise<PolicyDataResponse>;
    /**
     * Get flight data using the FlightAggregator.
     */
    private getFlightData;
    /**
     * Get weather data for relevant locations using the WeatherAggregator.
     */
    private getWeatherData;
    /**
     * Determine which locations need weather data.
     */
    private determineWeatherLocations;
    /**
     * Create weather request promises for all locations.
     */
    private createWeatherRequests;
    /**
     * Execute weather requests with concurrency control.
     */
    private executeConcurrentWeatherRequests;
    /**
     * Get location name for metadata.
     */
    private getLocationName;
    /**
     * Create a timeout promise for the entire operation.
     */
    private createTimeoutPromise;
    /**
     * Get health status of all aggregators.
     */
    getHealthStatus(): {
        flight: {
            sources: Record<string, boolean>;
            isHealthy: boolean;
        };
        weather: {
            sources: Record<string, boolean>;
            isHealthy: boolean;
        };
        overall: boolean;
    };
    /**
     * Clear all caches (useful for testing or manual refresh).
     */
    clearAllCaches(): void;
    /**
     * Add new airport coordinates to the mapping.
     */
    static addAirportCoordinates(airportCode: string, coordinates: {
        latitude: number;
        longitude: number;
    }): void;
    /**
     * Get available airport coordinates.
     */
    static getAvailableAirports(): string[];
}
//# sourceMappingURL=router.d.ts.map