import { db } from "./index";
import {
  provider,
  airport,
  airline,
  flightDataSource,
  user,
  providerProduct,
  countries,
  regions,
  aircraftTypes,
  runways,
  routes,
  systemConfiguration, // Added for platform wallet seeding
} from "./schema";
import { eq, and, sql } from "drizzle-orm";
import fs from "node:fs/promises";
import { Logger, LogLevel } from "../logging/logger";
import path from "node:path";
import { parse as parseCsv } from "csv-parse/sync";

const logger = new Logger(LogLevel.INFO, "SEED");

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function for OpenFlights .dat files (comma-separated, may have quotes, \N for null)
// Further revised parseDatLine
function parseDatLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (
      char === '"' &&
      !(inQuotes && line[i + 1] === '"' && (i++, (currentField += '"'), true))
    ) {
      // This complex condition handles "" inside quotes as a single "
      // and otherwise toggles inQuotes. The (i++, currentField += '"', true) is a sequence
      // to ensure a single quote is added and the next char is skipped if it's an escaped quote.
      inQuotes = !inQuotes;
      continue; // Skip the delimiter quote itself
    }

    if (char === "," && !inQuotes) {
      fields.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }
  fields.push(currentField); // Push the last field

  // Post-process each field: trim and handle \N, then unquote
  return fields.map((field) => {
    let f = field.trim();
    if (f === "\\N") {
      return ""; // Or null if you prefer and downstream code handles it
    }
    // Remove leading/trailing quotes if the field is fully enclosed
    if (f.startsWith('"') && f.endsWith('"')) {
      f = f.substring(1, f.length - 1);
      // Handle escaped double quotes "" -> " within the unquoted string
      f = f.replace(/""/g, '"');
    }
    return f;
  });
}

function generateId(prefix: string, identifier: string): string {
  return `${prefix}_${identifier}_${Date.now().toString().slice(-6)}`;
}

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// APPLICATION SETUP CONSTANTS
// ============================================================================

// --- Provider IDs (Hardcoded for Seed Stability) ---
const TRIGGERR_DIRECT_PROVIDER_ID = "PROV_TRDR";
const PRETERAG_FINANCIAL_PROVIDER_ID = "PROV_PRTF";
const AEROASSURE_PROVIDER_ID = "PROV_AASP";

// --- Product IDs (Hardcoded for Seed Stability) ---
const TRDR_FLIGHT_DELAY_60_PRODUCT_ID = "PROD_TRDR001";
const TRDR_FLIGHT_DELAY_120_PRODUCT_ID = "PROD_TRDR002";
const PRETERAG_REINSURANCE_A_PRODUCT_ID = "PROD_PRTF001";
const AEROASSURE_COMPREHENSIVE_PRODUCT_ID = "PROD_AASP001";

// --- User IDs (Hardcoded for Seed Stability) ---
const ADMIN_USER_ID = "USER_ADMIN001";

// ============================================================================
// DATA SETUP
// ============================================================================

// --- Providers ---
const providerSetupData = [
  {
    id: TRIGGERR_DIRECT_PROVIDER_ID,
    name: "triggerr Direct",
    slug: "triggerr-direct",
    category: "FIRST_PARTY_INSURER" as const,
    status: "ACTIVE" as const,
    tier: "PREMIUM" as const,
    description:
      "triggerr's flagship provider offering seamless flight delay insurance directly to travelers. Pays standard platform fees.",
    logoUrl: "https://triggerr.com/assets/triggerr-direct-logo.png",
    websiteUrl: "https://direct.triggerr.com",
    supportEmail: "direct.support@triggerr.com",
    walletAddress:
      process.env.PROVIDER_TRIGGERR_DIRECT_WALLET_ADDRESS ||
      "placeholder_triggerr_direct_wallet_address",
    walletPrivateKey: null, // Populated from ENV post-setup
    apiEndpoint: "https://api.direct.triggerr.com", // Example
    webhookSecret: null, // Populated from ENV or generated
    commissionRate: "0.1000", // Example: 10% platform marketplace fee
    escrowModel: "SINGLE_SIDED" as const,
    premiumReturnPolicy: "PROVIDER_KEEPS_PREMIUM" as const,
    collateralRequirement: "0.00", // No collateral required for single-sided
    poolAddress: null, // No pool for single-sided model
    poolMinimumBalance: "0.00",
    escrowConfiguration: {
      description:
        "Single-sided escrow model where only user premium is held in escrow. triggerr Direct maintains separate reserves for payouts, ensuring capital efficiency for this product line.",
      advantages: [
        "High capital efficiency for the provider for these specific products",
        "Potentially faster policy issuance due to simpler on-chain requirements",
        "Lower on-chain transaction costs for this model",
      ],
      userExperience:
        "Simple premium payment by the user. Payouts for valid claims are processed from triggerr Direct's dedicated operational reserve funds.",
      trustModel:
        "Relies on triggerr Direct's operational integrity, transparent reporting, and robust off-chain reserve management for this model.",
      operationalNotes: {
        reserveManagement:
          "Dedicated off-chain reserves are maintained and reconciled against potential liabilities.",
        minimumReserveTarget: "100000.00",
        targetReserveRatio: "1.5",
        rebalanceFrequency: "daily-review",
        onchainMonitoring: false,
      },
    },
    isActive: true,
  },
  {
    id: PRETERAG_FINANCIAL_PROVIDER_ID,
    name: "Preterag Financial Solutions",
    slug: "preterag-financial-solutions",
    category: "B2B_FINANCIAL_SERVICES" as const,
    status: "ACTIVE" as const,
    tier: "ENTERPRISE" as const,
    description:
      "Specialized reinsurance, underwriting support, and financial services for the parametric insurance sector. Operates independently on the triggerr platform using preterag.com.",
    logoUrl: "https://triggerr.com/assets/preterag-logo.png", // Example - update with actual logo URL
    websiteUrl: "https://preterag.com",
    supportEmail: "support@preterag.com",
    walletAddress:
      process.env.PROVIDER_PRETERAG_FINANCIAL_WALLET_ADDRESS ||
      "placeholder_preterag_financial_wallet_address",
    walletPrivateKey: null,
    apiEndpoint: "https://api.preterag.com", // Example
    webhookSecret: null,
    commissionRate: "0.0800", // Example: 8% platform fee for its B2B products
    escrowModel: "COLLATERALIZED_PROVIDER_POOL" as const, // Example for B2B financial products
    premiumReturnPolicy: "PROVIDER_KEEPS_PREMIUM" as const,
    collateralRequirement: "500000.00", // Example: $500k collateral for its pool
    poolAddress:
      process.env.PROVIDER_PRETERAG_FINANCIAL_POOL_ADDRESS ||
      "placeholder_preterag_financial_pool_address",
    poolMinimumBalance: "250000.00", // Example
    escrowConfiguration: {
      description:
        "Operates a collateralized on-chain pool for its B2B reinsurance and financial products. This pool is funded and managed by Preterag Financial Solutions to back its obligations.",
      poolType: "Dedicated Provider Collateral Pool",
      fundingMechanism:
        "Primarily funded by Preterag's own capital; may involve contributions from institutional participants for specific tranches.",
      participantRequirements:
        "Primarily for institutional clients, other insurance providers, or sophisticated entities participating in reinsurance contracts.",
      payoutLogic:
        "Payouts from the pool are triggered based on the terms of the specific B2B contract or reinsurance agreement.",
      transparencyLevel:
        "Pool balance and major transactions may be verifiable on-chain, subject to privacy considerations for B2B contracts.",
    },
    isActive: true,
  },
  {
    id: AEROASSURE_PROVIDER_ID,
    name: "AeroAssure Partners",
    slug: "aeroassure-partners",
    category: "THIRD_PARTY_INSURER" as const, // Matches providerCategoryEnum
    status: "ACTIVE" as const,
    tier: "STANDARD" as const,
    description:
      "Independent third-party provider offering comprehensive travel protection and flight assistance services on the triggerr platform.",
    logoUrl: "https://triggerr.com/assets/aeroassure-logo.png", // Example
    websiteUrl: "https://aeroassure.example.com",
    supportEmail: "support@aeroassure.example.com",
    walletAddress:
      process.env.PROVIDER_AEROASSURE_WALLET_ADDRESS ||
      "placeholder_aeroassure_wallet_address",
    walletPrivateKey: null,
    apiEndpoint: "https://api.aeroassure.example.com", // Example
    webhookSecret: null,
    commissionRate: "0.1000", // Standard 10% platform fee
    escrowModel: "DUAL_SIDED" as const, // Example, could be different
    premiumReturnPolicy: "PROVIDER_KEEPS_PREMIUM" as const,
    collateralRequirement: "10000.00", // Example if model requires
    poolAddress: null,
    poolMinimumBalance: "0.00",
    escrowConfiguration: {
      description:
        "Utilizes a dual-sided escrow model for its travel protection products. Both the customer's premium and a portion of AeroAssure's collateral are typically held in escrow for each policy.",
      customerPremiumHandling:
        "Customer premium is locked in an escrow account upon policy purchase until the flight status is resolved or the policy period concludes.",
      providerCollateralHandling:
        "AeroAssure Partners contributes a pre-defined amount or percentage of the coverage amount as collateral into the escrow for each policy.",
      payoutMechanism:
        "If a claim is valid (e.g., flight delayed beyond the threshold), funds are released from the escrow (covering both premium and collateral portions as per policy terms) to the customer.",
      fundReleaseOnNoClaim:
        "If no claim is made or conditions are not met, the premium portion is typically released to AeroAssure, and their collateral portion is returned to them.",
    },
    isActive: true,
  },
];

