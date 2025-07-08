/**
 * Drizzle-Kit Enum Synchronization Script
 *
 * Drizzle Kit's `push` command does not automatically create or update PostgreSQL ENUM types.
 * This script bridges that gap by introspecting the schema, checking the database state,
 * and then creating or updating the necessary ENUM types.
 *
 * This script is idempotent and safe to run multiple times.
 *
 * Usage: bun run scripts/sync-db-enums.ts
 */

import { Database, Schema } from "@triggerr/core";
import { sql } from "drizzle-orm";
import type { PgEnum } from "drizzle-orm/pg-core";

// Define all enums from the schema that need to be synchronized
const enumsToSync: Record<string, PgEnum<[string, ...string[]]>> = {
  continent_enum: Schema.continentEnum,
  api_key_type: Schema.apiKeyTypeEnum,
  provider_status: Schema.providerStatusEnum,
  provider_category: Schema.providerCategoryEnum,
  provider_tier: Schema.providerTierEnum,
  product_status: Schema.productStatusEnum,
  product_category: Schema.productCategoryEnum,
  beneficiary_type: Schema.beneficiaryTypeEnum,
  endorsement_type: Schema.endorsementTypeEnum,
  policy_event_type: Schema.policyEventTypeEnum,
  policy_status: Schema.policyStatusEnum,
  coverage_type: Schema.coverageTypeEnum,
  flight_status: Schema.flightStatusEnum,
  escrow_status: Schema.escrowStatusEnum,
  payout_status: Schema.payoutStatusEnum,
  escrow_model: Schema.escrowModelEnum,
  premium_return_policy: Schema.premiumReturnPolicyEnum,
  escrow_type: Schema.escrowTypeEnum,
  escrow_purpose: Schema.escrowPurposeEnum,
  revenue_type: Schema.revenueTypeEnum,
  webhook_event_type: Schema.webhookEventTypeEnum,
  webhook_delivery_status: Schema.webhookDeliveryStatusEnum,
  scheduled_task_status: Schema.scheduledTaskStatusEnum,
  task_execution_status: Schema.taskExecutionStatusEnum,
  conversation_message_role: Schema.conversationMessageRoleEnum,
  quote_cart_item_status: Schema.quoteCartItemStatusEnum,
  quote_status: Schema.quoteStatusEnum,
  payment_provider: Schema.paymentProviderEnum,
};

async function syncEnums() {
  console.log("🚀 Starting database enum synchronization...");
  let totalCreated = 0;
  let totalUpdated = 0;

  for (const [enumName, enumValues] of Object.entries(enumsToSync)) {
    console.log(`\n🔄 Processing enum: "${enumName}"`);

    try {
      // Check if the enum type exists
      const existingEnum = await Database.db.execute(
        sql`SELECT 1 FROM pg_type WHERE typname = ${enumName}`,
      );

      const enumExists = existingEnum.rowCount > 0;
      const expectedValues = enumValues.enumValues;

      if (!enumExists) {
        // --- CREATE ENUM ---
        const createQuery = `CREATE TYPE "${enumName}" AS ENUM (${expectedValues.map((v) => `'${v}'`).join(", ")});`;
        await Database.db.execute(sql.raw(createQuery));
        console.log(
          `   ✅ Created new enum type "${enumName}" with ${expectedValues.length} values.`,
        );
        totalCreated++;
      } else {
        // --- UPDATE ENUM (if necessary) ---
        const dbValuesResult = await Database.db.execute(
          sql`SELECT unnest(enum_range(NULL::${sql.raw(`"${enumName}"`)})) AS label;`,
        );

        const dbValues = dbValuesResult.rows.map(
          (row: any) => row.label as string,
        );
        const missingValues = expectedValues.filter(
          (v) => !dbValues.includes(v),
        );

        if (missingValues.length > 0) {
          console.log(
            `   ✏️  Enum "${enumName}" exists, but is missing values. Updating...`,
          );
          for (const value of missingValues) {
            const addQuery = `ALTER TYPE "${enumName}" ADD VALUE '${value}';`;
            await Database.db.execute(sql.raw(addQuery));
            console.log(`      + Added value: "${value}"`);
          }
          totalUpdated++;
        } else {
          console.log(`   ✅ Enum "${enumName}" is already up-to-date.`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Failed to process enum "${enumName}":`, error);
      // Exit on first error to prevent cascading issues
      process.exit(1);
    }
  }

  console.log("\n\n🎉 Enum Synchronization Complete!");
  console.log("======================================");
  console.log(`   Enums Created: ${totalCreated}`);
  console.log(`   Enums Updated: ${totalUpdated}`);
  console.log("   Database schema is now fully synchronized.");
  console.log("======================================\n");
}

async function main() {
  await syncEnums();
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(
      "An unexpected error occurred during enum synchronization:",
      e,
    );
    process.exit(1);
  });
}
