# PRD-API-001: Public API Specification

**Status**: Ready for Implementation  
**Priority**: High - Enables External Integrations  
**Dependencies**: All ENGINE PRDs, PRD-CORE-001 (Database - Drizzle), PRD-CORE-002 (Auth - Better-auth)
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Public API provides a comprehensive, RESTful interface for external clients to interact with the triggerr platform. It enables developers to integrate parametric insurance functionality into their applications, supporting both direct user interactions and provider integrations.

### 1.2 API Design Principles
- **RESTful Architecture**: Resource-based URLs with standard HTTP methods
- **API-First Design**: APIs designed before implementation
- **Versioning**: Semantic versioning with backward compatibility
- **Consistency**: Standardized response formats and error handling
- **Security**: Better-auth session management (OAuth 2.0 via Google) + API key authentication
- **Rate Limiting**: Fair usage policies with tiered limits
- **Developer Experience**: Comprehensive documentation and SDKs

### 1.3 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   API Services   │    │  Core Engines   │
│                 │────▶│                  │────▶│                 │
│ Rate Limiting   │    │ Request Router   │    │ Quote Engine    │
│ Authentication  │    │ Response Format  │    │ Policy Engine   │
│ Validation      │    │ Error Handling   │    │ Payout Engine   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. API Structure

### 2.1 Base URL and Versioning
```
Production:  https://api.triggerr.com/v1
Staging:     https://api-staging.triggerr.com/v1
Development: https://api-dev.triggerr.com/v1
```

### 2.2 Version Strategy
- **Current Version**: v1
- **Deprecation Policy**: 12 months notice for breaking changes
- **Version Header**: `Accept: application/vnd.triggerr.v1+json`
- **Default Version**: Latest stable version if no version specified

## 3. Authentication & Authorization

### 3.1 Authentication Methods

#### Better-auth Session Authentication (Primary)
Better-auth manages user sessions via secure cookies after OAuth flows:

```http
GET /api/v1/policies
Cookie: better-auth.session_token=SESSION_TOKEN_HERE
```

**Standard Better-auth Endpoints:**
- `GET /api/auth/session` - Get current session
- `GET /api/auth/signin/google` - Initiate Google OAuth
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/callback/google` - OAuth callback

#### API Key Authentication (External Services)
```http
GET /api/v1/quotes
Authorization: Bearer sk_live_1234567890abcdef
```

### 3.2 Better-auth Session Structure
```typescript
interface BetterAuthSession {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    createdAt: Date;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}
```

### 3.3 API Key Types
```typescript
interface APIKey {
  type: 'PUBLIC' | 'SECRET';
  permissions: Permission[];
  rateLimit: RateLimit;
  environment: 'LIVE' | 'TEST';
}

type Permission = 
  | 'quotes:read'
  | 'quotes:write'
  | 'policies:read' 
  | 'policies:write'
  | 'payments:read'
  | 'webhooks:read'
  | 'webhooks:write';
```

### 3.4 Better-auth Middleware Implementation

#### Next.js Middleware (`apps/web/middleware.ts`)
```typescript
import { auth } from "@triggerr/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  
  // Protected API routes
  const protectedApiRoutes = ['/api/quotes', '/api/policies', '/api/users'];
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route));
  
  // Protected pages
  const protectedPages = ['/dashboard', '/policies'];
  const isProtectedPage = protectedPages.some(page => pathname.startsWith(page));
  
  // Check if user is authenticated
  const isAuthenticated = !!req.auth?.user;
  
  if ((isProtectedApi || isProtectedPage) && !isAuthenticated) {
    if (isProtectedApi) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    } else {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/api/((?!auth).*)(.+)', '/dashboard/:path*', '/policies/:path*']
};
```

#### API Route Protection
```typescript
// Example: Protected API route
import { auth } from "@triggerr/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Get session from Better-auth
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session?.user) {
    return Response.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }
  
  // User is authenticated, proceed with request
  const userId = session.user.id;
  // ... rest of the API logic
}
```

#### Session Management
```typescript
// Get current session in API routes
const session = await auth.api.getSession({ headers: request.headers });

