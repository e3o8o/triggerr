import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  varchar,
  char,
  pgEnum,
  index,
  unique,
  serial,
  inet,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ===========================================================================
// ENUMS
// ===========================================================================

// ---------------------------------------------------------------------------
// GENERAL & COMMON ENUMS
// ---------------------------------------------------------------------------
export const continentEnum = pgEnum("continent_enum", [
  "AF",
  "AN",
  "AS",
  "EU",
  "NA",
  "OC",
  "SA",
]);

export const apiKeyTypeEnum = pgEnum("api_key_type", [
  "PUBLIC",
  "SECRET",
  "WEBHOOK",
]);

// ---------------------------------------------------------------------------
// PROVIDER & PRODUCT ENUMS
// ---------------------------------------------------------------------------
export const providerStatusEnum = pgEnum("provider_status", [
  "ACTIVE",
  "INACTIVE",
  "PENDING",
  "SUSPENDED",
]);
export const providerCategoryEnum = pgEnum("provider_category", [
  "FIRST_PARTY_INSURER", // triggerr Direct
  "THIRD_PARTY_INSURER", // AeroAssure Partners
  "B2B_FINANCIAL_SERVICES", // parametrigger Financial Solutions
  "OTA_PROVIDER", // FlightHub Connect (Phase 3)
]);
export const providerTierEnum = pgEnum("provider_tier_enum", [
  "STARTUP", // For new or smaller providers, potentially with different terms
  "STANDARD", // Default tier
  "PREMIUM", // For established providers, perhaps with more features
  "ENTERPRISE", // For large scale partners
]);

export const productStatusEnum = pgEnum("product_status_enum", [
  "DRAFT", // Product is being created, not visible
  "PENDING_APPROVAL", // Product submitted for review
  "PUBLISHED", // Product is live and available
  "SUSPENDED", // Product temporarily unavailable
  "ARCHIVED", // Product no longer offered, kept for records
]);

export const productCategoryEnum = pgEnum("product_category_enum", [
  "FLIGHT_PARAMETRIC", // For parametric flight delay, cancellation insurance // MVP
  "TRAVEL_COMPREHENSIVE", // Broader travel insurance packages // Post-MVP
  "GADGET_INSURANCE", // e.g., for electronics during travel // Post-MVP
  "WEATHER_PARAMETRIC", // Parametric insurance based on weather events // Post-MVP
  "EVENT_CANCELLATION", // Insurance for event ticket cancellations // Post-MVP
  "SHIPPING_CARGO", // Insurance for shipping and cargo // Post-MVP
  "CUSTOM_PARAMETRIC", // For other types of parametric products // Post-MVP
  "GENERAL_INSURANCE", // A catch-all for other non-parametric products // Post-MVP
]);

export const beneficiaryTypeEnum = pgEnum("beneficiary_type_enum", [
  "PRIMARY",
  "CONTINGENT",
]);

export const endorsementTypeEnum = pgEnum("endorsement_type_enum", [
  "COVERAGE_ADJUSTMENT",
  "INFO_CORRECTION",
  "OTHER",
]);

// ---------------------------------------------------------------------------
// POLICY & COVERAGE ENUMS
// ---------------------------------------------------------------------------
export const policyEventTypeEnum = pgEnum("policy_event_type_enum", [
  "POLICY_CREATED", // Policy object initiated in the system
  "PREMIUM_CALCULATED", // Quote generated, premium determined
  "PAYMENT_PENDING", // Awaiting user payment for premium
  "PAYMENT_RECEIVED", // Premium payment confirmed
  "POLICY_ACTIVATED", // Policy is now active and in force
  "FLIGHT_MONITORING_ACTIVE", // System started monitoring the associated flight
  "FLIGHT_EVENT_DETECTED", // A relevant flight event occurred (e.g., delay, cancellation)
  "CLAIM_CONDITION_MET", // Conditions for a claim under the policy have been met
  "CLAIM_INITIATED", // A claim process has started (manually or automatically)
  "PAYOUT_PROCESSING", // Payout for a claim is being processed
  "PAYOUT_COMPLETED", // Payout successfully sent
  "PAYOUT_FAILED", // Payout attempt failed
  "POLICY_EXPIRED", // Policy coverage period has ended
  "POLICY_CANCELLED_USER", // Policy cancelled by the user
  "POLICY_CANCELLED_SYSTEM", // Policy cancelled by the system (e.g., non-payment, fraud)
  "POLICY_UPDATED", // General update to policy details
  "REFUND_PROCESSED", // A refund related to the policy was processed
]);

export const policyStatusEnum = pgEnum("policy_status", [
  "PENDING",
  "ACTIVE",
  "EXPIRED",
  "CLAIMED",
  "CANCELLED",
  "FAILED",
]);
export const coverageTypeEnum = pgEnum("coverage_type", [
  "DELAY_60",
  "DELAY_120",
  "CANCELLATION",
  "BAGGAGE",
  "COMPREHENSIVE", // For AeroAssure's product
  "CUSTOM", // For parametrigger's B2B/reinsurance product
]);

// ---------------------------------------------------------------------------
// FLIGHT ENUMS
// ---------------------------------------------------------------------------
export const flightStatusEnum = pgEnum("flight_status", [
  "SCHEDULED",
  "ACTIVE",
  "LANDED",
  "CANCELLED",
  "DIVERTED",
  "DELAYED",
]);

