# PRD-CORE-002: Authentication & Authorization System

**Status**: Ready for Implementation  
**Priority**: Critical - Foundation Component  
**Dependencies**: PRD-CORE-001 (Database Schema)  
**Estimated Timeline**: 1-2 weeks  

## 1. Overview

### 1.1 Purpose
The Authentication & Authorization System provides secure user access management for the triggerr platform. It implements Google OAuth as the primary authentication method for MVP using better-auth, with an extensible architecture ready for future auth methods including wallet-based authentication.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Auth System    │    │   Database      │
│                 │────▶│                  │────▶│                 │
│ Sign In Button  │    │ Better Auth      │    │ User Records    │
│ Session Checks  │    │ Google OAuth     │    │ Session Store   │
│ Protected Routes│    │ Session Tokens   │    │ API Keys        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 1.3 Design Principles
- **Simple MVP**: Google OAuth only for initial launch
- **Extensible**: Ready for wallet auth and other providers
- **Secure**: Industry-standard session tokens and built-in security
- **Auditable**: Complete authentication event logging
- **Role-based**: Support for users, admins, and future providers

## 2. Core Components

### 2.1 Better Auth Configuration

```typescript
// packages/core/auth/index.ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: (profile) => {
        return {
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token, user }) {
      // Add user role and ID to session
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = await getUserRole(user.id);
        session.user.isActive = await checkUserStatus(user.id);
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Add custom claims to JWT
      if (user) {
        token.userId = user.id;
        token.role = await getUserRole(user.id);
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      // Custom sign-in logic
      if (account?.provider === 'google') {
        return await handleGoogleSignIn(user, profile);
      }
      return true;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 24 hours
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      await auditLog('USER_SIGN_IN', {
        userId: user.id,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date()
      });
    },
    async signOut({ token }) {
      await auditLog('USER_SIGN_OUT', {
        userId: token?.userId,
        timestamp: new Date()
      });
    }
  }
};
```

### 2.2 Authentication Service

```typescript
// packages/core/auth/service.ts
export class AuthenticationService {
  private prisma: PrismaClient;
  private auditLogger: AuditLogger;

  constructor() {
    this.prisma = prisma;
    this.auditLogger = new AuditLogger();
  }

  async handleGoogleSignIn(
    user: any, 
    profile: any
  ): Promise<boolean> {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: user.email }
      });

      if (!existingUser) {
        // Create new user from Google profile
        await this.createUserFromGoogle(user, profile);
        
        // Log new user creation
        await this.auditLogger.log('NEW_USER_CREATED', {
          email: user.email,
          provider: 'google',
          source: 'oauth'
        });
      } else {
        // Update last login
        await this.updateLastLogin(existingUser.id);
      }

      return true;
    } catch (error) {
      await this.auditLogger.log('SIGN_IN_ERROR', {
        email: user.email,
        error: error.message
      });
      return false;
    }
  }

  private async createUserFromGoogle(user: any, profile: any): Promise<User> {
    return await this.prisma.user.create({
      data: {
        email: user.email,
        name: user.name || profile?.name,
        image: user.image || profile?.picture,
        emailVerified: new Date(), // Google emails are pre-verified
        isActive: true,
        createdAt: new Date(),
        // Generate wallet on first sign-in (for future crypto integration)
        walletAddress: null, // Will be created when needed
        walletPrivateKey: null
      }
    });
  }

  async getUserRole(userId: string): Promise<UserRole> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    // Check if admin email
    if (user?.email && this.isAdminEmail(user.email)) {
      return 'ADMIN';
    }

    // Check if provider
    const provider = await this.prisma.provider.findFirst({
      where: { contactEmail: user?.email }
    });

    if (provider) {
      return 'PROVIDER';
    }

    return 'USER';
  }

  private isAdminEmail(email: string): boolean {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    return adminEmails.includes(email);
  }
}
```

### 2.3 Authorization Middleware

