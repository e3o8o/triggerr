// ============================================================================
// BUSINESS DOMAIN TYPES
// ============================================================================

// Core business entities and domain-specific types for the insurance platform

// ============================================================================
// INSURANCE BUSINESS TYPES
// ============================================================================

// Insurance provider business information
export interface InsuranceProvider {
  id: string;
  name: string;
  slug: string;
  category:
    | "FIRST_PARTY_INSURER"
    | "THIRD_PARTY_INSURER"
    | "B2B_FINANCIAL_SERVICES"
    | "OTA_PROVIDER";
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  supportEmail?: string;
  businessInfo: {
    licenseNumber?: string;
    regulatoryBody?: string;
    creditRating?: string;
    establishedYear?: number;
    headquarters?: string;
  };
  operationalInfo: {
    coverageRegions: string[];
    supportedCurrencies: string[];
    businessHours?: string;
    emergencyContact?: string;
  };
  financialInfo: {
    walletAddress: string;
    minimumCapital: number;
    reserveRequirement: number;
    commissionRate: number;
  };
}

// Insurance product definition
export interface InsuranceProduct {
  id: string;
  providerId: string;
  name: string;
  description: string;
  category: "FLIGHT_DELAY" | "WEATHER" | "COMPREHENSIVE" | "CANCELLATION";
  coverageType:
    | "DELAY_COMPENSATION"
    | "CANCELLATION_REFUND"
    | "WEATHER_PROTECTION"
    | "COMPREHENSIVE";
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "ARCHIVED";
  pricing: {
    baseRate: number; // Base premium rate as decimal (e.g., 0.015 = 1.5%)
    maxCoverage: number; // Maximum coverage amount in cents
    minCoverage: number; // Minimum coverage amount in cents
    riskMultipliers: RiskMultiplier[];
  };
  terms: {
    delayThresholdMinutes?: number;
    maxClaimAmount: number;
    claimDeadlineDays: number;
    exclusions: string[];
    conditions: string[];
  };
  availability: {
    regions: string[];
    airlineRestrictions?: string[];
    routeRestrictions?: string[];
    seasonalFactors?: SeasonalFactor[];
  };
}

// Risk assessment factors
export interface RiskMultiplier {
  factor:
    | "AIRLINE_PUNCTUALITY"
    | "ROUTE_HISTORY"
    | "WEATHER_SEASON"
    | "AIRCRAFT_TYPE"
    | "TIME_OF_DAY";
  multiplier: number; // 1.0 = no change, >1.0 = higher risk, <1.0 = lower risk
  description: string;
  dataSource?: string;
}

// Seasonal pricing factors
export interface SeasonalFactor {
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL";
  regions: string[];
  multiplier: number;
  effectivePeriod: {
    startMonth: number; // 1-12
    endMonth: number; // 1-12
  };
}

// ============================================================================
// POLICY BUSINESS TYPES
// ============================================================================

// Insurance policy with business logic
export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "CLAIMED" | "CANCELLED";

  // Parties involved
  policyholder: PolicyHolder;
  provider: {
    id: string;
    name: string;
    contactInfo: string;
  };

  // Coverage details
  coverage: {
    type: string;
    amount: number; // Coverage amount in cents
    premium: number; // Premium paid in cents
    deductible?: number;
    terms: PolicyTerms;
  };

  // Flight information
  insuredFlight: {
    flightNumber: string;
    airline: string;
    route: {
      origin: string;
      destination: string;
    };
    schedule: {
      departureTime: string;
      arrivalTime: string;
      timezone: string;
    };
  };

  // Dates and validity
  effectiveFrom: string;
  effectiveTo: string;
  purchasedAt: string;

  // Financial tracking
  financial: {
    premiumPaid: number;
    escrowAmount: number;
    escrowAddress?: string;
    payoutAmount?: number;
    payoutStatus?: "PENDING" | "PROCESSED" | "FAILED";
  };

  // Claim information
  claims?: PolicyClaim[];

  // Verification
  verificationCode: string;
  documentHash?: string;
}

// Policy holder information
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

// Policy terms and conditions
export interface PolicyTerms {
  delayThreshold: number; // Minutes
  maxPayout: number; // Cents
  coverageIncludes: string[];
  exclusions: string[];
  claimRequirements: string[];
  cancellationPolicy: {
    allowedUntil: string; // ISO timestamp
    refundPercentage: number; // 0.0 to 1.0
  };
  disputeResolution: {
    process: string;
    jurisdiction: string;
    arbitrationClause?: string;
  };
}

// Policy claim
export interface PolicyClaim {
  id: string;
  policyId: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PAID";
  claimAmount: number; // Cents
  approvedAmount?: number; // Cents
  submittedAt: string;
  processedAt?: string;
  evidence: ClaimEvidence[];
  notes?: string;
  reviewedBy?: string;
}

// Claim evidence
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

