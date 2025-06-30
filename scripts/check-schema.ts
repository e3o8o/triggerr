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

async function checkSchema() {
  console.log('[Check Schema] Starting database schema analysis...');

  try {
    // 1. Check if drizzle_migrations table exists and what migrations have been applied
    console.log('\n=== MIGRATION STATUS ===');
    try {
      const migrations = await db.execute(sql`
        SELECT * FROM drizzle_migrations ORDER BY created_at
      `);
      console.log('Applied migrations:');
      migrations.forEach((migration: any) => {
        console.log(`  - ${migration.hash} (${new Date(Number(migration.created_at)).toISOString()})`);
      });
    } catch (error) {
      console.log('❌ drizzle_migrations table does not exist or is inaccessible');
    }

    // 2. Check conversation_messages table structure
    console.log('\n=== CONVERSATION_MESSAGES TABLE ===');
    try {
      const conversationMessagesColumns = await db.execute(sql`
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

      console.log('Columns in conversation_messages:');
      conversationMessagesColumns.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
      });
    } catch (error) {
      console.log('❌ conversation_messages table does not exist or is inaccessible');
    }

    // 3. Check conversations table structure
    console.log('\n=== CONVERSATIONS TABLE ===');
    try {
      const conversationsColumns = await db.execute(sql`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'conversations'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      console.log('Columns in conversations:');
      conversationsColumns.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
      });
    } catch (error) {
      console.log('❌ conversations table does not exist or is inaccessible');
    }

    // 4. Check user_wallets table structure
    console.log('\n=== USER_WALLETS TABLE ===');
    try {
      const userWalletsColumns = await db.execute(sql`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'user_wallets'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      console.log('Columns in user_wallets:');
      userWalletsColumns.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
      });
    } catch (error) {
      console.log('❌ user_wallets table does not exist or is inaccessible');
    }

    // 5. Check for anonymous_session_id columns across tables
    console.log('\n=== ANONYMOUS_SESSION_ID COLUMNS ===');
    try {
      const anonymousColumns = await db.execute(sql`
        SELECT
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE column_name = 'anonymous_session_id'
        AND table_schema = 'public'
        ORDER BY table_name
      `);

      if (anonymousColumns.length > 0) {
        console.log('Tables with anonymous_session_id column:');
        anonymousColumns.forEach((col: any) => {
          console.log(`  - ${col.table_name}.${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
      } else {
        console.log('❌ No tables found with anonymous_session_id column');
      }
    } catch (error) {
      console.log('❌ Error checking for anonymous_session_id columns:', error);
    }

    // 6. Check for user_id columns across tables
    console.log('\n=== USER_ID COLUMNS ===');
    try {
      const userIdColumns = await db.execute(sql`
        SELECT
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE column_name = 'user_id'
        AND table_schema = 'public'
        ORDER BY table_name
      `);

      if (userIdColumns.length > 0) {
        console.log('Tables with user_id column:');
        userIdColumns.forEach((col: any) => {
          console.log(`  - ${col.table_name}.${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
      } else {
        console.log('❌ No tables found with user_id column');
      }
    } catch (error) {
      console.log('❌ Error checking for user_id columns:', error);
    }

    // 7. Check constraints and foreign keys for conversation_messages
    console.log('\n=== CONVERSATION_MESSAGES CONSTRAINTS ===');
    try {
      const constraints = await db.execute(sql`
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'conversation_messages'
        AND tc.table_schema = 'public'
        ORDER BY tc.constraint_type, tc.constraint_name
      `);

      if (constraints.length > 0) {
        console.log('Constraints on conversation_messages:');
        constraints.forEach((constraint: any) => {
          if (constraint.constraint_type === 'FOREIGN KEY') {
            console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type} (${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name})`);
          } else {
            console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type} (${constraint.column_name})`);
          }
        });
      } else {
        console.log('No constraints found on conversation_messages table');
      }
    } catch (error) {
      console.log('❌ Error checking constraints:', error);
    }

  } catch (error) {
    console.error('[Check Schema] ❌ Error checking schema:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  checkSchema()
    .then(() => {
      console.log('\n[Check Schema] 🎉 Schema analysis completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n[Check Schema] 💥 Schema analysis failed:', error);
      process.exit(1);
    });
}

export { checkSchema };