// --- Provider Products ---
const providerProductSetupData = [
  // Products for triggerr Direct
  {
    id: TRDR_FLIGHT_DELAY_60_PRODUCT_ID,
    providerId: TRIGGERR_DIRECT_PROVIDER_ID,
    name: "triggerr Direct: Flight Delay 60+ Min",
    description:
      "Coverage for flight delays of 60 minutes or more from triggerr Direct. Automatic payout when delay conditions are met.",
    productCategory: "FLIGHT_PARAMETRIC" as const,
    coverageType: "DELAY_60" as const,
    baseRate: "0.0250", // 2.5% base rate
    maxCoverage: "5000.00", // $5,000 max coverage
    minCoverage: "50.00", // $50 min coverage
    termsUrl: "https://direct.triggerr.com/terms/flight-delay-60",
    isActive: true,
  },
  {
    id: TRDR_FLIGHT_DELAY_120_PRODUCT_ID,
    providerId: TRIGGERR_DIRECT_PROVIDER_ID,
    name: "triggerr Direct: Flight Delay 120+ Min",
    description:
      "Coverage for flight delays of 120 minutes or more from triggerr Direct. Lower premium for higher delay threshold.",
    productCategory: "FLIGHT_PARAMETRIC" as const,
    coverageType: "DELAY_120" as const,
    baseRate: "0.0150", // 1.5% base rate
    maxCoverage: "10000.00", // $10,000 max coverage
    minCoverage: "100.00", // $100 min coverage
    termsUrl: "https://direct.triggerr.com/terms/flight-delay-120",
    isActive: true,
  },
  // Products for Preterag Financial Solutions (Example B2B Reinsurance Product)
  {
    id: PRETERAG_REINSURANCE_A_PRODUCT_ID,
    providerId: PRETERAG_FINANCIAL_PROVIDER_ID,
    name: "Preterag: Flight Risk Reinsurance Portfolio - Tier A",
    description:
      "Comprehensive reinsurance coverage for flight delay portfolios. Tailored for primary insurers on the triggerr network, offered by Preterag Financial Solutions.",
    productCategory: "CUSTOM_PARAMETRIC" as const, // Using existing enum, could be more specific if new enums added
    coverageType: "CUSTOM" as const, // Using existing enum
    baseRate: "0.0300", // Example: 3% of the reinsured portfolio value (interpret as needed)
    maxCoverage: "1000000.00", // Example: Max reinsurance capacity per agreement
    minCoverage: "50000.00", // Example: Min reinsurance agreement size
    termsUrl: "https://preterag.com/terms/reinsurance-flight-A",
    isActive: true,
  },
  // Example Product for AeroAssure Partners
  {
    id: AEROASSURE_COMPREHENSIVE_PRODUCT_ID,
    providerId: AEROASSURE_PROVIDER_ID,
    name: "AeroAssure: Comprehensive Travel Shield",
    description:
      "Full travel protection including flight delays, cancellations, medical, and baggage coverage by AeroAssure Partners.",
    productCategory: "TRAVEL_COMPREHENSIVE" as const,
    coverageType: "COMPREHENSIVE" as const, // Assuming this is or will be an enum value
    baseRate: "0.0500", // 5% base rate of trip cost
    maxCoverage: "25000.00",
    minCoverage: "1000.00",
    termsUrl: "https://aeroassure.example.com/terms/travel-shield",
    isActive: true,
  },
];

