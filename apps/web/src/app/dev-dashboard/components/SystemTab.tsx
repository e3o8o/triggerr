import { createHttpClient } from "@triggerr/api-sdk";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";

interface ServiceStatus {
  status: string;
  healthy: boolean;
  loading: boolean;
}

interface HealthStatus {
  database: ServiceStatus;
  betterAuth: ServiceStatus;
  anonymousSessions: ServiceStatus;
  wallet: ServiceStatus;
  escrowEngine: ServiceStatus;
  chat: ServiceStatus;
  overall: {
    status: string;
    healthy: boolean;
    loading: boolean;
    percentage: number;
    statusMessage?: string;
  };
}

interface SystemTabProps {
  user: any; // from useAuth hook
  isAuthenticated: boolean;
  isLoading: boolean;
  anonymousSessionId: string | null;
  signIn: (provider: "google", options: { callbackURL: string }) => void;
  signOut: () => void;
}

const SystemTab: React.FC<SystemTabProps> = ({
  user,
  isAuthenticated,
  isLoading,
  anonymousSessionId,
  signIn,
  signOut,
}) => {
  // Internal state management
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    database: { status: "Loading...", healthy: false, loading: true },
    betterAuth: { status: "Loading...", healthy: false, loading: true },
    anonymousSessions: { status: "Loading...", healthy: false, loading: true },
    wallet: { status: "Loading...", healthy: false, loading: true },
    escrowEngine: { status: "Loading...", healthy: false, loading: true },
    chat: { status: "Loading...", healthy: false, loading: true },
    overall: {
      status: "Checking system health...",
      healthy: false,
      loading: true,
      percentage: 0,
      statusMessage: "Checking system health...",
    },
  });

  // API Client
  const apiClient = useMemo(
    () =>
      createHttpClient({
        baseURL:
          process.env.NODE_ENV === "production"
            ? "https://triggerr.co"
            : "http://localhost:3000",
      }),
    [],
  );

  // Fetch health status
  const fetchHealthStatus = useCallback(async () => {
    setHealthStatus((prev) => ({
      ...prev,
      overall: { ...prev.overall, loading: true },
    }));

    try {
      const response = await apiClient.get("/api/v1/health");
      if (response.success && response.data) {
        const systemData = response.data as any;
        setHealthStatus((prevState) => {
          const newState = { ...prevState };
          const getService = (name: string) =>
            systemData.details?.find((s: any) => s.service === name);

          const serviceMap: {
            [key in keyof Omit<HealthStatus, "overall">]: string;
          } = {
            database: "database",
            betterAuth: "better-auth",
            anonymousSessions: "anonymous-sessions",
            wallet: "wallet",
            escrowEngine: "escrow-engine",
            chat: "chat",
          };

          for (const [key, serviceName] of Object.entries(serviceMap)) {
            const serviceData = getService(serviceName);
            if (serviceData) {
              (newState as any)[key] = {
                status: serviceData.message || "No message",
                healthy: serviceData.status === "healthy",
                loading: false,
              };
            } else {
              (newState as any)[key] = {
                status: "Not found",
                healthy: false,
                loading: false,
              };
            }
          }

          const healthyServices = Object.values(serviceMap).filter(
            (serviceName) => {
              const serviceData = getService(serviceName);
              return serviceData && serviceData.status === "healthy";
            },
          );

          const totalServices = Object.values(serviceMap).length;
          const percentage = Math.round(
            (healthyServices.length / totalServices) * 100,
          );
          const allHealthy = healthyServices.length === totalServices;

          newState.overall = {
            status: allHealthy
              ? "All systems operational"
              : "Some systems degraded",
            healthy: allHealthy,
            loading: false,
            percentage,
            statusMessage: allHealthy
              ? "All systems are running normally"
              : `${healthyServices.length}/${totalServices} services healthy`,
          };

          return newState;
        });
      }
    } catch (error) {
      console.error("Failed to fetch health status:", error);
      setHealthStatus((prev) => ({
        ...prev,
        overall: {
          status: "Health check failed",
          healthy: false,
          loading: false,
          percentage: 0,
          statusMessage: "Unable to connect to health check endpoint",
        },
      }));
    }
  }, [apiClient]);

  // Effects
  useEffect(() => {
    fetchHealthStatus();
  }, [fetchHealthStatus]);
  const getHealthColorClasses = (isHealthy: boolean, isLoading: boolean) => {
    if (isLoading) {
      return {
        bg: "bg-gray-100",
        border: "border-gray-300",
        text: "text-gray-600",
        textSm: "text-gray-500",
      };
    }
    if (isHealthy) {
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        textSm: "text-green-800",
      };
    }
    return {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      textSm: "text-red-800",
    };
  };

  const getOverallHealthColorClasses = (percentage: number) => {
    if (percentage >= 99) return getHealthColorClasses(true, false);
    if (percentage >= 80)
      return {
        bg: "bg-yellow-50",
        border: "border-yellow-300",
        text: "text-yellow-700",
        textSm: "text-yellow-800",
      };
    return getHealthColorClasses(false, false);
  };

  const renderSystemStatus = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            System Health Status
          </h2>
          <button
            onClick={fetchHealthStatus}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            disabled={healthStatus.overall.loading}
          >
            {healthStatus.overall.loading ? "Checking..." : "Refresh"}
          </button>
        </div>

        {/* Overall Health */}
        <div
          className={`p-4 rounded-lg text-center border ${
            getOverallHealthColorClasses(healthStatus.overall.percentage).bg
          } ${
            getOverallHealthColorClasses(healthStatus.overall.percentage).border
          }`}
        >
          <div
            className={`font-semibold text-lg ${
              getOverallHealthColorClasses(healthStatus.overall.percentage).text
            }`}
          >
            Overall System Health
          </div>
          <div
            className={`text-3xl font-bold mt-1 ${
              getOverallHealthColorClasses(healthStatus.overall.percentage).text
            }`}
          >
            {healthStatus.overall.loading
              ? "..."
              : `${healthStatus.overall.percentage}%`}
          </div>
          <div
            className={`text-sm mt-2 ${
              getOverallHealthColorClasses(healthStatus.overall.percentage)
                .textSm
            }`}
          >
            {healthStatus.overall.statusMessage}
          </div>
        </div>

        {/* Individual Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Object.entries(healthStatus)
            .filter(([key]) => key !== "overall")
            .map(([key, service]) => {
              const colors = getHealthColorClasses(
                service.healthy,
                service.loading,
              );
              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg text-center border ${colors.bg} ${colors.border}`}
                >
                  <div className={`font-semibold capitalize ${colors.text}`}>
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className={`text-sm mt-1 ${colors.textSm}`}>
                    {service.status}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );

  const renderAuthStatus = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Authentication
      </h2>
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500">Loading auth state...</div>
        ) : (
          <>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Current State</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Authenticated:</span>
                  <span
                    className={`font-medium ${
                      isAuthenticated ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isAuthenticated ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Anonymous Session:</span>
                  <span className="font-mono text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    {anonymousSessionId || "None"}
                  </span>
                </div>
              </div>
            </div>

            {isAuthenticated && user && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">
                  User Details
                </h3>
                <div className="space-y-2 text-sm text-green-900">
                  <div className="flex justify-between">
                    <span>Name:</span> <span>{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span> <span>{user.email}</span>
                  </div>
                  {user.image && (
                    <div className="flex justify-between items-center">
                      <span>Avatar:</span>
                      <Image
                        src={user.image}
                        alt="User avatar"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              {!isAuthenticated ? (
                <button
                  onClick={() =>
                    signIn("google", { callbackURL: "/dev-dashboard" })
                  }
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In with Google
                </button>
              ) : (
                <button
                  onClick={signOut}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">{renderSystemStatus()}</div>
      <div>{renderAuthStatus()}</div>
    </div>
  );
};

export default SystemTab;
