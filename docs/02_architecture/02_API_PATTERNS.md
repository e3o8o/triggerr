# 02_API_PATTERNS: The "Cookbook" - Proven Development Tactics

This document outlines the core patterns and best practices, affectionately known as "The Cookbook," that guide our API development. Adhering to these principles is crucial for maintaining a clean, stable, and scalable codebase while ensuring compliance with our multi-jurisdictional regulatory framework.

> **Legal Framework**: Comprehensive regulatory compliance strategy and API-specific legal considerations documented in [Legal Reference](../04_compliance/LEGAL_REFERENCE.md)

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

### Pattern F: Compliance-Aware Error Handling
**The Trick**: Structure error responses to include compliance metadata and jurisdiction-specific information where applicable.
**Why**: Our Nevada-based entity structure and multi-jurisdictional operations require error handling that supports regulatory requirements and audit trails.
```typescript
// ✅ COMPLIANCE-AWARE & CHAIN-AWARE - Includes entity and blockchain context in errors
return NextResponse.json(
  createApiError('VALIDATION_ERROR', 'Invalid request format', {
    details: validationResult.error.issues,
    entity: 'triggerr-direct-llc',
    jurisdiction: 'nevada',
    complianceCode: 'INS-001',
    chainContext: { // Provide context even in validation errors
        attemptedChain: 'base',
        reason: 'Cost optimization strategy selected.'
    }
  }),
  { status: 400 }
);

// ✅ JURISDICTION-SPECIFIC - Handles EU vs US requirements
const errorResponse = isEUUser(authContext)
  ? createApiError('GDPR_VALIDATION_ERROR', 'Data processing consent required', {
      gdprArticle: '6.1.a',
      consentRequired: true
    })
  : createApiError('VALIDATION_ERROR', 'Invalid request format');
```

### Pattern G: Trust the Local Docs
**The Trick**: When an external library has persistent type definition or import issues, prioritize the project's own internal documentation and test files (e.g., `paygo_test_suite_learnings.md`) for workarounds or correct usage patterns.
**Why**: These internal documents often contain solutions specifically tailored to the project's environment and can bypass issues that external documentation might not address.

### Pattern H: Entity & Chain-Aware API Design
**The Trick**: Structure API responses to reflect our entity separation, regulatory advantages, and the underlying dual-chain execution.
**Why**: Our Nevada-based structure and dual-chain architecture are key differentiators. Exposing this metadata provides transparency and supports advanced client-side applications and audibility.
```typescript
// ✅ ENTITY & CHAIN-AWARE - Includes blockchain execution details
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: any;
  metadata: {
    // Entity & Regulatory Context
    entity: 'parametrigger-inc' | 'triggerr-direct-llc' | 'parametrigger-financial-solutions';
    jurisdiction: 'nevada' | 'estonia' | 'multi-state';
    complianceFramework: 'insurance-sandbox' | 'surplus-lines' | 'gdpr';

    // Blockchain Execution Context
    transaction?: {
      chain: 'ethereum' | 'base';
      txHash: string;
      blockNumber: number;
      gasCostUSD: number;
      routerStrategy: 'cost-optimization' | 'high-security' | 'fallback';
    };

    // Standard Metadata
    timestamp: string;
    version: string;
    requestId: string;
  };
}
```

### Pattern I: Chain Router Integration
**The Trick**: Always use the chain router for blockchain operations instead of directly calling individual chain adapters.
**Why**: The chain router provides automatic optimization, fallback mechanisms, and user abstraction, ensuring the best possible user experience across our dual-chain architecture.
```typescript
// ❌ BROKEN - Direct adapter usage bypasses optimization and fallback logic
import { EthereumClientService } from '@triggerr/ethereum-adapter';
const result = await ethereumAdapter.createEscrow(params);

// ✅ FIXED - Chain router provides optimal execution with fallback
import { ChainRouter } from '@triggerr/chain-router';
const chainRouter = getChainRouter(); // From dependency injection
const result = await chainRouter.executeWithOptimalChain(
  async (adapter) => adapter.createEscrow(params),
  {
    preferredChain: userPreference,
    maxGasCostUSD: 50,
    requireConfirmation: true
  }
);
```

