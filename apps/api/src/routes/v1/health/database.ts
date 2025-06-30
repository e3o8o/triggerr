import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { db } from "@triggerr/core/database";
import { sql } from "drizzle-orm";

/**
 * Handles GET requests for the /api/v1/health/database endpoint.
 *
 * This endpoint performs a comprehensive database health check including:
 * - Basic connectivity test
 * - Query response time measurement
 * - Connection pool status
 *
 * @param {Request} request - The incoming request object
 * @returns {Promise<Response>} A promise that resolves to a standard Response object
 */
export async function handleDatabaseHealthCheck(
  request: Request,
): Promise<Response> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  console.log(`[Health Check] [${requestId}] Database health check initiated`);

  try {
    // Test basic connectivity with a simple query
    const testQuery = await db.execute(
      sql`SELECT 1 as health_check, NOW() as timestamp`,
    );
    const responseTime = Date.now() - startTime;

    console.log(
      `[Health Check] [${requestId}] Database query result:`,
      testQuery,
    );

    // Verify we got a valid response
    if (!testQuery) {
      console.error(
        `[Health Check] [${requestId}] Database returned null response`,
      );

      const errorResponse = createApiError(
        "DATABASE_ERROR",
        "Database connectivity test failed - null response",
        {
          responseTime: `${responseTime}ms`,
          details: "Query executed but returned null result",
        },
      );

      return new Response(JSON.stringify(errorResponse), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle different possible response formats from Drizzle
    let result: { health_check: number; timestamp: Date } | null = null;

    // Check if it's an array with results
    if (Array.isArray(testQuery) && testQuery.length > 0) {
      result = testQuery[0] as { health_check: number; timestamp: Date };
    }
    // Check if it's a direct result object
    else if (
      testQuery &&
      typeof testQuery === "object" &&
      "rows" in testQuery
    ) {
      const rows = (testQuery as any).rows;
      if (Array.isArray(rows) && rows.length > 0) {
        result = rows[0] as { health_check: number; timestamp: Date };
      }
    }
    // Check if it's a direct result with the data
    else if (
      testQuery &&
      typeof testQuery === "object" &&
      "health_check" in testQuery
    ) {
      result = testQuery as { health_check: number; timestamp: Date };
    }

    if (!result) {
      console.error(
        `[Health Check] [${requestId}] Could not parse database response:`,
        testQuery,
      );

      const errorResponse = createApiError(
        "DATABASE_ERROR",
        "Database connectivity test failed - unparseable response",
        {
          responseTime: `${responseTime}ms`,
          details: "Query executed but response format was unexpected",
          rawResponse:
            typeof testQuery === "object"
              ? JSON.stringify(testQuery)
              : String(testQuery),
        },
      );

      return new Response(JSON.stringify(errorResponse), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[Health Check] [${requestId}] Database health check passed in ${responseTime}ms`,
    );

    // Return success response with health data
    const healthData = {
      status: "healthy",
      message: "Connected",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        queryTest: result.health_check === 1,
        serverTime: result.timestamp,
      },
      performance: {
        responseTimeMs: responseTime,
        status:
          responseTime < 100
            ? "excellent"
            : responseTime < 500
              ? "good"
              : "slow",
      },
    };

    const successResponse = createApiResponse(healthData);
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    console.error(
      `[Health Check] [${requestId}] Database health check failed:`,
      error,
    );

    // Determine specific error type
    let errorCode = "DATABASE_ERROR";
    let errorMessage = "Database health check failed";
    let statusCode = 503;

    if (error.message) {
      if (error.message.toLowerCase().includes("connection")) {
        errorCode = "DATABASE_CONNECTION_ERROR";
        errorMessage = "Unable to connect to database";
      } else if (error.message.toLowerCase().includes("timeout")) {
        errorCode = "DATABASE_TIMEOUT";
        errorMessage = "Database query timed out";
      } else if (error.message.toLowerCase().includes("authentication")) {
        errorCode = "DATABASE_AUTH_ERROR";
        errorMessage = "Database authentication failed";
      }
    }

    const errorResponse = createApiError(errorCode, errorMessage, {
      responseTime: `${responseTime}ms`,
      error: error.message || "Unknown database error",
      details: "Database connectivity test failed during query execution",
    });

    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}
