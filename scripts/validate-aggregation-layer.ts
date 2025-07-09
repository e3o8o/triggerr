#!/usr/bin/env bun

/**
 * @file validate-aggregation-layer.ts
 * @description Comprehensive validation tests for the Data Aggregation Layer
 *
 * This script validates:
 * - FlightAggregator with mock API responses
 * - WeatherAggregator functionality
 * - Canonical data format consistency
 * - Caching and fallback mechanisms
 * - Conflict resolution between multiple sources
 * - Error handling and resilience
 *
 * Usage: bun run scripts/validate-aggregation-layer.ts
 */

import { config } from "dotenv";
import type {
  CanonicalFlightData,
  CanonicalWeatherObservation,
  IFlightApiClient,
  SourceContributions,
} from "@triggerr/shared";
import { FlightAggregator } from "@triggerr/flight-aggregator";
import { WeatherAggregator } from "@triggerr/weather-aggregator";
import { CacheManager } from "@triggerr/core";

// Load environment variables
config({ path: ".env" });

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  duration: number;
  details?: any;
  error?: string;
}

interface ValidationResults {
  testSuite: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  overallStatus: "PASS" | "FAIL";
}

class AggregationLayerValidator {
  private results: TestResult[] = [];

  constructor() {
    console.log("🚀 Starting Data Aggregation Layer Validation\n");
  }

  async runValidation(): Promise<ValidationResults> {
    console.log("📋 Running comprehensive aggregation layer tests...\n");

    // Test FlightAggregator
    await this.testFlightAggregatorBasics();
    await this.testFlightAggregatorCaching();
    await this.testFlightAggregatorConflictResolution();
    await this.testFlightAggregatorErrorHandling();

    // Test WeatherAggregator
    await this.testWeatherAggregatorBasics();
    await this.testWeatherAggregatorCaching();

    // Test canonical data formats
    await this.testCanonicalDataConsistency();

    // Test integrated scenarios
    await this.testCacheExpiration();
    await this.testMultiSourceAggregation();
    await this.testFallbackMechanisms();

    this.printResults();
    return this.generateSummary();
  }

  private async testFlightAggregatorBasics(): Promise<void> {
    await this.runTest("Flight Aggregator - Basic Initialization", async () => {
      const mockClients = this.createMockFlightClients();
      const aggregator = new FlightAggregator(mockClients);

      const healthStatus = aggregator.getHealthStatus();

      return {
        clientCount: mockClients.length,
        isHealthy: healthStatus.isHealthy,
        sources: Object.keys(healthStatus.sources),
        success: mockClients.length === 3 && healthStatus.isHealthy,
      };
    });

    await this.runTest(
      "Flight Aggregator - Single Source Response",
      async () => {
        const mockClients = this.createMockFlightClients();
        const aggregator = new FlightAggregator(mockClients);

        // Clear cache to ensure fresh test
        aggregator.clearCache();

        const result = await aggregator.getFlightStatus({
          flightNumber: "AA123",
          date: "2025-12-15",
        });

        return {
          hasData: !!result.data,
          fromCache: result.fromCache,
          sourcesUsed: result.sourcesUsed,
          qualityScore: result.qualityScore,
          flightNumber: result.data.flightNumber,
          hasValidTimestamps: !!result.data.scheduledDepartureTimestampUTC,
          success: !!result.data && result.qualityScore > 0.5,
        };
      },
    );
  }

