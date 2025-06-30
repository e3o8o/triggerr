// ============================================================================
// INSURANCE API VALIDATORS (ZOD SCHEMAS)
// ============================================================================

import { z } from "zod";
import { policyStatusSchema } from "./common"; // Import the definitive PolicyStatus

// ============================================================================
// ENUMS & CONSTANTS (aligned with database schema)
// ============================================================================

export const insuranceProductTypeSchema = z.enum([
  "flight_delay",
  "flight_cancellation",
  "baggage_delay",
  "weather_disruption",
  "travel_comprehensive",
]);

export const coverageTierSchema = z.enum([
  "economy",
  "business",
  "premium",
  "custom",
]);

export const claimStatusSchema = z.enum([
  "pending",
  "approved",
  "paid",
  "denied",
  "under_review",
]);

export const paymentMethodSchema = z.enum([
  "stripe",
  "paygo_wallet",
  "paygo_escrow",
]);

export const payoutTypeSchema = z.enum(["fixed", "tiered", "proportional"]);

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const flightDetailsForQuoteSchema = z.object({
  flightNumber: z.string().min(1).max(10),
  airline: z.string().min(2).max(10),
  origin: z.string().length(3), // IATA code
  destination: z.string().length(3), // IATA code
  departureDate: z.string().datetime(),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime().optional(),
  aircraft: z.string().max(50).optional(),
  route: z.string().max(200).optional(),
});

export const coverageRequestSchema = z.object({
  tier: coverageTierSchema,
  coverageAmount: z.number().int().min(10000).max(100000000), // $100 to $1M in cents
  delayThreshold: z.number().int().min(30).max(720), // 30 minutes to 12 hours
  customOptions: z.record(z.any()).optional(),
});

export const passengerDetailsSchema = z.object({
  count: z.number().int().min(1).max(20),
  ages: z.array(z.number().int().min(0).max(120)).optional(),
  cabinClass: z.string().max(20).optional(),
  specialRequirements: z.array(z.string().max(100)).max(10).optional(),
});

export const payoutTierSchema = z.object({
  minDelay: z.number().int().nonnegative(),
  maxDelay: z.number().int().positive().optional(),
  payoutAmount: z.number().int().positive(),
  payoutPercentage: z.number().min(0).max(100).optional(),
});

export const payoutStructureSchema = z.object({
  type: payoutTypeSchema,
  amounts: z.array(payoutTierSchema).min(1).max(10),
});

export const premiumComponentSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().int(), // Can be negative for discounts
  description: z.string().max(200),
  type: z.enum(["base", "risk", "fee", "tax", "discount"]),
});

export const premiumBreakdownSchema = z.object({
  basePremium: z.number().int().nonnegative(),
  riskAdjustment: z.number().int(), // Can be negative
  platformFee: z.number().int().nonnegative(),
  taxes: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  breakdown: z.array(premiumComponentSchema),
});

export const flightRiskAssessmentSchema = z.object({
  overallRisk: z.enum(["low", "medium", "high"]),
  delayProbability: z.number().min(0).max(1),
  historicalDelayRate: z.number().min(0).max(1),
  weatherRisk: z.number().min(0).max(1),
  airportCongestion: z.number().min(0).max(1),
  airlineReliability: z.number().min(0).max(1),
  seasonalFactors: z.number().min(0).max(1),
  riskFactors: z.array(z.string().max(100)).max(20),
});

export const providerInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  tier: z.enum(["startup", "standard", "premium", "enterprise"]),
  rating: z.number().min(1).max(5),
  isFirstParty: z.boolean(),
  logo: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

// ============================================================================
// REQUEST VALIDATORS
// ============================================================================

export const insuranceQuoteRequestSchema = z
  .object({
    productType: insuranceProductTypeSchema,
    flightDetails: flightDetailsForQuoteSchema,
    coverageDetails: coverageRequestSchema,
    passengerDetails: passengerDetailsSchema.optional(),
    sessionId: z.string().optional(), // For anonymous users
  })
  .strict();

export const policyPurchaseRequestSchema = z
  .object({
    quoteId: z.string().uuid(),
    paymentMethod: paymentMethodSchema,
    paymentDetails: z
      .object({
        stripePaymentIntentId: z.string().optional(),
        paygoWalletId: z.string().uuid().optional(),
        escrowId: z.string().optional(),
      })
      .optional(),
    confirmTerms: z.boolean().refine((val) => val === true, {
      message: "Terms must be accepted",
    }),
    customerInfo: z
      .object({
        email: z.string().email().optional(),
        phone: z.string().max(20).optional(),
        emergencyContact: z
          .object({
            name: z.string().min(1).max(100),
            relationship: z.string().max(50),
            phone: z.string().min(1).max(20),
            email: z.string().email().optional(),
          })
          .optional(),
        travelPreferences: z
          .object({
            notifications: z.object({
              email: z.boolean().default(true),
              sms: z.boolean().default(false),
              push: z.boolean().default(true),
              flightUpdates: z.boolean().default(true),
              policyUpdates: z.boolean().default(true),
              claimUpdates: z.boolean().default(true),
            }),
            communications: z.object({
              language: z.string().length(2).default("en"),
              timezone: z.string().max(50).default("UTC"),
              preferredMethod: z
                .enum(["email", "sms", "push"])
                .default("email"),
            }),
          })
          .optional(),
      })
      .optional(),
  })
  .strict();

