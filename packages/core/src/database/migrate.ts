import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

// Environment variable validation
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required for migrations. Please set it in your .env file."
  );
}

const main = async () => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting database migration for triggerr...`);
  
  // Create a new client for migrations, it will be closed after.
  const client = postgres(DATABASE_URL);
  const dbForMigration = drizzle(client);
  
  try {
    // Check PostgreSQL version before migration
    console.log(`[${new Date().toISOString()}] 🔍 Checking PostgreSQL version...`);
    const versionResult = await dbForMigration.execute(sql`SELECT version();`);
    const versionString = (versionResult as any)[0]?.version;
    console.log(`[${new Date().toISOString()}] 📊 Connected DB Version: ${versionString}`);
    
    // Parse version number for compatibility check
    const versionMatch = versionString.match(/PostgreSQL (\d+\.\d+)/);
    if (versionMatch) {
      const versionNum = parseFloat(versionMatch[1]);
      const minVersion = 15;
      if (versionNum < minVersion) {
        throw new Error(`PostgreSQL ${versionNum} < ${minVersion} - Upgrade required for NULLS NOT DISTINCT syntax`);
      }
      console.log(`[${new Date().toISOString()}] ✅ PostgreSQL version ${versionNum} is compatible`);
    } else {
      console.log(`[${new Date().toISOString()}] ⚠️  Could not parse version number, proceeding with caution`);
    }
    
    // Ensure pgcrypto extension and generate_ulid function exist
    console.log(`[${new Date().toISOString()}] 🔧 Setting up required extensions and functions...`);
    
    // Create pgcrypto extension if it doesn't exist
    await dbForMigration.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    console.log(`[${new Date().toISOString()}] ✅ pgcrypto extension ready`);
    
    // Create generate_ulid function if it doesn't exist
    await client`
      CREATE OR REPLACE FUNCTION generate_ulid()
      RETURNS text AS $$
      DECLARE
        millis bigint;
        encoded_time text;
        random_bytes bytea;
        encoded_random text;
        time_bytes bytea;
      BEGIN
        -- Get current time in milliseconds since Unix epoch
        millis := FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000);
        -- Create time bytes manually
        time_bytes := set_byte(set_byte(set_byte(set_byte(set_byte(set_byte(
          decode('000000000000', 'hex'),
          0, (millis >> 40) & 255), 1, (millis >> 32) & 255), 2, (millis >> 24) & 255), 
          3, (millis >> 16) & 255), 4, (millis >> 8) & 255), 5, millis & 255);
        -- Encode time part (48 bits = 6 bytes)
        encoded_time := encode(time_bytes, 'base32');
        -- Generate 10 random bytes (80 bits)
        random_bytes := gen_random_bytes(10);
        encoded_random := encode(random_bytes, 'base32');
        -- Concatenate and return
        RETURN lower(encoded_time || encoded_random);
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log(`[${new Date().toISOString()}] ✅ generate_ulid function ready`);
    
    await migrate(dbForMigration, { migrationsFolder: "../../drizzle/migrations" });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${new Date().toISOString()}] ✅ Migration completed successfully in ${duration}s`);
    console.log(`[${new Date().toISOString()}] 🎯 Database schema is now ready for triggerr marketplace`);
  } catch (error: unknown) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[${new Date().toISOString()}] ❌ Migration failed after ${duration}s`);
    
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.stack) {
        console.error(`Stack trace:\n${error.stack}`);
      }
    } else {
      console.error(`Error details: ${String(error)}`);
    }
    
    console.error(`[${new Date().toISOString()}] 🚫 Please check your DATABASE_URL and ensure PostgreSQL is running`);
    process.exit(1);
  } finally {
    // Ensure the client is closed
    await client.end();
  }
  
  process.exit(0);
};

main();