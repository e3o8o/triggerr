# triggerr Dual-Chain Package Analysis

## Overview

This document provides a detailed analysis of the key packages used in the triggerr dual-chain platform development. Understanding these packages is essential for implementing APIs correctly, managing dual-chain blockchain operations, and avoiding TypeScript errors and build failures while maintaining compliance with our multi-jurisdictional regulatory framework.

> **Legal Framework**: Comprehensive regulatory compliance strategy and package-specific legal considerations documented in [Legal Reference](../04_compliance/LEGAL_REFERENCE.md)

## Key Packages

### Compliance Package Reference
- `@triggerr/compliance-reference`: Future package for regulatory compliance utilities and validation
- Entity-aware API patterns support our Nevada-based regulatory arbitrage strategy
- Cross-jurisdictional data handling utilities for US and EU operations
- Dual-chain compliance monitoring and smart contract governance utilities

### 1. @triggerr/ethereum-adapter

This package provides Ethereum blockchain integration for our dual-chain smart contract operations.

#### Structure
- `/src/ethereum-client.ts` - Ethereum network client implementation
- `/src/contract-interfaces/` - TypeScript interfaces for our smart contracts
- `/src/gas-estimation/` - Ethereum gas optimization utilities
- `/src/transaction-monitoring/` - Transaction status tracking and confirmation

#### Key Exports
- `EthereumClientService` - Main Ethereum blockchain service implementation
- `EthereumContractFactory` - Factory for interacting with deployed contracts
- Ethereum-specific transaction utilities and gas optimization functions
- Contract ABI interfaces with full TypeScript support

#### Usage Pattern
```typescript
import { EthereumClientService } from '@triggerr/ethereum-adapter';

const ethereumClient = new EthereumClientService({
  rpcUrl: process.env.ETHEREUM_RPC_URL,
  factoryAddress: process.env.ETHEREUM_FACTORY_ADDRESS
});

const escrowResult = await ethereumClient.createEscrow({
  amount: parseEther('1000'),
  recipient: userAddress,
  expiration: Date.now() + 86400000
});
```

### 2. @triggerr/base-adapter

This package provides Base (Layer 2) blockchain integration for cost-efficient operations.

#### Structure
- `/src/base-client.ts` - Base network client implementation
- `/src/contract-interfaces/` - Identical contract interfaces as Ethereum
- `/src/gas-optimization/` - Base-specific gas strategies
- `/src/cross-chain-sync/` - State synchronization utilities

#### Key Exports
- `BaseClientService` - Main Base blockchain service implementation
- `BaseContractFactory` - Factory for Base smart contract interactions
- Base-optimized transaction utilities and cost management functions
- Cross-chain state synchronization helpers

#### Usage Pattern
```typescript
import { BaseClientService } from '@triggerr/base-adapter';

const baseClient = new BaseClientService({
  rpcUrl: process.env.BASE_RPC_URL,
  factoryAddress: process.env.BASE_FACTORY_ADDRESS
});

// Identical interface to Ethereum adapter
const escrowResult = await baseClient.createEscrow(escrowParams);
```

### 3. @triggerr/chain-router

This package provides intelligent chain selection and user abstraction for seamless dual-chain operations.

#### Structure
- `/src/chain-router.ts` - Main routing logic and chain selection
- `/src/cost-optimizer.ts` - Real-time cost analysis across chains
- `/src/fallback-manager.ts` - Automatic failover and retry logic
- `/src/user-abstraction/` - Complete blockchain abstraction for users

#### Key Exports
- `ChainRouter` - Intelligent routing service for optimal chain selection
- `CostOptimizer` - Real-time gas and transaction cost comparison
- `FallbackManager` - Automatic chain failover and error recovery
- User abstraction utilities for seamless blockchain interactions

#### Usage Pattern
```typescript
import { ChainRouter } from '@triggerr/chain-router';
import { EthereumClientService } from '@triggerr/ethereum-adapter';
import { BaseClientService } from '@triggerr/base-adapter';

const chainRouter = new ChainRouter(
  new EthereumClientService(ethereumConfig),
  new BaseClientService(baseConfig)
);

// Automatic optimal chain selection
const result = await chainRouter.executeWithOptimalChain(
  (adapter) => adapter.createEscrow(params)
);
```

### 4. @triggerr/smart-contracts

This package contains TypeScript interfaces, ABIs, and deployment utilities for our smart contracts.

#### Structure
- `/src/abis/` - Contract ABIs for TriggerrEscrowFactory, PolicyRegistry, PolicyFund
- `/src/interfaces/` - TypeScript interfaces generated from contracts
- `/src/deployment/` - Deployment scripts and configuration
- `/src/testing/` - Contract testing utilities and fixtures

#### Key Exports
- Contract ABIs and TypeScript interfaces for all smart contracts
- `DeploymentManager` - Dual-chain deployment coordination
- `ContractRegistry` - Address management across networks
- Testing utilities for smart contract integration tests

