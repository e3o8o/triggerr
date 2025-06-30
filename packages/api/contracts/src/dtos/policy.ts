// ============================================================================
// POLICY & AUTOMATED PAYOUT API DTOS (PARAMETRIC INSURANCE)
// ============================================================================

import type {
  InsuranceProductType,
  CoverageTier,
  ProviderInfo,
  FlightDetailsForQuote,
  PayoutStructure,
  // CustomerSummary is fine, represents the policyholder
  PaymentMethod,
} from './insurance'; // Assuming CustomerSummary is still relevant for policy holder info

import type { MoneyAmount, Address } from './common';

// ============================================================================
// ENUMS (Aligned with database schema and parametric model)
// ============================================================================

export type PolicyStatus =
  | 'PENDING_PAYMENT' // Initial state, awaiting payment for premium
  | 'AWAITING_ACTIVATION' // Payment confirmed, premium in escrow, waiting for coverage window to start (e.g., flight not yet departed)
  | 'ACTIVE_MONITORING' // Coverage window active, system monitoring for parametric event
  | 'EVENT_TRIGGERED' // Parametric event conditions met, payout processing initiated
  | 'PAYOUT_PROCESSING' // Automated payout transaction is being processed via PayGo
  | 'PAYOUT_COMPLETED' // Payout successfully sent to user's wallet
  | 'PAYOUT_FAILED' // Automated payout failed (e.g., blockchain issue, wallet issue) - requires investigation
  | 'EXPIRED_NO_EVENT' // Coverage period ended, parametric event did not occur
  | 'CANCELLED_USER' // Cancelled by the user (rules for this TBD, e.g., before coverage starts)
  | 'CANCELLED_SYSTEM' // Cancelled by the system (e.g., fraud, pre-activation issue)
  | 'VOIDED'; // Policy invalidated due to specific reasons

// This replaces the traditional "ClaimStatus" for parametric insurance
export type AutomatedPayoutStatus =
  | 'NOT_APPLICABLE' // Event not triggered or policy not in a state for payout
  | 'EVENT_VERIFIED' // System has verified the parametric event
  | 'PAYOUT_SCHEDULED' // Payout is scheduled for processing
  | 'PROCESSING' // PayGo transaction initiated
  | 'CONFIRMED_ON_CHAIN' // PayGo transaction confirmed
  | 'FUNDS_TRANSFERRED' // Funds successfully delivered to user wallet
  | 'RETRY_NEEDED' // Transient issue, payout will be retried
  | 'MANUAL_REVIEW_NEEDED' // Unexpected issue, requires admin review (e.g., PayGo error, inconsistent data)
  | 'FAILED_FINAL'; // Payout has definitively failed after retries/review

export type PolicyEventType =
  | 'POLICY_CREATED' // Escrow for premium might be created here or on payment
  | 'PREMIUM_PAYMENT_PENDING'
  | 'PREMIUM_PAYMENT_SUCCESSFUL' // Premium secured, policy moves to AWAITING_ACTIVATION or ACTIVE_MONITORING
  | 'PREMIUM_PAYMENT_FAILED'
  | 'POLICY_ACTIVATION_CONDITIONS_MET' // e.g., flight departed, coverage starts
  | 'PARAMETRIC_EVENT_MONITORING_STARTED'
  | 'PARAMETRIC_EVENT_DATA_RECEIVED' // e.g., flight delay data from oracle
  | 'PARAMETRIC_EVENT_VERIFIED_TRUE' // Insured event occurred
  | 'PARAMETRIC_EVENT_VERIFIED_FALSE' // Insured event did not occur (or not to trigger level)
  | 'AUTOMATED_PAYOUT_INITIATED' // Corresponds to EVENT_TRIGGERED policy status
  | 'AUTOMATED_PAYOUT_STATUS_UPDATE' // Tracks stages of AutomatedPayoutStatus
  | 'AUTOMATED_PAYOUT_SUCCESSFUL'
  | 'AUTOMATED_PAYOUT_FAILED_REQUIRES_REVIEW'
  | 'POLICY_EXPIRED_EVENT_MET' // Expired, but event had triggered payout
  | 'POLICY_EXPIRED_NO_EVENT_TRIGGERED'
  | 'POLICY_CANCELLED_BY_USER'
  | 'POLICY_CANCELLED_BY_SYSTEM'
  | 'ESCROW_FUNDED_PREMIUM'
  | 'ESCROW_RELEASED_PAYOUT' // From policy escrow to user
  | 'ESCROW_CLOSED_EXPIRED' // Policy escrow closed after expiry with no event
  | 'NOTIFICATION_SENT_POLICYHOLDER'
  | 'NOTIFICATION_SENT_ADMIN';

export type DocumentType =
  | 'POLICY_CONFIRMATION' // Replaces "Policy Schedule"
  | 'CERTIFICATE_OF_INSURANCE' // Standard
  | 'TERMS_AND_CONDITIONS' // Standard
  | 'PAYMENT_RECEIPT' // Standard
  | 'PAYOUT_CONFIRMATION' // Confirmation of automated payout
  | 'EVENT_DATA_PROOF' // Optional: proof of event occurrence (e.g., link to flight data)
  | 'REFUND_CONFIRMATION' // If applicable
  | 'OTHER';

