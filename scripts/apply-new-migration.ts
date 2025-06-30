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

async function applyNewMigration() {
  console.log('[Apply New Migration] Starting application of 0004_icy_komodo migration...');

  try {
    // Check if this migration has already been applied
    const existingMigration = await db.execute(sql`
      SELECT * FROM drizzle_migrations
      WHERE hash = '0004_icy_komodo'
    `);

    if (existingMigration.length > 0) {
      console.log('[Apply New Migration] ⚠️ Migration 0004_icy_komodo already applied, skipping...');
      return;
    }

    // Check if the user_id column already exists in conversation_messages
    const columnExists = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'conversation_messages'
      AND column_name = 'user_id'
      AND table_schema = 'public'
    `);

    if (columnExists.length > 0) {
      console.log('[Apply New Migration] ⚠️ Column user_id already exists in conversation_messages, marking migration as complete...');
    } else {
      console.log('[Apply New Migration] Applying migration 0004_icy_komodo...');

      // Apply the migration step by step
      console.log('[Apply New Migration] Step 1: Adding user_id column to conversation_messages...');
      await db.execute(sql`
        ALTER TABLE "conversation_messages" ADD COLUMN "user_id" text
      `);

      console.log('[Apply New Migration] Step 2: Adding foreign key constraint...');
      await db.execute(sql`
        ALTER TABLE "conversation_messages"
        ADD CONSTRAINT "conversation_messages_user_id_user_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
        ON DELETE set null ON UPDATE no action
      `);

      console.log('[Apply New Migration] ✅ Migration 0004_icy_komodo applied successfully');
    }

    // Mark the migration as completed
    await db.execute(sql`
      INSERT INTO drizzle_migrations (hash, created_at)
      VALUES ('0004_icy_komodo', ${Date.now()})
    `);

    console.log('[Apply New Migration] ✅ Migration 0004_icy_komodo marked as completed');

    // Verify the column exists and has the correct constraint
    const verifyColumn = await db.execute(sql`
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.columns c
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON c.table_name = ccu.table_name AND c.column_name = ccu.column_name
      LEFT JOIN information_schema.table_constraints tc
        ON ccu.constraint_name = tc.constraint_name
      WHERE c.table_name = 'conversation_messages'
      AND c.column_name = 'user_id'
      AND c.table_schema = 'public'
    `);

    console.log('[Apply New Migration] Column verification:', verifyColumn);

  } catch (error) {
    console.error('[Apply New Migration] ❌ Error applying migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  applyNewMigration()
    .then(() => {
      console.log('[Apply New Migration] 🎉 Migration application completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Apply New Migration] 💥 Migration application failed:', error);
      process.exit(1);
    });
}

export { applyNewMigration };