#### Usage Pattern
```typescript
import { 
  TriggerrEscrowFactoryABI,
  type ITriggerrEscrowFactory 
} from '@triggerr/smart-contracts';

const factory = new ethers.Contract(
  factoryAddress,
  TriggerrEscrowFactoryABI,
  signer
) as ITriggerrEscrowFactory;
```

### 5. @triggerr/api-contracts

This package defines the contracts (interfaces, types, and validation schemas) for all API interactions.

#### Structure
- `/src/validators/` - Contains Zod schemas for request/response validation
- `/src/dtos/` - Data Transfer Objects that define the shape of API data
- `/src/errors/` - Error handling utilities and types
- `/src/utils/` - Helper functions for API responses

#### Key Exports
- `createApiResponse` - Creates a standardized API response object
- `createApiError` - Creates a standardized API error response
- Validation schemas (e.g., `insuranceQuoteRequestSchema`, `chatMessageRequestSchema`)
- Type definitions (e.g., `InsuranceQuoteResponse`, `ChatMessageRequest`)

#### Usage Pattern
```typescript
import { createApiError, createApiResponse } from '@triggerr/api-contracts';
import { chatMessageRequestSchema } from '@triggerr/api-contracts/validators/chat';
import type { ChatMessageRequest } from '@triggerr/api-contracts/dtos/chat';

// Validate incoming request
const validationResult = chatMessageRequestSchema.safeParse(requestBody);
if (!validationResult.success) {
  return NextResponse.json(
    createApiError('VALIDATION_ERROR', 'Invalid request format', {
      details: validationResult.error.issues
    }),
    { status: 400 }
  );
}

// Use the validated data
const data: ChatMessageRequest = validationResult.data;

// Return a standardized response
return NextResponse.json(createApiResponse('SUCCESS', 'Operation successful', responseData));
```

### 2. @triggerr/api-sdk

This package provides client-side SDK for interacting with the triggerr APIs.

#### Structure
- `/src/clients/` - API client implementations
- `/src/types/` - TypeScript types for the SDK
- `/src/utils/` - Helper utilities for the SDK

#### Key Exports
- API client classes for different API groups
- Authentication utilities
- Request/response handling utilities

#### Usage Pattern
```typescript
import { InsuranceApiClient } from '@triggerr/api-sdk';

const client = new InsuranceApiClient();
const quoteResponse = await client.getQuote(quoteRequestData);
```

### 3. @triggerr/core/database

This package provides database access and schema definitions.

#### Structure
- `/edge/` - Edge-compatible database client
- `/schema/` - Database schema definitions using Drizzle ORM
- `/migrations/` - Database migration scripts

#### Key Exports
- `edgeDb` - Edge-compatible database client
- Schema definitions (e.g., `conversations`, `conversationMessages`, `quote`)
- Migration utilities

#### Usage Pattern
```typescript
import { edgeDb } from '@triggerr/core/database/edge';
import { conversations, conversationMessages } from '@triggerr/core/database/schema';
import { eq } from 'drizzle-orm';

// Query the database
const results = await edgeDb
  .select()
  .from(conversations)
  .where(eq(conversations.id, conversationId))
  .limit(1);

// Insert into the database
await edgeDb.insert(conversationMessages).values({
  conversationId,
  role: 'user',
  content: message,
  metadata: {}
});
```

### 4. @triggerr/core/auth

This package provides authentication and authorization utilities.

#### Structure
- `/src/session/` - Session management
- `/src/auth/` - Authentication utilities
- `/src/rls/` - Row-level security utilities

#### Key Exports
- `getAuthContext` - Gets the current authentication context
- `setRLSContext` - Sets the row-level security context for database queries
- `getAnonymousSessionId` - Gets or creates an anonymous session ID

#### Usage Pattern
```typescript
import { getAuthContext, setRLSContext, getAnonymousSessionId } from '@triggerr/core/auth';

// Get authentication context
const authContext = await getAuthContext();
const isAuthenticated = authContext.isAuthenticated;
const userId = authContext.user?.id;

// Set RLS context for database queries
await setRLSContext(authContext);

// Handle anonymous sessions
const anonymousSessionId = await getAnonymousSessionId();
```

## Common Patterns and Best Practices

### 1. Dual-Chain Entity-Aware Development
Always consider entity boundaries, regulatory context, and blockchain network selection when developing APIs:

```typescript
// Dual-chain entity-aware API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  metadata: {
    entity: 'parametrigger-inc' | 'triggerr-direct-llc' | 'parametrigger-financial-solutions';
    jurisdiction: 'nevada' | 'estonia' | 'multi-state';
    complianceFramework: 'insurance-sandbox' | 'surplus-lines' | 'gdpr';
    blockchainNetwork?: 'ethereum' | 'base' | 'dual-chain';
    chainSelection?: {
      selectedChain: 'ethereum' | 'base';
      reason: 'cost-optimization' | 'security' | 'user-preference' | 'network-congestion';
    };
  };
}
```

