/**
 * Policy Insert Test Script
 *
 * This script tests the policy insertion process in isolation
 * to identify the exact issue preventing policy creation.
 */

import { Database, Schema } from "@triggerr/core";
import { generateId } from "@triggerr/core/utils";
import { sql } from "drizzle-orm";

class PolicyInsertTester {
  private testQuoteId: string = "";
  private testFlightId: string = "";
  private testProviderId: string = "";

  async runTest(): Promise<void> {
    console.log("🧪 Testing Policy Insert Process...\n");

    try {
      // Step 1: Create test quote (we know this works)
      console.log("📋 Step 1: Creating test quote...");
      await this.createTestQuote();
      console.log("✅ Test quote created successfully");

      // Step 2: Test policy insertion with minimal data
      console.log("\n💳 Step 2: Testing policy insertion...");
      await this.testPolicyInsertion();
      console.log("✅ Policy insertion test completed");

      // Step 3: Test with different field combinations
      console.log("\n🔄 Step 3: Testing different field combinations...");
      await this.testFieldCombinations();
    } catch (error) {
      console.error("❌ Test failed:", error);
    } finally {
      // Clean up test data
      await this.cleanup();
    }
  }

  async createTestQuote(): Promise<void> {
    // Use existing test data from previous successful tests
    this.testFlightId = "flight_AA1234_2025-12-15";
    this.testProviderId = "PROV_TRDR";
    this.testQuoteId = generateId("quote");

    const quoteData = {
      id: this.testQuoteId,
      userId: null,
      providerId: this.testProviderId,
      flightId: this.testFlightId,
      coverageType: "DELAY_120" as const,
      coverageAmount: "500.00",
      premium: "20.74",
      riskFactors: {
        flightRisk: 0.315,
        weatherRisk: 0.12,
        overallRisk: 0.257,
        confidence: 0.785,
      },
      confidence: "0.7850",
      status: "PENDING" as const,
      validUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      ipAddress: null,
      userAgent: null,
    };

    await Database.db.insert(Schema.quote).values(quoteData);
    console.log(`   Created quote: ${this.testQuoteId}`);
  }

  async testPolicyInsertion(): Promise<void> {
    const policyId = generateId("pol");
    const policyNumber = `TRG-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

    // Test 1: Basic policy insertion with userId
    console.log("   Testing with userId...");
    try {
      const policyData = {
        id: policyId,
        policyNumber,
        userId: "test_user_12345",
        // anonymousSessionId: null, // Let this be default
        providerId: this.testProviderId,
        flightId: this.testFlightId,
        quoteId: this.testQuoteId,
        coverageType: "DELAY_120" as const,
        coverageAmount: "500.00",
        premium: "20.74",
        payoutAmount: "500.00",
        status: "PENDING" as const,
        chain: "PAYGO",
        // delayThreshold: 60, // Let this be default
        terms: { delayThresholdMinutes: 60 },
        metadata: {
          chainSpecific: {
            PAYGO: {
              supportedFeatures: ["escrow", "automation"],
              networkId: "paygo-mainnet",
            },
          },
        },
        // activatedAt: null, // Let this be default
        expiresAt,
        // createdAt and updatedAt will be set by default
      };

      const [result] = await Database.db
        .insert(Schema.policy)
        .values(policyData)
        .returning();

      console.log("   ✅ Policy inserted successfully!");
      console.log(`   Policy ID: ${result.id}`);
      console.log(`   Policy Number: ${result.policyNumber}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Coverage Type: ${result.coverageType}`);

      // Clean up this test policy
      await Database.db.delete(Schema.policy).where(sql`id = ${result.id}`);
    } catch (error) {
      console.error("   ❌ Policy insertion failed:", error);

      // Let's check what went wrong
      if (error instanceof Error) {
        console.log("   🔍 Error details:");
        console.log(`   Message: ${error.message}`);
        console.log(`   Stack: ${error.stack?.substring(0, 500)}...`);

        // Check if it's a constraint violation
        if (error.message.includes("constraint")) {
          console.log("   🚨 Constraint violation detected");
          await this.debugConstraints();
        }

        // Check if it's an enum issue
        if (error.message.includes("enum")) {
          console.log("   🚨 Enum issue detected");
          await this.debugEnums();
        }

        // Check if it's a foreign key issue
        if (error.message.includes("foreign key")) {
          console.log("   🚨 Foreign key issue detected");
          await this.debugForeignKeys();
        }
      }
    }
  }

  async testFieldCombinations(): Promise<void> {
    console.log("   Testing with anonymousSessionId instead of userId...");

    const policyId = generateId("pol");
    const policyNumber = `TRG-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    try {
      const policyData = {
        id: policyId,
        policyNumber,
        userId: null,
        anonymousSessionId: "test_session_12345",
        providerId: this.testProviderId,
        flightId: this.testFlightId,
        quoteId: this.testQuoteId,
        coverageType: "DELAY_120" as const,
        coverageAmount: "500.00",
        premium: "20.74",
        payoutAmount: "500.00",
        status: "PENDING" as const,
        chain: "PAYGO",
        delayThreshold: 60,
        terms: { delayThresholdMinutes: 60 },
        metadata: {
          chainSpecific: {
            PAYGO: {
              supportedFeatures: ["escrow", "automation"],
              networkId: "paygo-mainnet",
            },
          },
        },
        expiresAt,
      };

      const [result] = await Database.db
        .insert(Schema.policy)
        .values(policyData)
        .returning();

      console.log("   ✅ Anonymous session policy inserted successfully!");
      console.log(`   Policy ID: ${result.id}`);

      // Clean up
      await Database.db.delete(Schema.policy).where(sql`id = ${result.id}`);
    } catch (error) {
      console.error("   ❌ Anonymous session policy insertion failed:", error);
    }
  }

