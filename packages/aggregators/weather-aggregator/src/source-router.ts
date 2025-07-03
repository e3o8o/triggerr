/**
 * @file source-router.ts
 * @description This component is responsible for intelligent weather data source selection.
 *
 * The WeatherSourceRouter will contain the business logic to decide which weather API
 * (e.g., Google Weather, OpenWeatherMap) to call for a given request. This logic
 * can be based on factors like cost, reliability, data quality, or the specific
 * type of data needed (e.g., historical vs. forecast).
 *
 * For the MVP, it returns a static, prioritized list.
 */

import type { CanonicalWeatherObservation } from "@triggerr/shared";

// Generic interface for weather data API clients
export interface IWeatherApiClient {
  name: string;
  priority: number;
  reliability: number; // 0.0 to 1.0
  fetchWeather(
    coordinates: { latitude: number; longitude: number },
    date?: string,
  ): Promise<CanonicalWeatherObservation | null>;
  isAvailable(): Promise<boolean>;
}

export class WeatherSourceRouter {
  private sources: IWeatherApiClient[];
  private healthStatus: Map<string, boolean> = new Map();
  private lastHealthCheck: Map<string, number> = new Map();
  private healthCheckInterval = 10 * 60 * 1000; // 10 minutes for weather APIs

  constructor(clients: IWeatherApiClient[]) {
    // Sort clients by priority (higher priority first)
    this.sources = clients.sort((a, b) => b.priority - a.priority);
    console.log(
      `[WeatherSourceRouter] Initialized with ${clients.length} available clients.`,
    );
    console.log(
      "Client priorities:",
      this.sources.map((c) => `${c.name}(${c.priority})`).join(", "),
    );
  }

  /**
   * Gets a prioritized list of data sources for a given weather query.
   * @param {object} coordinates - The latitude and longitude for the weather query.
   * @returns {Promise<IWeatherApiClient[]>} An array of data source clients in the order they should be queried.
   */
  public async getSources(coordinates: {
    latitude: number;
    longitude: number;
  }): Promise<IWeatherApiClient[]> {
    console.log(
      `[WeatherSourceRouter] Determining source priority for coordinates: ${coordinates.latitude}, ${coordinates.longitude}`,
    );

    // Check health status of all sources
    await this.updateHealthStatus();

    // Filter to only healthy sources
    const availableSources = this.sources.filter((source) => {
      const isHealthy = this.healthStatus.get(source.name) !== false;
      if (!isHealthy) {
        console.log(
          `[WeatherSourceRouter] Skipping unhealthy source: ${source.name}`,
        );
      }
      return isHealthy;
    });

    console.log(
      `[WeatherSourceRouter] Selected ${availableSources.length} sources:`,
      availableSources.map((s) => s.name).join(", "),
    );

    return availableSources;
  }

  /**
   * Update health status of all data sources.
   */
  private async updateHealthStatus(): Promise<void> {
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
            console.warn(
              `[WeatherSourceRouter] Health check failed for ${source.name}`,
            );
          }
        } catch (error) {
          console.error(
            `[WeatherSourceRouter] Health check error for ${source.name}:`,
            error,
          );
          this.healthStatus.set(source.name, false);
          this.lastHealthCheck.set(source.name, now);
        }
      }
    }
  }

  /**
   * Get the current health status of all sources.
   */
  public getHealthStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const source of this.sources) {
      status[source.name] = this.healthStatus.get(source.name) ?? true;
    }
    return status;
  }

  /**
   * Manually mark a source as unhealthy (for error handling).
   */
  public markSourceUnhealthy(sourceName: string): void {
    console.warn(
      `[WeatherSourceRouter] Marking source as unhealthy: ${sourceName}`,
    );
    this.healthStatus.set(sourceName, false);
    this.lastHealthCheck.set(sourceName, Date.now());
  }
}
