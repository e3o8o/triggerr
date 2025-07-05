// ===========================================================================
// POLICY DOMAIN BARREL - API CONTRACTS
//
// This file provides clean, domain-specific exports for all policy-related
// DTOs, validators, and utilities by first importing them locally and then
// re-exporting them.
// ===========================================================================

// === STEP 1: IMPORT DTOS & TYPES FOR LOCAL USE AND RE-EXPORT ===
import type {
  // Basic Types
  PolicyStatus,
  AutomatedPayoutStatus,
  PolicyEventType,
  DocumentType,
  BeneficiaryType,
  EndorsementType,

  // Core Policy Types
  PolicyCoverageDetails,
  FlightPolicyDetails,
  Policy,
  PolicySummary,
  AutomatedPayoutRecord,
  PolicyEvent,
  PolicyDocument,
  Beneficiary,
  Endorsement,

  // Request/Response Types
  GetPolicyDetailsRequest,
  GetPolicyDetailsResponse,
  ListUserPoliciesRequest,
  ListUserPoliciesResponse,
  GetAutomatedPayoutRecordRequest,
  GetAutomatedPayoutRecordResponse,
  ListPolicyAutomatedPayoutsRequest,
  ListPolicyAutomatedPayoutsResponse,
  CancelPolicyRequest,
  CancelPolicyResponse,
  AddPolicyDocumentRequest,
  AddPolicyDocumentResponse,
  GetPolicyTimelineRequest,
  GetPolicyTimelineResponse,
  ManuallyReviewPayoutRequest,
  ManuallyReviewPayoutResponse,
} from "../dtos/policy";

// === STEP 2: IMPORT VALIDATORS FOR LOCAL USE AND RE-EXPORT ===
import {
  // Enums from this validator
  automatedPayoutStatusSchema,
  policyEventTypeSchema,
  documentTypeSchema,
  beneficiaryTypeSchema,
  endorsementTypeSchema,

  // Base schemas from this validator
  policyCoverageDetailsSchema,
  flightPolicyDetailsSchema,
  policyDocumentSchema,
  automatedPayoutRecordSchema,
  policySchema,
  policySummarySchema,
  policyEventSchema,
  beneficiarySchema,
  endorsementSchema,

  // Request/Response schemas from this validator
  getPolicyDetailsRequestSchema,
  getPolicyDetailsResponseSchema,
  listUserPoliciesRequestSchema,
  listUserPoliciesResponseSchema,
  getAutomatedPayoutRecordRequestSchema,
  getAutomatedPayoutRecordResponseSchema,
  listPolicyAutomatedPayoutsRequestSchema,
  listPolicyAutomatedPayoutsResponseSchema,
  cancelPolicyRequestSchema,
  cancelPolicyResponseSchema,
  addPolicyDocumentRequestSchema,
  addPolicyDocumentResponseSchema,
  getPolicyTimelineRequestSchema,
  getPolicyTimelineResponseSchema,
  manuallyReviewPayoutRequestSchema,
  manuallyReviewPayoutResponseSchema,
} from "../validators/policy";

// Import schemas from other validators that are used here
import {
  insuranceProductTypeSchema,
  coverageTierSchema,
  payoutStructureSchema,
  flightDetailsForQuoteSchema,
} from "../validators/insurance";
import {
  policyStatusSchema,
  moneyAmountSchema,
  paginationRequestSchema,
  paginationResponseSchema,
} from "../validators/common";

// Import Zod-inferred types
import type {
  Policy as ZodPolicy,
  PolicySummary as ZodPolicySummary,
  AutomatedPayoutRecord as ZodAutomatedPayoutRecord,
  PolicyEvent as ZodPolicyEvent,
  PolicyDocument as ZodPolicyDocument,
  GetPolicyDetailsRequest as ZodGetPolicyDetailsRequest,
  GetPolicyDetailsResponse as ZodGetPolicyDetailsResponse,
  ListUserPoliciesRequest as ZodListUserPoliciesRequest,
  ListUserPoliciesResponse as ZodListUserPoliciesResponse,
  CancelPolicyRequest as ZodCancelPolicyRequest,
  CancelPolicyResponse as ZodCancelPolicyResponse,
  PolicyStatus as ZodPolicyStatus,
  AutomatedPayoutStatus as ZodAutomatedPayoutStatus,
  PolicyEventType as ZodPolicyEventType,
  DocumentType as ZodDocumentType,
} from "../validators/policy";

