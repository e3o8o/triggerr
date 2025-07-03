/**
 * @file conflict-resolver.ts
 * @description This component is responsible for resolving data discrepancies between multiple API sources.
 *
 * When the aggregator fetches flight data from two or more providers, their information
 * might conflict (e.g., one says "Delayed", another says "On Time"). The ConflictResolver
 * applies a set of rules to determine the most trustworthy or "correct" version of the data.
 */
import type { CanonicalFlightData } from "@triggerr/shared";
interface ConflictField {
    field: string;
    values: Array<{
        source: string;
        value: any;
        confidence: number;
        timestamp: string;
    }>;
    resolvedValue: any;
    resolutionMethod: "highest_confidence" | "most_recent" | "manual_review";
}
interface ResolutionResult {
    resolvedData: CanonicalFlightData;
    conflicts: ConflictField[];
    qualityScore: number;
}
export declare class ConflictResolver {
    constructor();
    /**
     * Resolves conflicts between multiple flight data responses to produce a single, authoritative result.
     *
     * @param {FlightDataSourceResponse[]} responses - An array of data responses from various sources.
     * @returns {FlightDataSourceResponse} The single, resolved flight data object.
     */
    resolve(responses: CanonicalFlightData[]): ResolutionResult;
    /**
     * Merge flight data from multiple sources using field-level conflict resolution.
     */
    private mergeFlightData;
    /**
     * Extract values for a specific field from all responses.
     */
    private extractFieldValues;
    /**
     * Resolve conflict for a specific field.
     */
    private resolveFieldConflict;
    /**
     * Merge source contributions from multiple responses.
     */
    private mergeSourceContributions;
    /**
     * Calculate quality score for a single flight data response.
     */
    private calculateQualityScore;
    /**
     * Calculate overall quality score considering all responses and conflicts.
     */
    private calculateOverallQuality;
}
export {};
//# sourceMappingURL=conflict-resolver.d.ts.map