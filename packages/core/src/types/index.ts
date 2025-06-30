// Types package exports
// This file serves as the main export point for shared types across the core package

// Re-export auth types
export type { User, Session } from '../auth/auth';

// Placeholder for future type definitions
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Common enum-like types
export type UserRole = 'user' | 'admin' | 'service';
export type Environment = 'development' | 'staging' | 'production';

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;
