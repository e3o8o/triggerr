// ============================================================================
// INTERNAL DOMAIN BARREL - Internal API Schemas & Types
// ============================================================================

/**
 * This barrel file exports all internal API-related schemas and types.
 * Internal APIs are used for service-to-service communication within the triggerr platform.
 */

// === STEP 1: IMPORT VALIDATORS FOR LOCAL USE AND RE-EXPORT ===
import {
  internalFlightContextRequestSchema,
  internalFlightContextResponseSchema,
  internalFlightStatusCheckRequestSchema,
  internalFlightStatusCheckResponseSchema,
  internalProcessPayoutsRequestSchema,
  internalProcessPayoutsResponseSchema,
} from "../validators/internal";

// Import Zod-inferred types for re-export
import type {
  InternalFlightContextRequest,
  InternalFlightContextResponse,
  InternalFlightStatusCheckRequest,
  InternalFlightStatusCheckResponse,
  InternalProcessPayoutsRequest,
  InternalProcessPayoutsResponse,
} from "../validators/internal";

// === STEP 2: RE-EXPORT ALL IMPORTED ITEMS FOR EXTERNAL USE ===

// Validator re-exports
export {
  internalFlightContextRequestSchema,
  internalFlightContextResponseSchema,
  internalFlightStatusCheckRequestSchema,
  internalFlightStatusCheckResponseSchema,
  internalProcessPayoutsRequestSchema,
  internalProcessPayoutsResponseSchema,
};

// Type re-exports
export type {
  InternalFlightContextRequest,
  InternalFlightContextResponse,
  InternalFlightStatusCheckRequest,
  InternalFlightStatusCheckResponse,
  InternalProcessPayoutsRequest,
  InternalProcessPayoutsResponse,
};

// === NAMESPACE EXPORTS ===

/**
 * Internal validators namespace
 */
export const validators = {
  flightContextRequest: internalFlightContextRequestSchema,
  flightContextResponse: internalFlightContextResponseSchema,
  flightStatusCheckRequest: internalFlightStatusCheckRequestSchema,
  flightStatusCheckResponse: internalFlightStatusCheckResponseSchema,
  processPayoutsRequest: internalProcessPayoutsRequestSchema,
  processPayoutsResponse: internalProcessPayoutsResponseSchema,
} as const;

// === COMBINED NAMESPACE EXPORT ===
export const InternalDomain = {
  validators,
} as const;

// === TYPE DEFINITIONS ===
export type InternalDomainNamespace = typeof InternalDomain;
export type InternalValidators = typeof validators;
