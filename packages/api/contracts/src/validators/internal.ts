// ============================================================================
// INTERNAL API VALIDATION SCHEMAS
//
// This file contains Zod schemas for validating requests to internal system APIs.
// These endpoints are not user-facing and are used for service-to-service communication.
// ============================================================================

import { z } from 'zod';

// ============================================================================
// 1. Flight Context Lookup (/api/v1/internal/flight-context-lookup)
// ============================================================================

export const internalFlightContextRequestSchema = z.object({
  flightId: z.string().min(1, 'Flight ID is required'),
  dataSources: z.array(z.string()).optional(), // Optional: specify which data sources to query
  forceRefresh: z.boolean().optional().default(false), // Optional: force a refresh from external APIs
});

export type InternalFlightContextRequest = z.infer<typeof internalFlightContextRequestSchema>;

export const internalFlightContextResponseSchema = z.object({
  success: z.boolean(),
  flightId: z.string(),
  // Placeholder for the actual aggregated flight data structure
  flightData: z.record(z.any()).optional(),
  error: z.string().optional(),
});

export type InternalFlightContextResponse = z.infer<typeof internalFlightContextResponseSchema>;


// ============================================================================
// 2. Flight Status Check (/api/v1/internal/monitoring/flight-status-check)
// ============================================================================

export const internalFlightStatusCheckRequestSchema = z.object({
  flightId: z.string().min(1, 'Flight ID is required'),
  policyIds: z.array(z.string()).optional(), // Optional: specific policies to check against this flight
});

export type InternalFlightStatusCheckRequest = z.infer<typeof internalFlightStatusCheckRequestSchema>;

export const internalFlightStatusCheckResponseSchema = z.object({
  success: z.boolean(),
  flightId: z.string(),
  status: z.string().optional(), // e.g., 'ON_TIME', 'DELAYED', 'CANCELLED'
  checkedAt: z.string().datetime(),
  triggeredPolicyUpdates: z.number().optional(),
  error: z.string().optional(),
});

export type InternalFlightStatusCheckResponse = z.infer<typeof internalFlightStatusCheckResponseSchema>;


// ============================================================================
// 3. Process Triggered Payouts (/api/v1/internal/payouts/process-triggered)
// ============================================================================

export const internalProcessPayoutsRequestSchema = z.object({
  policyIds: z.array(z.string()).min(1, 'At least one policy ID is required'),
  payoutReason: z.string().optional().default('Parametric event triggered'),
});

export type InternalProcessPayoutsRequest = z.infer<typeof internalProcessPayoutsRequestSchema>;

export const internalProcessPayoutsResponseSchema = z.object({
  success: z.boolean(),
  processedCount: z.number(),
  failedCount: z.number(),
  results: z.array(z.object({
    policyId: z.string(),
    payoutSuccess: z.boolean(),
    transactionId: z.string().optional(),
    error: z.string().optional(),
  })),
});

export type InternalProcessPayoutsResponse = z.infer<typeof internalProcessPayoutsResponseSchema>;
