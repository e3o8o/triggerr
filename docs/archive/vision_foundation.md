We are working on this:

We have done comprehensive work planning to conclude our work on foundation so we can code. Here is a detailed plan from our previous conversation:

🎯 **PLANNER MODE: COMPREHENSIVE FOUNDATION IMPLEMENTATION PLAN**

---

## **EXECUTIVE SUMMARY**

**Current State:**
- 36 tables seeded in Supabase with comprehensive reference data
- Canonical models implemented in database schema but missing TypeScript interfaces
- Empty shared packages infrastructure
- Missing 6 critical MVP tables for chat, wallets, and shopping cart functionality

**Target State:**
- Complete foundation ready for Phase 1 MVP development
- Type-safe shared packages with canonical model interfaces
- All MVP tables with RLS policies
- Better-Auth middleware protecting routes
- Anonymous session handling working

**Timeline:** 5-7 days foundation work before any API/service development

---

## **PHASE A: SHARED PACKAGES FOUNDATION**
**Priority: CRITICAL** | **Timeline: Day 1-2** | **Blockers: None**

### **A.1 Create Shared Package Infrastructure**

**Step A.1.1: Setup Package Structure**
```bash
# Create missing directories
mkdir -p packages/shared/types
mkdir -p packages/shared/src

# Files to create:
packages/shared/package.json
packages/shared/tsconfig.json
packages/shared/src/index.ts
```

**Step A.1.2: Create packages/shared/package.json**
```json
{
  "name": "@triggerr/shared",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./constants": "./dist/constants/index.js",
    "./validators": "./dist/validators/index.js",
    "./notifications": "./dist/notifications/index.js",
    "./types": "./dist/types/index.js"
  },
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist .turbo",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@triggerr/core": "workspace:*",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "eslint": "^8",
    "typescript": "^5",
    "rimraf": "^5.0.0"
  }
}
```

### **A.2 Create Type Definitions**

**Step A.2.1: packages/shared/types/canonical-models.ts**
```typescript
import type {
  historicalFlightSegments,
  historicalWeatherObservations
} from "@triggerr/core/database/schema";

// Canonical flight data types (derived from existing schema)
export type CanonicalFlightDataModel = typeof historicalFlightSegments.$inferInsert;
export type CanonicalFlightData = typeof historicalFlightSegments.$inferSelect;

// Canonical weather data types (derived from existing schema)
export type CanonicalWeatherObservationModel = typeof historicalWeatherObservations.$inferInsert;
export type CanonicalWeatherObservation = typeof historicalWeatherObservations.$inferSelect;

// Source contribution tracking for multi-API data
export interface SourceContribution {
  source: 'aviationstack' | 'flightaware' | 'opensky' | 'weatherapi' | 'openweather';
  fields: string[];
  timestamp: string;
  confidence: number;
  sourceId?: string;
  apiVersion?: string;
}

// Enhanced types with reference data joins
export interface FlightDataWithReferences extends CanonicalFlightData {
  airline?: { name: string; icaoCode: string; iataCode: string; };
  originAirport?: { name: string; iataCode: string; timezone: string; city: string; };
  destinationAirport?: { name: string; iataCode: string; timezone: string; city: string; };
}
```

**Step A.2.2: packages/shared/types/chat-types.ts**
```typescript
// Anonymous session management
export interface AnonymousSession {
  sessionId: string;
  cartItems: string[];
  conversationId?: string;
  expiresAt: Date;
  createdAt: Date;
}

// Chat message with UI components
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  uiElements?: Array<{
    type: 'quote_card' | 'flight_info' | 'loading';
    data: any;
  }>;
  metadata?: {
    toolCalls?: string[];
    responseTime?: number;
    model?: string;
  };
  createdAt: Date;
}
```

**Step A.2.3: packages/shared/types/index.ts**
```typescript
export * from './canonical-models';
export * from './chat-types';
export * from './api-types';
export * from './business-types';
```

### **A.3 Create Business Constants**

**Step A.3.1: packages/shared/constants/index.ts**
```typescript
// MVP Insurance Products (matching seed data)
export const INSURANCE_PRODUCTS = {
  FLIGHT_DELAY_60: 'PROD_IIDR001',
  FLIGHT_DELAY_120: 'PROD_IIDR002',
} as const;

// Providers (matching seed data)
export const PROVIDERS = {
  INSUREINNIE_DIRECT: 'PROV_IIDR001',
  PRETERAG_FINANCIAL: 'PROV_PRTF001',
  AEROASSURE_PARTNERS: 'PROV_AASP001',
} as const;

// Rate limits for anonymous vs authenticated users
export const RATE_LIMITS = {
  ANONYMOUS_QUOTE_REQUESTS: 10,
  AUTHENTICATED_QUOTE_REQUESTS: 100,
  POLICY_PURCHASES: 5,
} as const;

// PayGo wallet constants
export const PAYGO = {
  CENTS_PER_TOKEN: 100,
  MIN_ESCROW_AMOUNT: 50,
  FAUCET_AMOUNT: 10000,
} as const;

// Chat interface limits
export const CHAT = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_CONVERSATION_MESSAGES: 100,
  ANONYMOUS_SESSION_EXPIRE_HOURS: 24,
} as const;
```

### **A.4 Create Validation Schemas**

