/**
 * @file source-router.ts
 * @description This component is responsible for intelligent data source selection.
 *
 * The SourceRouter will contain the business logic to decide which flight data API
 * (e.g., FlightAware, AviationStack) to call for a given request. This logic
 * can be based on factors like cost, reliability, data quality, or the specific
 * type of data needed.
 *
 * For the MVP, it might simply return a static, prioritized list. In the future,
 * this can be enhanced with dynamic logic.
 */

// import type { IFlightApiClient } from '@triggerr/integrations/types'; // Example of a future interface

// A simple type to represent a configured data source client.
type DataSourceClient = any; // Replace with a proper interface like IFlightApiClient

export class SourceRouter {
  private sources: DataSourceClient[];

  constructor(clients: DataSourceClient[]) {
    this.sources = clients;
    console.log("SourceRouter instantiated with available clients.");
  }

  /**
   * Gets a prioritized list of data sources for a given flight query.
   *
   * @param flightNumber The flight identifier.
   * @returns {DataSourceClient[]} An array of data source clients in the order they should be queried.
   */
  public getSources(flightNumber: string): DataSourceClient[] {
    console.log(`[SourceRouter] Determining source priority for flight: ${flightNumber}`);

    // TODO: Implement dynamic routing logic.
    // For example, use regex to check if flightNumber matches a specific airline
    // that we know has better data on a certain provider.

    // MVP Implementation: Return all sources in their default, static-prioritized order.
    return this.sources;
  }
}
