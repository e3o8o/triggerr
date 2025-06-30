import { z } from 'zod';
export declare const UUIDSchema: z.ZodString;
export declare const EmailSchema: z.ZodString;
export declare const TimestampSchema: z.ZodString;
export declare const CurrencyCodeSchema: z.ZodEnum<["USD", "EUR", "GBP", "CAD"]>;
export declare const CountryCodeSchema: z.ZodString;
export declare const AnonymousSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    cartItems: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    conversationId: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodString;
    createdAt: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    lastActiveAt: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        userAgent: z.ZodOptional<z.ZodString>;
        ipAddress: z.ZodOptional<z.ZodString>;
        referrer: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        userAgent?: string | undefined;
        ipAddress?: string | undefined;
        referrer?: string | undefined;
    }, {
        userAgent?: string | undefined;
        ipAddress?: string | undefined;
        referrer?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    sessionId: string;
    cartItems: string[];
    expiresAt: string;
    conversationId?: string | undefined;
    lastActiveAt?: string | undefined;
    metadata?: {
        userAgent?: string | undefined;
        ipAddress?: string | undefined;
        referrer?: string | undefined;
    } | undefined;
}, {
    sessionId: string;
    expiresAt: string;
    createdAt?: string | undefined;
    cartItems?: string[] | undefined;
    conversationId?: string | undefined;
    lastActiveAt?: string | undefined;
    metadata?: {
        userAgent?: string | undefined;
        ipAddress?: string | undefined;
        referrer?: string | undefined;
    } | undefined;
}>;
export declare const ChatMessageContentSchema: z.ZodString;
export declare const ChatMessageRequestSchema: z.ZodObject<{
    content: z.ZodString;
    conversationId: z.ZodOptional<z.ZodString>;
    anonymousSessionId: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodObject<{
        flightContext: z.ZodOptional<z.ZodObject<{
            flightNumber: z.ZodOptional<z.ZodString>;
            origin: z.ZodOptional<z.ZodString>;
            destination: z.ZodOptional<z.ZodString>;
            date: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            flightNumber?: string | undefined;
            origin?: string | undefined;
            destination?: string | undefined;
            date?: string | undefined;
        }, {
            flightNumber?: string | undefined;
            origin?: string | undefined;
            destination?: string | undefined;
            date?: string | undefined;
        }>>;
        insurancePreferences: z.ZodOptional<z.ZodObject<{
            coverageType: z.ZodOptional<z.ZodString>;
            maxPremium: z.ZodOptional<z.ZodNumber>;
            delayThreshold: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            coverageType?: string | undefined;
            maxPremium?: number | undefined;
            delayThreshold?: number | undefined;
        }, {
            coverageType?: string | undefined;
            maxPremium?: number | undefined;
            delayThreshold?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        flightContext?: {
            flightNumber?: string | undefined;
            origin?: string | undefined;
            destination?: string | undefined;
            date?: string | undefined;
        } | undefined;
        insurancePreferences?: {
            coverageType?: string | undefined;
            maxPremium?: number | undefined;
            delayThreshold?: number | undefined;
        } | undefined;
    }, {
        flightContext?: {
            flightNumber?: string | undefined;
            origin?: string | undefined;
            destination?: string | undefined;
            date?: string | undefined;
        } | undefined;
        insurancePreferences?: {
            coverageType?: string | undefined;
            maxPremium?: number | undefined;
            delayThreshold?: number | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    conversationId?: string | undefined;
    anonymousSessionId?: string | undefined;
    context?: {
        flightContext?: {
            flightNumber?: string | undefined;
            origin?: string | undefined;
            destination?: string | undefined;
            date?: string | undefined;
        } | undefined;
        insurancePreferences?: {
            coverageType?: string | undefined;
            maxPremium?: number | undefined;
            delayThreshold?: number | undefined;
        } | undefined;
    } | undefined;
}, {
    content: string;
    conversationId?: string | undefined;
    anonymousSessionId?: string | undefined;
    context?: {
        flightContext?: {
            flightNumber?: string | undefined;
            origin?: string | undefined;
            destination?: string | undefined;
            date?: string | undefined;
        } | undefined;
        insurancePreferences?: {
            coverageType?: string | undefined;
            maxPremium?: number | undefined;
            delayThreshold?: number | undefined;
        } | undefined;
    } | undefined;
}>;
export declare const FlightSearchInputSchema: z.ZodEffects<z.ZodObject<{
    flightNumber: z.ZodOptional<z.ZodString>;
    origin: z.ZodOptional<z.ZodString>;
    destination: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    naturalLanguageQuery: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    flightNumber?: string | undefined;
    origin?: string | undefined;
    destination?: string | undefined;
    date?: string | undefined;
    naturalLanguageQuery?: string | undefined;
}, {
    flightNumber?: string | undefined;
    origin?: string | undefined;
    destination?: string | undefined;
    date?: string | undefined;
    naturalLanguageQuery?: string | undefined;
}>, {
    flightNumber?: string | undefined;
    origin?: string | undefined;
    destination?: string | undefined;
    date?: string | undefined;
    naturalLanguageQuery?: string | undefined;
}, {
    flightNumber?: string | undefined;
    origin?: string | undefined;
    destination?: string | undefined;
    date?: string | undefined;
    naturalLanguageQuery?: string | undefined;
}>;
export declare const InsuranceQuoteRequestSchema: z.ZodObject<{
    flightContext: z.ZodEffects<z.ZodObject<{
        flightNumber: z.ZodOptional<z.ZodString>;
        origin: z.ZodOptional<z.ZodString>;
        destination: z.ZodOptional<z.ZodString>;
        date: z.ZodOptional<z.ZodString>;
        naturalLanguageQuery: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        flightNumber?: string | undefined;
        origin?: string | undefined;
        destination?: string | undefined;
        date?: string | undefined;
        naturalLanguageQuery?: string | undefined;
    }, {
        flightNumber?: string | undefined;
        origin?: string | undefined;
        destination?: string | undefined;
        date?: string | undefined;
        naturalLanguageQuery?: string | undefined;
    }>, {
        flightNumber?: string | undefined;
        origin?: string | undefined;
        destination?: string | undefined;
        date?: string | undefined;
        naturalLanguageQuery?: string | undefined;
    }, {
        flightNumber?: string | undefined;
        origin?: string | undefined;
        destination?: string | undefined;
        date?: string | undefined;
        naturalLanguageQuery?: string | undefined;
    }>;
    insurancePreferences: z.ZodOptional<z.ZodObject<{
        coverageType: z.ZodOptional<z.ZodString>;
        delayThresholdMinutes: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
        coverageAmountCents: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        coverageType?: string | undefined;
        delayThresholdMinutes?: string | undefined;
        coverageAmountCents?: number | undefined;
    }, {
        coverageType?: string | undefined;
        delayThresholdMinutes?: string | undefined;
        coverageAmountCents?: number | undefined;
    }>>;
    passengerCount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    flightContext: {
        flightNumber?: string | undefined;
        origin?: string | undefined;
        destination?: string | undefined;
        date?: string | undefined;
        naturalLanguageQuery?: string | undefined;
    };
    passengerCount: number;
    insurancePreferences?: {
        coverageType?: string | undefined;
        delayThresholdMinutes?: string | undefined;
        coverageAmountCents?: number | undefined;
    } | undefined;
}, {
    flightContext: {
        flightNumber?: string | undefined;
        origin?: string | undefined;
        destination?: string | undefined;
        date?: string | undefined;
        naturalLanguageQuery?: string | undefined;
    };
    insurancePreferences?: {
        coverageType?: string | undefined;
        delayThresholdMinutes?: string | undefined;
        coverageAmountCents?: number | undefined;
    } | undefined;
    passengerCount?: number | undefined;
}>;
export declare const AddToCartRequestSchema: z.ZodObject<{
    insuranceProductId: z.ZodString;
    flightContextSnapshot: z.ZodObject<{
        flightNumber: z.ZodString;
        originIata: z.ZodString;
        destinationIata: z.ZodString;
        scheduledDepartureUtc: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        flightNumber: string;
        originIata: string;
        destinationIata: string;
        scheduledDepartureUtc: string;
    }, {
        flightNumber: string;
        originIata: string;
        destinationIata: string;
        scheduledDepartureUtc: string;
    }>;
    quotedPremiumCents: z.ZodNumber;
    quotedCoverageCents: z.ZodNumber;
    quoteDetails: z.ZodRecord<z.ZodString, z.ZodAny>;
    anonymousSessionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    insuranceProductId: string;
    flightContextSnapshot: {
        flightNumber: string;
        originIata: string;
        destinationIata: string;
        scheduledDepartureUtc: string;
    };
    quotedPremiumCents: number;
    quotedCoverageCents: number;
    quoteDetails: Record<string, any>;
    anonymousSessionId?: string | undefined;
}, {
    insuranceProductId: string;
    flightContextSnapshot: {
        flightNumber: string;
        originIata: string;
        destinationIata: string;
        scheduledDepartureUtc: string;
    };
    quotedPremiumCents: number;
    quotedCoverageCents: number;
    quoteDetails: Record<string, any>;
    anonymousSessionId?: string | undefined;
}>;
export declare const PolicyPurchaseRequestSchema: z.ZodObject<{
    quoteCartItemIds: z.ZodArray<z.ZodString, "many">;
    paymentMethod: z.ZodObject<{
        type: z.ZodEnum<["STRIPE_PAYMENT_METHOD_ID", "CUSTODIAL_WALLET"]>;
        stripePaymentMethodId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "STRIPE_PAYMENT_METHOD_ID" | "CUSTODIAL_WALLET";
        stripePaymentMethodId?: string | undefined;
    }, {
        type: "STRIPE_PAYMENT_METHOD_ID" | "CUSTODIAL_WALLET";
        stripePaymentMethodId?: string | undefined;
    }>;
    policyholderDetails: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
    }, {
        email: string;
        firstName: string;
        lastName: string;
    }>;
    agreeToTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
}, "strip", z.ZodTypeAny, {
    quoteCartItemIds: string[];
    paymentMethod: {
        type: "STRIPE_PAYMENT_METHOD_ID" | "CUSTODIAL_WALLET";
        stripePaymentMethodId?: string | undefined;
    };
    policyholderDetails: {
        email: string;
        firstName: string;
        lastName: string;
    };
    agreeToTerms: boolean;
}, {
    quoteCartItemIds: string[];
    paymentMethod: {
        type: "STRIPE_PAYMENT_METHOD_ID" | "CUSTODIAL_WALLET";
        stripePaymentMethodId?: string | undefined;
    };
    policyholderDetails: {
        email: string;
        firstName: string;
        lastName: string;
    };
    agreeToTerms: boolean;
}>;
export declare const TrackPolicyRequestSchema: z.ZodObject<{
    policyVerificationCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    policyVerificationCode: string;
}, {
    policyVerificationCode: string;
}>;
export declare const UserSignupCompletionRequestSchema: z.ZodObject<{
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username?: string | undefined;
}, {
    username?: string | undefined;
}>;
export declare const SyncAnonymousDataRequestSchema: z.ZodObject<{
    anonymousSessionId: z.ZodString;
    conversationId: z.ZodOptional<z.ZodString>;
    cartItemIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    anonymousSessionId: string;
    conversationId?: string | undefined;
    cartItemIds?: string[] | undefined;
}, {
    anonymousSessionId: string;
    conversationId?: string | undefined;
    cartItemIds?: string[] | undefined;
}>;
export declare const UserFaucetRequestSchema: z.ZodObject<{
    amountCents: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    amountCents: number;
}, {
    amountCents?: number | undefined;
}>;
export declare const InternalFlightContextRequestSchema: z.ZodObject<{
    flightNumber: z.ZodOptional<z.ZodString>;
    originIata: z.ZodOptional<z.ZodString>;
    destinationIata: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    naturalLanguageQuery: z.ZodOptional<z.ZodString>;
    requiredFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    flightNumber?: string | undefined;
    date?: string | undefined;
    naturalLanguageQuery?: string | undefined;
    originIata?: string | undefined;
    destinationIata?: string | undefined;
    requiredFields?: string[] | undefined;
}, {
    flightNumber?: string | undefined;
    date?: string | undefined;
    naturalLanguageQuery?: string | undefined;
    originIata?: string | undefined;
    destinationIata?: string | undefined;
    requiredFields?: string[] | undefined;
}>;
export declare const FlightStatusCheckRequestSchema: z.ZodEffects<z.ZodObject<{
    policyId: z.ZodOptional<z.ZodString>;
    flightId: z.ZodOptional<z.ZodString>;
    flightNumber: z.ZodOptional<z.ZodString>;
    originIata: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    flightNumber?: string | undefined;
    date?: string | undefined;
    originIata?: string | undefined;
    policyId?: string | undefined;
    flightId?: string | undefined;
}, {
    flightNumber?: string | undefined;
    date?: string | undefined;
    originIata?: string | undefined;
    policyId?: string | undefined;
    flightId?: string | undefined;
}>, {
    flightNumber?: string | undefined;
    date?: string | undefined;
    originIata?: string | undefined;
    policyId?: string | undefined;
    flightId?: string | undefined;
}, {
    flightNumber?: string | undefined;
    date?: string | undefined;
    originIata?: string | undefined;
    policyId?: string | undefined;
    flightId?: string | undefined;
}>;
export declare const ProcessPayoutsRequestSchema: z.ZodObject<{
    policyIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    providerId: z.ZodOptional<z.ZodString>;
    processAllDue: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    processAllDue: boolean;
    policyIds?: string[] | undefined;
    providerId?: string | undefined;
}, {
    policyIds?: string[] | undefined;
    providerId?: string | undefined;
    processAllDue?: boolean | undefined;
}>;
export declare const StripeWebhookPayloadSchema: z.ZodObject<{
    id: z.ZodString;
    object: z.ZodLiteral<"event">;
    type: z.ZodString;
    data: z.ZodObject<{
        object: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        object: Record<string, any>;
    }, {
        object: Record<string, any>;
    }>;
}, "strip", z.ZodTypeAny, {
    object: "event";
    id: string;
    data: {
        object: Record<string, any>;
    };
    type: string;
}, {
    object: "event";
    id: string;
    data: {
        object: Record<string, any>;
    };
    type: string;
}>;
export declare const PayGoWebhookPayloadSchema: z.ZodObject<{
    eventType: z.ZodString;
    escrowId: z.ZodString;
    transactionHash: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, any>;
    eventType: string;
    escrowId: string;
    transactionHash: string;
}, {
    data: Record<string, any>;
    eventType: string;
    escrowId: string;
    transactionHash: string;
}>;
export declare const PaginationParamsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    offset?: number | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type AnonymousSessionInput = z.infer<typeof AnonymousSessionSchema>;
export type ChatMessageRequestInput = z.infer<typeof ChatMessageRequestSchema>;
export type FlightSearchInput = z.infer<typeof FlightSearchInputSchema>;
export type InsuranceQuoteRequestInput = z.infer<typeof InsuranceQuoteRequestSchema>;
export type AddToCartRequestInput = z.infer<typeof AddToCartRequestSchema>;
export type PolicyPurchaseRequestInput = z.infer<typeof PolicyPurchaseRequestSchema>;
export type TrackPolicyRequestInput = z.infer<typeof TrackPolicyRequestSchema>;
export type UserSignupCompletionRequestInput = z.infer<typeof UserSignupCompletionRequestSchema>;
export type SyncAnonymousDataRequestInput = z.infer<typeof SyncAnonymousDataRequestSchema>;
export type UserFaucetRequestInput = z.infer<typeof UserFaucetRequestSchema>;
export type InternalFlightContextRequestInput = z.infer<typeof InternalFlightContextRequestSchema>;
export type FlightStatusCheckRequestInput = z.infer<typeof FlightStatusCheckRequestSchema>;
export type ProcessPayoutsRequestInput = z.infer<typeof ProcessPayoutsRequestSchema>;
export type PaginationParamsInput = z.infer<typeof PaginationParamsSchema>;
//# sourceMappingURL=index.d.ts.map