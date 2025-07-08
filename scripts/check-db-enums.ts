/**
 * Database Enum Checker Script
 *
 * This script checks the actual enum values in the PostgreSQL database
 * and compares them with what's expected from the schema.
 */

import { Database } from "@triggerr/core";
import { sql } from "drizzle-orm";

interface EnumValue {
  enumlabel: string;
  enumsortorder: number;
}

interface EnumInfo {
  typname: string;
  values: EnumValue[];
}

class DatabaseEnumChecker {
  async checkEnums(): Promise<void> {
    console.log("🔍 Checking Database Enum Values...\n");

    try {
      // Initialize database connection
      console.log("📡 Connecting to database...");

      // Get all enum types and their values
      const enumsQuery = sql`
        SELECT
          t.typname,
          e.enumlabel,
          e.enumsortorder
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname IN ('coverage_type', 'policy_status')
        ORDER BY t.typname, e.enumsortorder;
      `;

      const result = await Database.db.execute(enumsQuery);
      const enumData = result.rows as Array<{
        typname: string;
        enumlabel: string;
        enumsortorder: number;
      }>;

      // Group by enum type
      const enums: Record<string, EnumValue[]> = {};
      enumData.forEach(row => {
        if (!enums[row.typname]) {
          enums[row.typname] = [];
        }
        enums[row.typname].push({
          enumlabel: row.enumlabel,
          enumsortorder: row.enumsortorder
        });
      });

      // Expected values from schema
      const expectedEnums = {
        coverage_type: ["DELAY_60", "DELAY_120", "CANCELLATION", "BAGGAGE", "COMPREHENSIVE", "CUSTOM"],
        policy_status: ["PENDING", "ACTIVE", "EXPIRED", "CLAIMED", "CANCELLED", "FAILED"]
      };

      // Check coverage_type enum
      console.log("📋 Coverage Type Enum:");
      if (enums.coverage_type) {
        const actualValues = enums.coverage_type
          .sort((a, b) => a.enumsortorder - b.enumsortorder)
          .map(v => v.enumlabel);

        console.log(`   Database: [${actualValues.join(", ")}]`);
        console.log(`   Expected: [${expectedEnums.coverage_type.join(", ")}]`);

        const missing = expectedEnums.coverage_type.filter(v => !actualValues.includes(v));
        const extra = actualValues.filter(v => !expectedEnums.coverage_type.includes(v));

        if (missing.length > 0) {
          console.log(`   ❌ Missing: [${missing.join(", ")}]`);
        }
        if (extra.length > 0) {
          console.log(`   ⚠️  Extra: [${extra.join(", ")}]`);
        }
        if (missing.length === 0 && extra.length === 0) {
          console.log("   ✅ Perfect match!");
        }
      } else {
        console.log("   ❌ Enum not found in database!");
      }

      console.log();

      // Check policy_status enum
      console.log("📋 Policy Status Enum:");
      if (enums.policy_status) {
        const actualValues = enums.policy_status
          .sort((a, b) => a.enumsortorder - b.enumsortorder)
          .map(v => v.enumlabel);

        console.log(`   Database: [${actualValues.join(", ")}]`);
        console.log(`   Expected: [${expectedEnums.policy_status.join(", ")}]`);

        const missing = expectedEnums.policy_status.filter(v => !actualValues.includes(v));
        const extra = actualValues.filter(v => !expectedEnums.policy_status.includes(v));

        if (missing.length > 0) {
          console.log(`   ❌ Missing: [${missing.join(", ")}]`);
        }
        if (extra.length > 0) {
          console.log(`   ⚠️  Extra: [${extra.join(", ")}]`);
        }
        if (missing.length === 0 && extra.length === 0) {
          console.log("   ✅ Perfect match!");
        }
      } else {
        console.log("   ❌ Enum not found in database!");
      }

      console.log();

      // Check if there are any other enums that might be relevant
      const allEnumsQuery = sql`
        SELECT DISTINCT t.typname
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        ORDER BY t.typname;
      `;

      const allEnumsResult = await Database.db.execute(allEnumsQuery);
      const allEnums = allEnumsResult.rows as Array<{ typname: string }>;

      console.log("📋 All Enums in Database:");
      allEnums.forEach(row => {
        console.log(`   - ${row.typname}`);
      });

      console.log();

      // Test actual insert attempt
      console.log("🧪 Testing Sample Insert...");
      await this.testInsert();

    } catch (error) {
      console.error("❌ Database enum check failed:", error);
    }
  }

  async testInsert(): Promise<void> {
    try {
      // Test if we can insert a sample record
      const testQuery = sql`
        SELECT
          'DELAY_120'::coverage_type as coverage_test,
          'PENDING'::policy_status as status_test;
      `;

      const result = await Database.db.execute(testQuery);
      console.log("   ✅ Enum casting test successful!");
      console.log(`   Coverage: ${result.rows[0].coverage_test}`);
      console.log(`   Status: ${result.rows[0].status_test}`);
    } catch (error) {
      console.log("   ❌ Enum casting test failed:", error);
    }
  }
}

// Run the checker
async function main() {
  const checker = new DatabaseEnumChecker();
  await checker.checkEnums();
}

main().catch(console.error);
