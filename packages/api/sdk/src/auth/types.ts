// ===========================================================================
// API SDK - AUTHENTICATION TYPES
// ===========================================================================

/**
 * Defines the contract for providing authentication headers to the API SDK.
 * The consuming application (e.g., web app, CLI tool) will implement this
 * interface to supply the necessary headers for authenticated requests or
 * requests associated with an anonymous session.
 */
export interface AuthHeaderProvider {
  /**
   * Asynchronously retrieves the current authentication headers.
   * This method should handle fetching:
   * - Bearer token for authenticated users (e.g., `Authorization: Bearer <jwt>`).
   * - Anonymous session ID for unauthenticated users (e.g., `x-anonymous-session-id: <session-id>`).
   * - API key for B2B integrations (e.g., `x-api-key: <api-key>`).
   *
   * The SDK will call this method before making most API requests.
   *
   * @returns A Promise that resolves to a Record of header key-value pairs,
   *          or null/undefined if no authentication headers are applicable for the current context.
   *          Example: ` { 'Authorization': 'Bearer <token>' } `
   *          Example: ` { 'x-anonymous-session-id': '<session-id>' } `
   *          Example: ` { 'x-api-key': '<your-api-key>' } `
   */
  getAuthHeaders: () => Promise<Record<string, string> | null | undefined>;

  /**
   * Optional: A method that can be called by the SDK if an API request fails
   * due to an authentication error (e.g., 401 Unauthorized, token expired).
   * The consuming application can use this to trigger re-authentication flows,
   * token refresh mechanisms, or clear invalid session data.
   *
   * @param error - The error object received from the API client, which might contain
   *                details about the authentication failure.
   * @param failedRequest - Information about the request that failed, which could be
   *                        used to retry the request after successful re-authentication.
   *                        (Structure TBD based on ApiClient implementation)
   * @returns A Promise that resolves when the handler has completed.
   *          It might resolve with a boolean indicating if a retry is recommended.
   */
  onAuthFailure?: (
    error: any,
    failedRequest?: any
  ) => Promise<boolean | void>;
}

/**
 * Optional: More specific type for API keys if they have a standard prefix or format.
 */
export type ApiKey = string;

/**
 * Optional: Type for JWT tokens if needed for specific handling.
 */
export type JwtToken = string;

/**
 * Optional: Type for anonymous session IDs.
 */
export type AnonymousSessionId = string;