// --- Flight Data Sources ---
const flightDataSourceSetupData = [
  {
    id: generateId("source", "aviationstack"),
    name: "AviationStack",
    type: "primary",
    endpoint: "http://api.aviationstack.com/v1",
    isActive: true,
    priority: 1,
    rateLimit: 10000, // Free tier monthly limit
    healthStatus: "healthy",
    successRate: "0.9500", // 95% success rate
    avgResponseTime: 800, // milliseconds
    documentation: "https://aviationstack.com/documentation",
    pricingTier: "free",
    features: ["real-time flights", "historical data", "flight schedules"],
    limitations: "Free tier limited to 10,000 API calls per month",
    dataFreshness: 300, // 5 minutes in seconds
    coverageRegions: ["global"],
    supportedEndpoints: ["flights", "airlines", "airports", "countries"],
    isDataPersistent: true,
    canQueryHistorical: true,
    realTimeCapability: true,
    batchOperationSupport: false,
    webhookSupport: false,
    slaGuarantee: "99.0%",
  },
  {
    id: generateId("source", "flightaware"),
    name: "FlightAware",
    type: "primary",
    endpoint: "https://aeroapi.flightaware.com/aeroapi",
    isActive: true,
    priority: 2,
    rateLimit: 1000, // Personal plan monthly limit
    healthStatus: "healthy",
    successRate: "0.9800", // 98% success rate
    avgResponseTime: 400, // milliseconds
    documentation: "https://flightaware.com/commercial/aeroapi/",
    pricingTier: "personal",
    features: [
      "real-time flights",
      "detailed flight tracks",
      "airport operations",
    ],
    limitations: "Personal plan limited to 1,000 API calls per month",
    dataFreshness: 60, // 1 minute in seconds
    coverageRegions: ["global"],
    supportedEndpoints: ["flights", "airports", "operators"],
    isDataPersistent: true,
    canQueryHistorical: true,
    realTimeCapability: true,
    batchOperationSupport: true,
    webhookSupport: true,
    slaGuarantee: "99.5%",
  },
  {
    id: generateId("source", "opensky"),
    name: "OpenSky Network",
    type: "secondary",
    endpoint: "https://opensky-network.org/api",
    isActive: true,
    priority: 3,
    rateLimit: 4000, // Free tier hourly limit
    healthStatus: "healthy",
    successRate: "0.9200", // 92% success rate
    avgResponseTime: 1200, // milliseconds
    documentation: "https://opensky-network.org/apidoc/",
    pricingTier: "free",
    features: ["real-time tracking", "historical data", "crowdsourced data"],
    limitations: "Rate limited, crowdsourced data quality varies",
    dataFreshness: 600, // 10 minutes in seconds
    coverageRegions: ["global"],
    supportedEndpoints: ["states", "flights"],
    isDataPersistent: false,
    canQueryHistorical: false,
    realTimeCapability: true,
    batchOperationSupport: false,
    webhookSupport: false,
    slaGuarantee: "95.0%",
  },
];

const adminUserSetupData = {
  id: ADMIN_USER_ID,
  email: "admin@triggerr.com",
  name: "triggerr Admin",
  walletAddress: null, // To be set up separately
  walletPrivateKey: null, // To be set up separately
  emailVerified: true,
  image: null,
  isActive: true,
};

// ============================================================================
// COMPREHENSIVE FILE-BASED SEEDING FUNCTIONS
// ============================================================================

