/**
 * @file source-router.ts
 * @description This component is responsible for intelligent weather data source selection.
 *
 * The WeatherSourceRouter will contain the business logic to decide which weather API
 * (e.g., Google Weather, OpenWeatherMap) to call for a given request. This logic
 * can be based on factors like cost, reliability, data quality, or the specific
 * type of data needed (e.g., historical vs. forecast).
 *
 * For the MVP, it returns a static, prioritized list.
 */
import type { CanonicalWeatherObservation } from "@triggerr/shared";
export interface IWeatherApiClient {
    name: string;
    priority: number;
    reliability: number;
    fetchWeather(coordinates: {
        latitude: number;
        longitude: number;
    }, date?: string): Promise<CanonicalWeatherObservation | null>;
    isAvailable(): Promise<boolean>;
}
export declare class WeatherSourceRouter {
    private sources;
    private healthStatus;
    private lastHealthCheck;
    private healthCheckInterval;
    constructor(clients: IWeatherApiClient[]);
    /**
     * Gets a prioritized list of data sources for a given weather query.
     * @param {object} coordinates - The latitude and longitude for the weather query.
     * @returns {Promise<IWeatherApiClient[]>} An array of data source clients in the order they should be queried.
     */
    getSources(coordinates: {
        latitude: number;
        longitude: number;
    }): Promise<IWeatherApiClient[]>;
    /**
     * Update health status of all data sources.
     */
    private updateHealthStatus;
    /**
     * Get the current health status of all sources.
     */
    getHealthStatus(): Record<string, boolean>;
    /**
     * Manually mark a source as unhealthy (for error handling).
     */
    markSourceUnhealthy(sourceName: string): void;
}
//# sourceMappingURL=source-router.d.ts.map