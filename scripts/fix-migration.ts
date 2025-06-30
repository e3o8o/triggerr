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

async function fixMigration() {
  console.log('[Fix Migration] Starting migration bypass...');

  try {
    // First, check if drizzle_migrations table exists
    const migrationTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'drizzle_migrations'
      )
    `);

    const tableExists = migrationTableExists[0]?.exists;

    if (!tableExists) {
      console.log('[Fix Migration] Creating drizzle_migrations table...');
      await db.execute(sql`
        CREATE TABLE drizzle_migrations (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at bigint
        )
      `);
    }

    // Check if the problematic migration is already marked as applied
    const existingMigration = await db.execute(sql`
      SELECT * FROM drizzle_migrations
      WHERE hash = '0000_cultured_joystick'
    `);

    if (existingMigration.length === 0) {
      console.log('[Fix Migration] Marking 0000_cultured_joystick migration as completed...');

      // Insert the migration record to mark it as completed
      await db.execute(sql`
        INSERT INTO drizzle_migrations (hash, created_at)
        VALUES ('0000_cultured_joystick', ${Date.now()})
      `);

      console.log('[Fix Migration] ✅ Migration marked as completed successfully');
    } else {
      console.log('[Fix Migration] ⚠️ Migration already marked as completed');
    }

    // Check current migration status
    const allMigrations = await db.execute(sql`
      SELECT * FROM drizzle_migrations ORDER BY created_at
    `);

    console.log('[Fix Migration] Current migrations in database:');
    allMigrations.forEach((migration: any) => {
      console.log(`  - ${migration.hash} (${new Date(Number(migration.created_at)).toISOString()})`);
    });

  } catch (error) {
    console.error('[Fix Migration] ❌ Error fixing migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixMigration()
    .then(() => {
      console.log('[Fix Migration] 🎉 Migration fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Fix Migration] 💥 Migration fix failed:', error);
      process.exit(1);
    });
}

export { fixMigration };