// Session structure
interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    createdAt: Date;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
}
```

## 4. Core API Endpoints

### 4.1 Authentication Endpoints

#### GET /api/auth/session
Get current user session (Better-auth standard endpoint).

**Response (Authenticated):**
```json
{
  "user": {
    "id": "user_1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://lh3.googleusercontent.com/...",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "session": {
    "id": "session_1234567890",
    "expiresAt": "2025-02-01T00:00:00Z",
    "token": "session_token_here"
  }
}
```

**Response (Unauthenticated):**
```json
{
  "user": null,
  "session": null
}
```

#### GET /api/auth/signin/google
Initiate Google OAuth sign-in flow (redirects to Google).

#### POST /api/auth/signout
Sign out current user (clears session).

**Response:**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

### 4.2 Quote Endpoints

#### POST /quotes
Generate insurance quote.

**Request:**
```json
{
  "type": "flight_delay",
  "flightNumber": "BT318",
  "departureDate": "2025-06-15T10:30:00Z",
  "departureAirport": "RIX",
  "arrivalAirport": "LHR",
  "coverageAmount": 500,
  "coverageType": "ECONOMY",
  "delayThreshold": 60
}
```

**Response:**
```json
{
  "id": "quote_1234567890",
  "premium": {
    "amount": 42.50,
    "currency": "USD",
    "breakdown": {
      "baseAmount": 17.50,
      "riskMultiplier": 2.43,
      "factors": {
        "historical": 1.2,
        "weather": 1.1,
        "route": 1.3,
        "airline": 1.4
      }
    }
  },
  "coverage": {
    "amount": 500,
    "currency": "USD",
    "type": "ECONOMY"
  },
  "validUntil": "2025-06-14T10:30:00Z",
  "confidence": 0.87,
  "terms": {
    "delayThreshold": 60,
    "coverage": ["DEPARTURE_DELAY", "ARRIVAL_DELAY"],
    "exclusions": ["WEATHER_ACTS_OF_GOD"]
  }
}
```

#### GET /quotes/{quoteId}
Retrieve quote details.

#### GET /quotes
List current user's quotes with filtering. User identification from Better-auth session.

**Query Parameters:**
```typescript
interface QuoteQuery {
  status?: 'ACTIVE' | 'EXPIRED' | 'USED';
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
}
```

**Authentication:** Required - Returns quotes for the authenticated user only

### 4.3 Policy Endpoints

#### POST /policies
Create insurance policy from quote. User identification comes from Better-auth session.

**Request:**
```json
{
  "quoteId": "quote_1234567890",
  "acceptTerms": true,
  "paymentMethod": "wallet"
}
```

**Authentication:** Required - User ID obtained from Better-auth session

**Response:**
```json
{
  "id": "policy_1234567890",
  "policyNumber": "INS-USR-001-BT318-20250615-ABC123",
  "status": "ACTIVE",
  "premium": 42.50,
  "coverage": {
    "amount": 500.00,
    "type": "ECONOMY"
  },
  "flight": {
    "flightNumber": "BT318",
    "departureDate": "2025-06-15T10:30:00Z",
    "route": "RIX-LHR"
  },
  "escrow": {
    "id": "escrow_1234567890",
    "status": "ACTIVE",
    "txHash": "0x..."
  },
  "verificationCode": "ABC123XYZ",
  "createdAt": "2025-06-01T12:00:00Z"
}
```

#### GET /policies/{policyId}
Retrieve policy details.

#### GET /policies
List current user's policies. User identification from Better-auth session.

**Authentication:** Required - Returns policies for the authenticated user only

#### GET /policies/{policyId}/status
Get real-time policy status and flight updates.

**Response:**
```json
{
  "policy": {
    "id": "policy_1234567890",
    "status": "ACTIVE"
  },
  "flight": {
    "status": "DELAYED",
    "delayMinutes": 75,
    "departureDelay": 45,
    "arrivalDelay": 75,
    "lastUpdated": "2025-06-15T11:15:00Z"
  },
  "payout": {
    "eligible": true,
    "estimatedAmount": 500.00,
    "reason": "ARRIVAL_DELAY_THRESHOLD_EXCEEDED"
  }
}
```

### 4.4 Payment Endpoints

#### GET /payments/methods
Get available payment methods.

#### POST /payments/process
Process payment for policy.

#### GET /payments/{paymentId}
Get payment details.

### 4.5 Flight Data Endpoints

#### GET /flights/search
Search flights for quote generation.

**Query Parameters:**
```typescript
interface FlightSearch {
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  date?: string;
  airline?: string;
}
```

#### GET /flights/{flightNumber}/status
Get real-time flight status.

### 4.6 User Management Endpoints

#### GET /users/profile
Get current user profile.

#### PUT /users/profile
Update user profile.

#### GET /users/wallet
Get wallet information.

#### POST /users/wallet/create
Create new wallet for user.

### 4.7 Webhook Endpoints

#### POST /webhooks
Register webhook endpoint.

**Request:**
```json
{
  "url": "https://yourdomain.com/webhooks/triggerr",
  "events": ["policy.created", "policy.paid_out", "payment.completed"],
  "description": "Production webhook for policy events"
}
```

#### GET /webhooks
List registered webhooks.

#### DELETE /webhooks/{webhookId}
Delete webhook.

## 5. Response Formats

### 5.1 Standard Response Structure
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

interface APIError {
  code: string;
  message: string;
  details?: any;
  requestId: string;
}

interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  rateLimit: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### 5.2 Success Response Example
```json
{
  "success": true,
  "data": {
    "id": "quote_1234567890",
    "premium": 42.50
  },
  "metadata": {
    "requestId": "req_abcdef123456",
    "timestamp": "2025-06-01T12:00:00Z",
    "rateLimit": {
      "limit": 1000,
      "remaining": 999,
      "resetAt": "2025-06-01T13:00:00Z"
    }
  }
}
```

### 5.3 Error Response Example
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FLIGHT_NUMBER",
    "message": "The provided flight number is not valid",
    "details": {
      "field": "flightNumber",
      "value": "INVALID123"
    },
    "requestId": "req_abcdef123456"
  },
  "metadata": {
    "requestId": "req_abcdef123456",
    "timestamp": "2025-06-01T12:00:00Z"
  }
}
```

## 6. Error Handling

### 6.1 HTTP Status Codes
```typescript
const HTTP_STATUS = {
  // Success
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  
  // Client Errors
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  
  // Server Errors
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
};
```

### 6.2 Error Codes
```typescript
export const API_ERROR_CODES = {
  // Authentication
  INVALID_API_KEY: 'INVALID_API_KEY',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_FORMAT: 'INVALID_FIELD_FORMAT',
  INVALID_FLIGHT_NUMBER: 'INVALID_FLIGHT_NUMBER',
  
  // Business Logic
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',
  POLICY_NOT_FOUND: 'POLICY_NOT_FOUND',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  FLIGHT_ALREADY_DEPARTED: 'FLIGHT_ALREADY_DEPARTED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // System
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE'
} as const;
```

## 7. Rate Limiting

### 7.1 Rate Limit Tiers
```typescript
interface RateLimitTier {
  name: string;
  limits: {
    requests: number;
    window: string; // 'minute' | 'hour' | 'day'
  };
  quotas: {
    monthly: number;
  };
}

const RATE_LIMIT_TIERS = {
  FREE: {
    requests: 100,
    window: 'hour',
    monthly: 1000
  },
  BASIC: {
    requests: 1000,
    window: 'hour',
    monthly: 10000
  },
  PREMIUM: {
    requests: 5000,
    window: 'hour',
    monthly: 100000
  },
  ENTERPRISE: {
    requests: 10000,
    window: 'hour',
    monthly: 1000000
  }
};
```

### 7.2 Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: hour
```

## 8. Webhooks

### 8.1 Webhook Events
```typescript
type WebhookEvent = 
  | 'quote.created'
  | 'quote.expired'
  | 'policy.created'
  | 'policy.activated'
  | 'policy.paid_out'
  | 'policy.expired'
  | 'payment.processing'
  | 'payment.completed'
  | 'payment.failed'
  | 'flight.status_changed'
  | 'payout.triggered'
  | 'payout.completed';
```

### 8.2 Webhook Payload Example
```json
{
  "event": "policy.paid_out",
  "data": {
    "policy": {
      "id": "policy_1234567890",
      "policyNumber": "INS-USR-001-BT318-20250615-ABC123",
      "userId": "user_1234567890",
      "status": "PAID_OUT"
    },
    "payout": {
      "id": "payout_1234567890",
      "amount": 500.00,
      "reason": "FLIGHT_DELAYED",
      "delayMinutes": 75,
      "processedAt": "2025-06-15T14:30:00Z",
      "txHash": "0x..."
    }
  },
  "timestamp": "2025-06-15T14:30:05Z",
  "apiVersion": "v1"
}
```

## 9. SDKs and Integration

### 9.1 Official SDKs
- **JavaScript/TypeScript**: `@triggerr/sdk-js`
- **Python**: `triggerr-python`
- **Go**: `triggerr-go`
- **PHP**: `triggerr-php`

### 9.2 SDK Example (JavaScript)
```typescript
import { Triggerr } from '@triggerr/sdk-js';

const client = new Triggerr({
  apiKey: 'sk_live_1234567890abcdef',
  environment: 'live'
});

// Generate quote
const quote = await client.quotes.create({
  type: 'flight_delay',
  flightNumber: 'BT318',
  departureDate: '2025-06-15T10:30:00Z',
  coverageAmount: 500
});

// Create policy
const policy = await client.policies.create({
  quoteId: quote.id,
  userWalletAddress: '0x742d35Cc6634C0532925a3b8D400'
});
```

## 10. Testing

### 10.1 Test Environment
```
Base URL: https://api-test.triggerr.com/v1
Test API Key: sk_test_1234567890abcdef
```

### 10.2 Test Data
```typescript
const TEST_DATA = {
  flights: {
    valid: 'BT318',
    invalid: 'INVALID123',
    delayed: 'DL123',
    cancelled: 'CX456'
  },
  wallets: {
    user: '0x742d35Cc6634C0532925a3b8D400',
    provider: '0x8ba1f109551bD432803012645Hac136c'
  }
};
```

## 11. Monitoring & Analytics

### 11.1 API Metrics
```typescript
export const apiMetrics = {
  requestsTotal: new Counter({
    name: 'api_requests_total',
    help: 'Total API requests',
    labelNames: ['method', 'endpoint', 'status']
  }),
  
  requestDuration: new Histogram({
    name: 'api_request_duration_seconds',
    help: 'API request duration',
    labelNames: ['method', 'endpoint']
  }),
  
  rateLimitHits: new Counter({
    name: 'api_rate_limit_hits_total',
    help: 'Rate limit hits',
    labelNames: ['tier', 'endpoint']
  })
};
```

## 12. Implementation Timeline

### Week 1: Core API Infrastructure
- API gateway setup
- Authentication middleware
- Rate limiting
- Basic CRUD endpoints

### Week 2: Business Logic Integration
- Quote engine integration
- Policy engine integration
- Payment processing
- Error handling

### Week 3: Advanced Features
- Webhook system
- SDK development
- Documentation
- Testing and optimization

## 13. Success Metrics

### Performance
- API response time: < 500ms (95th percentile)
- API availability: > 99.9%
- Error rate: < 1%

### Developer Experience
- API adoption rate: > 50 integrations in 6 months
- Documentation satisfaction: > 90%
- SDK usage: > 70% of integrations

---

**Dependencies**: All ENGINE PRDs, PRD-CORE-001, PRD-CORE-002  
**Integration**: Unified interface for all platform functionality  
**Status**: Implementation Ready
