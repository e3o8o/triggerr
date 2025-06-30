// ============================================================================
// AUTHENTICATION & AUTHORIZATION TYPES
// ============================================================================

// Core authentication and authorization types for the triggerr platform

// ============================================================================
// USER AUTHENTICATION TYPES
// ============================================================================

// User account information
export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  image?: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Insurance platform specific fields
  walletAddress?: string;
  walletPrivateKey?: string; // Encrypted, never exposed to client

  // User preferences
  preferences?: UserPreferences;

  // Role and permissions
  roles?: UserRole[];
  permissions?: Permission[];
}

// User preferences
export interface UserPreferences {
  language?: string; // ISO 639-1 code
  timezone?: string; // IANA timezone
  currency?: "USD" | "EUR" | "GBP" | "CAD";
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy?: {
    profileVisibility: "PUBLIC" | "PRIVATE";
    dataSharing: boolean;
    analytics: boolean;
  };
}

// User session information
export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;

  // Session metadata
  device?: {
    type: "DESKTOP" | "MOBILE" | "TABLET";
    os?: string;
    browser?: string;
  };
  location?: {
    country?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

// ============================================================================
// OAUTH & SOCIAL AUTHENTICATION
// ============================================================================

// OAuth account linking
export interface Account {
  id: string;
  userId: string;
  accountId: string; // Provider's user ID
  providerId: string; // 'google', 'github', etc.
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  scope?: string;
  createdAt: string;
  updatedAt: string;
}

// OAuth provider configuration
export interface OAuthProvider {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string; // Never exposed to client
  enabled: boolean;
  scopes: string[];
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
  iconUrl?: string;
}

// OAuth user profile from provider
export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  username?: string;
  picture?: string;
  verified?: boolean;
  locale?: string;

  // Provider-specific fields
  [key: string]: any;
}

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================

// User roles in the system
export interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be deleted
  createdAt: string;
  updatedAt: string;
}

// System permissions
export interface Permission {
  id: string;
  resource: string; // e.g., 'policy', 'user', 'provider'
  action: string; // e.g., 'read', 'write', 'delete', 'admin'
  scope?: string; // e.g., 'own', 'team', 'all'
  conditions?: PermissionCondition[];
}

// Permission conditions for dynamic authorization
export interface PermissionCondition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "greater_than"
    | "less_than";
  value: any;
}

// Built-in system roles
export type SystemRole =
  | "SUPER_ADMIN" // Full system access
  | "ADMIN" // Administrative access
  | "PROVIDER_ADMIN" // Provider management
  | "CUSTOMER_SUPPORT" // Customer service
  | "USER" // Standard user
  | "GUEST"; // Anonymous/limited access

// ============================================================================
// API KEY AUTHENTICATION
// ============================================================================

// API key for programmatic access
export interface ApiKey {
  id: string;
  userId?: string;
  providerId?: string;
  key: string; // Hashed, never store plain text
  name: string;
  type: "USER" | "PROVIDER" | "SYSTEM";
  permissions: string[];
  isActive: boolean;

  // Usage tracking
  lastUsedAt?: string;
  usageCount: number;

  // Rate limiting
  rateLimit?: {
    requests: number;
    windowMs: number;
  };

  // Expiration
  expiresAt?: string;

  createdAt: string;
  updatedAt: string;
}

// API key usage statistics
export interface ApiKeyUsage {
  apiKeyId: string;
  date: string; // YYYY-MM-DD
  requests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  endpoints: {
    path: string;
    method: string;
    count: number;
  }[];
}

// ============================================================================
// JWT & TOKEN TYPES
// ============================================================================

// JWT token payload
export interface JwtPayload {
  sub: string; // Subject (user ID)
  iat: number; // Issued at
  exp: number; // Expires at
  iss: string; // Issuer
  aud: string; // Audience

  // Custom claims
  email?: string;
  roles?: string[];
  permissions?: string[];
  provider?: string;
  sessionId?: string;

  // Insurance platform specific
  walletAddress?: string;
  providerId?: string;
}

// Token pair for authentication
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Seconds until access token expires
  tokenType: "Bearer";
}

// Token verification result
export interface TokenVerification {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
  expired?: boolean;
}

// ============================================================================
// AUTHENTICATION FLOWS
// ============================================================================

// Login request
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    type: string;
    name: string;
    fingerprint: string;
  };
}

// Login response
export interface LoginResponse {
  success: boolean;
  user?: User;
  tokens?: TokenPair;
  session?: Session;
  requiresTwoFactor?: boolean;
  twoFactorMethods?: TwoFactorMethod[];
  error?: string;
}

