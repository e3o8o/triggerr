import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { edgeDb } from "../database/edge";
import * as schema from "../database/schema";
import { eq } from "drizzle-orm";
import { migrateAnonymousDataToUser } from "./utils";

const authConfig = {
  database: drizzleAdapter(edgeDb, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  onSignIn: async ({ user, request }: { user: User; request: Request }) => {
    const requestId = crypto.randomUUID();
    console.log(`[Auth] [${requestId}] ===== onSignIn HOOK TRIGGERED =====`);
    console.log(
      `[Auth] [${requestId}] User signed in: ${user.id} (${user.email})`,
    );
    console.log(`[Auth] [${requestId}] Request URL: ${request.url}`);
    console.log(`[Auth] [${requestId}] Request method: ${request.method}`);

    try {
      // TODO: Move wallet creation logic to API layer to avoid circular dependencies
      // For now, just log the signin event - wallet creation will be handled separately
      console.log(
        `[Auth] [${requestId}] User signin completed - wallet creation will be handled by API layer`,
      );

      // Check for anonymous session to migrate data
      const anonymousSessionId = request.headers.get("x-anonymous-session-id");
      console.log(
        `[Auth] [${requestId}] Checking for anonymous session migration...`,
      );
      console.log(
        `[Auth] [${requestId}] Anonymous session ID:`,
        anonymousSessionId || "NONE",
      );

      if (anonymousSessionId) {
        console.log(
          `[Auth] [${requestId}] Starting anonymous data migration...`,
        );
        try {
          await migrateAnonymousDataToUser(anonymousSessionId, user.id);
          console.log(
            `[Auth] [${requestId}] ✅ Data migration completed for user ${user.id}`,
          );
        } catch (migrationError) {
          const error = migrationError as Error;
          console.error(
            `[Auth] [${requestId}] ❌ Data migration failed:`,
            error.message,
          );
          // Don't fail signin because of migration error
        }
      } else {
        console.log(
          `[Auth] [${requestId}] No anonymous session data to migrate`,
        );
      }

      console.log(
        `[Auth] [${requestId}] ===== onSignIn HOOK COMPLETED SUCCESSFULLY =====`,
      );
    } catch (err) {
      const error = err as Error;
      console.error(
        `[Auth] [${requestId}] ❌ CRITICAL ERROR in onSignIn hook:`,
      );
      console.error(
        `[Auth] [${requestId}] Error type:`,
        error.constructor.name,
      );
      console.error(`[Auth] [${requestId}] Error message:`, error.message);
      console.error(`[Auth] [${requestId}] Error stack:`, error.stack);
      console.error(`[Auth] [${requestId}] User ID:`, user.id);
      console.error(`[Auth] [${requestId}] ===== onSignIn HOOK FAILED =====`);

      // Don't throw - let sign-in continue even if onboarding fails
    }
  },
  emailAndPassword: {
    enabled: false, // We're using Google OAuth only for MVP
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async (data: {
        user: {
          id: string;
          name: string;
          emailVerified: boolean;
          email: string;
          createdAt: Date;
          updatedAt: Date;
          image?: string | null | undefined;
        };
        newEmail: string;
        url: string;
        token: string;
      }) => {
        // TODO: Implement email sending logic in Phase F
        // For now, just log the verification details
        console.log(
          `Change email verification for ${data.user.email} to ${data.newEmail}: ${data.token}`,
        );
      },
    },
    deleteUser: {
      enabled: true,
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:3000",
    "https://triggerr.com",
    "https://www.triggerr.com",
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  advanced: {
    database: {
      generateId: () => {
        // Generate UUID compatible with our existing schema
        return crypto.randomUUID();
      },
    },
    crossSubDomainCookies: {
      enabled: true,
      ...(process.env.NODE_ENV === "production" && {
        domain: ".triggerr.com",
      }),
    },
  },
  plugins: [nextCookies()],
};

// Log the configuration for debugging purposes
console.log(
  "BETTER_AUTH_CONFIG:",
  JSON.stringify(
    {
      ...authConfig,
      database: "DrizzleAdapterInstance", // Avoid logging the full adapter object
      socialProviders: {
        google: {
          clientId: authConfig.socialProviders.google.clientId
            ? "SET"
            : "NOT_SET",
          clientSecret: authConfig.socialProviders.google.clientSecret
            ? "SET"
            : "NOT_SET",
        },
      },
      secret: authConfig.secret ? "SET" : "NOT_SET",
    },
    null,
    2,
  ),
);

export const auth = betterAuth(authConfig);

// Export proper Better-Auth types
export type Session = {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
};

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
};