// ---------------------------------------------------------------------------
// ESCROW & PAYOUT ENUMS
// ---------------------------------------------------------------------------
export const escrowStatusEnum = pgEnum("escrow_status", [
  "PENDING",
  "FULFILLED",
  "RELEASED",
  "EXPIRED",
  "CANCELLED",
]);
export const payoutStatusEnum = pgEnum("payout_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
export const escrowModelEnum = pgEnum("escrow_model_type", [
  // Basic Models
  "SINGLE_SIDED", // User premium only in escrow
  "DUAL_SIDED", // User premium and provider coverage in separate escrows
  "COMBINED", // User premium and provider coverage in a single escrow
  "HYBRID_PARTIAL_COLLATERAL", // User premium + partial provider collateral in escrow

  // Pooled Models
  "COLLATERALIZED_PROVIDER_POOL", // Provider maintains a single, on-chain collateralized pool
  "BONDED_LIABILITY_POOL", // Collateralized pool with third-party audits
  "PEER_TO_PEER_POOL", // Users and investors pool funds
  "SUBSCRIPTION_BASED_POOL", // Users pay recurring fees to a central pool

  // Advanced & Innovative Models
  "DYNAMIC_RISK_POOL", // Pool collateral adjusted by AI based on real-time risk
  "PREDICTION_MARKET", // Policies become prediction markets
  "SYNTHETIC_DEFI_COVERAGE", // Uses DeFi protocols for synthetic assets/CDPs
  "NFT_POLICY", // Policy minted as a tradable NFT
  "DAO_GOVERNED_POOL", // P2P or Collateralized Pool governed by a DAO
  "MULTI_ORACLE_VERIFIED", // Multi-oracle verified payout system
]);

export const premiumReturnPolicyEnum = pgEnum("premium_return_policy", [
  "PROVIDER_KEEPS_PREMIUM", // Default: Provider keeps premium regardless of outcome
  "RETURN_TO_CUSTOMER", // Premium returned to customer on payout
]);

// ENUM for Escrow Type Discriminator
export const escrowTypeEnum = pgEnum("escrow_type_enum", [
  "POLICY", // For escrows related to insurance policies
  "USER_WALLET", // For escrows initiated by users for wallet functions
]);

// ENUM for Escrow Purpose (for user-initiated escrows)
// Based on EscrowPurpose type in escrow-id-generator.ts
export const escrowPurposeEnum = pgEnum("escrow_purpose_enum", [
  "DEPOSIT",
  "WITHDRAW",
  "STAKE",
  "BOND",
  "COLLATERAL",
  "INVESTMENT",
  "RESERVE", // Might also be used by provider-specific non-policy escrows if any
  "POOL", // For pool-related operations not tied to a specific policy's premium
  "CUSTOM",
]);

// ---------------------------------------------------------------------------
// FINANCIAL & REVENUE ENUMS
// ---------------------------------------------------------------------------
export const revenueTypeEnum = pgEnum("revenue_type_enum", [
  "PLATFORM_FEE", // Fee earned by the triggerr platform
  "PROVIDER_SHARE", // Share of premium distributed to the provider
  "TRANSACTION_FEE", // Fees for specific transactions (e.g., payout processing)
  "ADJUSTMENT", // For refunds, corrections, or other financial adjustments
  "PENALTY", // Fees or penalties incurred
  "BONUS", // Bonus payments
]);

// ---------------------------------------------------------------------------
// WEBHOOK & INTEGRATION ENUMS
// ---------------------------------------------------------------------------
// Note: For WebhookEventTypeEnum, actual event names must be highly specific
// to triggerr application's events.
export const webhookEventTypeEnum = pgEnum("webhook_event_type_enum", [
  "POLICY_CREATED",
  "POLICY_ACTIVATED",
  "POLICY_CANCELLED",
  "POLICY_EXPIRED",
  "PAYMENT_RECEIVED",
  "PAYOUT_INITIATED",
  "PAYOUT_COMPLETED",
  "PAYOUT_FAILED",
  "FLIGHT_DELAY_CONFIRMED",
  "FLIGHT_CANCELLED_CONFIRMED",
  // ... add other relevant events for ïnsureinnnie system
]);
export const webhookDeliveryStatusEnum = pgEnum(
  "webhook_delivery_status_enum",
  [
    "PENDING", // Webhook is queued for delivery
    "DELIVERED", // Webhook successfully delivered (e.g., 2xx response)
    "FAILED", // Webhook delivery failed after initial attempt (e.g., non-2xx response)
    "RETRYING", // Webhook delivery failed, will be retried
    "ABANDONED", // Webhook delivery failed after all retry attempts
  ],
);

// ---------------------------------------------------------------------------
// BACKGROUND TASK & SCHEDULING ENUMS
// ---------------------------------------------------------------------------
export const scheduledTaskStatusEnum = pgEnum("scheduled_task_status_enum", [
  "PENDING", // Task is scheduled and waiting for its next run time
  "ACTIVE", // Task is enabled and will run as per schedule
  "RUNNING", // An instance of this task is currently running (usually managed by a distributed lock or task runner state)
  "COMPLETED", // Task has completed its lifecycle (e.g., a one-time task that ran successfully)
  "FAILED", // The last attempt to run the task failed, may need attention
  "DISABLED", // Task is currently disabled and will not run
]);
export const taskExecutionStatusEnum = pgEnum("task_execution_status_enum", [
  "QUEUED", // Task execution is queued
  "RUNNING", // Task execution is currently in progress
  "COMPLETED", // Task execution finished successfully
  "FAILED", // Task execution failed
  "CANCELLED", // Task execution was cancelled
  "TIMED_OUT", // Task execution exceeded its timeout
]);

// MVP Chat Interface Enums
export const conversationMessageRoleEnum = pgEnum("conversation_message_role", [
  "user",
  "assistant",
  "system",
]);

export const quoteCartItemStatusEnum = pgEnum("quote_cart_item_status", [
  "PENDING",
  "PURCHASED",
  "EXPIRED",
  "REMOVED",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REJECTED",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "STRIPE",
  "PAYGO_CUSTODIAL",
]);

// ============================================================================
// CORE USER MANAGEMENT (Better-Auth Compatible)
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// API MANAGEMENT
// ============================================================================

export const apiKey = pgTable("api_key", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  providerId: text("provider_id").references(() => provider.id, {
    onDelete: "cascade",
  }),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  type: apiKeyTypeEnum("type").notNull(),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  rateLimit: integer("rate_limit").notNull().default(1000),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// PROVIDER MANAGEMENT (Marketplace Architecture)
// ============================================================================

export const provider = pgTable("provider", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: providerCategoryEnum("category").notNull(),
  status: providerStatusEnum("status").notNull().default("PENDING"),
  description: text("description"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  supportEmail: text("support_email"),
  walletAddress: text("wallet_address").notNull().unique(), // Encrypted
  walletPrivateKey: text("wallet_private_key"), // Encrypted
  apiEndpoint: text("api_endpoint"),
  webhookSecret: text("webhook_secret"), // Encrypted
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 })
    .notNull()
    .default("0.0500"), // 5%
  tier: providerTierEnum("tier").notNull().default("STANDARD"),
  businessAddress: text("business_address"),
  businessRegistrationNumber: text("business_registration_number"),
  payoutPreference: jsonb("payout_preference").$type<{
    schedule: string;
    minimumAmount?: number;
  }>(),
  preferredChain: text("preferred_chain").notNull().default("PAYGO"),
  linkedAirlineIcaoCode: char("linked_airline_icao_code", {
    length: 3,
  }).references(() => airline.icaoCode, { onDelete: "set null" }),

  // Escrow Model Configuration
  escrowModel: escrowModelEnum("escrow_model")
    .notNull()
    .default("SINGLE_SIDED"),
  premiumReturnPolicy: premiumReturnPolicyEnum("premium_return_policy")
    .notNull()
    .default("PROVIDER_KEEPS_PREMIUM"),
  collateralRequirement: decimal("collateral_requirement", {
    precision: 15,
    scale: 2,
  }).default("0.00"), // For models requiring collateral
  poolAddress: text("pool_address"), // For pooled models
  poolMinimumBalance: decimal("pool_minimum_balance", {
    precision: 15,
    scale: 2,
  }).default("0.00"),
  escrowConfiguration: jsonb("escrow_configuration"), // Model-specific configuration

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const providerProduct = pgTable("provider_product", {
  id: text("id").primaryKey(),
  providerId: text("provider_id")
    .notNull()
    .references(() => provider.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  coverageType: coverageTypeEnum("coverage_type").notNull(),
  baseRate: decimal("base_rate", { precision: 10, scale: 6 }).notNull(),
  maxCoverage: decimal("max_coverage", { precision: 15, scale: 2 }).notNull(),
  minCoverage: decimal("min_coverage", { precision: 15, scale: 2 }).notNull(),
  termsUrl: text("terms_url"),
  status: productStatusEnum("status").notNull().default("DRAFT"),
  productCategory: productCategoryEnum("product_category"),
  configuration: jsonb("configuration"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// REFERENCE DATA TABLES
// ============================================================================

export const countries = pgTable("countries", {
  isoCode: char("iso_code", { length: 2 }).primaryKey(), // From countries.dat (e.g., "AW")
  name: text("name").notNull(), // From countries.dat (e.g., "Aruba")
  isoAlpha3Code: char("iso_alpha3_code", { length: 3 }), // From countries.dat (e.g., "ABW")
  continent: continentEnum("continent"), // Optional: Can be enriched later
  // dafifCode: text("dafif_code"), // Optional: From OpenFlights countries.dat if needed
});

export const regions = pgTable("regions", {
  code: text("code").primaryKey(), // From OurAirports regions.csv (e.g., "US-CA")
  localCode: text("local_code"), // e.g., "CA"
  name: text("name").notNull(), // e.g., "California"
  continent: continentEnum("continent"), // From OurAirports regions.csv (e.g., "NA")
  countryIsoCode: char("country_iso_code", { length: 2 })
    .references(() => countries.isoCode)
    .notNull(),
  wikipediaLink: text("wikipedia_link"),
  keywords: text("keywords"),
});

export const aircraftTypes = pgTable("aircraft_types", {
  icaoCode: varchar("icao_code", { length: 4 }).primaryKey(), // From planes.dat (e.g., "B738")
  name: text("name").notNull(), // From planes.dat (e.g., "Boeing 737-800")
  iataCode: varchar("iata_code", { length: 3 }), // From planes.dat (e.g., "73H")
});

export const runways = pgTable("runways", {
  id: integer("id").primaryKey(), // From OurAirports runways.csv
  airportIataCode: char("airport_iata_code", { length: 3 })
    .references(() => airport.iataCode)
    .notNull(),
  // airportIdent: text("airport_ident"), // Alternative FK to airport's OurAirports ident if using that as PK
  lengthFt: integer("length_ft"),
  widthFt: integer("width_ft"),
  surface: text("surface"),
  lighted: boolean("lighted").default(false),
  closed: boolean("closed").default(false),
  leIdent: text("le_ident"), // Low-numbered end identifier (e.g., "09L")
  heIdent: text("he_ident"), // High-numbered end identifier (e.g., "27R")
  // Optional: Add more fields like le_latitude_deg, le_longitude_deg, he_elevation_ft, etc. from runways.csv
});

// ============================================================================
// FLIGHT DATA MANAGEMENT
// ============================================================================

export const airline = pgTable(
  "airline",
  {
    id: text("id").primaryKey(), // Or OpenFlights ID if preferred, ensure it's populated accordingly
    name: text("name").notNull(),
    alias: text("alias"),
    iataCode: char("iata_code", { length: 2 }),
    icaoCode: char("icao_code", { length: 3 }),
    callsign: text("callsign"),
    fleetSize: integer("fleet_size"),
    headquarters: text("headquarters"),
    countryIsoCode: char("country_iso_code", { length: 2 }).references(
      () => countries.isoCode,
    ),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("airline_iata_code_unique").on(table.iataCode),
    unique("airline_icao_code_unique").on(table.icaoCode),
    index("airline_iata_idx").on(table.iataCode),
    index("airline_icao_idx").on(table.icaoCode),
    index("airline_country_idx").on(table.countryIsoCode),
  ],
);

export const airport = pgTable(
  "airport",
  {
    iataCode: char("iata_code", { length: 3 }).primaryKey(),
    icaoCode: char("icao_code", { length: 4 }), // .unique() REMOVED
    name: text("name").notNull(),
    city: text("city"),
    stateOrProvince: text("state_or_province"),
    regionIsoCode: text("region_iso_code").references(() => regions.code),
    countryIsoCode: char("country_iso_code", { length: 2 })
      .references(() => countries.isoCode)
      .notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
    altitudeFt: integer("altitude_ft"),
    timezoneOlson: text("timezone_olson"),
    airportType: text("airport_type"),
    scheduledService: boolean("scheduled_service").default(false),
    wikipediaLink: text("wikipedia_link"),
    homeLink: text("home_link"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    unique("airport_icao_code_unique").on(table.icaoCode), // <--- ADDED table-level unique
    index("airport_icao_idx").on(table.icaoCode),
    index("airport_country_idx").on(table.countryIsoCode),
    index("airport_city_idx").on(table.city),
  ],
);

export const flight = pgTable(
  "flight",
  {
    id: text("id").primaryKey(),
    flightNumber: text("flight_number").notNull(),
    airlineIcaoCode: char("airline_icao_code", { length: 3 }).references(
      () => airline.icaoCode,
    ), // Prefer ICAO for airline ref if available & unique
    // airlineId: text("airline_id").references(() => airline.id), // Alternative if using airline.id as PK
    departureAirportIataCode: char("departure_airport_iata_code", { length: 3 })
      .notNull()
      .references(() => airport.iataCode),
    arrivalAirportIataCode: char("arrival_airport_iata_code", { length: 3 })
      .notNull()
      .references(() => airport.iataCode),
    departureScheduledAt: timestamp("departure_scheduled_at", {
      withTimezone: true,
    }).notNull(),
    arrivalScheduledAt: timestamp("arrival_scheduled_at", {
      withTimezone: true,
    }).notNull(),
    departureActualAt: timestamp("departure_actual_at", { withTimezone: true }),
    arrivalActualAt: timestamp("arrival_actual_at", { withTimezone: true }),
    status: flightStatusEnum("status").notNull().default("SCHEDULED"),
    aircraftIcaoCode: varchar("aircraft_icao_code", { length: 4 }).references(
      () => aircraftTypes.icaoCode,
    ),
    // aircraftType: text("aircraft_type"), // Deprecated in favor of aircraftIcaoCode
    gate: text("gate"),
    terminal: text("terminal"),
    delayMinutes: integer("delay_minutes").default(0),
    sourceData: jsonb("source_data"), // Stores latest aggregated snapshot for operational flight
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("flight_flight_number_idx").on(table.flightNumber),
    index("flight_departure_idx").on(table.departureScheduledAt),
    index("flight_status_idx").on(table.status),
    index("flight_airline_icao_idx").on(table.airlineIcaoCode),
    index("flight_dep_airport_iata_idx").on(table.departureAirportIataCode),
    index("flight_arr_airport_iata_idx").on(table.arrivalAirportIataCode),
    unique("unique_flight_schedule").on(
      table.flightNumber,
      table.departureScheduledAt,
      table.departureAirportIataCode,
      table.airlineIcaoCode,
    ),
  ],
);

// ============================================================================
// INSURANCE BUSINESS LOGIC
// ============================================================================

export const quote = pgTable(
  "quote",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    providerId: text("provider_id")
      .notNull()
      .references(() => provider.id),
    flightId: text("flight_id")
      .notNull()
      .references(() => flight.id),
    coverageType: coverageTypeEnum("coverage_type").notNull(),
    coverageAmount: decimal("coverage_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    premium: decimal("premium", { precision: 15, scale: 6 }).notNull(),
    riskFactors: jsonb("risk_factors"),
    confidence: decimal("confidence", { precision: 5, scale: 4 })
      .notNull()
      .default("0.8500"),
    status: quoteStatusEnum("status").notNull().default("PENDING"),
    validUntil: timestamp("valid_until").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("quote_user_idx").on(table.userId),
    index("quote_provider_idx").on(table.providerId),
    index("quote_flight_idx").on(table.flightId),
    index("quote_valid_until_idx").on(table.validUntil),
  ],
);

export const policy = pgTable(
  "policy",
  {
    id: text("id").primaryKey(),
    policyNumber: text("policy_number").notNull(), // .unique() REMOVED
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    anonymousSessionId: text("anonymous_session_id"),
    providerId: text("provider_id")
      .notNull()
      .references(() => provider.id),
    flightId: text("flight_id")
      .notNull()
      .references(() => flight.id),
    quoteId: text("quote_id").references(() => quote.id),
    coverageType: coverageTypeEnum("coverage_type").notNull(),
    coverageAmount: decimal("coverage_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    premium: decimal("premium", { precision: 15, scale: 6 }).notNull(),
    payoutAmount: decimal("payout_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    status: policyStatusEnum("status").notNull().default("PENDING"),
    chain: text("chain").notNull(),
    delayThreshold: integer("delay_threshold").notNull().default(60), // minutes
    terms: jsonb("terms"),
    metadata: jsonb("metadata"),
    activatedAt: timestamp("activated_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    unique("policy_policy_number_unique").on(table.policyNumber), // <--- ADDED table-level unique
    index("policy_user_idx").on(table.userId),
    index("policy_provider_idx").on(table.providerId),
    index("policy_flight_idx").on(table.flightId),
    index("policy_status_idx").on(table.status),
    index("policy_expires_idx").on(table.expiresAt),
    index("policy_number_idx").on(table.policyNumber),
    index("policy_anon_session_idx").on(table.anonymousSessionId),
    check(
      "policy_user_check",
      sql`(user_id IS NOT NULL) != (anonymous_session_id IS NOT NULL)`,
    ),
  ],
);

export const policyVerificationCode = pgTable(
  "policy_verification_code",
  {
    id: text("id").primaryKey(),
    policyId: text("policy_id")
      .notNull()
      .references(() => policy.id, { onDelete: "cascade" }),
    code: text("code").notNull(), // .unique() REMOVED (if not already)
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    unique("policy_verification_code_code_unique").on(table.code), // ENSURED table-level unique
    index("verification_code_idx").on(table.code),
    index("verification_policy_idx").on(table.policyId),
  ],
);

export const beneficiaries = pgTable(
  "beneficiaries",
  {
    id: text("id").primaryKey(),
    policyId: text("policy_id")
      .notNull()
      .references(() => policy.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    relationship: text("relationship"),
    percentage: integer("percentage").notNull(),
    type: beneficiaryTypeEnum("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("beneficiaries_policy_idx").on(table.policyId),
    index("beneficiaries_type_idx").on(table.type),
  ],
);

export const endorsements = pgTable(
  "endorsements",
  {
    id: text("id").primaryKey(),
    policyId: text("policy_id")
      .notNull()
      .references(() => policy.id, { onDelete: "cascade" }),
    type: endorsementTypeEnum("type").notNull(),
    description: text("description").notNull(),
    effectiveDate: timestamp("effective_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("endorsements_policy_idx").on(table.policyId),
    index("endorsements_type_idx").on(table.type),
    index("endorsements_effective_date_idx").on(table.effectiveDate),
  ],
);

export const policyEvent = pgTable(
  "policy_event",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`), // Or your preferred ID generation
    policyId: text("policy_id")
      .notNull()
      .references(() => policy.id, { onDelete: "cascade" }),
    type: policyEventTypeEnum("type").notNull(),
    data: jsonb("data"), // Flexible JSONB field for event-specific details
    // Examples for 'data' field:
    // For FLIGHT_EVENT_DETECTED: { flightStatus: 'DELAYED', delayMinutes: 75 }
    // For PAYOUT_COMPLETED: { payoutId: 'payout_xyz', amount: 100.00, currency: 'USD', txHash: '0xabc...' }
    // For POLICY_UPDATED: { oldValues: { ... }, newValues: { ... } }
    triggeredByActor: text("triggered_by_actor"), // e.g., 'USER:user_id_123', 'SYSTEM:FlightMonitor', 'PROVIDER:provider_id_456'
    notes: text("notes"), // Optional notes for the event
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- ENSURE returns an ARRAY
    index("policy_event_policy_idx").on(table.policyId),
    index("policy_event_type_idx").on(table.type),
    index("policy_event_created_at_idx").on(table.createdAt),
  ],
);

// ===========================================================================
// FINANCIAL TABLES
// ===========================================================================

export const revenue = pgTable(
  "revenue",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    policyId: text("policy_id").references(() => policy.id, {
      onDelete: "set null",
    }),
    providerId: text("provider_id").references(() => provider.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    escrowId: text("escrow_id").references(() => escrow.id, {
      onDelete: "set null",
    }),

    amount: decimal("amount", { precision: 15, scale: 6 }).notNull(),
    currency: char("currency", { length: 3 }).notNull().default("USD"),
    type: revenueTypeEnum("type").notNull(),
    description: text("description"),

    transactionDate: timestamp("transaction_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    referenceId: text("reference_id"), // External reference, e.g., payment gateway transaction ID

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- Using 'table' for consistency and returning an ARRAY
    index("revenue_policy_idx").on(table.policyId),
    index("revenue_provider_idx").on(table.providerId),
    index("revenue_user_idx").on(table.userId),
    index("revenue_escrow_idx").on(table.escrowId),
    index("revenue_type_idx").on(table.type),
    index("revenue_transaction_date_idx").on(table.transactionDate),
    unique("revenue_reference_id_unique")
      .on(table.referenceId)
      .nullsNotDistinct(),
  ],
);

export const revenueSharingRule = pgTable(
  "revenue_sharing_rule",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    ruleName: text("rule_name").notNull(),
    description: text("description"),

    providerId: text("provider_id").references(() => provider.id, {
      onDelete: "cascade",
    }),
    providerProductId: text("provider_product_id").references(
      () => providerProduct.id,
      { onDelete: "cascade" },
    ),

    platformFeePercentage: decimal("platform_fee_percentage", {
      precision: 7,
      scale: 6,
    })
      .notNull()
      .default("0.000000"),
    providerSharePercentage: decimal("provider_share_percentage", {
      precision: 7,
      scale: 6,
    })
      .notNull()
      .default("0.000000"),

    applicableFrom: timestamp("applicable_from", { withTimezone: true })
      .notNull()
      .defaultNow(),
    applicableTo: timestamp("applicable_to", { withTimezone: true }),

    isActive: boolean("is_active").notNull().default(true),
    priority: integer("priority").notNull().default(0),

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY (using 'table' for consistency)
    unique("rev_share_provider_prod_from_unique").on(
      table.providerId,
      table.providerProductId,
      table.applicableFrom,
    ),
    index("rev_share_active_idx").on(table.isActive),
    index("rev_share_priority_idx").on(table.priority),
  ],
);

// ===========================================================================
// WEBHOOK & INTEGRATION TABLES
// ===========================================================================

export const webhook = pgTable(
  "webhook",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }), // If user-configurable
    providerId: text("provider_id").references(() => provider.id, {
      onDelete: "cascade",
    }), // If provider-configurable
    targetUrl: text("target_url").notNull(),
    description: text("description"),
    // Using jsonb for events to store an array of webhookEventTypeEnum values
    // This requires application-level validation to ensure values match the enum
    subscribedEvents: jsonb("subscribed_events")
      .$type<string[]>() // Ideally, map to webhookEventTypeEnum values
      .notNull(),
    secret: text("secret"), // Encrypted by application; used for signing requests
    isActive: boolean("is_active").notNull().default(true),
    lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
    failureCount: integer("failure_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY (using 'table' for consistency)
    index("webhook_target_url_idx").on(table.targetUrl),
    index("webhook_user_idx").on(table.userId),
    index("webhook_provider_idx").on(table.providerId),
    index("webhook_active_idx").on(table.isActive),
  ],
);

export const webhookDelivery = pgTable(
  "webhook_delivery",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    webhookId: text("webhook_id")
      .notNull()
      .references(() => webhook.id, { onDelete: "cascade" }),
    eventId: text("event_id").notNull(), // Unique ID of the originating event (e.g., policyEvent.id)
    eventType: webhookEventTypeEnum("event_type").notNull(), // From our enum
    payload: jsonb("payload").notNull(), // The actual data sent in the webhook
    attemptCount: integer("attempt_count").notNull().default(0),
    status: webhookDeliveryStatusEnum("status").notNull().default("PENDING"),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }), // For retry scheduling
    responseStatusCode: integer("response_status_code"),
    responseBody: text("response_body"), // Store response from target for debugging
    durationMs: integer("duration_ms"), // How long the delivery attempt took
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY (using 'table' for consistency)
    index("webhook_delivery_webhook_idx").on(table.webhookId),
    index("webhook_delivery_status_idx").on(table.status),
    index("webhook_delivery_event_id_idx").on(table.eventId),
    index("webhook_delivery_next_attempt_idx").on(table.nextAttemptAt),
  ],
);

// ===========================================================================
// SYSTEM CONFIGURATION TABLE
// ===========================================================================

export const systemConfiguration = pgTable(
  "system_configuration",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    key: text("key").notNull(), // .unique() REMOVED
    value: text("value").notNull(), // Store as text, parse in application; use jsonb if complex structures are common
    // valueJson: jsonb("value_json"), // Alternative if you often store JSON and want DB validation
    description: text("description"),
    category: text("category").notNull().default("GENERAL"), // e.g., 'SECURITY', 'PAYMENTS', 'FEATURES', 'INTEGRATIONS'
    isEditableRuntime: boolean("is_editable_runtime").notNull().default(false), // Indicates if it can be changed without app restart/redeploy
    isSecret: boolean("is_secret").notNull().default(false), // If true, value should be encrypted by application // Encrypted
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    unique("system_configuration_key_unique").on(table.key), // ENSURED table-level unique
    index("system_configuration_category_idx").on(table.category),
  ],
);

// ===========================================================================
// CACHING & TASKING TABLES
// ===========================================================================

export const cacheEntry = pgTable(
  "cache_entry",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    cacheKey: text("cache_key").notNull(), // .unique() REMOVED
    value: jsonb("value").notNull(),
    tags: jsonb("tags").$type<string[]>(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    unique("cache_entry_key_unique").on(table.cacheKey), // ENSURED table-level unique
    index("cache_entry_expires_at_idx").on(table.expiresAt),
    // index("cache_entry_tags_idx").on(table.tags, { method: \'gin\' }), // Optional GIN index
  ],
);

export const scheduledTask = pgTable(
  "scheduled_task",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    taskName: text("task_name").notNull(), // .unique() REMOVED
    description: text("description"),
    taskType: text("task_type").notNull(), // Application-specific type, e.g., \"POLICY_EXPIRATION\", \"DATA_AGGREGATION\"

    // Scheduling
    cronExpression: text("cron_expression"), // e.g., \"0 2 * * *\" for 2 AM daily. Null if not cron-based (e.g., one-time or event-triggered)
    runAt: timestamp("run_at", { withTimezone: true }), // For specific one-time execution

    payload: jsonb("payload"), // Data/parameters the task needs to execute

    status: scheduledTaskStatusEnum("status").notNull().default("ACTIVE"),
    timezone: text("timezone").default("UTC"), // Timezone for cron expression interpretation

    // Tracking execution
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }), // Calculated next run time
    lastRunStatus: text("last_run_status"), // e.g., 'SUCCESS', 'FAILURE'
    lastRunDurationMs: integer("last_run_duration_ms"),

    maxRetries: integer("max_retries").notNull().default(3), // Max retries on failure
    retryDelaySeconds: integer("retry_delay_seconds").notNull().default(60), // Delay before retrying

    timeoutSeconds: integer("timeout_seconds").default(3600), // Max execution time before task is considered timed out

    isSingleton: boolean("is_singleton").notNull().default(true), // If true, only one instance of this task should run globally at any time

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    unique("scheduled_task_name_unique").on(table.taskName), // ENSURED table-level unique
    index("scheduled_task_status_idx").on(table.status),
    index("scheduled_task_next_run_at_idx").on(table.nextRunAt),
    index("scheduled_task_type_idx").on(table.taskType),
  ],
);

export const taskExecution = pgTable(
  "task_execution",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    scheduledTaskId: text("scheduled_task_id")
      .notNull()
      .references(() => scheduledTask.id, { onDelete: "cascade" }), // Link to the definition

    status: taskExecutionStatusEnum("status").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationMs: integer("duration_ms"), // Calculated duration

    output: jsonb("output"), // Any result or output from the task (e.g., number of records processed)
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"), // e.g., stack trace

    workerId: text("worker_id"), // Identifier of the worker/instance that executed the task

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- ENSURE returns an ARRAY
    index("task_execution_scheduled_task_idx").on(table.scheduledTaskId),
    index("task_execution_status_idx").on(table.status),
    index("task_execution_started_at_idx").on(table.startedAt),
  ],
);

// ===========================================================================
// BLOCKCHAIN & PAYMENTS (PayGo Integration)
// ===========================================================================

export const escrow = pgTable(
  "escrow",
  {
    id: text("id").primaryKey(),
    internalId: text("internal_id").notNull(), // .unique() REMOVED
    blockchainId: text("blockchain_id"), // .unique() REMOVED

    // --- Core Identifying Foreign Keys & Discriminator ---
    escrowType: escrowTypeEnum("escrow_type").notNull(), // NEW: Discriminator column

    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // For 'USER_WALLET' type, or if a policy escrow is directly user-owned

    policyId: text("policy_id").references(() => policy.id, {
      onDelete: "cascade",
    }), // For 'POLICY' type, NULL for 'USER_WALLET'

    providerId: text("provider_id").references(() => provider.id, {
      onDelete: "set null",
    }), // For 'POLICY' type, or if a 'USER_WALLET' escrow involves a provider

    purpose: escrowPurposeEnum("purpose"), // NEW: For 'USER_WALLET' type, NULL for 'POLICY' type

    // --- Common Escrow Fields ---
    amount: decimal("amount", { precision: 15, scale: 6 }).notNull(),
    status: escrowStatusEnum("status").notNull().default("PENDING"),
    chain: text("chain").notNull(),

    // Escrow Model Configuration
    escrowModel: escrowModelEnum("escrow_model")
      .notNull()
      .default("SINGLE_SIDED"),
    premiumReturnPolicy: premiumReturnPolicyEnum("premium_return_policy")
      .notNull()
      .default("PROVIDER_KEEPS_PREMIUM"),
    collateralAmount: decimal("collateral_amount", {
      precision: 15,
      scale: 6,
    }).default("0.00"),
    poolId: text("pool_id").references(() => escrowPool.id),
    escrowConfiguration: jsonb("escrow_configuration"),

    // Blockchain Transaction Details
    txHash: text("tx_hash"),
    blockNumber: integer("block_number"),
    gasUsed: integer("gas_used"),
    fulfillerAddress: text("fulfiller_address"),
    vKey: text("v_key"),
    expiresAt: timestamp("expires_at").notNull(),
    fulfilledAt: timestamp("fulfilled_at"),
    releasedAt: timestamp("released_at"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    unique("escrow_internal_id_unique").on(table.internalId), // ADDED table-level unique
    unique("escrow_blockchain_id_unique")
      .on(table.blockchainId)
      .nullsNotDistinct(), // ADDED table-level unique, allowing nulls but unique when present
    // --- Indexes ---
    index("escrow_type_idx").on(table.escrowType), // NEW: Index on discriminator
    index("escrow_purpose_idx").on(table.purpose), // NEW: Index on purpose
    index("escrow_user_idx").on(table.userId),
    index("escrow_policy_idx").on(table.policyId),
    index("escrow_provider_idx").on(table.providerId),
    index("escrow_status_idx").on(table.status),
    index("escrow_blockchain_idx").on(table.blockchainId),
    index("escrow_expires_idx").on(table.expiresAt),
    index("escrow_internal_id_idx").on(table.internalId), // Good to have for lookups by internalId
  ],
);

export const payout = pgTable(
  "payout",
  {
    id: text("id").primaryKey(),
    policyId: text("policy_id")
      .notNull()
      .references(() => policy.id, { onDelete: "cascade" }),
    escrowId: text("escrow_id").references(() => escrow.id),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    status: payoutStatusEnum("status").notNull().default("PENDING"),
    chain: text("chain").notNull(),
    reason: text("reason").notNull(),
    flightDelayMinutes: integer("flight_delay_minutes"),
    conditionsMet: jsonb("conditions_met"),
    txHash: text("tx_hash"),
    blockNumber: integer("block_number"),
    gasUsed: integer("gas_used"),
    processedAt: timestamp("processed_at"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("payout_policy_idx").on(table.policyId),
    index("payout_status_idx").on(table.status),
    index("payout_processed_idx").on(table.processedAt),
  ],
);

// ============================================================================
// ESCROW POOLS (For Pooled Models)
// ============================================================================

export const escrowPool = pgTable(
  "escrow_pool",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
      .notNull()
      .references(() => provider.id),
    name: text("name").notNull(),
    escrowModel: escrowModelEnum("escrow_model").notNull(),

    // Pool Financial Details
    totalCapacity: decimal("total_capacity", {
      precision: 15,
      scale: 2,
    }).notNull(),
    availableBalance: decimal("available_balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0.00"),
    reservedBalance: decimal("reserved_balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0.00"),
    minimumBalance: decimal("minimum_balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0.00"),

    // Pool Configuration
    poolAddress: text("pool_address"), // .unique() REMOVED // Blockchain address for the pool
    collateralRatio: decimal("collateral_ratio", { precision: 5, scale: 4 })
      .notNull()
      .default("1.0000"), // 100% collateral by default
    maxPolicyCount: integer("max_policy_count"),
    maxPolicyAmount: decimal("max_policy_amount", { precision: 15, scale: 2 }),

    // Pool Status & Health
    isActive: boolean("is_active").notNull().default(true),
    healthScore: decimal("health_score", { precision: 5, scale: 4 }).default(
      "1.0000",
    ), // 0-1 health rating
    lastRebalanceAt: timestamp("last_rebalance_at"),
    nextRebalanceDue: timestamp("next_rebalance_due"),

    // Pool-Specific Configuration
    configuration: jsonb("configuration"), // Model-specific settings (DAO params, AI configs, etc.)
    metadata: jsonb("metadata"),

    // Audit & Compliance (for Bonded Liability Pool)
    auditedAt: timestamp("audited_at"),
    auditReport: text("audit_report"), // IPFS hash or URL
    bondAmount: decimal("bond_amount", { precision: 15, scale: 2 }),
    bondProvider: text("bond_provider"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    unique("escrow_pool_address_unique").on(table.poolAddress), // ADDED table-level unique
    index("pool_provider_idx").on(table.providerId),
    index("pool_model_idx").on(table.escrowModel),
    index("pool_address_idx").on(table.poolAddress),
    index("pool_status_idx").on(table.isActive),
    index("pool_health_idx").on(table.healthScore),
  ],
);

export const escrowPoolParticipant = pgTable(
  "escrow_pool_participant",
  {
    id: text("id").primaryKey(),
    poolId: text("pool_id")
      .notNull()
      .references(() => escrowPool.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    participantAddress: text("participant_address"), // For external participants

    // Participation Details
    contributionAmount: decimal("contribution_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    sharePercentage: decimal("share_percentage", {
      precision: 8,
      scale: 6,
    }).notNull(), // Percentage of pool owned
    lockedUntil: timestamp("locked_until"), // For subscription or locked pools

    // P2P Pool Specific
    riskTolerance: text("risk_tolerance"), // 'LOW', 'MEDIUM', 'HIGH'
    preferredCategories: jsonb("preferred_categories").$type<string[]>(), // Flight types they want to cover

    // Returns & Performance
    totalReturns: decimal("total_returns", { precision: 15, scale: 2 }).default(
      "0.00",
    ),
    realizedReturns: decimal("realized_returns", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    unrealizedReturns: decimal("unrealized_returns", {
      precision: 15,
      scale: 2,
    }).default("0.00"),

    isActive: boolean("is_active").notNull().default(true),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
    exitedAt: timestamp("exited_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    index("pool_participant_pool_idx").on(table.poolId),
    index("pool_participant_user_idx").on(table.userId),
    index("pool_participant_share_idx").on(table.sharePercentage),
    index("pool_participant_status_idx").on(table.isActive),
  ],
);

// ============================================================================
// DATA SOURCES & MONITORING
// ============================================================================

export const flightDataSource = pgTable(
  "flight_data_source",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(), // .unique() REMOVED
    type: text("type").notNull(), // \'primary\', \'fallback\', \'enrichment\'
    endpoint: text("endpoint"),
    isActive: boolean("is_active").notNull().default(true),
    priority: integer("priority").notNull().default(1),
    rateLimit: integer("rate_limit").default(1000),
    healthStatus: text("health_status").notNull().default("unknown"),
    lastHealthCheck: timestamp("last_health_check"),
    successRate: decimal("success_rate", { precision: 5, scale: 4 }).default(
      "0.0000",
    ),
    averageResponseTime: integer("average_response_time"), // milliseconds
    costPerRequest: decimal("cost_per_request", { precision: 10, scale: 8 }),
    configuration: jsonb("configuration"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    unique("flight_data_source_name_unique").on(table.name), // ADDED table-level unique
    index("data_source_name_idx").on(table.name),
    index("data_source_priority_idx").on(table.priority),
    index("data_source_health_idx").on(table.healthStatus),
  ],
);

// ============================================================================
// AUDIT & LOGGING
// ============================================================================

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id),
    providerId: text("provider_id").references(() => provider.id),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    index("audit_log_user_idx").on(table.userId),
    index("audit_log_provider_idx").on(table.providerId),
    index("audit_log_action_idx").on(table.action),
    index("audit_log_resource_idx").on(table.resource, table.resourceId),
  ],
);

// ============================================================================
// ADDITIONAL REFERENCE DATA TABLES
// ============================================================================

export const routes = pgTable(
  "routes",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`), // Auto-generated ID
    airlineIcaoCode: char("airline_icao_code", { length: 3 }).references(
      () => airline.icaoCode,
    ),
    sourceAirportIataCode: char("source_airport_iata_code", { length: 3 })
      .notNull()
      .references(() => airport.iataCode),
    destinationAirportIataCode: char("destination_airport_iata_code", {
      length: 3,
    })
      .notNull()
      .references(() => airport.iataCode),
    codeshare: boolean("codeshare").default(false),
    stops: integer("stops").default(0),
    equipment: text("equipment"), // Raw space-separated list of ICAO aircraft type codes from OpenFlights routes.dat
    // Or, for more structured equipment (if parsing and linking equipment codes):
    // equipmentIcaoCodes: varchar("equipment_icao_codes", { length: 4 }).array().references(() => aircraftTypes.icaoCode),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    unique("unique_operational_route").on(
      table.airlineIcaoCode,
      table.sourceAirportIataCode,
      table.destinationAirportIataCode,
    ),
    index("route_airline_idx").on(table.airlineIcaoCode),
    index("route_source_airport_idx").on(table.sourceAirportIataCode),
    index("route_destination_airport_idx").on(table.destinationAirportIataCode),
  ],
);

// ============================================================================
// HISTORICAL DATA & LOGGING TABLES
// ============================================================================

export const historicalFlightSegments = pgTable(
  "historical_flight_segments",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    // Based on CanonicalFlightDataModel
    iataFlightNumber: text("iata_flight_number"),
    icaoFlightNumber: text("icao_flight_number"),
    flightAwareFlightId: text("flightaware_flight_id"), // For API correlation
    aircraftRegistration: text("aircraft_registration"),
    airlineIcaoCode: char("airline_icao_code", { length: 3 }).references(
      () => airline.icaoCode,
    ),
    originAirportIataCode: char("origin_airport_iata_code", { length: 3 })
      .references(() => airport.iataCode)
      .notNull(),
    destinationAirportIataCode: char("destination_airport_iata_code", {
      length: 3,
    })
      .references(() => airport.iataCode)
      .notNull(),

    scheduledDepartureTimestampUTC: timestamp(
      // General scheduled departure
      "scheduled_departure_timestamp_utc",
      { withTimezone: true },
    ).notNull(),
    estimatedDepartureTimestampUTC: timestamp(
      // FlightAware: estimated_out
      "estimated_departure_timestamp_utc",
      { withTimezone: true },
    ),
    actualDepartureTimestampUTC: timestamp("actual_departure_timestamp_utc", {
      // FlightAware: actual_out (gate departure)
      withTimezone: true,
    }),
    gateDepartureScheduledTimestampUTC: timestamp(
      "gate_departure_scheduled_utc",
      { withTimezone: true },
    ), // FlightAware: scheduled_out
    gateDepartureActualTimestampUTC: timestamp("gate_departure_actual_utc", {
      withTimezone: true,
    }), // FlightAware: actual_out
    runwayDepartureScheduledTimestampUTC: timestamp(
      "runway_departure_scheduled_utc",
      { withTimezone: true },
    ), // FlightAware: scheduled_off
    runwayDepartureActualTimestampUTC: timestamp(
      "runway_departure_actual_utc",
      { withTimezone: true },
    ), // FlightAware: actual_off

    departureTerminal: text("departure_terminal"),
    departureRunway: text("departure_runway"), // This one can be populated by FlightAware actual_runway_off
    departureGate: text("departure_gate"),

    scheduledArrivalTimestampUTC: timestamp("scheduled_arrival_timestamp_utc", {
      // General scheduled arrival
      withTimezone: true,
    }).notNull(),
    estimatedArrivalTimestampUTC: timestamp("estimated_arrival_timestamp_utc", {
      // FlightAware: estimated_in
      withTimezone: true,
    }),
    actualArrivalTimestampUTC: timestamp("actual_arrival_timestamp_utc", {
      // FlightAware: actual_in (gate arrival)
      withTimezone: true,
    }),
    gateArrivalScheduledTimestampUTC: timestamp("gate_arrival_scheduled_utc", {
      withTimezone: true,
    }), // FlightAware: scheduled_in
    gateArrivalActualTimestampUTC: timestamp("gate_arrival_actual_utc", {
      withTimezone: true,
    }), // FlightAware: actual_in
    runwayArrivalScheduledTimestampUTC: timestamp(
      "runway_arrival_scheduled_utc",
      { withTimezone: true },
    ), // FlightAware: scheduled_on
    runwayArrivalActualTimestampUTC: timestamp("runway_arrival_actual_utc", {
      withTimezone: true,
    }), // FlightAware: actual_on

    arrivalTerminal: text("arrival_terminal"),
    arrivalRunway: text("arrival_runway"), // This one can be populated by FlightAware actual_runway_on
    arrivalGate: text("arrival_gate"),

    status: text("status").notNull(), // Consider standardizing with flightStatusEnum if applicable, or keep flexible
    departureDelayMinutes: integer("departure_delay_minutes"),
    arrivalDelayMinutes: integer("arrival_delay_minutes"),

    aircraftIcaoCode: varchar("aircraft_icao_code", { length: 4 }).references(
      () => aircraftTypes.icaoCode,
    ),

    liveLatitude: decimal("live_latitude", { precision: 10, scale: 7 }),
    liveLongitude: decimal("live_longitude", { precision: 10, scale: 7 }),
    liveAltitudeFt: integer("live_altitude_ft"),
    liveSpeedKph: integer("live_speed_kph"),
    liveHeading: integer("live_heading"),

    sourceContributions: jsonb("source_contributions"), // Array detailing sources, timestamps, confidence for key fields
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Optional: store raw data from one or more sources if needed for this specific segment snapshot
    // rawDataFlightAware: jsonb("raw_data_flightaware"),
    // rawDataAviationStack: jsonb("raw_data_aviationstack"),
    // rawDataOpenSky: jsonb("raw_data_opensky"),
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    index("hfs_flight_num_date_idx").on(
      table.iataFlightNumber,
      table.scheduledDepartureTimestampUTC,
    ),
    index("hfs_orig_dest_date_idx").on(
      table.originAirportIataCode,
      table.destinationAirportIataCode,
      table.scheduledDepartureTimestampUTC,
    ),
    index("hfs_airline_idx").on(table.airlineIcaoCode),
    index("hfs_fetched_at_idx").on(table.fetchedAt),
  ],
);

export const historicalWeatherObservations = pgTable(
  "historical_weather_observations",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    airportIataCode: char("airport_iata_code", { length: 3 })
      .references(() => airport.iataCode)
      .notNull(),
    observationTimestampUTC: timestamp("observation_timestamp_utc", {
      withTimezone: true,
    }).notNull(),
    forecastPeriod: text("forecast_period"), // e.g., 'DAYTIME', 'NIGHTTIME', 'HOURLY', 'CURRENT'

    temperatureCelsius: decimal("temperature_celsius", {
      // Specific/current temperature
      precision: 5,
      scale: 2,
    }),
    minTemperatureCelsius: decimal("min_temperature_celsius", {
      // Daily min
      precision: 5,
      scale: 2,
    }),
    maxTemperatureCelsius: decimal("max_temperature_celsius", {
      // Daily max
      precision: 5,
      scale: 2,
    }),
    feelsLikeCelsius: decimal("feels_like_celsius", {
      precision: 5,
      scale: 2,
    }),

    conditionCode: text("condition_code"), // Standardized condition code from weather API or internal mapping
    conditionText: text("condition_text"), // Human-readable, e.g., "Scattered Showers"
    conditionType: text("condition_type"), // API-specific type, e.g., "SCATTERED_SHOWERS"

    windSpeedKph: decimal("wind_speed_kph", { precision: 5, scale: 2 }),
    windDirectionDegrees: integer("wind_direction_degrees"),
    windDirectionCardinal: text("wind_direction_cardinal"), // e.g., "WEST", "SOUTH_SOUTHWEST"

    precipitationMmLastHour: decimal("precipitation_mm_last_hour", {
      // For point-in-time
      precision: 5,
      scale: 2,
    }),
    precipitationProbabilityPercent: integer(
      "precipitation_probability_percent",
    ), // For forecast

    visibilityKm: decimal("visibility_km", { precision: 5, scale: 2 }),
    humidityPercent: decimal("humidity_percent", { precision: 5, scale: 2 }),
    pressureHpa: decimal("pressure_hpa", { precision: 6, scale: 2 }),

    sunriseTimestampUTC: timestamp("sunrise_timestamp_utc", {
      withTimezone: true,
    }),
    sunsetTimestampUTC: timestamp("sunset_timestamp_utc", {
      withTimezone: true,
    }),
    moonPhase: text("moon_phase"),

    dataSourceApi: text("data_source_api").notNull(), // Renamed from dataSource for clarity
    fetchedAtUTC: timestamp("fetched_at_utc", { withTimezone: true }) // Renamed from fetchedAt for clarity
      .notNull()
      .defaultNow(),
    rawApiSnapshot: jsonb("raw_api_snapshot"), // Store the raw API response for this observation
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    index("hwo_airport_time_idx").on(
      table.airportIataCode,
      table.observationTimestampUTC,
      table.forecastPeriod,
    ),
    index("hwo_data_source_idx").on(table.dataSourceApi),
  ],
);

export const rawApiCallLogs = pgTable(
  "raw_api_call_logs",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    apiSource: text("api_source").notNull(),
    requestTimestampUTC: timestamp("request_timestamp_utc", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    requestUrl: text("request_url").notNull(),
    requestMethod: text("request_method").notNull(),
    requestHeaders: jsonb("request_headers"),
    requestBody: jsonb("request_body"),
    responseTimestampUTC: timestamp("response_timestamp_utc", {
      withTimezone: true,
    }),
    responseStatusCode: integer("response_status_code"),
    responseHeaders: jsonb("response_headers"),
    responseBody: jsonb("response_body"),
    isSuccess: boolean("is_success").notNull(),
    durationMs: integer("duration_ms"),
    associatedFlightId: text("associated_flight_id").references(
      () => flight.id,
    ), // Optional link to an operational flight
    associatedPolicyId: text("associated_policy_id").references(
      () => policy.id,
    ), // Optional link
  },
  (table) => [
    // <--- CHANGED to return an ARRAY
    index("log_api_source_idx").on(table.apiSource),
    index("log_request_ts_idx").on(table.requestTimestampUTC),
    index("log_status_idx").on(table.isSuccess),
  ],
);

// ============================================================================
// MVP TABLES (Phase 1 Foundation)
// ============================================================================

// User custodial wallet management - "triggerr Wallet"
export const userWallets = pgTable(
  "user_wallets",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    anonymousSessionId: text("anonymous_session_id"),
    chain: text("chain").notNull(),
    walletType: text("wallet_type").notNull(),
    address: text("address").notNull(),
    publicKey: text("public_key"),
    encryptedSecret: text("encrypted_secret"), // Can be private key or mnemonic, nullable for non-custodial
    kmsKeyId: text("kms_key_id"), // Nullable for non-custodial
    walletName: text("wallet_name").notNull().default("triggerr Wallet"),
    isPrimary: boolean("is_primary").notNull().default(true),
    keyExportedAt: timestamp("key_exported_at"),
    lastBalanceCheck: timestamp("last_balance_check"),
    cachedBalanceAmount: text("cached_balance_amount").notNull().default("0"),
    balanceCurrency: text("balance_currency").notNull().default("PAYGO_TOKEN"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_wallets_user_idx").on(table.userId),
    index("user_wallets_address_idx").on(table.address),
    index("user_wallets_chain_idx").on(table.chain),
    index("user_wallets_anon_session_idx").on(table.anonymousSessionId),
    check(
      "user_wallets_user_check",
      sql`(user_id IS NOT NULL) != (anonymous_session_id IS NOT NULL)`,
    ),
    unique("user_wallets_user_chain_unique").on(table.userId, table.chain),
  ],
);

// User payment methods for Stripe integration
export const userPaymentMethods = pgTable(
  "user_payment_methods",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    anonymousSessionId: text("anonymous_session_id"),
    paymentProvider: paymentProviderEnum("payment_provider").notNull(),
    providerCustomerId: text("provider_customer_id"),
    providerMethodId: text("provider_method_id").notNull().unique(),
    methodType: text("method_type"),
    details: jsonb("details"),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_payment_methods_user_idx").on(table.userId),
    index("user_payment_methods_provider_idx").on(table.paymentProvider),
    index("user_payment_methods_anon_session_idx").on(table.anonymousSessionId),
    check(
      "user_payment_methods_user_check",
      sql`(user_id IS NOT NULL) != (anonymous_session_id IS NOT NULL)`,
    ),
  ],
);

// Chat conversations for anonymous and authenticated users
export const conversations = pgTable(
  "conversations",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
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
  },
  (table) => [
    index("conversations_user_idx").on(table.userId),
    index("conversations_anon_session_idx").on(table.anonymousSessionId),
    index("conversations_created_idx").on(table.createdAt),
  ],
);

// Chat messages with UI elements
export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    anonymousSessionId: text("anonymous_session_id").references(
      () => session.id,
    ),
    role: conversationMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    uiElements: jsonb("ui_elements"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("conversation_messages_conversation_idx").on(table.conversationId),
    index("conversation_messages_created_idx").on(table.createdAt),
    index("conversation_messages_role_idx").on(table.role),
  ],
);

// Quote cart for anonymous and authenticated users
export const quoteCartItems = pgTable(
  "quote_cart_items",
  {
    id: text("id")
      .primaryKey()
      .default(sql`generate_ulid()`),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    anonymousSessionId: text("anonymous_session_id"),
    insuranceProductId: text("insurance_product_id").notNull(),
    flightContextSnapshot: jsonb("flight_context_snapshot").notNull(),
    quotedPremiumCents: integer("quoted_premium_cents").notNull(),
    quotedCoverageCents: integer("quoted_coverage_cents").notNull(),
    quoteDetails: jsonb("quote_details").notNull(),
    addedAt: timestamp("added_at").notNull().defaultNow(),
    status: quoteCartItemStatusEnum("status").notNull().default("PENDING"),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("quote_cart_user_idx").on(table.userId),
    index("quote_cart_anon_session_idx").on(table.anonymousSessionId),
    index("quote_cart_status_idx").on(table.status),
    index("quote_cart_expires_idx").on(table.expiresAt),
    // Note: Unique constraints removed from JSONB fields (not supported)
    // Uniqueness will be enforced at application level
  ],
);

// Enhanced API request/response logging for monitoring
export const apiLogs = pgTable(
  "api_logs",
  {
    id: serial("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .default(sql`generate_ulid()`),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    userId: text("user_id").references(() => user.id),
    apiKeyId: text("api_key_id").references(() => apiKey.id),
    anonymousSessionId: text("anonymous_session_id"),
    endpoint: text("endpoint").notNull(),
    method: text("method").notNull(),
    statusCode: integer("status_code").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    requestPayloadHash: text("request_payload_hash"),
    responsePayloadHash: text("response_payload_hash"),
    errorMessage: text("error_message"),
    rateLimitHit: boolean("rate_limit_hit").default(false),
  },
  (table) => [
    index("api_logs_timestamp_idx").on(table.timestamp),
    index("api_logs_user_idx").on(table.userId),
    index("api_logs_endpoint_idx").on(table.endpoint),
    index("api_logs_status_idx").on(table.statusCode),
    index("api_logs_request_id_idx").on(table.requestId),
  ],
);

// ============================================================================
// RELATIONS
// ============================================================================

// Core User & Auth Relations
export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  apiKeys: many(apiKey),
  policies: many(policy),
  quotes: many(quote),
  escrows: many(escrow), // Direct user escrows (wallet functions)
  escrowPoolParticipations: many(escrowPoolParticipant),
  auditLogs: many(auditLog),
  revenues: many(revenue),
  webhooks: many(webhook),
  // MVP table relations
  wallet: one(userWallets),
  paymentMethods: many(userPaymentMethods),
  conversations: many(conversations),
  quoteCartItems: many(quoteCartItems),
  apiLogs: many(apiLogs),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id],
  }),
  provider: one(provider, {
    fields: [apiKey.providerId],
    references: [provider.id],
  }),
}));

