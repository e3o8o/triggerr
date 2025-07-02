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

import type {
  CanonicalFlightData,
  CanonicalWeatherObservation,
} from "@triggerr/shared/models/canonical-models";
import {
  FlightAggregator,
  type AggregationResult,
  type FlightIdentifier,
} from "@triggerr/flight-aggregator/aggregator";
import {
  WeatherAggregator,
  type WeatherAggregationResult,
  type WeatherIdentifier,
} from "@triggerr/weather-aggregator/aggregator";

export interface PolicyDataRequest {
  flightNumber: string;
  date: string;
  airports?: string[]; // Optional - will extract from flight data if not provided
  includeWeather?: boolean; // Default true
  weatherCoordinates?: Array<{
    latitude: number;
    longitude: number;
    name?: string;
  }>; // Alternative to airports
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

// Airport coordinates mapping (expanded from weather adapter)
const AIRPORT_COORDINATES: Record<
  string,
  { latitude: number; longitude: number }
> = {
  JFK: { latitude: 40.6413, longitude: -73.7781 },
  LGA: { latitude: 40.7769, longitude: -73.874 },
  EWR: { latitude: 40.6925, longitude: -74.1687 },
  LAX: { latitude: 33.9425, longitude: -118.4081 },
  SFO: { latitude: 37.6213, longitude: -122.379 },
  ORD: { latitude: 41.9742, longitude: -87.9073 },
  DFW: { latitude: 32.8998, longitude: -97.0403 },
  LHR: { latitude: 51.47, longitude: -0.4543 },
  CDG: { latitude: 49.0097, longitude: 2.5479 },
  FRA: { latitude: 50.0379, longitude: 8.5622 },
  AMS: { latitude: 52.3105, longitude: 4.7683 },
  NRT: { latitude: 35.772, longitude: 140.3929 },
  HND: { latitude: 35.5494, longitude: 139.7798 },
  ICN: { latitude: 37.4602, longitude: 126.4407 },
  RIX: { latitude: 56.9236, longitude: 23.9711 },
  TLL: { latitude: 59.4133, longitude: 24.8328 },
  VNO: { latitude: 54.6341, longitude: 25.2858 },
  ARN: { latitude: 59.6519, longitude: 17.9186 },
  CPH: { latitude: 55.6175, longitude: 12.6531 },
  OSL: { latitude: 60.1976, longitude: 11.1004 },
  HEL: { latitude: 60.3172, longitude: 24.9633 },
  // Add more as needed for common routes
};

export class DataRouter {
  private flightAggregator: FlightAggregator;
  private weatherAggregator: WeatherAggregator;
  private maxConcurrentWeatherRequests: number;
  private defaultIncludeWeather: boolean;
  private timeoutMs: number;

  constructor(
    flightAggregator: FlightAggregator,
    weatherAggregator: WeatherAggregator,
    config: DataRouterConfig = {},
  ) {
    this.flightAggregator = flightAggregator;
    this.weatherAggregator = weatherAggregator;
    this.maxConcurrentWeatherRequests =
      config.maxConcurrentWeatherRequests || 3;
    this.defaultIncludeWeather = config.defaultIncludeWeather ?? true;
    this.timeoutMs = config.timeoutMs || 45000; // 45 seconds total

    console.log(
      `[DataRouter] Initialized with flight and weather aggregators, max concurrent weather requests: ${this.maxConcurrentWeatherRequests}`,
    );
  }

