# @triggerr/api-contracts

[![Version](https://img.shields.io/npm/v/@triggerr/api-contracts.svg)](https://www.npmjs.com/package/@triggerr/api-contracts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Single source of truth for triggerr API contracts, types, and validation schemas.**

This package provides comprehensive TypeScript types, Zod validation schemas, and OpenAPI specifications for the triggerr parametric insurance platform API. It enables type-safe communication between clients and servers while supporting multiple interfaces (Web, CLI, Terminal, API).

## 🚀 Features

- **Complete Type Definitions**: Full TypeScript coverage for all API endpoints
- **Runtime Validation**: Zod schemas for request/response validation
- **OpenAPI Specification**: Complete API documentation and tooling support
- **Multi-Interface Support**: Types for Web UI, REST API, CLI, and Terminal interfaces
- **Framework Agnostic**: Use with any TypeScript/JavaScript project
- **Zero Dependencies**: Only peer dependencies on `zod` for validation

## 📦 Installation

```bash
# Using bun (recommended)
bun add @triggerr/api-contracts

# Using npm
npm install @triggerr/api-contracts

# Using yarn
yarn add @triggerr/api-contracts
```

### Peer Dependencies

```bash
bun add zod  # Required for validation schemas
```

## 🏗️ Package Structure

```
src/
├── dtos/                    # Data Transfer Objects
│   ├── chat.ts             # Chat & conversation types
│   ├── insurance.ts        # Insurance quotes & policies
│   ├── wallet.ts           # Wallet & user management
│   └── common.ts           # Shared types & utilities
├── validators/             # Zod validation schemas
│   ├── chat.ts             # Chat endpoint validators
│   ├── insurance.ts        # Insurance endpoint validators
│   ├── wallet.ts           # Wallet endpoint validators
│   ├── common.ts           # Common validators
│   └── index.ts            # Validator exports
├── schemas/                # OpenAPI specifications
│   └── openapi.yaml        # Complete API specification
└── index.ts                # Main exports
```

## 🎯 Usage Strategy

This package uses a **modular, sub-path import strategy** for optimal performance and clarity. Instead of importing everything from the top-level `@triggerr/api-contracts`, you should import specific DTOs and validators from their respective sub-paths.

**Benefits of this approach:**
- **🌲 Tree-Shaking**: Ensures that only the code you actually use is included in your application's final bundle, leading to smaller bundle sizes and better performance.
- **📛 No Namespace Collisions**: Prevents naming conflicts between different API domains as the project grows.
- **📖 Code Clarity**: Makes it immediately clear which domain a specific type or validator belongs to.

Common, shared types like `ApiResponse` and constants like `PAGINATION_DEFAULTS` are exported from the top level for convenience.

## 🚀 Quick Start

### Basic Usage

```typescript
// Import common types from the top level
import type { ApiResponse } from '@triggerr/api-contracts';

// Import DTOs from their specific domain paths
import type { ChatMessageRequest } from '@triggerr/api-contracts/dtos/chat';
import type { InsuranceQuoteRequest } from '@triggerr/api-contracts/dtos/insurance';

// Type-safe API request
const chatRequest: ChatMessageRequest = {
  content: "I need flight delay insurance for UA123",
  interface: "web"
};

// Insurance quote request
const quoteRequest: InsuranceQuoteRequest = {
  productType: "flight_delay",
  flightDetails: {
    flightNumber: "UA123",
    airline: "UA",
    origin: "SFO",
    destination: "JFK",
    departureDate: "2024-06-15",
    departureTime: "10:00"
  },
  coverageDetails: {
    tier: "economy",
    coverageAmount: 500, // $500
    delayThreshold: 120    // 2 hours
  }
};
```

### API Client Integration

```typescript
import { ApiResponse, ErrorCode } from '@triggerr/api-contracts';

// Type-safe API response handling
async function handleApiResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json();
  
  if (!data.success) {
    switch (data.error?.code) {
      case ErrorCode.UNAUTHORIZED:
        // Handle auth error
        break;
      case ErrorCode.VALIDATION_ERROR:
        // Handle validation error
        break;
      default:
        // Handle other errors
    }
    throw new Error(data.error?.message);
  }
  
  return data.data!;
}
```

### Form Validation

```typescript
import { chatMessageRequestSchema } from '@triggerr/api-contracts/validators';

// Safe validation with error handling using Zod's safeParse
function validateChatForm(formData: unknown) {
  const result = chatMessageRequestSchema.safeParse(formData);
  
  if (!result.success) {
    // Handle validation errors
    result.error.issues.forEach(issue => {
      console.error(`${issue.path.join('.')}: ${issue.message}`);
    });
    return null;
  }
  
  return result.data; // Type-safe validated data
}
```

## 📚 API Coverage

### Chat & Conversations
- **Chat Messages**: Send/receive with context awareness
- **Conversations**: List, manage conversation history
- **Multi-Interface**: Support for Web, CLI, Terminal, API
- **Anonymous Sessions**: Temporary conversation storage

### Insurance Products
- **Product Catalog**: Available insurance products and tiers
- **Quote Generation**: Flight delay, cancellation, baggage coverage
- **Policy Purchase**: Complete purchase flow with payments
- **Policy Tracking**: Anonymous and authenticated tracking
- **Cart Management**: Anonymous user quote storage

### Wallet & Payments
- **Custodial Wallets**: System-managed PayGo wallets
- **Transactions**: Send, receive, transaction history
- **Escrow Management**: Policy escrows and user-defined escrows
- **Faucet Requests**: Test funding for development

### User Management
- **Authentication**: OAuth2 with Better-Auth integration
- **Profile Management**: User preferences and settings
- **Dashboard Data**: Comprehensive user dashboard
- **Anonymous Migration**: Seamless anonymous-to-auth migration

## 🔧 Development

### Building

```bash
bun run build      # Compile TypeScript
bun run clean      # Clean build artifacts
bun run typecheck  # Type checking only
bun run lint       # Lint code
```

### Validation Usage

```typescript
import { z } from 'zod';
import { chatMessageRequestSchema } from '@triggerr/api-contracts/validators';

// Direct schema usage
const ChatMessageSchema = chatMessageRequestSchema;
type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Custom validation
function validateAndTransform(data: unknown) {
  try {
    return ChatMessageSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      console.error('Validation failed:', error.issues);
    }
    throw error;
  }
}
```

### OpenAPI Integration

The package includes a complete OpenAPI 3.0 specification at `src/schemas/openapi.yaml`. Use this for:

- **Code Generation**: Generate clients in any language
- **API Documentation**: Auto-generate docs with Swagger UI
- **Testing**: Validate requests/responses against spec
- **Mock Servers**: Create mock servers for development

```bash
# Generate client code (example)
openapi-generator-cli generate \
  -i packages/api-contracts/src/schemas/openapi.yaml \
  -g typescript-fetch \
  -o generated-client/
```

## 🎨 Type Examples

### Error Handling

```typescript
import { ApiError, ErrorCode } from '@triggerr/api-contracts';

const error: ApiError = {
  code: ErrorCode.INSUFFICIENT_FUNDS,
  message: "Insufficient wallet balance for transaction",
  details: { required: 10000, available: 5000 },
  field: "amount"
};
```

### Pagination

```typescript
import { PaginationRequest, PaginatedResponse } from '@triggerr/api-contracts';

const request: PaginationRequest = {
  limit: 20,
  offset: 0
};

const response: PaginatedResponse<UserPolicySummary> = {
  success: true,
  data: [...], // Array of policies
  pagination: {
    total: 100,
    limit: 20,
    offset: 0,
    hasMore: true
  },
  timestamp: "2024-01-15T10:00:00Z",
  requestId: "uuid",
  version: "1.0.0"
};
```

### Multi-Interface Chat

```typescript
import { ChatInterface, ChatMessageRequest } from '@triggerr/api-contracts';

// Web interface
const webMessage: ChatMessageRequest = {
  content: "Get quote for flight AA100",
  interface: "web",
  context: {
    flightSearch: {
      origin: "LAX",
      destination: "JFK"
    }
  }
};

// CLI interface
const cliMessage: ChatMessageRequest = {
  content: "quote --flight AA100 --coverage 500",
  interface: "cli"
};

// Terminal interface
const terminalMessage: ChatMessageRequest = {
  content: "/quote AA100 500",
  interface: "terminal"
};
```

## 🔗 Related Packages

- **[@triggerr/api-sdk](../sdk)**: Framework-agnostic API client
- **[@triggerr/core](../core)**: Core platform utilities
- **[@triggerr/shared](../shared)**: Shared constants and validators

## 📋 API Constants

```typescript
import {
  API_BASE_PATHS,
  PAGINATION_DEFAULTS,
  SUPPORTED_CURRENCIES,
  INSURANCE_PRODUCT_TYPES
} from '@triggerr/api-contracts';

console.log(API_BASE_PATHS.V1);          // "/api/v1"
console.log(PAGINATION_DEFAULTS.LIMIT);   // 10
console.log(SUPPORTED_CURRENCIES.USD);    // Currency details
console.log(INSURANCE_PRODUCT_TYPES);     // All product types
```

## 📖 Documentation

- **[API Documentation](https://docs.triggerr.com/api)**: Complete API reference
- **[Developer Guide](https://docs.triggerr.com/developers)**: Integration guides
- **[OpenAPI Spec](./src/schemas/openapi.yaml)**: Machine-readable API specification

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add comprehensive JSDoc comments for new types
3. Include Zod validators for new request/response types
4. Update the OpenAPI specification for new endpoints
5. Add examples to this README for new features

## 📄 License

MIT © triggerr

---

**Built with ❤️ for the triggerr parametric insurance platform**