```typescript
// packages/core/auth/middleware.ts
export class AuthorizationMiddleware {
  static requireAuth() {
    return async (req: NextRequest, res: NextResponse) => {
      const session = await getServerSession(authConfig);
      
      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Add user info to request context
      req.user = session.user;
      return NextResponse.next();
    };
  }

  static requireRole(allowedRoles: UserRole[]) {
    return async (req: NextRequest, res: NextResponse) => {
      const session = await getServerSession(authConfig);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const userRole = await getUserRole(session.user.id);
      
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      req.user = { ...session.user, role: userRole };
      return NextResponse.next();
    };
  }

  static requireActiveUser() {
    return async (req: NextRequest, res: NextResponse) => {
      const session = await getServerSession(authConfig);
      
      if (!session?.user?.isActive) {
        return NextResponse.json(
          { error: 'Account suspended' },
          { status: 403 }
        );
      }

      return NextResponse.next();
    };
  }
}
```

### 2.4 API Key Management (Future Extension)

```typescript
// packages/core/auth/api-keys.ts
export class APIKeyManager {
  private prisma: PrismaClient;

  async createAPIKey(
    userId: string, 
    name: string, 
    permissions: string[]
  ): Promise<APIKey> {
    const key = this.generateSecureKey();
    
    return await this.prisma.aPIKey.create({
      data: {
        userId,
        key: await this.hashKey(key),
        name,
        type: 'SECRET',
        permissions,
        isActive: true,
        rateLimit: 1000, // Default rate limit
        createdAt: new Date()
      }
    });
  }

  async validateAPIKey(key: string): Promise<APIKey | null> {
    const hashedKey = await this.hashKey(key);
    
    const apiKey = await this.prisma.aPIKey.findUnique({
      where: { key: hashedKey },
      include: { user: true }
    });

    if (!apiKey || !apiKey.isActive) {
      return null;
    }

    // Update last used timestamp
    await this.prisma.aPIKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    });

    return apiKey;
  }

  private generateSecureKey(): string {
    return `sk_live_${crypto.randomBytes(32).toString('hex')}`;
  }

  private async hashKey(key: string): Promise<string> {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
```

## 3. Data Types

```typescript
// Session and User Types
interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role: UserRole;
    isActive: boolean;
  };
}

interface ExtendedUser extends User {
  role: UserRole;
  isActive: boolean;
}

type UserRole = 'USER' | 'ADMIN' | 'PROVIDER';

// API Key Types (Future)
interface APIKey {
  id: string;
  userId: string;
  key: string; // Hashed
  name: string;
  type: 'PUBLIC' | 'SECRET' | 'WEBHOOK';
  permissions: string[];
  isActive: boolean;
  rateLimit: number;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

// Audit Log Types
interface AuthAuditEvent {
  type: 'USER_SIGN_IN' | 'USER_SIGN_OUT' | 'NEW_USER_CREATED' | 'SIGN_IN_ERROR';
  userId?: string;
  email?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}
```

## 4. API Integration

### 4.1 Protected Route Example
```typescript
// apps/web/src/app/api/policies/route.ts
import { AuthorizationMiddleware } from '@triggerr/auth';

export async function GET(request: NextRequest) {
  // Require authentication
  const authCheck = await AuthorizationMiddleware.requireAuth()(request);
  if (authCheck.status !== 200) return authCheck;

  // Require active user
  const activeCheck = await AuthorizationMiddleware.requireActiveUser()(request);
  if (activeCheck.status !== 200) return activeCheck;

  // Get user policies
  const policies = await getPoliciesForUser(request.user.id);
  
  return NextResponse.json({ success: true, data: policies });
}
```

### 4.2 Admin-Only Route Example
```typescript
// apps/web/src/app/api/admin/providers/route.ts
import { AuthorizationMiddleware } from '@triggerr/auth';

export async function GET(request: NextRequest) {
  // Require admin role
  const authCheck = await AuthorizationMiddleware.requireRole(['ADMIN'])(request);
  if (authCheck.status !== 200) return authCheck;

  // Admin-only logic
  const providers = await getAllProviders();
  
  return NextResponse.json({ success: true, data: providers });
}
```

## 5. Frontend Integration

