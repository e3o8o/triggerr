/**
 * @file source-router.ts
 * @description This component is responsible for intelligent data source selection.
 *
 * The SourceRouter will contain the business logic to decide which flight data API
 * (e.g., FlightAware, AviationStack) to call for a given request. This logic
 * can be based on factors like cost, reliability, data quality, or the specific
 * type of data needed.
 *
 * For the MVP, it returns a prioritized list: FlightAware > AviationStack > OpenSky.
 * In the future, this can be enhanced with dynamic logic.
 */
export class SourceRouter {
    sources;
    healthStatus = new Map();
    lastHealthCheck = new Map();
    healthCheckInterval = 5 * 60 * 1000; // 5 minutes
    constructor(clients) {
        // Sort clients by priority (higher priority first)
        this.sources = clients.sort((a, b) => b.priority - a.priority);
        console.log(`SourceRouter instantiated with ${clients.length} available clients.`);
        console.log("Client priorities:", this.sources.map((c) => `${c.name}(${c.priority})`).join(", "));
    }
    /**
     * Gets a prioritized list of data sources for a given flight query.
     *
     * @param flightNumber The flight identifier.
     * @returns {DataSourceClient[]} An array of data source clients in the order they should be queried.
     */
    async getSources(flightNumber) {
        console.log(`[SourceRouter] Determining source priority for flight: ${flightNumber}`);
        // Check health status of all sources
        await this.updateHealthStatus();
        // Filter to only healthy sources
        const availableSources = this.sources.filter((source) => {
            const isHealthy = this.healthStatus.get(source.name) !== false;
            if (!isHealthy) {
                console.log(`[SourceRouter] Skipping unhealthy source: ${source.name}`);
            }
            return isHealthy;
        });
        // Apply airline-specific routing logic (future enhancement)
        const routedSources = this.applyAirlineRouting(flightNumber, availableSources);
        console.log(`[SourceRouter] Selected ${routedSources.length} sources for ${flightNumber}:`, routedSources.map((s) => s.name).join(", "));
        return routedSources;
    }
    /**
     * Apply airline-specific routing preferences.
     * This is where we can add logic to prefer certain APIs for specific airlines.
     */
    applyAirlineRouting(flightNumber, sources) {
        // Extract airline code from flight number (first 2-3 letters)
        const airlineCode = flightNumber.match(/^[A-Z]{2,3}/)?.[0];
        if (!airlineCode) {
            return sources;
        }
        // Future: Add airline-specific preferences
        // For now, return sources in default priority order
        return sources;
    }
    /**
     * Update health status of all data sources.
     */
    async updateHealthStatus() {
        const now = Date.now();
        for (const source of this.sources) {
            const lastCheck = this.lastHealthCheck.get(source.name) || 0;
            // Only check health if enough time has passed
            if (now - lastCheck > this.healthCheckInterval) {
                try {
                    const isHealthy = await source.isAvailable();
                    this.healthStatus.set(source.name, isHealthy);
                    this.lastHealthCheck.set(source.name, now);
                    if (!isHealthy) {
                        console.warn(`[SourceRouter] Health check failed for ${source.name}`);
                    }
                }
                catch (error) {
                    console.error(`[SourceRouter] Health check error for ${source.name}:`, error);
                    this.healthStatus.set(source.name, false);
                    this.lastHealthCheck.set(source.name, now);
                }
            }
        }
    }
    /**
     * Get the current health status of all sources.
     */
    getHealthStatus() {
        const status = {};
        for (const source of this.sources) {
            status[source.name] = this.healthStatus.get(source.name) ?? true;
        }
        return status;
    }
    /**
     * Manually mark a source as unhealthy (for error handling).
     */
    markSourceUnhealthy(sourceName) {
        console.warn(`[SourceRouter] Marking source as unhealthy: ${sourceName}`);
        this.healthStatus.set(sourceName, false);
        this.lastHealthCheck.set(sourceName, Date.now());
    }
}
//# sourceMappingURL=source-router.js.map