// ===========================================================================
// TRIGGERR CORE PACKAGE - NAMESPACE PATTERN EXPORTS
//
// This file implements the namespace pattern for clean barrel exports while
// maintaining backward compatibility with existing flat exports.
//
// NEW RECOMMENDED USAGE (Namespace Pattern):
// import { Database, Auth, Utils, Schema } from '@triggerr/core';
//
// const users = await Database.db.select().from(Schema.userSchema);
// const context = Auth.getAuthContext();
// const id = Utils.generateId('user');
//
// LEGACY USAGE (Backward Compatibility):
// import { db, getAuthContext, generateId } from '@triggerr/core';
// ===========================================================================

// === IMPORT ALL EXISTING MODULES ===
import * as DatabaseModule from "./database";
import * as AuthModule from "./auth";
import * as UtilsModule from "./utils";
import * as TypesModule from "./types";
import * as LoggingModule from "./logging";

// === NAMESPACE EXPORTS (RECOMMENDED) ===

/**
 * Database namespace - provides database clients, schema, and query utilities
 */
export const Database = {
  // Database clients
  db: DatabaseModule.db,
  edgeDb: DatabaseModule.edgeDb,

  // Query utilities
  eq: DatabaseModule.eq,
  and: DatabaseModule.and,
  or: DatabaseModule.or,
  not: DatabaseModule.not,
  isNull: DatabaseModule.isNull,
  isNotNull: DatabaseModule.isNotNull,
  inArray: DatabaseModule.inArray,
  notInArray: DatabaseModule.notInArray,
  sql: DatabaseModule.sql,
  desc: DatabaseModule.desc,
  asc: DatabaseModule.asc,
} as const;

/**
 * Schema namespace - provides all database table schemas
 */
export const Schema = {
  // User Domain Schemas
  userSchema: DatabaseModule.user,
  sessionSchema: DatabaseModule.session,
  userWalletsSchema: DatabaseModule.userWallets,

  // Insurance Domain Schemas
  policySchema: DatabaseModule.policy,
  quoteSchema: DatabaseModule.quote,
  escrowSchema: DatabaseModule.escrow,

  // System Domain Schemas
  auditLogSchema: DatabaseModule.auditLog,

  // Export all other schemas
  ...DatabaseModule,
} as const;

/**
 * Auth namespace - provides authentication and authorization utilities
 */
export const Auth = {
  // Core auth instance
  auth: AuthModule.auth,

  // Auth context management
  getAuthContext: AuthModule.getAuthContext,
  requireAuth: AuthModule.requireAuth,
  setRLSContext: AuthModule.setRLSContext,
  withAuthContext: AuthModule.withAuthContext,
  withAuth: AuthModule.withAuth,

  // Anonymous session management
  getAnonymousSessionId: AuthModule.getAnonymousSessionId,
  createAnonymousSessionId: AuthModule.createAnonymousSessionId,
  isValidAnonymousSessionId: AuthModule.isValidAnonymousSessionId,
  migrateAnonymousDataToUser: AuthModule.migrateAnonymousDataToUser,
} as const;

/**
 * Utils namespace - provides utility functions and helpers
 */
export const Utils = {
  ...UtilsModule,
} as const;

/**
 * Types namespace - provides common type definitions
 */
export const Types = {
  ...TypesModule,
} as const;

/**
 * Logging namespace - provides logging utilities
 */
export const Logging = {
  ...LoggingModule,
} as const;

// === FLAT EXPORTS (BACKWARD COMPATIBILITY) ===

// Database layer exports
export const db = DatabaseModule.db;
export const edgeDb = DatabaseModule.edgeDb;
export type { Database as DatabaseType } from "./database";

// Auth layer exports
export const {
  auth,
  getAuthContext,
  requireAuth,
  getAnonymousSessionId,
  setRLSContext,
  withAuthContext,
  withAuth,
  createAnonymousSessionId,
  isValidAnonymousSessionId,
  migrateAnonymousDataToUser,
} = AuthModule;

export type { User, Session, AuthContext } from "./auth";

// Utils layer exports
export const {
  generateId,
  generateUserEscrowId,
  generatePolicyEscrowId,
  CacheManager,
} = UtilsModule;

// Schema exports (aliased for clarity)
export const {
  user: userSchema,
  session: sessionSchema,
  userWallets: userWalletsSchema,
  policy: policySchema,
  quote: quoteSchema,
  escrow: escrowSchema,
  auditLog: auditLogSchema,
} = DatabaseModule;

// Drizzle query utilities
export const {
  eq,
  and,
  or,
  not,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  sql,
  desc,
  asc,
} = DatabaseModule;

// Types and logging exports
export * from "./types";
export * from "./logging";

// Escrow utilities types
export type { EscrowPurpose } from "./utils/escrow-id-generator";

// === CONVENIENCE RE-EXPORTS ===

/**
 * All namespaces combined for convenience
 */
export const Core = {
  Database,
  Schema,
  Auth,
  Utils,
  Types,
  Logging,
} as const;

// === TYPE EXPORTS ===
export type CoreNamespaces = typeof Core;
export type DatabaseNamespace = typeof Database;
export type SchemaNamespace = typeof Schema;
export type AuthNamespace = typeof Auth;
export type UtilsNamespace = typeof Utils;
export type TypesNamespace = typeof Types;
export type LoggingNamespace = typeof Logging;

// === PACKAGE METADATA ===
export const CORE_PACKAGE_VERSION = "0.1.0";
export const CORE_PACKAGE_NAME = "@triggerr/core";