// Provider Relations
export const providerRelations = relations(provider, ({ one, many }) => ({
  // If provider can be an airline directly, or linked to one:
  airlineProfile: one(airline, {
    fields: [provider.linkedAirlineIcaoCode],
    references: [airline.icaoCode],
  }),
  products: many(providerProduct),
  policies: many(policy),
  quotes: many(quote),
  escrows: many(escrow), // Provider-related escrows
  escrowPools: many(escrowPool),
  apiKeys: many(apiKey),
  auditLogs: many(auditLog),
  revenues: many(revenue),
  revenueSharingRules: many(revenueSharingRule),
  webhooks: many(webhook),
}));

export const providerProductRelations = relations(
  providerProduct,
  ({ one, many }) => ({
    provider: one(provider, {
      fields: [providerProduct.providerId],
      references: [provider.id],
    }),
    revenueSharingRules: many(revenueSharingRule),
  }),
);

// Reference Data Relations
export const countriesRelations = relations(countries, ({ many }) => ({
  regions: many(regions),
  airlines: many(airline),
  airports: many(airport),
}));

export const regionsRelations = relations(regions, ({ one, many }) => ({
  country: one(countries, {
    fields: [regions.countryIsoCode],
    references: [countries.isoCode],
  }),
  airports: many(airport),
}));

