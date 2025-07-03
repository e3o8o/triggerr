/**
 * @file aggregator.ts
 * @description The main FlightAggregator class that orchestrates flight data collection.
 *
 * This is the primary class responsible for:
 * 1. Managing cache lookups and storage
 * 2. Routing requests to appropriate data sources
 * 3. Fetching data from multiple API providers
 * 4. Resolving conflicts between data sources
 * 5. Returning clean, canonical flight data
 */
import type { CanonicalFlightData } from "@triggerr/shared";
import { CacheManager } from "@triggerr/core";
import { SourceRouter } from "./source-router";
import { type IFlightApiClient } from "@triggerr/shared";
import { ConflictResolver } from "./conflict-resolver";
export interface FlightAggregatorConfig {
    cacheManager?: CacheManager<CanonicalFlightData>;
    sourceRouter?: SourceRouter;
    conflictResolver?: ConflictResolver;
    maxSources?: number;
    timeoutMs?: number;
}
export interface FlightIdentifier {
    flightNumber: string;
    date?: string;
}
export interface AggregationResult {
    data: CanonicalFlightData;
    fromCache: boolean;
    sourcesUsed: string[];
    conflicts: number;
    qualityScore: number;
    processingTimeMs: number;
}
export declare class FlightAggregator {
    private cacheManager;
    private sourceRouter;
    private conflictResolver;
    private maxSources;
    private timeoutMs;
    constructor(apiClients: IFlightApiClient[], config?: FlightAggregatorConfig);
    /**
     * Main method to get flight status data.
     * This orchestrates the entire data aggregation workflow.
     */
    getFlightStatus(identifier: FlightIdentifier): Promise<AggregationResult>;
    /**
     * Check cache for existing flight data.
     */
    private checkCache;
    /**
     * Fetch data from multiple sources with parallel processing and timeout handling.
     */
    private fetchFromSources;
    /**
     * Create a timeout promise for source requests.
     */
    private createTimeoutPromise;
    /**
     * Cache the resolved flight data.
     */
    private cacheResult;
    /**
     * Validate flight data completeness and quality.
     */
    private validateFlightData;
    /**
     * Get aggregator health status.
     */
    getHealthStatus(): {
        sources: Record<string, boolean>;
        cacheSize: number;
        isHealthy: boolean;
    };
    /**
     * Clear the cache (useful for testing or manual refresh).
     */
    clearCache(): void;
}
//# sourceMappingURL=aggregator.d.ts.map