/**
 * @file cost-optimizer.ts
 * @description This component provides logic for optimizing API usage based on cost.
 *
 * Each external API provider (FlightAware, AviationStack, etc.) has a different
 * cost structure. The CostOptimizer's job is to analyze these costs and provide
 * recommendations to the SourceRouter. For example, it might advise against using
 * a very expensive but high-quality data source for a low-value, preliminary check,
 * saving it instead for when high confidence is required.
 */

interface ApiCostProfile {
  sourceName: string;
  /** Cost per API call in a standard unit (e.g., tenths of a cent). */
  costPerCall: number;
  /** The quality or reliability score of the data from this source (0.0 to 1.0). */
  qualityScore: number;
}

export class CostOptimizer {
  private costProfiles: Map<string, ApiCostProfile>;

  constructor(profiles: ApiCostProfile[]) {
    this.costProfiles = new Map<string, ApiCostProfile>();
    profiles.forEach((profile) =>
      this.costProfiles.set(profile.sourceName, profile),
    );
    console.log("CostOptimizer instantiated with API cost profiles.");
  }

  /**
   * Recommends the most cost-effective data source for a given requirement.
   *
   * @param {string[]} availableSources - A list of currently healthy source names.
   * @param {object} requirements - The requirements for the data query.
   * @param {number} requirements.minQuality - The minimum acceptable quality score.
   * @returns {string | null} The name of the recommended source, or null if none meet the criteria.
   */
  public getOptimalSource(
    availableSources: string[],
    requirements: { minQuality: number },
  ): string | null {
    console.log(
      `[CostOptimizer] Finding optimal source from [${availableSources.join(", ")}] with min quality ${requirements.minQuality}`,
    );

    const eligibleSources = availableSources
      .map((sourceName) => this.costProfiles.get(sourceName))
      .filter(
        (profile): profile is ApiCostProfile =>
          profile !== undefined &&
          profile.qualityScore >= requirements.minQuality,
      );

    if (eligibleSources.length === 0) {
      console.warn(
        `[CostOptimizer] No sources meet the minimum quality requirement of ${requirements.minQuality}.`,
      );
      return null;
    }

    // Sort by cost, ascending. The first element is the cheapest.
    eligibleSources.sort((a, b) => a.costPerCall - b.costPerCall);

    const bestSource = eligibleSources[0];
    if (!bestSource) {
      console.warn(
        `[CostOptimizer] No sources available despite length check.`,
      );
      return null;
    }

    console.log(
      `[CostOptimizer] Recommending source: ${bestSource.sourceName} (Cost: ${bestSource.costPerCall})`,
    );

    return bestSource.sourceName;
  }
}