export const airlineRelations = relations(airline, ({ one, many }) => ({
  country: one(countries, {
    fields: [airline.countryIsoCode],
    references: [countries.isoCode],
  }),
  flights: many(flight, { relationName: "flightsOperatedByAirline" }),
  routes: many(routes, { relationName: "routesOperatedByAirline" }),
  historicalFlightSegments: many(historicalFlightSegments, {
    relationName: "historicalSegmentsByAirline",
  }),
  // If provider links to airline directly:
  // providerProfile: one(provider, { fields: [airline.icaoCode], references: [provider.linkedAirlineIcaoCode] })
}));

export const airportRelations = relations(airport, ({ one, many }) => ({
  country: one(countries, {
    fields: [airport.countryIsoCode],
    references: [countries.isoCode],
  }),
  region: one(regions, {
    fields: [airport.regionIsoCode],
    references: [regions.code],
  }),
  runways: many(runways),
  departingFlightsOperational: many(flight, {
    relationName: "departingFlightsOperational",
  }),
  arrivingFlightsOperational: many(flight, {
    relationName: "arrivingFlightsOperational",
  }),
  sourceRoutes: many(routes, { relationName: "sourceAirportForRoutes" }),
  destinationRoutes: many(routes, {
    relationName: "destinationAirportForRoutes",
  }),
  historicalDepartingSegments: many(historicalFlightSegments, {
    relationName: "historicalDepartingAirport",
  }),
  historicalArrivingSegments: many(historicalFlightSegments, {
    relationName: "historicalArrivingAirport",
  }),
  weatherObservations: many(historicalWeatherObservations),
}));