  async debugConstraints(): Promise<void> {
    console.log("   🔍 Checking database constraints...");

    try {
      const constraintsQuery = sql`
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          tc.table_name,
          kcu.column_name,
          cc.check_clause
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.check_constraints cc
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'policy'
        ORDER BY tc.constraint_type, tc.constraint_name;
      `;

      const result = await Database.db.execute(constraintsQuery);
      console.log("   Constraints on policy table:");
      result.rows.forEach((row: any) => {
        console.log(
          `   - ${row.constraint_name} (${row.constraint_type}): ${row.column_name || row.check_clause}`,
        );
      });
    } catch (error) {
      console.error("   Failed to check constraints:", error);
    }
  }

  async debugEnums(): Promise<void> {
    console.log("   🔍 Checking enum values...");

    try {
      // Check coverage_type enum
      const coverageEnumQuery = sql`
        SELECT enumlabel
        FROM pg_enum
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'coverage_type')
        ORDER BY enumsortorder;
      `;

      const coverageResult = await Database.db.execute(coverageEnumQuery);
      console.log("   Coverage type enum values:");
      coverageResult.rows.forEach((row: any) => {
        console.log(`   - ${row.enumlabel}`);
      });

      // Check policy_status enum
      const statusEnumQuery = sql`
        SELECT enumlabel
        FROM pg_enum
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'policy_status')
        ORDER BY enumsortorder;
      `;

      const statusResult = await Database.db.execute(statusEnumQuery);
      console.log("   Policy status enum values:");
      statusResult.rows.forEach((row: any) => {
        console.log(`   - ${row.enumlabel}`);
      });
    } catch (error) {
      console.error("   Failed to check enums:", error);
    }
  }

  async debugForeignKeys(): Promise<void> {
    console.log("   🔍 Checking foreign key references...");

    try {
      // Check if provider exists
      const providerCheck = await Database.db.query.provider.findFirst({
        where: sql`id = ${this.testProviderId}`,
      });
      console.log(
        `   Provider ${this.testProviderId}: ${providerCheck ? "✅ EXISTS" : "❌ NOT FOUND"}`,
      );

      // Check if flight exists
      const flightCheck = await Database.db.query.flight.findFirst({
        where: sql`id = ${this.testFlightId}`,
      });
      console.log(
        `   Flight ${this.testFlightId}: ${flightCheck ? "✅ EXISTS" : "❌ NOT FOUND"}`,
      );

      // Check if quote exists
      const quoteCheck = await Database.db.query.quote.findFirst({
        where: sql`id = ${this.testQuoteId}`,
      });
      console.log(
        `   Quote ${this.testQuoteId}: ${quoteCheck ? "✅ EXISTS" : "❌ NOT FOUND"}`,
      );
    } catch (error) {
      console.error("   Failed to check foreign keys:", error);
    }
  }

  async cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up test data...");

    try {
      // Delete test quote
      await Database.db
        .delete(Schema.quote)
        .where(sql`id = ${this.testQuoteId}`);

      console.log("✅ Cleanup completed");
    } catch (error) {
      console.error("❌ Cleanup failed:", error);
    }
  }
}

// Run the test
async function main() {
  const tester = new PolicyInsertTester();
  await tester.runTest();
}

main().catch(console.error);
