// ============================================================================
// POLICY & AUTOMATED PAYOUT API VALIDATORS (ZOD SCHEMAS)
// ============================================================================

import { z } from "zod";
import {
  insuranceProductTypeSchema,
  coverageTierSchema,
  providerInfoSchema,
  flightDetailsForQuoteSchema,
  payoutStructureSchema,
  paymentMethodSchema,
} from "./insurance"; // Imports from actual Zod schemas in validators/insurance

import {
  moneyAmountSchema,
  addressSchema,
  paginationRequestSchema,
  paginationResponseSchema,
  policyStatusSchema,
} from "./common"; // Imports from actual Zod schemas in validators/common

// ============================================================================
// ENUMS (FROM dtos/policy.ts, converted to Zod enums)
// ============================================================================

// policyStatusSchema is now imported from common.ts to avoid circular dependencies

export const automatedPayoutStatusSchema = z.enum([
  "NOT_APPLICABLE",
  "EVENT_VERIFIED",
  "PAYOUT_SCHEDULED",
  "PROCESSING",
  "CONFIRMED_ON_CHAIN",
  "FUNDS_TRANSFERRED",
  "RETRY_NEEDED",
  "MANUAL_REVIEW_NEEDED",
  "FAILED_FINAL",
]);

export const policyEventTypeSchema = z.enum([
  "POLICY_CREATED",
  "PREMIUM_PAYMENT_PENDING",
  "PREMIUM_PAYMENT_SUCCESSFUL",
  "PREMIUM_PAYMENT_FAILED",
  "POLICY_ACTIVATION_CONDITIONS_MET",
  "PARAMETRIC_EVENT_MONITORING_STARTED",
  "PARAMETRIC_EVENT_DATA_RECEIVED",
  "PARAMETRIC_EVENT_VERIFIED_TRUE",
  "PARAMETRIC_EVENT_VERIFIED_FALSE",
  "AUTOMATED_PAYOUT_INITIATED",
  "AUTOMATED_PAYOUT_STATUS_UPDATE",
  "AUTOMATED_PAYOUT_SUCCESSFUL",
  "AUTOMATED_PAYOUT_FAILED_REQUIRES_REVIEW",
  "POLICY_EXPIRED_EVENT_MET",
  "POLICY_EXPIRED_NO_EVENT_TRIGGERED",
  "POLICY_CANCELLED_BY_USER",
  "POLICY_CANCELLED_BY_SYSTEM",
  "ESCROW_FUNDED_PREMIUM",
  "ESCROW_RELEASED_PAYOUT",
  "ESCROW_CLOSED_EXPIRED",
  "NOTIFICATION_SENT_POLICYHOLDER",
  "NOTIFICATION_SENT_ADMIN",
]);

export const documentTypeSchema = z.enum([
  "POLICY_CONFIRMATION",
  "CERTIFICATE_OF_INSURANCE",
  "TERMS_AND_CONDITIONS",
  "PAYMENT_RECEIPT",
  "PAYOUT_CONFIRMATION",
  "EVENT_DATA_PROOF",
  "REFUND_CONFIRMATION",
  "OTHER",
]);

export const beneficiaryTypeSchema = z.enum(["PRIMARY", "CONTINGENT"]);
export const endorsementTypeSchema = z.enum([
  "COVERAGE_ADJUSTMENT",
  "INFO_CORRECTION",
  "OTHER",
]);

// ============================================================================
// CORE POLICY & AUTOMATED PAYOUT STRUCTURE SCHEMAS
// ============================================================================

export const policyCoverageDetailsSchema = z.object({
  productType: insuranceProductTypeSchema,
  productName: z.string().min(1).max(200),
  tier: coverageTierSchema,
  coverageAmount: moneyAmountSchema,
  payoutStructure: payoutStructureSchema,
  insuredEventDefinition: z.string().min(1),
});

