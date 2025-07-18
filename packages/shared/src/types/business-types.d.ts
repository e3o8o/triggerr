/**
 * Auto-generated business types from database schema
 *
 * DO NOT EDIT THIS FILE MANUALLY
 * Generated by: packages/core/scripts/generate-business-types.ts
 * Source: packages/core/src/database/schema.ts
 *
 * To regenerate this file, run: bun run generate:types
 */

// ============================================================================
// ENUM TYPES (Auto-generated from schema)
// ============================================================================

export type ProviderStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";

export type ProviderCategory = "FIRST_PARTY_INSURER" | "THIRD_PARTY_INSURER" | "B2B_FINANCIAL_SERVICES" | "OTA_PROVIDER";

export type ProviderTier = "STARTUP" | "STANDARD" | "PREMIUM" | "ENTERPRISE";

export type ProductStatus = "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED" | "kept for records";

export type ProductCategory = "FLIGHT_PARAMETRIC" | "TRAVEL_COMPREHENSIVE" | "GADGET_INSURANCE" | "WEATHER_PARAMETRIC" | "EVENT_CANCELLATION" | "SHIPPING_CARGO" | "CUSTOM_PARAMETRIC" | "GENERAL_INSURANCE";

export type PolicyStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CLAIMED" | "CANCELLED" | "FAILED";

export type CoverageType = "DELAY_60" | "DELAY_120" | "CANCELLATION" | "BAGGAGE" | "COMPREHENSIVE" | "CUSTOM";

export type FlightStatus = "SCHEDULED" | "ACTIVE" | "LANDED" | "CANCELLED" | "DIVERTED" | "DELAYED";

export type EscrowStatus = "PENDING" | "FULFILLED" | "RELEASED" | "EXPIRED" | "CANCELLED";

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type EscrowModel = "SINGLE_SIDED" | "DUAL_SIDED" | "COMBINED" | "HYBRID_PARTIAL_COLLATERAL" | "COLLATERALIZED_PROVIDER_POOL" | "BONDED_LIABILITY_POOL" | "PEER_TO_PEER_POOL" | "SUBSCRIPTION_BASED_POOL" | "DYNAMIC_RISK_POOL" | "PREDICTION_MARKET" | "SYNTHETIC_DEFI_COVERAGE" | "NFT_POLICY" | "DAO_GOVERNED_POOL" | "MULTI_ORACLE_VERIFIED";

export type PremiumReturnPolicy = "PROVIDER_KEEPS_PREMIUM" | "RETURN_TO_CUSTOMER";

export type EscrowType = "POLICY" | "USER_WALLET";

export type EscrowPurpose = "DEPOSIT" | "WITHDRAW" | "STAKE" | "BOND" | "COLLATERAL" | "INVESTMENT" | "RESERVE" | "POOL" | "CUSTOM";

export type RevenueType = "PLATFORM_FEE" | "PROVIDER_SHARE" | "TRANSACTION_FEE" | "ADJUSTMENT" | "corrections" | "PENALTY" | "BONUS";

export type BeneficiaryType = "PRIMARY" | "CONTINGENT";

export type EndorsementType = "COVERAGE_ADJUSTMENT" | "INFO_CORRECTION" | "OTHER";

export type PolicyEventType = "POLICY_CREATED" | "PREMIUM_CALCULATED" | "PAYMENT_PENDING" | "PAYMENT_RECEIVED" | "POLICY_ACTIVATED" | "FLIGHT_MONITORING_ACTIVE" | "FLIGHT_EVENT_DETECTED" | "delay" | "CLAIM_CONDITION_MET" | "CLAIM_INITIATED" | "PAYOUT_PROCESSING" | "PAYOUT_COMPLETED" | "PAYOUT_FAILED" | "POLICY_EXPIRED" | "POLICY_CANCELLED_USER" | "POLICY_CANCELLED_SYSTEM" | "non-payment" | "POLICY_UPDATED" | "REFUND_PROCESSED";



// ============================================================================
// INTERFACE DEFINITIONS (Based on database schema)
// ============================================================================

/**
 * Insurance Provider interface matching the 'provider' table schema
 */
export interface InsuranceProvider {
  id: string;
  name: string;
  slug: string;
  category: ProviderCategory;
  status: ProviderStatus;
  tier: ProviderTier;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  supportEmail?: string;
  walletAddress: string;
  walletPrivateKey?: string; // Encrypted
  apiEndpoint?: string;
  webhookSecret?: string; // Encrypted
  commissionRate: string; // Decimal as string
  businessAddress?: string;
  businessRegistrationNumber?: string;
  payoutPreference?: {
    schedule: string;
    minimumAmount?: number;
  };
  preferredChain: string;
  linkedAirlineIcaoCode?: string;

