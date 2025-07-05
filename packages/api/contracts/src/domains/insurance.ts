// ===========================================================================
// INSURANCE DOMAIN BARREL - API CONTRACTS
//
// This file provides clean, domain-specific exports for all insurance-related
// DTOs, validators, and utilities by first importing them locally and then
// re-exporting them.
// ===========================================================================

// === STEP 1: IMPORT DTOS & TYPES FOR LOCAL USE AND RE-EXPORT ===
import type {
  // Basic Types
  InsuranceProductType,
  CoverageTier,
  ClaimStatus,
  PolicyStatus,
  PaymentMethod,

  // Product & Coverage Types
  InsuranceProduct,
  CoverageTierDefinition,

  // Quote Request/Response Types
  InsuranceQuoteRequest,
  FlightDetailsForQuote,
  CoverageRequest,
  PassengerDetails,
  InsuranceQuoteResponse,
  QuoteCoverage,

  // Premium & Payout Types
  PremiumBreakdown,
  PremiumComponent,
  PayoutStructure,
  PayoutTier,

  // Risk Assessment Types
  FlightRiskAssessment,
  ProviderInfo,

  // Policy Purchase Types
  PolicyPurchaseRequest,
  PaymentDetails,
  CustomerInfo,
  EmergencyContact,
  TravelPreferences,
  NotificationPreferences,
  CommunicationPreferences,
  PolicyPurchaseResponse,
  PolicyCoverage,
  PaymentConfirmation,
  EscrowInfo,
  PolicyDocument,

  // Policy Tracking Types
  PolicyTrackingRequest,
  PolicyTrackingResponse,
  PolicyDetails,
  CustomerSummary,
  ClaimSummary,
  FlightStatus,
  PolicyEvent,

  // Products & Cart Types
  InsuranceProductsResponse,
  ProductCategory,
  AddToCartRequest,
  AddToCartResponse,
  CartItem,
  AnonymousCartResponse,
} from "../dtos/insurance";

// === STEP 2: IMPORT VALIDATORS FOR LOCAL USE AND RE-EXPORT ===
import {
  // Enum Validators
  insuranceProductTypeSchema,
  coverageTierSchema,
  claimStatusSchema,
  paymentMethodSchema,
  payoutTypeSchema,

  // Base Schema Validators
  flightDetailsForQuoteSchema,
  coverageRequestSchema,
  passengerDetailsSchema,
  payoutTierSchema,
  payoutStructureSchema,
  premiumComponentSchema,
  premiumBreakdownSchema,
  flightRiskAssessmentSchema,
  providerInfoSchema,
  quoteCoverageSchema,
  insuranceProductSchema,

  // Request Validators
  insuranceQuoteRequestSchema,
  policyPurchaseRequestSchema,
  policyTrackingRequestSchema,
  addToCartRequestSchema,
  insuranceProductsListRequestSchema,

  // Response Validators
  insuranceQuoteResponseSchema,
  policyPurchaseResponseSchema,
  policyTrackingResponseSchema,
  addToCartResponseSchema,
  insuranceProductsResponseSchema,

  // Validation Functions
  validateInsuranceQuoteRequest,
  validatePolicyPurchaseRequest,
  validatePolicyTrackingRequest,
  validateAddToCartRequest,
  safeValidateInsuranceQuoteRequest,
  safeValidatePolicyPurchaseRequest,
} from "../validators/insurance";

// Import shared schemas
import { policyStatusSchema } from "../validators/common";

// Import Zod-inferred types
import type {
  InsuranceQuoteRequest as ZodInsuranceQuoteRequest,
  InsuranceQuoteResponse as ZodInsuranceQuoteResponse,
  PolicyPurchaseRequest as ZodPolicyPurchaseRequest,
  PolicyPurchaseResponse as ZodPolicyPurchaseResponse,
  PolicyTrackingRequest as ZodPolicyTrackingRequest,
  PolicyTrackingResponse as ZodPolicyTrackingResponse,
  AddToCartRequest as ZodAddToCartRequest,
  AddToCartResponse as ZodAddToCartResponse,
  InsuranceProduct as ZodInsuranceProduct,
  InsuranceProductsResponse as ZodInsuranceProductsResponse,
  FlightDetailsForQuote as ZodFlightDetailsForQuote,
  CoverageRequest as ZodCoverageRequest,
  PremiumBreakdown as ZodPremiumBreakdown,
  FlightRiskAssessment as ZodFlightRiskAssessment,
  ProviderInfo as ZodProviderInfo,
  InsuranceProductType as ZodInsuranceProductType,
  CoverageTier as ZodCoverageTier,
  ClaimStatus as ZodClaimStatus,
  PaymentMethod as ZodPaymentMethod,
  PayoutType as ZodPayoutType,
} from "../validators/insurance";

