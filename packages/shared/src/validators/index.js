import { z } from 'zod';
import { PAYGO, CHAT, QUOTE_CART, COVERAGE, FLIGHT_DATA } from '../constants';
// ===========================================================================
// SHARED PRIMITIVE SCHEMAS
// ===========================================================================
export const UUIDSchema = z.string().uuid({ message: "Invalid UUID format" });
export const EmailSchema = z.string().email({ message: "Invalid email address" });
export const TimestampSchema = z.string().datetime({ message: "Invalid ISO 8601 timestamp" });
export const CurrencyCodeSchema = z.enum(['USD', 'EUR', 'GBP', 'CAD']);
export const CountryCodeSchema = z.string().length(2, { message: "Country code must be 2 characters" });
// ===========================================================================
// ANONYMOUS SESSION & CHAT SCHEMAS
// ===========================================================================
export const AnonymousSessionSchema = z.object({
    sessionId: UUIDSchema,
    cartItems: z.array(UUIDSchema).default([]),
    conversationId: UUIDSchema.optional(),
    expiresAt: TimestampSchema,
    createdAt: TimestampSchema.optional().default(() => new Date().toISOString()),
    lastActiveAt: TimestampSchema.optional(),
    metadata: z.object({
        userAgent: z.string().optional(),
        ipAddress: z.string().ip().optional(),
        referrer: z.string().url().optional(),
    }).optional(),
});
export const ChatMessageContentSchema = z.string().min(1, { message: "Message content cannot be empty" }).max(CHAT.MAX_MESSAGE_LENGTH, { message: `Message content cannot exceed ${CHAT.MAX_MESSAGE_LENGTH} characters` });
export const ChatMessageRequestSchema = z.object({
    content: ChatMessageContentSchema,
    conversationId: UUIDSchema.optional(),
    anonymousSessionId: UUIDSchema.optional(),
    // attachments: z.array(UUIDSchema).optional(), // Future: file uploads
    context: z.object({
        flightContext: z.object({
            flightNumber: z.string().max(FLIGHT_DATA.MAX_FLIGHT_NUMBER_LENGTH).optional(),
            origin: z.string().length(3).optional(),
            destination: z.string().length(3).optional(),
            date: z.string().datetime().optional(),
        }).optional(),
        insurancePreferences: z.object({
            coverageType: z.string().optional(), // Could be enum later
            maxPremium: z.number().int().positive().optional(),
            delayThreshold: z.number().int().positive().optional(),
        }).optional(),
    }).optional(),
});
// ===========================================================================
// FLIGHT & QUOTE SCHEMAS
// ===========================================================================
export const FlightSearchInputSchema = z.object({
    flightNumber: z.string().max(FLIGHT_DATA.MAX_FLIGHT_NUMBER_LENGTH).optional(),
    origin: z.string().length(3, { message: "Origin IATA code must be 3 characters" }).optional(),
    destination: z.string().length(3, { message: "Destination IATA code must be 3 characters" }).optional(),
    date: TimestampSchema.optional(), // Date of departure
    naturalLanguageQuery: z.string().max(500, { message: "Query too long" }).optional(),
}).refine(data => data.flightNumber || (data.origin && data.destination && data.date) || data.naturalLanguageQuery, { message: "Must provide flight number, or origin/destination/date, or natural language query" });
export const InsuranceQuoteRequestSchema = z.object({
    flightContext: FlightSearchInputSchema, // Re-use flight search
    insurancePreferences: z.object({
        coverageType: z.string().optional(), // e.g., 'FLIGHT_DELAY'
        delayThresholdMinutes: z.enum(COVERAGE.AVAILABLE_DELAY_THRESHOLDS.map(String)).optional(),
        coverageAmountCents: z.number().int().min(COVERAGE.MIN_COVERAGE_CENTS).max(COVERAGE.MAX_COVERAGE_CENTS).optional(),
    }).optional(),
    passengerCount: z.number().int().min(1).max(9).optional().default(1),
});
// ===========================================================================
// QUOTE CART & POLICY SCHEMAS
// ===========================================================================
export const AddToCartRequestSchema = z.object({
    insuranceProductId: UUIDSchema, // Could also be a string if products have non-UUID IDs
    flightContextSnapshot: z.object({
        flightNumber: z.string(),
        originIata: z.string().length(3),
        destinationIata: z.string().length(3),
        scheduledDepartureUtc: TimestampSchema,
    }),
    quotedPremiumCents: z.number().int().positive().max(QUOTE_CART.MAX_PREMIUM_CENTS),
    quotedCoverageCents: z.number().int().positive().max(COVERAGE.MAX_COVERAGE_CENTS),
    quoteDetails: z.record(z.any()), // Store the full quote object
    anonymousSessionId: UUIDSchema.optional(), // If user is not logged in
});
export const PolicyPurchaseRequestSchema = z.object({
    quoteCartItemIds: z.array(UUIDSchema).min(1, { message: "At least one quote item is required" }),
    paymentMethod: z.object({
        type: z.enum(['STRIPE_PAYMENT_METHOD_ID', 'CUSTODIAL_WALLET']),
        stripePaymentMethodId: z.string().optional(), // Required if type is STRIPE_...
    }),
    policyholderDetails: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: EmailSchema,
        // Add other details as needed: address, phone, etc.
    }),
    agreeToTerms: z.boolean().refine(val => val === true, { message: "You must agree to the terms and conditions" }),
});
export const TrackPolicyRequestSchema = z.object({
    policyVerificationCode: z.string().min(6).max(20), // Or policy number
});
// ===========================================================================
// USER & AUTHENTICATION SCHEMAS
// ===========================================================================
export const UserSignupCompletionRequestSchema = z.object({
    // Assuming BetterAuth handles initial signup, this is for post-signup steps
    // e.g., setting a username if not derived from email, agreeing to terms, etc.
    username: z.string().min(3).max(30).optional(),
    // preferences: z.record(z.any()).optional(),
});
export const SyncAnonymousDataRequestSchema = z.object({
    anonymousSessionId: UUIDSchema,
    conversationId: UUIDSchema.optional(),
    cartItemIds: z.array(UUIDSchema).optional(),
});
// ===========================================================================
// WALLET SCHEMAS
// ===========================================================================
export const UserFaucetRequestSchema = z.object({
    amountCents: z.number().int().positive().max(PAYGO.FAUCET_AMOUNT).optional().default(PAYGO.FAUCET_AMOUNT),
});
// ===========================================================================
// INTERNAL API SCHEMAS
// ===========================================================================
export const InternalFlightContextRequestSchema = z.object({
    flightNumber: z.string().optional(),
    originIata: z.string().length(3).optional(),
    destinationIata: z.string().length(3).optional(),
    date: TimestampSchema.optional(),
    naturalLanguageQuery: z.string().optional(),
    requiredFields: z.array(z.string()).optional(), // e.g., ['status', 'delayMinutes']
});
export const FlightStatusCheckRequestSchema = z.object({
    policyId: UUIDSchema.optional(),
    flightId: UUIDSchema.optional(), // Internal flight record ID
    // OR flight details
    flightNumber: z.string().optional(),
    originIata: z.string().length(3).optional(),
    date: TimestampSchema.optional(),
}).refine(data => data.policyId || data.flightId || (data.flightNumber && data.originIata && data.date), {
    message: "Must provide policyId, flightId, or flight details (number, origin, date)"
});
export const ProcessPayoutsRequestSchema = z.object({
    policyIds: z.array(UUIDSchema).optional(), // Process specific policies
    providerId: UUIDSchema.optional(), // Process for a specific provider
    processAllDue: z.boolean().optional().default(false), // Process all due payouts
});
// ===========================================================================
// WEBHOOK SCHEMAS (Basic structure, can be expanded per provider)
// ===========================================================================
export const StripeWebhookPayloadSchema = z.object({
    id: z.string(),
    object: z.literal('event'),
    type: z.string(), // e.g., 'payment_intent.succeeded'
    data: z.object({
        object: z.record(z.any()),
    }),
    // ... other Stripe event fields
});
export const PayGoWebhookPayloadSchema = z.object({
    eventType: z.string(), // e.g., 'ESCROW_RELEASED', 'ESCROW_FUNDED'
    escrowId: z.string(),
    transactionHash: z.string(),
    data: z.record(z.any()),
    // ... other PayGo event fields
});
// ===========================================================================
// UTILITY SCHEMAS
// ===========================================================================
export const PaginationParamsSchema = z.object({
    page: z.number().int().min(1).optional().default(1),
    limit: z.number().int().min(1).max(100).optional().default(20),
    offset: z.number().int().min(0).optional(),
});
//# sourceMappingURL=index.js.map