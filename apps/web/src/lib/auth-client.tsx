"use client";

import { createAuthClient } from "better-auth/client";
import {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";

// Create Better-Auth client
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  },
);

// Anonymous session utilities
export const ANONYMOUS_SESSION_KEY = "anonymous-session-id";

export function getAnonymousSessionId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(ANONYMOUS_SESSION_KEY);
  } catch {
    return null;
  }
}

export function setAnonymousSessionId(sessionId: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(ANONYMOUS_SESSION_KEY, sessionId);
  } catch (error) {
    console.error("Failed to store anonymous session ID:", error);
  }
}

export function clearAnonymousSessionId(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(ANONYMOUS_SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear anonymous session ID:", error);
  }
}

export function createAnonymousSessionId(): string {
  const sessionId = `anon_${crypto.randomUUID()}`;
  setAnonymousSessionId(sessionId);
  return sessionId;
}

export function getOrCreateAnonymousSessionId(): string {
  const existing = getAnonymousSessionId();
  if (existing) return existing;

  return createAnonymousSessionId();
}

// Auth context type
export interface AuthState {
  user: any | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  anonymousSessionId: string | null;
}

export interface AuthContextType extends AuthState {
  signIn: (
    provider: "google",
    options?: { callbackURL?: string },
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    anonymousSessionId: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get session from Better Auth
        const { data: session } = await authClient.getSession();

        // Get anonymous session ID
        const anonymousSessionId = getOrCreateAnonymousSessionId();

        if (session?.session && session?.user) {
          setAuthState({
            user: session.user,
            session: session.session,
            isAuthenticated: true,
            isLoading: false,
            anonymousSessionId: null, // Clear anonymous session when authenticated
          });
        } else {
          setAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            anonymousSessionId,
          });
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        const anonymousSessionId = getOrCreateAnonymousSessionId();

        setAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          anonymousSessionId,
        });
      }
    };

    initializeAuth();
  }, []);

  // Sign in with provider
  const signIn = useCallback(
    async (provider: "google", options?: { callbackURL?: string }) => {
      try {
        await authClient.signIn.social({
          provider,
          callbackURL: options?.callbackURL || "/auth/callback",
        });
      } catch (error) {
        console.error("Sign in failed:", error);
        throw error;
      }
    },
    [],
  );

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();

      // Create new anonymous session after sign out
      const anonymousSessionId = createAnonymousSessionId();

      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        anonymousSessionId,
      });
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  }, []);

  // Wallet is now automatically created on sign-in via the onSignIn hook in the backend

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: session } = await authClient.getSession();

      if (session?.session && session?.user) {
        setAuthState((prev) => ({
          ...prev,
          user: session.user,
          session: session.session,
          isAuthenticated: true,
        }));
      } else {
        setAuthState((prev) => ({
          ...prev,
          user: null,
          session: null,
          isAuthenticated: false,
        }));
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for authenticated users only
export function useRequireAuth() {
  const { user, session, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth/signin";
    }
  }, [isAuthenticated, isLoading]);

  if (!isAuthenticated || !user || !session) {
    throw new Error("Authentication required");
  }

  return { user, session };
}

// Hook for anonymous session management
export function useAnonymousSession() {
  const { anonymousSessionId } = useAuth();

  return {
    anonymousSessionId,
    getOrCreateSessionId: getOrCreateAnonymousSessionId,
    clearSessionId: clearAnonymousSessionId,
  };
}

// API client with auth headers
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);

  // Add anonymous session header if not authenticated
  const authState = await authClient.getSession();
  if (!authState.data?.session) {
    const anonymousSessionId = getOrCreateAnonymousSessionId();
    headers.set("x-anonymous-session-id", anonymousSessionId);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Utility to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data } = await authClient.getSession();
    return !!(data?.session && data?.user);
  } catch {
    return false;
  }
}

// Utility to get current user
export async function getCurrentUser() {
  try {
    const { data } = await authClient.getSession();
    return data?.user || null;
  } catch {
    return null;
  }
}