export const policyTrackingRequestSchema = z
  .object({
    identifier: z.string().min(1).max(100),
    type: z.enum(["policy_id", "policy_number", "tracking_number"]).optional(),
  })
  .strict();

export const addToCartRequestSchema = z
  .object({
    quoteId: z.string().uuid(),
    sessionId: z.string().min(1).max(255), // Anonymous session ID
    expiresAt: z.string().datetime().optional(),
  })
  .strict();

export const insuranceProductsListRequestSchema = z
  .object({
    productType: insuranceProductTypeSchema.optional(),
    tier: coverageTierSchema.optional(),
    limit: z.number().int().min(1).max(100).default(10),
    offset: z.number().int().nonnegative().default(0),
  })
  .strict();

// ============================================================================
// RESPONSE VALIDATORS
// ============================================================================

export const quoteCoverageSchema = z.object({
  tier: coverageTierSchema,
  amount: z.number().int().positive(),
  delayThreshold: z.number().int().positive(),
  payoutStructure: payoutStructureSchema,
  conditions: z.array(z.string().max(200)).max(20),
});

export const insuranceProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: insuranceProductTypeSchema,
  description: z.string().max(1000),
  coverageTiers: z.array(
    z.object({
      tier: coverageTierSchema,
      name: z.string().max(50),
      minCoverage: z.number().int().nonnegative(),
      maxCoverage: z.number().int().positive(),
      basePremium: z.number().int().nonnegative(),
      description: z.string().max(500),
      features: z.array(z.string().max(100)).max(20),
    }),
  ),
  delayThresholds: z.array(z.number().int().positive()).max(10),
  maxCoverageAmount: z.number().int().positive(),
  minCoverageAmount: z.number().int().positive(),
  basePrice: z.number().int().nonnegative(),
  isActive: z.boolean(),
  terms: z.string().optional(),
  exclusions: z.array(z.string().max(200)).max(50).optional(),
});

export const insuranceQuoteResponseSchema = z.object({
  quoteId: z.string().uuid(),
  productType: insuranceProductTypeSchema,
  product: insuranceProductSchema,
  coverage: quoteCoverageSchema,
  premium: premiumBreakdownSchema,
  flightRisk: flightRiskAssessmentSchema,
  validUntil: z.string().datetime(),
  terms: z.string(),
  exclusions: z.array(z.string().max(200)).max(50),
  provider: providerInfoSchema,
});

export const policyPurchaseResponseSchema = z.object({
  policyId: z.string().uuid(),
  policyNumber: z.string().min(1).max(50),
  status: policyStatusSchema,
  coverage: z.object({
    productType: insuranceProductTypeSchema,
    tier: coverageTierSchema,
    amount: z.number().int().positive(),
    delayThreshold: z.number().int().positive(),
    effectiveDate: z.string().datetime(),
    expirationDate: z.string().datetime(),
    flightDetails: flightDetailsForQuoteSchema,
    payoutStructure: payoutStructureSchema,
  }),
  payment: z.object({
    paymentId: z.string(),
    method: paymentMethodSchema,
    amount: z.number().int().positive(),
    currency: z.string().length(3),
    status: z.enum(["pending", "confirmed", "failed"]),
    transactionId: z.string().optional(),
    receipt: z.string().url().optional(),
  }),
  escrow: z
    .object({
      escrowId: z.string(),
      blockchainId: z.string(),
      status: z.enum(["created", "funded", "fulfilled", "released", "expired"]),
      amount: z.number().int().positive(),
      expiresAt: z.string().datetime(),
      txHash: z.string().optional(),
    })
    .optional(),
  documents: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum(["policy", "certificate", "terms", "receipt"]),
      name: z.string().max(100),
      url: z.string().url(),
      format: z.enum(["pdf", "html", "text"]),
      size: z.number().int().nonnegative().optional(),
      createdAt: z.string().datetime(),
    }),
  ),
  nextSteps: z.array(z.string().max(200)).max(10),
});