  private async testFlightAggregatorCaching(): Promise<void> {
    await this.runTest("Flight Aggregator - Cache Hit/Miss", async () => {
      const mockClients = this.createMockFlightClients();
      const cacheManager = new CacheManager<CanonicalFlightData>(60000); // 1 minute TTL
      const aggregator = new FlightAggregator(mockClients, { cacheManager });

      // Clear cache
      aggregator.clearCache();

      // First call - should be cache miss
      const firstResult = await aggregator.getFlightStatus({
        flightNumber: "UA456",
        date: "2025-12-15",
      });

      // Second call - should be cache hit
      const secondResult = await aggregator.getFlightStatus({
        flightNumber: "UA456",
        date: "2025-12-15",
      });

      return {
        firstFromCache: firstResult.fromCache,
        secondFromCache: secondResult.fromCache,
        cacheWorking: !firstResult.fromCache && secondResult.fromCache,
        firstProcessingTime: firstResult.processingTimeMs,
        secondProcessingTime: secondResult.processingTimeMs,
        success: !firstResult.fromCache && secondResult.fromCache,
      };
    });

    await this.runTest("Flight Aggregator - Cache Expiration", async () => {
      const mockClients = this.createMockFlightClients();
      const cacheManager = new CacheManager<CanonicalFlightData>(100); // 100ms TTL
      const aggregator = new FlightAggregator(mockClients, { cacheManager });

      aggregator.clearCache();

      // First call
      const firstResult = await aggregator.getFlightStatus({
        flightNumber: "DL789",
        date: "2025-12-15",
      });

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second call after expiration
      const secondResult = await aggregator.getFlightStatus({
        flightNumber: "DL789",
        date: "2025-12-15",
      });

      return {
        firstFromCache: firstResult.fromCache,
        secondFromCache: secondResult.fromCache,
        cacheExpired: !firstResult.fromCache && !secondResult.fromCache,
        success: !firstResult.fromCache && !secondResult.fromCache,
      };
    });
  }

  private async testFlightAggregatorConflictResolution(): Promise<void> {
    await this.runTest("Flight Aggregator - Conflict Resolution", async () => {
      const mockClients = this.createConflictingFlightClients();
      const aggregator = new FlightAggregator(mockClients);

      aggregator.clearCache();

      const result = await aggregator.getFlightStatus({
        flightNumber: "BA999",
        date: "2025-12-15",
      });

      return {
        sourcesUsed: result.sourcesUsed,
        conflictCount: result.conflicts,
        qualityScore: result.qualityScore,
        resolvedStatus: result.data.flightStatus,
        hasMultipleSources: result.sourcesUsed.length > 1,
        success: result.sourcesUsed.length > 1 && result.qualityScore > 0.6,
      };
    });
  }

  private async testFlightAggregatorErrorHandling(): Promise<void> {
    await this.runTest("Flight Aggregator - Error Handling", async () => {
      const mockClients = this.createFailingFlightClients();
      const aggregator = new FlightAggregator(mockClients);

      aggregator.clearCache();

      let errorCaught = false;
      let errorMessage = "";

      try {
        await aggregator.getFlightStatus({
          flightNumber: "ERR404",
          date: "2025-12-15",
        });
      } catch (error) {
        errorCaught = true;
        errorMessage = error instanceof Error ? error.message : "Unknown error";
      }

      return {
        errorCaught,
        errorMessage,
        containsExpectedError: errorMessage.includes("No successful responses"),
        success:
          errorCaught && errorMessage.includes("No successful responses"),
      };
    });
  }

  private async testWeatherAggregatorBasics(): Promise<void> {
    await this.runTest("Weather Aggregator - Basic Functionality", async () => {
      const mockClients = this.createMockWeatherClients();
      const aggregator = new WeatherAggregator(mockClients);

      const result = await aggregator.getWeatherData({
        coordinates: { latitude: 40.7128, longitude: -74.006 },
        airportCode: "JFK",
        date: "2025-12-15",
      });

      return {
        hasData: !!result.data,
        fromCache: result.fromCache,
        sourcesUsed: result.sourcesUsed,
        qualityScore: result.qualityScore,
        temperature: result.data.temperatureCelsius,
        hasValidCoordinates: result.data.coordinates.latitude === 40.7128,
        success: !!result.data && result.qualityScore > 0.5,
      };
    });
  }

  private async testWeatherAggregatorCaching(): Promise<void> {
    await this.runTest("Weather Aggregator - Caching", async () => {
      const mockClients = this.createMockWeatherClients();
      const aggregator = new WeatherAggregator(mockClients);

      aggregator.clearCache();

      // First call
      const firstResult = await aggregator.getWeatherData({
        coordinates: { latitude: 34.0522, longitude: -118.2437 },
        airportCode: "LAX",
      });

      // Second call - should hit cache
      const secondResult = await aggregator.getWeatherData({
        coordinates: { latitude: 34.0522, longitude: -118.2437 },
        airportCode: "LAX",
      });

      return {
        firstFromCache: firstResult.fromCache,
        secondFromCache: secondResult.fromCache,
        cacheWorking: !firstResult.fromCache && secondResult.fromCache,
        success: !firstResult.fromCache && secondResult.fromCache,
      };
    });
  }

