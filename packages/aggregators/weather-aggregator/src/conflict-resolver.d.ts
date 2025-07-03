/**
 * @file conflict-resolver.ts
 * @description This component is responsible for resolving data discrepancies between multiple weather API sources.
 *
 * When the aggregator fetches weather data from two or more providers, their information
 * might conflict (e.g., one says "Cloudy", another says "Partly Cloudy"). The ConflictResolver
 * applies a set of rules to determine the most trustworthy or "correct" version of the data.
 */
import type { CanonicalWeatherObservation } from "../../../shared/src/models/canonical-models";
interface ConflictField {
    field: keyof CanonicalWeatherObservation;
    values: Array<{
        source: string;
        value: any;
        confidence: number;
        timestamp: string;
    }>;
    resolvedValue: any;
    resolutionMethod: "highest_confidence" | "average" | "most_recent";
}
export interface WeatherResolutionResult {
    resolvedData: CanonicalWeatherObservation;
    conflicts: ConflictField[];
    qualityScore: number;
}
export declare class WeatherConflictResolver {
    constructor();
    /**
     * Resolves conflicts between multiple weather data responses to produce a single,
     * authoritative canonical weather object.
     * @param {CanonicalWeatherObservation[]} responses - An array of data responses from various sources.
     * @returns {WeatherResolutionResult} The single, resolved weather data object along with metadata.
     */
    resolve(responses: CanonicalWeatherObservation[]): WeatherResolutionResult;
    /**
     * Merges weather data from multiple sources using field-level conflict resolution.
     */
    private mergeWeatherData;
    /**
     * Checks if a set of values for a field has a meaningful conflict.
     */
    private hasConflict;
    /**
     * Extracts all non-null values for a specific field from all responses.
     */
    private extractFieldValues;
    /**
     * Resolves a conflict for a single field based on a given strategy.
     */
    private resolveFieldConflict;
    /**
     * Merges source contribution arrays from all responses, removing duplicates.
     */
    private mergeSourceContributions;
    /**
     * Calculates the quality score for a single canonical weather observation.
     */
    private calculateQualityScore;
    /**
     * Calculates the final, overall quality score based on all available data.
     */
    private calculateOverallQuality;
}
export {};
//# sourceMappingURL=conflict-resolver.d.ts.map