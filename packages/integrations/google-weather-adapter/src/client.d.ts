/**
 * Google Weather API Client Adapter
 *
 * This adapter integrates with the Google Weather API to fetch weather forecast data
 * and transform it into our canonical data format.
 *
 * API Documentation: https://weather.googleapis.com/
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
    fetchWeatherByAirport(airportCode: string, date?: string): Promise<CanonicalWeatherObservation | null>;
    isAvailable(): Promise<boolean>;
}
export declare class GoogleWeatherClient implements IWeatherApiClient {
    readonly name = "GoogleWeather";
    readonly priority = 90;
    readonly reliability = 0.9;
    private readonly baseUrl;
    private readonly apiKey;
    private readonly timeout;
    constructor(apiKey: string);
    /**
     * Fetch weather data for specific coordinates.
     */
    fetchWeather(coordinates: {
        latitude: number;
        longitude: number;
    }, date?: string): Promise<CanonicalWeatherObservation | null>;
    /**
     * Fetch weather data for a specific airport by IATA code.
     */
    fetchWeatherByAirport(airportCode: string, date?: string): Promise<CanonicalWeatherObservation | null>;
    /**
     * Check if the Google Weather API is available.
     */
    isAvailable(): Promise<boolean>;
    /**
     * Transform Google Weather forecast data to canonical format.
     */
    private transformToCanonical;
    /**
     * Map Google Weather condition types to standard format.
     */
    private mapWeatherCondition;
    /**
     * Convert temperature to Celsius.
     */
    private convertToCelsius;
    /**
     * Convert Celsius to Fahrenheit.
     */
    private convertToFahrenheit;
    /**
     * Extract wind data from forecast.
     */
    private extractWindData;
    /**
     * Convert cardinal direction to degrees.
     */
    private cardinalTodegrees;
    /**
     * Determine precipitation type from weather condition.
     */
    private determinePrecipitationType;
    /**
     * Calculate data quality score based on available fields.
     */
    private calculateQualityScore;
}
//# sourceMappingURL=client.d.ts.map