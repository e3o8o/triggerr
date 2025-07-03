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
import type { CanonicalWeatherObservation } from "../../../shared/src/models/canonical-models";
import { CacheManager } from "../../../core/src/utils/cache-manager";
import { WeatherSourceRouter, type IWeatherApiClient } from "./source-router";
import { WeatherConflictResolver } from "./conflict-resolver";
export interface WeatherAggregatorConfig {
    cacheManager?: CacheManager<CanonicalWeatherObservation>;
    sourceRouter?: WeatherSourceRouter;
    conflictResolver?: WeatherConflictResolver;
    maxSources?: number;
    timeoutMs?: number;
}
export interface WeatherIdentifier {
    coordinates: {
        latitude: number;
        longitude: number;
    };
    airportCode?: string;
    date?: string;
}
export interface WeatherAggregationResult {
    data: CanonicalWeatherObservation;
    fromCache: boolean;
    sourcesUsed: string[];
    conflicts: number;
    qualityScore: number;
    processingTimeMs: number;
}
export declare class WeatherAggregator {
    private cacheManager;
    private sourceRouter;
    private conflictResolver;
    private maxSources;
    private timeoutMs;
    constructor(apiClients: IWeatherApiClient[], config?: WeatherAggregatorConfig);
    /**
     * Main method to get weather data.
     */
    getWeatherData(identifier: WeatherIdentifier): Promise<WeatherAggregationResult>;
    private checkCache;
    private fetchFromSources;
    private createTimeoutPromise;
    private cacheResult;
    getHealthStatus(): {
        sources: Record<string, boolean>;
        cacheSize: number;
        isHealthy: boolean;
    };
    clearCache(): void;
}
//# sourceMappingURL=aggregator.d.ts.map