**Step A.4.1: packages/shared/validators/index.ts**
```typescript
import { z } from 'zod';

// Flight search input validation
export const FlightSearchInputSchema = z.object({
  flightNumber: z.string().optional(),
  origin: z.string().length(3).optional(),
  destination: z.string().length(3).optional(),
  date: z.string().datetime().optional(),
  naturalLanguageQuery: z.string().max(500).optional(),
}).refine(data =>
  data.flightNumber || (data.origin && data.destination) || data.naturalLanguageQuery,
  { message: "Must provide flight number, route, or natural language query" }
);

// Quote cart validation
export const AddToCartSchema = z.object({
  insuranceProductId: z.string(),
  flightContext: z.object({
    flightNumber: z.string(),
    origin: z.string(),
    destination: z.string(),
    departureDate: z.string().datetime(),
  }),
  quotedPremiumCents: z.number().positive(),
  quotedCoverageCents: z.number().positive(),
});

// Chat message validation
export const ChatMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  anonymousSessionId: z.string().optional(),
});

// Anonymous session validation
export const AnonymousSessionSchema = z.object({
  sessionId: z.string().uuid(),
  expiresAt: z.string().datetime(),
  cartItems: z.array(z.string()).default([]),
  conversationId: z.string().optional(),
});

export type FlightSearchInput = z.infer<typeof FlightSearchInputSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type AnonymousSession = z.infer<typeof AnonymousSessionSchema>;
```

### **A.5 Create Notification Templates**

**Step A.5.1: packages/shared/notifications/index.ts**
```typescript
export interface NotificationTemplate {
  subject: string;
  text: string;
  html: string;
}

export const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: 'Welcome to triggerr - Your Wallet is Ready!',
    text: 'Welcome! Your custodial PayGo wallet has been created and funded with test tokens.',
    html: '<h1>Welcome to triggerr!</h1><p>Your custodial PayGo wallet is ready...</p>',
  },

  POLICY_CONFIRMATION: {
    subject: 'Policy Confirmed - {{policyNumber}}',
    text: 'Your flight delay insurance policy {{policyNumber}} is now active.',
    html: '<h1>Policy Confirmed</h1><p>Policy {{policyNumber}} is active...</p>',
  },

  PAYOUT_PROCESSED: {
    subject: 'Payout Processed - {{amount}}',
    text: 'Great news! Your payout of {{amount}} has been sent to your wallet.',
    html: '<h1>Payout Processed!</h1><p>{{amount}} has been sent to your wallet...</p>',
  },
} as const;

export type EmailTemplateKey = keyof typeof EMAIL_TEMPLATES;
```

### **A.6 Build and Test Shared Package**

```bash
# Build shared package
bun install
bun run build --filter=@triggerr/shared

# Test imports work
bun run typecheck --filter=@triggerr/shared
```

**Success Criteria for Phase A:**
- ✅ Shared package builds without errors
- ✅ All type exports work from other packages
- ✅ Canonical model types inferred from database schema
- ✅ Validation schemas compile with Zod

---

## **PHASE B: DATABASE SCHEMA UPDATES**
**Priority: CRITICAL** | **Timeline: Day 2-3** | **Dependencies: Phase A**

### **B.1 Add Missing Enums**

**Step B.1.1: Update packages/core/database/schema.ts (around line 80)**
```typescript
// Add missing enums for MVP functionality
export const conversationMessageRoleEnum = pgEnum("conversation_message_role", [
  "user", "assistant", "system"
]);

export const quoteCartItemStatusEnum = pgEnum("quote_cart_item_status", [
  "ACTIVE", "PURCHASED", "EXPIRED", "REMOVED"
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "STRIPE", "PAYGO_CUSTODIAL"
]);
```

### **B.2 Update Provider Category Enum**

**Step B.2.1: Replace existing providerCategoryEnum**
```typescript
// UPDATE existing enum to match vision
export const providerCategoryEnum = pgEnum("provider_category", [
  "FIRST_PARTY_INSURER",     // triggerr Direct
  "THIRD_PARTY_INSURER",     // AeroAssure Partners
  "B2B_FINANCIAL_SERVICES",  // Preterag Financial Solutions
  "OTA_PROVIDER",            // FlightHub Connect (Phase 3)
]);
```

### **B.3 Add New MVP Tables**