export const flightPolicyDetailsSchema = z.object({
  flightDetails: flightDetailsForQuoteSchema,
  dataSourceConfirmation: z.string().optional(),
  eventTimestamp: z
    .string()
    .datetime({ precision: 0, offset: true })
    .optional(),
  triggeringData: z.record(z.any()).optional(),
});

export const policyDocumentSchema = z.object({
  id: z.string().uuid(),
  documentName: z.string().min(1).max(255),
  type: documentTypeSchema,
  url: z.string().url(),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().nonnegative().optional(),
  createdAt: z.string().datetime({ precision: 0, offset: true }),
  metadata: z.record(z.any()).optional(),
});

export const automatedPayoutRecordSchema = z.object({
  id: z.string().uuid(),
  policyId: z.string().uuid(),
  policyNumber: z.string(),
  status: automatedPayoutStatusSchema,
  eventVerificationTimestamp: z
    .string()
    .datetime({ precision: 0, offset: true }),
  triggeringEventDescription: z.string(),
  expectedPayoutAmount: moneyAmountSchema,
  actualPayoutAmount: moneyAmountSchema.optional(),
  payoutTransactionId: z.string().optional(),
  payoutProcessingAttempts: z.number().int().nonnegative().optional(),
  lastAttemptTimestamp: z
    .string()
    .datetime({ precision: 0, offset: true })
    .optional(),
  failureReason: z.string().optional(),
  notes: z
    .array(
      z.object({
        note: z.string(),
        timestamp: z.string().datetime({ precision: 0, offset: true }),
        author: z.string(),
      }),
    )
    .optional(),
  initiatedAt: z.string().datetime({ precision: 0, offset: true }),
  lastUpdatedAt: z.string().datetime({ precision: 0, offset: true }),
  completedAt: z.string().datetime({ precision: 0, offset: true }).optional(),
});

export const policySchema = z.object({
  id: z.string().uuid(),
  policyNumber: z.string().min(1).max(50),
  trackingNumber: z.string().max(50).optional(),
  userId: z.string().uuid().optional(),
  anonymousSessionId: z.string().max(255).optional(),
  status: policyStatusSchema,
  product: z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: insuranceProductTypeSchema,
  }),
  provider: providerInfoSchema,
  coverage: policyCoverageDetailsSchema,
  flightPolicyDetails: flightPolicyDetailsSchema.optional(),
  premium: moneyAmountSchema,
  paymentMethodUsed: paymentMethodSchema.optional(),
  premiumPaymentTransactionId: z.string().optional(),
  policyEscrowId: z.string().optional(),
  payoutWalletAddress: z.string().optional(),
  effectiveDate: z.string().datetime({ precision: 0, offset: true }),
  expirationDate: z.string().datetime({ precision: 0, offset: true }),
  purchaseDate: z.string().datetime({ precision: 0, offset: true }),
  automatedPayoutDetails: automatedPayoutRecordSchema.optional(),
  cancellationDetails: z
    .object({
      cancelledBy: z.enum(["USER", "SYSTEM", "PROVIDER"]),
      reason: z.string(),
      refundAmount: moneyAmountSchema.optional(),
      refundTransactionId: z.string().optional(),
      cancelledAt: z.string().datetime({ precision: 0, offset: true }),
    })
    .optional(),
  lastUpdatedAt: z.string().datetime({ precision: 0, offset: true }),
  createdAt: z.string().datetime({ precision: 0, offset: true }),
  metadata: z.record(z.any()).optional(),
  documents: z.array(policyDocumentSchema).optional(),
});

