import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function setupDatabase() {
  console.log('[Setup Database] Starting comprehensive database setup...');

  try {
    // Step 1: Reset database completely
    console.log('[Setup Database] Step 1: Resetting database...');
    
    // Drop all tables and functions
    const tables = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'drizzle_migrations'
    `);

    for (const table of tables) {
      const tableName = table.tablename;
      console.log(`[Setup Database] Dropping table: ${tableName}`);
      await db.execute(sql`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }

    // Drop all custom types
    await db.execute(sql`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') 
        LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    // Drop the ULID function if it exists
    await db.execute(sql`DROP FUNCTION IF EXISTS generate_ulid() CASCADE`);

    // Clear migration history
    await db.execute(sql`DROP TABLE IF EXISTS drizzle_migrations CASCADE`);

    console.log('[Setup Database] ✅ Database reset completed');

    // Step 2: Set up ULID function
    console.log('[Setup Database] Step 2: Setting up ULID function...');
    
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

    // Test the ULID function
    const testResult = await db.execute(sql`SELECT generate_ulid() as test_ulid`);
    console.log('[Setup Database] Test ULID generated:', testResult[0]?.test_ulid);

    console.log('[Setup Database] ✅ ULID function setup completed');

    // Step 3: Apply migrations
    console.log('[Setup Database] Step 3: Applying migrations...');
    
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    
    console.log('[Setup Database] ✅ Migrations applied successfully');

    // Step 4: Verify setup
    console.log('[Setup Database] Step 4: Verifying setup...');
    
    // Check if key tables exist
    const keyTables = ['user', 'provider', 'policy', 'quote'];
    for (const tableName of keyTables) {
      const tableExists = await db.execute(sql`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = ${tableName}
      `);
      
      if (tableExists.length > 0) {
        console.log(`[Setup Database] ✅ Table '${tableName}' exists`);
      } else {
        console.log(`[Setup Database] ⚠️ Table '${tableName}' not found`);
      }
    }

    // Check if ULID function works in table context
    const ulidTest = await db.execute(sql`
      SELECT generate_ulid() as test_ulid
    `);
    console.log('[Setup Database] ✅ ULID function working:', ulidTest[0]?.test_ulid);

    console.log('[Setup Database] 🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('[Setup Database] ❌ Error during database setup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('[Setup Database] 🎉 Database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Setup Database] 💥 Database setup failed:', error);
      process.exit(1);
    });
}

export { setupDatabase }; 