async function seedCountriesFromFiles() {
  console.log(
    "🌍 Seeding countries from dual sources (CSV primary + DAT augmentation)...",
  );

  const csvPath = path.join(__dirname, "./seedfiles/countries.csv");
  const datPath = path.join(__dirname, "./seedfiles/countries.dat");

  // Check if at least one source file exists
  const csvExists = await fileExists(csvPath);
  const datExists = await fileExists(datPath);

  if (!csvExists && !datExists) {
    console.log(
      "  ❌ No country data files found. Skipping countries seeding.",
    );
    console.log(`  📍 Expected files: ${csvPath} or ${datPath}`);
    return;
  }

  try {
    let countriesData: any[] = [];

    // Try CSV first (primary source if available)
    try {
      const csvContent = await fs.readFile(csvPath, "utf8");
      const csvRecords: any[] = parseCsv(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      console.log(`  📋 Found ${csvRecords.length} countries in CSV file`);

      countriesData = csvRecords
        .map((record) => ({
          isoCode: record.code || record.iso_code, // Handle different column names
          name: record.name,
          isoAlpha3Code: record.iso_alpha3 || null,
          continent:
            record.continent &&
            ["AF", "AN", "AS", "EU", "NA", "OC", "SA"].includes(
              record.continent,
            )
              ? record.continent
              : null,
        }))
        .filter((c) => c.isoCode && c.name && c.isoCode.length === 2);
    } catch (csvError) {
      console.log(
        "  ℹ️  CSV not found or invalid, using DAT file as primary source",
      );

      // Fallback to DAT file
      const datContent = await fs.readFile(datPath, "utf8");
      const datLines = datContent
        .split("\n")
        .filter((line) => line.trim() !== "");

      countriesData = datLines
        .map((line) => {
          const [name, isoCode, isoAlpha3CodeRaw] = parseDatLine(line);

          if (!isoCode || isoCode.length !== 2 || !name) {
            return null;
          }

          return {
            isoCode: isoCode,
            name: name,
            isoAlpha3Code:
              isoAlpha3CodeRaw && isoAlpha3CodeRaw.length === 3
                ? isoAlpha3CodeRaw
                : null,
            continent: null, // Can be enriched later
          };
        })
        .filter((c) => c !== null);
    }

    if (countriesData.length > 0) {
      await db.insert(countries).values(countriesData).onConflictDoNothing();
      console.log(`  ✅ Seeded ${countriesData.length} countries`);
    } else {
      console.log("  ℹ️ No valid country data found");
    }
  } catch (error) {
    console.error(`  ❌ Failed to seed countries:`, error);
  }
}

async function seedRegionsFromFile() {
  console.log("🌍 Seeding regions from file...");
  const filePath = path.join(__dirname, "./seedfiles/regions.csv");

  if (!(await fileExists(filePath))) {
    console.log("  ❌ Regions file not found. Skipping regions seeding.");
    console.log(`  📍 Expected file: ${filePath}`);
    return;
  }

  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const records: any[] = parseCsv(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Pre-fetch countries for FK validation
    const countriesInDb = await db
      .select({ isoCode: countries.isoCode })
      .from(countries);
    const validCountryCodes = new Set(countriesInDb.map((c) => c.isoCode));

    const regionsData = records
      .map((record) => {
        if (!record.code || !record.name || !record.iso_country) {
          logger.warn(
            `  ⚠️ Skipping invalid region line (missing essential fields): ${JSON.stringify(record)}`,
          );
          return null;
        }
        if (
          record.iso_country.length !== 2 ||
          !validCountryCodes.has(record.iso_country)
        ) {
          logger.warn(
            `  ⚠️ Skipping region '${record.name}' (${record.code}) as its country_iso_code '${record.iso_country}' does not exist in the countries table or is invalid.`,
          );
          return null;
        }

        const validContinents = ["AF", "AN", "AS", "EU", "NA", "OC", "SA"];
        const continent = record.continent?.toUpperCase();

        return {
          code: record.code,
          localCode: record.local_code || null,
          name: record.name,
          continent: validContinents.includes(continent) ? continent : null,
          countryIsoCode: record.iso_country,
          wikipediaLink: record.wikipedia_link || null,
          keywords: record.keywords || null,
        };
      })
      .filter((r) => r !== null);

    if (regionsData.length > 0) {
      await db.insert(regions).values(regionsData).onConflictDoNothing();
      logger.info(`  ✅ Seeded ${regionsData.length} regions`);
    } else {
      logger.info("  ℹ️ No valid region data found");
    }
  } catch (error) {
    logger.error(`  ❌ Failed to seed regions:`, error);
  }
}

async function seedAirlinesFromFile() {
  logger.info("✈️  Seeding airlines from file...");
  const filePath = path.join(__dirname, "./seedfiles/airlines.dat");

  if (!(await fileExists(filePath))) {
    logger.warn("  ❌ Airlines file not found. Skipping airlines seeding.");
    logger.warn(`  📍 Expected file: ${filePath}`);
    return;
  }

  try {
    // Pre-fetch countries for FK mapping
    const countriesInDb = await db
      .select({ name: countries.name, isoCode: countries.isoCode })
      .from(countries);
    const countriesMap = new Map(
      countriesInDb.map((c) => [c.name.toLowerCase(), c.isoCode]),
    );

    const fileContent = await fs.readFile(filePath, "utf8");
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

    const airlinesData = lines
      .map((line) => {
        const parts = parseDatLine(line);
        if (parts.length < 8) {
          logger.warn(
            `  ⚠️ Skipping invalid airline line (not enough parts): ${line}`,
          );
          return null;
        }

        const [
          airlineId,
          name,
          alias,
          iataCodeRaw,
          icaoCodeRaw,
          callsign,
          countryName,
          isActiveRaw,
        ] = parts;

        if (!name) {
          logger.warn(`  ⚠️ Skipping airline line (missing name): ${line}`);
          return null;
        }
        // Removed filter for isActiveRaw !== 'Y' to include all airlines
        // isActive status will be set based on isActiveRaw value

        const iataCode =
          iataCodeRaw && iataCodeRaw.length === 2 ? iataCodeRaw : null;
        const icaoCode =
          icaoCodeRaw && icaoCodeRaw.length === 3 ? icaoCodeRaw : null;

        if (!iataCode && !icaoCode) {
          logger.warn(
            `  ⚠️ Skipping airline '${name}' (missing or invalid IATA/ICAO): ${line}`,
          );
          return null;
        }

        const countryIsoCode = countryName
          ? countriesMap.get(countryName.toLowerCase()) || null
          : null;
        if (!countryIsoCode && countryName) {
          logger.warn(
            `  ⚠️ Country name '${countryName}' for airline '${name}' not found in countries table. Skipping country link.`,
          );
        }

        return {
          id: airlineId
            ? `openflights-${airlineId}`
            : generateId("airline", name.toLowerCase().replace(/\s+/g, "_")),
          name: name,
          alias: alias || null,
          iataCode: iataCode,
          icaoCode: icaoCode,
          callsign: callsign || null,
          countryIsoCode: countryIsoCode,
          isActive: isActiveRaw === "Y", // Store actual active status
          fleetSize: null,
          headquarters: null,
        };
      })
      .filter((a) => a !== null);

    if (airlinesData.length > 0) {
      // Remove duplicates by IATA/ICAO combination
      const uniqueAirlines = [];
      const seenCodes = new Set();

      for (const airline of airlinesData) {
        const codeKey = `${airline.iataCode || ""}-${airline.icaoCode || ""}`;
        if (!seenCodes.has(codeKey)) {
          uniqueAirlines.push(airline);
          seenCodes.add(codeKey);
        } else {
          logger.warn(
            `  ⚠️ Duplicate airline code combination found, skipping: IATA=${airline.iataCode}, ICAO=${airline.icaoCode}, Name=${airline.name}`,
          );
        }
      }

      await db.insert(airline).values(uniqueAirlines).onConflictDoNothing();
      logger.info(
        `  ✅ Seeded ${uniqueAirlines.length} unique active airlines`,
      );
    } else {
      logger.info("  ℹ️ No valid airline data found");
    }
  } catch (error) {
    logger.error(`  ❌ Failed to seed airlines:`, error);
  }
}

async function seedAirportsFromFiles() {
  logger.info("🛫 Seeding airports from dual sources...");
  const airportsCsvPath = path.join(__dirname, "./seedfiles/airports.csv");
  const airportsDatPath = path.join(__dirname, "./seedfiles/airports.dat");

  // Check if at least one source file exists
  const csvExists = await fileExists(airportsCsvPath);
  const datExists = await fileExists(airportsDatPath);

  if (!csvExists && !datExists) {
    logger.warn("  ❌ No airport data files found. Skipping airports seeding.");
    logger.warn(
      `  📍 Expected files: ${airportsCsvPath} or ${airportsDatPath}`,
    );
    return;
  }

  try {
    // Pre-fetch countries and regions for FK validation
    const countriesInDb = await db
      .select({ isoCode: countries.isoCode })
      .from(countries);
    const validCountryCodes = new Set(countriesInDb.map((c) => c.isoCode));

    const regionsInDb = await db
      .select({ code: regions.code, countryIsoCode: regions.countryIsoCode })
      .from(regions);
    const regionsMap = new Map(
      regionsInDb.map((r) => [r.code, r.countryIsoCode]),
    );

    // 1. Build timezone map from airports.dat
    logger.info("  🌍 Building timezone map from OpenFlights data...");
    const timezoneMap = new Map();

    try {
      const airportsDatContent = await fs.readFile(airportsDatPath, "utf8");
      const datLines = airportsDatContent
        .split("\n")
        .filter((line) => line.trim() !== "");

      for (const line of datLines) {
        const parts = parseDatLine(line);
        if (parts.length >= 12) {
          const iata = parts[4];
          const icao = parts[5];
          const tzOlson = parts[11]; // Tz database time zone
          if (tzOlson) {
            if (iata && iata.length === 3) timezoneMap.set(iata, tzOlson);
            if (icao && icao.length === 4) timezoneMap.set(icao, tzOlson);
          }
        }
      }
      logger.info(`  🌍 Found ${timezoneMap.size} timezone entries`);
    } catch (datError) {
      logger.warn(
        "  ⚠️ Could not load timezone data from airports.dat",
        datError,
      );
    }

    // 2. Process main airport data from CSV
    logger.info("  📋 Processing main airport data from CSV...");
    const airportsCsvContent = await fs.readFile(airportsCsvPath, "utf8");
    const records: any[] = parseCsv(airportsCsvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const airportsData = records
      .map((record) => {
        // Filter only on valid IATA codes
        if (!record.iata_code || record.iata_code.length !== 3) {
          logger.debug(
            `  ⏭️ Skipping airport (invalid IATA): ${JSON.stringify(record)}`,
          );
          return null;
        }

        const iataCode = record.iata_code;
        const icaoCode = record.gps_code || record.ident || null;
        const countryIsoCode = record.iso_country;

        // Validate country exists
        if (!validCountryCodes.has(countryIsoCode)) {
          logger.warn(
            `  ⚠️ Airport '${record.name}' (${iataCode}): Country ISO code '${countryIsoCode}' not found in countries table. Skipping airport.`,
          );
          return null;
        }

        // Validate region if provided
        let validRegionCode = null;
        if (record.iso_region && regionsMap.has(record.iso_region)) {
          const regionCountry = regionsMap.get(record.iso_region);
          if (regionCountry === countryIsoCode) {
            validRegionCode = record.iso_region;
          } else {
            logger.warn(
              `  ⚠️ Airport '${record.name}' (${iataCode}): Region code '${record.iso_region}' does not match country '${countryIsoCode}'. Skipping region link.`,
            );
          }
        }

        // Get timezone
        const tzOlson =
          timezoneMap.get(iataCode) ||
          (icaoCode ? timezoneMap.get(icaoCode) : null);
        if (!tzOlson) {
          logger.info(
            `  ℹ️ No timezone found for airport ${iataCode} (${record.name}). Will set timezone to null.`,
          );
        }

        const latitude = parseFloat(record.latitude_deg);
        const longitude = parseFloat(record.longitude_deg);

        if (isNaN(latitude) || isNaN(longitude)) {
          logger.warn(
            `  ⚠️ Airport '${record.name}' (${iataCode}): Invalid coordinates. Skipping.`,
          );
          return null;
        }

        return {
          iataCode: iataCode,
          icaoCode: icaoCode && icaoCode.length === 4 ? icaoCode : null,
          name: record.name || "Unknown Airport",
          city: record.municipality || null,
          stateOrProvince: null, // Could be derived from region data if needed
          regionIsoCode: validRegionCode,
          countryIsoCode: countryIsoCode,
          latitude: latitude.toFixed(7),
          longitude: longitude.toFixed(7),
          altitudeFt: record.elevation_ft
            ? parseInt(record.elevation_ft)
            : null,
          timezoneOlson: tzOlson || null, // Set to null if not found
          airportType: record.type || null,
          scheduledService: record.scheduled_service === "yes", // Reflect actual data
          wikipediaLink: record.wikipedia_link || null,
          homeLink: record.home_link || null,
        };
      })
      .filter((ap) => ap !== null);

    if (airportsData.length > 0) {
      // Remove duplicates by IATA code
      const uniqueAirports = [];
      const seenIataCodes = new Set();

      for (const airport of airportsData) {
        if (!seenIataCodes.has(airport.iataCode)) {
          uniqueAirports.push(airport);
          seenIataCodes.add(airport.iataCode);
        } else {
          logger.warn(
            `  ⚠️ Duplicate airport IATA code found, skipping: ${airport.iataCode} (${airport.name})`,
          );
        }
      }

      logger.info(
        `  ✈️ Prepared ${uniqueAirports.length} unique airport records for seeding.`,
      );

      const BATCH_SIZE = 500; // Insert 500 airports at a time
      let seededCount = 0;

      for (let i = 0; i < uniqueAirports.length; i += BATCH_SIZE) {
        const batch = uniqueAirports.slice(i, i + BATCH_SIZE);
        try {
          await db
            .insert(airport)
            .values(batch)
            .onConflictDoUpdate({
              target: airport.iataCode,
              set: {
                name: sql`excluded.name`,
                icaoCode: sql`excluded.icao_code`,
                city: sql`excluded.city`,
                stateOrProvince: sql`excluded.state_or_province`,
                regionIsoCode: sql`excluded.region_iso_code`,
                countryIsoCode: sql`excluded.country_iso_code`,
                latitude: sql`excluded.latitude`,
                longitude: sql`excluded.longitude`,
                altitudeFt: sql`excluded.altitude_ft`,
                timezoneOlson: sql`excluded.timezone_olson`,
                airportType: sql`excluded.airport_type`,
                scheduledService: sql`excluded.scheduled_service`,
                wikipediaLink: sql`excluded.wikipedia_link`,
                homeLink: sql`excluded.home_link`,
                updatedAt: sql`now()`,
              },
            });
          logger.info(
            `    ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Seeded/Updated ${batch.length} airports.`,
          );
          seededCount += batch.length;
        } catch (batchError) {
          logger.error(
            `    ❌ Error seeding batch starting at index ${i}:`,
            batchError,
          );
          // Optionally re-throw or handle more gracefully
        }
      }
      logger.info(
        `  ✅ Total Seeded/Updated ${seededCount} airports from ${uniqueAirports.length} prepared records.`,
      );
    } else {
      logger.info("  ℹ️ No valid airport data found to seed.");
    }
  } catch (error) {
    logger.error(`  ❌ Failed to seed airports:`, error);
  }
}

async function seedAircraftTypesFromFile() {
  logger.info("✈️  Seeding aircraft types from file...");
  const filePath = path.join(__dirname, "./seedfiles/planes.dat");

  if (!(await fileExists(filePath))) {
    logger.warn(
      "  ❌ Aircraft types file not found. Skipping aircraft types seeding.",
    );
    logger.warn(`  📍 Expected file: ${filePath}`);
    return;
  }

  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

    const aircraftTypesData = lines
      .map((line) => {
        const [name, iataCodeRaw, icaoCodeRaw] = parseDatLine(line);

        logger.debug(
          `  📋 Processing aircraft: name='${name}', iataCode='${iataCodeRaw}', icaoCode='${icaoCodeRaw}'`,
        );

        if (!name || !icaoCodeRaw || icaoCodeRaw.length > 4) {
          logger.warn(
            `  ⚠️ Skipping aircraft type - name='${name}', iataCode='${iataCodeRaw}', icaoCode='${icaoCodeRaw}' (reason: ${!name ? "missing name" : !icaoCodeRaw ? "missing ICAO" : "ICAO too long"})`,
          );
          return null;
        }

        return {
          icaoCode: icaoCodeRaw,
          name: name,
          iataCode: iataCodeRaw && iataCodeRaw.length <= 3 ? iataCodeRaw : null,
        };
      })
      .filter((at) => at !== null);

    if (aircraftTypesData.length > 0) {
      // Remove duplicates by ICAO code
      const uniqueAircraftTypes = [];
      const seenIcaoCodes = new Set();

      for (const acType of aircraftTypesData) {
        if (!seenIcaoCodes.has(acType.icaoCode)) {
          uniqueAircraftTypes.push(acType);
          seenIcaoCodes.add(acType.icaoCode);
        }
      }

      await db
        .insert(aircraftTypes)
        .values(uniqueAircraftTypes)
        .onConflictDoUpdate({
          target: aircraftTypes.icaoCode,
          set: {
            name: sql`EXCLUDED.name`,
            iataCode: sql`EXCLUDED.iata_code`,
          },
        });
      logger.info(
        `  ✅ Seeded/Updated ${uniqueAircraftTypes.length} aircraft types`,
      );
    } else {
      logger.info("  ℹ️ No valid aircraft type data found");
    }
  } catch (error) {
    logger.error(`  ❌ Failed to seed aircraft types:`, error);
  }
}

async function seedRunwaysFromFile() {
  logger.info("🛫 Seeding runways from file...");
  const filePath = path.join(__dirname, "./seedfiles/runways.csv");

  if (!(await fileExists(filePath))) {
    logger.warn("  ❌ Runways file not found. Skipping runways seeding.");
    logger.warn(`  📍 Expected file: ${filePath}`);
    return;
  }

  try {
    // Pre-fetch airports to map airport_ident (ICAO) to IATA
    const airportsInDb = await db
      .select({ iataCode: airport.iataCode, icaoCode: airport.icaoCode })
      .from(airport);
    const airportsMap = new Map();
    for (const ap of airportsInDb) {
      if (ap.icaoCode) {
        airportsMap.set(ap.icaoCode, ap.iataCode);
      }
    }

    const fileContent = await fs.readFile(filePath, "utf8");
    const records: any[] = parseCsv(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const runwaysData = records
      .map((record) => {
        const airportIdent = record.airport_ident;
        const airportIataCode = airportIdent
          ? airportsMap.get(airportIdent)
          : null;

        if (!airportIataCode || !record.id) {
          logger.warn(
            `  ⚠️ Skipping runway (missing id or airport_ident '${airportIdent}' not found in airports table): ${JSON.stringify(record)}`,
          );
          return null;
        }

        return {
          id: parseInt(record.id),
          airportIataCode: airportIataCode,
          lengthFt: record.length_ft ? parseInt(record.length_ft) : null,
          widthFt: record.width_ft ? parseInt(record.width_ft) : null,
          surface: record.surface || null,
          lighted:
            record.lighted === "1" || record.lighted?.toLowerCase() === "yes",
          closed:
            record.closed === "1" || record.closed?.toLowerCase() === "yes",
          leIdent: record.le_ident || null,
          heIdent: record.he_ident || null,
        };
      })
      .filter((r) => r !== null);

    if (runwaysData.length > 0) {
      // Remove duplicates by ID
      const uniqueRunways = [];
      const seenIds = new Set();

      for (const runway of runwaysData) {
        if (!seenIds.has(runway.id)) {
          uniqueRunways.push(runway);
          seenIds.add(runway.id);
        } else {
          logger.warn(`  ⚠️ Duplicate runway ID found, skipping: ${runway.id}`);
        }
      }

      logger.info(
        `  🛫 Prepared ${uniqueRunways.length} unique runway records for seeding.`,
      );
      const BATCH_SIZE = 500; // Insert 500 runways at a time
      let seededCount = 0;

      for (let i = 0; i < uniqueRunways.length; i += BATCH_SIZE) {
        const batch = uniqueRunways.slice(i, i + BATCH_SIZE);
        try {
          await db
            .insert(runways)
            .values(batch)
            .onConflictDoUpdate({
              target: runways.id, // Assuming 'id' is the primary key for 'runways' table
              set: {
                airportIataCode: sql`excluded.airport_iata_code`,
                lengthFt: sql`excluded.length_ft`,
                widthFt: sql`excluded.width_ft`,
                surface: sql`excluded.surface`,
                lighted: sql`excluded.lighted`,
                closed: sql`excluded.closed`,
                leIdent: sql`excluded.le_ident`,
                heIdent: sql`excluded.he_ident`,
                // Add updatedAt if your runways table has it, e.g.:
                // updatedAt: sql`now()`,
              },
            });
          logger.info(
            `    ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Seeded/Updated ${batch.length} runways.`,
          );
          seededCount += batch.length;
        } catch (batchError) {
          logger.error(
            `    ❌ Error seeding runway batch starting at index ${i}:`,
            batchError,
          );
          // Optionally re-throw or handle more gracefully
        }
      }
      logger.info(
        `  ✅ Total Seeded/Updated ${seededCount} runways from ${uniqueRunways.length} prepared records.`,
      );
    } else {
      logger.info("  ℹ️ No valid runway data found to seed.");
    }
  } catch (error) {
    logger.error(`  ❌ Failed to seed runways:`, error);
  }
}

async function seedRoutesFromFile() {
  logger.info("🛫 Seeding routes from file...");
  const filePath = path.join(__dirname, "./seedfiles/routes.dat");

  if (!(await fileExists(filePath))) {
    logger.warn("  ❌ Routes file not found. Skipping routes seeding.");
    logger.warn(`  📍 Expected file: ${filePath}`);
    return;
  }

  try {
    // Pre-fetch airlines and airports for mapping
    const airlinesInDb = await db
      .select({ iataCode: airline.iataCode, icaoCode: airline.icaoCode })
      .from(airline);
    const airlineMap = new Map();
    for (const al of airlinesInDb) {
      if (al.iataCode) airlineMap.set(al.iataCode, al.icaoCode);
      if (al.icaoCode) airlineMap.set(al.icaoCode, al.icaoCode);
    }

    const airportsInDb = await db
      .select({ iataCode: airport.iataCode, icaoCode: airport.icaoCode })
      .from(airport);
    const airportMap = new Map();
    for (const ap of airportsInDb) {
      if (ap.iataCode) airportMap.set(ap.iataCode, ap.iataCode);
      if (ap.icaoCode) airportMap.set(ap.icaoCode, ap.iataCode);
    }

    const fileContent = await fs.readFile(filePath, "utf8");
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

    const routesData = lines
      .map((line) => {
        const parts = parseDatLine(line);
        if (parts.length < 9) {
          logger.warn(
            `  ⚠️ Skipping invalid route line (not enough parts): ${line}`,
          );
          return null;
        }

        const airlineCodeRaw = parts[0];
        const sourceAirportCodeRaw = parts[2];
        const destAirportCodeRaw = parts[4];

        const airlineIcaoCode = airlineMap.get(airlineCodeRaw);
        const sourceAirportIataCode = airportMap.get(sourceAirportCodeRaw);
        const destinationAirportIataCode = airportMap.get(destAirportCodeRaw);

        if (
          !airlineIcaoCode ||
          !sourceAirportIataCode ||
          !destinationAirportIataCode
        ) {
          logger.warn(
            `  ⚠️ Skipping route (missing airline/airport mapping): Airline='${airlineCodeRaw}', Src='${sourceAirportCodeRaw}', Dest='${destAirportCodeRaw}' Line: ${line}`,
          );
          return null;
        }

        const codeshare = parts[6] === "Y";
        const stops = parseInt(parts[7] || "0");
        if (isNaN(stops)) {
          logger.warn(
            `  ⚠️ Skipping route (invalid stops value '${parts[7]}'): ${line}`,
          );
          return null;
        }

        const equipment = parts[8] || null;

        return {
          airlineIcaoCode,
          sourceAirportIataCode,
          destinationAirportIataCode,
          codeshare,
          stops,
          equipment,
        };
      })
      .filter((r) => r !== null);

    if (routesData.length > 0) {
      // Process in batches
      const batchSize = 500;
      let totalProcessed = 0;

      for (let i = 0; i < routesData.length; i += batchSize) {
        const batch = routesData.slice(i, i + batchSize);
        try {
          await db
            .insert(routes)
            .values(batch)
            .onConflictDoUpdate({
              target: [
                routes.airlineIcaoCode,
                routes.sourceAirportIataCode,
                routes.destinationAirportIataCode,
              ],
              set: {
                updatedAt: new Date(),
              },
            });
          totalProcessed += batch.length;
        } catch (batchError) {
          logger.error(`  ❌ Error processing batch:`, batchError);
        }
      }
      logger.info(
        `  ✅ Processed ${totalProcessed} routes from ${routesData.length} total`,
      );
    } else {
      logger.info("  ℹ️ No valid route data found");
    }
  } catch (error) {
    logger.error(`  ❌ Failed to seed routes:`, error);
  }
}

// ============================================================================
// APPLICATION SETUP SEEDING FUNCTIONS (Required MVP Components)
// ============================================================================

async function seedProviders() {
  console.log("🏢 Seeding providers...");

  for (const providerData of providerSetupData) {
    try {
      const existing = await db
        .select()
        .from(provider)
        .where(eq(provider.slug, providerData.slug))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(provider).values(providerData);
        console.log(`  ✅ Created provider: ${providerData.name}`);
      } else {
        console.log(`  ⏭️  Provider already exists: ${providerData.name}`);
      }
    } catch (error) {
      console.error(
        `  ❌ Failed to create provider ${providerData.name}:`,
        error,
      );
    }
  }
}

async function seedProviderProducts() {
  console.log("🛡️  Seeding provider products...");

  for (const productData of providerProductSetupData) {
    try {
      const existing = await db
        .select()
        .from(providerProduct)
        .where(
          and(
            eq(providerProduct.providerId, productData.providerId),
            eq(providerProduct.name, productData.name),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(providerProduct).values(productData);
        console.log(`  ✅ Created product: ${productData.name}`);
      } else {
        console.log(`  ⏭️  Product already exists: ${productData.name}`);
      }
    } catch (error) {
      console.error(
        `  ❌ Failed to create product ${productData.name}:`,
        error,
      );
    }
  }
}

async function seedFlightDataSources() {
  logger.info("📡 Seeding flight data sources...");

  for (const sourceData of flightDataSourceSetupData) {
    try {
      const existing = await db
        .select()
        .from(flightDataSource)
        .where(eq(flightDataSource.name, sourceData.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(flightDataSource).values(sourceData);
        logger.info(`  ✅ Created data source: ${sourceData.name}`);
      } else {
        logger.info(`  ⏭️  Data source already exists: ${sourceData.name}`);
      }
    } catch (error) {
      logger.error(
        `  ❌ Failed to create data source ${sourceData.name}:`,
        error,
      );
    }
  }
}

async function seedUsers() {
  logger.info("👤 Seeding admin user...");

  try {
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, adminUserSetupData.email))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(user).values(adminUserSetupData);
      logger.info(`  ✅ Created admin user: ${adminUserSetupData.email}`);
    } else {
      logger.info(
        `  ⏭️  Admin user already exists: ${adminUserSetupData.email}`,
      );
    }
  } catch (error) {
    logger.error(`  ❌ Failed to create admin user:`, error);
  }
}

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

