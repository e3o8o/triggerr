/**
 * @file aggregator.ts
 * @description The main WeatherAggregator class that orchestrates weather data collection.
 *
 * This is the primary class responsible for:
 * 1. Managing cache lookups and storage for weather data
 * 2. Routing requests to appropriate weather data sources via WeatherSourceRouter
 * 3. Fetching data from multiple weather API providers in parallel
 * 4. Resolving conflicts between weather data sources via WeatherConflictResolver
 * 5. Returning clean, canonical weather data
 */

import type { CanonicalWeatherObservation } from "@triggerr/shared";
import { CacheManager } from "@triggerr/core";
import { WeatherSourceRouter, type IWeatherApiClient } from "./source-router";
import {
  WeatherConflictResolver,
  type WeatherResolutionResult,
} from "./conflict-resolver";

export interface WeatherAggregatorConfig {
  cacheManager?: CacheManager<CanonicalWeatherObservation>;
  sourceRouter?: WeatherSourceRouter;
  conflictResolver?: WeatherConflictResolver;
  maxSources?: number;
  timeoutMs?: number;
}

export interface WeatherIdentifier {
  coordinates: { latitude: number; longitude: number };
  airportCode?: string; // For better cache keying
  date?: string; // ISO date string, defaults to today
}

export interface WeatherAggregationResult {
  data: CanonicalWeatherObservation;
  fromCache: boolean;
  sourcesUsed: string[];
  conflicts: number;
  qualityScore: number;
  processingTimeMs: number;
}

export class WeatherAggregator {
  private cacheManager: CacheManager<CanonicalWeatherObservation>;
  private sourceRouter: WeatherSourceRouter;
  private conflictResolver: WeatherConflictResolver;
  private maxSources: number;
  private timeoutMs: number;

  constructor(
    apiClients: IWeatherApiClient[],
    config: WeatherAggregatorConfig = {},
  ) {
    this.cacheManager =
      config.cacheManager || new CacheManager<CanonicalWeatherObservation>();
    this.sourceRouter =
      config.sourceRouter || new WeatherSourceRouter(apiClients);
    this.conflictResolver =
      config.conflictResolver || new WeatherConflictResolver();
    this.maxSources = config.maxSources || 2; // Weather data is often less varied
    this.timeoutMs = config.timeoutMs || 20000; // 20 seconds timeout

    console.log(
      `[WeatherAggregator] Initialized with ${apiClients.length} API clients, max sources: ${this.maxSources}`,
    );
  }

