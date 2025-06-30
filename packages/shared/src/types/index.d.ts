export * from './canonical-models';
export * from './chat-types';
export * from './api-types';
export * from './business-types';
export * from './auth-types';
export type UUID = string;
export type Timestamp = string;
export type EmailAddress = string;
export type PhoneNumber = string;
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD';
export type CountryCode = string;
export type LanguageCode = string;
export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export type Status = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'ARCHIVED';
export interface MoneyAmount {
    cents: number;
    currency: CurrencyCode;
    formatted?: string;
}
export interface PriceRange {
    min: MoneyAmount;
    max: MoneyAmount;
}
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface Address {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: CountryCode;
}
export interface TimeRange {
    start: Timestamp;
    end: Timestamp;
}
export interface BusinessHours {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    timezone: string;
}
export interface FileUpload {
    filename: string;
    contentType: string;
    size: number;
    url?: string;
    uploadedAt?: Timestamp;
}
export interface ContactInfo {
    email?: EmailAddress;
    phone?: PhoneNumber;
    address?: Address;
    website?: string;
}
export interface AuditMetadata {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy?: UUID;
    updatedBy?: UUID;
    version?: number;
}
export interface FeatureFlag {
    name: string;
    enabled: boolean;
    rolloutPercentage?: number;
    conditions?: Record<string, any>;
}
export type Environment = 'development' | 'staging' | 'production' | 'test';
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export interface SearchQuery {
    query?: string;
    filters?: Record<string, any>;
    sort?: {
        field: string;
        direction: 'ASC' | 'DESC';
    };
    pagination?: PaginationParams;
}
export interface FilterOption {
    key: string;
    value: any;
    label?: string;
    count?: number;
}
export interface ConfigValue {
    key: string;
    value: string | number | boolean | object;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    description?: string;
    isSecret?: boolean;
}
export interface RateLimit {
    requests: number;
    windowMs: number;
    identifier?: string;
}
export interface RateLimitStatus {
    limit: number;
    remaining: number;
    resetTime: Timestamp;
    blocked: boolean;
}
//# sourceMappingURL=index.d.ts.map