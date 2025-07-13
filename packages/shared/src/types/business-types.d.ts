export interface InsuranceProvider {
    id: string;
    name: string;
    slug: string;
    category: 'FIRST_PARTY_INSURER' | 'THIRD_PARTY_INSURER' | 'B2B_FINANCIAL_SERVICES' | 'OTA_PROVIDER';
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
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
export interface InsuranceProduct {
    id: string;
    providerId: string;
    name: string;
    description: string;
    category: 'FLIGHT_DELAY' | 'WEATHER' | 'COMPREHENSIVE' | 'CANCELLATION';
    coverageType: 'DELAY_COMPENSATION' | 'CANCELLATION_REFUND' | 'WEATHER_PROTECTION' | 'COMPREHENSIVE';
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ARCHIVED';
    pricing: {
        baseRate: number;
        maxCoverage: number;
        minCoverage: number;
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
export interface RiskMultiplier {
    factor: 'AIRLINE_PUNCTUALITY' | 'ROUTE_HISTORY' | 'WEATHER_SEASON' | 'AIRCRAFT_TYPE' | 'TIME_OF_DAY';
    multiplier: number;
    description: string;
    dataSource?: string;
}
export interface SeasonalFactor {
    season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
    regions: string[];
    multiplier: number;
    effectivePeriod: {
        startMonth: number;
        endMonth: number;
    };
}
export interface InsurancePolicy {
    id: string;
    policyNumber: string;
    status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CLAIMED' | 'CANCELLED';
    policyholder: PolicyHolder;
    provider: {
        id: string;
        name: string;
        contactInfo: string;
    };
    coverage: {
        type: string;
        amount: number;
        premium: number;
        deductible?: number;
        terms: PolicyTerms;
    };
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
    effectiveFrom: string;
    effectiveTo: string;
    purchasedAt: string;
    financial: {
        premiumPaid: number;
        escrowAmount: number;
        escrowAddress?: string;
        payoutAmount?: number;
        payoutStatus?: 'PENDING' | 'PROCESSED' | 'FAILED';
    };
    claims?: PolicyClaim[];
    verificationCode: string;
    documentHash?: string;
}
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
        communicationMethod: 'EMAIL' | 'SMS' | 'BOTH';
        language: string;
        timezone: string;
    };
}
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
export interface PolicyClaim {
    id: string;
    policyId: string;
    status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID';
    claimAmount: number;
    approvedAmount?: number;
    submittedAt: string;
    processedAt?: string;
    evidence: ClaimEvidence[];
    notes?: string;
    reviewedBy?: string;
}
export interface ClaimEvidence {
    type: 'FLIGHT_STATUS' | 'DELAY_CONFIRMATION' | 'BOARDING_PASS' | 'RECEIPT' | 'OTHER';
    description: string;
    fileUrl?: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    source?: 'USER_UPLOADED' | 'AUTOMATED_VERIFICATION' | 'THIRD_PARTY';
}
export interface RevenueRecord {
    id: string;
    type: 'PREMIUM' | 'COMMISSION' | 'FEE' | 'REFUND' | 'PAYOUT';
    amount: number;
    currency: string;
    policyId?: string;
    providerId?: string;
    userId?: string;
    distribution: RevenueDistribution[];
    accountingPeriod: string;
    reconciled: boolean;
    reconciledAt?: string;
    transactionDate: string;
    recordedAt: string;
}
export interface RevenueDistribution {
    party: 'TRIGGERR' | 'PROVIDER' | 'REINSURER' | 'AFFILIATE';
    partyId?: string;
    percentage: number;
    amount: number;
    walletAddress?: string;
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
    paidAt?: string;
}
export interface EscrowAccount {
    id: string;
    type: 'POLICY_PREMIUM' | 'PROVIDER_RESERVE' | 'CLAIM_PAYOUT';
    status: 'CREATED' | 'FUNDED' | 'ACTIVE' | 'RELEASED' | 'DISPUTED';
    totalAmount: number;
    availableAmount: number;
    reservedAmount: number;
    contractAddress: string;
    escrowAddress: string;
    releaseConditions: EscrowCondition[];
    depositor: string;
    beneficiary: string;
    arbiter?: string;
    createdAt: string;
    expiresAt?: string;
    releasedAt?: string;
    policyId?: string;
    providerId?: string;
}
export interface EscrowCondition {
    type: 'TIME_BASED' | 'EVENT_BASED' | 'MANUAL_APPROVAL' | 'ORACLE_TRIGGER';
    description: string;
    parameter?: any;
    status: 'PENDING' | 'MET' | 'FAILED';
    verifiedAt?: string;
}
export interface MarketRates {
    baseCurrency: string;
    exchangeRates: {
        [currency: string]: number;
    };
    lastUpdated: string;
    source: string;
}
export interface RiskAssessment {
    flightId: string;
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
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
export interface CompetitivePricing {
    productId: string;
    marketPosition: 'PREMIUM' | 'COMPETITIVE' | 'BUDGET';
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
        trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    };
}
export interface ComplianceRecord {
    providerId: string;
    jurisdiction: string;
    requirements: {
        licenseStatus: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'PENDING';
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
            status: 'CURRENT' | 'OVERDUE' | 'SUBMITTED';
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
export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CLAIMED' | 'CANCELLED';
export type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID';
export type ProviderCategory = 'FIRST_PARTY_INSURER' | 'THIRD_PARTY_INSURER' | 'B2B_FINANCIAL_SERVICES' | 'OTA_PROVIDER';
export type CoverageType = 'DELAY_COMPENSATION' | 'CANCELLATION_REFUND' | 'WEATHER_PROTECTION' | 'COMPREHENSIVE';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type RevenueType = 'PREMIUM' | 'COMMISSION' | 'FEE' | 'REFUND' | 'PAYOUT';
export type EscrowStatus = 'CREATED' | 'FUNDED' | 'ACTIVE' | 'RELEASED' | 'DISPUTED';
export declare function isInsuranceProvider(obj: any): obj is InsuranceProvider;
export declare function isInsurancePolicy(obj: any): obj is InsurancePolicy;
export declare function isEscrowAccount(obj: any): obj is EscrowAccount;
//# sourceMappingURL=business-types.d.ts.map