// Beneficiary and Endorsement types might be less common for simple parametric products initially
// but can be kept for future more complex offerings.
export type BeneficiaryType = 'PRIMARY' | 'CONTINGENT';
export type EndorsementType = 'COVERAGE_ADJUSTMENT' | 'INFO_CORRECTION' | 'OTHER';

// ============================================================================
// CORE POLICY & AUTOMATED PAYOUT STRUCTURES
// ============================================================================

export interface PolicyCoverageDetails {
  productType: InsuranceProductType;
  productName: string;
  tier: CoverageTier;
  coverageAmount: MoneyAmount; // The amount to be paid out if the parametric event occurs
  // Deductible is usually not applicable for simple parametric products
  // delayThresholdMinutes or similar specific trigger conditions are part of PayoutStructure now
  payoutStructure: PayoutStructure; // This now defines the trigger and payout amount(s)
  insuredEventDefinition: string; // Clear textual description of the trigger conditions
}

export interface FlightPolicyDetails {
  flightDetails: FlightDetailsForQuote; // Origin, Destination, Flight Number, Dates
  // Monitoring specific data points
  dataSourceConfirmation?: string; // Which data source(s) confirmed the event
  eventTimestamp?: string; // ISO 8601 - Exact time the parametric event was confirmed
  triggeringData?: Record<string, any>; // e.g., { "delayMinutes": 125, "dataSource": "FlightStatsOracle" }
}

export interface Policy {
  id: string; // UUID
  policyNumber: string; // Human-readable policy number
  trackingNumber?: string;
  userId?: string; // UUID of registered policyholder
  anonymousSessionId?: string; // If purchased anonymously
  status: PolicyStatus;
  product: {
    id: string;
    name: string;
    type: InsuranceProductType;
  };
  provider: ProviderInfo;
  coverage: PolicyCoverageDetails;
  flightPolicyDetails?: FlightPolicyDetails; // If it's a flight-related policy
  premium: MoneyAmount; // Total premium paid by the user
  paymentMethodUsed?: PaymentMethod;
  premiumPaymentTransactionId?: string;
  policyEscrowId?: string; // ID of the PayGo escrow holding the premium/coverage
  payoutWalletAddress?: string; // User's target wallet for payout (could be their custodial wallet)

  effectiveDate: string; // ISO 8601 - Coverage monitoring starts
  expirationDate: string; // ISO 8601 - Coverage monitoring ends
  purchaseDate: string; // ISO 8601

  automatedPayoutDetails?: AutomatedPayoutRecord; // Details of the automated payout if triggered

  cancellationDetails?: {
    cancelledBy: 'USER' | 'SYSTEM' | 'PROVIDER';
    reason: string;
    refundAmount?: MoneyAmount;
    refundTransactionId?: string;
    cancelledAt: string; // ISO 8601
  };
  lastUpdatedAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  metadata?: Record<string, any>;
  // Beneficiaries might be simplified or deferred for MVP parametric products
  // beneficiaries?: Beneficiary[];
  // Endorsements would be for changes pre-activation, rare for short-term parametric
  // endorsements?: Endorsement[];
  documents?: PolicyDocument[]; // Confirmation, T&Cs, Payout confirmation
}

export interface PolicySummary {
  id: string;
  policyNumber: string;
  productName: string;
  productType: InsuranceProductType;
  status: PolicyStatus;
  coverageAmount: MoneyAmount;
  premiumPaid: MoneyAmount;
  effectiveDate: string;
  expirationDate: string;
  purchaseDate: string;
  providerName: string;
  // Quick access for flight policies
  flightInfo?: {
    flightNumber?: string;
    origin?: string;
    destination?: string;
    scheduledDeparture?: string;
  };
  payoutStatus?: AutomatedPayoutStatus; // High-level status of any payout
}

// This replaces the traditional "Claim" object. It's a record of an automated payout.
export interface AutomatedPayoutRecord {
  id: string; // UUID for this payout record
  policyId: string;
  policyNumber: string;
  status: AutomatedPayoutStatus;
  eventVerificationTimestamp: string; // When the parametric event was confirmed
  triggeringEventDescription: string; // e.g., "Flight UA123 delayed by 125 minutes"
  expectedPayoutAmount: MoneyAmount; // Based on policy terms
  actualPayoutAmount?: MoneyAmount; // Actual amount transferred after fees, if any
  payoutTransactionId?: string; // PayGo transaction hash
  payoutProcessingAttempts?: number;
  lastAttemptTimestamp?: string;
  failureReason?: string; // If payout failed
  notes?: Array<{ note: string; timestamp: string; author: string }>; // System/admin notes for review cases
  initiatedAt: string; // ISO 8601
  lastUpdatedAt: string; // ISO 8601
  completedAt?: string; // ISO 8601, when payout successfully transferred
}