  /**
   * Main method to get weather data.
   */
  async getWeatherData(
    identifier: WeatherIdentifier,
  ): Promise<WeatherAggregationResult> {
    const startTime = Date.now();
    const { coordinates, airportCode, date } = identifier;
    const dateStr = date || new Date().toISOString().split("T")[0];
    const locationKey =
      airportCode || `${coordinates.latitude},${coordinates.longitude}`;

    console.log(
      `[WeatherAggregator] Starting aggregation for weather at ${locationKey} on ${dateStr}`,
    );

    try {
      const cacheResult = await this.checkCache(locationKey, dateStr);
      if (cacheResult) {
        const processingTime = Date.now() - startTime;
        console.log(
          `[WeatherAggregator] Cache HIT for ${locationKey} (${processingTime}ms)`,
        );
        return {
          data: cacheResult,
          fromCache: true,
          sourcesUsed: [],
          conflicts: 0,
          qualityScore: cacheResult.dataQualityScore,
          processingTimeMs: processingTime,
        };
      }

      const sources = await this.sourceRouter.getSources(coordinates);
      if (sources.length === 0) {
        throw new Error("No available weather data sources");
      }

      const responses = await this.fetchFromSources(
        sources,
        coordinates,
        dateStr,
      );
      if (responses.length === 0) {
        throw new Error("No successful responses from any weather data source");
      }

      const resolutionResult = this.conflictResolver.resolve(responses);

      await this.cacheResult(
        locationKey,
        dateStr,
        resolutionResult.resolvedData,
      );

      const processingTime = Date.now() - startTime;
      console.log(
        `[WeatherAggregator] Successfully aggregated weather data for ${locationKey} (${processingTime}ms)`,
      );

      return {
        data: resolutionResult.resolvedData,
        fromCache: false,
        sourcesUsed: responses.map(
          (r) => r.sourceContributions[0]?.source || "unknown",
        ),
        conflicts: resolutionResult.conflicts.length,
        qualityScore: resolutionResult.qualityScore,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      console.error(
        `[WeatherAggregator] Failed to aggregate weather data for ${locationKey}:`,
        error,
      );
      throw new Error(
        `Weather aggregation failed for ${locationKey}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async checkCache(
    locationKey: string,
    date: string,
  ): Promise<CanonicalWeatherObservation | null> {
    const cacheKey = this.cacheManager.generateWeatherCacheKey(
      locationKey,
      date,
    );
    const cachedData = this.cacheManager.get(cacheKey);
    if (cachedData) {
      const dataAge =
        Date.now() - new Date(cachedData.lastUpdatedUTC).getTime();
      const maxAge = 30 * 60 * 1000; // 30 minutes for weather
      if (dataAge > maxAge) {
        this.cacheManager.delete(cacheKey);
        return null;
      }
      return cachedData;
    }
    return null;
  }

  private async fetchFromSources(
    sources: IWeatherApiClient[],
    coordinates: { latitude: number; longitude: number },
    date: string,
  ): Promise<CanonicalWeatherObservation[]> {
    const limitedSources = sources.slice(0, this.maxSources);
    const responses: CanonicalWeatherObservation[] = [];

    console.log(
      `[WeatherAggregator] Fetching from ${limitedSources.length} sources: ${limitedSources.map((s) => s.name).join(", ")}`,
    );

    const sourcePromises = limitedSources.map(async (source) => {
      const sourceStartTime = Date.now();
      try {
        const data = await Promise.race([
          source.fetchWeather(coordinates, date),
          this.createTimeoutPromise(source.name),
        ]);
        const sourceTime = Date.now() - sourceStartTime;
        if (data) {
          console.log(
            `[WeatherAggregator] ${source.name} responded successfully (${sourceTime}ms)`,
          );
          return { source: source.name, data, success: true };
        }
        return { source: source.name, data: null, success: false };
      } catch (error) {
        const sourceTime = Date.now() - sourceStartTime;
        console.warn(
          `[WeatherAggregator] ${source.name} failed (${sourceTime}ms):`,
          error instanceof Error ? error.message : error,
        );
        this.sourceRouter.markSourceUnhealthy(source.name);
        return { source: source.name, data: null, success: false };
      }
    });

    const results = await Promise.allSettled(sourcePromises);
    for (const result of results) {
      if (
        result.status === "fulfilled" &&
        result.value.success &&
        result.value.data
      ) {
        responses.push(result.value.data);
      }
    }

    return responses;
  }

  private createTimeoutPromise(sourceName: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `${sourceName} request timeout after ${this.timeoutMs}ms`,
            ),
          ),
        this.timeoutMs,
      );
    });
  }

  private async cacheResult(
    locationKey: string,
    date: string,
    data: CanonicalWeatherObservation,
  ): Promise<void> {
    try {
      const cacheKey = this.cacheManager.generateWeatherCacheKey(
        locationKey,
        date,
      );
      this.cacheManager.set(cacheKey, data);
    } catch (error) {
      console.warn(`[WeatherAggregator] Failed to cache result:`, error);
    }
  }

  public getHealthStatus(): {
    sources: Record<string, boolean>;
    cacheSize: number;
    isHealthy: boolean;
  } {
    const sources = this.sourceRouter.getHealthStatus();
    const healthySources = Object.values(sources).filter(Boolean).length;
    return {
      sources,
      cacheSize: 0, // CacheManager does not expose size in this implementation
      isHealthy: healthySources > 0,
    };
  }

  public clearCache(): void {
    this.cacheManager.clear();
    console.log("[WeatherAggregator] Cache cleared");
  }
}