// Registration request
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  username?: string;
  agreeToTerms: boolean;
  marketingConsent?: boolean;
}

// Registration response
export interface RegisterResponse {
  success: boolean;
  user?: User;
  requiresEmailVerification: boolean;
  tokens?: TokenPair;
  error?: string;
}

// Password reset request
export interface PasswordResetRequest {
  email: string;
  captchaToken?: string;
}

// Password reset confirmation
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

// ============================================================================
// TWO-FACTOR AUTHENTICATION
// ============================================================================

// Two-factor authentication method
export interface TwoFactorMethod {
  id: string;
  userId: string;
  type: "TOTP" | "SMS" | "EMAIL" | "BACKUP_CODES";
  enabled: boolean;
  verified: boolean;

  // Method-specific data
  secret?: string; // For TOTP, encrypted
  phoneNumber?: string; // For SMS
  backupCodes?: string[]; // For backup codes, hashed

  createdAt: string;
  lastUsedAt?: string;
}

// Two-factor verification request
export interface TwoFactorVerifyRequest {
  sessionId: string;
  code: string;
  method: "TOTP" | "SMS" | "EMAIL" | "BACKUP_CODE";
}

// Two-factor setup request
export interface TwoFactorSetupRequest {
  type: "TOTP" | "SMS";
  phoneNumber?: string; // Required for SMS
}

// Two-factor setup response
export interface TwoFactorSetupResponse {
  secret?: string; // For TOTP
  qrCodeUrl?: string; // For TOTP
  backupCodes?: string[]; // Always provided
}

// ============================================================================
// AUTHORIZATION CONTEXT
// ============================================================================

// Authorization context passed to services
export interface AuthContext {
  user?: User;
  session?: Session;
  apiKey?: ApiKey;
  anonymousSessionId?: string;

  // Computed authorization info
  isAuthenticated: boolean;
  isAnonymous: boolean;
  roles: string[];
  permissions: string[];

  // Request context
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

// Permission check result
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: string[];
  missingPermissions?: string[];
}

// ============================================================================
// SECURITY & AUDIT
// ============================================================================

// Security event for audit logging
export interface SecurityEvent {
  id: string;
  type:
    | "LOGIN"
    | "LOGOUT"
    | "FAILED_LOGIN"
    | "PASSWORD_CHANGE"
    | "PERMISSION_CHANGE"
    | "SUSPICIOUS_ACTIVITY";
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;

  // Event details
  details: Record<string, any>;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  // Location and device
  location?: {
    country?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  device?: {
    type: string;
    os?: string;
    browser?: string;
  };

  createdAt: string;
}

// Account lockout information
export interface AccountLockout {
  userId: string;
  reason: "FAILED_LOGINS" | "SUSPICIOUS_ACTIVITY" | "ADMIN_ACTION";
  lockedAt: string;
  expiresAt?: string;
  attempts: number;
  maxAttempts: number;
  unlockToken?: string;
}

// ============================================================================
// BETTER-AUTH INTEGRATION TYPES
// ============================================================================

// Better-Auth user type (matches their schema)
export interface BetterAuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Custom fields from Better-Auth config
  walletAddress?: string;
  walletPrivateKey?: string;
  isActive?: boolean;
}

// Better-Auth session type
export interface BetterAuthSession {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
}

// Better-Auth context
export interface BetterAuthContext {
  user: BetterAuthUser | null;
  session: BetterAuthSession | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Authentication state
export type AuthState =
  | "UNAUTHENTICATED"
  | "AUTHENTICATING"
  | "AUTHENTICATED"
  | "EXPIRED"
  | "ERROR";

// Login method
export type LoginMethod =
  | "EMAIL_PASSWORD"
  | "GOOGLE"
  | "GITHUB"
  | "API_KEY"
  | "MAGIC_LINK";

// Account status
export type AccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING_VERIFICATION"
  | "LOCKED";

// Session status
export type SessionStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPICIOUS";

// Type guards
export function isAuthenticatedUser(
  context: AuthContext,
): context is AuthContext & { user: User } {
  return context.isAuthenticated && !!context.user;
}

export function hasPermission(
  context: AuthContext,
  permission: string,
): boolean {
  return context.permissions.includes(permission);
}

export function hasRole(context: AuthContext, role: string): boolean {
  return context.roles.includes(role);
}

// Helper type for protected routes
export interface ProtectedRouteConfig {
  requireAuth: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  allowAnonymous?: boolean;
  rateLimits?: {
    requests: number;
    windowMs: number;
  };
}