**Step B.3.1: Add userWallets table (after user table ~line 280)**
```typescript
export const userWallets = pgTable("user_wallets", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }).unique(),
  paygoAddress: text("paygo_address").notNull().unique(),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  kmsKeyId: text("kms_key_id").notNull(),
  walletName: text("wallet_name").notNull().default("My triggerr Wallet"),
  isPrimary: boolean("is_primary").notNull().default(true),
  keyExportedAt: timestamp("key_exported_at"),
  lastBalanceCheck: timestamp("last_balance_check"),
  cachedBalanceAmount: text("cached_balance_amount").notNull().default("0"),
  balanceCurrency: text("balance_currency").notNull().default("PAYGO_TOKEN"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

**Step B.3.2: Add userPaymentMethods table**
```typescript
export const userPaymentMethods = pgTable("user_payment_methods", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  paymentProvider: paymentProviderEnum("payment_provider").notNull(),
  providerCustomerId: text("provider_customer_id"),
  providerMethodId: text("provider_method_id").notNull().unique(),
  methodType: text("method_type"),
  details: jsonb("details"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

**Step B.3.3: Add conversations table**
```typescript
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  anonymousSessionId: text("anonymous_session_id").unique(),
  title: text("title"),
  initialSearchQuery: text("initial_search_query"),
  currentFlightContext: jsonb("current_flight_context"),
  currentInsurancePreferences: jsonb("current_insurance_preferences"),
  currentOtaContext: jsonb("current_ota_context"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("conversations_user_idx").on(table.userId),
  index("conversations_anon_session_idx").on(table.anonymousSessionId),
]);
```

**Step B.3.4: Add conversationMessages table**
```typescript
export const conversationMessages = pgTable("conversation_messages", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: conversationMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  uiElements: jsonb("ui_elements"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("conversation_messages_conversation_idx").on(table.conversationId),
  index("conversation_messages_created_idx").on(table.createdAt),
]);
```

**Step B.3.5: Add quoteCartItems table**
```typescript
export const quoteCartItems = pgTable("quote_cart_items", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  anonymousSessionId: text("anonymous_session_id"),
  insuranceProductId: text("insurance_product_id").notNull(),
  flightContextSnapshot: jsonb("flight_context_snapshot").notNull(),
  quotedPremiumCents: integer("quoted_premium_cents").notNull(),
  quotedCoverageCents: integer("quoted_coverage_cents").notNull(),
  quoteDetails: jsonb("quote_details").notNull(),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  status: quoteCartItemStatusEnum("status").notNull().default("ACTIVE"),
}, (table) => [
  index("quote_cart_user_idx").on(table.userId),
  index("quote_cart_anon_session_idx").on(table.anonymousSessionId),
  unique("quote_cart_user_product_unique").on(table.userId, table.insuranceProductId, table.flightContextSnapshot).where(sql`${table.userId} IS NOT NULL`),
  unique("quote_cart_anon_product_unique").on(table.anonymousSessionId, table.insuranceProductId, table.flightContextSnapshot).where(sql`${table.anonymousSessionId} IS NOT NULL`),
]);
```

**Step B.3.6: Add apiLogs table**
```typescript
export const apiLogs = pgTable("api_logs", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().default(sql`generate_ulid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  userId: text("user_id").references(() => user.id),
  apiKeyId: text("api_key_id").references(() => apiKey.id),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  requestPayloadHash: text("request_payload_hash"),
  responsePayloadHash: text("response_payload_hash"),
  errorMessage: text("error_message"),
}, (table) => [
  index("api_logs_timestamp_idx").on(table.timestamp),
  index("api_logs_user_idx").on(table.userId),
  index("api_logs_endpoint_idx").on(table.endpoint),
]);
```

### **B.4 Update User Table**

**Step B.4.1: Remove wallet fields from user table**
```typescript
// REMOVE walletAddress and walletPrivateKey from user table
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  // REMOVE: walletAddress: text("wallet_address").unique(),
  // REMOVE: walletPrivateKey: text("wallet_private_key"),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### **B.5 Add Relations for New Tables**

**Step B.5.1: Add at end of schema.ts**
```typescript
export const userWalletsRelations = relations(userWallets, ({ one }) => ({
  user: one(user, { fields: [userWallets.userId], references: [user.id] }),
}));

export const userPaymentMethodsRelations = relations(userPaymentMethods, ({ one }) => ({
  user: one(user, { fields: [userPaymentMethods.userId], references: [user.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(user, { fields: [conversations.userId], references: [user.id] }),
  messages: many(conversationMessages),
}));

export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  conversation: one(conversations, { fields: [conversationMessages.conversationId], references: [conversations.id] }),
}));

export const quoteCartItemsRelations = relations(quoteCartItems, ({ one }) => ({
  user: one(user, { fields: [quoteCartItems.userId], references: [user.id] }),
}));

export const apiLogsRelations = relations(apiLogs, ({ one }) => ({
  user: one(user, { fields: [apiLogs.userId], references: [user.id] }),
  apiKey: one(apiKey, { fields: [apiLogs.apiKeyId], references: [apiKey.id] }),
}));
```

### **B.6 Generate and Run Migration**

```bash
# Generate migration
bun run db:generate

# Review migration files before applying
# Check migration files in drizzle/ directory

# Apply migration
bun run db:migrate
```

**Success Criteria for Phase B:**
- ✅ Migration runs successfully
- ✅ All 6 new tables created (total: 42 tables)
- ✅ No foreign key constraint errors
- ✅ Enum updates applied correctly

---

## **PHASE C: DATA MIGRATION & PROVIDER UPDATES**
**Priority: HIGH** | **Timeline: Day 3** | **Dependencies: Phase B**

### **C.1 Migrate Existing Wallet Data**

**Step C.1.1: Create migration script**
```sql
-- Migrate existing wallet data from user table to user_wallets table
INSERT INTO user_wallets (user_id, paygo_address, encrypted_private_key, kms_key_id, wallet_name)
SELECT
  id as user_id,
  wallet_address as paygo_address,
  wallet_private_key as encrypted_private_key,
  'migration-placeholder-kms-id' as kms_key_id,
  'Migrated Wallet' as wallet_name
FROM "user"
WHERE wallet_address IS NOT NULL AND wallet_private_key IS NOT NULL;
```

