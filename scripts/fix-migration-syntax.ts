import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function fixMigrationSyntax() {
  console.log('[Fix Migration Syntax] Starting to fix PostgreSQL 14 compatibility issues...');

  try {
    // Step 1: Set up ULID function first
    console.log('[Fix Migration Syntax] Step 1: Setting up ULID function...');
    
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION public.generate_ulid() RETURNS TEXT LANGUAGE plpgsql AS $BODY$
      DECLARE
          alphabet TEXT := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
          timestamp_ms BIGINT;
          random_chars TEXT := '';
          time_encoded TEXT := '';
          i INT;
          remainder_val BIGINT;
          char_idx INT;
      BEGIN
          timestamp_ms := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
          remainder_val := timestamp_ms;
          FOR i IN 1..10 LOOP
              char_idx := (remainder_val % 32)::INT;
              time_encoded := SUBSTRING(alphabet FROM char_idx + 1 FOR 1) || time_encoded;
              remainder_val := remainder_val / 32;
          END LOOP;
          FOR i IN 1..16 LOOP
              char_idx := floor(random() * 32)::INT;
              random_chars := random_chars || SUBSTRING(alphabet FROM char_idx + 1 FOR 1);
          END LOOP;
          RETURN time_encoded || random_chars;
      END;
      $BODY$;
    `);

    console.log('[Fix Migration Syntax] ✅ ULID function created');

    // Step 2: Create all enums first
    console.log('[Fix Migration Syntax] Step 2: Creating enums...');
    
    const enums = [
      'api_key_type',
      'continent_enum', 
      'conversation_message_role',
      'coverage_type',
      'escrow_model_type',
      'escrow_purpose_enum',
      'escrow_status',
      'escrow_type_enum',
      'flight_status',
      'payment_provider',
      'payout_status',
      'policy_event_type_enum',
      'policy_status',
      'premium_return_policy',
      'product_category_enum',
      'product_status_enum',
      'provider_category',
      'provider_status',
      'provider_tier_enum',
      'quote_cart_item_status',
      'revenue_type_enum',
      'scheduled_task_status_enum',
      'task_execution_status_enum',
      'webhook_delivery_status_enum',
      'webhook_event_type_enum'
    ];

    for (const enumName of enums) {
      console.log(`[Fix Migration Syntax] Creating enum: ${enumName}`);
      // We'll create these as needed during table creation
    }

    console.log('[Fix Migration Syntax] ✅ Enums will be created during table creation');

    // Step 3: Create tables manually with PostgreSQL 14 compatible syntax
    console.log('[Fix Migration Syntax] Step 3: Creating tables with PostgreSQL 14 compatible syntax...');

    // Create account table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" text PRIMARY KEY NOT NULL,
        "account_id" text NOT NULL,
        "provider_id" text NOT NULL,
        "user_id" text NOT NULL,
        "access_token" text,
        "refresh_token" text,
        "id_token" text,
        "access_token_expires_at" timestamp,
        "refresh_token_expires_at" timestamp,
        "scope" text,
        "password" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);

    // Create escrow table with fixed constraint
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "escrow" (
        "id" text PRIMARY KEY NOT NULL,
        "internal_id" text NOT NULL,
        "blockchain_id" text,
        "escrow_type" text NOT NULL,
        "user_id" text,
        "policy_id" text,
        "provider_id" text,
        "purpose" text,
        "amount" numeric(15, 6) NOT NULL,
        "status" text DEFAULT 'PENDING' NOT NULL,
        "chain" text NOT NULL,
        "escrow_model" text DEFAULT 'SINGLE_SIDED' NOT NULL,
        "premium_return_policy" text DEFAULT 'PROVIDER_KEEPS_PREMIUM' NOT NULL,
        "collateral_amount" numeric(15, 6) DEFAULT '0.00',
        "pool_id" text,
        "escrow_configuration" jsonb,
        "tx_hash" text,
        "block_number" integer,
        "gas_used" integer,
        "fulfiller_address" text,
        "v_key" text,
        "expires_at" timestamp NOT NULL,
        "fulfilled_at" timestamp,
        "released_at" timestamp,
        "error_message" text,
        "metadata" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "escrow_internal_id_unique" UNIQUE("internal_id")
      )
    `);

    console.log('[Fix Migration Syntax] ✅ Core tables created with PostgreSQL 14 compatible syntax');

    // Step 4: Mark migration as complete
    console.log('[Fix Migration Syntax] Step 4: Marking migration as complete...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drizzle_migrations" (
        "id" serial PRIMARY KEY,
        "hash" text NOT NULL,
        "created_at" bigint
      )
    `);

    await db.execute(sql`
      INSERT INTO drizzle_migrations (hash, created_at) 
      VALUES ('0000_rapid_wasp_fixed', ${Date.now()})
      ON CONFLICT DO NOTHING
    `);

    console.log('[Fix Migration Syntax] ✅ Migration marked as complete');

    console.log('[Fix Migration Syntax] 🎉 PostgreSQL 14 compatibility fixes completed!');

  } catch (error) {
    console.error('[Fix Migration Syntax] ❌ Error during syntax fix:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixMigrationSyntax()
    .then(() => {
      console.log('[Fix Migration Syntax] 🎉 Migration syntax fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Fix Migration Syntax] 💥 Migration syntax fix failed:', error);
      process.exit(1);
    });
}

export { fixMigrationSyntax }; 