  // Escrow Model Configuration
  escrowModel: EscrowModel;
  premiumReturnPolicy: PremiumReturnPolicy;
  collateralRequirement: string; // Decimal as string
  poolAddress?: string;
  poolMinimumBalance: string; // Decimal as string
  escrowConfiguration?: any; // JSONB field

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Insurance Product interface matching the 'providerProduct' table schema
 */
export interface InsuranceProduct {
  id: string;
  providerId: string;
  name: string;
  description?: string;
  category: ProductCategory;
  status: ProductStatus;
  baseRate: string; // Decimal as string
  maxCoverage: string; // Decimal as string
  metadata?: any; // JSONB field
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Insurance Policy interface matching the 'policy' table schema
 */
export interface InsurancePolicy {
  id: string;
  userId: string;
  providerId: string;
  productId: string;
  flightId: string;
  status: PolicyStatus;
  coverageType: CoverageType;
  premiumAmount: string; // Decimal as string
  coverageAmount: string; // Decimal as string
  effectiveDate: Date;
  expiryDate: Date;
  purchaseDate: Date;
  flightDate: Date;
  delayThresholdMinutes: number;
  policyTerms?: any; // JSONB field
  verificationCode: string;
  escrowId?: string;
  payoutAmount?: string; // Decimal as string
  payoutDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Escrow Account interface matching the 'escrow' table schema
 */
export interface EscrowAccount {
  id: string;
  type: EscrowType;
  purpose: EscrowPurpose;
  status: EscrowStatus;
  userId?: string;
  policyId?: string;
  providerId?: string;
  totalAmount: string; // Decimal as string
  availableAmount: string; // Decimal as string
  reservedAmount: string; // Decimal as string
  escrowAddress: string;
  releaseConditions?: any; // JSONB field
  metadata?: any; // JSONB field
  expiresAt?: Date;
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payout interface matching the 'payout' table schema
 */
export interface PolicyPayout {
  id: string;
  policyId: string;
  escrowId?: string;
  amount: string; // Decimal as string
  status: PayoutStatus;
  recipientAddress: string;
  transactionHash?: string;
  metadata?: any; // JSONB field
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Revenue Record interface matching the 'revenue' table schema
 */
export interface RevenueRecord {
  id: string;
  type: RevenueType;
  amount: string; // Decimal as string
  currency: string;
  policyId?: string;
  providerId?: string;
  userId?: string;
  escrowId?: string;
  transactionHash?: string;
  blockchainNetwork?: string;
  feePercentage?: string; // Decimal as string
  netAmount?: string; // Decimal as string
  grossAmount?: string; // Decimal as string
  description?: string;
  metadata?: any; // JSONB field
  accountingPeriod?: string;
  reconciled: boolean;
  reconciledAt?: Date;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Flight Data interface matching the 'flight' table schema
 */
export interface FlightData {
  id: string;
  flightNumber: string;
  airlineIcaoCode: string;
  originAirportIataCode: string;
  destinationAirportIataCode: string;
  scheduledDepartureTime: Date;
  scheduledArrivalTime: Date;
  actualDepartureTime?: Date;
  actualArrivalTime?: Date;
  status: FlightStatus;
  aircraftTypeId?: string;
  delayMinutes?: number;
  metadata?: any; // JSONB field
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Quote interface matching the 'quote' table schema
 */
export interface InsuranceQuote {
  id: string;
  userId?: string;
  sessionId?: string;
  flightId: string;
  providerId: string;
  productId: string;
  coverageType: CoverageType;
  premiumAmount: string; // Decimal as string
  coverageAmount: string; // Decimal as string
  riskScore?: string; // Decimal as string
  delayThresholdMinutes: number;
  validUntil: Date;
  flightDate: Date;
  quoteData?: any; // JSONB field
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// UTILITY TYPES & LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy type aliases for backward compatibility
 */
export type ClaimStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PAID";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

// ============================================================================
// TYPE GUARDS
// ============================================================================

export declare function isInsuranceProvider(obj: any): obj is InsuranceProvider;
export declare function isInsurancePolicy(obj: any): obj is InsurancePolicy;
export declare function isEscrowAccount(obj: any): obj is EscrowAccount;

// ============================================================================
// COMPLEX BUSINESS TYPES (Manual definitions for business logic)
// ============================================================================

/**
 * Risk multiplier for pricing calculations
 */
export interface RiskMultiplier {
  factor:
    | "AIRLINE_PUNCTUALITY"
    | "ROUTE_HISTORY"
    | "WEATHER_SEASON"
    | "AIRCRAFT_TYPE"
    | "TIME_OF_DAY";
  multiplier: number;
  description: string;
  dataSource?: string;
}

/**
 * Seasonal pricing factor
 */
export interface SeasonalFactor {
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL";
  regions: string[];
  multiplier: number;
  effectivePeriod: {
    startMonth: number;
    endMonth: number;
  };
}

/**
 * Policy holder information
 */
export interface PolicyHolder {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country: string;
    postalCode?: string;
  };
  preferences?: {
    communicationMethod: "EMAIL" | "SMS" | "BOTH";
    language: string;
    timezone: string;
  };
}

/**
 * Policy terms and conditions
 */
export interface PolicyTerms {
  delayThreshold: number;
  maxPayout: number;
  coverageIncludes: string[];
  exclusions: string[];
  claimRequirements: string[];
  cancellationPolicy: {
    allowedUntil: string;
    refundPercentage: number;
  };
  disputeResolution: {
    process: string;
    jurisdiction: string;
    arbitrationClause?: string;
  };
}

/**
 * Policy claim information
 */
export interface PolicyClaim {
  id: string;
  policyId: string;
  status: ClaimStatus;
  claimAmount: number;
  approvedAmount?: number;
  submittedAt: string;
  processedAt?: string;
  evidence: ClaimEvidence[];
  notes?: string;
  reviewedBy?: string;
}

/**
 * Claim evidence documentation
 */
export interface ClaimEvidence {
  type:
    | "FLIGHT_STATUS"
    | "DELAY_CONFIRMATION"
    | "BOARDING_PASS"
    | "RECEIPT"
    | "OTHER";
  description: string;
  fileUrl?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  source?: "USER_UPLOADED" | "AUTOMATED_VERIFICATION" | "THIRD_PARTY";
}

/**
 * Escrow condition for release
 */
export interface EscrowCondition {
  type: "TIME_BASED" | "EVENT_BASED" | "MANUAL_APPROVAL" | "ORACLE_TRIGGER";
  description: string;
  parameter?: any;
  status: "PENDING" | "MET" | "FAILED";
  verifiedAt?: string;
}

/**
 * Market exchange rates
 */
export interface MarketRates {
  baseCurrency: string;
  exchangeRates: {
    [currency: string]: number;
  };
  lastUpdated: string;
  source: string;
}

/**
 * Risk assessment for flight
 */
export interface RiskAssessment {
  flightId: string;
  overallRisk: RiskLevel;
  riskScore: number;
  factors: {
    historicalDelays: {
      score: number;
      data: {
        onTimePercentage: number;
        averageDelayMinutes: number;
        worstDelayMinutes: number;
      };
    };
    weatherRisk: {
      score: number;
      data: {
        forecastConfidence: number;
        adverseConditionsProbability: number;
        historicalWeatherDelays: number;
      };
    };
    airlinePerformance: {
      score: number;
      data: {
        punctualityRating: number;
        operationalReliability: number;
        fleetAge: number;
      };
    };
    routeComplexity: {
      score: number;
      data: {
        airportCongestion: number;
        airspaceRestrictions: number;
        alternateAirports: number;
      };
    };
  };
  calculatedAt: string;
  validUntil: string;
}

/**
 * Competitive pricing analysis
 */
export interface CompetitivePricing {
  productId: string;
  marketPosition: "PREMIUM" | "COMPETITIVE" | "BUDGET";
  benchmarks: {
    providerId: string;
    providerName: string;
    premiumRate: number;
    coverageAmount: number;
    marketShare?: number;
  }[];
  recommendedPricing: {
    minRate: number;
    maxRate: number;
    optimalRate: number;
    reasoning: string[];
  };
  lastAnalyzed: string;
}

/**
 * Business performance metrics
 */
export interface BusinessMetrics {
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalRevenue: number;
    totalPremiums: number;
    totalPayouts: number;
    totalCommissions: number;
    policiesSold: number;
    claimsProcessed: number;
    claimApprovalRate: number;
    averageClaimProcessingTime: number;
    newCustomers: number;
    customerRetentionRate: number;
    customerSatisfactionScore: number;
    lossRatio: number;
    combinedRatio: number;
    reserveAdequacy: number;
  };
}

/**
 * Provider performance tracking
 */
export interface ProviderPerformance {
  providerId: string;
  period: {
    start: string;
    end: string;
  };
  performance: {
    volumeMetrics: {
      policiesUnderwritten: number;
      totalPremiumVolume: number;
      marketShare: number;
    };
    qualityMetrics: {
      claimApprovalRate: number;
      averageClaimProcessingTime: number;
      customerSatisfactionRating: number;
      disputeRate: number;
    };
    financialMetrics: {
      lossRatio: number;
      profitMargin: number;
      reserveRatio: number;
      paymentTimeliness: number;
    };
  };
  ranking: {
    overall: number;
    category: number;
    trend: "IMPROVING" | "STABLE" | "DECLINING";
  };
}

/**
 * Compliance record tracking
 */
export interface ComplianceRecord {
  providerId: string;
  jurisdiction: string;
  requirements: {
    licenseStatus: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "PENDING";
    capitalRequirement: {
      required: number;
      current: number;
      compliant: boolean;
    };
    reserveRequirement: {
      required: number;
      current: number;
      compliant: boolean;
    };
    reportingCompliance: {
      lastReport: string;
      nextDue: string;
      status: "CURRENT" | "OVERDUE" | "SUBMITTED";
    };
  };
  auditHistory: {
    date: string;
    auditor: string;
    findings: string[];
    resolved: boolean;
  }[];
  lastUpdated: string;
}
