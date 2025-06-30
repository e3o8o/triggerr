import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Edge-compatible database connection
// Uses postgres-js which works in edge environments

// Try multiple ways to access DATABASE_URL for maximum compatibility
// with different environments (Node.js, Bun, Edge Runtime)
let DATABASE_URL = process.env.DATABASE_URL;

// Fallback for edge runtime where process.env might not be available in the same way
if (!DATABASE_URL && typeof globalThis !== "undefined") {
  // @ts-ignore - Access potential environment in global context
  DATABASE_URL = globalThis.process?.env?.DATABASE_URL;
}

// Hardcoded fallback for development only - REMOVE IN PRODUCTION
if (!DATABASE_URL) {
  // This is a development fallback to the Supabase URL from .env
  // IMPORTANT: This should be removed before production deployment
  DATABASE_URL = "postgresql://postgres.lpkuewcwsurhwunwhuqr:Essen3tric!@aws-0-us-east-2.pooler.supabase.com:6543/postgres";
  console.warn("Using hardcoded DATABASE_URL fallback. This should only happen in development.");
}

// Create postgres client with edge-compatible configuration
const client = postgres(DATABASE_URL, {
  prepare: false, // Disable prepared statements for edge compatibility
  max: 1, // Limit connections in edge environment
});

// Create Drizzle instance with schema for edge runtime
export const edgeDb = drizzle(client, {
  schema,
  logger: false, // Disable logging in edge environment
});

// Export types for use in edge functions
export type EdgeDatabase = typeof edgeDb;

// Re-export commonly used Drizzle utilities for edge
export { eq, and, or, not, isNull, isNotNull, inArray, notInArray, sql } from "drizzle-orm";
export { desc, asc } from "drizzle-orm";

// Helper function to execute simple auth queries in edge environment
export async function executeAuthQuery(query: string, params: any[] = []) {
  try {
    const result = await client.unsafe(query, params);
    return result;
  } catch (error) {
    console.error('Edge auth query error:', error);
    throw error;
  }
}

// Helper function to set RLS context in edge environment
export async function setEdgeRLSContext(userId?: string, anonymousSessionId?: string) {
  try {
    if (userId) {
      await client.unsafe(
        `SELECT set_config('request.jwt.claims', $1, true)`,
        [JSON.stringify({ sub: userId, role: 'authenticated' })]
      );
    } else if (anonymousSessionId) {
      await client.unsafe(
        `SELECT set_config('app.anonymous_session_id', $1, true)`,
        [anonymousSessionId]
      );
    }
  } catch (error) {
    console.error('Error setting edge RLS context:', error);
    // Don't throw - let queries proceed without RLS context
  }
}

// Clean up connection (for graceful shutdown)
export async function closeEdgeConnection() {
  try {
    await client.end();
  } catch (error) {
    console.error('Error closing edge connection:', error);
  }
}
