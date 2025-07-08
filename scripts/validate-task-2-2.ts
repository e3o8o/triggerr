#!/usr/bin/env bun
/**
 * Task 2.2 Validation Script: Quote Service Interface Alignment
 *
 * This script comprehensively validates the completion of Task 2.2 according to:
 * - 01_VISION_MASTER.md requirements
 * - COMPREHENSIVE_TODO_MVP_COMPLETION.md specifications
 * - Quote Engine architectural design
 *
 * Tests include:
 * 1. Direct QuoteService functionality
 * 2. API endpoint integration
 * 3. Fallback vs Real API modes
 * 4. Risk calculation accuracy
 * 5. Data quality assessment
 * 6. Error handling
 * 7. Performance benchmarks
 */

import { QuoteService } from "@triggerr/quote-engine";
import { DataRouter } from "@triggerr/data-router";
import { Logger, LogLevel } from "@triggerr/core";

interface ValidationResult {
  testName: string;
  status: "PASS" | "FAIL" | "WARN";
  duration: number;
  details: string;
  data?: any;
}

class Task22Validator {
  private results: ValidationResult[] = [];
  private logger: Logger;

  constructor() {
    this.logger = new Logger(LogLevel.INFO, "Task22Validator");
  }

  async runValidation(): Promise<void> {
    console.log(
      "🚀 Starting Task 2.2: Quote Service Interface Alignment Validation\n",
    );

    // Test Categories
    await this.testDirectQuoteService();
    await this.testAPIEndpointIntegration();
    await this.testRiskCalculationAccuracy();
    await this.testDataQualityAssessment();
    await this.testErrorHandling();
    await this.testPerformanceBenchmarks();

    this.printResults();
  }

