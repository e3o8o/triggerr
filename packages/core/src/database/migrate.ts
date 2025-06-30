import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

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
  
  // Create a new pool for migrations, it will be closed after.
  const migrationPool = new Pool({
    connectionString: DATABASE_URL,
    max: 1, // Max 1 client for migration
  });

  const dbForMigration = drizzle(migrationPool);
  
  try {
    await migrate(dbForMigration, { migrationsFolder: "drizzle/migrations" });
    
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
    // Ensure the migration pool is closed
    await migrationPool.end();
  }
  
  process.exit(0);
};

main();