export const runwaysRelations = relations(runways, ({ one }) => ({
  airport: one(airport, {
    fields: [runways.airportIataCode],
    references: [airport.iataCode],
  }),
}));

export const aircraftTypesRelations = relations(aircraftTypes, ({ many }) => ({
  operationalFlights: many(flight),
  historicalFlightSegments: many(historicalFlightSegments),
  // If routes.equipment is an array of FKs:
  // routesUsingEquipment: many(routes),
}));

export const routesRelations = relations(routes, ({ one }) => ({
  airline: one(airline, {
    fields: [routes.airlineIcaoCode],
    references: [airline.icaoCode],
    relationName: "routesOperatedByAirline",
  }),
  sourceAirport: one(airport, {
    fields: [routes.sourceAirportIataCode],
    references: [airport.iataCode],
    relationName: "sourceAirportForRoutes",
  }),
  destinationAirport: one(airport, {
    fields: [routes.destinationAirportIataCode],
    references: [airport.iataCode],
    relationName: "destinationAirportForRoutes",
  }),
  // If routes.equipment is structured (e.g., array of aircraftType FKs)
  // equipmentTypes: many(aircraftTypes, { fields: [routes.equipmentIcaoCodes], references: [aircraftTypes.icaoCode] })
}));

// Operational Flight & Insurance Data Relations
export const flightRelations = relations(flight, ({ one, many }) => ({
  airline: one(airline, {
    fields: [flight.airlineIcaoCode],
    references: [airline.icaoCode],
    relationName: "flightsOperatedByAirline",
  }),
  departureAirport: one(airport, {
    fields: [flight.departureAirportIataCode],
    references: [airport.iataCode],
    relationName: "departingFlightsOperational",
  }),
  arrivalAirport: one(airport, {
    fields: [flight.arrivalAirportIataCode],
    references: [airport.iataCode],
    relationName: "arrivingFlightsOperational",
  }),
  aircraftType: one(aircraftTypes, {
    fields: [flight.aircraftIcaoCode],
    references: [aircraftTypes.icaoCode],
  }),
  quotes: many(quote),
  policies: many(policy),
  apiCallLogs: many(rawApiCallLogs, { relationName: "logsForFlight" }),
}));