### **C.2 Update Provider Categories**

**Step C.2.1: Update existing provider data**
```sql
-- Update provider categories to match vision
UPDATE provider SET category = 'FIRST_PARTY_INSURER' WHERE id = 'PROV_IIDR001';
UPDATE provider SET category = 'B2B_FINANCIAL_SERVICES' WHERE id = 'PROV_PRTF001';
UPDATE provider SET category = 'THIRD_PARTY_INSURER' WHERE id = 'PROV_AASP001';
```

### **C.3 Add System Configuration**

**Step C.3.1: Update seed script for system config**
```typescript
// Add to packages/core/database/seed.ts
const systemConfigurationData = [
  {
    key: "PLATFORM_PAYGO_WALLET_ADDRESS",
    value: process.env.PLATFORM_PAYGO_WALLET_ADDRESS || "placeholder_platform_wallet"
  },
  {
    key: "PLATFORM_PAYGO_PRIVATE_KEY_KMS_ID",
    value: process.env.PLATFORM_PAYGO_KMS_KEY_ID || "placeholder_kms_key"
  },
  {
    key: "FAUCET_ENABLED",
    value: "true"
  },
  {
    key: "FAUCET_AMOUNT_CENTS",
    value: "1000000" // $10,000 in cents for testing
  }
];
```

**Success Criteria for Phase C:**
- ✅ Existing wallet data migrated successfully
- ✅ All 3 providers have correct categories
- ✅ System configuration seeded
- ✅ No data loss during migration

---

## **PHASE D: ROW LEVEL SECURITY (RLS) POLICIES**
**Priority: HIGH** | **Timeline: Day 4** | **Dependencies: Phase C**

### **D.1 Enable RLS on New Tables**

```sql
-- Enable RLS on all new tables
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
```

### **D.2 Create RLS Policies**

**Step D.2.1: User wallet policies**
```sql
-- Users can only access their own wallets
CREATE POLICY "Users can access their own wallets"
ON user_wallets FOR ALL
USING (auth.uid() = user_id);

-- Service role can access all wallets for operations
CREATE POLICY "Service role can access all wallets"
ON user_wallets FOR ALL
USING (auth.role() = 'service_role');
```

**Step D.2.2: Conversation policies**
```sql
-- Users can access their own conversations or anonymous sessions
CREATE POLICY "Users can access their own conversations"
ON conversations FOR ALL
USING (
  auth.uid() = user_id OR
  anonymous_session_id = current_setting('app.anonymous_session_id', true)
);

-- Messages follow conversation access
CREATE POLICY "Users can access messages from their conversations"
ON conversation_messages FOR ALL
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE auth.uid() = user_id OR
          anonymous_session_id = current_setting('app.anonymous_session_id', true)
  )
);
```

**Step D.2.3: Quote cart policies**
```sql
-- Users can access their own cart items or anonymous carts
CREATE POLICY "Users can manage their own quote cart items"
ON quote_cart_items FOR ALL
USING (
  auth.uid() = user_id OR
  anonymous_session_id = current_setting('app.anonymous_session_id', true)
);
```

**Step D.2.4: Payment method policies**
```sql
-- Users can only access their own payment methods
CREATE POLICY "Users can manage their own payment methods"
ON user_payment_methods FOR ALL
USING (auth.uid() = user_id);
```

**Step D.2.5: API logs policies**
```sql
-- Users can view their own API logs, admins see all
CREATE POLICY "Users can view their own API logs"
ON api_logs FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert/update all logs
CREATE POLICY "Service role can manage API logs"
ON api_logs FOR ALL
USING (auth.role() = 'service_role');
```

### **D.3 Test RLS Policies**

```sql
-- Test authenticated user access
SET ROLE authenticated;
SET request.jwt.claims '{"sub": "test-user-id"}';
SELECT * FROM user_wallets; -- Should only return user's wallets

-- Test anonymous access with session
SET request.app.anonymous_session_id 'test-session-123';
SELECT * FROM conversations WHERE anonymous_session_id = 'test-session-123';

-- Test service role access
SET ROLE service_role;
SELECT * FROM user_wallets; -- Should return all wallets
```

**Success Criteria for Phase D:**
- ✅ RLS enabled on all new tables
- ✅ Authenticated users can only access their own data
- ✅ Anonymous sessions work with session ID setting
- ✅ Service role can access all data for operations
- ✅ No unauthorized access possible

---

## **PHASE E: BETTER-AUTH MIDDLEWARE SETUP**
**Priority: HIGH** | **Timeline: Day 4-5** | **Dependencies: Phase D**

### **E.1 Create Better-Auth Middleware**

