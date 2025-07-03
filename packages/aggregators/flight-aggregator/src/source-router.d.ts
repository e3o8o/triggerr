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
import type { IFlightApiClient } from "@triggerr/shared";
type DataSourceClient = IFlightApiClient;
export declare class SourceRouter {
    private sources;
    private healthStatus;
    private lastHealthCheck;
    private healthCheckInterval;
    constructor(clients: DataSourceClient[]);
    /**
     * Gets a prioritized list of data sources for a given flight query.
     *
     * @param flightNumber The flight identifier.
     * @returns {DataSourceClient[]} An array of data source clients in the order they should be queried.
     */
    getSources(flightNumber: string): Promise<DataSourceClient[]>;
    /**
     * Apply airline-specific routing preferences.
     * This is where we can add logic to prefer certain APIs for specific airlines.
     */
    private applyAirlineRouting;
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
export {};
//# sourceMappingURL=source-router.d.ts.map