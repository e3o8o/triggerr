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

async function resetDatabase() {
  console.log('[Reset Database] Starting complete database reset...');

  try {
    // Step 1: Drop all tables and functions
    console.log('[Reset Database] Step 1: Dropping all tables and functions...');
    
    // Get all table names
    const tables = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'drizzle_migrations'
    `);

    // Drop all tables (in reverse dependency order)
    for (const table of tables) {
      const tableName = table.tablename;
      console.log(`[Reset Database] Dropping table: ${tableName}`);
      // Use direct string interpolation for the DROP TABLE statement
      await db.execute(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }

    // Drop all custom types
    console.log('[Reset Database] Dropping all custom types...');
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
    console.log('[Reset Database] Dropping ULID function...');
    await db.execute(sql`DROP FUNCTION IF EXISTS generate_ulid() CASCADE`);

    // Clear migration history
    console.log('[Reset Database] Clearing migration history...');
    await db.execute(sql`DROP TABLE IF EXISTS drizzle_migrations CASCADE`);

    console.log('[Reset Database] ✅ Database reset completed');

  } catch (error) {
    console.error('[Reset Database] ❌ Error during database reset:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('[Reset Database] 🎉 Database reset completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Reset Database] 💥 Database reset failed:', error);
      process.exit(1);
    });
}

export { resetDatabase }; 