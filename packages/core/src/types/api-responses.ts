/**
 * Entity-Aware API Response Types
 *
 * Supports Triggerr's multi-entity structure and regulatory compliance:
 * - Triggerr Direct LLC (Nevada, US operations)
 * - Preterag OÜ (Estonia, EU operations)
 * - Preterag Financial Solutions Inc. (Nevada, financial services)
 *
 * Ensures proper jurisdiction attribution and GDPR compliance.
 */

import type { Jurisdiction } from "../utils/jurisdiction";

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

export interface EntityInfo {
  /** Legal entity name (e.g., "Preterag OÜ") */
  legal: string;
  /** Brand name (e.g., "Triggerr") */
  brand: string;
  /** Entity jurisdiction (e.g., "estonia", "nevada") */
  jurisdiction: string;
  /** Compliance framework (e.g., "gdpr", "insurance-sandbox") */
  compliance: string;
}

export interface ComplianceMetadata {
  /** Whether GDPR applies to this response */
  gdprApplicable: boolean;
  /** Data retention period in days */
  dataRetentionDays: number;
  /** Processing legal basis (GDPR Article 6) */
  legalBasis?:
    | "consent"
    | "contract"
    | "legal_obligation"
    | "vital_interests"
    | "public_task"
    | "legitimate_interests";
  /** Data processing purpose */
  processingPurpose?: string;
  /** Geographic jurisdiction for this response */
  jurisdiction: Jurisdiction;
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string;
  /** Timezone for data timestamps */
  timezone: string;
  /** Locale for localized content */
  locale: string;
  /** Currency for monetary values */
  currency: string;
}

export interface ResponseMetadata {
  /** Response timestamp (ISO 8601) */
  timestamp: string;
  /** Request ID for tracing */
  requestId?: string;
  /** API version */
  version: string;
  /** Rate limiting information */
  rateLimit?: {
    remaining: number;
    reset: number;
    limit: number;
  };
  /** Cache information */
  cache?: {
    hit: boolean;
    ttl?: number;
    key?: string;
  };
}

// ============================================================================
// ENTITY-AWARE RESPONSE WRAPPERS
// ============================================================================

/**
 * Base entity-aware response wrapper
 * All API responses should extend this for compliance
 */
export interface EntityAwareResponse<T = any> {
  /** Response data payload */
  data: T;
  /** Entity providing this response */
  entity: EntityInfo;
  /** Compliance and jurisdiction metadata */
  compliance: ComplianceMetadata;
  /** Response metadata */
  meta: ResponseMetadata;
  /** Success indicator */
  success: true;
}

/**
 * Entity-aware error response
 */
export interface EntityAwareErrorResponse {
  /** Error information */
  error: {
    /** Error code */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details */
    details?: Record<string, any>;
    /** Error type classification */
    type:
      | "validation"
      | "authentication"
      | "authorization"
      | "business"
      | "system"
      | "external";
    /** Remediation suggestions */
    remediation?: string[];
  };
  /** Entity handling this error */
  entity: EntityInfo;
  /** Compliance and jurisdiction metadata */
  compliance: ComplianceMetadata;
  /** Response metadata */
  meta: ResponseMetadata;
  /** Success indicator */
  success: false;
}

/**
 * Generic API response (success or error)
 */
export type ApiResponse<T = any> =
  | EntityAwareResponse<T>
  | EntityAwareErrorResponse;

// ============================================================================
// JURISDICTION-SPECIFIC RESPONSE TYPES
// ============================================================================

/**
 * EU/Estonia-specific response (Preterag OÜ)
 */
export interface EUEntityResponse<T = any> extends EntityAwareResponse<T> {
  entity: {
    legal: "Preterag OÜ";
    brand: "Triggerr";
    jurisdiction: "estonia";
    compliance: "gdpr";
  };
  compliance: ComplianceMetadata & {
    gdprApplicable: true;
    jurisdiction: "EU";
    legalBasis:
      | "consent"
      | "contract"
      | "legal_obligation"
      | "vital_interests"
      | "public_task"
      | "legitimate_interests";
  };
}

/**
 * US-specific response (Triggerr Direct LLC)
 */
export interface USEntityResponse<T = any> extends EntityAwareResponse<T> {
  entity: {
    legal: "Triggerr Direct LLC";
    brand: "Triggerr";
    jurisdiction: "nevada";
    compliance: "insurance-sandbox";
  };
  compliance: ComplianceMetadata & {
    gdprApplicable: false;
    jurisdiction: "US";
  };
}

/**
 * Financial services response (Preterag Financial Solutions Inc.)
 */
export interface FinancialEntityResponse<T = any>
  extends EntityAwareResponse<T> {
  entity: {
    legal: "Preterag Financial Solutions Inc.";
    brand: "Triggerr";
    jurisdiction: "nevada";
    compliance: "financial-services";
  };
  compliance: ComplianceMetadata & {
    jurisdiction: "US";
    processingPurpose:
      | "financial_services"
      | "risk_assessment"
      | "payment_processing";
  };
}

/**
 * Global/multi-jurisdictional response (Parametrigger Inc.)
 */