export interface PolicyEvent {
  id: string; // UUID
  policyId: string;
  payoutRecordId?: string; // If event relates to a specific automated payout
  type: PolicyEventType;
  timestamp: string; // ISO 8601
  description: string; // Human-readable description of the event
  actor: {
    type: 'USER' | 'SYSTEM_ORACLE' | 'SYSTEM_PAYMENT' | 'ADMIN' | 'PROVIDER_PLATFORM';
    id?: string; // e.g., OracleName, AdminUserId
  };
  details?: Record<string, any>; // Specific data, e.g., { "delayMinutes": 120, "dataSource": "FlightStats" }
}

export interface PolicyDocument {
  id: string; // UUID
  documentName: string;
  type: DocumentType;
  url: string; // Secure URL
  mimeType: string;
  fileSize?: number; // bytes
  createdAt: string; // ISO 8601
  metadata?: Record<string, any>;
}

// Simplified Beneficiary and Endorsement for now, if needed later
export interface Beneficiary {
  id: string;
  fullName: string;
  relationship: string;
  type: BeneficiaryType;
  percentage?: number;
  // Contact info might be extensive, consider if needed for MVP parametric
}

export interface Endorsement {
  id: string;
  type: EndorsementType;
  description: string;
  effectiveDate: string;
  details: Record<string, any>;
  createdAt: string;
}

// ============================================================================
// API REQUEST & RESPONSE DTOS (Specific to Parametric Policy Model)
// ============================================================================

// GetPolicyDetailsRequest and GetPolicyDetailsResponse (Policy object) remain largely similar conceptually
export interface GetPolicyDetailsRequest {
  policyId: string; // UUID or Policy Number
}
export type GetPolicyDetailsResponse = Policy;

// ListUserPoliciesRequest and ListUserPoliciesResponse (PolicySummary) also remain similar
export interface ListUserPoliciesRequest {
  userId?: string; // For admin queries
  status?: PolicyStatus;
  productType?: InsuranceProductType;
  limit?: number;
  offset?: number;
  sortBy?: 'purchaseDate' | 'expirationDate' | 'status';
  sortOrder?: 'asc' | 'desc';
}
export interface ListUserPoliciesResponse {
  policies: PolicySummary[];
  total: number;
  limit: number;
  offset: number;
}

// "Submit Claim" is GONE. The system triggers based on data.
// We might have an endpoint to *query the status of a potential automated payout* or *view payout records*.

export interface GetAutomatedPayoutRecordRequest {
  payoutRecordId?: string; // If known
  policyId?: string; // To get the payout record for a specific policy
}
export type GetAutomatedPayoutRecordResponse = AutomatedPayoutRecord | null; // Null if no payout record yet

export interface ListPolicyAutomatedPayoutsRequest { // Could be multiple payout events for tiered products
  policyId: string;
  status?: AutomatedPayoutStatus;
  limit?: number;
  offset?: number;
}
export interface ListPolicyAutomatedPayoutsResponse {
  payoutRecords: AutomatedPayoutRecord[];
  total: number;
  limit: number;
  offset: number;
}


// CancelPolicyRequest and Response remain conceptually similar, but reasons might differ
export interface CancelPolicyRequest {
  policyId: string;
  reason: string; // User's reason, if applicable
  requestedByUser: boolean;
}
export interface CancelPolicyResponse {
  policy: Policy; // Updated policy object with CANCELLED status
  message: string;
  refundDetails?: {
    amount: MoneyAmount;
    transactionId?: string;
    estimatedProcessingTime: string;
  };
}

// AddPolicyDocumentRequest is still relevant for T&Cs, confirmations, etc.
// but less so for "claim evidence" in the traditional sense.
export interface AddPolicyDocumentRequest {
  policyId: string;
  payoutRecordId?: string; // If doc relates to a specific payout (e.g., data proof)
  documentName: string;
  type: DocumentType;
  base64Content?: string;
  uploadUrl?: string;
  mimeType: string;
}
export type AddPolicyDocumentResponse = PolicyDocument;

// GetPolicyTimelineRequest and Response are still very relevant
export interface GetPolicyTimelineRequest {
  policyId: string;
  limit?: number;
  offset?: number;
  eventTypes?: PolicyEventType[]; // Filter by specific event types
}
export interface GetPolicyTimelineResponse {
  events: PolicyEvent[];
  total: number;
  limit: number;
  offset: number;
}

// This might be an internal or admin endpoint if a payout needs manual intervention
export interface ManuallyReviewPayoutRequest {
  payoutRecordId: string;
  action: 'APPROVE_MANUAL_PAYOUT' | 'REJECT_MANUAL_PAYOUT' | 'RETRY_AUTOMATED_PAYOUT';
  reason: string;
  notes?: string;
  updatedPayoutAmount?: MoneyAmount; // If admin adjusts payout
}
export interface ManuallyReviewPayoutResponse {
  payoutRecord: AutomatedPayoutRecord; // Updated record
  message: string;
}
