// ===========================================================================
// API SDK - AUTHENTICATION PROVIDER
// ===========================================================================

import type { AuthHeaderProvider } from '../auth/types';

// ===========================================================================
// AUTHENTICATION TYPES
// ===========================================================================

export type AuthMode = 'anonymous' | 'authenticated' | 'mixed';

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
  tokenType: 'Bearer' | 'JWT';
  scope?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  provider: 'google' | 'anonymous';
  createdAt: string;
  lastLoginAt: string;
}

export interface AnonymousSession {
  sessionId: string;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
}

export interface AuthState {
  mode: AuthMode;
  isAuthenticated: boolean;
  user?: AuthUser;
  token?: AuthToken;
  anonymousSession?: AnonymousSession;
  lastError?: AuthError;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

// ===========================================================================
// AUTHENTICATION CONFIGURATION
// ===========================================================================

export interface AuthConfig {
  // Better-Auth configuration
  betterAuthUrl: string;
  clientId?: string; // Google OAuth client ID

  // Token management
  tokenStorageKey: string;
  refreshTokenStorageKey: string;
  anonymousSessionKey: string;

  // Session management
  anonymousSessionExpiryMs: number;
  tokenRefreshThresholdMs: number;

  // Callbacks
  onAuthStateChange?: (state: AuthState) => void;
  onTokenRefresh?: (token: AuthToken) => void;
  onAuthError?: (error: AuthError) => void;
  onLogout?: () => void;

  // Storage interface
  storage?: AuthStorage;

  // Debug mode
  debug?: boolean;
}

export interface AuthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// ===========================================================================
// BROWSER STORAGE IMPLEMENTATIONS
// ===========================================================================

export class LocalAuthStorage implements AuthStorage {
  getItem(key: string): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage errors
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage errors
    }
  }

  clear(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {
      // Ignore storage errors
    }
  }
}

export class SessionAuthStorage implements AuthStorage {
  getItem(key: string): string | null {
    try {
      return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, value);
      }
    } catch {
      // Ignore storage errors
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch {
      // Ignore storage errors
    }
  }

  clear(): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch {
      // Ignore storage errors
    }
  }
}

export class MemoryAuthStorage implements AuthStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// ===========================================================================
// BETTER-AUTH PROVIDER IMPLEMENTATION
// ===========================================================================

export class BetterAuthProvider implements AuthHeaderProvider {
  private config: AuthConfig;
  private storage: AuthStorage;
  private currentState: AuthState;
  private refreshPromise: Promise<AuthToken | null> | null = null;

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.storage = this.config.storage || new LocalAuthStorage();
    this.currentState = this.initializeAuthState();

