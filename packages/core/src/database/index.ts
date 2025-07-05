import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Environment variable validation
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please set it in your .env file.",
  );
}

// Create a node-postgres connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Create Drizzle instance with schema
export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

// Export edge database for edge runtime compatibility
export { edgeDb } from "./edge";

// Export types for use in other packages
export type Database = typeof db;
export * from "./schema";

// Re-export commonly used Drizzle utilities
export {
  eq,
  and,
  or,
  not,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  sql,
} from "drizzle-orm";
export { desc, asc } from "drizzle-orm";