### Pattern J: Cross-Chain State Management
**The Trick**: Always include cross-chain state metadata in API responses and handle state synchronization explicitly.
**Why**: Users and client applications need visibility into which chain their transactions occurred on, and the system needs to maintain state consistency across both chains.
```typescript
// ✅ CROSS-CHAIN STATE MANAGEMENT - Includes chain context and synchronization
interface PolicyCreationResponse {
  policy: {
    id: string;
    status: 'PENDING' | 'ACTIVE';
    // ... other policy fields
  };
  chainExecution: {
    primaryChain: 'ethereum' | 'base';
    contractAddress: string;
    transactionHash: string;
    blockNumber: number;
    gasUsed: number;
    gasCostUSD: number;
  };
  crossChainSync: {
    syncRequired: boolean;
    syncStatus: 'PENDING' | 'COMPLETE' | 'FAILED';
    backupChainAddress?: string;
    estimatedSyncTime?: number;
  };
}

// API implementation with cross-chain awareness
const policyResult = await chainRouter.createPolicy(policyParams);
return NextResponse.json(createApiResponse({
  policy: policyResult.policy,
  chainExecution: policyResult.executionDetails,
  crossChainSync: {
    syncRequired: policyResult.requiresBackup,
    syncStatus: 'PENDING',
    backupChainAddress: policyResult.backupAddress
  }
}));
```

### Pattern K: Chain-Aware Response Metadata
**The Trick**: Include comprehensive blockchain metadata in all API responses that involve chain interactions.
**Why**: This provides transparency for users, enables client-side optimization, and supports debugging and audit requirements.
```typescript
// ✅ CHAIN-AWARE METADATA - Comprehensive blockchain context
interface ChainAwareApiResponse<T> extends ApiResponse<T> {
  metadata: {
    // Entity & Regulatory Context
    entity: 'parametrigger-inc' | 'triggerr-direct-llc' | 'parametrigger-financial-solutions';
    jurisdiction: 'nevada' | 'estonia' | 'multi-state';
    complianceFramework: 'insurance-sandbox' | 'surplus-lines' | 'gdpr';

    // Blockchain Execution Details
    blockchain: {
      executionChain: 'ethereum' | 'base';
      fallbackChain: 'ethereum' | 'base';
      routingStrategy: 'cost-optimization' | 'security-first' | 'user-preference' | 'load-balancing';
      contractAddresses: {
        ethereum?: string;
        base?: string;
      };
      transactionDetails: {
        hash: string;
        blockNumber: number;
        confirmations: number;
        gasUsed: number;
        effectiveGasPrice: string;
        totalCostUSD: number;
      };
      networkConditions: {
        ethereumGasPrice: number;
        baseGasPrice: number;
        networkCongestion: 'low' | 'medium' | 'high';
        estimatedConfirmationTime: number;
      };
    };

    // Performance & Optimization
    performance: {
      routingDecisionTime: number;
      executionTime: number;
      totalResponseTime: number;
      cacheHit: boolean;
      optimizationApplied: string[];
    };

    // Standard Metadata
    timestamp: string;
    version: string;
    requestId: string;
  };
}
```