    // Auto-refresh tokens on startup
    this.checkAndRefreshToken().catch(error => {
      this.handleAuthError('TOKEN_REFRESH_STARTUP_FAILED', 'Failed to refresh token on startup', error);
    });
  }

  // ===========================================================================
  // AUTH HEADER PROVIDER IMPLEMENTATION
  // ===========================================================================

  public async getAuthHeaders(): Promise<Record<string, string> | null> {
    try {
      const state = await this.getAuthState();

      if (state.isAuthenticated && state.token) {
        // Check if token needs refresh
        if (this.shouldRefreshToken(state.token)) {
          const refreshedToken = await this.refreshToken();
          if (refreshedToken) {
            return this.createAuthHeaders(refreshedToken);
          }
        }

        return this.createAuthHeaders(state.token);
      }

      // For anonymous sessions
      if (state.anonymousSession) {
        return {
          'x-anonymous-session-id': state.anonymousSession.sessionId,
        };
      }

      return null;
    } catch (error) {
      this.handleAuthError('GET_AUTH_HEADERS_FAILED', 'Failed to get auth headers', error);
      return null;
    }
  }

  public async onAuthFailure(error: any): Promise<void> {
    try {
      if (error?.status === 401 || error?.statusCode === 401) {
        // Try to refresh token first
        if (this.currentState.isAuthenticated && this.currentState.token?.refreshToken) {
          try {
            await this.refreshToken();
            return; // Successfully refreshed, don't trigger logout
          } catch (refreshError) {
            this.log('Token refresh failed during auth failure handling', refreshError);
          }
        }

        // If refresh failed or no refresh token, logout
        await this.logout();

        this.handleAuthError('AUTHENTICATION_FAILED', 'Authentication failed - logged out user', error);
      } else {
        this.handleAuthError('AUTH_FAILURE', 'Authentication failure occurred', error);
      }
    } catch (handlingError) {
      this.log('Error handling auth failure', handlingError);
    }
  }

  // ===========================================================================
  // AUTHENTICATION METHODS
  // ===========================================================================

  public async loginWithGoogle(): Promise<AuthState> {
    try {
      // Redirect to Better-Auth Google OAuth endpoint
      const googleAuthUrl = `${this.config.betterAuthUrl}/api/auth/signin/google`;

      if (typeof window !== 'undefined') {
        window.location.href = googleAuthUrl;
      }

      // This method will complete when the user returns from OAuth
      return this.currentState;
    } catch (error) {
      this.handleAuthError('GOOGLE_LOGIN_FAILED', 'Google login failed', error);
      throw error;
    }
  }

  public async handleOAuthCallback(code: string, state?: string): Promise<AuthState> {
    try {
      const response = await fetch(`${this.config.betterAuthUrl}/api/auth/callback/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`OAuth callback failed: ${response.statusText}`);
      }

      const authData = await response.json();

      // Extract token and user information
      const token: AuthToken = {
        accessToken: authData.access_token || authData.token,
        refreshToken: authData.refresh_token,
        expiresAt: Date.now() + (authData.expires_in || 3600) * 1000,
        tokenType: 'Bearer',
        scope: authData.scope,
      };

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.name,
        avatar: authData.user.image || authData.user.avatar,
        provider: 'google',
        createdAt: authData.user.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Save to storage
      this.saveTokenToStorage(token);
      this.saveUserToStorage(user);

      // Update state
      this.currentState = {
        mode: 'authenticated',
        isAuthenticated: true,
        user,
        token,
      };

      this.notifyStateChange();
      this.config.onTokenRefresh?.(token);

      return this.currentState;
    } catch (error) {
      this.handleAuthError('OAUTH_CALLBACK_FAILED', 'OAuth callback handling failed', error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      // Call Better-Auth logout endpoint
      if (this.currentState.isAuthenticated) {
        await fetch(`${this.config.betterAuthUrl}/api/auth/signout`, {
          method: 'POST',
          credentials: 'include',
        }).catch(() => {
          // Ignore logout API errors - continue with local cleanup
        });
      }

      // Clear storage
      this.clearAuthStorage();

      // Reset to anonymous state
      this.currentState = {
        mode: 'anonymous',
        isAuthenticated: false,
        anonymousSession: this.getOrCreateAnonymousSession(),
      };

      this.notifyStateChange();
      this.config.onLogout?.();
    } catch (error) {
      this.handleAuthError('LOGOUT_FAILED', 'Logout failed', error);
    }
  }

  public async refreshToken(): Promise<AuthToken | null> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    try {
      this.refreshPromise = this.performTokenRefresh();
      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  // ===========================================================================
  // ANONYMOUS SESSION MANAGEMENT
  // ===========================================================================

  public getAnonymousSession(): AnonymousSession | null {
    return this.currentState.anonymousSession || null;
  }

  public createAnonymousSession(): AnonymousSession {
    const session: AnonymousSession = {
      sessionId: this.generateSessionId(),
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      expiresAt: Date.now() + this.config.anonymousSessionExpiryMs,
    };

    this.storage.setItem(this.config.anonymousSessionKey, JSON.stringify(session));

    this.currentState.anonymousSession = session;
    this.notifyStateChange();

    return session;
  }

  public updateAnonymousSessionActivity(): void {
    if (this.currentState.anonymousSession) {
      this.currentState.anonymousSession.lastActiveAt = Date.now();
      this.storage.setItem(
        this.config.anonymousSessionKey,
        JSON.stringify(this.currentState.anonymousSession)
      );
    }
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  public async getAuthState(): Promise<AuthState> {
    // Check if current token is valid
    if (this.currentState.isAuthenticated && this.currentState.token) {
      if (this.isTokenExpired(this.currentState.token)) {
        try {
          await this.refreshToken();
        } catch (error) {
          // Token refresh failed, fall back to anonymous
          this.currentState = {
            mode: 'anonymous',
            isAuthenticated: false,
            anonymousSession: this.getOrCreateAnonymousSession(),
          };
        }
      }
    }

    return { ...this.currentState };
  }

  public isAuthenticated(): boolean {
    return this.currentState.isAuthenticated;
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentState.user || null;
  }

  public getCurrentToken(): AuthToken | null {
    return this.currentState.token || null;
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  private async performTokenRefresh(): Promise<AuthToken | null> {
    const currentToken = this.currentState.token;

    if (!currentToken?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.config.betterAuthUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: currentToken.refreshToken,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const refreshData = await response.json();

      const newToken: AuthToken = {
        accessToken: refreshData.access_token || refreshData.token,
        refreshToken: refreshData.refresh_token || currentToken.refreshToken,
        expiresAt: Date.now() + (refreshData.expires_in || 3600) * 1000,
        tokenType: 'Bearer',
        scope: refreshData.scope || currentToken.scope,
      };

      // Save new token
      this.saveTokenToStorage(newToken);

      // Update current state
      this.currentState.token = newToken;
      this.notifyStateChange();
      this.config.onTokenRefresh?.(newToken);

      return newToken;
    } catch (error) {
      this.handleAuthError('TOKEN_REFRESH_FAILED', 'Failed to refresh token', error);
      throw error;
    }
  }

  private createAuthHeaders(token: AuthToken): Record<string, string> {
    return {
      'Authorization': `${token.tokenType} ${token.accessToken}`,
    };
  }

  private shouldRefreshToken(token: AuthToken): boolean {
    const timeUntilExpiry = token.expiresAt - Date.now();
    return timeUntilExpiry < this.config.tokenRefreshThresholdMs;
  }

  private isTokenExpired(token: AuthToken): boolean {
    return Date.now() >= token.expiresAt;
  }

  private async checkAndRefreshToken(): Promise<void> {
    if (this.currentState.isAuthenticated && this.currentState.token) {
      if (this.shouldRefreshToken(this.currentState.token)) {
        try {
          await this.refreshToken();
        } catch (error) {
          this.log('Auto token refresh failed', error);
        }
      }
    }
  }

  private initializeAuthState(): AuthState {
    // Try to load existing auth state from storage
    const savedToken = this.loadTokenFromStorage();
    const savedUser = this.loadUserFromStorage();

    if (savedToken && savedUser && !this.isTokenExpired(savedToken)) {
      return {
        mode: 'authenticated',
        isAuthenticated: true,
        user: savedUser,
        token: savedToken,
      };
    }

    // Fall back to anonymous session
    return {
      mode: 'anonymous',
      isAuthenticated: false,
      anonymousSession: this.getOrCreateAnonymousSession(),
    };
  }

  private getOrCreateAnonymousSession(): AnonymousSession {
    const existing = this.loadAnonymousSessionFromStorage();

    if (existing && existing.expiresAt > Date.now()) {
      return existing;
    }

    return this.createAnonymousSession();
  }

  private saveTokenToStorage(token: AuthToken): void {
    this.storage.setItem(this.config.tokenStorageKey, JSON.stringify(token));
  }

  private loadTokenFromStorage(): AuthToken | null {
    try {
      const tokenJson = this.storage.getItem(this.config.tokenStorageKey);
      return tokenJson ? JSON.parse(tokenJson) : null;
    } catch {
      return null;
    }
  }

  private saveUserToStorage(user: AuthUser): void {
    this.storage.setItem('auth_user', JSON.stringify(user));
  }

  private loadUserFromStorage(): AuthUser | null {
    try {
      const userJson = this.storage.getItem('auth_user');
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  private loadAnonymousSessionFromStorage(): AnonymousSession | null {
    try {
      const sessionJson = this.storage.getItem(this.config.anonymousSessionKey);
      return sessionJson ? JSON.parse(sessionJson) : null;
    } catch {
      return null;
    }
  }

  private clearAuthStorage(): void {
    this.storage.removeItem(this.config.tokenStorageKey);
    this.storage.removeItem(this.config.refreshTokenStorageKey);
    this.storage.removeItem('auth_user');
    // Keep anonymous session for fallback
  }

  private generateSessionId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private notifyStateChange(): void {
    this.config.onAuthStateChange?.(this.currentState);
  }

  private handleAuthError(code: string, message: string, details?: any): void {
    const error: AuthError = {
      code,
      message,
      details,
      timestamp: Date.now(),
    };

    this.currentState.lastError = error;
    this.config.onAuthError?.(error);
    this.log(`Auth Error [${code}]: ${message}`, details);
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[BetterAuthProvider] ${message}`, data || '');
    }
  }

  private mergeWithDefaults(config: Partial<AuthConfig>): AuthConfig {
    return {
      betterAuthUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
      tokenStorageKey: 'triggerr_auth_token',
      refreshTokenStorageKey: 'triggerr_refresh_token',
      anonymousSessionKey: 'triggerr_anonymous_session',
      anonymousSessionExpiryMs: 24 * 60 * 60 * 1000, // 24 hours
      tokenRefreshThresholdMs: 5 * 60 * 1000, // 5 minutes
      debug: process.env.NODE_ENV === 'development',
      ...config,
    };
  }
}

// ===========================================================================
// UTILITY FUNCTIONS
// ===========================================================================

/**
 * Creates a Better-Auth provider with default configuration
 */
export function createBetterAuthProvider(config: Partial<AuthConfig> = {}): BetterAuthProvider {
  return new BetterAuthProvider(config);
}

/**
 * Creates an auth provider for anonymous-only usage
 */
export function createAnonymousAuthProvider(): BetterAuthProvider {
  return new BetterAuthProvider({
    // Force anonymous mode
    onAuthStateChange: (state) => {
      if (state.isAuthenticated) {
        console.warn('Anonymous-only auth provider received authenticated state');
      }
    },
  });
}

/**
 * Creates an auth provider with memory storage (useful for testing)
 */
export function createTestAuthProvider(config: Partial<AuthConfig> = {}): BetterAuthProvider {
  return new BetterAuthProvider({
    ...config,
    storage: new MemoryAuthStorage(),
    debug: true,
  });
}
