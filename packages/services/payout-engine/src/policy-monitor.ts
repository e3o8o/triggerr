/**
 * PolicyMonitor - Automated Policy Monitoring and Trigger Detection
 *
 * This module provides automated monitoring of active insurance policies
 * and evaluates trigger conditions based on real-time flight and weather data.
 * When trigger conditions are met, it automatically initiates payout processing.
 *
 * @module @triggerr/payout-engine/policy-monitor
 */

import { Database, Schema } from "@triggerr/core";
import { eq, and, inArray, lte, gte, isNull } from "drizzle-orm";
import { DataRouter } from "@triggerr/data-router";
import { Logger, LogLevel } from "@triggerr/core";
import { PayoutEngine } from "./payout-engine";
import type {
  CanonicalFlightData,
  CanonicalWeatherObservation,
} from "@triggerr/shared";

/**
 * Interface for trigger condition evaluation results
 */
interface TriggerEvaluationResult {
  isTriggered: boolean;
  reason: string;
  delayMinutes?: number;
  conditionsMet?: Record<string, any>;
  confidence?: number;
}

/**
 * Interface for policy with flight data
 */
interface PolicyWithFlight {
  id: string;
  policyNumber: string;
  userId: string | null;
  flightId: string;
  coverageType: string;
  status: string;
  terms: any;
  expiresAt: Date;
  flight: {
    flightNumber: string;
    departureAirportIataCode: string;
    arrivalAirportIataCode: string;
    departureScheduledAt: Date;
    arrivalScheduledAt: Date;
  };
}

/**
 * Configuration for monitoring intervals and thresholds
 */
interface MonitoringConfig {
  checkIntervalMs: number;
  maxPoliciesPerCheck: number;
  triggerDelayThresholdMinutes: number;
  weatherCheckRadius: number;
  enableScheduledMonitoring: boolean;
  enableRealTimeMonitoring: boolean;
}

/**
 * PolicyMonitor handles automated monitoring of active policies
 * and triggers payouts when claim conditions are met.
 */
export class PolicyMonitor {
  private dataRouter: DataRouter;
  private payoutEngine: PayoutEngine;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private config: MonitoringConfig;

  constructor(config?: Partial<MonitoringConfig>) {
    this.dataRouter = new DataRouter({
      logger: new Logger(LogLevel.INFO, "PolicyMonitor-DataRouter"),
    });
    this.payoutEngine = new PayoutEngine();
    this.config = {
      checkIntervalMs: 5 * 60 * 1000, // 5 minutes
      maxPoliciesPerCheck: 50,
      triggerDelayThresholdMinutes: 15,
      weatherCheckRadius: 50, // km
      enableScheduledMonitoring: true,
      enableRealTimeMonitoring: true,
      ...config,
    };
  }

  /**
   * Starts the policy monitoring service
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log("[PolicyMonitor] Monitoring is already running");
      return;
    }

    console.log("[PolicyMonitor] Starting policy monitoring service");

    try {
      // Database connection is handled automatically by the core module

      this.isMonitoring = true;

      // Run initial check
      await this.checkPolicies();

      // Set up scheduled monitoring if enabled
      if (this.config.enableScheduledMonitoring) {
        this.monitoringInterval = setInterval(
          () => this.checkPolicies(),
          this.config.checkIntervalMs,
        );
        console.log(
          `[PolicyMonitor] Scheduled monitoring started (interval: ${this.config.checkIntervalMs}ms)`,
        );
      }

      console.log(
        "[PolicyMonitor] Policy monitoring service started successfully",
      );
    } catch (error) {
      console.error("[PolicyMonitor] Failed to start monitoring:", error);
      this.isMonitoring = false;
      throw error;
    }
  }

  /**
   * Stops the policy monitoring service
   */
  async stopMonitoring(): Promise<void> {
    console.log("[PolicyMonitor] Stopping policy monitoring service");

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log("[PolicyMonitor] Policy monitoring service stopped");
  }

  /**
   * Checks all active policies for trigger conditions
   */
  private async checkPolicies(): Promise<void> {
    const requestId = crypto.randomUUID();
    console.log(`[PolicyMonitor] [${requestId}] Starting policy check`);

    try {
      // Fetch active policies that are eligible for monitoring
      const activePolicies = await this.fetchActivePolicies();

      if (activePolicies.length === 0) {
        console.log(
          `[PolicyMonitor] [${requestId}] No active policies to monitor`,
        );
        return;
      }

      console.log(
        `[PolicyMonitor] [${requestId}] Monitoring ${activePolicies.length} active policies`,
      );

      const triggeredPolicies: string[] = [];

      // Process policies in batches
      for (
        let i = 0;
        i < activePolicies.length;
        i += this.config.maxPoliciesPerCheck
      ) {
        const batch = activePolicies.slice(
          i,
          i + this.config.maxPoliciesPerCheck,
        );

        for (const policy of batch) {
          try {
            const evaluation = await this.evaluateTriggerConditions(
              policy,
              requestId,
            );

            if (evaluation.isTriggered) {
              console.log(
                `[PolicyMonitor] [${requestId}] Policy ${policy.id} triggered: ${evaluation.reason}`,
              );
              triggeredPolicies.push(policy.id);
            }
          } catch (error) {
            console.error(
              `[PolicyMonitor] [${requestId}] Error evaluating policy ${policy.id}:`,
              error,
            );
          }
        }
      }

      // Process triggered payouts
      if (triggeredPolicies.length > 0) {
        console.log(
          `[PolicyMonitor] [${requestId}] Processing payouts for ${triggeredPolicies.length} triggered policies`,
        );

        const payoutResult =
          await this.payoutEngine.processTriggeredPayouts(triggeredPolicies);

        console.log(
          `[PolicyMonitor] [${requestId}] Payout processing complete. Success: ${payoutResult.processedCount}, Failed: ${payoutResult.failedCount}`,
        );
      }
    } catch (error) {
      console.error(
        `[PolicyMonitor] [${requestId}] Error during policy check:`,
        error,
      );
    }
  }

