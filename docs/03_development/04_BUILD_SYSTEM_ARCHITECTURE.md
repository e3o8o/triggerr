# Build System Architecture - Enterprise TypeScript Project References

## Overview

The Triggerr platform uses an enterprise-grade build system based on **TypeScript Project References** with strict type safety enforcement, enhanced with **dual-chain Solidity smart contract compilation and deployment**. This document provides comprehensive guidance for understanding, maintaining, and extending the build system across both TypeScript and Solidity codebases.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Package Templates System](#package-templates-system)
3. [Build Process & Commands](#build-process--commands)
4. [Type Safety Configuration](#type-safety-configuration)
5. [Package Categories & Standards](#package-categories--standards)
6. [Adding New Packages](#adding-new-packages)
7. [Troubleshooting](#troubleshooting)
8. [Migration History](#migration-history)
9. [Performance Optimization](#performance-optimization)
10. [Best Practices](#best-practices)

## Architecture Overview

### TypeScript Project References

The build system is built on **TypeScript Project References**, which provides:

- **Incremental builds**: Only rebuilds packages that have changed
- **Proper dependency ordering**: Automatically builds dependencies before dependents
- **Type safety across packages**: Ensures type consistency across the entire monorepo
- **Declaration file generation**: Enables proper module resolution between packages
- **Build caching**: Faster subsequent builds through `.tsbuildinfo` files

### Project Structure

```
triggerr/
├── tsconfig.json                    # Root configuration with project references
├── packages/                       # All internal packages
│   ├── shared/                     # Shared types and utilities
│   ├── core/                       # Core business logic
│   ├── utils/                      # Utility functions
│   ├── config/                     # Configuration management
│   ├── ui/                         # UI components
│   ├── api/                        # API contracts and SDK
│   ├── blockchain/                 # Blockchain interfaces and adapters
│   ├── smart-contracts/            # Solidity smart contracts (Ethereum + Base)
│   ├── ethereum-adapter/           # Ethereum blockchain adapter
│   ├── base-adapter/               # Base (L2) blockchain adapter
│   ├── chain-router/               # Dual-chain routing and abstraction
│   ├── integrations/               # External API integrations
│   ├── aggregators/                # Data aggregation services
│   ├── services/                   # Business logic services
│   └── llm/                        # LLM interfaces and adapters
├── apps/                           # Applications
│   ├── api/                        # Backend API server
│   └── web/                        # Frontend web application
└── templates/package-templates/    # Package configuration templates
```

### Build Dependency Graph

The build system follows a strict dependency hierarchy:

```
1. Foundation Layer:
   - shared, utils, config

2. Core Layer:
   - core, ui

3. API Layer:
   - api/contracts, api/sdk

4. Infrastructure Layer:
   - blockchain/blockchain-interface
   - blockchain/paygo-adapter
   - blockchain/service-registry

5. Integration Layer:
   - integrations/* (all external API adapters)

6. Aggregation Layer:
   - aggregators/flight-aggregator
   - aggregators/weather-aggregator
   - aggregators/data-router

7. Service Layer:
   - services/* (all business logic services)

8. LLM Layer:
   - llm/llm-interface
   - llm/deepseek-adapter

9. Application Layer:
   - apps/api
   - apps/web
```

## Dual-Chain Smart Contract Build System

### Solidity Build Pipeline

The platform integrates Solidity smart contract development with the TypeScript monorepo through:

- **Hardhat Framework**: Primary development environment for Ethereum and Base smart contracts
- **Foundry Support**: Alternative tooling for advanced testing and gas optimization
- **TypeChain Integration**: Automatic TypeScript interface generation from ABIs
- **Dual-Chain Deployment**: Coordinated deployment scripts for Ethereum and Base networks

### Smart Contract Package Structure

```
packages/smart-contracts/
├── contracts/                      # Solidity source files
│   ├── TriggerrEscrowFactory.sol  # Main escrow factory contract
│   ├── PolicyRegistry.sol         # Policy management contract
│   └── PolicyFund.sol             # Fund management contract
├── scripts/                       # Deployment and utility scripts
├── test/                          # Solidity and TypeScript tests
├── artifacts/                     # Compiled contract artifacts (gitignored)
├── typechain-types/               # Generated TypeScript interfaces
├── hardhat.config.ts             # Hardhat configuration
├── foundry.toml                  # Foundry configuration
└── package.json                  # Package configuration
```

### ABI Generation and TypeChain Integration

The build system automatically:

1. **Compiles Solidity contracts** using Hardhat
2. **Generates ABIs** from compiled contracts
3. **Creates TypeScript interfaces** using TypeChain
4. **Exports contract artifacts** to dependent packages
5. **Updates package references** for seamless integration

### Build Process Integration

```typescript
// Generated TypeScript interfaces are available immediately
import { TriggerrEscrowFactory__factory } from '@triggerr/smart-contracts';
import type { TriggerrEscrowFactory } from '@triggerr/smart-contracts';

// Seamless integration with existing TypeScript packages
const factory = TriggerrEscrowFactory__factory.connect(address, signer);
```

## Package Templates System

Located in `templates/package-templates/`, this system provides standardized configurations for different package types.

### Available Templates

#### 1. Core/Shared Packages (`tsconfig.core.json`)
**Use for:** Foundation packages that other packages depend on
**Examples:** `@triggerr/shared`, `@triggerr/core`, `@triggerr/utils`

**Key Features:**
- Strictest type checking (`skipLibCheck: false`)
- Maximum type safety settings (`exactOptionalPropertyTypes: true`)
- Enhanced error reporting
- Clean declaration generation

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "composite": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": false,
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": false
  }
}
```

#### 2. Integration Packages (`tsconfig.integration.json`)
**Use for:** External API integrations and adapters
**Examples:** `@triggerr/flightaware-adapter`, `@triggerr/stripe-adapter`

**Key Features:**
- Flexible type handling for external APIs (`exactOptionalPropertyTypes: false`)
- Strategic `skipLibCheck: true` for third-party dependencies
- Relaxed strictness for API compatibility
- Enhanced error handling

#### 3. Standard Packages (`tsconfig.base.json`)
**Use for:** Business logic, services, and aggregators
**Examples:** `@triggerr/quote-engine`, `@triggerr/wallet-service`

**Key Features:**
- Balanced type safety and development speed
- Strategic dependency handling
- Performance optimizations
- Standard enterprise settings

## Build Process & Commands

### Primary Build Commands

#### Dual-Chain Smart Contract Build
```bash
# Compile all smart contracts for both Ethereum and Base
bun run build:contracts

# Generate TypeScript interfaces from ABIs
bun run generate:typechain

# Deploy to local development networks
bun run deploy:local

# Deploy to testnets (Sepolia + Base Sepolia)
bun run deploy:testnet

# Deploy to production networks (Ethereum + Base Mainnet)
bun run deploy:mainnet
```

#### Smart Contract Development Commands
```bash
# Start local Hardhat node with Ethereum fork
bun run hardhat:node

# Start local Base node (via Docker)
bun run base:node

# Run smart contract tests
bun run test:contracts

# Run gas optimization analysis
bun run analyze:gas

# Verify contracts on Etherscan/Basescan
bun run verify:contracts
```

#### Full Project Type Check
```bash
# Check all TypeScript files for errors (no compilation)
bun tsc --noEmit

# Alternative with regular TypeScript
tsc --noEmit
```

#### TypeScript Project References Build
```bash
# Build all packages in correct dependency order
tsc --build

# Clean build (removes all .tsbuildinfo files)
tsc --build --clean

# Watch mode for development
tsc --build --watch

# Dry run to see what would be built
tsc --build --dry

# Verbose output for debugging
tsc --build --verbose
```

#### Individual Package Build
```bash
# Navigate to specific package
cd packages/category/package-name

# Build the package
tsc

# Type check without building
tsc --noEmit
```

#### Validation Script
```bash
# Run comprehensive build validation
bun run scripts/validate-build.ts
```

### Build Validation Script

The `scripts/validate-build.ts` script provides comprehensive build testing:

- Cleans all dist folders
- Builds packages in dependency order
- Validates type definition generation
- Reports success/failure statistics
- Identifies packages with missing declarations

## Smart Contract Integration Configuration

### Hardhat Configuration

The smart contracts package uses Hardhat with dual-network support:

```typescript
// packages/smart-contracts/hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
    base: {
      url: process.env.BASE_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};
```

### TypeScript Integration

Smart contracts are integrated into the TypeScript build system through:

```json
// packages/smart-contracts/package.json
{
  "scripts": {
    "build": "hardhat compile && npm run typechain",
    "typechain": "hardhat typechain",
    "clean": "hardhat clean && rimraf typechain-types",
    "deploy:ethereum": "hardhat run scripts/deploy.ts --network ethereum",
    "deploy:base": "hardhat run scripts/deploy.ts --network base"
  },
  "exports": {
    ".": {
      "import": "./typechain-types/index.js",
      "types": "./typechain-types/index.d.ts"
    },
    "./contracts/*": {
      "import": "./typechain-types/contracts/*.js",
      "types": "./typechain-types/contracts/*.d.ts"
    }
  }
}
```

## Type Safety Configuration

### Strict Type Checking Settings

The build system enforces enterprise-grade type safety:

#### Core Packages (Strictest)
```json
{
  "exactOptionalPropertyTypes": true,
  "noImplicitAny": true,
  "noImplicitReturns": true,
  "noImplicitThis": true,
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true,
  "noPropertyAccessFromIndexSignature": false,
  "allowUnusedLabels": false,
  "allowUnreachableCode": false,
  "skipLibCheck": false
}
```

#### Integration Packages (Relaxed)
```json
{
  "exactOptionalPropertyTypes": false,
  "noUncheckedIndexedAccess": false,
  "skipLibCheck": true
}
```

### Handling ExactOptionalPropertyTypes

When `exactOptionalPropertyTypes: true`, you cannot assign `undefined` to optional properties. Use conditional spread patterns:

```typescript
// ❌ Incorrect
const config = {
  optionalField: someValue || undefined
};

// ✅ Correct
const config = {
  requiredField: "value",
  ...(someValue && { optionalField: someValue })
};
```

### Handling NoUncheckedIndexedAccess

When accessing arrays or objects by index, check for undefined:

```typescript
// ❌ Incorrect
const firstItem = array[0];
const value = object[key];

// ✅ Correct
const firstItem = array[0];
if (firstItem) {
  // Use firstItem safely
}

const value = object[key];
if (value !== undefined) {
  // Use value safely
}
```

## Package Categories & Standards

### Package.json Configuration

Each package must have a standardized `package.json`:

```json
{
  "name": "@triggerr/package-name",
  "version": "1.0.0",
  "private": true,
  "description": "Package description",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf .turbo dist"
  },
  "dependencies": {
    // Runtime dependencies
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### TSConfig.json Standards

All packages must use the template system and include:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "composite": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": false
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/__tests__/**"
  ]
}
```

### Source Code Structure

Each package must follow this structure:

```
package-name/
├── src/
│   ├── index.ts          # Main export file
│   ├── types/            # Type definitions
│   ├── services/         # Service implementations
│   └── utils/            # Utility functions
├── dist/                 # Compiled output (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Adding New Packages

### Step-by-Step Process

#### 1. Create Package Directory
```bash
mkdir -p packages/category/your-package
cd packages/category/your-package
```

#### 2. Choose Appropriate Template

| Package Type | Template | Use Case |
|-------------|----------|----------|
| **Core/Shared** | `tsconfig.core.json` | Foundation packages, shared types |
| **Integration** | `tsconfig.integration.json` | External API adapters |
| **Business Logic** | `tsconfig.base.json` | Services, engines, aggregators |
| **Blockchain** | `tsconfig.integration.json` | Blockchain adapters |
| **Applications** | `tsconfig.base.json` | Apps (web, api) |

#### 3. Copy Template Configuration
```bash
cp ../../templates/package-templates/tsconfig.base.json ./tsconfig.json
```

#### 4. Create Package.json
```json
{
  "name": "@triggerr/your-package",
  "version": "1.0.0",
  "private": true,
  "description": "Your package description",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf .turbo dist"
  },
  "dependencies": {
    // Add your dependencies
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

#### 5. Create Source Structure
```bash
mkdir src
cat > src/index.ts << 'EOF'
/**
 * @package @triggerr/your-package
 * @description Brief description of your package
 */

// Export your main functionality
export * from './your-module';

// Package metadata
export const PACKAGE_NAME = '@triggerr/your-package';
export const PACKAGE_VERSION = '1.0.0';
EOF
```

#### 6. Add to Root TypeScript Configuration
Edit `triggerr/tsconfig.json` to include your package:

```json
{
  "references": [
    // ... existing references
    {
      "path": "./packages/category/your-package"
    }
  ]
}
```

#### 7. Add Package References (if needed)
If your package depends on other internal packages, add them to your `tsconfig.json`:

```json
{
  "references": [
    {
      "path": "../../shared"
    },
    {
      "path": "../../core"
    }
  ]
}
```

#### 8. Test the Package
```bash
# Build the package
tsc

# Test the full build
cd ../../../ # Back to root
tsc --build --dry
```

## Troubleshooting

### Common Build Issues

#### 1. Module Resolution Errors
**Symptom:** `Cannot find module '@triggerr/package-name'`

**Solutions:**
- Ensure the dependency package is built first
- Check that `composite: true` is set in dependency's tsconfig.json
- Verify the dependency is in the root `references` array
- Check that declaration files are being generated

```bash
# Clean and rebuild
find packages apps -name "dist" -type d -exec rm -rf {} +
tsc --build
```

#### 2. Type Declaration Issues
**Symptom:** Package builds but no `.d.ts` files generated

**Solutions:**
- Verify `declaration: true` in tsconfig.json
- Check `noEmit: false` is set
- Ensure `composite: true` is enabled
- Check package is exporting properly from `src/index.ts`

#### 3. Circular Dependencies
**Symptom:** Build hangs or fails with circular dependency errors

**Solutions:**
- Extract shared types to a common package
- Use dependency injection patterns
- Implement event-driven communication
- Review and simplify package dependencies

#### 4. ExactOptionalPropertyTypes Errors
**Symptom:** `Type 'string | undefined' is not assignable to type 'string'`

**Solution:**
```typescript
// Use conditional spread pattern
const data = {
  requiredField: "value",
  ...(optionalValue && { optionalField: optionalValue })
};
```

#### 5. Performance Issues

**Slow Builds:**
- Enable incremental builds: `"incremental": true`
- Use build cache: `"tsBuildInfoFile": "./dist/.tsbuildinfo"`
- Consider splitting large packages

**Memory Issues:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" tsc --build
```

### Debugging Commands

```bash
# See build order and dependencies
tsc --build --dry --verbose

# Check specific package
cd packages/category/package-name
tsc --listFiles

# Trace module resolution
tsc --traceResolution

# Generate detailed build info
tsc --build --verbose --listEmittedFiles
```

## Migration History

### From TSup to TypeScript Compiler (December 2024)

**Previous System Issues:**
- Inconsistent build configuration across packages
- No proper dependency ordering
- Missing type declaration files
- Build failures due to configuration drift

**Migration Process:**
1. **Analysis**: Identified packages using tsup vs tsc
2. **Template Creation**: Built standardized tsconfig templates
3. **Package Migration**: Converted each package to use TypeScript compiler
4. **Type Safety Enhancement**: Enabled strict type checking
5. **Validation**: Implemented comprehensive build testing

**Results:**
- Build success rate: 30% → 100%
- Type safety: Inconsistent → Enterprise-grade
- Build time: Improved through incremental compilation
- Maintainability: Significantly improved

## Performance Optimization

### Incremental Builds

The system uses TypeScript's incremental compilation:

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

Benefits:
- Only rebuilds changed packages and their dependents
- Significant speed improvement for large codebases
- Persistent build cache across sessions

### Build Order Optimization

The root `tsconfig.json` references array defines optimal build order:

1. **Foundation packages** build first (shared, utils, config)
2. **Core packages** build next (core, ui)
3. **Infrastructure** builds before services
4. **Applications** build last

### Memory Optimization

```bash
# For large builds
NODE_OPTIONS="--max-old-space-size=8192" tsc --build

# Enable build optimizations
tsc --build --assumeChangesOnlyAffectDirectDependencies
```

## Best Practices

### Development Workflow

#### Daily Development
```bash
# Start with type check
bun tsc --noEmit

# Use watch mode for active development
tsc --build --watch

# Clean build when needed
tsc --build --clean && tsc --build
```

#### Before Commits
```bash
# Full validation
bun run scripts/validate-build.ts

# Ensure no type errors
bun tsc --noEmit
```

### Code Quality Standards

#### Import Patterns
```typescript
// ✅ Correct: Package-level imports
import { SomeType } from '@triggerr/shared';
import { CacheManager } from '@triggerr/core';

// ❌ Incorrect: Deep imports
import { SomeType } from '@triggerr/shared/models/specific-model';
```

#### Export Patterns
```typescript
// src/index.ts - Always export through main index
export * from './models';
export * from './services';
export { SpecificClass } from './internal/specific-class';

// Re-export external dependencies for convenience
export type { ExternalType } from 'external-library';
```

#### Type-Only Imports
```typescript
// Use type-only imports for types
import type { SomeType, AnotherType } from '@triggerr/shared';

// Regular imports for runtime values
import { someFunction, SOME_CONSTANT } from '@triggerr/core';
```

### Package Dependencies

#### Dependency Principles
1. **Minimize dependencies**: Only depend on what you actually need
2. **Avoid circular dependencies**: Design clear dependency hierarchies
3. **Use peer dependencies** for shared libraries (React, etc.)
4. **Version alignment**: Keep dependency versions consistent

#### Internal Package Dependencies
```json
{
  "dependencies": {
    "@triggerr/shared": "workspace:*",
    "@triggerr/core": "workspace:*"
  }
}
```

### Error Handling

#### Type Safety Patterns
```typescript
// Use proper type guards
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Handle undefined with confidence
const result = array.find(item => item.id === id);
if (result) {
  // TypeScript knows result is defined here
  console.log(result.name);
}
```

#### Build Error Prevention
1. **Always run type check** before committing
2. **Use IDE TypeScript integration** for real-time error detection
3. **Enable strict mode** in development
4. **Test builds locally** before pushing

### Maintenance

#### Regular Tasks
- **Weekly**: Run full validation script
- **Monthly**: Update TypeScript version across all packages
- **Quarterly**: Review and optimize build performance
- **Annually**: Review and update template configurations

#### Monitoring
- Track build times and optimize slow packages
- Monitor type error frequency and patterns
- Keep documentation updated with architecture changes

## Smart Contract Deployment Pipeline

### Deployment Strategy

The build system supports coordinated deployment across both Ethereum and Base:

```typescript
// scripts/deploy-dual-chain.ts
export async function deployDualChain() {
  // Deploy to Ethereum first (primary chain)
  const ethereumContracts = await deployToEthereum();
  
  // Deploy to Base with same configuration
  const baseContracts = await deployToBase(ethereumContracts.config);
  
  // Verify deployment consistency
  await verifyConsistency(ethereumContracts, baseContracts);
  
  // Update environment configurations
  await updateEnvironmentConfig({
    ethereum: ethereumContracts.addresses,
    base: baseContracts.addresses
  });
}
```

### Environment Configuration

Post-deployment, the build system automatically updates environment configurations:

```bash
# Auto-generated environment variables
ETHEREUM_FACTORY_ADDRESS=0x...
BASE_FACTORY_ADDRESS=0x...
ETHEREUM_REGISTRY_ADDRESS=0x...
BASE_REGISTRY_ADDRESS=0x...

# Chain router configuration
CHAIN_ROUTER_PRIMARY=ethereum
CHAIN_ROUTER_FALLBACK=base
CHAIN_ROUTER_COST_THRESHOLD=50
```

### Future Considerations

#### Scaling Architecture
The current architecture supports:
- Unlimited package additions
- Multiple blockchain networks
- Various external API providers
- Microservice extraction
- Independent deployment units

#### Technology Evolution
- TypeScript version updates
- New compiler features adoption
- Build tool improvements
- IDE integration enhancements

---

## Quick Reference

### Essential Commands
```bash
# Type check entire project
bun tsc --noEmit

# Build all packages
tsc --build

# Clean build
tsc --build --clean

# Validate build system
bun run scripts/validate-build.ts

# Individual package build
cd packages/category/name && tsc
```

### Template Locations
- `templates/package-templates/tsconfig.base.json` - Standard packages
- `templates/package-templates/tsconfig.core.json` - Core packages
- `templates/package-templates/tsconfig.integration.json` - Integration packages

### Key Configuration Files
- `triggerr/tsconfig.json` - Root project references
- Each package's `tsconfig.json` - Package-specific configuration
- Each package's `package.json` - Build scripts and dependencies

This build system is designed for enterprise-grade reliability, type safety, and scalability. Always prefer consistency and proper configuration over convenience shortcuts.