// ===========================================================================
// VALIDATORS - MAIN EXPORTS
//
// This file re-exports all Zod schemas and Zod-inferred types from the
// individual validator modules. This allows consumers to import most
// validation-related needs from a single point.
//
// For Zod schemas: import { someSchema } from '@triggerr/api-contracts/validators';
// For Zod-inferred types: import type { SomeType } from '@triggerr/api-contracts/validators';
// ===========================================================================

// --- Chat Validators ---
export * from "./chat";

// --- Common Validators ---
export * from "./common";

// --- Insurance Validators ---
export * from "./insurance";

// --- Policy Validators (Parametric Model) ---
export * from "./common";

// --- User Validators (Admin & Distinct Settings) ---
export * from "./user";

// --- Wallet Validators ---
export * from "./wallet";

// --- Internal System Validators ---
export * from "./internal";

// ===========================================================================
// CONVENIENCE RE-EXPORTS (Specific common items, if needed for clarity, though `export *` covers them)
//
// While `export *` makes all individual exports available, you might choose to
// explicitly re-export extremely common schemas or types here for discoverability,
// though it can also lead to redundancy. For now, relying on `export *` from
// the submodules is preferred for conciseness.
//
// Example (if desired, but not strictly necessary with `export *`):
//
// export {
//   // From common.ts
//   apiResponseSchema,
//   apiErrorSchema,
//   paginationRequestSchema,
//   paginationResponseSchema,
//   // From chat.ts
//   chatMessageRequestSchema,
//   chatMessageResponseSchema,
//   // From insurance.ts
//   insuranceQuoteRequestSchema,
//   insuranceQuoteResponseSchema,
//   // From policy.ts
//   policySchema,
//   automatedPayoutRecordSchema,
//   // From user.ts
//   adminListUsersRequestSchema,
//   // From wallet.ts
//   userProfileSchema,
//   userWalletSchema,
// } from './'; // This would refer to the exports made available by `export *` above.

// ===========================================================================
// VALIDATOR UTILITY FUNCTIONS (If any are globally applicable)
// These are already in common.ts and exported from there via `export * from './common';`
// ===========================================================================

// export {
//   safeValidate,
//   formatValidationErrors,
//   hasValidationErrors,
//   createSuccessResponse, // Note: This is for Zod-based responses, might differ from DTO utilities
//   createErrorResponse,   // Note: This is for Zod-based responses
// } from './common'; // Already exported via `export * from './common';`

// ===========================================================================
// Notes:
// 1. Zod-Inferred Types: Remember that individual validator files (e.g., `chat.ts`)
//    should export both the Zod schema constant (e.g., `chatMessageRequestSchema`)
//    AND its Zod-inferred TypeScript type (e.g., `export type ChatMessageRequest = z.infer<typeof chatMessageRequestSchema>;`).
//    The `export *` from this file will make both available to consumers.
//
// 2. Namespace: If a DTO interface (from `dtos/`) and a Zod-inferred type (from `validators/`)
//    share the exact same name, consumers importing directly from `@triggerr/api-contracts`
//    (the main package index) might encounter ambiguity. It's often clearer to import
//    DTOs from `...@triggerr/api-contracts/dtos/*` and Zod types/schemas from
//    `...@triggerr/api-contracts/validators/*` or this file.
// ===========================================================================
