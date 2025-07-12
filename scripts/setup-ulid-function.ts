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

async function setupUlidFunction() {
  console.log('[Setup ULID Function] Setting up ULID function...');

  try {
    // Check if the function already exists
    const functionExists = await db.execute(sql`
      SELECT 1 FROM pg_proc 
      WHERE proname = 'generate_ulid' 
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);

    if (functionExists.length > 0) {
      console.log('[Setup ULID Function] ⚠️ ULID function already exists, dropping and recreating...');
      await db.execute(sql`DROP FUNCTION IF EXISTS generate_ulid() CASCADE`);
    }

    // Create the ULID function
    console.log('[Setup ULID Function] Creating ULID function...');
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

    // Test the function
    console.log('[Setup ULID Function] Testing ULID function...');
    const testResult = await db.execute(sql`SELECT generate_ulid() as test_ulid`);
    console.log('[Setup ULID Function] Test ULID generated:', testResult[0]?.test_ulid);

    console.log('[Setup ULID Function] ✅ ULID function setup completed successfully');

  } catch (error) {
    console.error('[Setup ULID Function] ❌ Error setting up ULID function:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupUlidFunction()
    .then(() => {
      console.log('[Setup ULID Function] 🎉 ULID function setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Setup ULID Function] 💥 ULID function setup failed:', error);
      process.exit(1);
    });
}

export { setupUlidFunction }; 