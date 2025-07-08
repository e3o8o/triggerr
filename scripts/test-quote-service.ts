#!/usr/bin/env bun
/**
 * Test script for QuoteService
 *
 * This script directly tests the QuoteService implementation without going through the API layer.
 * It helps debug issues in the quote generation process.
 */

import { QuoteService } from "@triggerr/quote-engine";
import { DataRouter } from "@triggerr/data-router";
import { Logger, LogLevel } from "@triggerr/core";

async function testQuoteService() {
  console.log("🚀 Testing QuoteService...\n");

  try {
    // Step 1: Initialize logger
    const logger = new Logger(LogLevel.INFO, "QuoteServiceTest");

    // Step 2: Initialize DataRouter with empty clients (will use fallback data)
    const dataRouter = new DataRouter({
      logger,
      flightApiClients: [], // Empty - will trigger fallback
      weatherApiClients: [], // Empty - will trigger fallback
    });

    // Step 3: Initialize QuoteService
    const quoteService = new QuoteService(dataRouter, logger);

    // Step 4: Create test request
    const testRequest = {
      flightNumber: "AA1234",
      flightDate: "2025-12-15",
      coverageType: "FLIGHT_DELAY" as const,
      coverageAmount: "500.00",
      airports: ["JFK", "LAX"],
      productType: "BASIC" as const,
    };

    console.log("📋 Test Request:");
    console.log(JSON.stringify(testRequest, null, 2));
    console.log("\n⏱️  Generating quote...\n");

    // Step 5: Generate quote
    const startTime = Date.now();
    const result = await quoteService.generateQuote(testRequest);
    const duration = Date.now() - startTime;

    // Step 6: Display results
    console.log("✅ Quote generated successfully!");
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log("\n📊 Quote Response:");
    console.log(JSON.stringify(result, null, 2));

    // Step 7: Summary
    console.log("\n📈 Summary:");
    console.log(`- Quote ID: ${result.quoteId}`);
    console.log(`- Flight: ${result.flightNumber} on ${result.flightDate}`);
    console.log(`- Number of quote options: ${result.quotes.length}`);
    console.log(
      `- Data quality: ${result.dataQuality.overallConfidence.toFixed(2)}`,
    );
    console.log(`- Valid until: ${result.validUntil}`);

    if (result.quotes.length > 0) {
      const firstQuote = result.quotes[0];
      console.log(
        `- First quote premium: $${(parseFloat(firstQuote.premium) / 100).toFixed(2)}`,
      );
      console.log(
        `- Coverage amount: $${(parseFloat(firstQuote.coverageAmount) / 100).toFixed(2)}`,
      );
    }

    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:");
    console.error(error);

    if (error instanceof Error) {
      console.error("\n📋 Error details:");
      console.error(`- Message: ${error.message}`);
      console.error(`- Stack: ${error.stack}`);
    }

    process.exit(1);
  }
}

// Run the test
testQuoteService().catch(console.error);
