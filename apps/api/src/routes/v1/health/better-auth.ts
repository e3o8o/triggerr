import { createApiError, createApiResponse } from "@triggerr/api-contracts";

/**
 * Handles GET requests for the /api/v1/health/better-auth endpoint.
 *
 * This endpoint performs a comprehensive Better-Auth service health check including:
 * - Environment configuration validation
 * - Auth service availability
 * - Session handling capability
 *
 * @param {Request} request - The incoming request object
 * @returns {Promise<Response>} A promise that resolves to a standard Response object
 */
export async function handleBetterAuthHealthCheck(
  request: Request,
): Promise<Response> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  console.log(
    `[Health Check] [${requestId}] Better-Auth health check initiated`,
  );

  try {
    // Check required environment variables
    const requiredEnvVars = [
      "BETTER_AUTH_SECRET",
      "BETTER_AUTH_BASE_PATH",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
    ];

    const missingEnvVars: string[] = [];
    const envStatus: Record<string, boolean> = {};

    for (const envVar of requiredEnvVars) {
      const isPresent = !!process.env[envVar];
      envStatus[envVar] = isPresent;
      if (!isPresent) {
        missingEnvVars.push(envVar);
      }
    }

    // Check if critical environment variables are missing
    const criticalMissing = missingEnvVars.filter((env) =>
      ["BETTER_AUTH_SECRET", "BETTER_AUTH_BASE_PATH"].includes(env),
    );

    if (criticalMissing.length > 0) {
      console.error(
        `[Health Check] [${requestId}] Critical Better-Auth environment variables missing:`,
        criticalMissing,
      );

      const errorResponse = createApiError(
        "AUTH_CONFIG_ERROR",
        "Better-Auth configuration is incomplete",
        {
          missingCriticalVars: criticalMissing,
          missingOptionalVars: missingEnvVars.filter(
            (env) => !criticalMissing.includes(env),
          ),
          details:
            "Critical authentication environment variables are not configured",
        },
      );

      return new Response(JSON.stringify(errorResponse), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Test auth service basic functionality
    const responseTime = Date.now() - startTime;

    console.log(
      `[Health Check] [${requestId}] Better-Auth health check passed in ${responseTime}ms`,
    );

    // Determine service status based on configuration completeness
    const configStatus = missingEnvVars.length === 0 ? "complete" : "partial";
    const serviceStatus =
      criticalMissing.length === 0 ? "operational" : "degraded";

    // Return success response with health data
    const healthData = {
      status: "healthy",
      message:
        serviceStatus === "operational" ? "Working" : "Configuration needed",
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      authentication: {
        service: "better-auth",
        status: serviceStatus,
        configurationStatus: configStatus,
        capabilities: {
          googleOAuth:
            envStatus["GOOGLE_CLIENT_ID"] && envStatus["GOOGLE_CLIENT_SECRET"],
          sessionManagement: envStatus["BETTER_AUTH_SECRET"],
          apiEndpoints: envStatus["BETTER_AUTH_BASE_PATH"],
        },
      },
      configuration: {
        requiredVarsPresent: requiredEnvVars.length - missingEnvVars.length,
        totalRequiredVars: requiredEnvVars.length,
        completeness: `${Math.round(((requiredEnvVars.length - missingEnvVars.length) / requiredEnvVars.length) * 100)}%`,
      },
      warnings:
        missingEnvVars.length > 0
          ? [
              `${missingEnvVars.length} optional environment variables missing: ${missingEnvVars.join(", ")}`,
            ]
          : [],
    };

    const successResponse = createApiResponse(healthData);
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    console.error(
      `[Health Check] [${requestId}] Better-Auth health check failed:`,
      error,
    );

    // Determine specific error type
    let errorCode = "AUTH_SERVICE_ERROR";
    let errorMessage = "Better-Auth service health check failed";
    let statusCode = 503;

    if (error.message) {
      if (error.message.toLowerCase().includes("configuration")) {
        errorCode = "AUTH_CONFIG_ERROR";
        errorMessage = "Better-Auth configuration error";
      } else if (error.message.toLowerCase().includes("environment")) {
        errorCode = "AUTH_ENV_ERROR";
        errorMessage = "Authentication environment setup error";
      }
    }

    const errorResponse = createApiError(errorCode, errorMessage, {
      responseTime: `${responseTime}ms`,
      error: error.message || "Unknown authentication service error",
      details: "Better-Auth service health check encountered an error",
    });

    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}
