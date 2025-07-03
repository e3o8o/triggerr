/**
 * @file conflict-resolver.ts
 * @description This component is responsible for resolving data discrepancies between multiple API sources.
 *
 * When the aggregator fetches flight data from two or more providers, their information
 * might conflict (e.g., one says "Delayed", another says "On Time"). The ConflictResolver
 * applies a set of rules to determine the most trustworthy or "correct" version of the data.
 */
import { SOURCE_RELIABILITY_SCORES } from "@triggerr/shared/models/canonical-models";
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
    resolve(responses) {
        console.log(`[ConflictResolver] Resolving conflicts between ${responses.length} data sources.`);
        if (responses.length === 0) {
            throw new Error("Cannot resolve conflicts with zero responses.");
        }
        if (responses.length === 1) {
            console.log("[ConflictResolver] Only one response available. No conflicts to resolve.");
            return {
                resolvedData: responses[0],
                conflicts: [],
                qualityScore: this.calculateQualityScore(responses[0]),
            };
        }
        console.log(`[ConflictResolver] Resolving conflicts using confidence-based merging.`);
        // Perform field-level conflict resolution
        const conflicts = [];
        const mergedData = this.mergeFlightData(responses, conflicts);
        // Calculate overall quality score
        const qualityScore = this.calculateOverallQuality(responses, conflicts);
        console.log(`[ConflictResolver] Resolution complete. Found ${conflicts.length} conflicts, quality score: ${qualityScore.toFixed(3)}`);
        return {
            resolvedData: mergedData,
            conflicts,
            qualityScore,
        };
    }
    /**
     * Merge flight data from multiple sources using field-level conflict resolution.
     */
    mergeFlightData(responses, conflicts) {
        // Start with the first response as base
        const baseData = { ...responses[0] };
        // Critical fields that need careful resolution
        const criticalFields = [
            "flightStatus",
            "actualDepartureTimestampUTC",
            "actualArrivalTimestampUTC",
            "departureDelayMinutes",
            "arrivalDelayMinutes",
            "cancelledAt",
            "divertedTo",
        ];
        // Resolve conflicts for critical fields
        for (const field of criticalFields) {
            const fieldValues = this.extractFieldValues(responses, field);
            if (fieldValues.length > 1) {
                const resolved = this.resolveFieldConflict(field, fieldValues);
                conflicts.push(resolved);
                baseData[field] = resolved.resolvedValue;
            }
        }
        // Merge source contributions
        baseData.sourceContributions = this.mergeSourceContributions(responses);
        // Update data quality score
        baseData.dataQualityScore = this.calculateQualityScore(baseData);
        // Update last updated timestamp
        baseData.lastUpdatedUTC = new Date().toISOString();
        return baseData;
    }
    /**
     * Extract values for a specific field from all responses.
     */
    extractFieldValues(responses, field) {
        const values = [];
        for (const response of responses) {
            const value = response[field];
            if (value !== undefined && value !== null) {
                // Determine source from sourceContributions
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
     * Resolve conflict for a specific field.
     */
    resolveFieldConflict(field, values) {
        // Sort by confidence (highest first), then by timestamp (most recent first)
        const sortedValues = values.sort((a, b) => {
            if (a.confidence !== b.confidence) {
                return b.confidence - a.confidence;
            }
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        // Use highest confidence value as resolved value
        const resolvedValue = sortedValues[0].value;
        return {
            field,
            values,
            resolvedValue,
            resolutionMethod: "highest_confidence",
        };
    }
    /**
     * Merge source contributions from multiple responses.
     */
    mergeSourceContributions(responses) {
        const allContributions = [];
        for (const response of responses) {
            allContributions.push(...response.sourceContributions);
        }
        // Remove duplicates and sort by confidence
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
     * Calculate quality score for a single flight data response.
     */
    calculateQualityScore(data) {
        let score = 0;
        let totalFields = 0;
        // Required fields (higher weight)
        const requiredFields = [
            "flightNumber",
            "originAirportIataCode",
            "destinationAirportIataCode",
            "scheduledDepartureTimestampUTC",
        ];
        for (const field of requiredFields) {
            totalFields += 2; // Double weight for required fields
            if (data[field])
                score += 2;
        }
        // Optional but important fields
        const importantFields = [
            "flightStatus",
            "actualDepartureTimestampUTC",
            "actualArrivalTimestampUTC",
            "airlineIcaoCode",
        ];
        for (const field of importantFields) {
            totalFields += 1;
            if (data[field])
                score += 1;
        }
        // Factor in source reliability
        const sourceScore = data.sourceContributions.reduce((acc, contrib) => {
            return acc + contrib.confidence * 0.1;
        }, 0);
        return Math.min(1.0, score / totalFields + sourceScore);
    }
    /**
     * Calculate overall quality score considering all responses and conflicts.
     */
    calculateOverallQuality(responses, conflicts) {
        // Base quality from individual responses
        const averageQuality = responses.reduce((sum, response) => {
            return sum + this.calculateQualityScore(response);
        }, 0) / responses.length;
        // Penalty for conflicts (indicates uncertainty)
        const conflictPenalty = Math.min(0.3, conflicts.length * 0.05);
        // Bonus for multiple sources (indicates better coverage)
        const sourceBonus = Math.min(0.1, (responses.length - 1) * 0.02);
        return Math.max(0, Math.min(1.0, averageQuality - conflictPenalty + sourceBonus));
    }
}
//# sourceMappingURL=conflict-resolver.js.map