// === STEP 3: RE-EXPORT ALL IMPORTED ITEMS FOR EXTERNAL USE ===

// DTO re-exports
export type {
  InsuranceProductType,
  CoverageTier,
  ClaimStatus,
  PolicyStatus,
  PaymentMethod,
  InsuranceProduct,
  CoverageTierDefinition,
  InsuranceQuoteRequest,
  FlightDetailsForQuote,
  CoverageRequest,
  PassengerDetails,
  InsuranceQuoteResponse,
  QuoteCoverage,
  PremiumBreakdown,
  PremiumComponent,
  PayoutStructure,
  PayoutTier,
  FlightRiskAssessment,
  ProviderInfo,
  PolicyPurchaseRequest,
  PaymentDetails,
  CustomerInfo,
  EmergencyContact,
  TravelPreferences,
  NotificationPreferences,
  CommunicationPreferences,
  PolicyPurchaseResponse,
  PolicyCoverage,
  PaymentConfirmation,
  EscrowInfo,
  PolicyDocument,
  PolicyTrackingRequest,
  PolicyTrackingResponse,
  PolicyDetails,
  CustomerSummary,
  ClaimSummary,
  FlightStatus,
  PolicyEvent,
  InsuranceProductsResponse,
  ProductCategory,
  AddToCartRequest,
  AddToCartResponse,
  CartItem,
  AnonymousCartResponse,
};

// Validator and Zod-inferred type re-exports
export {
  insuranceProductTypeSchema,
  coverageTierSchema,
  claimStatusSchema,
  paymentMethodSchema,
  payoutTypeSchema,
  flightDetailsForQuoteSchema,
  coverageRequestSchema,
  passengerDetailsSchema,
  payoutTierSchema,
  payoutStructureSchema,
  premiumComponentSchema,
  premiumBreakdownSchema,
  flightRiskAssessmentSchema,
  providerInfoSchema,
  quoteCoverageSchema,
  insuranceProductSchema,
  insuranceQuoteRequestSchema,
  policyPurchaseRequestSchema,
  policyTrackingRequestSchema,
  addToCartRequestSchema,
  insuranceProductsListRequestSchema,
  insuranceQuoteResponseSchema,
  policyPurchaseResponseSchema,
  policyTrackingResponseSchema,
  addToCartResponseSchema,
  insuranceProductsResponseSchema,
  validateInsuranceQuoteRequest,
  validatePolicyPurchaseRequest,
  validatePolicyTrackingRequest,
  validateAddToCartRequest,
  safeValidateInsuranceQuoteRequest,
  safeValidatePolicyPurchaseRequest,
  policyStatusSchema, // re-export the shared schema
};
export type {
  ZodInsuranceQuoteRequest,
  ZodInsuranceQuoteResponse,
  ZodPolicyPurchaseRequest,
  ZodPolicyPurchaseResponse,
  ZodPolicyTrackingRequest,
  ZodPolicyTrackingResponse,
  ZodAddToCartRequest,
  ZodAddToCartResponse,
  ZodInsuranceProduct,
  ZodInsuranceProductsResponse,
  ZodFlightDetailsForQuote,
  ZodCoverageRequest,
  ZodPremiumBreakdown,
  ZodFlightRiskAssessment,
  ZodProviderInfo,
  ZodInsuranceProductType,
  ZodCoverageTier,
  ZodClaimStatus,
  ZodPaymentMethod,
  ZodPayoutType,
};

// === NAMESPACE EXPORTS ===

/**
 * Insurance validators namespace.
 * This works because the schemas were imported into the local scope first.
 */