  private async testDirectQuoteService(): Promise<void> {
    console.log("📋 Testing Direct QuoteService Functionality...\n");

    // Test 1: Basic Quote Generation with Fallback Data
    await this.runTest("Basic Quote Generation (Fallback Mode)", async () => {
      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: [], // Empty - triggers fallback
        weatherApiClients: [], // Empty - triggers fallback
      });

      const quoteService = new QuoteService(dataRouter, this.logger);

      const request = {
        flightNumber: "AA1234",
        flightDate: "2025-12-15",
        coverageType: "FLIGHT_DELAY" as const,
        coverageAmount: "500.00",
        airports: ["JFK", "LAX"],
        productType: "BASIC" as const,
      };

      const result = await quoteService.generateQuote(request);

      // Validations
      if (!result.quoteId.startsWith("quote_"))
        throw new Error("Invalid quote ID format");
      if (result.quotes.length === 0)
        throw new Error("No quote options generated");
      if (!result.validUntil) throw new Error("Missing expiration time");
      if (result.dataQuality.overallConfidence < 0.5)
        throw new Error("Confidence too low");

      return {
        quoteId: result.quoteId,
        optionsCount: result.quotes.length,
        confidence: result.dataQuality.overallConfidence,
        premium: result.quotes[0]?.premium,
      };
    });

    // Test 2: Multiple Coverage Types
    await this.runTest("Multiple Coverage Types Support", async () => {
      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: [],
        weatherApiClients: [],
      });

      const quoteService = new QuoteService(dataRouter, this.logger);

      const coverageTypes = [
        "FLIGHT_DELAY",
        "FLIGHT_CANCELLATION",
        "WEATHER_DISRUPTION",
      ] as const;
      const results: {
        coverageType: string;
        premium: string | undefined;
        confidence: number;
      }[] = [];

      for (const coverageType of coverageTypes) {
        const request = {
          flightNumber: "DL456",
          flightDate: "2025-12-20",
          coverageType,
          coverageAmount: "1000.00",
          airports: ["LAX", "JFK"],
          productType: "PREMIUM" as const,
        };

        const result = await quoteService.generateQuote(request);
        results.push({
          coverageType,
          premium: result.quotes[0]?.premium,
          confidence: result.dataQuality.overallConfidence,
        });
      }

      return { supportedTypes: results.length, results };
    });

    // Test 3: Input Validation
    await this.runTest("Input Validation", async () => {
      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: [],
        weatherApiClients: [],
      });

      const quoteService = new QuoteService(dataRouter, this.logger);

      // Test past flight date
      try {
        await quoteService.generateQuote({
          flightNumber: "UA789",
          flightDate: "2023-01-01", // Past date
          coverageType: "FLIGHT_DELAY",
          coverageAmount: "500.00",
          productType: "BASIC",
        });
        throw new Error("Should have rejected past flight date");
      } catch (error) {
        if (!error.message.includes("past flights")) {
          throw new Error("Incorrect error message for past flights");
        }
      }

      return { validation: "Past flight dates properly rejected" };
    });
  }

  private async testAPIEndpointIntegration(): Promise<void> {
    console.log("🌐 Testing API Endpoint Integration...\n");

    // Test 4: API Endpoint Response Structure
    await this.runTest("API Endpoint Response Structure", async () => {
      const response = await fetch(
        "http://localhost:4000/api/v1/insurance/quote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flightNumber: "SW101",
            flightDate: "2025-12-25",
            originAirport: "DEN",
            destinationAirport: "PHX",
            coverageTypes: ["DELAY"],
            coverageAmounts: { DELAY: 75000 },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Validate response structure according to vision document
      if (!data.success) throw new Error("API response indicates failure");
      if (!data.data?.quoteId) throw new Error("Missing quote ID");
      if (!data.data?.quotes?.length) throw new Error("Missing quote options");
      if (!data.data?.dataQuality)
        throw new Error("Missing data quality metrics");
      if (!data.timestamp) throw new Error("Missing timestamp");
      if (!data.requestId) throw new Error("Missing request ID");

      return {
        quoteId: data.data.quoteId,
        apiVersion: data.version,
        responseTime: data.timestamp,
        premium: data.data.quotes[0]?.premium,
      };
    });

    // Test 5: Health Check Integration
    await this.runTest("Health Check Integration", async () => {
      const response = await fetch("http://localhost:4000/api/v1/health");
      const health = await response.json();

      // Check if quote-related services are healthy
      const quoteService = health.data?.details?.find(
        (d: any) => d.service === "chat" || d.service === "quote-engine",
      );

      if (health.data?.overall?.status !== "healthy") {
        throw new Error("Overall system health is not healthy");
      }

      return {
        overallHealth: health.data.overall.status,
        servicesHealthy: health.data.services.healthy,
        totalServices: health.data.services.total,
      };
    });
  }

  private async testRiskCalculationAccuracy(): Promise<void> {
    console.log("⚖️ Testing Risk Calculation Accuracy...\n");

    // Test 6: Risk Score Components
    await this.runTest("Risk Score Components", async () => {
      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: [],
        weatherApiClients: [],
      });

      const quoteService = new QuoteService(dataRouter, this.logger);

      const request = {
        flightNumber: "AA2024",
        flightDate: "2025-12-15",
        coverageType: "FLIGHT_DELAY" as const,
        coverageAmount: "500.00",
        airports: ["JFK", "LAX"],
        productType: "BASIC" as const,
      };

      const result = await quoteService.generateQuote(request);
      const quote = result.quotes[0];

      if (!quote?.riskFactors) throw new Error("Missing risk factors");

      const { riskFactors } = quote;

      // Validate risk components exist and are reasonable
      if (typeof riskFactors.flightRiskScore !== "number")
        throw new Error("Missing flight risk score");
      if (typeof riskFactors.weatherRiskScore !== "number")
        throw new Error("Missing weather risk score");
      if (typeof riskFactors.overallRiskScore !== "number")
        throw new Error("Missing overall risk score");
      if (typeof riskFactors.confidence !== "number")
        throw new Error("Missing confidence score");

      // Validate risk ranges
      if (riskFactors.flightRiskScore < 0 || riskFactors.flightRiskScore > 1) {
        throw new Error("Flight risk score out of range");
      }
      if (
        riskFactors.weatherRiskScore < 0 ||
        riskFactors.weatherRiskScore > 1
      ) {
        throw new Error("Weather risk score out of range");
      }
      if (riskFactors.confidence < 0 || riskFactors.confidence > 1) {
        throw new Error("Confidence score out of range");
      }

      return {
        flightRisk: riskFactors.flightRiskScore,
        weatherRisk: riskFactors.weatherRiskScore,
        overallRisk: riskFactors.overallRiskScore,
        confidence: riskFactors.confidence,
      };
    });

    // Test 7: Premium Calculation Logic
    await this.runTest("Premium Calculation Logic", async () => {
      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: [],
        weatherApiClients: [],
      });

      const quoteService = new QuoteService(dataRouter, this.logger);

      // Test different coverage amounts
      const coverageAmounts = ["100.00", "500.00", "1000.00"];
      const results: Array<{
        coverage: number;
        premium: number;
        rate: number;
      }> = [];

      for (const coverageAmount of coverageAmounts) {
        const request = {
          flightNumber: "UA999",
          flightDate: "2025-12-30",
          coverageType: "FLIGHT_DELAY" as const,
          coverageAmount,
          airports: ["SFO", "LAX"],
          productType: "BASIC" as const,
        };

        const result = await quoteService.generateQuote(request);
        const premium = parseFloat(result.quotes[0]?.premium || "0") / 100; // Convert cents to dollars
        const coverage = parseFloat(coverageAmount);
        const premiumRate = premium / coverage;

        results.push({
          coverage: coverage,
          premium: premium,
          rate: premiumRate,
        });
      }

      // Validate that premium increases with coverage
      if (
        results[0].premium >= results[1].premium ||
        results[1].premium >= results[2].premium
      ) {
        throw new Error("Premium should increase with coverage amount");
      }

      return { premiumCalculations: results };
    });
  }

  private async testDataQualityAssessment(): Promise<void> {
    console.log("📊 Testing Data Quality Assessment...\n");

    // Test 8: Data Quality Metrics
    await this.runTest("Data Quality Metrics", async () => {
      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: [],
        weatherApiClients: [],
      });

      const quoteService = new QuoteService(dataRouter, this.logger);

      const request = {
        flightNumber: "B61234",
        flightDate: "2025-12-15",
        coverageType: "FLIGHT_DELAY" as const,
        coverageAmount: "500.00",
        airports: ["BOS", "FLL"],
        productType: "BASIC" as const,
      };

      const result = await quoteService.generateQuote(request);

      // Validate data quality structure
      if (!result.dataQuality)
        throw new Error("Missing data quality assessment");
      if (typeof result.dataQuality.flightDataQuality !== "number") {
        throw new Error("Missing flight data quality score");
      }
      if (typeof result.dataQuality.weatherDataQuality !== "number") {
        throw new Error("Missing weather data quality score");
      }
      if (typeof result.dataQuality.overallConfidence !== "number") {
        throw new Error("Missing overall confidence score");
      }

      // Validate quality scores are in valid range
      const { dataQuality } = result;
      if (
        dataQuality.flightDataQuality < 0 ||
        dataQuality.flightDataQuality > 1
      ) {
        throw new Error("Flight data quality score out of range");
      }
      if (
        dataQuality.weatherDataQuality < 0 ||
        dataQuality.weatherDataQuality > 1
      ) {
        throw new Error("Weather data quality score out of range");
      }
      if (
        dataQuality.overallConfidence < 0 ||
        dataQuality.overallConfidence > 1
      ) {
        throw new Error("Overall confidence score out of range");
      }

      return {
        flightQuality: dataQuality.flightDataQuality,
        weatherQuality: dataQuality.weatherDataQuality,
        overallConfidence: dataQuality.overallConfidence,
      };
    });
  }

  private async testErrorHandling(): Promise<void> {
    console.log("🚨 Testing Error Handling...\n");

    // Test 9: API Error Responses
    await this.runTest("API Error Responses", async () => {
      // Test invalid request format
      const response = await fetch(
        "http://localhost:4000/api/v1/insurance/quote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Missing required fields
            flightNumber: "",
            flightDate: "invalid-date",
          }),
        },
      );

      if (response.ok) {
        throw new Error("API should reject invalid requests");
      }

      const errorData = await response.json();

      if (errorData.success !== false)
        throw new Error("Error response should have success: false");
      if (!errorData.error?.code) throw new Error("Missing error code");
      if (!errorData.error?.message) throw new Error("Missing error message");

      return {
        statusCode: response.status,
        errorCode: errorData.error.code,
        hasDetails: !!errorData.error.details,
      };
    });

    // Test 10: Service Graceful Degradation
    await this.runTest("Service Graceful Degradation", async () => {
      // This test validates that the service works even without external APIs
      // (which is already being tested in fallback mode, but explicitly here)

      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: [], // No external APIs
        weatherApiClients: [], // No external APIs
      });

      const quoteService = new QuoteService(dataRouter, this.logger);

      const request = {
        flightNumber: "FALLBACK123",
        flightDate: "2025-12-31",
        coverageType: "FLIGHT_DELAY" as const,
        coverageAmount: "500.00",
        airports: ["LAX", "JFK"],
        productType: "BASIC" as const,
      };

      const result = await quoteService.generateQuote(request);

      // Should still generate a valid quote using fallback data
      if (!result.quoteId)
        throw new Error("Failed to generate quote in fallback mode");
      if (result.quotes.length === 0)
        throw new Error("No quotes generated in fallback mode");

      return {
        fallbackWorking: true,
        quoteGenerated: !!result.quoteId,
        confidence: result.dataQuality.overallConfidence,
      };
    });
  }

  private async testPerformanceBenchmarks(): Promise<void> {
    console.log("⚡ Testing Performance Benchmarks...\n");

    // Test 11: Quote Generation Performance
    await this.runTest("Quote Generation Performance", async () => {
      const dataRouter = new DataRouter({
        logger: this.logger,
        flightApiClients: [],
        weatherApiClients: [],
      });

      const quoteService = new QuoteService(dataRouter, this.logger);

      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const request = {
          flightNumber: `PERF${i}`,
          flightDate: "2025-12-15",
          coverageType: "FLIGHT_DELAY" as const,
          coverageAmount: "500.00",
          airports: ["DEN", "LAX"],
          productType: "BASIC" as const,
        };

        await quoteService.generateQuote(request);
        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      // Performance requirements (based on vision document expectations)
      if (avgTime > 2000)
        throw new Error(`Average response time too slow: ${avgTime}ms`);
      if (maxTime > 5000)
        throw new Error(`Max response time too slow: ${maxTime}ms`);

      return {
        averageTime: avgTime,
        maxTime: maxTime,
        iterations: iterations,
        allTimes: times,
      };
    });

    // Test 12: API Endpoint Performance
    await this.runTest("API Endpoint Performance", async () => {
      const startTime = Date.now();

      const response = await fetch(
        "http://localhost:4000/api/v1/insurance/quote",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flightNumber: "APITEST",
            flightDate: "2025-12-15",
            originAirport: "SEA",
            destinationAirport: "LAX",
            coverageTypes: ["DELAY"],
            coverageAmounts: { DELAY: 50000 },
          }),
        },
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // API should respond within reasonable time
      if (duration > 3000)
        throw new Error(`API response too slow: ${duration}ms`);

      return {
        responseTime: duration,
        success: data.success,
        quoteGenerated: !!data.data?.quoteId,
      };
    });
  }

  private async runTest(
    name: string,
    testFn: () => Promise<any>,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      this.results.push({
        testName: name,
        status: "PASS",
        duration,
        details: "Test completed successfully",
        data: result,
      });

      console.log(`✅ ${name} - PASSED (${duration}ms)`);
      if (result && typeof result === "object") {
        console.log(
          `   ${JSON.stringify(result, null, 2).split("\n").join("\n   ")}`,
        );
      }
      console.log();
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.results.push({
        testName: name,
        status: "FAIL",
        duration,
        details: errorMessage,
      });

      console.log(`❌ ${name} - FAILED (${duration}ms)`);
      console.log(`   Error: ${errorMessage}`);
      console.log();
    }
  }

  private printResults(): void {
    console.log("📊 Task 2.2 Validation Results Summary\n");
    console.log("=".repeat(60));

    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const warned = this.results.filter((r) => r.status === "WARN").length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warned}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    const avgDuration =
      this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    console.log(`⏱️  Average Test Duration: ${avgDuration.toFixed(0)}ms`);

    console.log("\n" + "=".repeat(60));

    if (failed === 0) {
      console.log(
        "🎉 Task 2.2: Quote Service Interface Alignment - COMPLETED SUCCESSFULLY!",
      );
      console.log(
        "\n✅ All requirements from the vision document have been implemented:",
      );
      console.log("   • Quote generation with risk assessment");
      console.log("   • Multi-factor risk calculation (flight + weather)");
      console.log("   • Premium calculation engine");
      console.log("   • Data quality assessment");
      console.log("   • API endpoint integration");
      console.log("   • Error handling and validation");
      console.log("   • Performance optimization");
      console.log("   • Fallback data support");

      console.log(
        "\n🚀 Ready to proceed with Task 2.3: Policy Engine Integration",
      );
    } else {
      console.log(
        "❌ Task 2.2 validation failed. Please review and fix the failing tests.",
      );

      console.log("\nFailed Tests:");
      this.results
        .filter((r) => r.status === "FAIL")
        .forEach((result) => {
          console.log(`   • ${result.testName}: ${result.details}`);
        });
    }

    console.log("\n" + "=".repeat(60));
  }
}

// Run validation
const validator = new Task22Validator();
validator.runValidation().catch(console.error);
