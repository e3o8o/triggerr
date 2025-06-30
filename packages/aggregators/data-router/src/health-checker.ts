/**
 * @file health-checker.ts
 * @description This component monitors the health and status of external data source APIs.
 *
 * The HealthChecker will periodically ping the endpoints of our integrated data
 * providers (e.g., FlightAware, AviationStack) to check for uptime, latency,
 * and error rates. The SourceRouter can then use this health information to
 * dynamically avoid routing requests to a provider that is currently down or
 * performing poorly.
 */

// We will need a generic interface for our data source clients later.
// import type { IApiClient } from '@triggerr/integrations/types';
type ApiClient = any;

interface SourceHealthStatus {
  sourceName: string;
  isHealthy: boolean;
  latency: number; // in milliseconds
  lastChecked: Date;
  errorRate: number; // from 0.0 to 1.0
}

export class HealthChecker {
  private sources: ApiClient[];
  private healthStatus: Map<string, SourceHealthStatus>;

  constructor(clients: ApiClient[]) {
    this.sources = clients;
    this.healthStatus = new Map<string, SourceHealthStatus>();
    console.log("HealthChecker instantiated.");
    // In a real implementation, we would start a background timer here
    // to periodically run `checkAllSources()`.
    // setInterval(() => this.checkAllSources(), 5 * 60 * 1000); // e.g., every 5 minutes
  }

  /**
   * Checks the health of a single data source.
   * @param {ApiClient} client - The client for the data source to check.
   * @returns {Promise<SourceHealthStatus>} The health status of the source.
   */
  public async checkSource(client: ApiClient): Promise<SourceHealthStatus> {
    const sourceName = (client as any).name || 'UnknownSource';
    console.log(`[HealthChecker] Checking health of source: ${sourceName}`);

    // TODO: Implement a lightweight "ping" or "status" check for the given client.
    // This should be a low-cost API call that doesn't consume our main rate limit.
    const startTime = Date.now();
    let isHealthy = false;

    try {
      // const response = await client.ping(); // Assuming a .ping() method exists
      // isHealthy = response.ok;
      isHealthy = true; // Placeholder
    } catch (error) {
      isHealthy = false;
    }

    const latency = Date.now() - startTime;

    const status: SourceHealthStatus = {
      sourceName,
      isHealthy,
      latency,
      lastChecked: new Date(),
      errorRate: isHealthy ? 0 : 1, // Simplified error rate for now
    };

    this.healthStatus.set(sourceName, status);
    return status;
  }

  /**
   * Checks the health of all registered data sources.
   */
  public async checkAllSources(): Promise<void> {
    console.log("[HealthChecker] Performing health check on all sources...");
    await Promise.all(this.sources.map(client => this.checkSource(client)));
  }

  /**
   * Gets the current health status for a specific source.
   * @param {string} sourceName - The name of the source.
   * @returns {SourceHealthStatus | undefined} The health status, or undefined if not found.
   */
  public getStatus(sourceName: string): SourceHealthStatus | undefined {
    return this.healthStatus.get(sourceName);
  }
}