export const policySummarySchema = z.object({
  id: z.string().uuid(),
  policyNumber: z.string(),
  productName: z.string(),
  productType: insuranceProductTypeSchema,
  status: policyStatusSchema,
  coverageAmount: moneyAmountSchema,
  premiumPaid: moneyAmountSchema,
  effectiveDate: z.string().datetime({ precision: 0, offset: true }),
  expirationDate: z.string().datetime({ precision: 0, offset: true }),
  purchaseDate: z.string().datetime({ precision: 0, offset: true }),
  providerName: z.string(),
  flightInfo: z
    .object({
      flightNumber: z.string().optional(),
      origin: z.string().length(3).optional(),
      destination: z.string().length(3).optional(),
      scheduledDeparture: z
        .string()
        .datetime({ precision: 0, offset: true })
        .optional(),
    })
    .optional(),
  payoutStatus: automatedPayoutStatusSchema.optional(),
});

export const policyEventSchema = z.object({
  id: z.string().uuid(),
  policyId: z.string().uuid(),
  payoutRecordId: z.string().uuid().optional(),
  type: policyEventTypeSchema,
  timestamp: z.string().datetime({ precision: 0, offset: true }),
  description: z.string(),
  actor: z.object({
    type: z.enum([
      "USER",
      "SYSTEM_ORACLE",
      "SYSTEM_PAYMENT",
      "ADMIN",
      "PROVIDER_PLATFORM",
    ]),
    id: z.string().optional(),
  }),
  details: z.record(z.any()).optional(),
});

// ============================================================================
// API REQUEST & RESPONSE SCHEMAS
// ============================================================================

export const getPolicyDetailsRequestSchema = z
  .object({
    policyId: z.string().min(1), // Can be UUID or Policy Number
  })
  .strict();
export const getPolicyDetailsResponseSchema = policySchema;

export const listUserPoliciesRequestSchema = paginationRequestSchema
  .extend({
    userId: z.string().uuid().optional(),
    status: policyStatusSchema.optional(),
    productType: insuranceProductTypeSchema.optional(),
    sortBy: z
      .enum(["purchaseDate", "expirationDate", "status"])
      .default("purchaseDate")
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
  })
  .strict();

export const listUserPoliciesResponseSchema = z.object({
  policies: z.array(policySummarySchema),
  pagination: paginationResponseSchema,
});

export const getAutomatedPayoutRecordRequestSchema = z
  .object({
    payoutRecordId: z.string().uuid().optional(),
    policyId: z.string().uuid().optional(),
  })
  .strict()
  .refine((data) => data.payoutRecordId || data.policyId, {
    message: "Either payoutRecordId or policyId must be provided",
    path: ["payoutRecordId"],
  });
export const getAutomatedPayoutRecordResponseSchema =
  automatedPayoutRecordSchema.nullable();

export const listPolicyAutomatedPayoutsRequestSchema = paginationRequestSchema
  .extend({
    policyId: z.string().uuid(),
    status: automatedPayoutStatusSchema.optional(),
  })
  .strict();

export const listPolicyAutomatedPayoutsResponseSchema = z.object({
  payoutRecords: z.array(automatedPayoutRecordSchema),
  pagination: paginationResponseSchema,
});

export const cancelPolicyRequestSchema = z
  .object({
    policyId: z.string().uuid(),
    reason: z.string().min(1).max(500),
    requestedByUser: z.boolean(),
  })
  .strict();

export const cancelPolicyResponseSchema = z.object({
  policy: policySchema, // Updated policy
  message: z.string(),
  refundDetails: z
    .object({
      amount: moneyAmountSchema,
      transactionId: z.string().optional(),
      estimatedProcessingTime: z.string(),
    })
    .optional(),
});

export const addPolicyDocumentRequestSchema = z
  .object({
    policyId: z.string().uuid(),
    payoutRecordId: z.string().uuid().optional(),
    documentName: z.string().min(1).max(255),
    type: documentTypeSchema,
    base64Content: z.string().optional(),
    uploadUrl: z.string().url().optional(),
    mimeType: z.string().min(1).max(100),
  })
  .strict()
  .refine((data) => data.base64Content || data.uploadUrl, {
    message:
      "Either base64Content or uploadUrl must be provided for the document",
    path: ["base64Content"],
  });
export const addPolicyDocumentResponseSchema = policyDocumentSchema;

