# 02_API_PATTERNS: The "Cookbook" - Proven Development Tactics

This document outlines the core patterns and best practices, affectionately known as "The Cookbook," that guide our API development. Adhering to these principles is crucial for maintaining a clean, stable, and scalable codebase.

## I. THE "COOKBOOK": Your Weapons and Tactics

This section contains our battle-tested knowledge base for writing high-quality, maintainable API code.

### Pattern A: The Import Path Doctrine (The #1 Rule)
**The Trick**: Never import from the main barrel file (e.g., `@triggerr/api-contracts`). Always use specific, deep import paths. This is non-negotiable.
**Why**: This prevents **namespace collisions** (e.g., DTO `interface Policy` vs. Zod `type Policy`), enables build optimization via **tree-shaking**, and improves code clarity.
```typescript
// ❌ BROKEN - Ambiguous, breaks tree-shaking, causes "has no exported member" errors.
import { PolicyPurchaseRequest, ApiResponse } from '@triggerr/api-contracts';

// ✅ FIXED - Unambiguous, efficient, and self-documenting.
import type { ApiResponse } from '@triggerr/api-contracts'; // The one exception for the base type.
import { createApiError, createApiResponse } from '@triggerr/api-contracts'; // Our essential API helpers.
import type { PolicyPurchaseRequest } from '@triggerr/api-contracts/dtos/insurance'; // For data shapes.
import { policyPurchaseRequestSchema } from '@triggerr/api-contracts/validators/insurance'; // For validation.
```

### Pattern B: The API Response Standardization
**The Trick**: Never construct a raw JSON response. Always use our `createApiError` and `createApiResponse` helpers.
**Why**: This enforces a consistent API response shape (`success`, `timestamp`, `version`, `data`/`error`), which is vital for robust frontend clients and predictable behavior.
```typescript
// ❌ BROKEN - Brittle, inconsistent shape, easy to make mistakes.
return NextResponse.json({ success: false, error: '...' }, { status: 404 });

// ✅ FIXED - Robust, consistent, and type-safe.
return NextResponse.json(createApiError('NOT_FOUND', '...'), { status: 404 });
return NextResponse.json(createApiResponse(data));
```

### Pattern C: The Schema Supremacy Principle
**The Trick**: Trust the Drizzle schema in `packages/core/database/schema.ts` as the absolute source of truth. The old code is wrong; the schema is right.
**Why**: The root cause of many build failures is code written against an outdated schema.
*   **Table Names**: Always **singular** (`policy`, `escrow`, `conversation`).
*   **Column Names**: `updatedAt` not `lastMessageAt`; `productCategory` not `category`; `metadata` for `jsonb` fields.
*   **Auth Context**: The `withAuth` helper provides the full `authContext` object. Always pass this entire object to `setRLSContext(authContext)`.

### Pattern D: The "Simplify and Conquer" DTO Tactic
**The Trick**: When building a complex response DTO and facing a wall of type errors, **strategically simplify the response first to get the file to compile.** Then, add the complexity back field by field.
**Why**: This powerful technique isolates the specific property causing the type error, preventing you from getting stuck in a complex nested object. It turns an impossible problem into a series of simple ones.
```typescript
// Step 1: Hit a wall with a complex DTO with dozens of errors.
// const response: ComplexDTO = { ... dozens of fields causing errors ... };

// Step 2: Strategic Simplification to unblock the build.
const simplifiedResponse = { id: data.id, status: data.status };
// Use `as any` as a *temporary, tactical tool* to bypass the type checker for this one line.
return NextResponse.json(createApiResponse(simplifiedResponse as any));

// Step 3: Once the file compiles, re-add fields one by one to the simplifiedResponse
// until the error reappears. You have now found the exact source of the problem.
// Common culprits: a Date object that needs `.toISOString()`, a nullability mismatch, or a wrong property name.
```

### Pattern E: Mock Eradication Over Mock Repair
**The Trick**: When a mock implementation is causing type errors or logical inconsistencies, **remove it entirely** and replace its call site with a `501 Not Implemented` error response.
**Why**: This clears the build, makes the codebase honest about incomplete features, and provides a clean slate for future, proper implementation without the burden of broken mocks.

### Pattern F: Trust the Local Docs
**The Trick**: When an external library has persistent type definition or import issues, prioritize the project's own internal documentation and test files (e.g., `paygo_test_suite_learnings.md`) for workarounds or correct usage patterns.
**Why**: These internal documents often contain solutions specifically tailored to the project's environment and can bypass issues that external documentation might not address.