**Step E.1.1: Create apps/web/middleware.ts**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/v1/chat') ||
    pathname.startsWith('/api/v1/quotes') ||
    pathname.startsWith('/api/v1/products') ||
    pathname.startsWith('/api/v1/policies/track') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Protect authenticated routes
  if (pathname.startsWith('/api/v1/user/') || pathname.startsWith('/dashboard')) {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      if (pathname.startsWith('/api/')) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
    }

    // Set user context for RLS
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.user.id);
    return response;
  }

  // Handle anonymous session for chat/quotes
  if (pathname.startsWith('/api/v1/chat') || pathname.startsWith('/api/v1/quotes')) {
    const anonymousSessionId = request.headers.get('x-anonymous-session-id');
    if (anonymousSessionId) {
      const response = NextResponse.next();
      response.headers.set('x-anonymous-session-id', anonymousSessionId);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/v1/:path*',
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### **E.2 Create Auth Utilities**

**Step E.2.1: Create packages/core/auth/middleware.ts**
```typescript
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getAuthContext() {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    return {
      user: session?.user || null,
      isAuthenticated: !!session,
    };
  } catch {
    return {
      user: null,
      isAuthenticated: false,
    };
  }
}

export async function requireAuth() {
  const context = await getAuthContext();
  if (!context.isAuthenticated) {
    throw new Error('Authentication required');
  }
  return context;
}

export function getAnonymousSessionId() {
  const headersList = headers();
  return headersList.get('x-anonymous-session-id') || null;
}

export async function setRLSContext(userId?: string, anonymousSessionId?: string) {
  // This would integrate with your database connection
  // to set the RLS context for queries
  if (userId) {
    // Set auth.uid() for RLS
  }
  if (anonymousSessionId) {
    // Set app.anonymous_session_id for RLS
  }
}
```

### **E.3 Update API Route Structure**
Step E.3.1: Create API route template structure**
```typescript
// Template for protected API routes
// apps/web/app/api/v1/user/[endpoint]/route.ts
import { NextRequest } from "next/server";
import { requireAuth } from "@triggerr/core/auth/middleware";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    // Require authentication for user routes
    const { user } = await requireAuth();

    // Your business logic here
    const result = await someService.getData(user.id);

    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: error.message === 'Authentication required' ? 401 : 500 }
    );
  }
}
```

**Step E.3.2: Create anonymous route template**
```typescript
// Template for anonymous-friendly API routes
// apps/web/app/api/v1/chat/message/route.ts
import { NextRequest } from "next/server";
import { getAuthContext, getAnonymousSessionId } from "@triggerr/core/auth/middleware";
import { ChatMessageSchema } from "@triggerr/shared/validators";

export async function POST(request: NextRequest) {
  try {
    // Get auth context (may be null for anonymous users)
    const { user, isAuthenticated } = await getAuthContext();
    const anonymousSessionId = getAnonymousSessionId();

    // Validate request body
    const body = await request.json();
    const validatedData = ChatMessageSchema.parse(body);

    // Pass both user and anonymous session to service
    const result = await conversationService.processMessage({
      ...validatedData,
      userId: user?.id,
      anonymousSessionId,
    });

    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

### **E.4 Test Middleware Integration**

**Step E.4.1: Create test endpoints**
```bash
# Create test routes to verify middleware
mkdir -p apps/web/app/api/v1/test
```

**Step E.4.2: Protected route test**
```typescript
// apps/web/app/api/v1/test/protected/route.ts
import { requireAuth } from "@triggerr/core/auth/middleware";

export async function GET() {
  try {
    const { user } = await requireAuth();
    return Response.json({
      message: "Access granted",
      userId: user.id,
      userEmail: user.email
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }
}
```

**Step E.4.3: Anonymous route test**
```typescript
// apps/web/app/api/v1/test/anonymous/route.ts
import { getAuthContext, getAnonymousSessionId } from "@triggerr/core/auth/middleware";

export async function GET() {
  const { user, isAuthenticated } = await getAuthContext();
  const anonymousSessionId = getAnonymousSessionId();

  return Response.json({
    isAuthenticated,
    userId: user?.id || null,
    anonymousSessionId,
    message: "Anonymous access working"
  });
}
```

**Success Criteria for Phase E:**
- ✅ Middleware protects `/api/v1/user/*` routes
- ✅ Anonymous access works for chat/quote routes
- ✅ Authentication context passed to API routes
- ✅ RLS context properly set for database queries
- ✅ Test endpoints return expected responses

---

## **PHASE F: ANONYMOUS SESSION HANDLING**
**Priority: MEDIUM** | **Timeline: Day 5** | **Dependencies: Phase E**

### **F.1 Client-Side Session Management**

**Step F.1.1: Create anonymous session utility**
```typescript
// apps/web/src/lib/anonymous-session.ts
import { AnonymousSession } from "@triggerr/shared/types";
import { CHAT } from "@triggerr/shared/constants";

const STORAGE_KEY = 'triggerr_anonymous_session';

export class AnonymousSessionManager {
  private session: AnonymousSession | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored) as AnonymousSession;

        // Check if session is expired
        if (new Date(session.expiresAt) > new Date()) {
          this.session = session;
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.warn('Failed to load anonymous session:', error);
      this.clearSession();
    }
  }

  getOrCreateSession(): AnonymousSession {
    if (!this.session) {
      this.session = {
        sessionId: crypto.randomUUID(),
        cartItems: [],
        expiresAt: new Date(Date.now() + CHAT.ANONYMOUS_SESSION_EXPIRE_HOURS * 60 * 60 * 1000),
        createdAt: new Date(),
      };
      this.saveSession();
    }
    return this.session;
  }

  updateSession(updates: Partial<AnonymousSession>): void {
    if (this.session) {
      this.session = { ...this.session, ...updates };
      this.saveSession();
    }
  }

  addToCart(itemId: string): void {
    const session = this.getOrCreateSession();
    if (!session.cartItems.includes(itemId)) {
      session.cartItems.push(itemId);
      this.saveSession();
    }
  }

  removeFromCart(itemId: string): void {
    if (this.session) {
      this.session.cartItems = this.session.cartItems.filter(id => id !== itemId);
      this.saveSession();
    }
  }

  private saveSession(): void {
    if (typeof window === 'undefined' || !this.session) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
    } catch (error) {
      console.warn('Failed to save anonymous session:', error);
    }
  }

  clearSession(): void {
    this.session = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  getSessionId(): string | null {
    return this.session?.sessionId || null;
  }
}

// Global instance
export const anonymousSessionManager = new AnonymousSessionManager();
```

### **F.2 API Client Integration**

**Step F.2.1: Create API client with session handling**
```typescript
// apps/web/src/lib/api-client.ts
import { anonymousSessionManager } from './anonymous-session';

class ApiClient {
  private baseUrl = '/api/v1';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Add anonymous session header if available
    const headers = new Headers(options.headers);
    const sessionId = anonymousSessionManager.getSessionId();
    if (sessionId) {
      headers.set('x-anonymous-session-id', sessionId);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Chat API
  async sendChatMessage(content: string, conversationId?: string) {
    const session = anonymousSessionManager.getOrCreateSession();

    return this.request('/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        conversationId: conversationId || session.conversationId,
        anonymousSessionId: session.sessionId,
      }),
    });
  }

  // Quote cart API
  async addToQuoteCart(quoteData: any) {
    return this.request('/quotes/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData),
    });
  }

  // Anonymous policy tracking
  async trackPolicy(verificationCode: string) {
    return this.request(`/policies/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationCode }),
    });
  }
}

export const apiClient = new ApiClient();
```

### **F.3 Migration to Authenticated State**

**Step F.3.1: Create migration utility**
```typescript
// apps/web/src/lib/migrate-anonymous-data.ts
import { apiClient } from './api-client';
import { anonymousSessionManager } from './anonymous-session';

export async function migrateAnonymousDataToUser(): Promise<void> {
  const session = anonymousSessionManager.getOrCreateSession();

  try {
    // Sync conversation if exists
    if (session.conversationId) {
      await apiClient.request('/user/conversations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymousSessionId: session.sessionId,
          conversationId: session.conversationId,
        }),
      });
    }

    // Sync cart items if any
    if (session.cartItems.length > 0) {
      await apiClient.request('/user/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymousSessionId: session.sessionId,
          cartItemIds: session.cartItems,
        }),
      });
    }

    // Clear anonymous session after successful migration
    anonymousSessionManager.clearSession();

  } catch (error) {
    console.error('Failed to migrate anonymous data:', error);
    // Don't clear session if migration failed
  }
}
```

**Success Criteria for Phase F:**
- ✅ Anonymous sessions persist across browser sessions
- ✅ Session IDs passed correctly to API routes
- ✅ Cart items tracked in anonymous sessions
- ✅ Smooth migration to authenticated state
- ✅ Session expiration handled gracefully

---

## **PHASE G: DOCUMENTATION UPDATES**
**Priority: MEDIUM** | **Timeline: Day 6** | **Dependencies: Phases A-F**

### **G.1 Update Core PRDs**

**Step G.1.1: Update PRD-CORE-001-Database-Schema.md**
```markdown
# PRD-CORE-001: Database Schema & Data Models

**Status**: ✅ FOUNDATION COMPLETE - MVP Ready
**Priority**: Critical - Foundation Component
**Dependencies**: None
**Last Updated**: [Current Date]

## 1. Overview

### 1.1 Current Implementation Status
- ✅ **42 Tables Total**: Complete database with 6 new MVP tables added
- ✅ **Canonical Models**: Implemented via historicalFlightSegments and historicalWeatherObservations
- ✅ **RLS Policies**: Complete row-level security for anonymous and authenticated access
- ✅ **Better-Auth Integration**: Compatible user/session/account tables
- ✅ **MVP Tables**: user_wallets, conversations, quote_cart_items, etc.

### 1.2 New MVP Tables Added
1. **user_wallets** - Custodial PayGo wallet management with KMS encryption
2. **user_payment_methods** - Stripe payment method storage
3. **conversations** - Chat interface with anonymous session support
4. **conversation_messages** - Chat messages with UI elements
5. **quote_cart_items** - Shopping cart for insurance quotes
6. **api_logs** - Request/response logging for monitoring

### 1.3 Canonical Data Models
The canonical models are implemented as database tables:
- **CanonicalFlightDataModel**: `historicalFlightSegments` table
- **CanonicalWeatherObservationModel**: `historicalWeatherObservations` table

TypeScript interfaces available in `@triggerr/shared/types/canonical-models`
```

**Step G.1.2: Update PRD-BLOCKCHAIN-003-Wallet-Service.md**
```markdown
# PRD-BLOCKCHAIN-003: Custodial Wallet Service

**Status**: ✅ SCHEMA READY - Implementation Needed
**Priority**: Critical - MVP Core Component
**Dependencies**: PRD-CORE-001 (Database Schema) ✅ Complete

## 1. Overview

### 1.1 Custodial Model for MVP
The UserWalletService implements a **custodial wallet approach** where:
- ✅ **Private keys encrypted via KMS** and stored in `user_wallets.encrypted_private_key`
- ✅ **Users never see private keys** during MVP phase
- ✅ **Server-side signing** with ephemeral key decryption
- ✅ **One wallet per user** (enforced by unique constraint)

### 1.2 Database Schema (Implemented)
```sql
CREATE TABLE user_wallets (
  id TEXT PRIMARY KEY DEFAULT generate_ulid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  paygo_address TEXT NOT NULL UNIQUE,
  encrypted_private_key TEXT NOT NULL, -- KMS encrypted
  kms_key_id TEXT NOT NULL,
  wallet_name TEXT DEFAULT 'My triggerr Wallet',
  -- ... additional fields
);
```

### 1.3 Security Architecture
- **KMS Integration**: AWS KMS or similar for key encryption/decryption
- **Ephemeral Decryption**: Private keys decrypted in memory only for signing
- **No Key Exposure**: Private keys never returned to client
- **Audit Trail**: All operations logged in api_logs table

**Step G.1.3: Update PRD-API-001-Public-API-Specification.md**
```markdown
# PRD-API-001: Public API Specification

**Status**: ✅ FOUNDATION READY - Implementation Needed
**Priority**: High - Enables External Integrations

## 1. Overview

### 1.1 Anonymous Access Support
- ✅ **Quote generation** without authentication
- ✅ **Chat interface** with anonymous sessions
- ✅ **Policy tracking** via verification codes
- ✅ **Shopping cart** with anonymous session persistence

### 1.2 Authentication Patterns
- ✅ **Better-Auth middleware** protecting user routes
- ✅ **RLS context** set automatically from session
- ✅ **Anonymous session IDs** tracked via headers
- ✅ **Smooth migration** from anonymous to authenticated

### 1.3 New MVP Endpoints Added
```typescript
// Anonymous-friendly endpoints
POST /api/v1/chat/message
POST /api/v1/quotes/generate
GET  /api/v1/policies/track

// Authenticated user endpoints
GET  /api/v1/user/wallet/info
POST /api/v1/user/cart/add
GET  /api/v1/user/conversations
```

### **G.2 Update Project Documentation**

**Step G.2.1: Update PROJECT_CONTEXT.md**
```markdown
# triggerr Project Context Reference

## 🎯 Project Overview

### Current Implementation State: MVP Foundation Complete ✅

**Database Foundation:**
- ✅ 42 tables with comprehensive reference data
- ✅ 6 new MVP tables for chat, wallets, and shopping cart
- ✅ Row Level Security policies implemented
- ✅ Canonical data models operational

**Authentication Foundation:**
- ✅ Better-Auth middleware protecting routes
- ✅ Anonymous session handling working
- ✅ Smooth anonymous-to-authenticated migration

**Shared Package Foundation:**
- ✅ Type definitions for canonical models
- ✅ Validation schemas for all APIs
- ✅ Business constants and notification templates
- ✅ Cross-package type safety established

### Next Phase: MVP Development Ready 🚀
- Ready for API route implementation
- Ready for service layer development
- Ready for frontend chat interface
- Ready for custodial wallet integration
```

**Step G.2.2: Update MVP_todo.md**
```markdown
# triggerr MVP Implementation TODO

**Last Updated**: [Current Date]
**Status**: Foundation Complete ✅ → MVP Development Ready 🚀

## 🎯 Foundation Completion Summary

### ✅ FOUNDATION COMPLETE
- **✅ Database Schema**: 42 tables with 6 new MVP tables added
- **✅ Shared Packages**: Type-safe foundation with canonical models
- **✅ Better-Auth Integration**: Middleware and RLS policies working
- **✅ Anonymous Sessions**: Client-side session management implemented
- **✅ Provider Data**: Updated categories for triggerr Direct, Preterag, AeroAssure

### 🚀 READY FOR IMPLEMENTATION
**Next Priority Order:**
1. **Create core service implementations** (UserWalletService, ConversationService)
2. **Implement API route handlers** (chat, quotes, wallet operations)
3. **Build frontend chat interface** (three-panel layout with quote cart)
4. **Integrate PayGo custodial operations** (wallet creation, escrow management)
```

**Success Criteria for Phase G:**
- ✅ All PRDs reflect actual implementation state
- ✅ PROJECT_CONTEXT.md shows foundation complete
- ✅ MVP_todo.md updated with next development phases
- ✅ Documentation aligned with vision

---

## **PHASE H: FINAL VALIDATION & TESTING**
**Priority: HIGH** | **Timeline: Day 7** | **Dependencies: All Previous Phases**

### **H.1 Database Validation**

**Step H.1.1: Comprehensive table verification**
```sql
-- Verify all 42 tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return 42 tables including new MVP tables:
-- api_logs, conversation_messages, conversations, quote_cart_items, user_payment_methods, user_wallets
```

**Step H.1.2: RLS policy testing**
```sql
-- Test authenticated user access
SET ROLE authenticated;
SET request.jwt.claims '{"sub": "test-user-123"}';

-- Should only return data for test-user-123
SELECT user_id FROM user_wallets;
SELECT user_id FROM conversations WHERE user_id IS NOT NULL;

-- Test anonymous session access
SET request.app.anonymous_session_id 'test-session-456';
SELECT anonymous_session_id FROM conversations WHERE anonymous_session_id = 'test-session-456';
SELECT anonymous_session_id FROM quote_cart_items WHERE anonymous_session_id = 'test-session-456';
```

**Step H.1.3: Provider data verification**
```sql
-- Verify provider categories updated correctly
SELECT id, name, category FROM provider ORDER BY id;

-- Should show:
-- PROV_IIDR001 | triggerr Direct | FIRST_PARTY_INSURER
-- PROV_PRTF001 | Preterag Financial Solutions | B2B_FINANCIAL_SERVICES
-- PROV_AASP001 | AeroAssure Partners | THIRD_PARTY_INSURER
```

### **H.2 Shared Package Validation**

**Step H.2.1: Build verification**
```bash
# Build shared package and verify no errors
bun run build --filter=@triggerr/shared
bun run typecheck --filter=@triggerr/shared
```

**Step H.2.2: Type import testing**
```typescript
// Test canonical model types work
import { CanonicalFlightDataModel, CanonicalFlightData } from '@triggerr/shared/types';
import { FlightSearchInputSchema } from '@triggerr/shared/validators';
import { INSURANCE_PRODUCTS, PROVIDERS } from '@triggerr/shared/constants';

// Verify types compile
const flightData: CanonicalFlightData = {} as any;
const productId = INSURANCE_PRODUCTS.FLIGHT_DELAY_60;
const validation = FlightSearchInputSchema.parse({});
```

### **H.3 Better-Auth Middleware Testing**

**Step H.3.1: Create test requests**
```bash
# Test protected route without auth (should return 401)
curl -X GET http://localhost:3000/api/v1/user/wallet/info

# Test anonymous route with session header
curl -X GET http://localhost:3000/api/v1/test/anonymous \
  -H "x-anonymous-session-id: test-session-123"

# Test public routes work
curl -X GET http://localhost:3000/api/v1/products
```

**Step H.3.2: Integration verification**
```typescript
// Verify auth context works in API routes
import { getAuthContext, requireAuth } from '@triggerr/core/auth/middleware';

// Test in actual API route
const { user, isAuthenticated } = await getAuthContext();
console.log('Auth working:', { isAuthenticated, userId: user?.id });
```

### **H.4 Anonymous Session Testing**

**Step H.4.1: Client-side functionality**
```typescript
// Test session manager in browser console
import { anonymousSessionManager } from '@/lib/anonymous-session';

const session = anonymousSessionManager.getOrCreateSession();
console.log('Session created:', session.sessionId);

anonymousSessionManager.addToCart('test-item-1');
console.log('Cart items:', session.cartItems);
```

**Step H.4.2: Session persistence testing**
```javascript
// In browser: create session, refresh page, verify persistence
localStorage.getItem('triggerr_anonymous_session');
// Should contain valid session JSON
```

### **H.5 End-to-End Foundation Testing**

**Step H.5.1: Complete workflow test**
1. ✅ **Create anonymous session** → Session ID generated and stored
2. ✅ **Make anonymous API call** → Session header passed correctly
3. ✅ **Data stored with session ID** → RLS allows access via session
4. ✅ **Authenticate user** → Better-Auth creates session
5. ✅ **Migrate anonymous data** → Data transferred to user account
6. ✅ **Access protected route** → User data returned correctly

**Step H.5.2: Performance verification**
```bash
# Database query performance
EXPLAIN ANALYZE SELECT * FROM historicalFlightSegments
WHERE originAirportIataCode = 'LHR'
AND scheduledDepartureTimestampUTC > NOW() - INTERVAL '1 day';

# Should use indexes efficiently
```

**Success Criteria for Phase H:**
- ✅ All 42 tables present and accessible
- ✅ RLS policies working for all access patterns
- ✅ Shared packages build and type-check successfully
- ✅ Better-Auth middleware protecting routes correctly
- ✅ Anonymous sessions persisting and migrating properly
- ✅ End-to-end workflow functioning
- ✅ Performance acceptable for MVP loads

---

## **📊 FOUNDATION COMPLETION DASHBOARD**

### **Implementation Timeline: 7 Days**
```
Day 1-2: Shared Packages Foundation (Phase A)
Day 2-3: Database Schema Updates (Phase B)
Day 3:   Data Migration & Provider Updates (Phase C)
Day 4:   Row Level Security Policies (Phase D)
Day 4-5: Better-Auth Middleware Setup (Phase E)
Day 5:   Anonymous Session Handling (Phase F)
Day 6:   Documentation Updates (Phase G)
Day 7:   Final Validation & Testing (Phase H)
```

### **Success Metrics**
- ✅ **42 Database Tables** (36 existing + 6 new MVP tables)
- ✅ **Type-Safe Shared Packages** with canonical model interfaces
- ✅ **Complete RLS Security** for anonymous and authenticated access
- ✅ **Better-Auth Integration** with route protection
- ✅ **Anonymous Session Management** with smooth migration
- ✅ **Updated Documentation** aligned with implementation

### **Ready for Next Phase: MVP Development**
Once foundation is complete, you can confidently begin:
1. **Service Implementation** (UserWalletService, ConversationService)
2. **API Route Development** (chat, quotes, wallet operations)
3. **Frontend Chat Interface** (three-panel layout with quote cart)
4. **PayGo Integration** (custodial wallet operations)

**The foundation will be rock-solid and perfectly aligned with your vision.