export const validators = {
  // Request validators
  quoteRequest: insuranceQuoteRequestSchema,
  policyPurchase: policyPurchaseRequestSchema,
  policyTracking: policyTrackingRequestSchema,
  addToCart: addToCartRequestSchema,
  productsList: insuranceProductsListRequestSchema,

  // Response validators
  quoteResponse: insuranceQuoteResponseSchema,
  policyPurchaseResponse: policyPurchaseResponseSchema,
  policyTrackingResponse: policyTrackingResponseSchema,
  addToCartResponse: addToCartResponseSchema,
  productsResponse: insuranceProductsResponseSchema,

  // Supporting validators
  flightDetails: flightDetailsForQuoteSchema,
  coverage: coverageRequestSchema,
  passenger: passengerDetailsSchema,
  product: insuranceProductSchema,
  premium: premiumBreakdownSchema,
  riskAssessment: flightRiskAssessmentSchema,
  provider: providerInfoSchema,
  quoteCoverage: quoteCoverageSchema,

  // Enum validators
  productType: insuranceProductTypeSchema,
  coverageTier: coverageTierSchema,
  claimStatus: claimStatusSchema,
  paymentMethod: paymentMethodSchema,
  payoutType: payoutTypeSchema,
  policyStatus: policyStatusSchema, // Add shared schema here too

  // Validation functions
  validate: {
    quoteRequest: validateInsuranceQuoteRequest,
    policyPurchase: validatePolicyPurchaseRequest,
    policyTracking: validatePolicyTrackingRequest,
    addToCart: validateAddToCartRequest,
  },

  // Safe validation functions
  safeValidate: {
    quoteRequest: safeValidateInsuranceQuoteRequest,
    policyPurchase: safeValidatePolicyPurchaseRequest,
  },
} as const;

/**
 * Insurance utilities namespace
 */
