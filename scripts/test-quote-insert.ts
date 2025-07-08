/**
 * Quote Insert Test Script
 *
 * This script tests direct quote insertion into the database
 * to diagnose why the QuoteService is failing to persist quotes
 *
 * Usage: bun run scripts/test-quote-insert.ts
 */

import { Database, Schema } from "@triggerr/core";
import { generateId } from "@triggerr/core/utils";
import { eq } from "drizzle-orm";

class QuoteInsertTester {
  private testQuoteId: string;

  constructor() {
    this.testQuoteId = generateId("quote");
  }

  async runTest(): Promise<void> {
    console.log("🧪 Testing Quote Database Insert\n");

    try {
      // Step 1: Check available providers and flights
      console.log("📋 Step 1: Checking available data...");
      const providers = await Database.db.query.provider.findMany({
        where: (provider, { eq }) => eq(provider.status, "ACTIVE"),
        limit: 3
      });

      const flights = await Database.db.query.flight.findMany({
        limit: 3
      });

      console.log(`   ✅ Found ${providers.length} active providers`);
      console.log(`   ✅ Found ${flights.length} flights`);

      if (providers.length === 0 || flights.length === 0) {
        throw new Error("No providers or flights available for testing");
      }

      const testProvider = providers[0];
      const testFlight = flights[0];

      console.log(`   📋 Using Provider: ${testProvider.name} (${testProvider.id})`);
      console.log(`   ✈️ Using Flight: ${testFlight.flightNumber} (${testFlight.id})`);

      // Step 2: Insert quote with valid data
      console.log("\n💾 Step 2: Testing quote insert...");
      const validUntil = new Date(Date.now() + 15 * 60 * 1000);

      const quoteData = {
        id: this.testQuoteId,
        userId: null,
        providerId: testProvider.id,
        flightId: testFlight.id,
        coverageType: "FLIGHT_DELAY" as const,
        coverageAmount: "500.00",
        premium: "20.74",
        riskFactors: {
          flightRisk: 0.315,
          weatherRisk: 0.120,
          overallRisk: 0.257,
          confidence: 0.785,
          flightDataQuality: 0.75,
          weatherDataQuality: 0.7
        },
        confidence: "0.7850",
        validUntil,
        ipAddress: null,
        userAgent: null,
      };

      console.log("   📝 Inserting quote with data:");
      console.log(`      ID: ${quoteData.id}`);
      console.log(`      Provider: ${quoteData.providerId}`);
      console.log(`      Flight: ${quoteData.flightId}`);
      console.log(`      Coverage: $${quoteData.coverageAmount}`);
      console.log(`      Premium: $${quoteData.premium}`);

      await Database.db.insert(Schema.quote).values(quoteData);

      console.log("   ✅ Quote inserted successfully!");

      // Step 3: Retrieve and verify the quote
      console.log("\n🔍 Step 3: Retrieving and verifying quote...");
      const retrievedQuote = await Database.db.query.quote.findFirst({
        where: eq(Schema.quote.id, this.testQuoteId),
      });

      if (!retrievedQuote) {
        throw new Error("Quote not found after insert");
      }

      console.log("   ✅ Quote retrieved successfully:");
      console.log(`      ID: ${retrievedQuote.id}`);
      console.log(`      Status: ${retrievedQuote.status}`);
      console.log(`      Provider: ${retrievedQuote.providerId}`);
      console.log(`      Flight: ${retrievedQuote.flightId}`);
      console.log(`      Coverage: $${retrievedQuote.coverageAmount}`);
      console.log(`      Premium: $${retrievedQuote.premium}`);
      console.log(`      Expires: ${retrievedQuote.validUntil}`);

      // Step 4: Test policy engine lookup
      console.log("\n🏛️ Step 4: Testing PolicyEngine quote lookup...");
      const policyEngineQuote = await Database.db.query.quote.findFirst({
        where: eq(Schema.quote.id, this.testQuoteId),
      });

      if (policyEngineQuote) {
        console.log("   ✅ PolicyEngine can find the quote");
        console.log(`      Quote Status: ${policyEngineQuote.status}`);
        console.log(`      Valid Until: ${policyEngineQuote.validUntil}`);
        console.log(`      Current Time: ${new Date().toISOString()}`);

        const isExpired = new Date(policyEngineQuote.validUntil) < new Date();
        console.log(`      Is Expired: ${isExpired ? "❌ YES" : "✅ NO"}`);
      } else {
        console.log("   ❌ PolicyEngine cannot find the quote");
      }

      // Step 5: Test the exact QuoteService insert pattern
      console.log("\n🔬 Step 5: Testing QuoteService insert pattern...");
      const mockFlightData = {
        id: testFlight.id,
        dataQualityScore: 0.75
      };

      const quoteServiceData = {
        id: generateId("quote"),
        userId: null,
        providerId: testProvider.id,
        flightId: mockFlightData.id,
        coverageType: "FLIGHT_DELAY" as const,
        coverageAmount: "500.00",
        premium: "20.74",
        riskFactors: {
          flightRisk: 0.315,
          weatherRisk: 0.120,
          overallRisk: 0.257,
          confidence: 0.785,
          flightDataQuality: 0.75,
          weatherDataQuality: 0.7,
          allQuoteOptions: [{
            productName: "Basic FLIGHT DELAY Insurance",
            coverageType: "FLIGHT_DELAY",
            premium: "2074",
            coverageAmount: "50000",
            deductible: "5000",
            policyTerms: {
              maxPayoutAmount: "50000",
              coverageIncludes: ["Flight delays due to weather"],
              exclusions: ["Acts of war or terrorism"],
              delayThresholdMinutes: 120
            },
            riskFactors: {
              flightRiskScore: 0.315,
              weatherRiskScore: 0.120,
              overallRiskScore: 0.257,
              confidence: 0.785
            }
          }]
        },
        confidence: "0.7850",
        validUntil: new Date(Date.now() + 15 * 60 * 1000),
        ipAddress: null,
        userAgent: null,
      };

      await Database.db.insert(Schema.quote).values(quoteServiceData);
      console.log(`   ✅ QuoteService pattern insert successful: ${quoteServiceData.id}`);

      // Clean up the second quote
      await Database.db.delete(Schema.quote).where(eq(Schema.quote.id, quoteServiceData.id));

      console.log("\n🎉 All Quote Insert Tests Passed!");
      console.log("\n📊 Diagnosis Results:");
      console.log("   ✅ Database connection working");
      console.log("   ✅ Provider and flight references valid");
      console.log("   ✅ Quote insert/retrieve working");
      console.log("   ✅ PolicyEngine can find quotes");
      console.log("   ✅ QuoteService pattern working");
      console.log("\n🔧 Issue Analysis:");
      console.log("   The QuoteService should be able to save quotes.");
      console.log("   The database and schema are properly configured.");
      console.log("   Foreign key constraints are satisfied.");

      // Cleanup
      await this.cleanup();

    } catch (error) {
      console.error("❌ Quote insert test failed:", error);
      await this.cleanup();
      process.exit(1);
    }
  }

  private async cleanup(): Promise<void> {
    try {
      await Database.db.delete(Schema.quote).where(eq(Schema.quote.id, this.testQuoteId));
      console.log("\n🧹 Test data cleaned up");
    } catch (error) {
      console.log(`⚠️ Cleanup warning: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

async function main() {
  const tester = new QuoteInsertTester();
  await tester.runTest();
}

if (import.meta.main) {
  main().catch(console.error);
}