export const quoteRelations = relations(quote, ({ one }) => ({
  user: one(user, {
    fields: [quote.userId],
    references: [user.id],
  }),
  provider: one(provider, {
    fields: [quote.providerId],
    references: [provider.id],
  }),
  flight: one(flight, {
    fields: [quote.flightId],
    references: [flight.id],
  }),
  policy: one(policy, {
    // If a quote can become one policy
    fields: [quote.id],
    references: [policy.quoteId], // Assuming policy.quoteId exists and is unique
  }),
}));

export const policyRelations = relations(policy, ({ one, many }) => ({
  user: one(user, {
    fields: [policy.userId],
    references: [user.id],
  }),
  provider: one(provider, {
    fields: [policy.providerId],
    references: [provider.id],
  }),
  flight: one(flight, {
    fields: [policy.flightId],
    references: [flight.id],
  }),
  quote: one(quote, {
    fields: [policy.quoteId],
    references: [quote.id],
  }),
  policyEvents: many(policyEvent),
  revenue: many(revenue),
  escrows: many(escrow),
  payouts: many(payout),
  verificationCodes: many(policyVerificationCode),
  beneficiaries: many(beneficiaries),
  endorsements: many(endorsements),
  apiCallLogs: many(rawApiCallLogs, { relationName: "logsForPolicy" }),
}));

