export declare const INSURANCE_PRODUCTS: {
    readonly FLIGHT_DELAY_60: "PROD_IIDR001";
    readonly FLIGHT_DELAY_120: "PROD_IIDR002";
    readonly PRETERAG_REINSURANCE_A: "PROD_PRTF001";
    readonly AEROASSURE_COMPREHENSIVE: "PROD_AASP001";
};
export declare const PROVIDERS: {
    readonly INSUREINNIE_DIRECT: "PROV_IIDR001";
    readonly PRETERAG_FINANCIAL: "PROV_PRTF001";
    readonly AEROASSURE_PARTNERS: "PROV_AASP001";
};
export declare const RATE_LIMITS: {
    readonly ANONYMOUS_QUOTE_REQUESTS: 10;
    readonly AUTHENTICATED_QUOTE_REQUESTS: 100;
    readonly POLICY_PURCHASES: 5;
    readonly CHAT_MESSAGES_ANONYMOUS: 20;
    readonly CHAT_MESSAGES_AUTHENTICATED: 200;
};
export declare const PAYGO: {
    readonly CENTS_PER_TOKEN: 100;
    readonly MIN_ESCROW_AMOUNT: 50;
    readonly MAX_ESCROW_AMOUNT: 1000000;
    readonly FAUCET_AMOUNT: 1000000;
    readonly FAUCET_COOLDOWN_HOURS: 24;
};
export declare const CHAT: {
    readonly MAX_MESSAGE_LENGTH: 2000;
    readonly MAX_CONVERSATION_MESSAGES: 100;
    readonly ANONYMOUS_SESSION_EXPIRE_HOURS: 24;
    readonly MAX_CONVERSATIONS_PER_USER: 50;
    readonly MESSAGE_HISTORY_DAYS: 30;
};
export declare const QUOTE_CART: {
    readonly MAX_ITEMS: 10;
    readonly ITEM_EXPIRE_HOURS: 24;
    readonly MAX_PREMIUM_CENTS: 50000;
};
export declare const COVERAGE: {
    readonly MIN_COVERAGE_CENTS: 5000;
    readonly MAX_COVERAGE_CENTS: 500000;
    readonly DEFAULT_DELAY_THRESHOLD_MINUTES: 60;
    readonly AVAILABLE_DELAY_THRESHOLDS: readonly [60, 120, 180, 240];
};
export declare const FLIGHT_DATA: {
    readonly MAX_SEARCH_RESULTS: 20;
    readonly SEARCH_TIMEOUT_MS: 10000;
    readonly CACHE_TTL_MINUTES: 15;
    readonly MAX_FLIGHT_NUMBER_LENGTH: 10;
};
export declare const AUTH: {
    readonly SESSION_EXPIRE_DAYS: 30;
    readonly REFRESH_TOKEN_EXPIRE_DAYS: 90;
    readonly MAX_LOGIN_ATTEMPTS: 5;
    readonly LOCKOUT_DURATION_MINUTES: 15;
};
export declare const NOTIFICATIONS: {
    readonly EMAIL_RETRY_ATTEMPTS: 3;
    readonly SMS_RETRY_ATTEMPTS: 2;
    readonly WEBHOOK_RETRY_ATTEMPTS: 5;
    readonly NOTIFICATION_BATCH_SIZE: 100;
};
export declare const API_TIMEOUTS: {
    readonly AVIATIONSTACK_MS: 8000;
    readonly FLIGHTAWARE_MS: 10000;
    readonly OPENSKY_MS: 5000;
    readonly WEATHER_API_MS: 5000;
    readonly LLM_API_MS: 30000;
};
export declare const ERROR_CODES: {
    readonly INVALID_FLIGHT_NUMBER: "INVALID_FLIGHT_NUMBER";
    readonly FLIGHT_NOT_FOUND: "FLIGHT_NOT_FOUND";
    readonly QUOTE_EXPIRED: "QUOTE_EXPIRED";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly POLICY_NOT_FOUND: "POLICY_NOT_FOUND";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly WALLET_ERROR: "WALLET_ERROR";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly ANONYMOUS_SESSION_EXPIRED: "ANONYMOUS_SESSION_EXPIRED";
};
export declare const SUCCESS_MESSAGES: {
    readonly POLICY_CREATED: "Policy created successfully";
    readonly PAYMENT_PROCESSED: "Payment processed successfully";
    readonly PAYOUT_SENT: "Payout sent to your wallet";
    readonly QUOTE_GENERATED: "Quote generated successfully";
    readonly CART_UPDATED: "Cart updated successfully";
    readonly WALLET_CREATED: "Wallet created successfully";
};
export type InsuranceProductId = typeof INSURANCE_PRODUCTS[keyof typeof INSURANCE_PRODUCTS];
export type ProviderId = typeof PROVIDERS[keyof typeof PROVIDERS];
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type SuccessMessage = typeof SUCCESS_MESSAGES[keyof typeof SUCCESS_MESSAGES];
//# sourceMappingURL=index.d.ts.map