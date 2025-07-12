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

async function freshDbSetup() {
  console.log('[Fresh DB Setup] 🚀 Starting complete fresh database setup...');

  try {
    // Step 1: Complete database reset
    console.log('[Fresh DB Setup] Step 1: Resetting database completely...');
    
    // Drop all tables and functions
    const tables = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'drizzle_migrations'
    `);

    for (const table of tables) {
      const tableName = table.tablename;
      console.log(`[Fresh DB Setup] Dropping table: ${tableName}`);
      await db.execute(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
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

    console.log('[Fresh DB Setup] ✅ Database reset completed');

    // Step 2: Set up ULID function
    console.log('[Fresh DB Setup] Step 2: Setting up ULID function...');
    
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
    console.log('[Fresh DB Setup] Test ULID generated:', testResult[0]?.test_ulid);

    console.log('[Fresh DB Setup] ✅ ULID function setup completed');

    // Step 3: Apply migrations
    console.log('[Fresh DB Setup] Step 3: Applying migrations...');
    
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    
    console.log('[Fresh DB Setup] ✅ Migrations applied successfully');

    // Step 4: Verify schema
    console.log('[Fresh DB Setup] Step 4: Verifying schema...');
    
    // Check if key tables exist
    const keyTables = ['user', 'provider', 'policy', 'quote', 'escrow'];
    for (const tableName of keyTables) {
      const tableExists = await db.execute(sql`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = ${tableName}
      `);
      
      if (tableExists.length > 0) {
        console.log(`[Fresh DB Setup] ✅ Table '${tableName}' exists`);
      } else {
        console.log(`[Fresh DB Setup] ⚠️ Table '${tableName}' not found`);
      }
    }

    // Check if ULID function works in table context
    const ulidTest = await db.execute(sql`
      SELECT generate_ulid() as test_ulid
    `);
    console.log('[Fresh DB Setup] ✅ ULID function working:', ulidTest[0]?.test_ulid);

    console.log('[Fresh DB Setup] 🎉 Schema setup completed successfully!');

    // Step 5: Seed the database
    console.log('[Fresh DB Setup] Step 5: Seeding database...');
    
    // Import and run the seed function
    const { main: seedMain } = await import('../packages/core/src/database/seed.ts');
    await seedMain();
    
    console.log('[Fresh DB Setup] ✅ Database seeding completed');

    // Step 6: Final verification
    console.log('[Fresh DB Setup] Step 6: Final verification...');
    
    // Check if seed data was inserted
    const providerCount = await db.execute(sql`SELECT COUNT(*) as count FROM provider`);
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM "user"`);
    const productCount = await db.execute(sql`SELECT COUNT(*) as count FROM provider_product`);
    
    console.log(`[Fresh DB Setup] 📊 Seed data verification:`);
    console.log(`[Fresh DB Setup]   - Providers: ${providerCount[0]?.count}`);
    console.log(`[Fresh DB Setup]   - Users: ${userCount[0]?.count}`);
    console.log(`[Fresh DB Setup]   - Products: ${productCount[0]?.count}`);

    console.log('[Fresh DB Setup] 🎉 Fresh database setup completed successfully!');
    console.log('[Fresh DB Setup] 🚀 Your triggerr database is ready to use!');

  } catch (error) {
    console.error('[Fresh DB Setup] ❌ Error during fresh database setup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  freshDbSetup()
    .then(() => {
      console.log('[Fresh DB Setup] 🎉 Fresh database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Fresh DB Setup] 💥 Fresh database setup failed:', error);
      process.exit(1);
    });
}

export { freshDbSetup }; 