export const policyVerificationCodeRelations = relations(
  policyVerificationCode,
  ({ one }) => ({
    policy: one(policy, {
      fields: [policyVerificationCode.policyId],
      references: [policy.id],
    }),
  }),
);

export const beneficiariesRelations = relations(beneficiaries, ({ one }) => ({
  policy: one(policy, {
    fields: [beneficiaries.policyId],
    references: [policy.id],
  }),
}));

export const endorsementsRelations = relations(endorsements, ({ one }) => ({
  policy: one(policy, {
    fields: [endorsements.policyId],
    references: [policy.id],
  }),
}));

export const policyEventRelations = relations(policyEvent, ({ one }) => ({
  policy: one(policy, {
    fields: [policyEvent.policyId],
    references: [policy.id],
  }),
}));

// Escrow & Payout Relations
export const escrowRelations = relations(escrow, ({ one, many }) => ({
  user: one(user, {
    fields: [escrow.userId],
    references: [user.id],
  }),
  policy: one(policy, {
    fields: [escrow.policyId],
    references: [policy.id],
  }),
  provider: one(provider, {
    fields: [escrow.providerId],
    references: [provider.id],
  }),
  pool: one(escrowPool, {
    fields: [escrow.poolId],
    references: [escrowPool.id],
  }),
  // payouts: many(payout), // A single escrow typically results in one type of payout action (release/refund)
  revenues: many(revenue, { relationName: "revenues_for_escrow" }),
}));

