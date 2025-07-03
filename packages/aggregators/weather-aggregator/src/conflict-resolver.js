/**
 * @file conflict-resolver.ts
 * @description This component is responsible for resolving data discrepancies between multiple weather API sources.
 *
 * When the aggregator fetches weather data from two or more providers, their information
 * might conflict (e.g., one says "Cloudy", another says "Partly Cloudy"). The ConflictResolver
 * applies a set of rules to determine the most trustworthy or "correct" version of the data.
 */
import { SOURCE_RELIABILITY_SCORES } from "../../../shared/src/models/canonical-models";
export class WeatherConflictResolver {
    constructor() {
        console.log("[WeatherConflictResolver] Initialized.");
    }
    /**
     * Resolves conflicts between multiple weather data responses to produce a single,
     * authoritative canonical weather object.
     * @param {CanonicalWeatherObservation[]} responses - An array of data responses from various sources.
     * @returns {WeatherResolutionResult} The single, resolved weather data object along with metadata.
     */
    resolve(responses) {
        console.log(`[WeatherConflictResolver] Resolving conflicts between ${responses.length} weather sources.`);
        if (responses.length === 0) {
            throw new Error("Cannot resolve conflicts with zero responses.");
        }
        if (responses.length === 1) {
            console.log("[WeatherConflictResolver] Only one response available. No conflicts to resolve.");
            return {
                resolvedData: responses[0],
                conflicts: [],
                qualityScore: this.calculateQualityScore(responses[0]),
            };
        }
        console.log(`[WeatherConflictResolver] Resolving conflicts using confidence-based merging.`);
        const conflicts = [];
        const mergedData = this.mergeWeatherData(responses, conflicts);
        const qualityScore = this.calculateOverallQuality(responses, conflicts);
        console.log(`[WeatherConflictResolver] Resolution complete. Found ${conflicts.length} conflicts, quality score: ${qualityScore.toFixed(3)}`);
        return {
            resolvedData: mergedData,
            conflicts,
            qualityScore,
        };
    }
    /**
     * Merges weather data from multiple sources using field-level conflict resolution.
     */
    mergeWeatherData(responses, conflicts) {
        const baseData = { ...responses[0] }; // Start with the first response as a base
        const fieldsToResolve = [
            "temperature",
            "humidity",
            "windSpeed",
            "windDirection",
            "pressure",
            "visibility",
            "weatherCondition",
            "precipitation",
        ];
        for (const field of fieldsToResolve) {
            const fieldValues = this.extractFieldValues(responses, field);
            if (this.hasConflict(fieldValues)) {
                const resolutionStrategy = typeof fieldValues[0].value === "number"
                    ? "average"
                    : "highest_confidence";
                const resolved = this.resolveFieldConflict(field, fieldValues, resolutionStrategy);
                conflicts.push(resolved);
                baseData[field] = resolved.resolvedValue;
            }
            else if (fieldValues.length > 0) {
                // No conflict, just use the first value
                baseData[field] = fieldValues[0].value;
            }
        }
        baseData.sourceContributions = this.mergeSourceContributions(responses);
        baseData.dataQualityScore = this.calculateQualityScore(baseData);
        baseData.lastUpdatedUTC = new Date().toISOString();
        return baseData;
    }
    /**
     * Checks if a set of values for a field has a meaningful conflict.
     */
    hasConflict(values) {
        if (values.length <= 1)
            return false;
        const firstValue = values[0].value;
        return values.some((v) => v.value !== firstValue);
    }
    /**
     * Extracts all non-null values for a specific field from all responses.
     */
    extractFieldValues(responses, field) {
        const values = [];
        for (const response of responses) {
            const value = response[field];
            if (value !== undefined && value !== null) {
                const primarySource = response.sourceContributions[0]?.source || "unknown";
                const confidence = SOURCE_RELIABILITY_SCORES[primarySource] || 0.5;
                values.push({
                    source: primarySource,
                    value,
                    confidence,
                    timestamp: response.lastUpdatedUTC,
                });
            }
        }
        return values;
    }
    /**
     * Resolves a conflict for a single field based on a given strategy.
     */
    resolveFieldConflict(field, values, method) {
        let resolvedValue;
        if (method === "average") {
            // Weighted average for numerical values
            const totalWeight = values.reduce((sum, v) => sum + v.confidence, 0);
            const weightedSum = values.reduce((sum, v) => sum + v.value * v.confidence, 0);
            resolvedValue =
                totalWeight > 0 ? weightedSum / totalWeight : values[0].value;
        }
        else {
            // Highest confidence for categorical values
            const sortedValues = [...values].sort((a, b) => b.confidence - a.confidence);
            resolvedValue = sortedValues[0].value;
        }
        return {
            field,
            values,
            resolvedValue,
            resolutionMethod: method,
        };
    }
    /**
     * Merges source contribution arrays from all responses, removing duplicates.
     */
    mergeSourceContributions(responses) {
        const allContributions = responses.flatMap((r) => r.sourceContributions);
        const uniqueContributions = allContributions.reduce((acc, contribution) => {
            const existing = acc.find((c) => c.source === contribution.source);
            if (!existing || contribution.confidence > existing.confidence) {
                acc = acc.filter((c) => c.source !== contribution.source);
                acc.push(contribution);
            }
            return acc;
        }, []);
        return uniqueContributions.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * Calculates the quality score for a single canonical weather observation.
     */
    calculateQualityScore(data) {
        let score = 0;
        const requiredFields = [
            "airportIataCode",
            "observationTimestampUTC",
            "temperature",
            "weatherCondition",
        ];
        const importantFields = [
            "humidity",
            "windSpeed",
            "precipitation",
        ];
        let totalWeight = 0;
        requiredFields.forEach((field) => {
            totalWeight += 2;
            if (data[field] !== undefined && data[field] !== null)
                score += 2;
        });
        importantFields.forEach((field) => {
            totalWeight += 1;
            if (data[field] !== undefined && data[field] !== null)
                score += 1;
        });
        const sourceScore = data.sourceContributions.reduce((acc, contrib) => acc + contrib.confidence * 0.1, 0);
        return Math.min(1.0, score / totalWeight + sourceScore);
    }
    /**
     * Calculates the final, overall quality score based on all available data.
     */
    calculateOverallQuality(responses, conflicts) {
        const averageQuality = responses.reduce((sum, res) => sum + this.calculateQualityScore(res), 0) /
            responses.length;
        const conflictPenalty = Math.min(0.3, conflicts.length * 0.05);
        const sourceBonus = Math.min(0.1, (responses.length - 1) * 0.02);
        return Math.max(0, Math.min(1.0, averageQuality - conflictPenalty + sourceBonus));
    }
}
//# sourceMappingURL=conflict-resolver.js.map