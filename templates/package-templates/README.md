# Triggerr Package Templates - Enterprise-Grade Build System

This directory contains enterprise-grade package templates for the Triggerr platform. These templates ensure consistent, scalable, and maintainable package architecture across the entire monorepo.

## 🏗️ Architecture Overview

The Triggerr build system is based on **TypeScript Project References**, providing:

- ✅ **Incremental builds** for faster development cycles
- ✅ **Proper dependency ordering** with automatic build orchestration
- ✅ **Enterprise-grade type safety** with strict checking
- ✅ **Scalable architecture** supporting multichain, multi-provider ecosystem
- ✅ **Clear separation of concerns** between package types

## 📦 Package Types & Templates

### 1. Core/Shared Packages (`tsconfig.core.json`)
**Use for:** Foundational packages that other packages depend on
**Examples:** `@triggerr/shared`, `@triggerr/core`, `@triggerr/utils`

**Features:**
- Strictest type checking (`skipLibCheck: false`)
- Maximum type safety settings
- Enhanced error reporting
- Clean declaration generation

```json
{
  "extends": "./tsconfig.core.json",
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": false,
    "exactOptionalPropertyTypes": true
  }
}
```

### 2. Integration Packages (`tsconfig.integration.json`)
**Use for:** External API integrations and adapters
**Examples:** `@triggerr/flightaware-adapter`, `@triggerr/stripe-adapter`

**Features:**
- Flexible type handling for external APIs
- Strategic `skipLibCheck: true` for third-party dependencies
- Relaxed strictness for API compatibility
- Enhanced error handling

```json
{
  "extends": "./tsconfig.integration.json",
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "exactOptionalPropertyTypes": false
  }
}
```

### 3. Standard Packages (`tsconfig.base.json`)
**Use for:** Business logic, services, and aggregators
**Examples:** `@triggerr/quote-engine`, `@triggerr/wallet-service`

**Features:**
- Balanced type safety and development speed
- Strategic dependency handling
- Performance optimizations
- Standard enterprise settings

## 🚀 Creating New Packages

### Step 1: Choose the Right Template

| Package Type | Template | Use Case |
|-------------|----------|----------|
| **Core/Shared** | `tsconfig.core.json` | Foundation packages, shared types |
| **Integration** | `tsconfig.integration.json` | External API adapters |
| **Business Logic** | `tsconfig.base.json` | Services, engines, aggregators |
| **Blockchain** | `tsconfig.integration.json` | Blockchain adapters |
| **Applications** | `tsconfig.base.json` | Apps (web, api) |

### Step 2: Create Package Structure

```bash
# Create new package directory
mkdir -p packages/category/your-package

# Copy appropriate template
cp templates/package-templates/tsconfig.[template].json packages/category/your-package/tsconfig.json

# Create package.json
```

### Step 3: Configure Package.json

```json
{
  "name": "@triggerr/your-package",
  "version": "1.0.0",
  "private": true,
  "description": "Your package description",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf .turbo dist"
  },
  "dependencies": {
    // Add your dependencies
  }
}
```

### Step 4: Add to Root tsconfig.json

```json
{
  "references": [
    {
      "path": "./packages/category/your-package"
    }
  ]
}
```

### Step 5: Create src/index.ts

```typescript
/**
 * @package @triggerr/your-package
 * @description Brief description of your package
 */

// Export your main functionality
export * from './your-module';

// Package metadata
export const PACKAGE_NAME = '@triggerr/your-package';
export const PACKAGE_VERSION = '1.0.0';
```

## 🔧 Enterprise-Grade Type Safety Settings

### Strict Type Checking (Core Packages)
```json
{
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
  "useUnknownInCatchVariables": true
}
```

### Strategic Dependency Handling
- **Core packages:** `"skipLibCheck": false` for maximum safety
- **Integration packages:** `"skipLibCheck": true` for external API compatibility
- **Standard packages:** `"skipLibCheck": true` for balanced development speed

## 🏭 Build System Commands

### Full Build (All Packages)
```bash
# Clean build from root
tsc --build

# Validate build quality
bun run scripts/validate-build.ts
```

### Individual Package Build
```bash
# Navigate to package
cd packages/category/your-package

# Build package
tsc
```

### Development Workflow
```bash
# Watch mode for development
tsc --build --watch

# Clean build
find packages apps -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
tsc --build
```

## 📋 Package Dependencies Best Practices

