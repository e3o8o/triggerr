/**
 * @file conflict-resolver.ts
 * @description This component is responsible for resolving data discrepancies between multiple API sources.
 *
 * When the aggregator fetches flight data from two or more providers, their information
 * might conflict (e.g., one says "Delayed", another says "On Time"). The ConflictResolver
 * applies a set of rules to determine the most trustworthy or "correct" version of the data.
 */

// We will need a canonical data model for flight data later.
// import type { CanonicalFlightData } from '@triggerr/core/models';

type FlightDataSourceResponse = any; // Replace with a proper type like CanonicalFlightData

export class ConflictResolver {
  constructor() {
    console.log("ConflictResolver instantiated.");
  }

  /**
   * Resolves conflicts between multiple flight data responses to produce a single, authoritative result.
   *
   * @param {FlightDataSourceResponse[]} responses - An array of data responses from various sources.
   * @returns {FlightDataSourceResponse} The single, resolved flight data object.
   */
  public resolve(responses: FlightDataSourceResponse[]): FlightDataSourceResponse {
    console.log(`[ConflictResolver] Resolving conflicts between ${responses.length} data sources.`);

    if (responses.length === 0) {
      throw new Error("Cannot resolve conflicts with zero responses.");
    }
    if (responses.length === 1) {
      return responses[0];
    }

    // TODO: Implement sophisticated conflict resolution logic.
    // This could involve a confidence score for each source, comparing timestamps,
    // or prioritizing data from providers known to be more accurate for certain fields.

    // MVP Implementation: "First one wins" strategy.
    // A simple and predictable, if not the most accurate, initial strategy.
    const resolvedData = responses[0];
    console.log(`[ConflictResolver] Resolved to use data from the first source.`);

    return resolvedData;
  }
}
