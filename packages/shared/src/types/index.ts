// Re-export all shared type definitions
export * from "../models/canonical-models";
export * from "./chat-types";
export * from "./api-types";
export * from "./business-types";
export * from "./auth-types";

// Common utility types
export type UUID = string;
export type Timestamp = string; // ISO 8601 timestamp
export type EmailAddress = string;
export type PhoneNumber = string;
export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD";
export type CountryCode = string; // ISO 3166-1 alpha-2
export type LanguageCode = string; // ISO 639-1

// Pagination types
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

// API Response wrapper types are exported from './api-types'

// Status types used across the platform
export type Status =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING"
  | "SUSPENDED"
  | "ARCHIVED";

// Money and pricing types
export interface MoneyAmount {
  cents: number; // Amount in cents to avoid floating point issues
  currency: CurrencyCode;
  formatted?: string; // e.g., "$12.34"
}

export interface PriceRange {
  min: MoneyAmount;
  max: MoneyAmount;
}

// Geographic types
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

// Time-related types
export interface TimeRange {
  start: Timestamp;
  end: Timestamp;
}

export interface BusinessHours {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // HH:MM format
  closeTime: string; // HH:MM format
  timezone: string;
}

// File and media types
export interface FileUpload {
  filename: string;
  contentType: string;
  size: number;
  url?: string;
  uploadedAt?: Timestamp;
}

// Contact information
export interface ContactInfo {
  email?: EmailAddress;
  phone?: PhoneNumber;
  address?: Address;
  website?: string;
}

// Audit trail types
export interface AuditMetadata {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: UUID;
  updatedBy?: UUID;
  version?: number;
}

// Feature flag types
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: Record<string, any>;
}

// Environment types
export type Environment = "development" | "staging" | "production" | "test";

// Log level types
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

// Notification types
export type NotificationChannel = "EMAIL" | "SMS" | "PUSH" | "WEBHOOK";
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// NotificationTemplate is exported from other modules

// Search and filter types
export interface SearchQuery {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: "ASC" | "DESC";
  };
  pagination?: PaginationParams;
}

export interface FilterOption {
  key: string;
  value: any;
  label?: string;
  count?: number;
}

// Configuration types
export interface ConfigValue {
  key: string;
  value: string | number | boolean | object;
  type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  description?: string;
  isSecret?: boolean;
}

// Rate limiting types
export interface RateLimit {
  requests: number;
  windowMs: number;
  identifier?: string; // IP, user ID, API key, etc.
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetTime: Timestamp;
  blocked: boolean;
}