### 1. Import Patterns
```typescript
// ✅ Correct: Package-level imports
import { SomeType } from '@triggerr/shared';
import { CacheManager } from '@triggerr/core';

// ❌ Incorrect: Deep imports
import { SomeType } from '@triggerr/shared/models/specific-model';
import { CacheManager } from '@triggerr/core/utils/cache-manager';
```

### 2. Export Patterns
```typescript
// src/index.ts - Always export through main index
export * from './models';
export * from './services';
export { SpecificClass } from './internal/specific-class';

// Re-export external dependencies for convenience
export type { ExternalType } from 'external-library';
```

### 3. Type-Only Imports
```typescript
// Use type-only imports for types
import type { SomeType, AnotherType } from '@triggerr/shared';

// Regular imports for runtime values
import { someFunction, SOME_CONSTANT } from '@triggerr/core';
```

## 🔍 Common Patterns & Solutions

### Handling exactOptionalPropertyTypes

**Problem:** `Type 'string | undefined' is not assignable to type 'string'`

**Solution:**
```typescript
// ❌ Problematic
const config = {
  baseURL: process.env.API_URL || undefined
};

// ✅ Correct
const config = {
  ...(process.env.API_URL && { baseURL: process.env.API_URL })
};
```

### External API Integration

**Problem:** Third-party types don't match exact optional properties

**Solution:** Use integration template with relaxed settings
```json
{
  "exactOptionalPropertyTypes": false,
  "suppressExcessPropertyErrors": true,
  "skipLibCheck": true
}
```

### Circular Dependencies

**Problem:** Package A depends on Package B which depends on Package A

**Solution:** Extract shared types to a common package
```typescript
// Create @triggerr/shared-types for common interfaces
// Use dependency injection patterns
// Implement event-driven communication
```

## 📊 Build Performance Optimization

### Incremental Builds
- Uses `tsBuildInfoFile` for build caching
- Only rebuilds changed packages and dependents
- Significant speed improvement for large codebases

### Build Order Optimization
The root `tsconfig.json` references array defines build order:
1. Shared packages (`shared`, `utils`, `config`)
2. Core packages (`core`, `ui`)
3. API contracts (`api/contracts`, `api/sdk`)
4. Blockchain interfaces
5. Integration adapters
6. Aggregation layer
7. Business logic services
8. Applications

## 🚨 Troubleshooting

### Build Failures

1. **Module Resolution Errors**
   ```bash
   # Clean and rebuild
   find packages apps -name "dist" -type d -exec rm -rf {} +
   tsc --build
   ```

2. **Type Declaration Issues**
   - Verify `composite: true` in tsconfig.json
   - Check `declaration: true` is set
   - Ensure package is in root references array

3. **Dependency Ordering**
   - Check if dependent package built first
   - Verify tsconfig.json references array
   - Use `tsc --build --dry` to see build order

### Performance Issues

1. **Slow Builds**
   - Enable incremental builds: `"incremental": true`
   - Use build cache: `"tsBuildInfoFile": "./dist/.tsbuildinfo"`
   - Consider splitting large packages

2. **Memory Issues**
   - Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096"`
   - Use `assumeChangesOnlyAffectDirectDependencies: true`

## 🔮 Future Considerations

### Adding New Providers
When adding new blockchain providers or external integrations:

1. Use the integration template
2. Follow the naming convention: `@triggerr/provider-name-adapter`
3. Place in appropriate category: `packages/integrations/` or `packages/blockchain/`
4. Add to build order in root tsconfig.json

### Scaling Architecture
The current architecture supports:
- Unlimited package additions
- Multiple blockchain networks
- Various external API providers
- Microservice extraction
- Independent deployment units

## 📝 Template Files

- `tsconfig.base.json` - Standard package template
- `tsconfig.core.json` - Core/shared package template  
- `tsconfig.integration.json` - External integration template
- `README.md` - This documentation

## 🎯 Quick Start Checklist

- [ ] Choose appropriate template for your package type
- [ ] Copy template to new package directory
- [ ] Configure package.json with correct metadata
- [ ] Add package reference to root tsconfig.json
- [ ] Create src/index.ts with proper exports
- [ ] Build and test: `tsc --build`
- [ ] Validate with: `bun run scripts/validate-build.ts`

---

**Remember:** This build system is designed for enterprise-grade reliability and scalability. Always prefer consistency and type safety over convenience shortcuts.