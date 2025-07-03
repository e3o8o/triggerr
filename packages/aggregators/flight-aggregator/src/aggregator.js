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
import { CacheManager } from "@triggerr/core/utils/cache-manager";
import { SourceRouter } from "./source-router";
import { ConflictResolver } from "./conflict-resolver";
export class FlightAggregator {
    cacheManager;
    sourceRouter;
    conflictResolver;
    maxSources;
    timeoutMs;
    constructor(apiClients, config = {}) {
        // Initialize dependencies with defaults or provided instances
        this.cacheManager =
            config.cacheManager || new CacheManager();
        this.sourceRouter = config.sourceRouter || new SourceRouter(apiClients);
        this.conflictResolver = config.conflictResolver || new ConflictResolver();
        this.maxSources = config.maxSources || 3;
        this.timeoutMs = config.timeoutMs || 30000; // 30 seconds
        console.log(`[FlightAggregator] Initialized with ${apiClients.length} API clients, max sources: ${this.maxSources}`);
    }
    /**
     * Main method to get flight status data.
     * This orchestrates the entire data aggregation workflow.
     */
    async getFlightStatus(identifier) {
        const startTime = Date.now();
        const { flightNumber, date } = identifier;
        const dateStr = date || new Date().toISOString().split("T")[0];
        console.log(`[FlightAggregator] Starting aggregation for flight ${flightNumber} on ${dateStr}`);
        try {
            // Step 1: Check cache
            const cacheResult = await this.checkCache(flightNumber, dateStr);
            if (cacheResult) {
                const processingTime = Date.now() - startTime;
                console.log(`[FlightAggregator] Cache HIT for ${flightNumber} (${processingTime}ms)`);
                return {
                    data: cacheResult,
                    fromCache: true,
                    sourcesUsed: [],
                    conflicts: 0,
                    qualityScore: cacheResult.dataQualityScore,
                    processingTimeMs: processingTime,
                };
            }
            // Step 2: Get prioritized data sources
            const sources = await this.sourceRouter.getSources(flightNumber);
            if (sources.length === 0) {
                throw new Error("No available data sources");
            }
            console.log(`[FlightAggregator] Found ${sources.length} available sources`);
            // Step 3: Fetch data from sources
            const responses = await this.fetchFromSources(sources, flightNumber, dateStr);
            if (responses.length === 0) {
                throw new Error("No successful responses from any data source");
            }
            console.log(`[FlightAggregator] Got ${responses.length} successful responses`);
            // Step 4: Resolve conflicts and merge data
            const resolutionResult = this.conflictResolver.resolve(responses);
            // Step 5: Cache the result
            await this.cacheResult(flightNumber, dateStr, resolutionResult.resolvedData);
            const processingTime = Date.now() - startTime;
            console.log(`[FlightAggregator] Successfully aggregated data for ${flightNumber} (${processingTime}ms)`);
            return {
                data: resolutionResult.resolvedData,
                fromCache: false,
                sourcesUsed: responses.map((r) => r.sourceContributions[0]?.source || "unknown"),
                conflicts: resolutionResult.conflicts.length,
                qualityScore: resolutionResult.qualityScore,
                processingTimeMs: processingTime,
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            console.error(`[FlightAggregator] Failed to aggregate data for ${flightNumber}:`, error);
            throw new Error(`Flight aggregation failed for ${flightNumber}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Check cache for existing flight data.
     */
    async checkCache(flightNumber, date) {
        try {
            const cacheKey = this.cacheManager.generateCacheKey(flightNumber, date);
            const cachedData = this.cacheManager.get(cacheKey);
            if (cachedData) {
                // Validate cached data quality and age
                const dataAge = Date.now() - new Date(cachedData.lastUpdatedUTC).getTime();
                const maxAge = 5 * 60 * 1000; // 5 minutes
                if (dataAge > maxAge) {
                    console.log(`[FlightAggregator] Cached data for ${flightNumber} is stale (${Math.round(dataAge / 1000)}s old)`);
                    this.cacheManager.delete(cacheKey);
                    return null;
                }
                return cachedData;
            }
            return null;
        }
        catch (error) {
            console.warn(`[FlightAggregator] Cache check failed:`, error);
            return null;
        }
    }
    /**
     * Fetch data from multiple sources with parallel processing and timeout handling.
     */
    async fetchFromSources(sources, flightNumber, date) {
        const limitedSources = sources.slice(0, this.maxSources);
        const responses = [];
        console.log(`[FlightAggregator] Fetching from ${limitedSources.length} sources: ${limitedSources.map((s) => s.name).join(", ")}`);
        // Create promises for all source requests
        const sourcePromises = limitedSources.map(async (source) => {
            const sourceStartTime = Date.now();
            try {
                console.log(`[FlightAggregator] Requesting data from ${source.name}`);
                const data = await Promise.race([
                    source.fetchFlight(flightNumber, date),
                    this.createTimeoutPromise(source.name),
                ]);
                const sourceTime = Date.now() - sourceStartTime;
                if (data) {
                    console.log(`[FlightAggregator] ${source.name} responded successfully (${sourceTime}ms)`);
                    return { source: source.name, data, success: true };
                }
                else {
                    console.log(`[FlightAggregator] ${source.name} returned no data (${sourceTime}ms)`);
                    return { source: source.name, data: null, success: false };
                }
            }
            catch (error) {
                const sourceTime = Date.now() - sourceStartTime;
                console.warn(`[FlightAggregator] ${source.name} failed (${sourceTime}ms):`, error instanceof Error ? error.message : error);
                // Mark source as unhealthy for future requests
                this.sourceRouter.markSourceUnhealthy(source.name);
                return { source: source.name, data: null, success: false };
            }
        });
        // Wait for all promises to settle
        const results = await Promise.allSettled(sourcePromises);
        // Process results
        for (const result of results) {
            if (result.status === "fulfilled" &&
                result.value.success &&
                result.value.data) {
                responses.push(result.value.data);
            }
        }
        if (responses.length === 0) {
            console.warn(`[FlightAggregator] No successful responses for ${flightNumber}`);
        }
        return responses;
    }
    /**
     * Create a timeout promise for source requests.
     */
    createTimeoutPromise(sourceName) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`${sourceName} request timeout after ${this.timeoutMs}ms`));
            }, this.timeoutMs);
        });
    }
    /**
     * Cache the resolved flight data.
     */
    async cacheResult(flightNumber, date, data) {
        try {
            const cacheKey = this.cacheManager.generateCacheKey(flightNumber, date);
            this.cacheManager.set(cacheKey, data);
            console.log(`[FlightAggregator] Cached result for ${flightNumber}`);
        }
        catch (error) {
            console.warn(`[FlightAggregator] Failed to cache result:`, error);
            // Don't throw - caching failure shouldn't break the main flow
        }
    }
    /**
     * Validate flight data completeness and quality.
     */
    validateFlightData(data) {
        const requiredFields = [
            data.flightNumber,
            data.originAirportIataCode,
            data.destinationAirportIataCode,
            data.scheduledDepartureTimestampUTC,
        ];
        const hasRequiredFields = requiredFields.every((field) => field && field.trim() !== "");
        const hasValidQualityScore = data.dataQualityScore >= 0.3; // Minimum acceptable quality
        return hasRequiredFields && hasValidQualityScore;
    }
    /**
     * Get aggregator health status.
     */
    getHealthStatus() {
        const sources = this.sourceRouter.getHealthStatus();
        const healthySources = Object.values(sources).filter(Boolean).length;
        return {
            sources,
            cacheSize: 0, // CacheManager doesn't expose size in current implementation
            isHealthy: healthySources > 0,
        };
    }
    /**
     * Clear the cache (useful for testing or manual refresh).
     */
    clearCache() {
        this.cacheManager.clear();
        console.log("[FlightAggregator] Cache cleared");
    }
}
//# sourceMappingURL=aggregator.js.map