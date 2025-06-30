# @triggerr/api-sdk

A framework-agnostic TypeScript SDK for the **triggerr** parametric insurance platform API.

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Framework Agnostic](https://img.shields.io/badge/Framework-Agnostic-green.svg)]()
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Overview

The triggerr API SDK provides a robust, type-safe interface for interacting with the triggerr parametric insurance platform. Built with modern TypeScript, it offers comprehensive features for both authenticated and anonymous users.

### Key Features

- **🔒 Full Authentication Support** - JWT tokens, API keys, and anonymous sessions
- **🔄 Advanced Retry Logic** - Exponential backoff with circuit breaker pattern
- **💾 Intelligent Caching** - Built-in request/response caching with TTL
- **🛡️ Comprehensive Error Handling** - Detailed error classification and recovery
- **📱 Framework Agnostic** - Works with any JavaScript/TypeScript environment
- **🎯 Type Safety** - Full TypeScript support with auto-completion
- **🔧 Highly Configurable** - Extensive configuration options for all features

## 📦 Installation

```bash
# Using bun (recommended)
bun add @triggerr/api-sdk

# Using npm
npm install @triggerr/api-sdk

# Using yarn
yarn add @triggerr/api-sdk
```

## 🏁 Quick Start

### Basic Usage

```typescript
import { createHttpClient, type HttpClientConfig } from '@triggerr/api-sdk';

// Configure the SDK
const config: HttpClientConfig = {
  baseURL: 'https://api.triggerr.com/api/v1',
  timeout: 30000, // 30 seconds
};

// Create client instance
const client = createHttpClient(config);

// Make API calls
const response = await client.get('/insurance/products');
if (response.success) {
  console.log('Available products:', response.data);
} else {
  console.error('Error:', response.error);
}
```

### Anonymous User Example

```typescript
import {
  createHttpClient,
  AnonymousSessionManager,
  type AuthHeaderProvider,
  type HttpClientConfig,
} from '@triggerr/api-sdk';

// Create anonymous session manager
const sessionManager = new AnonymousSessionManager();

// Create auth provider for anonymous users
class AnonymousAuthProvider implements AuthHeaderProvider {
  constructor(private manager: AnonymousSessionManager) {}

  async getAuthHeaders() {
    const sessionId = this.manager.getSessionId();
    return sessionId ? { 'x-anonymous-session-id': sessionId } : null;
  }

  async onAuthFailure() {
    this.manager.clearSession();
  }
}

// Configure client with anonymous auth
const config: HttpClientConfig = {
  baseURL: 'https://api.triggerr.com/api/v1',
  authHeaderProvider: new AnonymousAuthProvider(sessionManager),
};

const client = createHttpClient(config);

// Get insurance quote anonymously
const quoteResponse = await client.post('/insurance/quote', {
  product_type: 'flight_delay',
  flight_details: {
    flight_number: 'BA286',
    departure_date: '2024-08-15',
    origin_airport_code: 'LHR',
    destination_airport_code: 'SFO',
  },
  coverage_details: {
    amount: 500,
    currency: 'USD',
  },
});
```

## ⚙️ Configuration

### HttpClientConfig Options

```typescript
interface HttpClientConfig {
  // Required
  baseURL: string;

  // Authentication
  authHeaderProvider?: AuthHeaderProvider;

  // Request settings
  timeout?: number; // Default: 30000ms
  defaultHeaders?: Record<string, string>;
  fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

  // Retry configuration
  retry?: {
    attempts?: number; // Default: 3
    baseDelay?: number; // Default: 500ms
    strategy?: 'fixed' | 'exponential'; // Default: 'exponential'
    statusCodesToRetry?: number[]; // Default: [408, 429, 500, 502, 503, 504]
  } | false; // Set to false to disable retries

  // Caching configuration
  cache?: {
    enabled: boolean;
    manager?: CacheManager;
    defaultTtl?: number; // Default: 60000ms (1 minute)
  };

  // Debug settings
  debug?: {
    enabled: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error'; // Default: 'info'
  };
}
```

### Advanced Configuration Example

```typescript
import { createHttpClient, CacheFactory } from '@triggerr/api-sdk';

const config: HttpClientConfig = {
  baseURL: 'https://api.triggerr.com/api/v1',
  timeout: 45000,

  // Enable retry with custom settings
  retry: {
    attempts: 5,
    baseDelay: 1000,
    strategy: 'exponential',
  },

  // Enable caching with custom TTL
  cache: {
    enabled: true,
    manager: CacheFactory.memory({ defaultTtl: 300000 }), // 5 minutes
  },

  // Enable detailed logging
  debug: {
    enabled: true,
    logLevel: 'debug',
  },

  // Custom headers
  defaultHeaders: {
    'X-Client-Version': '1.0.0',
    'X-Platform': 'web',
  },
};

const client = createHttpClient(config);
```

## 🔐 Authentication

### JWT Authentication

```typescript
class JwtAuthProvider implements AuthHeaderProvider {
  constructor(private getToken: () => string | null) {}

  async getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : null;
  }

  async onAuthFailure() {
    // Handle token expiry - redirect to login, refresh token, etc.
    console.log('Authentication failed - redirecting to login');
    window.location.href = '/login';
  }
}

const authProvider = new JwtAuthProvider(() => localStorage.getItem('authToken'));
```

### API Key Authentication

```typescript
class ApiKeyAuthProvider implements AuthHeaderProvider {
  constructor(private apiKey: string) {}

  async getAuthHeaders() {
    return { 'x-api-key': this.apiKey };
  }

  async onAuthFailure(error: any) {
    console.error('API key authentication failed:', error);
  }
}

const authProvider = new ApiKeyAuthProvider('your-api-key-here');
```

### Anonymous Session Management

```typescript
import { AnonymousSessionManager } from '@triggerr/api-sdk';

// Create session manager with custom configuration
const sessionManager = new AnonymousSessionManager({
  storageKey: 'my-app-anonymous-session',
  expiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  autoCreate: true,
});

// Use session manager
const sessionId = sessionManager.getSessionId();
sessionManager.addToCart('quote-item-123');
sessionManager.setConversationId('conv-456');

// Check session validity
if (sessionManager.isSessionValid()) {
  console.log('Session is active');
}

// Clear session
sessionManager.clearSession();
```

## 🎯 Service Classes

The SDK provides convenient service classes for different API domains:

> **Note on Importing API Types**
> To ensure type safety when working with service methods, you'll need to import Data Transfer Objects (DTOs) from the `@triggerr/api-contracts` package. This package uses a modular, sub-path import strategy for performance and clarity.
>
> ```typescript
> // Import common types from the top level
> import type { ApiResponse } from '@triggerr/api-contracts';
>
> // Import specific DTOs from their domain sub-path
> import type { ChatMessage } from '@triggerr/api-contracts/dtos/chat';
> import type { InsuranceQuoteResponse } from '@triggerr/api-contracts/dtos/insurance';
> import type { UserProfile } from '@triggerr/api-contracts/dtos/wallet';
> ```
>
> This approach ensures your application bundle only includes the code it needs, leading to better performance.

### Chat Service

```typescript
import { ChatService } from '@triggerr/api-sdk';

const chatService = new ChatService(client);

// Send a chat message
const response = await chatService.sendMessage({
  content: 'I need flight delay insurance for BA286',
  conversationId: 'conv-123',
});

// Get conversation history
const conversations = await chatService.getConversations({
  page: 1,
  limit: 20,
});
```

### Insurance Service

```typescript
import { InsuranceService } from '@triggerr/api-sdk';

const insuranceService = new InsuranceService(client);

// Get available products
const products = await insuranceService.getProducts();

// Get insurance quote
const quote = await insuranceService.getQuote({
  product_type: 'flight_delay',
  flight_details: {
    flight_number: 'AA123',
    departure_date: '2024-12-25',
    origin_airport_code: 'JFK',
    destination_airport_code: 'LAX',
  },
  coverage_details: {
    amount: 1000,
    currency: 'USD',
  },
});
```

### Policy Service

```typescript
import { PolicyService } from '@triggerr/api-sdk';

const policyService = new PolicyService(client);

// Purchase a policy
const policy = await policyService.purchasePolicy({
  quote_id: 'quote-123',
  payment_token: 'stripe-token-456',
  policy_holder: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
  },
});

// Track policy status
const policyStatus = await policyService.trackPolicy('tracking-number-789');

// Get user's policies
const userPolicies = await policyService.getUserPolicies({
  page: 1,
  limit: 10,
});
```

### Wallet Service

```typescript
import { WalletService } from '@triggerr/api-sdk';

const walletService = new WalletService(client);

// Get wallet information
const walletInfo = await walletService.getWalletInfo();

// Request faucet funds (testnet)
const faucetResult = await walletService.requestFaucet({
  amount: 1000,
  currency: 'USDC',
});

// Get transaction history
const transactions = await walletService.getTransactions({
  page: 1,
  limit: 20,
});
```

## 🛡️ Error Handling

The SDK provides comprehensive error handling with detailed error classification:

### Error Types

```typescript
import { ApiClientError } from '@triggerr/api-sdk';

try {
  const response = await client.get('/some-endpoint');
} catch (error) {
  if (error instanceof ApiClientError) {
    console.log('Status:', error.status);
    console.log('Error Code:', error.apiError?.code);
    console.log('Message:', error.message);
    
    // Handle specific error types
    switch (error.apiError?.code) {
      case 'VALIDATION_ERROR':
        console.log('Validation details:', error.apiError.details);
        break;
      case 'UNAUTHORIZED':
        // Redirect to login
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // Implement backoff
        break;
      case 'NETWORK_ERROR':
        // Retry or show offline message
        break;
    }
  }
}
```

### Response Object Pattern

Alternatively, you can check the response object:

```typescript
const response = await client.get('/endpoint');

if (response.success) {
  // Handle successful response
  console.log('Data:', response.data);
} else {
  // Handle error response
  console.log('Error:', response.error?.code);
  console.log('Message:', response.error?.message);
}
```

## 🚀 Advanced Features

### Circuit Breaker

The SDK includes a circuit breaker pattern for resilient API calls:

```typescript
const config: HttpClientConfig = {
  baseURL: 'https://api.triggerr.com/api/v1',
  retry: {
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringWindow: 60000,
    },
  },
};
```

### Request/Response Interceptors

```typescript
// Custom fetch implementation with interceptors
const fetchWithInterceptors = async (input: RequestInfo | URL, init?: RequestInit) => {
  // Request interceptor
  console.log('Making request to:', input);
  
  const response = await fetch(input, init);
  
  // Response interceptor
  console.log('Received response:', response.status);
  
  return response;
};

const config: HttpClientConfig = {
  baseURL: 'https://api.triggerr.com/api/v1',
  fetchImpl: fetchWithInterceptors,
};
```

### Cache Management

```typescript
// Invalidate specific cache entries
await client.invalidateCache('GET:/insurance/products');

// Clear entire cache
await client.clearCache();

// Custom cache with specific TTL
const response = await client.get('/endpoint', undefined, {
  cacheTtl: 600000, // 10 minutes
});

// Skip cache for a specific request
const freshResponse = await client.get('/endpoint', undefined, {
  skipCache: true,
});
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run with coverage
bun test --coverage
```

### Mock Usage

```typescript
import { createHttpClient } from '@triggerr/api-sdk';

// Create client with mock fetch for testing
const mockFetch = jest.fn();
const client = createHttpClient({
  baseURL: 'https://api.test.com',
  fetchImpl: mockFetch,
});

// Configure mock responses
mockFetch.mockResolvedValue(new Response(JSON.stringify({
  success: true,
  data: { message: 'Test response' },
})));
```

## 📚 Examples

The SDK includes comprehensive examples in the `/examples` directory:

- **`basic-usage.ts`** - Basic SDK setup and usage
- **`error-handling.ts`** - Comprehensive error handling patterns
- **`anonymous-user.ts`** - Anonymous user flows with session management
- **`authenticated-user.ts`** - JWT authentication and user-specific flows

### Running Examples

```bash
# Run basic usage example
bun run examples/basic-usage.ts

# Run error handling example
bun run examples/error-handling.ts

# Run anonymous user example
bun run examples/anonymous-user.ts

# Run authenticated user example
bun run examples/authenticated-user.ts
```

### Import Strategy in Examples

**Important Note**: The examples use relative imports for `@triggerr/api-contracts` types:

```typescript
// Examples use relative imports (development context)
import type {
  ApiResponse,
  InsuranceProduct,
} from '../../../api-contracts/dist/index';
```

**Why Relative Imports in Examples?**
- Examples run directly via `bun run` from the SDK directory
- Workspace resolution doesn't work in this direct execution context
- Relative imports ensure examples work in development environment

**Production Usage** (in your application):
```typescript
// Your app should use package imports
import type {
  ApiResponse,
  InsuranceProduct,
} from '@triggerr/api-contracts';
```

This approach ensures examples work during development while maintaining the correct import pattern for production applications.

## 🔧 Development

### Building the SDK

```bash
# Clean previous builds
bun run clean

# Build TypeScript to JavaScript
bun run build

# Type checking only
bun run typecheck

# Linting
bun run lint
```

### Project Structure

```
src/
├── auth/                     # Authentication providers and session management
│   ├── anonymous-session-manager.ts
│   ├── types.ts
│   └── index.ts
├── client/                   # Core HTTP client implementation
│   ├── auth-provider.ts      # Better-Auth integration
│   ├── error-handler.ts      # Error classification and handling
│   ├── http-client.ts        # High-level HTTP client with features
│   ├── index.ts              # Basic API client
│   └── retry-logic.ts        # Retry policies and circuit breaker
├── services/                 # Domain-specific service classes
│   ├── admin.ts
│   ├── chat.ts
│   ├── insurance.ts
│   ├── policy.ts
│   ├── user.ts
│   ├── wallet.ts
│   ├── types.ts
│   └── index.ts
├── types/                    # Error types and SDK-specific types
│   └── errors.ts
├── utils/                    # Utility functions
│   ├── cache.ts              # Caching implementations
│   ├── logger.ts             # Logging utilities
│   ├── params.ts             # Query parameter utilities
│   ├── serialization.ts      # JSON and FormData utilities
│   ├── validation.ts         # Client-side validation
│   └── index.ts
└── index.ts                  # Main package exports
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Install dependencies: `bun install`
3. Run tests: `bun test`
4. Build: `bun run build`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](https://docs.triggerr.com/sdk)
- [API Reference](https://docs.triggerr.com/api)
- [GitHub Issues](https://github.com/e3o8o/triggerr/issues)
- [Changelog](CHANGELOG.md)

## 📞 Support

For support, please:

1. Check the [documentation](https://docs.triggerr.com/sdk)
2. Search [existing issues](https://github.com/e3o8o/triggerr/issues)
3. Create a [new issue](https://github.com/e3o8o/triggerr/issues/new) if needed

---

**Built with ❤️ by the triggerr team**