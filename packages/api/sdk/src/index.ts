// ===========================================================================
// TRIGGERR API SDK - MAIN PACKAGE EXPORTS
//
// This file serves as the primary entry point for the @triggerr/api-sdk package.
// It re-exports the main ApiClient, configuration types, error types,
// and core authentication interfaces.
//
// Consumers of this SDK will typically import these core components to
// instantiate and use the SDK.
// ===========================================================================

// --- Core Client & Configuration ---
export { ApiClient } from './client';
export type { ApiClientConfig } from './client'; // Re-exporting the type for configuration

// --- HTTP Client & Advanced Configuration ---
export { HttpClient, createHttpClient } from './client/http-client';
export type { HttpClientConfig } from './client/http-client';

// --- Error Handling ---
export { ApiClientError } from './client'; // Custom error class for SDK-specific errors

// --- Authentication ---
export type { AuthHeaderProvider } from './auth'; // Core interface for providing auth headers
export {
  AnonymousSessionManager,
  createAnonymousSessionManager,
  createMemoryAnonymousSessionManager,
  type SessionStorage,
  type AnonymousSessionManagerConfig,
  ANONYMOUS_SESSION_HEADER_KEY,
  API_KEY_HEADER_KEY,
  AUTHORIZATION_HEADER_KEY,
} from './auth';

// --- Service Exports ---
export { ChatService } from './services/chat';
export { InsuranceService } from './services/insurance';
export { PolicyService } from './services/policy';
export { WalletService } from './services/wallet';
export { UserService } from './services/user';
export { AdminService } from './services/admin';

// --- Service Types ---
export * from './services/types';

// --- Convenience Re-exports from @triggerr/api-contracts ---
// We re-export commonly used DTOs and enum types from api-contracts through
// our services/types.ts file. This approach avoids TypeScript unused declaration
// errors while still making these types available to SDK consumers.
//
// Types available include:
// - ErrorCode, ErrorCodeType, PaginationRequest
// - AdminGetUserRequestDto
// - GetPolicyDetailsRequestDto, PolicySummaryDto, PolicyEventDto, PolicyDocumentDto
//
// See './services/types.ts' for the complete list of re-exported types


// --- SDK Version ---
// This can be hardcoded or dynamically injected during the build process.
export const API_SDK_VERSION = '0.1.0';

// ===========================================================================
// Usage Example (Illustrative - typically in consuming application code):
// ===========================================================================
/*
import {
  ApiClient,
  type ApiClientConfig,
  type AuthHeaderProvider,
  type ApiClientError,
  // (If re-exported from api-contracts)
  // type ChatMessageRequest,
  // type ChatMessageResponse,
  // InsureinnieErrorCode
} from '@triggerr/api-sdk';

// Implement the AuthHeaderProvider in the consuming application
class MyAppAuthHeaderProvider implements AuthHeaderProvider {
  async getAuthHeaders(): Promise<Record<string, string> | null> {
    // Logic to get current JWT token or anonymous session ID
    const token = localStorage.getItem('authToken');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    const anonId = localStorage.getItem('anonymousId');
    if (anonId) {
      return { 'x-anonymous-session-id': anonId };
    }
    return null;
  }

  async onAuthFailure(error: any): Promise<void> {
    console.error("Auth failure, redirecting to login:", error);
    // Logic to handle token expiry, e.g., redirect to login page
    // window.location.href = '/login';
  }
}

const sdkConfig: ApiClientConfig = {
  baseURL: 'http://localhost:3000/api/v1', // Or your production URL
  authHeaderProvider: new MyAppAuthHeaderProvider(),
  logger: (level, message, context) => {
    console[level](`[SDK_LOGGER] ${message}`, context || '');
  }
};

const apiClient = new ApiClient(sdkConfig);

async function sendMessage() {
  try {
    // Assuming ChatMessageRequest and ChatMessageResponse are imported from @triggerr/api-contracts
    // import type { ChatMessageRequest, ChatMessageResponse, ApiResponse } from \'@triggerr/api-contracts\';

    // const requestBody: ChatMessageRequest = { message: "Hello, parametric world!" };
    // const response: ApiResponse<ChatMessageResponse> = await apiClient.post('/chat/message', requestBody);

    // if (response.success && response.data) {
    //   console.log('Assistant:', response.data.message);
    // } else if (response.error) {
    //   console.error('API Error:', response.error.code, response.error.message);
    //   if (response.error.code === InsureinnieErrorCode.VALIDATION_ERROR) {
    //     // Handle validation error details
    //   }
    // }
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error('SDK Client Error:', error.message, error.status, error.apiError);
      if (error.status === 401) {
        // Authentication error already handled by onAuthFailure or needs specific UI update
      }
    } else {
      console.error('Unexpected Error:', error);
    }
  }
}
*/
// ===========================================================================
