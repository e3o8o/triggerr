import { auth, type Session, type User } from "./auth";
import { edgeDb, setEdgeRLSContext, sql } from "../database/edge";

export interface AuthContext {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  userId: string | null;
  anonymousSessionId: string | null;
}

/**
 * Get authentication context from request headers
 * Works for both authenticated users and anonymous sessions
 * @param {Headers} [requestHeaders] - The headers object from the incoming request.
 * @param {string | undefined} [cookieHeader] - The 'Cookie' header string from the incoming request.
 */
export async function getAuthContext(
  requestHeaders?: Headers,
  cookieHeader?: string | undefined,
): Promise<AuthContext> {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: requestHeaders || new Headers(),
    });

    if (session?.session && session?.user) {
      return {
        user: session.user,
        session: session.session,
        isAuthenticated: true,
        userId: session.user.id,
        anonymousSessionId: null,
      };
    }

    // If no authenticated session, check for anonymous session
    const anonymousSessionId = await getAnonymousSessionId(
      requestHeaders || new Headers(),
      cookieHeader,
    );

    return {
      user: null,
      session: null,
      isAuthenticated: false,
      userId: null,
      anonymousSessionId,
    };
  } catch (error) {
    console.error("Error getting auth context:", error);

    // Fallback to anonymous session only
    const anonymousSessionId = await getAnonymousSessionId(
      requestHeaders || new Headers(),
      cookieHeader,
    );

    return {
      user: null,
      session: null,
      isAuthenticated: false,
      userId: null,
      anonymousSessionId,
    };
  }
}

/**
 * Require authentication - throws error if not authenticated
 * Returns authenticated user context
 * @param {Headers} [requestHeaders] - The headers object from the incoming request.
 * @param {string | undefined} [cookieHeader] - The 'Cookie' header string from the incoming request.
 */
export async function requireAuth(
  requestHeaders?: Headers,
  cookieHeader?: string | undefined,
): Promise<{
  user: User;
  session: Session;
  userId: string;
}> {
  const context = await getAuthContext(requestHeaders, cookieHeader);

  if (
    !context.isAuthenticated ||
    !context.user ||
    !context.session ||
    !context.userId
  ) {
    throw new Error("Authentication required");
  }

  return {
    user: context.user,
    session: context.session,
    userId: context.userId,
  };
}

/**
 * Get anonymous session ID from cookies or headers
 * Returns null if no anonymous session found
 * @param {Headers} [requestHeaders] - The headers object from the incoming request.
 * @param {string | undefined} [cookieHeader] - The 'Cookie' header string from the incoming request.
 */
export async function getAnonymousSessionId(
  requestHeaders?: Headers,
  cookieHeader?: string | undefined,
): Promise<string | null> {
  try {
    // Try to get from cookie header first
    if (cookieHeader) {
      const match = cookieHeader.match(/anonymous-session-id=([^;]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Try to get from x-anonymous-session-id header as fallback
    const sessionHeader = requestHeaders?.get("x-anonymous-session-id");
    if (sessionHeader) {
      return sessionHeader;
    }

    return null;
  } catch (error) {
    console.error("Error getting anonymous session ID:", error);
    return null;
  }
}

/**
 * Set Row Level Security context for database queries
 * Sets either authenticated user ID or anonymous session ID
 */
export async function setRLSContext(context: AuthContext): Promise<void> {
  try {
    if (context.isAuthenticated && context.userId) {
      // Set authenticated user context for RLS
      await setEdgeRLSContext(context.userId);
    } else if (context.anonymousSessionId) {
      // Set anonymous session context for RLS
      await setEdgeRLSContext(undefined, context.anonymousSessionId);
    }
  } catch (error) {
    console.error("Error setting RLS context:", error);
    // Don't throw - let the query proceed without RLS context
    // The RLS policies will handle unauthorized access
  }
}

/**
 * Middleware helper to get and set auth context
 * Use this in API routes that need authentication context
 */
export async function withAuthContext<T>(
  request: Request,
  handler: (context: AuthContext) => Promise<T>,
): Promise<T> {
  const context = await getAuthContext(
    request.headers,
    request.headers.get("Cookie") || undefined,
  );
  await setRLSContext(context);
  return handler(context);
}

/**
 * Middleware helper for authenticated-only routes
 * Use this in API routes that require authentication
 */
export async function withAuth<T>(
  request: Request,
  handler: (auth: {
    user: User;
    session: Session;
    userId: string;
  }) => Promise<T>,
): Promise<T> {
  // Use requireAuth to ensure authenticated context
  const auth = await requireAuth(
    request.headers,
    request.headers.get("Cookie") || undefined,
  );

  await setRLSContext({
    user: auth.user,
    session: auth.session,
    isAuthenticated: true, // Guaranteed by requireAuth
    userId: auth.userId,
    anonymousSessionId: null, // Always null for authenticated users
  });
  return handler(auth);
}

/**
 * Helper to create anonymous session ID
 * Use this when creating new anonymous sessions
 */
export function createAnonymousSessionId(): string {
  return `anon_${crypto.randomUUID()}`;
}

/**
 * Validate anonymous session ID format
 */
export function isValidAnonymousSessionId(sessionId: string): boolean {
  return /^anon_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    sessionId,
  );
}

/**
 * Helper to migrate anonymous data to authenticated user
 * This will be used when anonymous users sign up
 */
export async function migrateAnonymousDataToUser(
  anonymousSessionId: string,
  userId: string,
): Promise<void> {
  try {
    await edgeDb.transaction(async (tx) => {
      // Update quote cart items
      await tx.execute(
        sql`UPDATE quote_cart_items
            SET user_id = ${userId}, anonymous_session_id = NULL
            WHERE anonymous_session_id = ${anonymousSessionId}`,
      );

      // Update conversations
      await tx.execute(
        sql`UPDATE conversations
            SET user_id = ${userId}, anonymous_session_id = NULL
            WHERE anonymous_session_id = ${anonymousSessionId}`,
      );

      // Update conversation messages
      await tx.execute(
        sql`UPDATE conversation_messages
            SET user_id = ${userId}, anonymous_session_id = NULL
            WHERE anonymous_session_id = ${anonymousSessionId}`,
      );

      // Update user wallets
      await tx.execute(
        sql`UPDATE user_wallets
            SET user_id = ${userId}, anonymous_session_id = NULL
            WHERE anonymous_session_id = ${anonymousSessionId}`,
      );

      // Update user payment methods
      await tx.execute(
        sql`UPDATE user_payment_methods
            SET user_id = ${userId}, anonymous_session_id = NULL
            WHERE anonymous_session_id = ${anonymousSessionId}`,
      );
    });

    console.log(
      `Successfully migrated anonymous data from session ${anonymousSessionId} to user ${userId}`,
    );
  } catch (error) {
    console.error("Error migrating anonymous data:", error);
    throw new Error("Failed to migrate anonymous session data");
  }
}