  /**
   * Fetches active policies that are eligible for monitoring
   */
  private async fetchActivePolicies(): Promise<PolicyWithFlight[]> {
    try {
      const policies = await Database.db.query.policy.findMany({
        where: and(
          eq(Schema.policy.status, "ACTIVE"),
          gte(Schema.policy.expiresAt, new Date()),
        ),
        with: {
          flight: true,
        },
        limit: this.config.maxPoliciesPerCheck,
      });

      return policies
        .filter((policy) => policy.flight) // Only include policies with flight data
        .map((policy) => ({
          id: policy.id,
          policyNumber: policy.policyNumber,
          userId: policy.userId,
          flightId: policy.flightId,
          coverageType: policy.coverageType,
          status: policy.status,
          terms: policy.terms,
          expiresAt: policy.expiresAt,
          flight: {
            flightNumber: policy.flight!.flightNumber,
            departureAirportIataCode: policy.flight!.departureAirportIataCode,
            arrivalAirportIataCode: policy.flight!.arrivalAirportIataCode,
            departureScheduledAt: policy.flight!.departureScheduledAt,
            arrivalScheduledAt: policy.flight!.arrivalScheduledAt,
          },
        }));
    } catch (error) {
      console.error("[PolicyMonitor] Error fetching active policies:", error);
      return [];
    }
  }

