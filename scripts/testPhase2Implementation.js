const dotenv = require("dotenv");
const path = require("path");
const { Pool } = require("pg");
const { drizzle } = require("drizzle-orm/node-postgres");

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Import necessary services and components from the Triggerr codebase
// Note: These paths assume the script is run from the root of the triggerr project
const { createLogger } = require("../packages/core/src/logging/logger");
const {
  DataRouter,
} = require("../packages/aggregators/data-router/dist/router");
const {
  FlightAggregator,
} = require("../packages/aggregators/flight-aggregator/dist/aggregator");
const {
  WeatherAggregator,
} = require("../packages/aggregators/weather-aggregator/dist/aggregator");
const {
  FlightAwareClient,
} = require("../packages/integrations/flightaware-adapter/dist/client");
const {
  OpenSkyClient,
} = require("../packages/integrations/opensky-adapter/dist/client");
const {
  AviationStackClient,
} = require("../packages/integrations/aviationstack-adapter/dist/client");
const {
  GoogleWeatherClient,
} = require("../packages/integrations/google-weather-adapter/dist/client");
const {
  QuoteService,
} = require("../packages/services/quote-engine/dist/quote-service");
const {
  PolicyEngine,
} = require("../packages/services/policy-engine/dist/policy-engine");
const {
  EscrowManager,
  EscrowEngineFactory,
} = require("../packages/services/escrow-engine/dist/escrow-engine");
const {
  BlockchainServiceRegistry,
} = require("../packages/blockchain/service-registry/dist");
const {
  CacheManager,
} = require("../packages/core/src/utils/cache-manager");
const schema = require("../packages/core/src/database/schema");

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const TEST_CONFIG = {
  flightNumber: "BT318", // Air Baltic flight BT318
  date: new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0], // Tomorrow's date
  coverageType: "DELAY_60",
  coverageAmount: "100.00",
  userId: "user_test_phase2_001", // A test user ID
  // Use a pre-funded test wallet for the purchase simulation
  buyerWalletAddress: process.env.PLATFORM_REVENUE_WALLET_ADDRESS,
  buyerPrivateKey: process.env.PLATFORM_REVENUE_WALLET_PRIVATE_KEY,
};

class Phase2Tester {
  constructor() {
    this.logger = createLogger("Phase2-Tester");
    this.results = {};
    this.services = this.initializeServices();
    this.db = this.initializeDatabase();
  }

  initializeDatabase() {
    this.logger.info("Initializing database connection...");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    return drizzle(pool, { schema });
  }

  initializeServices() {
    this.logger.info("Initializing all required services...");

    // 1. API Clients
    const apiClients = {
      flightAware: new FlightAwareClient(process.env.FLIGHTAWARE_API_KEY),
      openSky: new OpenSkyClient(
        process.env.OPENSKY_USERNAME,
        process.env.OPENSKY_PASSWORD,
      ),
      aviationStack: new AviationStackClient(
        process.env.AVIATIONSTACK_API_KEY,
      ),
      googleWeather: new GoogleWeatherClient(
        process.env.GOOGLE_WEATHER_API_KEY,
      ),
    };

    // 2. Aggregators
    const flightCache = new CacheManager(5000); // Short TTL for testing
    const weatherCache = new CacheManager(5000);
    const flightAggregator = new FlightAggregator(apiClients, {
      cacheManager: flightCache,
    });
    const weatherAggregator = new WeatherAggregator(apiClients, {
      cacheManager: weatherCache,
    });

    // 3. Data Router
    const dataRouter = new DataRouter(flightAggregator, weatherAggregator);

    // 4. Quote Engine
    const quoteService = new QuoteService(dataRouter, this.logger);

    // 5. Blockchain & Escrow Services
    const blockchainRegistry = new BlockchainServiceRegistry();
    const escrowEngineFactory = new EscrowEngineFactory(blockchainRegistry);
    const escrowManager = new EscrowManager(escrowEngineFactory);

    // 6. Policy Engine
    const policyEngine = new PolicyEngine(escrowManager, this.logger);

    return {
      quoteService,
      policyEngine,
    };
  }

