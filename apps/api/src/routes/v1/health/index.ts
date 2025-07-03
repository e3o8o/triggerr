import { createApiError, createApiResponse } from "@triggerr/api-contracts";
import { handleDatabaseHealthCheck } from "./database";
import { handleBetterAuthHealthCheck } from "./better-auth";
import { handleAnonymousSessionsHealthCheck } from "./anonymous-sessions";
import { handleWalletHealthCheck } from "./wallet";
import { handleChatHealthCheck } from "./chat";
import { handleEscrowEngineHealthCheck } from "./escrow-engine";

/**
 * Handles GET requests for the /api/v1/health endpoint.
 *
 * This endpoint performs a comprehensive system health check by calling all
 * individual service health check endpoints and aggregating their results.
 *
 * Services checked:
 * - Database connectivity and performance
 * - Better-Auth service status and configuration
 * - Anonymous session management
 * - PayGo wallet operations
 * - Escrow engine operations
 * - Chat service status (pending implementation)
 *
 * @param {Request} request - The incoming request object
 * @returns {Promise<Response>} A promise that resolves to a standard Response object
 */
export async function handleSystemHealthCheck(
  request: Request,
): Promise<Response> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  console.log(
    `[System Health] [${requestId}] Comprehensive system health check initiated`,
  );

  try {
    // Execute all health checks in parallel for faster response
    const healthCheckPromises = [
      { name: "database", check: handleDatabaseHealthCheck(request) },
      { name: "better-auth", check: handleBetterAuthHealthCheck(request) },
      {
        name: "anonymous-sessions",
        check: handleAnonymousSessionsHealthCheck(request),
      },
      { name: "wallet", check: handleWalletHealthCheck(request) },
      { name: "escrow-engine", check: handleEscrowEngineHealthCheck(request) },
      { name: "chat", check: handleChatHealthCheck(request) },
    ];

    // Wait for all health checks to complete
    const results = await Promise.allSettled(
      healthCheckPromises.map(async ({ name, check }) => {
        try {
          const response = await check;
          const data: { data?: any } = (await response.json()) as {
            data?: any;
          };
          // The actual service data is nested under a `data` property by our API contract
          const serviceData = data.data || data;

          // A service is only truly healthy if the HTTP status is OK and its own
          // internal status flag is 'healthy'.
          const isHealthy =
            response.ok && serviceData && serviceData.status === "healthy";

          // Return a self-contained result that includes the service name
          return {
            service: name,
            status: response.status,
            healthy: isHealthy,
            message: serviceData.message || "No message",
            // Pass the full service data payload for detailed reporting
            data: serviceData,
          };
        } catch (error: any) {
          // If the promise for a health check itself fails (e.g., network error)
          return {
            service: name,
            status: 500,
            healthy: false,
            message: "Health check function threw an exception.",
            error: error.message,
          };
        }
      }),
    );

    // Process results and determine overall system health
    const serviceResults: any[] = [];
    let healthyServices = 0;
    let totalServices = results.length;
    let criticalServicesDown = 0;
    const criticalServices = [
      "database",
      "better-auth",
      "wallet",
      "escrow-engine",
    ];

    for (const result of results) {
      if (result.status === "fulfilled") {
        const serviceResult = result.value;
        serviceResults.push(serviceResult);

        if (serviceResult.healthy) {
          healthyServices++;
        } else if (criticalServices.includes(serviceResult.service)) {
          criticalServicesDown++;
        }
      } else {
        // This block should ideally not be hit often because we are catching errors
        // inside the promise mapping, but it's a good safeguard.
        console.error("A health check promise was rejected:", result.reason);
      }
    }

    const totalResponseTime = Date.now() - startTime;
    const healthPercentage = Math.round(
      (healthyServices / totalServices) * 100,
    );

    // Determine overall system status
    let overallStatus: string;
    let statusCode: number;
    let statusMessage: string;

    if (criticalServicesDown > 0) {
      overallStatus = "critical";
      statusCode = 503;
      statusMessage = `${criticalServicesDown} critical service(s) unavailable`;
    } else if (healthPercentage === 100) {
      overallStatus = "healthy";
      statusCode = 200;
      statusMessage = "All services operational";
    } else if (healthPercentage >= 80) {
      overallStatus = "degraded";
      statusCode = 206;
      statusMessage = "Some non-critical services experiencing issues";
    } else {
      overallStatus = "unhealthy";
      statusCode = 503;
      statusMessage = "Multiple services experiencing issues";
    }

    console.log(
      `[System Health] [${requestId}] System health check completed in ${totalResponseTime}ms - Overall Status: ${overallStatus} (${healthPercentage}% healthy)`,
    );

    // Prepare a more detailed service summary for the response
    const serviceDetails = serviceResults.map((result) => ({
      service: result.service,
      status: result.healthy ? "healthy" : "unhealthy",
      message: result.message,
      httpStatus: result.status,
      // Include any nested details from the individual health check
      details: result.data || null,
      error: result.error || null,
    }));

    // Generate detailed system health report
    const healthData = {
      overall: {
        status: overallStatus,
        statusMessage: statusMessage,
        healthPercentage: healthPercentage,
        timestamp: new Date().toISOString(),
        totalResponseTime: `${totalResponseTime}ms`,
      },
      services: {
        total: totalServices,
        healthy: healthyServices,
        unhealthy: totalServices - healthyServices,
        criticalDown: criticalServicesDown,
      },
      details: serviceDetails,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          unit: "MB",
        },
      },
      recommendations: generateHealthRecommendations(
        serviceResults,
        overallStatus,
      ),
    };

    const response =
      overallStatus === "critical" || overallStatus === "unhealthy"
        ? createApiError("SYSTEM_HEALTH_DEGRADED", statusMessage, healthData)
        : createApiResponse(healthData);

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    console.error(
      `[System Health] [${requestId}] System health check failed:`,
      error,
    );

    const errorResponse = createApiError(
      "SYSTEM_HEALTH_ERROR",
      "System health check encountered an error",
      {
        responseTime: `${responseTime}ms`,
        error: error.message || "Unknown system health error",
        details: "Failed to complete comprehensive system health check",
      },
    );

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Generates health recommendations based on service status
 */
