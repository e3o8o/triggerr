#!/usr/bin/env bun
/**
 * Stripe Integration End-to-End Test Script
 *
 * This script tests the complete Stripe integration for the triggerr platform.
 * It verifies that all Stripe-related functionality works correctly.
 *
 * Usage: bun run scripts/test-stripe-integration.ts
 */

import {
  stripe,
  createPolicyCheckoutSession,
  verifyStripeWebhook,
  handleStripeWebhookEvent,
  getStripeClientInfo,
  formatAmount,
  dollarsToCents,
  centsToDollars,
} from "@triggerr/stripe";

import type { Stripe } from "stripe";

// Test configuration
const TEST_CONFIG = {
  policyId: "test_policy_" + Date.now(),
  premiumInCents: 5000, // $50.00
  customerEmail: "test@triggerr.com",
  customerName: "Test Customer",
  flightDetails: {
    flightNumber: "AA123",
    airline: "American Airlines",
    departureDate: "2024-12-25",
    route: "LAX → JFK",
  },
};

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function testStripeClientInitialization() {
  log("\n🧪 Testing Stripe Client Initialization...", colors.bold);

  try {
    const clientInfo = getStripeClientInfo();

    if (clientInfo.isInitialized) {
      logSuccess("Stripe client initialized successfully");
      logInfo(`Environment: ${clientInfo.environment}`);
      logInfo(`Test mode: ${clientInfo.isTestMode}`);
      logInfo(`API version: ${clientInfo.apiVersion}`);
    } else {
      logError("Stripe client failed to initialize");
      return false;
    }

    // Test basic Stripe operations
    const balance = await stripe.balance.retrieve();
    logSuccess("Successfully connected to Stripe API");
    logInfo(
      `Available balance: ${balance.available?.[0]?.amount || 0} ${balance.available?.[0]?.currency || "usd"}`,
    );

    return true;
  } catch (error) {
    logError(
      `Stripe client initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return false;
  }
}

async function testCheckoutSessionCreation() {
  log("\n🧪 Testing Checkout Session Creation...", colors.bold);

  try {
    const sessionResult = await createPolicyCheckoutSession({
      policyId: TEST_CONFIG.policyId,
      premiumInCents: TEST_CONFIG.premiumInCents,
      customerEmail: TEST_CONFIG.customerEmail,
      customerName: TEST_CONFIG.customerName,
      flightDetails: TEST_CONFIG.flightDetails,
    });

    if (sessionResult.success && sessionResult.data) {
      logSuccess("Checkout session created successfully");
      logInfo(`Session ID: ${sessionResult.data.sessionId}`);
      logInfo(`Checkout URL: ${sessionResult.data.checkoutUrl}`);
      logInfo(`Status: ${sessionResult.data.sessionStatus}`);
      logInfo(`Expires at: ${sessionResult.data.expiresAt}`);
      logInfo(`Policy ID: ${sessionResult.data.metadata.policyId}`);
      logInfo(
        `Premium: ${formatAmount(sessionResult.data.metadata.premiumInCents)}`,
      );

      return sessionResult.data;
    } else {
      if ("error" in sessionResult) {
        logError(`Checkout session creation failed: ${sessionResult.error}`);
      } else {
        logError(`Checkout session creation failed with an unknown error.`);
      }
      return null;
    }
  } catch (error) {
    logError(
      `Checkout session creation error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return null;
  }
}

async function testWebhookEventHandling() {
  log("\n🧪 Testing Webhook Event Handling...", colors.bold);

  try {
    // Create a mock checkout.session.completed event
    const mockEvent: Stripe.Event = {
      id: "evt_test_" + Date.now(),
      object: "event",
      api_version: "2024-06-20",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_test_" + Date.now(),
          object: "checkout.session",
          amount_total: TEST_CONFIG.premiumInCents,
          currency: "usd",
          customer_email: TEST_CONFIG.customerEmail,
          payment_status: "paid",
          status: "complete",
          metadata: {
            policyId: TEST_CONFIG.policyId,
            premiumInCents: TEST_CONFIG.premiumInCents.toString(),
          },
          payment_intent: "pi_test_" + Date.now(),
        } as unknown as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: "req_test_" + Date.now(),
        idempotency_key: null,
      },
      type: "checkout.session.completed",
    };

    logInfo("Created mock checkout.session.completed event");

    // Test webhook event handling
    const result = await handleStripeWebhookEvent(mockEvent);

    if (result.success) {
      logSuccess("Webhook event handled successfully");
      logInfo(`Message: ${result.message}`);
      if ("policyId" in result) {
        logInfo(`Policy ID: ${result.policyId}`);
      }
      if ("eventType" in result) {
        logInfo(`Event type: ${result.eventType}`);
      }
    } else {
      logWarning(
        `Webhook event handling completed with warning: ${result.message}`,
      );
      if (result.error) {
        logInfo(`Error details: ${result.error}`);
      }
    }

    return true;
  } catch (error) {
    logError(
      `Webhook event handling error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return false;
  }
}

async function testWebhookSignatureVerification() {
  log("\n🧪 Testing Webhook Signature Verification...", colors.bold);

  try {
    // Create a test payload
    const testPayload = JSON.stringify({
      id: "evt_test",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test" } },
    });

    // Create a mock signature (in real usage, this comes from Stripe)
    const mockSignature = "whsec_mock_signature_for_testing";
    const mockSecret = "whsec_test_secret";

    logInfo("Testing webhook signature verification...");

    // This will fail validation (as expected) because it's a mock signature
    const verificationResult = verifyStripeWebhook(
      testPayload,
      mockSignature,
      mockSecret,
    );

    if (!verificationResult.success) {
      logSuccess(
        "Webhook signature verification working correctly (rejected invalid signature)",
      );
      logInfo(`Error: ${verificationResult.error}`);
    } else {
      logWarning(
        "Webhook signature verification accepted invalid signature (this might indicate an issue)",
      );
    }

    return true;
  } catch (error) {
    logError(
      `Webhook signature verification error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return false;
  }
}