  /**
   * Main method to get all data required for policy generation.
   * This orchestrates both flight and weather data collection.
   */
  async getDataForPolicy(
    request: PolicyDataRequest,
  ): Promise<PolicyDataResponse> {
    const startTime = Date.now();
    const {
      flightNumber,
      date,
      airports,
      includeWeather = this.defaultIncludeWeather,
      weatherCoordinates,
    } = request;

    console.log(
      `[DataRouter] Starting data collection for policy: flight ${flightNumber} on ${date}`,
    );

    try {
      // Step 1: Get flight data (this is always required)
      const flightResult = await this.getFlightData(flightNumber, date);

      console.log(
        `[DataRouter] Flight data collected from ${flightResult.sourcesUsed.join(", ")} (quality: ${flightResult.qualityScore.toFixed(3)})`,
      );

      // Step 2: Get weather data if required
      let weatherResults: WeatherAggregationResult[] = [];
      if (includeWeather) {
        weatherResults = await this.getWeatherData(
          flightResult.data,
          airports,
          weatherCoordinates,
          date,
        );

        console.log(
          `[DataRouter] Weather data collected for ${weatherResults.length} locations`,
        );
      }

      const totalProcessingTime = Date.now() - startTime;

      console.log(
        `[DataRouter] Successfully collected all data for policy (${totalProcessingTime}ms)`,
      );

      // Step 3: Compile response
      const response: PolicyDataResponse = {
        flight: flightResult.data,
        weather: weatherResults.map((result) => result.data),
        aggregationMetadata: {
          flightDataSource: {
            fromCache: flightResult.fromCache,
            sourcesUsed: flightResult.sourcesUsed,
            qualityScore: flightResult.qualityScore,
            processingTimeMs: flightResult.processingTimeMs,
          },
          weatherDataSources: weatherResults.map((result, index) => ({
            location: this.getLocationName(result.data, index),
            fromCache: result.fromCache,
            sourcesUsed: result.sourcesUsed,
            qualityScore: result.qualityScore,
            processingTimeMs: result.processingTimeMs,
          })),
          totalProcessingTimeMs: totalProcessingTime,
        },
      };

      return response;
    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      console.error(
        `[DataRouter] Failed to collect policy data for flight ${flightNumber}:`,
        error,
      );
      throw new Error(
        `Policy data collection failed for ${flightNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get flight data using the FlightAggregator.
   */
  private async getFlightData(
    flightNumber: string,
    date: string,
  ): Promise<AggregationResult> {
    try {
      const flightIdentifier: FlightIdentifier = {
        flightNumber,
        date,
      };

      const result = await Promise.race([
        this.flightAggregator.getFlightStatus(flightIdentifier),
        this.createTimeoutPromise("Flight data collection"),
      ]);

      // Validate flight data quality
      if (result.qualityScore < 0.3) {
        console.warn(
          `[DataRouter] Flight data quality is low (${result.qualityScore.toFixed(3)}), but proceeding`,
        );
      }

      return result;
    } catch (error) {
      console.error(`[DataRouter] Flight data collection failed:`, error);
      throw new Error(
        `Failed to collect flight data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get weather data for relevant locations using the WeatherAggregator.
   */
  private async getWeatherData(
    flightData: CanonicalFlightData,
    providedAirports?: string[],
    providedCoordinates?: Array<{
      latitude: number;
      longitude: number;
      name?: string;
    }>,
    date?: string,
  ): Promise<WeatherAggregationResult[]> {
    try {
      // Determine locations to fetch weather for
      const weatherLocations = this.determineWeatherLocations(
        flightData,
        providedAirports,
        providedCoordinates,
      );

      if (weatherLocations.length === 0) {
        console.warn(
          `[DataRouter] No weather locations determined for flight ${flightData.flightNumber}`,
        );
        return [];
      }

      console.log(
        `[DataRouter] Collecting weather data for ${weatherLocations.length} locations: ${weatherLocations.map((l) => l.name || "coordinates").join(", ")}`,
      );

      // Create weather requests with concurrency limit
      const weatherPromises = this.createWeatherRequests(
        weatherLocations,
        date,
      );

      // Execute weather requests with concurrency control
      const weatherResults =
        await this.executeConcurrentWeatherRequests(weatherPromises);

      // Filter out failed requests
      const successfulResults = weatherResults.filter(
        (result) => result !== null,
      ) as WeatherAggregationResult[];

      if (successfulResults.length === 0) {
        console.warn(
          `[DataRouter] No successful weather data collection for any location`,
        );
      }

      return successfulResults;
    } catch (error) {
      console.error(`[DataRouter] Weather data collection failed:`, error);
      // Don't throw - weather data is often optional for policies
      console.warn(
        `[DataRouter] Proceeding without weather data due to error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return [];
    }
  }

  /**
   * Determine which locations need weather data.
   */
  private determineWeatherLocations(
    flightData: CanonicalFlightData,
    providedAirports?: string[],
    providedCoordinates?: Array<{
      latitude: number;
      longitude: number;
      name?: string;
    }>,
  ): Array<{
    coordinates: { latitude: number; longitude: number };
    name: string;
    airportCode?: string;
  }> {
    const locations: Array<{
      coordinates: { latitude: number; longitude: number };
      name: string;
      airportCode?: string;
    }> = [];

    // Use provided coordinates if available
    if (providedCoordinates && providedCoordinates.length > 0) {
      providedCoordinates.forEach((coord, index) => {
        locations.push({
          coordinates: coord,
          name: coord.name || `Location ${index + 1}`,
        });
      });
      return locations;
    }

    // Use provided airports if available
    if (providedAirports && providedAirports.length > 0) {
      providedAirports.forEach((airport) => {
        const coords = AIRPORT_COORDINATES[airport.toUpperCase()];
        if (coords) {
          locations.push({
            coordinates: coords,
            name: airport.toUpperCase(),
            airportCode: airport.toUpperCase(),
          });
        } else {
          console.warn(
            `[DataRouter] No coordinates found for airport ${airport}`,
          );
        }
      });
      return locations;
    }

    // Extract airports from flight data
    const originAirport = flightData.originAirportIataCode;
    const destinationAirport = flightData.destinationAirportIataCode;

    // Add origin airport weather
    if (originAirport && originAirport !== "UNKNOWN") {
      const coords = AIRPORT_COORDINATES[originAirport];
      if (coords) {
        locations.push({
          coordinates: coords,
          name: `${originAirport} (Origin)`,
          airportCode: originAirport,
        });
      }
    }

    // Add destination airport weather
    if (
      destinationAirport &&
      destinationAirport !== "UNKNOWN" &&
      destinationAirport !== originAirport
    ) {
      const coords = AIRPORT_COORDINATES[destinationAirport];
      if (coords) {
        locations.push({
          coordinates: coords,
          name: `${destinationAirport} (Destination)`,
          airportCode: destinationAirport,
        });
      }
    }

    return locations;
  }

  /**
   * Create weather request promises for all locations.
   */
  private createWeatherRequests(
    locations: Array<{
      coordinates: { latitude: number; longitude: number };
      name: string;
      airportCode?: string;
    }>,
    date?: string,
  ): Array<Promise<WeatherAggregationResult | null>> {
    return locations.map(async (location) => {
      try {
        const weatherIdentifier: WeatherIdentifier = {
          coordinates: location.coordinates,
          airportCode: location.airportCode,
          date,
        };

        return await this.weatherAggregator.getWeatherData(weatherIdentifier);
      } catch (error) {
        console.warn(
          `[DataRouter] Weather request failed for ${location.name}:`,
          error,
        );
        return null;
      }
    });
  }

  /**
   * Execute weather requests with concurrency control.
   */
  private async executeConcurrentWeatherRequests(
    promises: Array<Promise<WeatherAggregationResult | null>>,
  ): Promise<Array<WeatherAggregationResult | null>> {
    const results: Array<WeatherAggregationResult | null> = [];

    // Process promises in batches to respect concurrency limit
    for (
      let i = 0;
      i < promises.length;
      i += this.maxConcurrentWeatherRequests
    ) {
      const batch = promises.slice(i, i + this.maxConcurrentWeatherRequests);

      console.log(
        `[DataRouter] Processing weather batch ${Math.floor(i / this.maxConcurrentWeatherRequests) + 1} with ${batch.length} requests`,
      );

      const batchResults = await Promise.allSettled(batch);

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          console.warn(
            `[DataRouter] Weather request in batch failed:`,
            result.reason,
          );
          results.push(null);
        }
      }
    }

    return results;
  }

  /**
   * Get location name for metadata.
   */
  private getLocationName(
    weatherData: CanonicalWeatherObservation,
    index: number,
  ): string {
    if (
      weatherData.airportIataCode &&
      weatherData.airportIataCode !== "COORD"
    ) {
      return weatherData.airportIataCode;
    }
    return `Location ${index + 1}`;
  }

  /**
   * Create a timeout promise for the entire operation.
   */
  private createTimeoutPromise(operationName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timeout after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    });
  }

  /**
   * Get health status of all aggregators.
   */
  public getHealthStatus(): {
    flight: {
      sources: Record<string, boolean>;
      isHealthy: boolean;
    };
    weather: {
      sources: Record<string, boolean>;
      isHealthy: boolean;
    };
    overall: boolean;
  } {
    const flightHealth = this.flightAggregator.getHealthStatus();
    const weatherHealth = this.weatherAggregator.getHealthStatus();

    return {
      flight: {
        sources: flightHealth.sources,
        isHealthy: flightHealth.isHealthy,
      },
      weather: {
        sources: weatherHealth.sources,
        isHealthy: weatherHealth.isHealthy,
      },
      overall: flightHealth.isHealthy && weatherHealth.isHealthy,
    };
  }

  /**
   * Clear all caches (useful for testing or manual refresh).
   */
  public clearAllCaches(): void {
    this.flightAggregator.clearCache();
    this.weatherAggregator.clearCache();
    console.log("[DataRouter] All caches cleared");
  }

  /**
   * Add new airport coordinates to the mapping.
   */
  public static addAirportCoordinates(
    airportCode: string,
    coordinates: { latitude: number; longitude: number },
  ): void {
    AIRPORT_COORDINATES[airportCode.toUpperCase()] = coordinates;
    console.log(
      `[DataRouter] Added coordinates for airport ${airportCode.toUpperCase()}`,
    );
  }

  /**
   * Get available airport coordinates.
   */
  public static getAvailableAirports(): string[] {
    return Object.keys(AIRPORT_COORDINATES);
  }
}