### 5.1 Sign In Component
```typescript
// packages/ui/auth/SignInButton.tsx
import { signIn, signOut, useSession } from 'next-auth/react';

export function SignInButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span>Welcome, {session.user?.name}</span>
        <button
          onClick={() => signOut()}
          className="btn btn-outline"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="btn btn-primary"
    >
      <GoogleIcon className="w-5 h-5 mr-2" />
      Sign in with Google
    </button>
  );
}
```

### 5.2 Protected Page Component
```typescript
// packages/ui/auth/ProtectedPage.tsx
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedPage({ children, requiredRole }: ProtectedPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return (
      <div className="text-center py-8">
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
```

## 6. Environment Configuration

```bash
# Required Environment Variables
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Admin Configuration
ADMIN_EMAILS="admin@triggerr.com,founder@triggerr.com"

# Database (for NextAuth adapter)
DATABASE_URL="postgresql://..."
```

## 7. Error Handling

```typescript
export class AuthenticationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

// Error page handling
export function AuthErrorPage({ error }: { error: string }) {
  const errorMessages = {
    Configuration: 'Authentication service is temporarily unavailable.',
    AccessDenied: 'You don\'t have permission to access this application.',
    Verification: 'Please verify your email address.',
    Default: 'An authentication error occurred. Please try again.'
  };

  return (
    <div className="text-center py-8">
      <h2>Authentication Error</h2>
      <p>{errorMessages[error] || errorMessages.Default}</p>
      <button onClick={() => signIn('google')}>
        Try Again
      </button>
    </div>
  );
}
```

## 8. Security Considerations

### 8.1 Session Security
- **JWT Tokens**: Secure token storage with HttpOnly cookies
- **Session Rotation**: Regular token refresh and rotation
- **CSRF Protection**: Built-in NextAuth.js CSRF protection
- **Secure Cookies**: Production cookies with Secure and SameSite flags

### 8.2 OAuth Security
- **PKCE**: Proof Key for Code Exchange for OAuth flows
- **State Validation**: Anti-CSRF state parameter validation
- **Nonce Validation**: OpenID Connect nonce validation
- **Scope Limitation**: Minimal required OAuth scopes

### 8.3 Rate Limiting
```typescript
// Rate limiting for auth endpoints
export const authRateLimit = {
  signIn: { attempts: 5, window: '15m' },
  signOut: { attempts: 10, window: '1m' },
  refresh: { attempts: 10, window: '1h' }
};
```

## 9. Future Extensions

### 9.1 Wallet Authentication (Phase 2)
```typescript
// Future: Wallet-based authentication
providers: [
  Google({...}),
  Credentials({
    id: 'wallet',
    name: 'Wallet',
    credentials: {
      address: { label: 'Wallet Address', type: 'text' },
      signature: { label: 'Signature', type: 'text' }
    },
    async authorize(credentials) {
      return await verifyWalletSignature(credentials);
    }
  })
]
```

### 9.2 Multi-Factor Authentication
- **TOTP**: Time-based one-time passwords
- **Email Codes**: Email-based verification codes
- **Hardware Keys**: WebAuthn support for security keys

## 10. Implementation Timeline

### Week 1: Core Authentication
- NextAuth.js setup with Google OAuth
- Basic user model integration
- Session management
- Sign in/out flows

### Week 2: Authorization & Security
- Role-based access control
- API route protection middleware
- Audit logging system
- Error handling and security hardening

## 11. Success Metrics

### Functionality
- ✅ Users can sign in with Google OAuth
- ✅ Sessions persist across browser sessions
- ✅ Role-based access control works
- ✅ API routes properly protected

### Security
- ✅ No authentication bypass vulnerabilities
- ✅ Proper session token security
- ✅ Complete audit trail for auth events
- ✅ Rate limiting prevents abuse

### Performance
- **Sign-in time**: <3 seconds end-to-end
- **Session check**: <100ms
- **Token refresh**: <500ms
- **API auth overhead**: <50ms

---

**Dependencies**: PRD-CORE-001 (Database Schema)  
**Integration**: Foundation for all protected API endpoints and user management  
**Status**: Implementation Ready