  private async testCanonicalDataConsistency(): Promise<void> {
    await this.runTest("Canonical Data Format - Flight Data", async () => {
      const mockClients = this.createMockFlightClients();
      const aggregator = new FlightAggregator(mockClients);

      const result = await aggregator.getFlightStatus({
        flightNumber: "SW123",
        date: "2025-12-15",
      });

      const flightData = result.data;
      const requiredFields = [
        "flightNumber",
        "originAirportIataCode",
        "destinationAirportIataCode",
        "scheduledDepartureTimestampUTC",
        "flightStatus",
        "sourceContributions",
        "dataQualityScore",
      ];

      const missingFields = requiredFields.filter(
        (field) =>
          !(field in flightData) ||
          flightData[field as keyof CanonicalFlightData] === undefined,
      );

      return {
        hasAllRequiredFields: missingFields.length === 0,
        missingFields,
        dataQualityScore: flightData.dataQualityScore,
        sourceContributions: flightData.sourceContributions.length,
        success: missingFields.length === 0 && flightData.dataQualityScore > 0,
      };
    });

    await this.runTest("Canonical Data Format - Weather Data", async () => {
      const mockClients = this.createMockWeatherClients();
      const aggregator = new WeatherAggregator(mockClients);

      const result = await aggregator.getWeatherData({
        coordinates: { latitude: 41.8781, longitude: -87.6298 },
        airportCode: "ORD",
      });

      const weatherData = result.data;
      const requiredFields = [
        "coordinates",
        "temperature",
        "windSpeed",
        "precipitationProbability",
        "weatherCondition",
        "sourceContributions",
        "dataQualityScore",
      ];

      const missingFields = requiredFields.filter(
        (field) =>
          !(field in weatherData) ||
          weatherData[field as keyof CanonicalWeatherObservation] === undefined,
      );

      return {
        hasAllRequiredFields: missingFields.length === 0,
        missingFields,
        dataQualityScore: weatherData.dataQualityScore,
        temperatureRange:
          weatherData.temperature >= -50 && weatherData.temperature <= 60,
        success: missingFields.length === 0 && weatherData.dataQualityScore > 0,
      };
    });
  }

