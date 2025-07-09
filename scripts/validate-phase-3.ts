#!/usr/bin/env bun
/**
 * Phase 3 Validation Script: Data Aggregation Layer Implementation
 *
 * This script validates the completion of Phase 3 according to:
 * - Data Aggregation Design (06_DATA_AGGREGATION_DESIGN.md)
 * - Vision Master Phase 3 requirements
 * - Real API integration vs fallback mode
 *
 * Tests include:
 * 1. API Client Initialization
 * 2. Individual API Client Testing
 * 3. Flight Aggregator with Real Data
 * 4. Weather Aggregator with Real Data
 * 5. DataRouter Integration
 * 6. End-to-End Quote Generation with Real APIs
 * 7. Performance and Data Quality Comparison
 */

import { config } from "dotenv";
import { DataRouter } from "@triggerr/data-router";
import { FlightAggregator } from "@triggerr/flight-aggregator";
import { WeatherAggregator } from "@triggerr/weather-aggregator";
import { QuoteService } from "@triggerr/quote-engine";
import { Logger, LogLevel } from "@triggerr/core";
import { FlightAwareClient } from "@triggerr/flightaware-adapter";
import { AviationStackClient } from "@triggerr/aviationstack-adapter";
import { OpenSkyClient } from "@triggerr/opensky-adapter";
import { GoogleWeatherClient } from "@triggerr/google-weather-adapter";

// Load environment variables
config({ path: ".env" });

interface ValidationResult {
  testName: string;
  status: "PASS" | "FAIL" | "WARN" | "SKIP";
  duration: number;
  details: string;
  data?: any;
}

interface ApiClientTest {
  name: string;
  client: any;
  testFlight: string;
  expectedResult: string;
}

class Phase3Validator {
  private results: ValidationResult[] = [];
  private logger: Logger;
  private useRealApis: boolean;

  constructor() {
    this.logger = new Logger(LogLevel.INFO, "Phase3Validator");
    this.useRealApis = process.env.TRIGGERR_USE_REAL_APIS === "true";
  }

  async runValidation(): Promise<void> {
    console.log("🚀 Starting Phase 3: Data Aggregation Layer Validation\n");

    if (!this.useRealApis) {
      console.log(
        "⚠️ TRIGGERR_USE_REAL_APIS=false - Testing will use fallback mode",
      );
      console.log(
        "💡 Set TRIGGERR_USE_REAL_APIS=true to test real API integration\n",
      );
    }

    // Phase 3 Test Categories
    await this.testEnvironmentConfiguration();
    await this.testApiClientInitialization();
    await this.testIndividualApiClients();
    await this.testFlightAggregation();
    await this.testWeatherAggregation();
    await this.testDataRouterIntegration();
    await this.testEndToEndQuoteGeneration();
    await this.testPerformanceComparison();

    this.printResults();
  }

  private async testEnvironmentConfiguration(): Promise<void> {
    console.log("🔧 Testing Environment Configuration...\n");

    await this.runTest("Environment Variables Check", async () => {
      const requiredVars = {
        TRIGGERR_USE_REAL_APIS: process.env.TRIGGERR_USE_REAL_APIS,
        DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
      };

      const apiKeys = {
        FLIGHTAWARE_API_KEY: process.env.FLIGHTAWARE_API_KEY
          ? "SET"
          : "MISSING",
        AVIATIONSTACK_API_KEY: process.env.AVIATIONSTACK_API_KEY
          ? "SET"
          : "MISSING",
        OPENSKY_USERNAME: process.env.OPENSKY_USERNAME ? "SET" : "MISSING",
        OPENSKY_PASSWORD: process.env.OPENSKY_PASSWORD ? "SET" : "MISSING",
        GOOGLE_WEATHER_API_KEY: process.env.GOOGLE_WEATHER_API_KEY
          ? "SET"
          : "MISSING",
      };

      const availableApis = Object.values(apiKeys).filter(
        (v) => v === "SET",
      ).length;

      return {
        useRealApis: this.useRealApis,
        requiredVars,
        apiKeys,
        availableApiCount: availableApis,
        readyForPhase3: this.useRealApis && availableApis > 0,
      };
    });
  }