export const policyTrackingResponseSchema = z.object({
  policy: z.object({
    id: z.string().uuid(),
    policyNumber: z.string(),
    trackingNumber: z.string(),
    status: policyStatusSchema,
    purchasedAt: z.string().datetime(),
    provider: providerInfoSchema,
    customer: z
      .object({
        id: z.string().uuid(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        isAnonymous: z.boolean(),
      })
      .optional(),
  }),
  status: policyStatusSchema,
  coverage: quoteCoverageSchema,
  claims: z.array(
    z.object({
      id: z.string().uuid(),
      status: claimStatusSchema,
      amount: z.number().int().nonnegative(),
      filedAt: z.string().datetime(),
      processedAt: z.string().datetime().optional(),
      paidAt: z.string().datetime().optional(),
      reason: z.string().max(500),
    }),
  ),
  flightStatus: z
    .object({
      flightNumber: z.string(),
      status: z.enum([
        "scheduled",
        "delayed",
        "cancelled",
        "departed",
        "arrived",
      ]),
      delay: z.number().int().nonnegative().optional(),
      actualDeparture: z.string().datetime().optional(),
      actualArrival: z.string().datetime().optional(),
      gate: z.string().max(10).optional(),
      terminal: z.string().max(10).optional(),
      lastUpdated: z.string().datetime(),
    })
    .optional(),
  timeline: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum([
        "purchased",
        "activated",
        "flight_update",
        "claim_filed",
        "claim_paid",
        "expired",
      ]),
      description: z.string().max(500),
      timestamp: z.string().datetime(),
      details: z.record(z.any()).optional(),
    }),
  ),
  documents: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum(["policy", "certificate", "terms", "receipt"]),
      name: z.string().max(100),
      url: z.string().url(),
      format: z.enum(["pdf", "html", "text"]),
      size: z.number().int().nonnegative().optional(),
      createdAt: z.string().datetime(),
    }),
  ),
});

export const addToCartResponseSchema = z.object({
  cartItemId: z.string().uuid(),
  quote: insuranceQuoteResponseSchema,
  addedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  message: z.string().max(200),
});

export const insuranceProductsResponseSchema = z.object({
  products: z.array(insuranceProductSchema),
  total: z.number().int().nonnegative(),
  categories: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string().max(100),
      description: z.string().max(500),
      productTypes: z.array(insuranceProductTypeSchema),
      icon: z.string().url().optional(),
    }),
  ),
  providers: z.array(providerInfoSchema),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateInsuranceQuoteRequest(data: unknown) {
  return insuranceQuoteRequestSchema.parse(data);
}

export function validatePolicyPurchaseRequest(data: unknown) {
  return policyPurchaseRequestSchema.parse(data);
}

export function validatePolicyTrackingRequest(data: unknown) {
  return policyTrackingRequestSchema.parse(data);
}

export function validateAddToCartRequest(data: unknown) {
  return addToCartRequestSchema.parse(data);
}

export function safeValidateInsuranceQuoteRequest(data: unknown) {
  const result = insuranceQuoteRequestSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.issues,
  };
}

export function safeValidatePolicyPurchaseRequest(data: unknown) {
  const result = policyPurchaseRequestSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.issues,
  };
}

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type InsuranceQuoteRequest = z.infer<typeof insuranceQuoteRequestSchema>;
export type InsuranceQuoteResponse = z.infer<
  typeof insuranceQuoteResponseSchema
>;
export type PolicyPurchaseRequest = z.infer<typeof policyPurchaseRequestSchema>;
export type PolicyPurchaseResponse = z.infer<
  typeof policyPurchaseResponseSchema
>;
export type PolicyTrackingRequest = z.infer<typeof policyTrackingRequestSchema>;
export type PolicyTrackingResponse = z.infer<
  typeof policyTrackingResponseSchema
>;
export type AddToCartRequest = z.infer<typeof addToCartRequestSchema>;
export type AddToCartResponse = z.infer<typeof addToCartResponseSchema>;
export type InsuranceProduct = z.infer<typeof insuranceProductSchema>;
export type InsuranceProductsResponse = z.infer<
  typeof insuranceProductsResponseSchema
>;
export type FlightDetailsForQuote = z.infer<typeof flightDetailsForQuoteSchema>;
export type CoverageRequest = z.infer<typeof coverageRequestSchema>;
export type PremiumBreakdown = z.infer<typeof premiumBreakdownSchema>;
export type FlightRiskAssessment = z.infer<typeof flightRiskAssessmentSchema>;
export type ProviderInfo = z.infer<typeof providerInfoSchema>;

// Enum type exports
export type InsuranceProductType = z.infer<typeof insuranceProductTypeSchema>;
export type CoverageTier = z.infer<typeof coverageTierSchema>;
export type ClaimStatus = z.infer<typeof claimStatusSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PayoutType = z.infer<typeof payoutTypeSchema>;
