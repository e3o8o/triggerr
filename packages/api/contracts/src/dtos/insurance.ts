// ============================================================================
// INSURANCE QUOTE & POLICY API TYPES
// ============================================================================

/**
 * Insurance product types supported by the platform
 */
export type InsuranceProductType =
  | 'flight_delay'
  | 'flight_cancellation'
  | 'baggage_delay'
  | 'weather_disruption'
  | 'travel_comprehensive';

/**
 * Coverage tiers available
 */
export type CoverageTier = 'economy' | 'business' | 'premium' | 'custom';

/**
 * Policy status types
 */
export type PolicyStatus =
  | 'pending'
  | 'active'
  | 'expired'
  | 'claimed'
  | 'cancelled'
  | 'voided';

/**
 * Claim status types
 */
export type ClaimStatus =
  | 'pending'
  | 'approved'
  | 'paid'
  | 'denied'
  | 'under_review';

/**
 * Payment methods for policy purchase
 */
export type PaymentMethod = 'stripe' | 'paygo_wallet' | 'paygo_escrow';

/**
 * Insurance product definition
 */
export interface InsuranceProduct {
  id: string;
  name: string;
  type: InsuranceProductType;
  description: string;
  coverageTiers: CoverageTierDefinition[];
  delayThresholds: number[]; // in minutes
  maxCoverageAmount: number; // in cents
  minCoverageAmount: number; // in cents
  basePrice: number; // in cents
  isActive: boolean;
  terms?: string;
  exclusions?: string[];
}

/**
 * Coverage tier definition
 */
export interface CoverageTierDefinition {
  tier: CoverageTier;
  name: string;
  minCoverage: number; // in cents
  maxCoverage: number; // in cents
  basePremium: number; // in cents
  description: string;
  features: string[];
}

/**
 * Insurance quote request
 */
export interface InsuranceQuoteRequest {
  productType: InsuranceProductType;
  flightDetails: FlightDetailsForQuote;
  coverageDetails: CoverageRequest;
  passengerDetails?: PassengerDetails;
  sessionId?: string; // For anonymous users
}

/**
 * Flight details for quote calculation
 */
export interface FlightDetailsForQuote {
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureDate: string; // ISO 8601
  departureTime: string; // ISO 8601
  arrivalTime?: string; // ISO 8601
  aircraft?: string;
  route?: string;
}

/**
 * Coverage request details
 */
export interface CoverageRequest {
  tier: CoverageTier;
  coverageAmount: number; // in cents
  delayThreshold: number; // in minutes
  customOptions?: Record<string, any>;
}

/**
 * Passenger details for quote
 */
export interface PassengerDetails {
  count: number;
  ages?: number[];
  cabinClass?: string;
  specialRequirements?: string[];
}

/**
 * Insurance quote response
 */
export interface InsuranceQuoteResponse {
  quoteId: string;
  productType: InsuranceProductType;
  product: InsuranceProduct;
  coverage: QuoteCoverage;
  premium: PremiumBreakdown;
  flightRisk: FlightRiskAssessment;
  validUntil: string; // ISO 8601
  terms: string;
  exclusions: string[];
  provider: ProviderInfo;
}

/**
 * Quote coverage details
 */
export interface QuoteCoverage {
  tier: CoverageTier;
  amount: number; // in cents
  delayThreshold: number; // in minutes
  payoutStructure: PayoutStructure;
  conditions: string[];
}

/**
 * Payout structure for coverage
 */
export interface PayoutStructure {
  type: 'fixed' | 'tiered' | 'proportional';
  amounts: PayoutTier[];
}

/**
 * Payout tier definition
 */
export interface PayoutTier {
  minDelay: number; // in minutes
  maxDelay?: number; // in minutes, null for unlimited
  payoutAmount: number; // in cents
  payoutPercentage?: number; // percentage of coverage amount
}

/**
 * Premium breakdown
 */
export interface PremiumBreakdown {
  basePremium: number; // in cents
  riskAdjustment: number; // in cents (can be negative)
  platformFee: number; // in cents
  taxes: number; // in cents
  total: number; // in cents
  currency: string; // 'USD'
  breakdown: PremiumComponent[];
}

/**
 * Premium component for detailed breakdown
 */
export interface PremiumComponent {
  name: string;
  amount: number; // in cents
  description: string;
  type: 'base' | 'risk' | 'fee' | 'tax' | 'discount';
}

/**
 * Flight risk assessment
 */
export interface FlightRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  delayProbability: number; // 0-1
  historicalDelayRate: number; // 0-1
  weatherRisk: number; // 0-1
  airportCongestion: number; // 0-1
  airlineReliability: number; // 0-1
  seasonalFactors: number; // 0-1
  riskFactors: string[];
}

/**
 * Provider information
 */
export interface ProviderInfo {
  id: string;
  name: string;
  displayName: string;
  tier: 'startup' | 'standard' | 'premium' | 'enterprise';
  rating: number; // 1-5
  isFirstParty: boolean;
  logo?: string;
  description?: string;
}

/**
 * Policy purchase request
 */
export interface PolicyPurchaseRequest {
  quoteId: string;
  paymentMethod: PaymentMethod;
  paymentDetails?: PaymentDetails;
  confirmTerms: boolean;
  customerInfo?: CustomerInfo;
}

/**
 * Payment details for purchase
 */
export interface PaymentDetails {
  stripePaymentIntentId?: string; // For Stripe payments
  paygoWalletId?: string; // For PayGo wallet payments
  escrowId?: string; // For escrow-based payments
}