### 2. Dual-Chain Request Validation

Always validate incoming requests using Zod schemas from `@triggerr/api-contracts/validators`, including blockchain-specific parameters:

```typescript
const validationResult = someSchema.safeParse(requestBody);
if (!validationResult.success) {
  return NextResponse.json(
    createApiError('VALIDATION_ERROR', 'Invalid request format', {
      details: validationResult.error.issues,
      chainContext: await getOptimalChainForOperation(requestBody)
    }),
    { status: 400 }
  );
}
```

### 3. Response Formatting

Always use the `createApiResponse` and `createApiError` utilities for consistent response formatting:

```typescript
// Success response
return NextResponse.json(createApiResponse('SUCCESS', 'Operation successful', data));

// Error response
return NextResponse.json(
  createApiError('NOT_FOUND', 'Resource not found'),
  { status: 404 }
);
```

### 4. Database Access

Use the appropriate database client based on the execution environment:

```typescript
// For API routes (edge runtime)
import { edgeDb } from '@triggerr/core/database/edge';

// For server components or server actions
import { db } from '@triggerr/core/database/server';
```

### 5. Dual-Chain Authentication & Chain Selection

Always check authentication status, set the RLS context, and select optimal blockchain before performing operations:

```typescript
const authContext = await getAuthContext();
const chainRouter = getChainRouter();

if (authContext.isAuthenticated) {
  await setRLSContext(authContext);
  
  // Select optimal chain for operation
  const optimalChain = await chainRouter.selectOptimalChain(
    operationType,
    transactionAmount
  );
  
  // Perform authenticated dual-chain operations
  const result = await chainRouter.executeWithFallback(
    async (adapter) => adapter.performOperation(params),
    optimalChain
  );
} else {
  // Handle unauthenticated case with chain abstraction
}
```

## API Template

When implementing a new API route, follow this template for consistency:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext, setRLSContext } from '@triggerr/core/auth';
import { edgeDb } from '@triggerr/core/database/edge';
import { relevantTables } from '@triggerr/core/database/schema';
import { createApiError, createApiResponse } from '@triggerr/api-contracts';
import { relevantSchema } from '@triggerr/api-contracts/validators/path';
import type { RelevantType } from '@triggerr/api-contracts/dtos/path';

// Define request schema if not already defined in api-contracts
const requestSchema = z.object({
  // Schema definition
});

export async function HTTP_METHOD(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        createApiError('VALIDATION_ERROR', 'Invalid request format', {
          details: validationResult.error.issues
        }),
        { status: 400 }
      );
    }
    const data = validationResult.data;

    // Authentication
    const authContext = await getAuthContext();
    await setRLSContext(authContext);

    // Business logic
    // ...

    // Database operations
    // ...

    // Return response
    return NextResponse.json(createApiResponse('SUCCESS', 'Operation successful', responseData));
  } catch (error) {
    console.error(`[API path] Error:`, error);
    return NextResponse.json(
      createApiError('SERVER_ERROR', 'An error occurred while processing your request'),
      { status: 500 }
    );
  }
}
```

## Troubleshooting Common Issues

### 1. TypeScript Errors

- **Cannot find name 'edgeDb'**: Ensure you've imported `edgeDb` from `@triggerr/core/database/edge`
- **Cannot find name 'conversationMessages'**: Ensure you've imported the table from `@triggerr/core/database/schema`
- **Type 'X' is not assignable to type 'Y'**: Check that your data structures match the expected types in the API contracts

### 2. Build Failures

- **Module not found**: Ensure the package is correctly listed in dependencies and the import path is correct
- **Zod validation errors**: Ensure all required fields are provided in your objects
- **Missing exports**: Check that you're importing from the correct path and the export exists

### 3. Runtime Errors

- **Database connection errors**: Ensure the database connection is properly configured
- **Authentication errors**: Check that the authentication context is properly set up
- **Validation errors**: Ensure all required fields are provided and match the expected types

## Next Steps

1. Review the existing API contracts to understand the data structures
2. Study the database schema to understand the relationships between tables  
3. Set up dual-chain development environment with Ethereum and Base testnets
4. Implement chain abstraction layer for seamless user experience
5. Implement APIs one by one, following the template and dual-chain best practices
6. Add comprehensive tests for each API including cross-chain scenarios
7. Ensure all API implementations align with our entity structure and dual-chain regulatory framework
8. Test smart contract integrations on both Ethereum and Base networks

> **Legal Framework**: Detailed entity responsibilities, API compliance requirements, and regulatory considerations documented in [Legal Reference](../04_compliance/LEGAL_REFERENCE.md)