  async runAllTests() {
    this.logger.info("🚀 STARTING PHASE 2 END-TO-END TEST 🚀");
    let quoteId = null;
    let policyDetails = null;

    try {
      // Step 1: Generate a valid quote
      this.logger.info("\n--- STEP 1: TESTING QUOTE GENERATION ---");
      const quoteResponse = await this.testQuoteGeneration();
      if (
        !quoteResponse ||
        !quoteResponse.quoteId ||
        !quoteResponse.quotes.length
      ) {
        throw new Error("Quote generation failed to return a valid quote.");
      }
      quoteId = quoteResponse.quoteId;
      this.results.quoteGeneration = {
        success: true,
        quoteId,
        premium: quoteResponse.quotes[0].premium,
      };
      this.logger.info(
        `✅ Quote Generation SUCCEEDED. Quote ID: ${quoteId}`,
      );

      // Step 2: Purchase a policy using the quote
      this.logger.info("\n--- STEP 2: TESTING POLICY PURCHASE ---");
      policyDetails = await this.testPolicyPurchase(quoteId);
      if (
        !policyDetails ||
        !policyDetails.policyId ||
        !policyDetails.transactionHash
      ) {
        throw new Error("Policy purchase failed to return valid details.");
      }
      this.results.policyPurchase = { success: true, ...policyDetails };
      this.logger.info(
        `✅ Policy Purchase SUCCEEDED. Policy ID: ${policyDetails.policyId}`,
      );
      this.logger.info(`🔗 Transaction Hash: ${policyDetails.transactionHash}`);

      // Step 3: Verify the database state
      this.logger.info("\n--- STEP 3: VERIFYING DATABASE STATE ---");
      await this.verifyDatabaseState(policyDetails.policyId, quoteId);
      this.results.databaseVerification = { success: true };
      this.logger.info("✅ Database Verification SUCCEEDED.");
    } catch (error) {
      this.logger.error("❌ A critical error occurred during the test run.");
      this.logger.error(error.message, error.stack);
      this.results.error = { success: false, message: error.message };
    } finally {
      this.printSummary();
      // Ensure the process exits to close the DB connection
      process.exit(this.results.error ? 1 : 0);
    }
  }

  async testQuoteGeneration() {
    const request = {
      flightNumber: TEST_CONFIG.flightNumber,
      departureDate: TEST_CONFIG.date,
      coverageType: TEST_CONFIG.coverageType,
      coverageAmount: TEST_CONFIG.coverageAmount,
      userId: TEST_CONFIG.userId,
    };
    this.logger.info("Requesting quote with parameters:", request);
    return this.services.quoteService.generateQuote(request);
  }

  async testPolicyPurchase(quoteId) {
    const request = {
      quoteId,
      userId: TEST_CONFIG.userId,
      buyerWalletAddress: TEST_CONFIG.buyerWalletAddress,
      buyerPrivateKey: TEST_CONFIG.buyerPrivateKey,
      chain: "PAYGO",
    };
    this.logger.info("Purchasing policy with parameters:", {
      ...request,
      buyerPrivateKey: "[REDACTED]",
    });
    return this.services.policyEngine.createPolicyFromQuote(request);
  }

  async verifyDatabaseState(policyId, quoteId) {
    this.logger.info(`Querying database for policy: ${policyId}`);
    const policyRecord = await this.db.query.policy.findFirst({
      where: (policy, { eq }) => eq(policy.id, policyId),
    });

    if (!policyRecord) {
      throw new Error(`DATABASE_VERIFICATION_FAILED: Policy ${policyId} not found.`);
    }
    if (policyRecord.status !== "ACTIVE") {
      throw new Error(
        `DATABASE_VERIFICATION_FAILED: Policy ${policyId} has incorrect status. Expected 'ACTIVE', got '${policyRecord.status}'.`,
      );
    }
    this.logger.info(
      `✔ Policy record found and status is ACTIVE.`,
    );

    this.logger.info(`Querying database for quote: ${quoteId}`);
    const quoteRecord = await this.db.query.quote.findFirst({
      where: (quote, { eq }) => eq(quote.id, quoteId),
    });

    if (!quoteRecord) {
      throw new Error(`DATABASE_VERIFICATION_FAILED: Quote ${quoteId} not found.`);
    }
    if (quoteRecord.status !== "ACCEPTED") {
      throw new Error(
        `DATABASE_VERIFICATION_FAILED: Quote ${quoteId} has incorrect status. Expected 'ACCEPTED', got '${quoteRecord.status}'.`,
      );
    }
    this.logger.info(`✔ Quote record found and status is ACCEPTED.`);
  }

  printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 PHASE 2 TEST SUMMARY 📊");
    console.log("=".repeat(60));

    const logResult = (name, result) => {
      if (result) {
        console.log(`✅ ${name}: SUCCEEDED`);
        if (result.quoteId) console.log(`   - Quote ID: ${result.quoteId}`);
        if (result.policyId) console.log(`   - Policy ID: ${result.policyId}`);
        if (result.transactionHash)
          console.log(`   - Tx Hash: ${result.transactionHash}`);
      } else {
        console.log(`❌ ${name}: FAILED OR NOT RUN`);
      }
    };

    logResult("Quote Generation", this.results.quoteGeneration);
    logResult("Policy Purchase", this.results.policyPurchase);
    logResult("Database Verification", this.results.databaseVerification);

    if (this.results.error) {
      console.log("\n❌ TEST RUN FAILED WITH CRITICAL ERROR:");
      console.log(`   - ${this.results.error.message}`);
      console.log("\n" + "=".repeat(60));
      console.log("🔥 Please review the logs above to diagnose the failure. 🔥");
    } else {
      console.log("\n" + "=".repeat(60));
      console.log("🎉 ALL PHASE 2 TESTS PASSED SUCCESSFULLY! 🎉");
    }
  }
}

const tester = new Phase2Tester();
tester
  .runAllTests()
  .catch(e => {
    console.error("Unhandled exception in test runner:", e);
    process.exit(1);
  });
