/**
 * Simple Quote Insertion Test
 *
 * This script tests quote insertion using existing provider and flight data
 * to isolate the database connection and insertion issues.
 */

import { Database, Schema } from "@triggerr/core";
import { generateId } from "@triggerr/core";

interface QuoteInsertionTest {
  success: boolean;
  error?: string;
  quoteId?: string;
  details?: any;
}

class QuoteInsertionTester {
  private createdQuotes: string[] = [];

  async runTest(): Promise<void> {
    try {
      console.log("🔍 Testing Quote Insertion with Existing Data\n");

      // Step 1: Verify existing data
      console.log("📊 Step 1: Verifying existing data...");
      const dataCheck = await this.verifyExistingData();

      if (!dataCheck.success) {
        throw new Error(`Data verification failed: ${dataCheck.error}`);
      }

      // Step 2: Test quote insertion
      console.log("\n💾 Step 2: Testing quote insertion...");
      const insertResult = await this.testQuoteInsertion();

      if (insertResult.success) {
        console.log(`✅ Quote insertion successful: ${insertResult.quoteId}`);
        console.log(`   Quote details:`, insertResult.details);
      } else {
        console.log(`❌ Quote insertion failed: ${insertResult.error}`);
      }

      // Step 3: Verify inserted quote
      if (insertResult.success && insertResult.quoteId) {
        console.log("\n🔍 Step 3: Verifying inserted quote...");
        const verifyResult = await this.verifyInsertedQuote(
          insertResult.quoteId,
        );

        if (verifyResult.success) {
          console.log("✅ Quote verification successful");
          console.log("   Retrieved quote:", verifyResult.details);
        } else {
          console.log(`❌ Quote verification failed: ${verifyResult.error}`);
        }
      }

      console.log("\n🎉 Quote insertion test completed!");
    } catch (error) {
      console.error("❌ Test failed:", error);
      throw error;
    } finally {
      // Clean up
      await this.cleanup();
    }
  }

  private async verifyExistingData(): Promise<QuoteInsertionTest> {
    try {
      // Check providers
      const providers = await Database.db.query.provider.findMany({
        where: (provider, { eq }) => eq(provider.status, "ACTIVE"),
        limit: 3,
      });

      console.log(`   📋 Found ${providers.length} active providers:`);
      providers.forEach((p) => console.log(`      • ${p.name} (${p.id})`));

      // Check flights
      const flights = await Database.db.query.flight.findMany({
        where: (flight, { inArray }) =>
          inArray(flight.id, [
            "flight_AA1234_2025-12-15",
            "flight_DL456_2025-12-20",
            "flight_UA999_2025-12-30",
          ]),
      });

      console.log(`   ✈️  Found ${flights.length} test flights:`);
      flights.forEach((f) =>
        console.log(`      • ${f.flightNumber} (${f.id})`),
      );

      if (providers.length === 0) {
        return { success: false, error: "No active providers found" };
      }

      if (flights.length === 0) {
        return { success: false, error: "No test flights found" };
      }

      return {
        success: true,
        details: {
          providers: providers.map((p) => ({ id: p.id, name: p.name })),
          flights: flights.map((f) => ({ id: f.id, number: f.flightNumber })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Database query failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  private async testQuoteInsertion(): Promise<QuoteInsertionTest> {
    try {
      // Generate a unique quote ID
      const quoteId = generateId("quote");

      // Use existing provider and flight
      const providerId = "PROV_IIDR";
      const flightId = "flight_AA1234_2025-12-15";

      // Create quote data
      const quoteData = {
        id: quoteId,
        userId: null, // Anonymous quote
        providerId: providerId,
        flightId: flightId,
        coverageType: "DELAY_120" as const,
        coverageAmount: "500.00",
        premium: "20.74",
        riskFactors: JSON.stringify({
          flightRisk: 0.315,
          weatherRisk: 0.12,
          overallRisk: 0.257,
          confidence: 0.785,
        }),
        confidence: "0.785",
        status: "PENDING" as const,
        validUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        ipAddress: "127.0.0.1",
        userAgent: "test-quote-insertion",
      };

      console.log(`   📝 Attempting to insert quote: ${quoteId}`);
      console.log(`   🏢 Provider: ${providerId}`);
      console.log(`   ✈️  Flight: ${flightId}`);
      console.log(
        `   📊 Quote data to insert:`,
        JSON.stringify(quoteData, null, 2),
      );

      // Insert the quote
      const insertedQuote = await Database.db
        .insert(Schema.quote)
        .values(quoteData)
        .returning();

      if (insertedQuote.length > 0) {
        this.createdQuotes.push(quoteId);
        return {
          success: true,
          quoteId: quoteId,
          details: insertedQuote[0],
        };
      } else {
        return {
          success: false,
          error: "Insert returned no results",
        };
      }
    } catch (error) {
      console.log(`   🚨 Detailed error information:`);
      console.log(`      Error type: ${error?.constructor?.name}`);
      console.log(
        `      Error message: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.log(`      Full error:`, error);

      if (error instanceof Error && error.message.includes("violates")) {
        console.log(`   ⚠️  This appears to be a constraint violation`);
      }

      return {
        success: false,
        error: `Insert failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: error,
      };
    }
  }

  private async verifyInsertedQuote(
    quoteId: string,
  ): Promise<QuoteInsertionTest> {
    try {
      const quote = await Database.db.query.quote.findFirst({
        where: (q, { eq }) => eq(q.id, quoteId),
      });

      if (quote) {
        return {
          success: true,
          details: {
            id: quote.id,
            providerId: quote.providerId,
            flightId: quote.flightId,
            coverageType: quote.coverageType,
            premium: quote.premium,
            status: quote.status,
            validUntil: quote.validUntil,
          },
        };
      } else {
        return {
          success: false,
          error: "Quote not found after insertion",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.createdQuotes.length > 0) {
        console.log(
          `\n🗑️  Cleaning up ${this.createdQuotes.length} test quotes...`,
        );

        await Database.db
          .delete(Schema.quote)
          .where((quote, { inArray }) => inArray(quote.id, this.createdQuotes));

        console.log("   ✅ Cleanup completed");
      }
    } catch (error) {
      console.log(
        `   ⚠️  Cleanup warning: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

// Run the test
const tester = new QuoteInsertionTester();
tester.runTest().catch((error) => {
  console.error("🚨 Test execution failed:", error);
  process.exit(1);
});