// === STEP 3: RE-EXPORT ALL IMPORTED ITEMS FOR EXTERNAL USE ===
export type {
  PolicyStatus,
  AutomatedPayoutStatus,
  PolicyEventType,
  DocumentType,
  BeneficiaryType,
  EndorsementType,
  PolicyCoverageDetails,
  FlightPolicyDetails,
  Policy,
  PolicySummary,
  AutomatedPayoutRecord,
  PolicyEvent,
  PolicyDocument,
  Beneficiary,
  Endorsement,
  GetPolicyDetailsRequest,
  GetPolicyDetailsResponse,
  ListUserPoliciesRequest,
  ListUserPoliciesResponse,
  GetAutomatedPayoutRecordRequest,
  GetAutomatedPayoutRecordResponse,
  ListPolicyAutomatedPayoutsRequest,
  ListPolicyAutomatedPayoutsResponse,
  CancelPolicyRequest,
  CancelPolicyResponse,
  AddPolicyDocumentRequest,
  AddPolicyDocumentResponse,
  GetPolicyTimelineRequest,
  GetPolicyTimelineResponse,
  ManuallyReviewPayoutRequest,
  ManuallyReviewPayoutResponse,
};

export {
  automatedPayoutStatusSchema,
  policyEventTypeSchema,
  documentTypeSchema,
  beneficiaryTypeSchema,
  endorsementTypeSchema,
  policyCoverageDetailsSchema,
  flightPolicyDetailsSchema,
  policyDocumentSchema,
  automatedPayoutRecordSchema,
  policySchema,
  policySummarySchema,
  policyEventSchema,
  beneficiarySchema,
  endorsementSchema,
  getPolicyDetailsRequestSchema,
  getPolicyDetailsResponseSchema,
  listUserPoliciesRequestSchema,
  listUserPoliciesResponseSchema,
  getAutomatedPayoutRecordRequestSchema,
  getAutomatedPayoutRecordResponseSchema,
  listPolicyAutomatedPayoutsRequestSchema,
  listPolicyAutomatedPayoutsResponseSchema,
  cancelPolicyRequestSchema,
  cancelPolicyResponseSchema,
  addPolicyDocumentRequestSchema,
  addPolicyDocumentResponseSchema,
  getPolicyTimelineRequestSchema,
  getPolicyTimelineResponseSchema,
  manuallyReviewPayoutRequestSchema,
  manuallyReviewPayoutResponseSchema,
  policyStatusSchema, // Re-export from common
};

export type {
  ZodPolicy,
  ZodPolicySummary,
  ZodAutomatedPayoutRecord,
  ZodPolicyEvent,
  ZodPolicyDocument,
  ZodGetPolicyDetailsRequest,
  ZodGetPolicyDetailsResponse,
  ZodListUserPoliciesRequest,
  ZodListUserPoliciesResponse,
  ZodCancelPolicyRequest,
  ZodCancelPolicyResponse,
  ZodPolicyStatus,
  ZodAutomatedPayoutStatus,
  ZodPolicyEventType,
  ZodDocumentType,
};

// === NAMESPACE EXPORTS ===

/**
 * Policy validators namespace.
 * This works because the schemas were imported into the local scope first.
 */
export const validators = {
  // Request validators
  getPolicyDetails: getPolicyDetailsRequestSchema,
  listUserPolicies: listUserPoliciesRequestSchema,
  getAutomatedPayoutRecord: getAutomatedPayoutRecordRequestSchema,
  listPolicyAutomatedPayouts: listPolicyAutomatedPayoutsRequestSchema,
  cancelRequest: cancelPolicyRequestSchema,
  addPolicyDocument: addPolicyDocumentRequestSchema,
  getPolicyTimeline: getPolicyTimelineRequestSchema,
  manuallyReviewPayout: manuallyReviewPayoutRequestSchema,

  // Response validators
  getPolicyDetailsResponse: getPolicyDetailsResponseSchema,
  listUserPoliciesResponse: listUserPoliciesResponseSchema,
  getAutomatedPayoutRecordResponse: getAutomatedPayoutRecordResponseSchema,
  listPolicyAutomatedPayoutsResponse: listPolicyAutomatedPayoutsResponseSchema,
  cancelResponse: cancelPolicyResponseSchema,
  addPolicyDocumentResponse: addPolicyDocumentResponseSchema,
  getPolicyTimelineResponse: getPolicyTimelineResponseSchema,
  manuallyReviewPayoutResponse: manuallyReviewPayoutResponseSchema,

  // Core validators
  policy: policySchema,
  policySummary: policySummarySchema,
  policyEvent: policyEventSchema,
  policyDocument: policyDocumentSchema,
  automatedPayoutRecord: automatedPayoutRecordSchema,
  policyCoverageDetails: policyCoverageDetailsSchema,
  flightPolicyDetails: flightPolicyDetailsSchema,
  beneficiary: beneficiarySchema,
  endorsement: endorsementSchema,

  // Enum validators
  policyStatus: policyStatusSchema,
  automatedPayoutStatus: automatedPayoutStatusSchema,
  policyEventType: policyEventTypeSchema,
  documentType: documentTypeSchema,
  beneficiaryType: beneficiaryTypeSchema,
  endorsementType: endorsementTypeSchema,
} as const;

