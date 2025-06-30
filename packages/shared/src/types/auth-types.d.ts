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
    walletAddress?: string;
    walletPrivateKey?: string;
    preferences?: UserPreferences;
    roles?: UserRole[];
    permissions?: Permission[];
}
export interface UserPreferences {
    language?: string;
    timezone?: string;
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
export interface Session {
    id: string;
    userId: string;
    expiresAt: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    updatedAt: string;
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
export interface Account {
    id: string;
    userId: string;
    accountId: string;
    providerId: string;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    accessTokenExpiresAt?: string;
    refreshTokenExpiresAt?: string;
    scope?: string;
    createdAt: string;
    updatedAt: string;
}
export interface OAuthProvider {
    id: string;
    name: string;
    clientId: string;
    clientSecret: string;
    enabled: boolean;
    scopes: string[];
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl?: string;
    iconUrl?: string;
}
export interface OAuthProfile {
    id: string;
    email: string;
    name?: string;
    username?: string;
    picture?: string;
    verified?: boolean;
    locale?: string;
    [key: string]: any;
}
export interface UserRole {
    id: string;
    name: string;
    description?: string;
    permissions: Permission[];
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface Permission {
    id: string;
    resource: string;
    action: string;
    scope?: string;
    conditions?: PermissionCondition[];
}
export interface PermissionCondition {
    field: string;
    operator: "equals" | "not_equals" | "in" | "not_in" | "greater_than" | "less_than";
    value: any;
}
export type SystemRole = "SUPER_ADMIN" | "ADMIN" | "PROVIDER_ADMIN" | "CUSTOMER_SUPPORT" | "USER" | "GUEST";
export interface ApiKey {
    id: string;
    userId?: string;
    providerId?: string;
    key: string;
    name: string;
    type: "USER" | "PROVIDER" | "SYSTEM";
    permissions: string[];
    isActive: boolean;
    lastUsedAt?: string;
    usageCount: number;
    rateLimit?: {
        requests: number;
        windowMs: number;
    };
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ApiKeyUsage {
    apiKeyId: string;
    date: string;
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
export interface JwtPayload {
    sub: string;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    provider?: string;
    sessionId?: string;
    walletAddress?: string;
    providerId?: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: "Bearer";
}
export interface TokenVerification {
    valid: boolean;
    payload?: JwtPayload;
    error?: string;
    expired?: boolean;
}
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
export interface LoginResponse {
    success: boolean;
    user?: User;
    tokens?: TokenPair;
    session?: Session;
    requiresTwoFactor?: boolean;
    twoFactorMethods?: TwoFactorMethod[];
    error?: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
    username?: string;
    agreeToTerms: boolean;
    marketingConsent?: boolean;
}
export interface RegisterResponse {
    success: boolean;
    user?: User;
    requiresEmailVerification: boolean;
    tokens?: TokenPair;
    error?: string;
}
export interface PasswordResetRequest {
    email: string;
    captchaToken?: string;
}
export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
}
export interface TwoFactorMethod {
    id: string;
    userId: string;
    type: "TOTP" | "SMS" | "EMAIL" | "BACKUP_CODES";
    enabled: boolean;
    verified: boolean;
    secret?: string;
    phoneNumber?: string;
    backupCodes?: string[];
    createdAt: string;
    lastUsedAt?: string;
}
export interface TwoFactorVerifyRequest {
    sessionId: string;
    code: string;
    method: "TOTP" | "SMS" | "EMAIL" | "BACKUP_CODE";
}
export interface TwoFactorSetupRequest {
    type: "TOTP" | "SMS";
    phoneNumber?: string;
}
export interface TwoFactorSetupResponse {
    secret?: string;
    qrCodeUrl?: string;
    backupCodes?: string[];
}
export interface AuthContext {
    user?: User;
    session?: Session;
    apiKey?: ApiKey;
    anonymousSessionId?: string;
    isAuthenticated: boolean;
    isAnonymous: boolean;
    roles: string[];
    permissions: string[];
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
}
export interface PermissionCheck {
    allowed: boolean;
    reason?: string;
    requiredPermissions?: string[];
    missingPermissions?: string[];
}
export interface SecurityEvent {
    id: string;
    type: "LOGIN" | "LOGOUT" | "FAILED_LOGIN" | "PASSWORD_CHANGE" | "PERMISSION_CHANGE" | "SUSPICIOUS_ACTIVITY";
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    details: Record<string, any>;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
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
export interface AccountLockout {
    userId: string;
    reason: "FAILED_LOGINS" | "SUSPICIOUS_ACTIVITY" | "ADMIN_ACTION";
    lockedAt: string;
    expiresAt?: string;
    attempts: number;
    maxAttempts: number;
    unlockToken?: string;
}
export interface BetterAuthUser {
    id: string;
    email: string;
    name?: string;
    image?: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    walletAddress?: string;
    walletPrivateKey?: string;
    isActive?: boolean;
}
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
export interface BetterAuthContext {
    user: BetterAuthUser | null;
    session: BetterAuthSession | null;
}
export type AuthState = "UNAUTHENTICATED" | "AUTHENTICATING" | "AUTHENTICATED" | "EXPIRED" | "ERROR";
export type LoginMethod = "EMAIL_PASSWORD" | "GOOGLE" | "GITHUB" | "API_KEY" | "MAGIC_LINK";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "LOCKED";
export type SessionStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPICIOUS";
export declare function isAuthenticatedUser(context: AuthContext): context is AuthContext & {
    user: User;
};
export declare function hasPermission(context: AuthContext, permission: string): boolean;
export declare function hasRole(context: AuthContext, role: string): boolean;
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
//# sourceMappingURL=auth-types.d.ts.map