export const getPolicyTimelineRequestSchema = paginationRequestSchema
  .extend({
    policyId: z.string().uuid(),
    eventTypes: z.array(policyEventTypeSchema).optional(),
  })
  .strict();

export const getPolicyTimelineResponseSchema = z.object({
  events: z.array(policyEventSchema),
  pagination: paginationResponseSchema,
});

export const manuallyReviewPayoutRequestSchema = z
  .object({
    payoutRecordId: z.string().uuid(),
    action: z.enum([
      "APPROVE_MANUAL_PAYOUT",
      "REJECT_MANUAL_PAYOUT",
      "RETRY_AUTOMATED_PAYOUT",
    ]),
    reason: z.string().min(1).max(1000),
    notes: z.string().optional(),
    updatedPayoutAmount: moneyAmountSchema.optional(),
  })
  .strict();

export const manuallyReviewPayoutResponseSchema = z.object({
  payoutRecord: automatedPayoutRecordSchema, // Updated record
  message: z.string(),
});

// ============================================================================
// TYPE EXPORTS (inferred from schemas for convenience)
// ============================================================================

export type PolicyStatus = z.infer<typeof policyStatusSchema>;
export type AutomatedPayoutStatus = z.infer<typeof automatedPayoutStatusSchema>;
export type PolicyEventType = z.infer<typeof policyEventTypeSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
// BeneficiaryType and EndorsementType DTOs are in dtos/policy.ts, but not used in Zod schemas here for MVP

export type PolicyCoverageDetails = z.infer<typeof policyCoverageDetailsSchema>;
export type FlightPolicyDetails = z.infer<typeof flightPolicyDetailsSchema>;
export type PolicyDocument = z.infer<typeof policyDocumentSchema>;
export type AutomatedPayoutRecord = z.infer<typeof automatedPayoutRecordSchema>;
export type Policy = z.infer<typeof policySchema>;
export type PolicySummary = z.infer<typeof policySummarySchema>;
export type PolicyEvent = z.infer<typeof policyEventSchema>;

export type GetPolicyDetailsRequest = z.infer<
  typeof getPolicyDetailsRequestSchema
>;
export type GetPolicyDetailsResponse = z.infer<
  typeof getPolicyDetailsResponseSchema
>;
export type ListUserPoliciesRequest = z.infer<
  typeof listUserPoliciesRequestSchema
>;
export type ListUserPoliciesResponse = z.infer<
  typeof listUserPoliciesResponseSchema
>;
export type GetAutomatedPayoutRecordRequest = z.infer<
  typeof getAutomatedPayoutRecordRequestSchema
>;
export type GetAutomatedPayoutRecordResponse = z.infer<
  typeof getAutomatedPayoutRecordResponseSchema
>;
export type ListPolicyAutomatedPayoutsRequest = z.infer<
  typeof listPolicyAutomatedPayoutsRequestSchema
>;
export type ListPolicyAutomatedPayoutsResponse = z.infer<
  typeof listPolicyAutomatedPayoutsResponseSchema
>;
export type CancelPolicyRequest = z.infer<typeof cancelPolicyRequestSchema>;
export type CancelPolicyResponse = z.infer<typeof cancelPolicyResponseSchema>;
export type AddPolicyDocumentRequest = z.infer<
  typeof addPolicyDocumentRequestSchema
>;
export type AddPolicyDocumentResponse = z.infer<
  typeof addPolicyDocumentResponseSchema
>;
export type GetPolicyTimelineRequest = z.infer<
  typeof getPolicyTimelineRequestSchema
>;
export type GetPolicyTimelineResponse = z.infer<
  typeof getPolicyTimelineResponseSchema
>;
export type ManuallyReviewPayoutRequest = z.infer<
  typeof manuallyReviewPayoutRequestSchema
>;
export type ManuallyReviewPayoutResponse = z.infer<
  typeof manuallyReviewPayoutResponseSchema
>;
