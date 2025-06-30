"use client";

import { createAuthClient } from "better-auth/react";

// Create the auth client for React components
export const authClient = createAuthClient({
  // Base URL will be automatically detected in most cases
  // but can be overridden if needed for different environments
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || undefined,

  // Fetch configuration for API calls
  fetchOptions: {
    onError: (ctx) => {
      // Log authentication errors for debugging
      console.error("Auth error:", ctx.error);

      // Handle specific insurance-related auth errors
      if (ctx.error.message?.includes("wallet")) {
        console.error("Wallet-related authentication error");
      }

      if (ctx.error.message?.includes("provider")) {
        console.error("Provider-related authentication error");
      }
    },
    onRequest: (ctx) => {
      // Add request logging in development
      if (process.env.NODE_ENV === "development") {
        console.log("Auth request:", ctx.url);
      }
    },
    onSuccess: (ctx) => {
      // Log successful auth operations in development
      if (process.env.NODE_ENV === "development") {
        console.log("Auth success: operation completed");
      }
    },
  },
});

// Export commonly used authentication methods
export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  updateUser,
  changePassword,
  forgetPassword,
  resetPassword,
  verifyEmail,
  sendVerificationEmail,
} = authClient;

// Insurance-specific auth hooks and utilities
export const useInsuranceUser = () => {
  const { data: session, isPending, error } = useSession();

  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    error,
    // Insurance-specific user properties
    hasWallet: false, // Will be determined by checking userWallets table
    isActive: true, // Default to true for now
    // Helper methods
    canPurchasePolicy: () => {
      return !!session?.user && session.user.emailVerified;
    },
    canAccessProviderPortal: () => {
      // This would be extended with provider role checks later
      return !!session?.user && session.user.emailVerified;
    },
  };
};

// Provider-specific authentication utilities
export const useProviderAuth = () => {
  const { user, isAuthenticated, isLoading } = useInsuranceUser();

  return {
    user,
    isAuthenticated,
    isLoading,
    // Provider-specific checks (will be enhanced with role-based access)
    isProvider: false, // TODO: Implement provider role checking
    canManagePolicies: false, // TODO: Implement policy management permissions
    canAccessAnalytics: false, // TODO: Implement analytics permissions
  };
};

// Authentication state management for insurance flows
export const useInsuranceAuth = () => {
  const session = useSession();
  const user = session.data?.user;

  const authState = {
    // Session state
    isAuthenticated: !!user,
    isLoading: session.isPending,
    error: session.error,
    user,

    // Insurance-specific state
    hasVerifiedEmail: user?.emailVerified ?? false,
    hasWallet: false, // Will be determined by checking userWallets table
    isActiveUser: true, // Default to true for now

    // Permission checks for insurance operations
    canQuote: () => {
      return !!user; // Quotes can be generated for any authenticated user
    },

    canPurchase: () => {
      return !!user && user.emailVerified;
    },

    canClaim: () => {
      return !!user && user.emailVerified;
    },

    // Wallet-related utilities
    needsWallet: () => {
      return !!user; // Will be determined by checking userWallets table
    },

    // Verification utilities
    needsEmailVerification: () => {
      return !!user && !user.emailVerified;
    },
  };

  return authState;
};

// Sign-in utilities for different insurance user types
export const signInWithGoogle = async (options?: { callbackURL?: string }) => {
  try {
    const result = await signIn.social({
      provider: "google",
      callbackURL: options?.callbackURL || "/dashboard",
    });

    return result;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signInWithEmail = async (
  email: string,
  password: string,
  options?: { callbackURL?: string }
) => {
  try {
    const result = await signIn.email({
      email,
      password,
      callbackURL: options?.callbackURL || "/dashboard",
    });

    return result;
  } catch (error) {
    console.error("Email sign-in error:", error);
    throw error;
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
  options?: { callbackURL?: string }
) => {
  try {
    const result = await signUp.email({
      email,
      password,
      name,
      callbackURL: options?.callbackURL || "/dashboard",
    });

    return result;
  } catch (error) {
    console.error("Email sign-up error:", error);
    throw error;
  }
};

// Insurance-specific sign-out with cleanup
export const signOutUser = async (options?: { redirectTo?: string }) => {
  try {
    // TODO: Add any insurance-specific cleanup here
    // - Clear cached quotes
    // - Clear temporary policy data
    // - Log sign-out event

    const result = await signOut();

    // Handle redirect manually if needed
    if (options?.redirectTo) {
      window.location.href = options.redirectTo;
    }

    return result;
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
};

// Type exports for insurance user
export interface InsuranceUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Type for insurance session
export interface InsuranceSession {
  user: InsuranceUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

// Export the full client for advanced usage
export default authClient;
