# Triggerr Development Style Guide

**Document Version**: 1.0  
**Date**: January 2025  
**Status**: Comprehensive Development Standards  
**Objective**: Definitive style guide for Triggerr platform development, covering TypeScript enterprise standards, dual-chain Solidity conventions, and package architecture patterns based on our proven template system.

---

## Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [TypeScript Standards](#typescript-standards)
3. [Solidity Conventions (Dual-Chain)](#solidity-conventions-dual-chain)
4. [Package Architecture](#package-architecture)
5. [Import/Export Patterns](#importexport-patterns)
6. [Cross-Chain Code Standards](#cross-chain-code-standards)
7. [Testing Standards](#testing-standards)
8. [Documentation Standards](#documentation-standards)
9. [Git & Commit Conventions](#git--commit-conventions)
10. [Code Review Guidelines](#code-review-guidelines)

---

## Overview & Philosophy

The Triggerr platform maintains enterprise-grade code quality through strict adherence to proven patterns and conventions. Our style guide is built on three foundational principles:

1. **Consistency**: Uniform code patterns across all packages and chains
2. **Type Safety**: Leveraging TypeScript's full power for error prevention
3. **Maintainability**: Code that scales with our dual-chain, multi-provider architecture

**Key Architectural Principles:**
- **Package Template Compliance**: All packages must use appropriate templates from `templates/package-templates/`
- **Dual-Chain Consistency**: Identical patterns across Ethereum and Base smart contracts
- **Entity Awareness**: Code structure reflects our Nevada-based entity separation
- **User Abstraction**: Backend complexity hidden from user-facing interfaces

---

## TypeScript Standards

### Enterprise-Grade Type Safety Configuration

Our TypeScript standards are derived from our proven package template system with different strictness levels based on package type.

#### Core/Shared Packages (Maximum Strictness)

**Use for**: `@triggerr/shared`, `@triggerr/core`, `@triggerr/utils`

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "useUnknownInCatchVariables": true,
    "skipLibCheck": false
  }
}
```

#### Integration Packages (Flexible for External APIs)

**Use for**: `@triggerr/ethereum-adapter`, `@triggerr/base-adapter`, external API adapters

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": false,
    "skipLibCheck": true,
    "suppressExcessPropertyErrors": true
  }
}
```

#### Standard Packages (Balanced)

**Use for**: Business logic services, aggregators, engines

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "strict": true
  }
}
```

### Variable Naming Conventions

```typescript
// ✅ Correct naming patterns
const userWalletAddress = '0x...';
const ETHEREUM_CHAIN_ID = 1;
const BASE_CHAIN_ID = 8453;
const triggerrEscrowFactory = new TriggerrEscrowFactory();

// Entity-aware naming
const parametriggerIncWallet = '0x...';
const triggerrDirectLLCOperations = {};

// Chain-specific naming
const ethereumGasPrice = await provider.getGasPrice();
const baseTransactionHash = '0x...';

// ❌ Incorrect patterns
const addr = '0x...'; // Too abbreviated
const chainId = 1; // Ambiguous - which chain?
const factory = new Factory(); // Generic naming
```

### Interface and Type Definitions

```typescript
// ✅ Proper interface structure
interface DualChainEscrowParams {
  readonly amount: bigint;
  readonly recipientAddress: string;
  readonly expirationDate: Date;
  readonly preferredChain?: 'ethereum' | 'base';
  readonly metadata?: Record<string, unknown>;
}

// Entity-aware types
interface EntityAwareResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly metadata: {
    readonly entity: 'parametrigger-inc' | 'triggerr-direct-llc' | 'parametrigger-financial-solutions';
    readonly jurisdiction: 'nevada' | 'estonia' | 'multi-state';
    readonly blockchainNetwork?: 'ethereum' | 'base' | 'dual-chain';
  };
}

// Chain-agnostic patterns
interface ChainAgnosticTransaction {
  readonly hash: string;
  readonly network: 'ethereum' | 'base';
  readonly status: 'pending' | 'confirmed' | 'failed';
  readonly gasUsed?: bigint;
  readonly blockNumber?: number;
}
```

### Error Handling Patterns

```typescript
// ✅ Comprehensive error handling
export class DualChainEscrowError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly network?: 'ethereum' | 'base',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DualChainEscrowError';
  }
}

// Error handling with chain fallback
async function createEscrowWithFallback(params: EscrowParams): Promise<TransactionResult> {
  try {
    // Try Base first for cost efficiency
    return await baseAdapter.createEscrow(params);
  } catch (baseError) {
    console.warn('Base escrow creation failed, falling back to Ethereum:', baseError);
    try {
      return await ethereumAdapter.createEscrow(params);
    } catch (ethereumError) {
      throw new DualChainEscrowError(
        'Escrow creation failed on both networks',
        'DUAL_CHAIN_FAILURE',
        undefined,
        ethereumError
      );
    }
  }
}
```

### Optional Property Handling

```typescript
// ✅ Correct handling of exactOptionalPropertyTypes
interface UserPreferences {
  readonly theme: 'light' | 'dark';
  readonly notifications?: boolean; // Truly optional
}

// Proper optional property assignment
const preferences: UserPreferences = {
  theme: 'light',
  // Only include notifications if we have a defined value
  ...(notificationsSetting !== undefined && { notifications: notificationsSetting })
};

// ❌ Incorrect - will fail with exactOptionalPropertyTypes
const badPreferences: UserPreferences = {
  theme: 'light',
  notifications: someValue || undefined // Don't do this
};
```

---

## Solidity Conventions (Dual-Chain)

### Smart Contract Architecture Standards

Our smart contracts are deployed identically on both Ethereum and Base networks with consistent patterns and security standards.

#### Contract Structure Template

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title TriggerrContractName
 * @dev Description of contract purpose and functionality
 * @notice Deployed identically on Ethereum and Base networks
 * @author Parametrigger Inc.
 */
contract TriggerrContractName is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    // State variables with clear visibility
    mapping(bytes32 => EscrowData) private _escrows;
    uint256 private _escrowCounter;
    
    // Events with indexed parameters for filtering
    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed creator,
        address indexed recipient,
        uint256 amount
    );
    
    // Custom errors for gas efficiency
    error EscrowNotFound(bytes32 escrowId);
    error InsufficientBalance(uint256 required, uint256 available);
    error InvalidRecipient(address recipient);
    
    // Modifiers for common checks
    modifier escrowExists(bytes32 escrowId) {
        if (_escrows[escrowId].creator == address(0)) {
            revert EscrowNotFound(escrowId);
        }
        _;
    }
    
    // Implementation functions...
}
```

#### Naming Conventions

```solidity
// ✅ Correct Solidity naming
contract TriggerrEscrowFactory {} // PascalCase for contracts
interface ITriggerrEscrow {} // Interface prefix
library TriggerrMath {} // PascalCase for libraries

// Functions: camelCase
function createEscrow(bytes32 escrowId) external {}
function getEscrowStatus(bytes32 escrowId) external view returns (EscrowStatus) {}

// Events: PascalCase with descriptive names
event EscrowCreated(bytes32 indexed escrowId, address indexed creator);
event PolicyRegistered(bytes32 indexed policyId, bytes32 indexed policyHash);

// Variables: descriptive camelCase
uint256 public escrowCounter;
mapping(bytes32 => EscrowData) private _escrowDatabase;

// Constants: UPPER_SNAKE_CASE
uint256 public constant MIN_ESCROW_AMOUNT = 1 ether;
bytes32 public constant TRIGGERR_DOMAIN_SEPARATOR = keccak256("TRIGGERR_V1");
```

#### Security Best Practices

```solidity
// ✅ Security patterns for dual-chain deployment

// 1. Reentrancy protection
function fulfillEscrow(bytes32 escrowId) 
    external 
    nonReentrant 
    escrowExists(escrowId) 
{
    EscrowData storage escrow = _escrows[escrowId];
    
    // Checks
    require(msg.sender == escrow.recipient, "Not authorized");
    require(escrow.status == EscrowStatus.Active, "Escrow not active");
    
    // Effects
    escrow.status = EscrowStatus.Fulfilled;
    
    // Interactions (external calls last)
    (bool success, ) = payable(escrow.recipient).call{value: escrow.amount}("");
    require(success, "Transfer failed");
    
    emit EscrowFulfilled(escrowId, escrow.recipient, escrow.amount);
}

// 2. Input validation
function createEscrow(
    address recipient,
    uint256 amount,
    uint256 expirationTime
) external payable returns (bytes32) {
    if (recipient == address(0)) revert InvalidRecipient(recipient);
    if (amount == 0) revert InsufficientBalance(1, 0);
    if (expirationTime <= block.timestamp) revert("Invalid expiration");
    
    // Implementation...
}

// 3. Access control
modifier onlyTriggerrBackend() {
    require(hasRole(TRIGGERR_BACKEND_ROLE, msg.sender), "Not authorized backend");
    _;
}
```

#### Gas Optimization Patterns

```solidity
// ✅ Gas-efficient patterns for dual-chain deployment

// Pack structs efficiently
struct EscrowData {
    address creator;      // 20 bytes
    address recipient;    // 20 bytes
    uint96 amount;        // 12 bytes (sufficient for most amounts)
    uint32 expiration;    // 4 bytes (timestamp)
    EscrowStatus status;  // 1 byte enum
    // Total: 57 bytes (fits in 2 storage slots)
}

// Use custom errors instead of require strings
error InsufficientFunds(uint256 required, uint256 available);

// Efficient mappings
mapping(bytes32 => EscrowData) private _escrows;
mapping(address => uint256) private _userEscrowCount;

// Batch operations for gas efficiency
function batchFulfillEscrows(bytes32[] calldata escrowIds) external {
    for (uint256 i = 0; i < escrowIds.length;) {
        _fulfillEscrow(escrowIds[i]);
        unchecked { ++i; }
    }
}
```

### Cross-Chain Consistency

```solidity
// ✅ Identical deployment patterns across Ethereum and Base

// Network-agnostic contract code
contract TriggerrPolicyRegistry {
    // Same logic deployed on both networks
    mapping(bytes32 => bytes32) private _policyHashes;
    
    event PolicyRegistered(
        bytes32 indexed policyId,
        bytes32 indexed policyHash,
        address indexed policyholder
    );
    
    function registerPolicy(
        bytes32 policyId,
        bytes32 policyHash,
        address policyholder
    ) external onlyRole(POLICY_REGISTRAR_ROLE) {
        _policyHashes[policyId] = policyHash;
        emit PolicyRegistered(policyId, policyHash, policyholder);
    }
}

// Network-specific configurations handled at deployment
// ethereum.config.ts
export const ETHEREUM_CONFIG = {
  FACTORY_ADDRESS: "0x...",
  POLICY_REGISTRY_ADDRESS: "0x...",
  CHAIN_ID: 1
};

// base.config.ts  
export const BASE_CONFIG = {
  FACTORY_ADDRESS: "0x...", // Different address, same contract
  POLICY_REGISTRY_ADDRESS: "0x...",
  CHAIN_ID: 8453
};
```

---

## Package Architecture

### Package Template Compliance

All packages must follow our proven template system for consistency and maintainability.

#### Directory Structure Standards

```
packages/category/package-name/
├── src/
│   ├── index.ts              # Barrel export (required)
│   ├── types/                # Type definitions
│   ├── services/             # Business logic
│   ├── utils/                # Helper functions
│   ├── constants/            # Package constants
│   └── __tests__/            # Test files
├── package.json              # Package configuration
├── tsconfig.json            # TypeScript config (from template)
├── README.md                # Package documentation
└── CHANGELOG.md             # Version history
```

#### Package.json Standards

```json
{
  "name": "@triggerr/package-name",
  "version": "1.0.0",
  "private": true,
  "description": "Clear, concise package description",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf .turbo dist",
    "dev": "tsc --watch",
    "lint": "eslint src/",
    "test": "jest"
  },
  "dependencies": {
    // Production dependencies only
  },
  "devDependencies": {
    // Development dependencies
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  },
  "keywords": ["triggerr", "parametric", "insurance"],
  "author": "Parametrigger Inc.",
  "license": "UNLICENSED"
}
```

### Package Categories & Template Selection

| Package Type | Template | Use Cases | Example Packages |
|-------------|----------|-----------|------------------|
| **Core/Shared** | `tsconfig.core.json` | Foundation packages, shared types | `@triggerr/shared`, `@triggerr/core` |
| **Integration** | `tsconfig.integration.json` | External APIs, blockchain adapters | `@triggerr/ethereum-adapter`, `@triggerr/base-adapter` |
| **Business Logic** | `tsconfig.base.json` | Services, engines, aggregators | `@triggerr/quote-engine`, `@triggerr/escrow-engine` |
| **Blockchain** | `tsconfig.integration.json` | Smart contract interactions | `@triggerr/chain-router`, `@triggerr/smart-contracts` |

---

## Import/Export Patterns

### Barrel Export Strategy

**Principle**: All packages must use barrel exports in their main `index.ts` file. Deep imports are prohibited.

#### Correct Barrel Export Pattern

```typescript
// packages/shared/src/index.ts
export * from './types';
export * from './constants';
export * from './utils';

// Selective re-exports for specific items
export { 
  SpecificType,
  IMPORTANT_CONSTANT 
} from './internal/specific-module';

// Re-export external dependencies for convenience
export type { ExternalType } from 'external-library';
```

#### Import Standards

```typescript
// ✅ Correct package-level imports
import { InsurancePolicy, PolicyStatus } from '@triggerr/shared';
import { EscrowEngine } from '@triggerr/escrow-engine';
import { ChainRouter } from '@triggerr/chain-router';

// ✅ Type-only imports when appropriate
import type { 
  DualChainConfig,
  EthereumAdapter,
  BaseAdapter 
} from '@triggerr/blockchain-interface';

// ✅ Namespace imports for large utility sets
import * as TriggerrMath from '@triggerr/math-utils';

// ❌ Deep imports (prohibited)
import { PolicyStatus } from '@triggerr/shared/types/policy';
import { createEscrow } from '@triggerr/escrow-engine/services/escrow-service';
```

### Internal Package Organization

```typescript
// Internal file: packages/escrow-engine/src/services/escrow-service.ts
export class EscrowService {
  // Implementation
}

// Internal file: packages/escrow-engine/src/types/escrow-types.ts
export interface EscrowParams {
  // Type definition
}

// Barrel export: packages/escrow-engine/src/index.ts
export { EscrowService } from './services/escrow-service';
export type { EscrowParams } from './types/escrow-types';

// Usage in other packages
import { EscrowService, type EscrowParams } from '@triggerr/escrow-engine';
```

---

## Cross-Chain Code Standards

### Chain Abstraction Patterns

```typescript
// ✅ Chain-agnostic service interfaces
interface IBlockchainService {
  readonly networkName: 'ethereum' | 'base';
  readonly chainId: number;
  
  createEscrow(params: EscrowParams): Promise<TransactionResult>;
  getEscrowStatus(escrowId: string): Promise<EscrowStatus>;
  fulfillEscrow(escrowId: string): Promise<TransactionResult>;
}

// ✅ Chain router implementation
export class ChainRouter {
  constructor(
    private readonly ethereumAdapter: IBlockchainService,
    private readonly baseAdapter: IBlockchainService
  ) {}
  
  async selectOptimalChain(
    operation: 'escrow' | 'payout' | 'registry',
    amount?: bigint
  ): Promise<IBlockchainService> {
    // Cost-based routing logic
    if (amount && amount > this.HIGH_VALUE_THRESHOLD) {
      return this.ethereumAdapter; // Security for high-value
    }
    return this.baseAdapter; // Cost efficiency for standard operations
  }
  
  async executeWithFallback<T>(
    operation: (adapter: IBlockchainService) => Promise<T>,
    preferredChain?: 'ethereum' | 'base'
  ): Promise<T> {
    const primary = preferredChain === 'ethereum' 
      ? this.ethereumAdapter 
      : this.baseAdapter;
    const fallback = preferredChain === 'ethereum' 
      ? this.baseAdapter 
      : this.ethereumAdapter;
    
    try {
      return await operation(primary);
    } catch (error) {
      console.warn(`Primary chain failed, attempting fallback:`, error);
      return await operation(fallback);
    }
  }
}
```

### Dual-Chain Configuration Management

```typescript
// ✅ Network configuration pattern
interface NetworkConfig {
  readonly chainId: number;
  readonly rpcUrl: string;
  readonly factoryAddress: string;
  readonly policyRegistryAddress: string;
  readonly policyFundAddress: string;
  readonly gasSettings: {
    readonly maxFeePerGas?: bigint;
    readonly maxPriorityFeePerGas?: bigint;
  };
}

export const NETWORK_CONFIGS: Record<'ethereum' | 'base', NetworkConfig> = {
  ethereum: {
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL!,
    factoryAddress: process.env.ETHEREUM_FACTORY_ADDRESS!,
    policyRegistryAddress: process.env.ETHEREUM_POLICY_REGISTRY_ADDRESS!,
    policyFundAddress: process.env.ETHEREUM_POLICY_FUND_ADDRESS!,
    gasSettings: {
      maxFeePerGas: parseGwei('30'),
      maxPriorityFeePerGas: parseGwei('2')
    }
  },
  base: {
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL!,
    factoryAddress: process.env.BASE_FACTORY_ADDRESS!,
    policyRegistryAddress: process.env.BASE_POLICY_REGISTRY_ADDRESS!,
    policyFundAddress: process.env.BASE_POLICY_FUND_ADDRESS!,
    gasSettings: {
      maxFeePerGas: parseGwei('0.1'),
      maxPriorityFeePerGas: parseGwei('0.05')
    }
  }
};
```

---

## Testing Standards

### Unit Testing Patterns

```typescript
// ✅ Comprehensive test structure
describe('DualChainEscrowService', () => {
  let escrowService: EscrowService;
  let mockEthereumAdapter: jest.Mocked<IBlockchainService>;
  let mockBaseAdapter: jest.Mocked<IBlockchainService>;
  let mockChainRouter: jest.Mocked<ChainRouter>;

  beforeEach(() => {
    mockEthereumAdapter = createMockBlockchainService('ethereum');
    mockBaseAdapter = createMockBlockchainService('base');
    mockChainRouter = createMockChainRouter();
    
    escrowService = new EscrowService(mockChainRouter);
  });

  describe('createEscrow', () => {
    it('should create escrow on Base for standard amounts', async () => {
      const params = createValidEscrowParams({ amount: parseEther('100') });
      
      mockChainRouter.selectOptimalChain.mockResolvedValue(mockBaseAdapter);
      mockBaseAdapter.createEscrow.mockResolvedValue(createSuccessfulTransaction());

      const result = await escrowService.createEscrow(params);

      expect(mockChainRouter.selectOptimalChain).toHaveBeenCalledWith('escrow', params.amount);
      expect(mockBaseAdapter.createEscrow).toHaveBeenCalledWith(params);
      expect(result.success).toBe(true);
    });

    it('should create escrow on Ethereum for high-value amounts', async () => {
      const params = createValidEscrowParams({ amount: parseEther('10000') });
      
      mockChainRouter.selectOptimalChain.mockResolvedValue(mockEthereumAdapter);
      mockEthereumAdapter.createEscrow.mockResolvedValue(createSuccessfulTransaction());

      await escrowService.createEscrow(params);

      expect(mockEthereumAdapter.createEscrow).toHaveBeenCalledWith(params);
    });

    it('should handle chain fallback gracefully', async () => {
      const params = createValidEscrowParams();
      
      mockChainRouter.executeWithFallback.mockImplementation(async (operation) => {
        return await operation(mockBaseAdapter);
      });

      const result = await escrowService.createEscrow(params);

      expect(mockChainRouter.executeWithFallback).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw DualChainEscrowError when both chains fail', async () => {
      const params = createValidEscrowParams();
      
      mockChainRouter.executeWithFallback.mockRejectedValue(
        new Error('Both chains failed')
      );

      await expect(escrowService.createEscrow(params))
        .rejects
        .toThrow(DualChainEscrowError);
    });
  });
});
```

### Integration Testing

```typescript
// ✅ Integration test patterns
describe('End-to-End Escrow Flow', () => {
  let testDatabase: Database;
  let realChainRouter: ChainRouter;
  
  beforeAll(async () => {
    testDatabase = await createTestDatabase();
    realChainRouter = createTestChainRouter(); // Uses testnets
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDatabase);
  });

  it('should complete full escrow lifecycle on both chains', async () => {
    const testCases = [
      { chain: 'base', amount: parseEther('100') },
      { chain: 'ethereum', amount: parseEther('5000') }
    ] as const;

    for (const testCase of testCases) {
      const escrowParams = {
        amount: testCase.amount,
        recipient: generateTestAddress(),
        expiration: Date.now() + 86400000 // 24 hours
      };

      // Create escrow
      const createResult = await realChainRouter.createEscrow(escrowParams);
      expect(createResult.success).toBe(true);

      // Verify on-chain state
      const status = await realChainRouter.getEscrowStatus(createResult.escrowId!);
      expect(status.status).toBe('ACTIVE');

      // Fulfill escrow
      const fulfillResult = await realChainRouter.fulfillEscrow(createResult.escrowId!);
      expect(fulfillResult.success).toBe(true);
    }
  });
});
```

### Smart Contract Testing

```typescript
// ✅ Hardhat test patterns for dual-chain contracts
describe('TriggerrEscrowFactory', () => {
  let factory: TriggerrEscrowFactory;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    
    const Factory = await ethers.getContractFactory('TriggerrEscrowFactory');
    factory = await Factory.deploy();
    await factory.initialize(owner.address);
  });

  describe('createSingleSidedEscrow', () => {
    it('should create escrow with correct parameters', async () => {
      const amount = parseEther('1');
      const recipient = user.address;
      const expiration = Math.floor(Date.now() / 1000) + 3600; // 1 hour

      const tx = await factory.createSingleSidedEscrow(
        recipient,
        expiration,
        { value: amount }
      );

      await expect(tx)
        .to.emit(factory, 'EscrowCreated')
        .withArgs(
          expect.any(String), // escrowId
          owner.address,       // creator
          recipient,           // recipient
          amount              // amount
        );
    });

    it('should revert with invalid recipient', async () => {
      await expect(
        factory.createSingleSidedEscrow(
          ethers.constants.AddressZero,
          Math.floor(Date.now() / 1000) + 3600,
          { value: parseEther('1') }
        )
      ).to.be.revertedWithCustomError(factory, 'InvalidRecipient');
    });
  });

  describe('gas optimization', () => {
    it('should use reasonable gas for escrow creation', async () => {
      const tx = await factory.createSingleSidedEscrow(
        user.address,
        Math.floor(Date.now() / 1000) + 3600,
        { value: parseEther('1') }
      );

      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lessThan(200000); // Reasonable gas limit
    });
  });
});
```

---

## Documentation Standards

### Code Documentation

```typescript
/**
 * Creates a new escrow with intelligent chain selection.
 * 
 * Automatically selects the optimal blockchain (Ethereum or Base) based on:
 * - Transaction amount (high-value → Ethereum for security)
 * - Network congestion (dynamic routing)
 * - Cost optimization (Base preferred for standard operations)
 * 
 * @param params - Escrow creation parameters
 * @param params.amount - Escrow amount in wei
 * @param params.recipient - Recipient address (must be valid)
 * @param params.expiration - Expiration timestamp in seconds
 * @param params.preferredChain - Optional chain preference
 * @returns Promise resolving to transaction result with escrow ID
 * 
 * @throws {DualChainEscrowError} When escrow creation fails on both chains
 * @throws {ValidationError} When parameters are invalid
 * 
 * @example
 * ```typescript
 * const result = await escrowService.createEscrow({
 *   amount: parseEther('100'),
 *   recipient: '0x742d35Cc6634C0532925a3b8D94fC3f8C9fBA902',
 *   expiration: Date.now() + 86400000 // 24 hours
 * });
 * 
 * if (result.success) {
 *   console.log('Escrow created:', result.escrowId);
 * }
 * ```
 */
async createEscrow(params: EscrowCreationParams): Promise<EscrowResult> {
  // Implementation
}
```

### Package README Standards

```markdown
# @triggerr/package-name

Brief description of the package purpose and functionality.

## Installation

```bash
# Internal package - automatically available in monorepo
import { ExportedFunction } from '@triggerr/package-name';
```

## Overview

Detailed description of the package's role in the Triggerr ecosystem.

### Key Features

- Feature 1: Description
- Feature 2: Description
- Dual-Chain Support: Works with both Ethereum and Base

## Usage

### Basic Example

```typescript
import { MainService } from '@triggerr/package-name';

const service = new MainService();
const result = await service.performAction();
```

### Advanced Example

```typescript
// More complex usage example