/**
 * Customer information for policy
 */
export interface CustomerInfo {
  email?: string;
  phone?: string;
  emergencyContact?: EmergencyContact;
  travelPreferences?: TravelPreferences;
}

/**
 * Emergency contact information
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

/**
 * Travel preferences
 */
export interface TravelPreferences {
  notifications: NotificationPreferences;
  communications: CommunicationPreferences;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  flightUpdates: boolean;
  policyUpdates: boolean;
  claimUpdates: boolean;
  walletTransactions: boolean;
  marketingEmails: boolean;
}

/**
 * Communication preferences
 */
export interface CommunicationPreferences {
  language: string; // ISO 639-1 code
  timezone: string; // IANA timezone
  preferredMethod: 'email' | 'sms' | 'push' | 'in_app';
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
}

/**
 * Policy purchase response
 */
export interface PolicyPurchaseResponse {
  policyId: string;
  policyNumber: string;
  status: PolicyStatus;
  coverage: PolicyCoverage;
  payment: PaymentConfirmation;
  escrow?: EscrowInfo;
  documents: PolicyDocument[];
  nextSteps: string[];
}

/**
 * Policy coverage details
 */
export interface PolicyCoverage {
  productType: InsuranceProductType;
  tier: CoverageTier;
  amount: number; // in cents
  delayThreshold: number; // in minutes
  effectiveDate: string; // ISO 8601
  expirationDate: string; // ISO 8601
  flightDetails: FlightDetailsForQuote;
  payoutStructure: PayoutStructure;
}

/**
 * Payment confirmation
 */
export interface PaymentConfirmation {
  paymentId: string;
  method: PaymentMethod;
  amount: number; // in cents
  currency: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionId?: string;
  receipt?: string;
}

/**
 * Escrow information for policy
 */
export interface EscrowInfo {
  escrowId: string;
  blockchainId: string;
  status: 'created' | 'funded' | 'fulfilled' | 'released' | 'expired';
  amount: number; // in cents
  expiresAt: string; // ISO 8601
  txHash?: string;
}

/**
 * Policy document
 */
export interface PolicyDocument {
  id: string;
  type: 'policy' | 'certificate' | 'terms' | 'receipt';
  name: string;
  url: string;
  format: 'pdf' | 'html' | 'text';
  size?: number; // in bytes
  createdAt: string; // ISO 8601
}

/**
 * Policy tracking request
 */
export interface PolicyTrackingRequest {
  identifier: string; // Can be policy ID, policy number, or tracking number
  type?: 'policy_id' | 'policy_number' | 'tracking_number';
}

/**
 * Policy tracking response
 */
export interface PolicyTrackingResponse {
  policy: PolicyDetails;
  status: PolicyStatus;
  coverage: PolicyCoverage;
  claims: ClaimSummary[];
  flightStatus?: FlightStatus;
  timeline: PolicyEvent[];
  documents: PolicyDocument[];
}

/**
 * Policy details
 */
export interface PolicyDetails {
  id: string;
  policyNumber: string;
  trackingNumber: string;
  status: PolicyStatus;
  purchasedAt: string; // ISO 8601
  provider: ProviderInfo;
  customer?: CustomerSummary;
}

/**
 * Customer summary for policy
 */
export interface CustomerSummary {
  id: string;
  email?: string;
  phone?: string;
  isAnonymous: boolean;
}

/**
 * Claim summary
 */
export interface ClaimSummary {
  id: string;
  status: ClaimStatus;
  amount: number; // in cents
  filedAt: string; // ISO 8601
  processedAt?: string; // ISO 8601
  paidAt?: string; // ISO 8601
  reason: string;
}

/**
 * Flight status for policy tracking
 */
export interface FlightStatus {
  flightNumber: string;
  status: 'scheduled' | 'delayed' | 'cancelled' | 'departed' | 'arrived';
  delay?: number; // in minutes
  actualDeparture?: string; // ISO 8601
  actualArrival?: string; // ISO 8601
  gate?: string;
  terminal?: string;
  lastUpdated: string; // ISO 8601
}

/**
 * Policy event for timeline
 */
export interface PolicyEvent {
  id: string;
  type: 'purchased' | 'activated' | 'flight_update' | 'claim_filed' | 'claim_paid' | 'expired';
  description: string;
  timestamp: string; // ISO 8601
  details?: Record<string, any>;
}

/**
 * Insurance products list response
 */
export interface InsuranceProductsResponse {
  products: InsuranceProduct[];
  total: number;
  categories: ProductCategory[];
  providers: ProviderInfo[];
}

/**
 * Product category for organization
 */
export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  productTypes: InsuranceProductType[];
  icon?: string;
}

/**
 * Add to cart request for anonymous users
 */
export interface AddToCartRequest {
  quoteId: string;
  sessionId: string; // Anonymous session ID
  expiresAt?: string; // ISO 8601, defaults to quote expiration
}

/**
 * Add to cart response
 */
export interface AddToCartResponse {
  cartItemId: string;
  quote: InsuranceQuoteResponse;
  addedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  message: string;
}

/**
 * Cart item for anonymous users
 */
export interface CartItem {
  id: string;
  quoteId: string;
  quote: InsuranceQuoteResponse;
  addedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  status: 'active' | 'expired' | 'purchased';
}

/**
 * Anonymous cart response
 */
export interface AnonymousCartResponse {
  items: CartItem[];
  total: number;
  sessionId: string;
  expiresAt: string; // ISO 8601
}
