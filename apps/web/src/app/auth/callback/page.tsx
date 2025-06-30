"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<
    "loading" | "completing" | "success" | "error"
  >("loading");
  const [message, setMessage] = useState("Completing authentication...");

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    console.log(
      "[AuthCallbackPage] useEffect triggered. isLoading:",
      isLoading,
      "isAuthenticated:",
      isAuthenticated,
      "current status:",
      status,
    );

    const handleCallback = async () => {
      console.log("[AuthCallbackPage] handleCallback started.");
      try {
        // Wait for auth state to load
        if (isLoading) {
          console.log("[AuthCallbackPage] isLoading is true, returning.");
          return;
        }

        console.log(
          "[AuthCallbackPage] isLoading is false. isAuthenticated:",
          isAuthenticated,
        );
        if (!isAuthenticated) {
          console.log(
            "[AuthCallbackPage] Not authenticated. Attempting to refresh session.",
          );
          // If not authenticated, refresh session first
          await refreshSession();
          console.log(
            "[AuthCallbackPage] refreshSession completed. State will re-evaluate in next effect run.",
          );
          return;
        }

        // User is authenticated, onboarding happens automatically now
        console.log(
          "[AuthCallbackPage] User is authenticated. Onboarding happens automatically.",
        );
        setStatus("success");
        setMessage("Account setup complete! Redirecting...");

        // Redirect after a short delay
        setTimeout(() => {
          console.log("[AuthCallbackPage] Redirecting to:", callbackUrl);
          router.push(callbackUrl);
        }, 2000);
      } catch (error) {
        console.error("[AuthCallbackPage] Error in handleCallback:", error);
        setStatus("error");
        setMessage("Authentication failed. Please try again.");
      }
    };

    console.log(
      "[AuthCallbackPage] About to call handleCallback(). Current status:",
      status,
    );
    handleCallback();
  }, [isAuthenticated, isLoading, status, refreshSession, router, callbackUrl]);

  const handleRetry = () => {
    router.push("/auth/signin");
  };

  const handleContinue = () => {
    router.push(callbackUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authenticating...
              </h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            </>
          )}

          {status === "completing" && (
            <>
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Setting up your account
              </h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <div className="mt-4 text-xs text-gray-500">
                <p>• Creating your custodial wallet</p>
                <p>• Migrating your data</p>
                <p>• Finalizing setup</p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Welcome to triggerr!
              </h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <div className="mt-4">
                <button
                  onClick={handleContinue}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Continue to Dashboard
                </button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authentication Error
              </h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
                <button
                  onClick={handleContinue}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue Without Account
                </button>
              </div>
            </>
          )}
        </div>

        {(status === "loading" || status === "completing") && (
          <div className="mt-8">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    What&apos;s happening?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      We&apos;re setting up your triggerr account with a
                      secure custodial wallet and transferring any existing data
                      from your anonymous session.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