export interface GlobalEntityResponse<T = any> extends EntityAwareResponse<T> {
  entity: {
    legal: "Parametrigger Inc.";
    brand: "Triggerr";
    jurisdiction: "nevada";
    compliance: "multi-jurisdictional";
  };
  compliance: ComplianceMetadata & {
    gdprApplicable: true; // Conservative approach
    jurisdiction: "GLOBAL";
  };
}

// ============================================================================
// SPECIALIZED RESPONSE TYPES
// ============================================================================

/**
 * Insurance quote response with entity awareness
 */
export interface InsuranceQuoteResponse
  extends EntityAwareResponse<{
    quoteId: string;
    premium: string;
    coverage: string;
    validUntil: string;
    product: {
      id: string;
      name: string;
      provider: string;
    };
    risk: {
      score: number;
      factors: Record<string, any>;
      confidence: number;
    };
  }> {}

/**
 * Policy purchase response with entity awareness
 */
export interface PolicyPurchaseResponse
  extends EntityAwareResponse<{
    policyId: string;
    policyNumber: string;
    status: "active" | "pending" | "cancelled";
    coverage: {
      amount: string;
      type: string;
      validFrom: string;
      validUntil: string;
    };
    payment: {
      method: "fiat" | "crypto";
      provider: "stripe" | "paygo" | "manual_crypto";
      details: {
        /** For crypto payments: blockchain network */
        network?: "paygo" | "ethereum" | "bitcoin";
        /** For fiat payments: card type or bank */
        cardType?: "visa" | "mastercard" | "amex" | "bank_transfer";
      };
      status: "completed" | "pending" | "failed";
      transactionId?: string;
    };
    escrow?: {
      address: string;
      amount: string;
      status: "created" | "funded" | "released";
    };
  }> {}

/**
 * User wallet response with entity awareness
 */
export interface WalletResponse
  extends EntityAwareResponse<{
    address: string;
    balance: {
      available: string;
      locked: string;
      total: string;
    };
    transactions: Array<{
      id: string;
      type: "deposit" | "withdrawal" | "escrow" | "payout";
      amount: string;
      status: "pending" | "completed" | "failed";
      timestamp: string;
    }>;
  }> {}

/**
 * Chat response with entity awareness
 */
export interface ChatResponse
  extends EntityAwareResponse<{
    conversationId: string;
    messageId: string;
    message: string;
    intent?: string;
    context?: Record<string, any>;
    suggestions?: string[];
    quote?: {
      id: string;
      premium: string;
      coverage: string;
    };
  }> {}

// ============================================================================
// RESPONSE BUILDER UTILITIES
// ============================================================================

/**
 * Response builder configuration
 */
export interface ResponseBuilderConfig {
  jurisdiction: Jurisdiction;
  countryCode?: string;
  requestId?: string;
  version?: string;
  legalBasis?: ComplianceMetadata["legalBasis"];
  processingPurpose?: string;
}

/**
 * Type guard for entity-aware responses
 */
export function isEntityAwareResponse<T>(
  response: any,
): response is EntityAwareResponse<T> {
  return (
    response &&
    typeof response === "object" &&
    "data" in response &&
    "entity" in response &&
    "compliance" in response &&
    "meta" in response &&
    response.success === true
  );
}

/**
 * Type guard for entity-aware error responses
 */
export function isEntityAwareErrorResponse(
  response: any,
): response is EntityAwareErrorResponse {
  return (
    response &&
    typeof response === "object" &&
    "error" in response &&
    "entity" in response &&
    "compliance" in response &&
    "meta" in response &&
    response.success === false
  );
}

/**
 * Extract entity information from response
 */
export function extractEntityInfo(
  response: EntityAwareResponse | EntityAwareErrorResponse,
): EntityInfo {
  return response.entity;
}

/**
 * Extract compliance metadata from response
 */
export function extractComplianceInfo(
  response: EntityAwareResponse | EntityAwareErrorResponse,
): ComplianceMetadata {
  return response.compliance;
}

/**
 * Check if response requires GDPR handling
 */
export function requiresGDPRHandling(
  response: EntityAwareResponse | EntityAwareErrorResponse,
): boolean {
  return response.compliance.gdprApplicable;
}

/**
 * Get data retention period from response
 */
export function getDataRetentionDays(
  response: EntityAwareResponse | EntityAwareErrorResponse,
): number {
  return response.compliance.dataRetentionDays;
}

// ============================================================================
// COMPLIANCE CONSTANTS
// ============================================================================

/**
 * Standard compliance notices by jurisdiction
 */
export const COMPLIANCE_NOTICES = {
  EU: "This service is provided by Preterag OÜ, Estonia. Your data is processed in accordance with GDPR.",
  US: "This service is provided by Triggerr Direct LLC, Nevada. Insurance services subject to state regulations.",
  GLOBAL:
    "This service is provided by Parametrigger Inc., Nevada. Global data protection standards apply.",
} as const;

/**
 * Standard data retention periods
 */
export const DATA_RETENTION = {
  EU_GDPR: 365, // 1 year for GDPR compliance
  US_INSURANCE: 2555, // 7 years for insurance records
  GLOBAL_DEFAULT: 365, // Conservative default
} as const;

/**
 * API version constant
 */
export const API_VERSION = "v1" as const;