/**
 * Policy utilities namespace
 */
export const utils = {
  /**
   * Generate a unique policy number
   */
  generatePolicyNumber: (prefix: string = "POL"): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  },

  /**
   * Check if a policy is currently active
   */
  isPolicyActive: (status: string): boolean => {
    return status === "ACTIVE";
  },

  /**
   * Format policy status for display
   */
  formatPolicyStatus: (status: string): string => {
    return status
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  },

  /**
   * Determine if an automated payout can be processed
   */
  canProcessAutomatedPayout: (status: string): boolean => {
    const validStatuses = ["EVENT_VERIFIED", "RETRY_NEEDED"];
    return validStatuses.includes(status);
  },

  /**
   * Check if a policy has expired
   */
  isPolicyExpired: (expirationDate: string): boolean => {
    return new Date(expirationDate) < new Date();
  },

  /**
   * Get a human-readable description for a policy event
   */
  getEventDescription: (eventType: string, details: any = {}): string => {
    const descriptions: Record<string, string> = {
      POLICY_CREATED: `Policy created for ${details.productName || "product"}.`,
      PREMIUM_PAYMENT_SUCCESSFUL: `Premium of ${details.amount || "N/A"} paid successfully.`,
      PARAMETRIC_EVENT_VERIFIED_TRUE: `Insured event has been confirmed. Payout of ${details.payoutAmount || "N/A"} initiated.`,
      AUTOMATED_PAYOUT_INITIATED: `Automated payout process started.`,
      POLICY_EXPIRED: `Policy coverage period has ended.`,
    };
    return descriptions[eventType] || "A policy event has occurred.";
  },
} as const;

/**
 * Policy constants namespace
 */
export const constants = {
  STATUSES: {
    PENDING: "PENDING" as const,
    ACTIVE: "ACTIVE" as const,
    EXPIRED: "EXPIRED" as const,
    CANCELLED: "CANCELLED" as const,
    PAYOUT_INITIATED: "PAYOUT_INITIATED" as const,
    PAYOUT_COMPLETED: "PAYOUT_COMPLETED" as const,
    VOID: "VOID" as const,
  },
  AUTOMATED_PAYOUT_STATUSES: {
    NOT_APPLICABLE: "NOT_APPLICABLE" as const,
    EVENT_VERIFIED: "EVENT_VERIFIED" as const,
    PAYOUT_SCHEDULED: "PAYOUT_SCHEDULED" as const,
    PROCESSING: "PROCESSING" as const,
    CONFIRMED_ON_CHAIN: "CONFIRMED_ON_CHAIN" as const,
    FUNDS_TRANSFERRED: "FUNDS_TRANSFERRED" as const,
    RETRY_NEEDED: "RETRY_NEEDED" as const,
    MANUAL_REVIEW_NEEDED: "MANUAL_REVIEW_NEEDED" as const,
    FAILED_FINAL: "FAILED_FINAL" as const,
  },
  EVENT_TYPES: {
    POLICY_CREATED: "POLICY_CREATED" as const,
    PREMIUM_PAYMENT_SUCCESSFUL: "PREMIUM_PAYMENT_SUCCESSFUL" as const,
    PARAMETRIC_EVENT_VERIFIED_TRUE: "PARAMETRIC_EVENT_VERIFIED_TRUE" as const,
    AUTOMATED_PAYOUT_INITIATED: "AUTOMATED_PAYOUT_INITIATED" as const,
    PAYOUT_CONFIRMED: "PAYOUT_CONFIRMED" as const,
    POLICY_EXPIRED: "POLICY_EXPIRED" as const,
  },
  DOCUMENT_TYPES: {
    POLICY_CONFIRMATION: "POLICY_CONFIRMATION" as const,
    CERTIFICATE_OF_INSURANCE: "CERTIFICATE_OF_INSURANCE" as const,
    PAYMENT_RECEIPT: "PAYMENT_RECEIPT" as const,
    EVENT_DATA_PROOF: "EVENT_DATA_PROOF" as const,
  },
} as const;

// === COMBINED NAMESPACE EXPORT ===
export const PolicyDomain = {
  validators,
  utils,
  constants,
} as const;

// === TYPE DEFINITIONS ===
export type PolicyDomainNamespace = typeof PolicyDomain;
export type PolicyValidators = typeof validators;
export type PolicyUtils = typeof utils;
export type PolicyConstants = typeof constants;
