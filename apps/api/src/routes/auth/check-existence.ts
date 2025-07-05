import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { Database, Schema } from "@triggerr/core";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Define the schema for the request body using Zod for validation
const checkExistenceRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email format." }),
});

/**
 * Handles POST requests for the /api/v1/auth/check-existence endpoint.
 *
 * This endpoint checks if a user with the provided email already exists in the
 * database. It's a public-facing utility to help the frontend determine
 * whether a user signing up is new or a returning user.
 *
 * @param {Request} request - The incoming request object from the Bun server.
 * @returns {Promise<Response>} A promise that resolves to a standard Response object.
 */
export async function handleCheckExistence(
  request: Request,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  console.log(`[API Check Existence] [${requestId}] Received request.`);

  try {
    // 1. Parse and validate the request body
    const body = await request.json();
    const validationResult = checkExistenceRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.warn(
        `[API Check Existence] [${requestId}] Request validation failed:`,
        validationResult.error.format(),
      );
      const errorResponse = createApiError(
        "VALIDATION_ERROR",
        "Invalid request format. Please provide a valid email.",
        { details: validationResult.error.format() },
      );
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email } = validationResult.data;

    // 2. Query the database to find the user using the correct 'user' table
    console.log(
      `[API Check Existence] [${requestId}] Checking for user with email: ${email}`,
    );

    const existingUser = await Database.db.query.user.findFirst({
      where: eq(Schema.userSchema.email, email.toLowerCase()),
      columns: {
        id: true, // Only select the ID for efficiency
      },
    });

    const userExists = !!existingUser;

    console.log(
      `[API Check Existence] [${requestId}] User exists: ${userExists}`,
    );

    // 3. Format and return the response
    const responseData = {
      exists: userExists,
      email: email,
    };

    const successResponse = createApiResponse(responseData);
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(
      `[API Check Existence] [${requestId}] An unexpected error occurred:`,
      error,
    );
    const errorResponse = createApiError(
      "SERVER_ERROR",
      "An unexpected error occurred while checking user existence.",
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
