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

async function fixMissingColumns() {
  console.log('[Fix Missing Columns] Starting fix for missing anonymous_session_id column...');

  try {
    // 1. Check if anonymous_session_id column exists in conversation_messages
    console.log('[Fix Missing Columns] Checking for anonymous_session_id column in conversation_messages...');

    const columnExists = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'conversation_messages'
      AND column_name = 'anonymous_session_id'
      AND table_schema = 'public'
    `);

    if (columnExists.length > 0) {
      console.log('[Fix Missing Columns] ✅ Column anonymous_session_id already exists in conversation_messages');
    } else {
      console.log('[Fix Missing Columns] ❌ Column anonymous_session_id missing from conversation_messages');

      // 2. Add the missing column
      console.log('[Fix Missing Columns] Adding anonymous_session_id column...');
      await db.execute(sql`
        ALTER TABLE "conversation_messages"
        ADD COLUMN "anonymous_session_id" text
      `);
      console.log('[Fix Missing Columns] ✅ Added anonymous_session_id column');

      // 3. Add foreign key constraint to session table
      console.log('[Fix Missing Columns] Adding foreign key constraint...');
      await db.execute(sql`
        ALTER TABLE "conversation_messages"
        ADD CONSTRAINT "conversation_messages_anonymous_session_id_session_id_fk"
        FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."session"("id")
        ON DELETE set null ON UPDATE no action
      `);
      console.log('[Fix Missing Columns] ✅ Added foreign key constraint');
    }

    // 4. Verify the final state
    console.log('[Fix Missing Columns] Verifying final table structure...');
    const finalColumns = await db.execute(sql`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'conversation_messages'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('[Fix Missing Columns] Final conversation_messages columns:');
    finalColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
    });

    // 5. Check constraints
    const constraints = await db.execute(sql`
      SELECT
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'conversation_messages'
      AND table_schema = 'public'
      AND constraint_type = 'FOREIGN KEY'
      ORDER BY constraint_name
    `);

    console.log('[Fix Missing Columns] Foreign key constraints:');
    constraints.forEach((constraint: any) => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });

    // 6. Create a migration record for this manual fix
    const migrationHash = `manual_fix_conversation_messages_anonymous_session_id_${Date.now()}`;

    console.log('[Fix Missing Columns] Recording manual migration...');
    await db.execute(sql`
      INSERT INTO drizzle_migrations (hash, created_at)
      VALUES (${migrationHash}, ${Date.now()})
    `);
    console.log(`[Fix Missing Columns] ✅ Recorded migration: ${migrationHash}`);

  } catch (error) {
    console.error('[Fix Missing Columns] ❌ Error fixing missing columns:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixMissingColumns()
    .then(() => {
      console.log('[Fix Missing Columns] 🎉 Missing columns fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Fix Missing Columns] 💥 Missing columns fix failed:', error);
      process.exit(1);
    });
}

export { fixMissingColumns };