### Pattern L: Dual-Chain Transaction Handling
**The Trick**: Implement comprehensive transaction lifecycle management with proper error handling and state recovery.
**Why**: Dual-chain operations introduce complexity that requires robust transaction management, including partial failures, rollbacks, and state reconciliation.
```typescript
// ✅ DUAL-CHAIN TRANSACTION MANAGEMENT - Complete lifecycle handling
async function handleDualChainOperation(
  operation: ChainOperation,
  authContext: AuthContext
): Promise<NextResponse> {
  const transactionId = generateTransactionId();
  
  try {
    // 1. Pre-execution validation
    const validation = await validateChainOperation(operation, authContext);
    if (!validation.success) {
      return NextResponse.json(
        createApiError('VALIDATION_ERROR', validation.error, {
          transactionId,
          validationDetails: validation.details
        }),
        { status: 400 }
      );
    }

    // 2. Execute with automatic chain selection and fallback
    const result = await chainRouter.executeWithFallback(
      async (adapter) => adapter.execute(operation),
      {
        maxRetries: 3,
        fallbackEnabled: true,
        transactionId
      }
    );

    // 3. Verify execution and handle partial failures
    if (result.status === 'PARTIAL_FAILURE') {
      await handlePartialFailure(result, transactionId);
    }

    // 4. Return comprehensive response
    return NextResponse.json(createApiResponse({
      result: result.data,
      execution: {
        transactionId,
        chainUsed: result.chainUsed,
        fallbackOccurred: result.fallbackOccurred,
        retryCount: result.retryCount
      }
    }));

  } catch (error) {
    // 5. Comprehensive error handling with rollback
    await handleTransactionFailure(transactionId, error);
    return NextResponse.json(
      createApiError('EXECUTION_ERROR', 'Transaction failed', {
        transactionId,
        errorDetails: error.message,
        rollbackStatus: 'INITIATED'
      }),
      { status: 500 }
    );
  }
}
```

### Pattern M: Chain Fallback and Error Recovery
**The Trick**: Implement intelligent fallback mechanisms that maintain user experience even during chain-specific failures.
**Why**: Network congestion, RPC failures, or chain-specific issues shouldn't break the user experience. The system should gracefully degrade and recover.
```typescript
// ✅ INTELLIGENT FALLBACK - Maintains service continuity
class ChainFallbackHandler {
  async executeWithIntelligentFallback<T>(
    operation: ChainOperation<T>,
    options: FallbackOptions = {}
  ): Promise<ChainExecutionResult<T>> {
    const attempts: ChainAttempt[] = [];
    
    // Try primary chain first
    try {
      const primaryResult = await this.executeOnChain(
        operation,
        options.preferredChain || 'base'
      );
      
      return {
        success: true,
        data: primaryResult,
        chainUsed: options.preferredChain || 'base',
        attempts: [{ chain: options.preferredChain || 'base', success: true }],
        fallbackOccurred: false
      };
    } catch (primaryError) {
      attempts.push({ 
        chain: options.preferredChain || 'base', 
        success: false, 
        error: primaryError.message 
      });

      // Intelligent fallback decision
      const fallbackChain = this.selectFallbackChain(primaryError, options);
      
      if (!fallbackChain) {
        throw new ChainExecutionError('No available fallback chain', attempts);
      }

      try {
        const fallbackResult = await this.executeOnChain(operation, fallbackChain);
        
        // Log fallback for monitoring
        await this.logFallbackEvent({
          originalChain: options.preferredChain || 'base',
          fallbackChain,
          reason: primaryError.message,
          operation: operation.type
        });

        return {
          success: true,
          data: fallbackResult,
          chainUsed: fallbackChain,
          attempts,
          fallbackOccurred: true,
          fallbackReason: primaryError.message
        };
      } catch (fallbackError) {
        attempts.push({ 
          chain: fallbackChain, 
          success: false, 
          error: fallbackError.message 
        });
        
        throw new ChainExecutionError('All chains failed', attempts);
      }
    }
  }

  private selectFallbackChain(
    error: Error, 
    options: FallbackOptions
  ): 'ethereum' | 'base' | null {
    // Intelligent fallback selection based on error type
    if (error.message.includes('gas price too low')) {
      return 'base'; // Use Base for lower gas costs
    }
    if (error.message.includes('network congestion')) {
      return options.preferredChain === 'ethereum' ? 'base' : 'ethereum';
    }
    if (error.message.includes('RPC')) {
      return 'ethereum'; // Fallback to more stable Ethereum RPC
    }
    
    return options.preferredChain === 'ethereum' ? 'base' : 'ethereum';
  }
}
```