// ============================================================================
// FINANCIAL BUSINESS TYPES
// ============================================================================

// Revenue tracking and sharing
export interface RevenueRecord {
  id: string;
  type: "PREMIUM" | "COMMISSION" | "FEE" | "REFUND" | "PAYOUT";
  amount: number; // Cents
  currency: string;

  // Related entities
  policyId?: string;
  providerId?: string;
  userId?: string;

  // Revenue sharing
  distribution: RevenueDistribution[];

  // Accounting
  accountingPeriod: string; // YYYY-MM format
  reconciled: boolean;
  reconciledAt?: string;

  // Timestamps
  transactionDate: string;
  recordedAt: string;
}

// Revenue distribution among parties
export interface RevenueDistribution {
  party: "TRIGGERR" | "PROVIDER" | "REINSURER" | "AFFILIATE";
  partyId?: string;
  percentage: number; // 0.0 to 1.0
  amount: number; // Cents
  walletAddress?: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  paidAt?: string;
}

// Escrow management
export interface EscrowAccount {
  id: string;
  type: "POLICY_PREMIUM" | "PROVIDER_RESERVE" | "CLAIM_PAYOUT";
  status: "CREATED" | "FUNDED" | "ACTIVE" | "RELEASED" | "DISPUTED";

  // Financial details
  totalAmount: number; // Cents
  availableAmount: number; // Cents
  reservedAmount: number; // Cents

  // Blockchain details
  contractAddress: string;
  escrowAddress: string;
  releaseConditions: EscrowCondition[];

  // Parties
  depositor: string; // Wallet address
  beneficiary: string; // Wallet address
  arbiter?: string; // Wallet address

  // Timing
  createdAt: string;
  expiresAt?: string;
  releasedAt?: string;

  // Related business entities
  policyId?: string;
  providerId?: string;
}

// Escrow release conditions
export interface EscrowCondition {
  type: "TIME_BASED" | "EVENT_BASED" | "MANUAL_APPROVAL" | "ORACLE_TRIGGER";
  description: string;
  parameter?: any; // Condition-specific data
  status: "PENDING" | "MET" | "FAILED";
  verifiedAt?: string;
}

// ============================================================================
// MARKET AND PRICING TYPES
// ============================================================================

// Market rates and pricing
export interface MarketRates {
  baseCurrency: string;
  exchangeRates: {
    [currency: string]: number;
  };
  lastUpdated: string;
  source: string;
}

// Risk assessment data
export interface RiskAssessment {
  flightId: string;
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  riskScore: number; // 0.0 to 1.0
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

// Competitive pricing analysis
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

// ============================================================================
// OPERATIONAL BUSINESS TYPES
// ============================================================================

// Business metrics and KPIs
export interface BusinessMetrics {
  period: {
    start: string;
    end: string;
  };
  metrics: {
    // Financial
    totalRevenue: number;
    totalPremiums: number;
    totalPayouts: number;
    totalCommissions: number;

    // Operational
    policiesSold: number;
    claimsProcessed: number;
    claimApprovalRate: number;
    averageClaimProcessingTime: number; // Hours

    // Customer
    newCustomers: number;
    customerRetentionRate: number;
    customerSatisfactionScore: number;

    // Risk
    lossRatio: number; // Claims paid / Premiums collected
    combinedRatio: number; // (Claims + Expenses) / Premiums
    reserveAdequacy: number;
  };
}

// Provider performance tracking
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

// Regulatory compliance tracking
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

// ============================================================================
// EXPORT UTILITY TYPES
// ============================================================================

// Union types for common enums
export type PolicyStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "CLAIMED"
  | "CANCELLED";
export type ClaimStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PAID";
export type ProviderCategory =
  | "FIRST_PARTY_INSURER"
  | "THIRD_PARTY_INSURER"
  | "B2B_FINANCIAL_SERVICES"
  | "OTA_PROVIDER";
export type CoverageType =
  | "DELAY_COMPENSATION"
  | "CANCELLATION_REFUND"
  | "WEATHER_PROTECTION"
  | "COMPREHENSIVE";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type RevenueType =
  | "PREMIUM"
  | "COMMISSION"
  | "FEE"
  | "REFUND"
  | "PAYOUT";
export type EscrowStatus =
  | "CREATED"
  | "FUNDED"
  | "ACTIVE"
  | "RELEASED"
  | "DISPUTED";

// Type guards for business entities
export function isInsuranceProvider(obj: any): obj is InsuranceProvider {
  return obj && typeof obj.id === "string" && obj.category && obj.businessInfo;
}

export function isInsurancePolicy(obj: any): obj is InsurancePolicy {
  return (
    obj && typeof obj.id === "string" && obj.policyNumber && obj.policyholder
  );
}

export function isEscrowAccount(obj: any): obj is EscrowAccount {
  return (
    obj && typeof obj.id === "string" && obj.contractAddress && obj.totalAmount
  );
}