async function seedSystemConfiguration() {
  logger.info("⚙️ Seeding system configuration...");

  // Define all system configurations in a single array for better maintainability
  const configs = [
    // Platform Wallets & Finance
    {
      key: "PLATFORM_REVENUE_WALLET_ADDRESS",
      value:
        process.env.PLATFORM_REVENUE_WALLET_ADDRESS ||
        "placeholder_platform_wallet_address_not_set_in_env",
      description:
        "Main wallet address for triggerr platform revenue collection.",
      category: "FINANCE" as const,
      isEditableRuntime: false,
      isSecret: true,
      order: 10,
    },
    {
      key: "PLATFORM_REVENUE_SHARE_PERCENTAGE",
      value: "10.00",
      description:
        "Default platform revenue share percentage for all transactions.",
      category: "FINANCE" as const,
      isEditableRuntime: true,
      isSecret: false,
      order: 20,
    },
    {
      key: "DEFAULT_PAYOUT_CURRENCY",
      value: "USD",
      description: "Default currency for all payouts.",
      category: "FINANCE" as const,
      isEditableRuntime: true,
      isSecret: false,
      order: 30,
    },

    // Policy & Quoting
    {
      key: "DEFAULT_QUOTE_EXPIRY_MINUTES",
      value: "30",
      description: "Default expiration time in minutes for generated quotes.",
      category: "QUOTING" as const,
      isEditableRuntime: true,
      isSecret: false,
      order: 110,
    },
    {
      key: "MAX_POLICY_DURATION_DAYS",
      value: "30",
      description: "Maximum duration in days for any insurance policy.",
      category: "POLICIES" as const,
      isEditableRuntime: true,
      isSecret: false,
      order: 120,
    },

    // Parametric Triggers (Flight Delay Insurance)
    {
      key: "FLIGHT_DELAY_TRIGGER_MINUTES",
      value: "60",
      description:
        "Minimum flight delay in minutes to trigger automatic payout.",
      category: "PARAMETRIC_TRIGGERS" as const,
      isEditableRuntime: true,
      isSecret: false,
      order: 210,
    },
    {
      key: "AUTOMATIC_PAYOUT_DELAY_MINUTES",
      value: "15",
      description:
        "Delay in minutes after a qualifying event before processing automatic payouts.",
      category: "PARAMETRIC_TRIGGERS" as const,
      isEditableRuntime: true,
      isSecret: false,
      order: 220,
    },
    {
      key: "FLIGHT_DATA_VERIFICATION_WINDOW_HOURS",
      value: "24",
      description:
        "Time window in hours after scheduled arrival to verify flight data for payouts.",
      category: "PARAMETRIC_TRIGGERS" as const,
      isEditableRuntime: true,
      isSecret: false,
      order: 230,
    },

    // System & Support
    {
      key: "DEFAULT_INSURANCE_TERMS_URL",
      value: "https://triggerr.com/terms/insurance",
      description: "URL to the default insurance terms and conditions.",
      category: "LEGAL" as const,
      isEditableRuntime: true,
      isSecret: false,
      order: 310,
    },
    {
      key: "SUPPORT_EMAIL",
      value: "support@triggerr.com",
      description: "Default support email address for customer inquiries.",
      category: "SUPPORT" as const,
      isEditableRuntime: true,
      isSecret: false,
      order: 320,
    },
    {
      key: "ESCROW_EXPIRY_DAYS",
      value: "90",
      description: "Default expiry period in days for escrow contracts.",
      category: "PAYGO" as const,
      isEditableRuntime: false,
      isSecret: false,
      order: 410,
    },
  ];

  // Sort configurations by order
  configs.sort((a, b) => a.order - b.order);

  // Process each configuration
  for (const config of configs) {
    try {
      const existingConfig = await db
        .select()
        .from(systemConfiguration)
        .where(eq(systemConfiguration.key, config.key))
        .limit(1);

      if (existingConfig.length === 0) {
        // Remove order before inserting as it's not a column in the table
        const { order, ...configToInsert } = config;
        await db.insert(systemConfiguration).values(configToInsert);
        logger.info(`  ✅ Created system configuration: ${config.key}`);
      } else {
        logger.info(`  ⏭️ System configuration already exists: ${config.key}`);
      }
    } catch (error) {
      logger.error(
        `  ❌ Failed to seed system configuration ${config.key}:`,
        error,
      );
    }
  }
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  const startTime = Date.now();
  logger.info(`🌱 Starting comprehensive database seeding...`);
  logger.info(`📋 Seeding reference data and MVP components\n`);

  try {
    // Phase 1: Reference data from files (respecting FK dependencies)
    logger.info("📍 Phase 1: Reference Data Seeding");
    await seedCountriesFromFiles(); // No dependencies
    await seedRegionsFromFile(); // Depends on countries
    await seedAirlinesFromFile(); // Depends on countries
    await seedAirportsFromFiles(); // Depends on countries, regions
    await seedAircraftTypesFromFile(); // No dependencies
    await seedRunwaysFromFile(); // Depends on airports
    await seedRoutesFromFile(); // Depends on airlines, airports

    logger.info("\n📍 Phase 2: Application Data Seeding");
    // Phase 2: Application-specific data
    await seedUsers(); // No dependencies
    await seedProviders(); // No dependencies
    await seedProviderProducts(); // Depends on providers
    await seedFlightDataSources(); // No dependencies

    // Seed System Configuration
    await seedSystemConfiguration();

    // Phase 3: Application setup complete - all reference data loaded from files

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`\n✅ Database seeding completed successfully in ${duration}s`);
    logger.info(`🎯 Comprehensive data foundation ready:`);
    logger.info(`  • Countries, regions, and geographical data`);
    logger.info(`  • Airlines with country associations`);
    logger.info(`  • Airports with timezone and geographical data`);
    logger.info(`  • Aircraft types and runway information`);
    logger.info(`  • Route data connecting airlines and airports`);
    logger.info(
      `  • Core providers (triggerr Direct, Preterag Financial, AeroAssure) with products`,
    );
    logger.info(`  • Flight data source configurations`);
    logger.info(`  • Platform revenue wallet configuration`);
    logger.info(`  • Admin user`);

    logger.info(`🚀 Next steps:`);
    logger.info(`  1. Verify seeded data integrity`);
    logger.info(`  2. Set up environment variables for API keys`);
    logger.info(`  3. Test quote generation with real data`);
    logger.info(`  4. Begin historical data collection`);

    // Log completion of all seeding steps if no errors
    logger.info("🎉 All data seeding steps completed successfully!");
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.error(`\n❌ Database seeding failed after ${duration}s`);
    logger.error(`Error details:`, error);
    process.exit(1);
  }

  process.exit(0);
}

// ============================================================================
// EXECUTION
// ============================================================================

// Only run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Unhandled error during seeding:", error);
    process.exit(1);
  });
}

// Export for potential reuse
export {
  seedCountriesFromFiles,
  seedRegionsFromFile,
  seedAirlinesFromFile,
  seedAirportsFromFiles,
  seedAircraftTypesFromFile,
  seedRunwaysFromFile,
  seedRoutesFromFile,
  seedProviders,
  seedProviderProducts,
  seedFlightDataSources,
  seedUsers,
  main as seedDatabase,
};