export const revenueRelations = relations(revenue, ({ one }) => ({
  escrow: one(escrow, {
    fields: [revenue.escrowId],
    references: [escrow.id],
    relationName: "revenues_for_escrow",
  }),
  policy: one(policy, {
    fields: [revenue.policyId],
    references: [policy.id],
  }),
  provider: one(provider, {
    fields: [revenue.providerId],
    references: [provider.id],
  }),
  user: one(user, {
    fields: [revenue.userId],
    references: [user.id],
  }),
}));

export const revenueSharingRuleRelations = relations(
  revenueSharingRule,
  ({ one }) => ({
    provider: one(provider, {
      fields: [revenueSharingRule.providerId],
      references: [provider.id],
    }),
    providerProduct: one(providerProduct, {
      fields: [revenueSharingRule.providerProductId],
      references: [providerProduct.id],
    }),
  }),
);

export const webhookRelations = relations(webhook, ({ one, many }) => ({
  user: one(user, {
    fields: [webhook.userId],
    references: [user.id],
  }),
  provider: one(provider, {
    fields: [webhook.providerId],
    references: [provider.id],
  }),
  deliveries: many(webhookDelivery),
}));

export const webhookDeliveryRelations = relations(
  webhookDelivery,
  ({ one }) => ({
    webhook: one(webhook, {
      fields: [webhookDelivery.webhookId],
      references: [webhook.id],
    }),
  }),
);

export const payoutRelations = relations(payout, ({ one }) => ({
  policy: one(policy, {
    fields: [payout.policyId],
    references: [policy.id],
  }),
  escrow: one(escrow, {
    // Payout comes from a specific escrow
    fields: [payout.escrowId],
    references: [escrow.id],
  }),
}));

export const escrowPoolRelations = relations(escrowPool, ({ one, many }) => ({
  provider: one(provider, {
    fields: [escrowPool.providerId],
    references: [provider.id],
  }),
  participants: many(escrowPoolParticipant),
  associatedEscrows: many(escrow), // Escrows that might draw from/contribute to this pool
}));

export const escrowPoolParticipantRelations = relations(
  escrowPoolParticipant,
  ({ one }) => ({
    pool: one(escrowPool, {
      fields: [escrowPoolParticipant.poolId],
      references: [escrowPool.id],
    }),
    user: one(user, {
      fields: [escrowPoolParticipant.userId],
      references: [user.id],
    }),
  }),
);

// Historical Data & Logging Relations
export const historicalFlightSegmentsRelations = relations(
  historicalFlightSegments,
  ({ one }) => ({
    airline: one(airline, {
      fields: [historicalFlightSegments.airlineIcaoCode],
      references: [airline.icaoCode],
      relationName: "historicalSegmentsByAirline",
    }),
    originAirport: one(airport, {
      fields: [historicalFlightSegments.originAirportIataCode],
      references: [airport.iataCode],
      relationName: "historicalDepartingAirport",
    }),
    destinationAirport: one(airport, {
      fields: [historicalFlightSegments.destinationAirportIataCode],
      references: [airport.iataCode],
      relationName: "historicalArrivingAirport",
    }),
    aircraftType: one(aircraftTypes, {
      fields: [historicalFlightSegments.aircraftIcaoCode],
      references: [aircraftTypes.icaoCode],
    }),
  }),
);

export const historicalWeatherObservationsRelations = relations(
  historicalWeatherObservations,
  ({ one }) => ({
    airport: one(airport, {
      fields: [historicalWeatherObservations.airportIataCode],
      references: [airport.iataCode],
    }),
  }),
);

export const rawApiCallLogsRelations = relations(rawApiCallLogs, ({ one }) => ({
  associatedFlight: one(flight, {
    fields: [rawApiCallLogs.associatedFlightId],
    references: [flight.id],
    relationName: "logsForFlight",
  }),
  associatedPolicy: one(policy, {
    fields: [rawApiCallLogs.associatedPolicyId],
    references: [policy.id],
    relationName: "logsForPolicy",
  }),
}));

// Other System Table Relations
export const flightDataSourceRelations = relations(flightDataSource, () => ({
  // Usually a configuration table, might not have direct relations queried often
  // but could be linked from historical_flight_segments if we store which source provided the canonical data
}));

export const systemConfigurationRelations = relations(
  systemConfiguration,
  () => ({
    // No direct relations defined by default, as it's a key-value store.
    // Relations could be added if, for example, a config entry pointed to a user ID for an admin contact.
  }),
);

export const cacheEntryRelations = relations(cacheEntry, () => ({
  // No direct FK relations are typically defined. Cache management logic is usually separate.
}));

export const scheduledTaskRelations = relations(scheduledTask, ({ many }) => ({
  executions: many(taskExecution, { relationName: "TaskExecutions" }),
}));

export const taskExecutionRelations = relations(taskExecution, ({ one }) => ({
  scheduledTask: one(scheduledTask, {
    fields: [taskExecution.scheduledTaskId],
    references: [scheduledTask.id],
    relationName: "TaskExecutions",
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
  provider: one(provider, {
    fields: [auditLog.providerId],
    references: [provider.id],
  }),
  // If resourceId points to other tables, more specific relations could be added here,
  // but it often requires a polymorphic approach or application-level logic.
}));

// ============================================================================
// MVP TABLE RELATIONS (Phase 1 Foundation)
// ============================================================================

export const userWalletsRelations = relations(userWallets, ({ one }) => ({
  user: one(user, {
    fields: [userWallets.userId],
    references: [user.id],
  }),
}));

export const userPaymentMethodsRelations = relations(
  userPaymentMethods,
  ({ one }) => ({
    user: one(user, {
      fields: [userPaymentMethods.userId],
      references: [user.id],
    }),
  }),
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(user, {
      fields: [conversations.userId],
      references: [user.id],
    }),
    messages: many(conversationMessages),
  }),
);

export const conversationMessagesRelations = relations(
  conversationMessages,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationMessages.conversationId],
      references: [conversations.id],
    }),
  }),
);

export const quoteCartItemsRelations = relations(quoteCartItems, ({ one }) => ({
  user: one(user, {
    fields: [quoteCartItems.userId],
    references: [user.id],
  }),
}));

export const apiLogsRelations = relations(apiLogs, ({ one }) => ({
  user: one(user, {
    fields: [apiLogs.userId],
    references: [user.id],
  }),
  apiKey: one(apiKey, {
    fields: [apiLogs.apiKeyId],
    references: [apiKey.id],
  }),
}));