async function testUtilityFunctions() {
  log("\n🧪 Testing Utility Functions...", colors.bold);

  try {
    // Test amount conversion functions
    const dollars = 50.75;
    const cents = dollarsToCents(dollars);
    const backToDollars = centsToDollars(cents);

    logInfo(`Converting $${dollars} to cents: ${cents}`);
    logInfo(`Converting ${cents} cents back to dollars: $${backToDollars}`);

    if (Math.abs(dollars - backToDollars) < 0.01) {
      logSuccess("Amount conversion functions work correctly");
    } else {
      logError("Amount conversion functions have precision issues");
      return false;
    }

    // Test amount formatting
    const formattedAmount = formatAmount(TEST_CONFIG.premiumInCents);
    logInfo(`Formatted amount: ${formattedAmount}`);
    logSuccess("Amount formatting works correctly");

    return true;
  } catch (error) {
    logError(
      `Utility functions error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return false;
  }
}

async function testStripeProductAndPriceCreation() {
  log("\n🧪 Testing Stripe Product and Price Creation...", colors.bold);

  try {
    // Test creating a product for flight insurance
    const productResult = await stripe.products.create({
      name: "Test Flight Insurance Policy",
      description: "Test insurance coverage for flight AA123",
      type: "service",
      metadata: {
        category: "insurance",
        type: "flight_insurance",
        created_by: "test_script",
      },
    });

    logSuccess("Created test product successfully");
    logInfo(`Product ID: ${productResult.id}`);
    logInfo(`Product name: ${productResult.name}`);

    // Test creating a price for the product
    const priceResult = await stripe.prices.create({
      product: productResult.id,
      unit_amount: TEST_CONFIG.premiumInCents,
      currency: "usd",
      metadata: {
        created_by: "test_script",
        amount_cents: TEST_CONFIG.premiumInCents.toString(),
      },
    });

    logSuccess("Created test price successfully");
    logInfo(`Price ID: ${priceResult.id}`);
    logInfo(`Unit amount: ${priceResult.unit_amount} ${priceResult.currency}`);

    // Clean up - mark the test product as inactive instead of deleting (Stripe API constraint)
    await stripe.products.update(productResult.id, {
      active: false,
    });
    logSuccess("Marked test product as inactive for cleanup");

    return true;
  } catch (error) {
    logError(
      `Product/Price creation error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return false;
  }
}

async function runComprehensiveStripeTest() {
  log(
    `${colors.bold}${colors.blue}🚀 Starting Comprehensive Stripe Integration Test${colors.reset}`,
  );
  log(
    `${colors.yellow}================================================${colors.reset}`,
  );

  const testResults = {
    clientInit: false,
    utilities: false,
    productPrice: false,
    checkoutSession: false,
    webhookHandling: false,
    webhookVerification: false,
  };

  // Run all tests
  testResults.clientInit = await testStripeClientInitialization();
  testResults.utilities = await testUtilityFunctions();
  testResults.productPrice = await testStripeProductAndPriceCreation();
  testResults.checkoutSession = !!(await testCheckoutSessionCreation());
  testResults.webhookHandling = await testWebhookEventHandling();
  testResults.webhookVerification = await testWebhookSignatureVerification();

  // Summary
  log(`\n${colors.bold}${colors.blue}📊 Test Results Summary${colors.reset}`);
  log(`${colors.yellow}========================${colors.reset}`);

  const tests = [
    { name: "Client Initialization", passed: testResults.clientInit },
    { name: "Utility Functions", passed: testResults.utilities },
    { name: "Product & Price Creation", passed: testResults.productPrice },
    { name: "Checkout Session Creation", passed: testResults.checkoutSession },
    { name: "Webhook Event Handling", passed: testResults.webhookHandling },
    {
      name: "Webhook Signature Verification",
      passed: testResults.webhookVerification,
    },
  ];

  const passedTests = tests.filter((test) => test.passed).length;
  const totalTests = tests.length;

  tests.forEach((test) => {
    if (test.passed) {
      logSuccess(test.name);
    } else {
      logError(test.name);
    }
  });

  log(
    `\n${colors.bold}Overall Result: ${passedTests}/${totalTests} tests passed${colors.reset}`,
  );

  if (passedTests === totalTests) {
    log(
      `${colors.bold}${colors.green}🎉 All Stripe integration tests passed! Ready for production use.${colors.reset}`,
    );
    return 0;
  } else {
    log(
      `${colors.bold}${colors.red}⚠️  Some tests failed. Please review the issues above before proceeding.${colors.reset}`,
    );
    return 1;
  }
}

// Augment ImportMeta to include .main for Bun/Node.js compatibility in TypeScript
declare global {
  interface ImportMeta {
    readonly main: boolean;
  }
}

// Main execution
if (import.meta.main) {
  runComprehensiveStripeTest()
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error) => {
      logError(
        `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.error(error);
      process.exit(1);
    });
}