  private async testCacheExpiration(): Promise<void> {
    await this.runTest("Cache Manager - TTL Behavior", async () => {
      const cache = new CacheManager<CanonicalFlightData>(50); // 50ms TTL

      const testData = this.createMockFlightData("TEST123");
      const cacheKey = cache.generateCacheKey("TEST123", "2025-12-15");

      // Set data
      cache.set(cacheKey, testData);
      const immediateGet = cache.get(cacheKey);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 60));
      const expiredGet = cache.get(cacheKey);

      return {
        immediateHit: !!immediateGet,
        expiredMiss: !expiredGet,
        ttlWorking: !!immediateGet && !expiredGet,
        success: !!immediateGet && !expiredGet,
      };
    });
  }

  private async testMultiSourceAggregation(): Promise<void> {
    await this.runTest(
      "Multi-Source Aggregation - Quality Scoring",
      async () => {
        const highQualityClients = this.createMockFlightClients();
        const lowQualityClients = this.createLowQualityFlightClients();

        const highQualityAggregator = new FlightAggregator(highQualityClients);
        const lowQualityAggregator = new FlightAggregator(lowQualityClients);

        const highQualityResult = await highQualityAggregator.getFlightStatus({
          flightNumber: "HQ001",
          date: "2025-12-15",
        });

        const lowQualityResult = await lowQualityAggregator.getFlightStatus({
          flightNumber: "LQ001",
          date: "2025-12-15",
        });

        return {
          highQualityScore: highQualityResult.qualityScore,
          lowQualityScore: lowQualityResult.qualityScore,
          qualityDifferentiation:
            highQualityResult.qualityScore > lowQualityResult.qualityScore,
          success:
            highQualityResult.qualityScore > lowQualityResult.qualityScore,
        };
      },
    );
  }

  private async testFallbackMechanisms(): Promise<void> {
    await this.runTest(
      "Fallback Mechanisms - Partial Source Failure",
      async () => {
        const mixedClients = this.createMixedReliabilityFlightClients();
        const aggregator = new FlightAggregator(mixedClients);

        const result = await aggregator.getFlightStatus({
          flightNumber: "MIX123",
          date: "2025-12-15",
        });

        return {
          hasResult: !!result.data,
          sourcesAttempted: mixedClients.length,
          sourcesSucceeded: result.sourcesUsed.length,
          partialSuccess:
            result.sourcesUsed.length > 0 &&
            result.sourcesUsed.length < mixedClients.length,
          success: !!result.data && result.sourcesUsed.length > 0,
        };
      },
    );
  }

  // Mock Client Creation Methods
  private createMockFlightClients(): IFlightApiClient[] {
    return [
      {
        name: "MockFlightAware",
        priority: 95,
        reliability: 0.95,
        isAvailable: async () => true,
        fetchFlight: async (flightNumber: string, date: string) => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return this.createMockFlightData(flightNumber, "FlightAware", 0.95);
        },
      },
      {
        name: "MockAviationStack",
        priority: 85,
        reliability: 0.85,
        isAvailable: async () => true,
        fetchFlight: async (flightNumber: string, date: string) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return this.createMockFlightData(flightNumber, "AviationStack", 0.85);
        },
      },
      {
        name: "MockOpenSky",
        priority: 75,
        reliability: 0.75,
        isAvailable: async () => true,
        fetchFlight: async (flightNumber: string, date: string) => {
          await new Promise((resolve) => setTimeout(resolve, 75));
          return this.createMockFlightData(flightNumber, "OpenSky", 0.75);
        },
      },
    ];
  }

  private createConflictingFlightClients(): IFlightApiClient[] {
    return [
      {
        name: "MockSource1",
        priority: 95,
        reliability: 0.95,
        isAvailable: async () => true,
        fetchFlight: async (flightNumber: string, date: string) => {
          const data = this.createMockFlightData(
            flightNumber,
            "MockSource1",
            0.95,
          );
          data.flightStatus = "ON_TIME";
          data.departureDelayMinutes = 0;
          return data;
        },
      },
      {
        name: "MockSource2",
        priority: 85,
        reliability: 0.85,
        isAvailable: async () => true,
        fetchFlight: async (flightNumber: string, date: string) => {
          const data = this.createMockFlightData(
            flightNumber,
            "MockSource2",
            0.85,
          );
          data.flightStatus = "DELAYED";
          data.departureDelayMinutes = 30;
          return data;
        },
      },
    ];
  }

  private createFailingFlightClients(): IFlightApiClient[] {
    return [
      {
        name: "FailingClient1",
        priority: 95,
        reliability: 0.0,
        isAvailable: async () => false,
        fetchFlight: async () => {
          throw new Error("API temporarily unavailable");
        },
      },
      {
        name: "FailingClient2",
        priority: 85,
        reliability: 0.0,
        isAvailable: async () => false,
        fetchFlight: async () => {
          throw new Error("Network timeout");
        },
      },
    ];
  }

  private createLowQualityFlightClients(): IFlightApiClient[] {
    return [
      {
        name: "LowQualitySource",
        priority: 50,
        reliability: 0.3,
        isAvailable: async () => true,
        fetchFlight: async (flightNumber: string, date: string) => {
          const data = this.createMockFlightData(
            flightNumber,
            "LowQualitySource",
            0.3,
          );
          // Remove some fields to lower quality
          delete (data as any).actualDepartureTimestampUTC;
          delete (data as any).departureDelayMinutes;
          return data;
        },
      },
    ];
  }

  private createMixedReliabilityFlightClients(): IFlightApiClient[] {
    return [
      {
        name: "ReliableSource",
        priority: 95,
        reliability: 0.95,
        isAvailable: async () => true,
        fetchFlight: async (flightNumber: string, date: string) => {
          return this.createMockFlightData(
            flightNumber,
            "ReliableSource",
            0.95,
          );
        },
      },
      {
        name: "UnreliableSource",
        priority: 85,
        reliability: 0.3,
        isAvailable: async () => true,
        fetchFlight: async () => {
          throw new Error("Random failure");
        },
      },
      {
        name: "SlowSource",
        priority: 75,
        reliability: 0.7,
        isAvailable: async () => true,
        fetchFlight: async () => {
          // Simulate timeout
          await new Promise((resolve) => setTimeout(resolve, 35000));
          throw new Error("Request timeout");
        },
      },
    ];
  }

  private createMockWeatherClients() {
    return [
      {
        name: "MockGoogleWeather",
        priority: 90,
        reliability: 0.9,
        isAvailable: async () => true,
        fetchWeather: async (
          coordinates: { latitude: number; longitude: number },
          date: string,
        ) => {
          return this.createMockWeatherData(coordinates, "GoogleWeather", 0.9);
        },
      },
    ];
  }

  private createMockFlightData(
    flightNumber: string,
    source: string = "Mock",
    confidence: number = 0.8,
  ): CanonicalFlightData {
    const sourceContributions: SourceContributions = [
      {
        source,
        confidence,
        contributedFields: [
          "flightNumber",
          "flightStatus",
          "scheduledDepartureTimestampUTC",
        ],
        lastUpdatedUTC: new Date().toISOString(),
      },
    ];

    return {
      flightNumber,
      originAirportIataCode: "JFK",
      destinationAirportIataCode: "LAX",
      scheduledDepartureTimestampUTC: "2025-12-15T10:00:00.000Z",
      scheduledArrivalTimestampUTC: "2025-12-15T13:30:00.000Z",
      actualDepartureTimestampUTC: "2025-12-15T10:05:00.000Z",
      actualArrivalTimestampUTC: "2025-12-15T13:35:00.000Z",
      flightStatus: "ON_TIME",
      departureDelayMinutes: 5,
      arrivalDelayMinutes: 5,
      airlineIcaoCode: "AAL",
      aircraftTypeIcaoCode: "B38M",
      sourceContributions,
      dataQualityScore: confidence,
      lastUpdatedUTC: new Date().toISOString(),
    };
  }

  private createMockWeatherData(
    coordinates: { latitude: number; longitude: number },
    source: string = "Mock",
    confidence: number = 0.8,
  ): CanonicalWeatherObservation {
    const sourceContributions: SourceContributions = [
      {
        source,
        confidence,
        contributedFields: ["temperature", "windSpeed", "condition"],
        lastUpdatedUTC: new Date().toISOString(),
      },
    ];

    return {
      id: `weather_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      airportIataCode: "JFK",
      observationTimestampUTC: "2025-12-15T12:00:00.000Z",
      coordinates,
      temperature: 22.5,
      windSpeed: 15.2,
      precipitationProbability: 0.1,
      weatherCondition: "PARTLY_CLOUDY",
      sourceContributions,
      dataQualityScore: confidence,
      lastUpdatedUTC: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private async runTest(
    name: string,
    testFn: () => Promise<any>,
  ): Promise<void> {
    const startTime = Date.now();
    console.log(`  🧪 ${name}...`);

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      const success = result.success !== false;
      const status = success ? "PASS" : "FAIL";
      const icon = success ? "✅" : "❌";

      console.log(`  ${icon} ${name} - ${status} (${duration}ms)`);
      if (
        result &&
        typeof result === "object" &&
        Object.keys(result).length > 1
      ) {
        console.log(`     ${JSON.stringify(result, null, 6)}`);
      }
      console.log("");

      this.results.push({
        name,
        status: status as "PASS" | "FAIL",
        duration,
        details: result,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.log(`  ❌ ${name} - FAIL (${duration}ms)`);
      console.log(`     Error: ${errorMessage}`);
      console.log("");

      this.results.push({
        name,
        status: "FAIL",
        duration,
        error: errorMessage,
      });
    }
  }

  private printResults(): void {
    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const total = this.results.length;

    console.log("\n" + "=".repeat(60));
    console.log("📊 AGGREGATION LAYER VALIDATION RESULTS");
    console.log("=".repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.results
        .filter((r) => r.status === "FAIL")
        .forEach((r) => {
          console.log(`  • ${r.name}: ${r.error || "Test assertion failed"}`);
        });
    }

    console.log("\n" + "=".repeat(60));
  }

  private generateSummary(): ValidationResults {
    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;

    return {
      testSuite: "Data Aggregation Layer",
      totalTests: this.results.length,
      passed,
      failed,
      results: this.results,
      overallStatus: failed === 0 ? "PASS" : "FAIL",
    };
  }
}

// Main execution
async function main() {
  try {
    const validator = new AggregationLayerValidator();
    const summary = await validator.runValidation();

    if (summary.overallStatus === "PASS") {
      console.log("🎉 All aggregation layer tests passed!");
      process.exit(0);
    } else {
      console.log("💥 Some aggregation layer tests failed.");
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Validation script failed:", error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.main) {
  main();
}

export { AggregationLayerValidator };
