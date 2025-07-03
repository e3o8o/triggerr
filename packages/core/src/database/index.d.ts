import { Pool } from "pg";
import * as schema from "./schema";
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: Pool;
};
export type Database = typeof db;
export * from "./schema";
export { eq, and, or, not, isNull, isNotNull, inArray, notInArray, sql } from "drizzle-orm";
export { desc, asc } from "drizzle-orm";
//# sourceMappingURL=index.d.ts.map