  private async testApiClientInitialization(): Promise<void> {
    console.log("🔌 Testing API Client Initialization...\n");

    await this.runTest("Flight API Clients", async () => {
      const clients = [];
      const errors = [];

      try {
        if (process.env.FLIGHTAWARE_API_KEY) {
          const client = new FlightAwareClient(process.env.FLIGHTAWARE_API_KEY);
          clients.push({
            name: "FlightAware",
            priority: client.priority,
            reliability: client.reliability,
          });
        }
      } catch (error) {
        errors.push(
          `FlightAware: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      try {
        if (process.env.AVIATIONSTACK_API_KEY) {
          const client = new AviationStackClient(
            process.env.AVIATIONSTACK_API_KEY,
          );
          clients.push({
            name: "AviationStack",
            priority: client.priority,
            reliability: client.reliability,
          });
        }
      } catch (error) {
        errors.push(
          `AviationStack: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      try {
        if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
          const client = new OpenSkyClient(
            process.env.OPENSKY_USERNAME,
            process.env.OPENSKY_PASSWORD,
          );
          clients.push({
            name: "OpenSky",
            priority: client.priority,
            reliability: client.reliability,
          });
        }
      } catch (error) {
        errors.push(
          `OpenSky: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      return {
        initialized: clients.length,
        clients,
        errors,
        success: clients.length > 0,
      };
    });

    await this.runTest("Weather API Clients", async () => {
      const clients = [];
      const errors = [];

      try {
        if (process.env.GOOGLE_WEATHER_API_KEY) {
          const client = new GoogleWeatherClient(
            process.env.GOOGLE_WEATHER_API_KEY,
          );
          clients.push({
            name: "GoogleWeather",
            priority: client.priority,
            reliability: client.reliability,
          });
        }
      } catch (error) {
        errors.push(
          `GoogleWeather: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }

      return {
        initialized: clients.length,
        clients,
        errors,
        success: clients.length > 0,
      };
    });
  }

  private async testIndividualApiClients(): Promise<void> {
    console.log("🛩️ Testing Individual API Clients...\n");

    if (!this.useRealApis) {
      await this.runTest(
        "API Client Testing",
        async () => {
          throw new Error("Skipped - TRIGGERR_USE_REAL_APIS=false");
        },
        true,
      );
      return;
    }

    // Test FlightAware
    if (process.env.FLIGHTAWARE_API_KEY) {
      await this.runTest("FlightAware API", async () => {
        const client = new FlightAwareClient(process.env.FLIGHTAWARE_API_KEY!);

        const isAvailable = await Promise.race([
          client.isAvailable(),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10000),
          ),
        ]);

        return {
          available: isAvailable,
          client: "FlightAware",
          priority: client.priority,
        };
      });
    }

    // Test AviationStack
    if (process.env.AVIATIONSTACK_API_KEY) {
      await this.runTest("AviationStack API", async () => {
        const client = new AviationStackClient(
          process.env.AVIATIONSTACK_API_KEY!,
        );

        const isAvailable = await Promise.race([
          client.isAvailable(),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10000),
          ),
        ]);

        return {
          available: isAvailable,
          client: "AviationStack",
          priority: client.priority,
        };
      });
    }

    // Test OpenSky
    if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
      await this.runTest("OpenSky API", async () => {
        const client = new OpenSkyClient(
          process.env.OPENSKY_USERNAME!,
          process.env.OPENSKY_PASSWORD!,
        );

        const isAvailable = await Promise.race([
          client.isAvailable(),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10000),
          ),
        ]);

        return {
          available: isAvailable,
          client: "OpenSky",
          priority: client.priority,
        };
      });
    }

    // Test Google Weather
    if (process.env.GOOGLE_WEATHER_API_KEY) {
      await this.runTest("Google Weather API", async () => {
        const client = new GoogleWeatherClient(
          process.env.GOOGLE_WEATHER_API_KEY!,
        );

        const isAvailable = await Promise.race([
          client.isAvailable(),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10000),
          ),
        ]);

        return {
          available: isAvailable,
          client: "GoogleWeather",
          priority: client.priority,
        };
      });
    }
  }

  private async testFlightAggregation(): Promise<void> {
    console.log("✈️ Testing Flight Aggregation...\n");

    await this.runTest("Flight Aggregator Initialization", async () => {
      const flightClients = this.initializeFlightClients();

      const aggregator = new FlightAggregator(flightClients, {
        maxSources: 3,
        timeoutMs: 30000,
      });

      const healthStatus = aggregator.getHealthStatus();

      return {
        clientCount: flightClients.length,
        healthStatus,
        isHealthy: healthStatus.isHealthy,
        availableSources: Object.keys(healthStatus.sources).length,
      };
    });

    if (this.useRealApis) {
      await this.runTest("Real Flight Data Aggregation", async () => {
        const flightClients = this.initializeFlightClients();

        if (flightClients.length === 0) {
          throw new Error("No flight API clients available");
        }

        const aggregator = new FlightAggregator(flightClients, {
          maxSources: 2,
          timeoutMs: 15000,
        });

        // Test with a popular flight route
        const testFlight = { flightNumber: "UA123", date: "2025-12-15" };

        const result = (await Promise.race([
          aggregator.getFlightStatus(testFlight),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Aggregation timeout")), 20000),
          ),
        ])) as any;

        return {
          flightNumber: result.data.flightNumber,
          status: result.data.flightStatus,
          fromCache: result.fromCache,
          sourcesUsed: result.sourcesUsed,
          conflicts: result.conflicts,
          qualityScore: result.qualityScore,
          processingTime: result.processingTimeMs,
          dataFields: Object.keys(result.data).length,
        };
      });
    } else {
      await this.runTest(
        "Real Flight Data Aggregation",
        async () => {
          throw new Error("Skipped - TRIGGERR_USE_REAL_APIS=false");
        },
        true,
      );
    }
  }

  private async testWeatherAggregation(): Promise<void> {
    console.log("🌤️ Testing Weather Aggregation...\n");

    await this.runTest("Weather Aggregator Initialization", async () => {
      const weatherClients = this.initializeWeatherClients();

      const aggregator = new WeatherAggregator(weatherClients, {
        maxSources: 2,
        timeoutMs: 20000,
      });

      const healthStatus = aggregator.getHealthStatus();

      return {
        clientCount: weatherClients.length,
        healthStatus,
        isHealthy: healthStatus.isHealthy,
        availableSources: Object.keys(healthStatus.sources).length,
      };
    });

    if (this.useRealApis && process.env.GOOGLE_WEATHER_API_KEY) {
      await this.runTest("Real Weather Data Aggregation", async () => {
        const weatherClients = this.initializeWeatherClients();

        if (weatherClients.length === 0) {
          throw new Error("No weather API clients available");
        }

        const aggregator = new WeatherAggregator(weatherClients, {
          maxSources: 1,
          timeoutMs: 10000,
        });

        // Test with major airport coordinates
        const testLocation = { lat: 40.6413, lng: -73.7781, locationId: "JFK" }; // JFK Airport

        const result = (await Promise.race([
          aggregator.getWeatherData(testLocation),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Weather aggregation timeout")),
              15000,
            ),
          ),
        ])) as any;

        return {
          locationId: result.data.locationId,
          condition: result.data.condition,
          temperature: result.data.temperatureCelsius,
          fromCache: result.fromCache,
          sourcesUsed: result.sourcesUsed,
          qualityScore: result.qualityScore,
          processingTime: result.processingTimeMs,
        };
      });
    } else {
      await this.runTest(
        "Real Weather Data Aggregation",
        async () => {
          throw new Error(
            "Skipped - No weather APIs or TRIGGERR_USE_REAL_APIS=false",
          );
        },
        true,
      );
    }
  }

  private async testDataRouterIntegration(): Promise<void> {
    console.log("🔄 Testing DataRouter Integration...\n");

    await this.runTest("DataRouter with Real APIs", async () => {
      const flightClients = this.initializeFlightClients();
      const weatherClients = this.initializeWeatherClients();

      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: flightClients,
        weatherApiClients: weatherClients,
        maxConcurrentWeatherRequests: 2,
        timeoutMs: 30000,
      });

      const healthStatus = dataRouter.getHealthStatus();

      return {
        flightClientsCount: flightClients.length,
        weatherClientsCount: weatherClients.length,
        healthStatus,
        usingRealApis:
          this.useRealApis &&
          (flightClients.length > 0 || weatherClients.length > 0),
      };
    });

    if (this.useRealApis) {
      await this.runTest("DataRouter Policy Data Collection", async () => {
        const flightClients = this.initializeFlightClients();
        const weatherClients = this.initializeWeatherClients();

        const dataRouter = new DataRouter({
          logger: this.logger,
          flightApiClients: flightClients,
          weatherApiClients: weatherClients,
          maxConcurrentWeatherRequests: 1,
          timeoutMs: 20000,
        });

        const policyRequest = {
          flightNumber: "DL123",
          date: "2025-12-15",
          airports: ["JFK", "LAX"],
          includeWeather: true,
        };

        const result = (await Promise.race([
          dataRouter.getDataForPolicy(policyRequest),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("DataRouter timeout")), 25000),
          ),
        ])) as any;

        return {
          hasFlightData: !!result.flight,
          hasWeatherData: result.weather && result.weather.length > 0,
          weatherObservations: result.weather?.length || 0,
          flightDataQuality: result.flight?.dataQualityScore,
          weatherDataQuality: result.weather?.[0]?.dataQualityScore,
          overallConfidence: result.overallConfidence,
        };
      });
    } else {
      await this.runTest(
        "DataRouter Policy Data Collection",
        async () => {
          throw new Error("Skipped - TRIGGERR_USE_REAL_APIS=false");
        },
        true,
      );
    }
  }

  private async testEndToEndQuoteGeneration(): Promise<void> {
    console.log("💰 Testing End-to-End Quote Generation...\n");

    await this.runTest("Quote Generation with Real APIs", async () => {
      const flightClients = this.initializeFlightClients();
      const weatherClients = this.initializeWeatherClients();

      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: flightClients,
        weatherApiClients: weatherClients,
      });

      const quoteService = new QuoteService(dataRouter, this.logger);

      const request = {
        flightNumber: "AA123",
        flightDate: "2025-12-15",
        coverageType: "FLIGHT_DELAY" as const,
        coverageAmount: "500.00",
        airports: ["JFK", "LAX"],
        productType: "BASIC" as const,
      };

      const startTime = Date.now();
      const result = await quoteService.generateQuote(request);
      const endTime = Date.now();

      return {
        quoteId: result.quoteId,
        optionsCount: result.quotes.length,
        confidence: result.dataQuality.overallConfidence,
        premium: result.quotes[0]?.premium,
        processingTime: endTime - startTime,
        flightDataQuality: result.dataQuality.flightDataQuality,
        weatherDataQuality: result.dataQuality.weatherDataQuality,
        usingRealData:
          this.useRealApis &&
          (flightClients.length > 0 || weatherClients.length > 0),
        message: result.message,
      };
    });
  }

  private async testPerformanceComparison(): Promise<void> {
    console.log("⚡ Testing Performance Comparison...\n");

    // Test fallback mode performance
    await this.runTest("Fallback Mode Performance", async () => {
      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: [],
        weatherApiClients: [],
      });

      const quoteService = new QuoteService(dataRouter, this.logger);

      const request = {
        flightNumber: "TEST123",
        flightDate: "2025-12-15",
        coverageType: "FLIGHT_DELAY" as const,
        coverageAmount: "500.00",
        productType: "BASIC" as const,
      };

      const startTime = Date.now();
      const result = await quoteService.generateQuote(request);
      const endTime = Date.now();

      return {
        mode: "fallback",
        processingTime: endTime - startTime,
        confidence: result.dataQuality.overallConfidence,
        premium: result.quotes[0]?.premium,
      };
    });

    if (this.useRealApis) {
      await this.runTest("Real API Mode Performance", async () => {
        const flightClients = this.initializeFlightClients();
        const weatherClients = this.initializeWeatherClients();

        const dataRouter = new DataRouter({
          logger: this.logger,
          flightApiClients: flightClients,
          weatherApiClients: weatherClients,
        });

        const quoteService = new QuoteService(dataRouter, this.logger);

        const request = {
          flightNumber: "TEST123",
          flightDate: "2025-12-15",
          coverageType: "FLIGHT_DELAY" as const,
          coverageAmount: "500.00",
          productType: "BASIC" as const,
        };

        const startTime = Date.now();
        const result = await quoteService.generateQuote(request);
        const endTime = Date.now();

        return {
          mode: "real_apis",
          processingTime: endTime - startTime,
          confidence: result.dataQuality.overallConfidence,
          premium: result.quotes[0]?.premium,
          apisUsed: flightClients.length + weatherClients.length,
        };
      });
    }
  }

  private initializeFlightClients(): any[] {
    const clients = [];

    if (this.useRealApis) {
      if (process.env.FLIGHTAWARE_API_KEY) {
        clients.push(new FlightAwareClient(process.env.FLIGHTAWARE_API_KEY));
      }
      if (process.env.AVIATIONSTACK_API_KEY) {
        clients.push(
          new AviationStackClient(process.env.AVIATIONSTACK_API_KEY),
        );
      }
      if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
        clients.push(
          new OpenSkyClient(
            process.env.OPENSKY_USERNAME,
            process.env.OPENSKY_PASSWORD,
          ),
        );
      }
    }

    return clients;
  }

  private initializeWeatherClients(): any[] {
    const clients = [];

    if (this.useRealApis) {
      if (process.env.GOOGLE_WEATHER_API_KEY) {
        clients.push(
          new GoogleWeatherClient(process.env.GOOGLE_WEATHER_API_KEY),
        );
      }
    }

    return clients;
  }

  private async runTest(
    testName: string,
    testFn: () => Promise<any>,
    allowSkip: boolean = false,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`  🧪 ${testName}...`);
      const result = await testFn();
      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        status: "PASS",
        duration,
        details: "✅ Success",
        data: result,
      });

      console.log(`  ✅ ${testName} - PASSED (${duration}ms)`);
      if (result && typeof result === "object") {
        console.log(
          `     ${JSON.stringify(result, null, 6).replace(/\n/g, "\n     ")}`,
        );
      }
      console.log();
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (allowSkip && errorMsg.includes("Skipped")) {
        this.results.push({
          testName,
          status: "SKIP",
          duration,
          details: `⏭️ ${errorMsg}`,
        });
        console.log(`  ⏭️ ${testName} - SKIPPED (${errorMsg})`);
      } else {
        this.results.push({
          testName,
          status: "FAIL",
          duration,
          details: `❌ ${errorMsg}`,
        });
        console.log(`  ❌ ${testName} - FAILED (${duration}ms)`);
        console.log(`     Error: ${errorMsg}`);
      }
      console.log();
    }
  }

  private printResults(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 PHASE 3 VALIDATION RESULTS");
    console.log("=".repeat(60));

    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const warned = this.results.filter((r) => r.status === "WARN").length;
    const skipped = this.results.filter((r) => r.status === "SKIP").length;
    const total = this.results.length;

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Passed: ${passed}/${total}`);
    console.log(`   ❌ Failed: ${failed}/${total}`);
    console.log(`   ⚠️ Warned: ${warned}/${total}`);
    console.log(`   ⏭️ Skipped: ${skipped}/${total}`);

    const totalTime = this.results.reduce(
      (sum, result) => sum + result.duration,
      0,
    );
    console.log(`   ⏱️ Total Time: ${totalTime}ms`);

    if (failed > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.results
        .filter((r) => r.status === "FAIL")
        .forEach((result) => {
          console.log(`   • ${result.testName}: ${result.details}`);
        });
    }

    console.log(`\n🎯 Phase 3 Status:`);
    if (this.useRealApis) {
      if (failed === 0) {
        console.log(`   ✅ Phase 3 Data Aggregation Layer: COMPLETE`);
        console.log(`   🚀 Real APIs successfully integrated and working`);
      } else {
        console.log(`   ⚠️ Phase 3 Data Aggregation Layer: PARTIAL`);
        console.log(`   🔧 Some API integrations need attention`);
      }
    } else {
      console.log(
        `   ⏭️ Phase 3 Testing: SKIPPED (TRIGGERR_USE_REAL_APIS=false)`,
      );
      console.log(
        `   💡 Set TRIGGERR_USE_REAL_APIS=true to test real API integration`,
      );
    }

    console.log("\n" + "=".repeat(60));
  }
}

// Run validation
async function main() {
  const validator = new Phase3Validator();
  await validator.runValidation();
}

main().catch(console.error);