function generateHealthRecommendations(
  serviceResults: any[],
  overallStatus: string,
): string[] {
  const recommendations: string[] = [];

  serviceResults.forEach((result) => {
    if (!result.healthy) {
      switch (result.service) {
        case "database":
          recommendations.push(
            "Database service requires immediate attention - check connection and query performance",
          );
          break;
        case "better-auth":
          recommendations.push(
            "Authentication service needs configuration review - verify environment variables",
          );
          break;
        case "wallet":
          recommendations.push(
            "PayGo wallet service needs attention - check network connectivity and configuration",
          );
          break;
        case "anonymous-sessions":
          recommendations.push(
            "Anonymous session management has issues - verify session handling logic",
          );
          break;
        case "escrow-engine":
          recommendations.push(
            "Escrow engine service needs attention - check PayGo integration and configuration",
          );
          break;
        case "chat":
          if (result.data?.chat?.status === "not-configured") {
            recommendations.push(
              "Chat service requires DeepSeek API configuration to enable LLM features",
            );
          } else if (result.message.includes("pending")) {
            recommendations.push(
              "Chat service is configured but implementation pending - ready for development",
            );
          } else {
            recommendations.push(
              "Chat service requires attention - check LLM integration status",
            );
          }
          break;
        default:
          recommendations.push(`${result.service} service requires attention`);
      }
    }
  });

  if (overallStatus === "degraded") {
    recommendations.push(
      "System is partially operational - monitor non-critical services closely",
    );
  } else if (overallStatus === "critical") {
    recommendations.push(
      "URGENT: Critical services are down - immediate intervention required",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "All services are operating normally - continue monitoring",
    );
  }

  return recommendations;
}