export const utils = {
  /**
   * Generate a unique quote ID
   */
  generateQuoteId: (prefix: string = "quote"): string => {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomSuffix}`;
  },

  /**
   * Calculate base premium (simplified calculation)
   */
  calculateBasePremium: (
    coverageAmount: number,
    riskFactor: number = 1.0,
  ): number => {
    const baseRate = 0.02; // 2% base rate
    return Math.round(coverageAmount * baseRate * riskFactor * 100) / 100;
  },

  /**
   * Format premium amount for display
   */
  formatPremium: (premiumInCents: number, currency: string = "USD"): string => {
    const amount = premiumInCents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  },

  /**
   * Check if quote is expired
   */
  isQuoteExpired: (validUntil: string): boolean => {
    const expiry = new Date(validUntil);
    const now = new Date();
    return now > expiry;
  },

  /**
   * Get risk level description
   */
  getRiskLevelDescription: (riskLevel: "low" | "medium" | "high"): string => {
    const descriptions = {
      low: "Low risk of delay - favorable conditions",
      medium: "Moderate risk of delay - typical conditions",
      high: "High risk of delay - challenging conditions",
    };
    return descriptions[riskLevel] || "Unknown risk level";
  },

  /**
   * Validate flight number format
   */
  isValidFlightNumber: (flightNumber: string): boolean => {
    // Basic flight number validation (2-3 letter airline code + numbers)
    const flightNumberPattern = /^[A-Z]{2,3}\d{1,4}$/i;
    return flightNumberPattern.test(flightNumber);
  },

  /**
   * Validate IATA airport code
   */
  isValidIATACode: (code: string): boolean => {
    // IATA codes are exactly 3 letters
    const iataPattern = /^[A-Z]{3}$/i;
    return iataPattern.test(code);
  },

  /**
   * Format coverage amount for display
   */
  formatCoverage: (amountInCents: number, currency: string = "USD"): string => {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  },

  /**
   * Calculate delay probability from risk assessment
   */
  calculateDelayProbability: (riskAssessment: any): number => {
    if (
      !riskAssessment ||
      typeof riskAssessment.delayProbability !== "number"
    ) {
      return 0.15; // Default 15% probability
    }
    return Math.max(0, Math.min(1, riskAssessment.delayProbability));
  },

  /**
   * Generate policy number
   */
  generatePolicyNumber: (prefix: string = "POL"): string => {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `${prefix}-${timestamp}-${randomSuffix}`;
  },

  /**
   * Validate premium breakdown
   */
  isValidPremiumBreakdown: (breakdown: any): boolean => {
    if (!breakdown || typeof breakdown !== "object") return false;
    if (typeof breakdown.total !== "number" || breakdown.total <= 0)
      return false;
    if (!Array.isArray(breakdown.breakdown)) return false;

    const calculatedTotal = breakdown.breakdown.reduce(
      (sum: number, component: any) => {
        return sum + (component.amount || 0);
      },
      0,
    );

    return Math.abs(calculatedTotal - breakdown.total) < 0.01; // Allow for rounding differences
  },

  /**
   * Get coverage tier description
   */
  getCoverageTierDescription: (tier: string): string => {
    const descriptions: Record<string, string> = {
      economy: "Basic coverage with essential protection",
      business: "Enhanced coverage with additional benefits",
      premium: "Comprehensive coverage with maximum protection",
      custom: "Tailored coverage to meet specific needs",
    };
    return descriptions[tier] || "Unknown coverage tier";
  },

  /**
   * Calculate estimated payout
   */
  calculateEstimatedPayout: (
    coverageAmount: number,
    delayMinutes: number,
    delayThreshold: number,
    payoutStructure?: any,
  ): number => {
    if (delayMinutes < delayThreshold) return 0;

    if (!payoutStructure || payoutStructure.type === "fixed") {
      return coverageAmount;
    }

    if (payoutStructure.type === "tiered" && payoutStructure.amounts) {
      const tier = payoutStructure.amounts.find(
        (tier: any) =>
          delayMinutes >= tier.minDelay &&
          (!tier.maxDelay || delayMinutes <= tier.maxDelay),
      );
      return tier ? tier.payoutAmount : 0;
    }

    return coverageAmount;
  },
} as const;

/**
 * Insurance constants namespace
 */
export const constants = {
  PRODUCT_TYPES: {
    FLIGHT_DELAY: "flight_delay" as const,
    FLIGHT_CANCELLATION: "flight_cancellation" as const,
    BAGGAGE_DELAY: "baggage_delay" as const,
    WEATHER_DISRUPTION: "weather_disruption" as const,
    TRAVEL_COMPREHENSIVE: "travel_comprehensive" as const,
  },

  COVERAGE_TIERS: {
    ECONOMY: "economy" as const,
    BUSINESS: "business" as const,
    PREMIUM: "premium" as const,
    CUSTOM: "custom" as const,
  },

  PAYMENT_METHODS: {
    STRIPE: "stripe" as const,
    PAYGO_WALLET: "paygo_wallet" as const,
    PAYGO_ESCROW: "paygo_escrow" as const,
  },

  CLAIM_STATUSES: {
    PENDING: "pending" as const,
    APPROVED: "approved" as const,
    PAID: "paid" as const,
    DENIED: "denied" as const,
    UNDER_REVIEW: "under_review" as const,
  },

  PAYOUT_TYPES: {
    FIXED: "fixed" as const,
    TIERED: "tiered" as const,
    PROPORTIONAL: "proportional" as const,
  },

  COVERAGE_LIMITS: {
    MIN_COVERAGE_CENTS: 10000, // $100
    MAX_COVERAGE_CENTS: 100000000, // $1M
    DEFAULT_COVERAGE_CENTS: 50000, // $500
  },

  DELAY_THRESHOLDS: {
    MIN_MINUTES: 30,
    MAX_MINUTES: 720, // 12 hours
    DEFAULT_MINUTES: 120, // 2 hours
  },

  QUOTE_VALIDITY: {
    DEFAULT_HOURS: 24,
    EXTENDED_HOURS: 72,
    MIN_HOURS: 1,
  },

  RISK_FACTORS: {
    WEATHER_WEIGHT: 0.3,
    AIRLINE_WEIGHT: 0.2,
    ROUTE_WEIGHT: 0.25,
    SEASONAL_WEIGHT: 0.25,
  },

  PREMIUM_COMPONENTS: {
    BASE: "base" as const,
    RISK: "risk" as const,
    FEE: "fee" as const,
    TAX: "tax" as const,
    DISCOUNT: "discount" as const,
  },

  PASSENGER_LIMITS: {
    MIN_COUNT: 1,
    MAX_COUNT: 20,
    MAX_AGE: 120,
  },

  RISK_LEVELS: {
    LOW: "low" as const,
    MEDIUM: "medium" as const,
    HIGH: "high" as const,
  },

  PROVIDER_TIERS: {
    STARTUP: "startup" as const,
    STANDARD: "standard" as const,
    PREMIUM: "premium" as const,
    ENTERPRISE: "enterprise" as const,
  },
} as const;

// === COMBINED NAMESPACE EXPORT ===
export const InsuranceDomain = {
  validators,
  utils,
  constants,
} as const;

// === TYPE DEFINITIONS ===
export type InsuranceDomainNamespace = typeof InsuranceDomain;
export type InsuranceValidators = typeof validators;
export type InsuranceUtils = typeof utils;
export type InsuranceConstants = typeof constants;
