// MVP Insurance Products (matching seed data)
export const INSURANCE_PRODUCTS = {
    FLIGHT_DELAY_60: 'PROD_IIDR001',
    FLIGHT_DELAY_120: 'PROD_IIDR002',
    PRETERAG_REINSURANCE_A: 'PROD_PRTF001',
    AEROASSURE_COMPREHENSIVE: 'PROD_AASP001',
};
// Providers (matching seed data)
export const PROVIDERS = {
    INSUREINNIE_DIRECT: 'PROV_IIDR001',
    PRETERAG_FINANCIAL: 'PROV_PRTF001',
    AEROASSURE_PARTNERS: 'PROV_AASP001',
};
// API Rate Limits for anonymous vs authenticated users
export const RATE_LIMITS = {
    ANONYMOUS_QUOTE_REQUESTS: 10, // per hour
    AUTHENTICATED_QUOTE_REQUESTS: 100, // per hour
    POLICY_PURCHASES: 5, // per hour
    CHAT_MESSAGES_ANONYMOUS: 20, // per hour
    CHAT_MESSAGES_AUTHENTICATED: 200, // per hour
};
// PayGo wallet constants
export const PAYGO = {
    CENTS_PER_TOKEN: 100, // $1.00 = 100 cents
    MIN_ESCROW_AMOUNT: 50, // $0.50 minimum
    MAX_ESCROW_AMOUNT: 1000000, // $10,000 maximum for MVP
    FAUCET_AMOUNT: 1000000, // $10,000 for testing (in cents)
    FAUCET_COOLDOWN_HOURS: 24, // Once per day
};
// Chat interface limits
export const CHAT = {
    MAX_MESSAGE_LENGTH: 2000,
    MAX_CONVERSATION_MESSAGES: 100,
    ANONYMOUS_SESSION_EXPIRE_HOURS: 24,
    MAX_CONVERSATIONS_PER_USER: 50,
    MESSAGE_HISTORY_DAYS: 30,
};
// Quote cart limits
export const QUOTE_CART = {
    MAX_ITEMS: 10,
    ITEM_EXPIRE_HOURS: 24,
    MAX_PREMIUM_CENTS: 50000, // $500 max premium per item
};
// Insurance coverage constants
export const COVERAGE = {
    MIN_COVERAGE_CENTS: 5000, // $50 minimum
    MAX_COVERAGE_CENTS: 500000, // $5,000 maximum for MVP
    DEFAULT_DELAY_THRESHOLD_MINUTES: 60,
    AVAILABLE_DELAY_THRESHOLDS: [60, 120, 180, 240],
};
// Flight data constants
export const FLIGHT_DATA = {
    MAX_SEARCH_RESULTS: 20,
    SEARCH_TIMEOUT_MS: 10000,
    CACHE_TTL_MINUTES: 15,
    MAX_FLIGHT_NUMBER_LENGTH: 10,
};
// Authentication constants
export const AUTH = {
    SESSION_EXPIRE_DAYS: 30,
    REFRESH_TOKEN_EXPIRE_DAYS: 90,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
};
// Notification constants
export const NOTIFICATIONS = {
    EMAIL_RETRY_ATTEMPTS: 3,
    SMS_RETRY_ATTEMPTS: 2,
    WEBHOOK_RETRY_ATTEMPTS: 5,
    NOTIFICATION_BATCH_SIZE: 100,
};
// External API timeouts
export const API_TIMEOUTS = {
    AVIATIONSTACK_MS: 8000,
    FLIGHTAWARE_MS: 10000,
    OPENSKY_MS: 5000,
    WEATHER_API_MS: 5000,
    LLM_API_MS: 30000,
};
// Error codes
export const ERROR_CODES = {
    INVALID_FLIGHT_NUMBER: 'INVALID_FLIGHT_NUMBER',
    FLIGHT_NOT_FOUND: 'FLIGHT_NOT_FOUND',
    QUOTE_EXPIRED: 'QUOTE_EXPIRED',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    POLICY_NOT_FOUND: 'POLICY_NOT_FOUND',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    WALLET_ERROR: 'WALLET_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    ANONYMOUS_SESSION_EXPIRED: 'ANONYMOUS_SESSION_EXPIRED',
};
// Success messages
export const SUCCESS_MESSAGES = {
    POLICY_CREATED: 'Policy created successfully',
    PAYMENT_PROCESSED: 'Payment processed successfully',
    PAYOUT_SENT: 'Payout sent to your wallet',
    QUOTE_GENERATED: 'Quote generated successfully',
    CART_UPDATED: 'Cart updated successfully',
    WALLET_CREATED: 'Wallet created successfully',
};
//# sourceMappingURL=index.js.map