  /**
   * Evaluates trigger conditions for a specific policy using real-time data
   */
  private async evaluateTriggerConditions(
    policy: PolicyWithFlight,
    requestId: string,
  ): Promise<TriggerEvaluationResult> {
    try {
      // Get real-time flight and weather data
      const policyData = await this.dataRouter.getDataForPolicy({
        flightNumber: policy.flight.flightNumber,
        date: policy.flight.departureScheduledAt.toISOString().split("T")[0]!,
        airports: [
          policy.flight.departureAirportIataCode,
          policy.flight.arrivalAirportIataCode,
        ],
        includeWeather: true,
      });

      const flightData = policyData.flight;
      const weatherData = policyData.weather;

      // Evaluate based on coverage type
      switch (policy.coverageType) {
        case "FLIGHT_DELAY":
          return this.evaluateFlightDelayTrigger(flightData, policy, requestId);

        case "FLIGHT_CANCELLATION":
          return this.evaluateFlightCancellationTrigger(
            flightData,
            policy,
            requestId,
          );

        case "WEATHER_DISRUPTION":
          return this.evaluateWeatherDisruptionTrigger(
            flightData,
            weatherData,
            policy,
            requestId,
          );

        default:
          return {
            isTriggered: false,
            reason: `Unsupported coverage type: ${policy.coverageType}`,
          };
      }
    } catch (error) {
      console.error(
        `[PolicyMonitor] [${requestId}] Error evaluating trigger conditions for policy ${policy.id}:`,
        error,
      );
      return {
        isTriggered: false,
        reason: `Error evaluating conditions: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Evaluates flight delay trigger conditions
   */
  private evaluateFlightDelayTrigger(
    flightData: CanonicalFlightData,
    policy: PolicyWithFlight,
    requestId: string,
  ): TriggerEvaluationResult {
    const delayThreshold =
      policy.terms?.delayThresholdMinutes ||
      this.config.triggerDelayThresholdMinutes;

    // Check if flight is delayed
    if (
      flightData.flightStatus === "DELAYED" &&
      flightData.departureDelayMinutes
    ) {
      const delayMinutes = flightData.departureDelayMinutes;

      if (delayMinutes >= delayThreshold) {
        console.log(
          `[PolicyMonitor] [${requestId}] Flight ${flightData.flightNumber} delayed by ${delayMinutes} minutes (threshold: ${delayThreshold})`,
        );

        return {
          isTriggered: true,
          reason: `Flight delayed by ${delayMinutes} minutes, exceeding threshold of ${delayThreshold} minutes`,
          delayMinutes,
          conditionsMet: {
            actualDelay: delayMinutes,
            threshold: delayThreshold,
            flightStatus: flightData.flightStatus,
          },
          confidence: 0.95,
        };
      }
    }

    return {
      isTriggered: false,
      reason: `Flight delay ${flightData.departureDelayMinutes || 0} minutes below threshold of ${delayThreshold} minutes`,
    };
  }

  /**
   * Evaluates flight cancellation trigger conditions
   */
  private evaluateFlightCancellationTrigger(
    flightData: CanonicalFlightData,
    policy: PolicyWithFlight,
    requestId: string,
  ): TriggerEvaluationResult {
    if (flightData.flightStatus === "CANCELLED") {
      console.log(
        `[PolicyMonitor] [${requestId}] Flight ${flightData.flightNumber} cancelled`,
      );

      return {
        isTriggered: true,
        reason: "Flight has been cancelled",
        conditionsMet: {
          flightStatus: flightData.flightStatus,
          cancellationReason: flightData.cancellationReason || "Unknown",
        },
        confidence: 0.99,
      };
    }

    return {
      isTriggered: false,
      reason: `Flight status is ${flightData.flightStatus}, not cancelled`,
    };
  }

  /**
   * Evaluates weather disruption trigger conditions
   */
  private evaluateWeatherDisruptionTrigger(
    flightData: CanonicalFlightData,
    weatherData: CanonicalWeatherObservation[],
    policy: PolicyWithFlight,
    requestId: string,
  ): TriggerEvaluationResult {
    // Check for severe weather conditions
    const severeWeatherConditions = ["THUNDERSTORM", "SNOW", "HEAVY_RAIN"];

    for (const weather of weatherData) {
      if (severeWeatherConditions.includes(weather.weatherCondition)) {
        console.log(
          `[PolicyMonitor] [${requestId}] Severe weather detected: ${weather.weatherCondition} at ${weather.airportIataCode}`,
        );

        return {
          isTriggered: true,
          reason: `Severe weather condition detected: ${weather.weatherCondition}`,
          conditionsMet: {
            weatherCondition: weather.weatherCondition,
            location: weather.airportIataCode,
            temperature: weather.temperature,
            windSpeed: weather.windSpeed,
            flightStatus: flightData.flightStatus,
          },
          confidence: 0.85,
        };
      }
    }

    // Check if flight is delayed due to weather
    if (
      flightData.flightStatus === "DELAYED" &&
      flightData.departureDelayMinutes &&
      flightData.departureDelayMinutes >= 30
    ) {
      // Check for weather-related delay indicators
      const weatherIndicators = weatherData.some(
        (w) =>
          (w.windSpeed && w.windSpeed > 50) ||
          w.weatherCondition === "HEAVY_RAIN",
      );

      if (weatherIndicators) {
        return {
          isTriggered: true,
          reason: `Weather-related flight delay: ${flightData.departureDelayMinutes} minutes`,
          delayMinutes: flightData.departureDelayMinutes,
          conditionsMet: {
            delayMinutes: flightData.departureDelayMinutes,
            weatherConditions: weatherData.map((w) => ({
              condition: w.weatherCondition,
              windSpeed: w.windSpeed,
              location: w.airportIataCode,
            })),
          },
          confidence: 0.75,
        };
      }
    }

    return {
      isTriggered: false,
      reason: "No severe weather conditions detected",
    };
  }

  /**
   * Manually triggers evaluation for specific policies
   */
  async evaluateSpecificPolicies(policyIds: string[]): Promise<{
    evaluated: number;
    triggered: number;
    results: Array<{
      policyId: string;
      evaluation: TriggerEvaluationResult;
    }>;
  }> {
    const requestId = crypto.randomUUID();
    console.log(
      `[PolicyMonitor] [${requestId}] Manual evaluation requested for ${policyIds.length} policies`,
    );

    const results: Array<{
      policyId: string;
      evaluation: TriggerEvaluationResult;
    }> = [];

    let triggeredCount = 0;

    for (const policyId of policyIds) {
      try {
        const policies = await Database.db.query.policy.findMany({
          where: eq(Schema.policy.id, policyId),
          with: { flight: true },
        });

        if (policies.length === 0) {
          results.push({
            policyId,
            evaluation: {
              isTriggered: false,
              reason: "Policy not found",
            },
          });
          continue;
        }

        const policy = policies[0] as any;
        const evaluation = await this.evaluateTriggerConditions(
          policy,
          requestId,
        );

        results.push({
          policyId,
          evaluation,
        });

        if (evaluation.isTriggered) {
          triggeredCount++;
        }
      } catch (error) {
        console.error(
          `[PolicyMonitor] [${requestId}] Error evaluating policy ${policyId}:`,
          error,
        );
        results.push({
          policyId,
          evaluation: {
            isTriggered: false,
            reason: `Evaluation error: ${error instanceof Error ? error.message : String(error)}`,
          },
        });
      }
    }

    return {
      evaluated: results.length,
      triggered: triggeredCount,
      results,
    };
  }

  /**
   * Gets monitoring status and statistics
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    config: MonitoringConfig;
    uptime: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      uptime: this.isMonitoring ? Date.now() : 0,
    };
  }
}
