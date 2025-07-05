// ===========================================================================
// API SDK - USER SERVICE
// ===========================================================================

import type { ApiClient } from "../client";
import type { ApiResponse } from "@triggerr/api-contracts";
import { convertToQueryParams } from "../utils";
import type {
  UserSignupCompletionRequest,
  UserSignupCompletionResponse,
  UserProfile,
  UserProfileUpdateRequest,
  UserProfileUpdateResponse,
  UserPolicyListRequest,
  UserPolicyListResponse,
  UserDashboardRequest,
  UserDashboardResponse,
  GetUserActivityLogRequest,
  GetUserActivityLogResponse,
  GetUserConsentsResponse,
  UpdateUserConsentRequest,
  UpdateUserConsentResponse,
} from "@triggerr/api-contracts";

/**
 * Service class for interacting with User-specific API endpoints.
 * This includes user profile management, dashboard data, listing user-specific
 * resources like policies, and managing user consents or activity logs.
 */
export class UserService {
  private apiClient: ApiClient;
  // Base path for user-specific endpoints, typically /user or /api/v1/user
  private readonly basePath = "/user";

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Finalizes the user registration process after OAuth authentication.
   * Typically involves creating a custodial wallet and migrating anonymous session data.
   *
   * @param request - The user signup completion request payload.
   * @returns A promise that resolves to the API response containing user and wallet info.
   * @throws {ApiClientError} If the API request fails.
   */
  public async completeSignup(
    request: UserSignupCompletionRequest,
  ): Promise<ApiResponse<UserSignupCompletionResponse>> {
    return this.apiClient.post<
      UserSignupCompletionResponse,
      UserSignupCompletionRequest
    >(`${this.basePath}/auth/complete-signup`, request);
  }

  /**
   * Retrieves the profile information for the currently authenticated user.
   *
   * @returns A promise that resolves to the API response containing the user's profile.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.apiClient.get<UserProfile>(`${this.basePath}/profile`);
  }

  /**
   * Updates mutable profile information for the currently authenticated user.
   *
   * @param request - The user profile update request payload.
   * @returns A promise that resolves to the API response containing the updated user profile.
   * @throws {ApiClientError} If the API request fails.
   */
  public async updateUserProfile(
    request: UserProfileUpdateRequest,
  ): Promise<ApiResponse<UserProfileUpdateResponse>> {
    return this.apiClient.put<
      UserProfileUpdateResponse,
      UserProfileUpdateRequest
    >(`${this.basePath}/profile`, request);
  }

  /**
   * Retrieves a paginated list of insurance policies for the authenticated user.
   *
   * @param params - Optional pagination and filtering parameters.
   * @returns A promise that resolves to the API response containing the list of policy summaries.
   * @throws {ApiClientError} If the API request fails.
   */
  public async listUserPolicies(
    params?: UserPolicyListRequest,
  ): Promise<ApiResponse<UserPolicyListResponse>> {
    return this.apiClient.get<UserPolicyListResponse>(
      `${this.basePath}/policies`,
      convertToQueryParams(params),
    );
  }

  /**
   * Retrieves a consolidated set of data for the user's dashboard.
   *
   * @param params - Optional parameters to customize the dashboard data returned.
   * @returns A promise that resolves to the API response containing the dashboard data.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getUserDashboard(
    params?: UserDashboardRequest,
  ): Promise<ApiResponse<UserDashboardResponse>> {
    return this.apiClient.get<UserDashboardResponse>(
      `${this.basePath}/dashboard`,
      convertToQueryParams(params),
    );
  }

  /**
   * Retrieves activity logs for the authenticated user.
   * Note: Assumes userId is inferred from authentication context by the backend.
   *
   * @param params - Optional pagination and filtering parameters.
   * @returns A promise that resolves to the API response containing activity logs.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getActivityLog(
    params?: Omit<GetUserActivityLogRequest, "userId">, // Assuming userId is handled by backend
  ): Promise<ApiResponse<GetUserActivityLogResponse>> {
    // Path needs to be confirmed from OpenAPI or actual API design
    return this.apiClient.get<GetUserActivityLogResponse>(
      `${this.basePath}/activity-log`,
      params,
    );
  }

  /**
   * Retrieves consent settings for the authenticated user.
   * Note: Assumes userId is inferred from authentication context by the backend.
   *
   * @returns A promise that resolves to the API response containing user consents.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getConsents(): Promise<ApiResponse<GetUserConsentsResponse>> {
    // Path needs to be confirmed
    return this.apiClient.get<GetUserConsentsResponse>(
      `${this.basePath}/consents`,
    );
  }

  /**
   * Updates a specific consent setting for the authenticated user.
   * Note: Assumes userId is inferred from authentication context by the backend.
   *
   * @param request - The update user consent request payload.
   * @returns A promise that resolves to the API response containing the updated consent.
   * @throws {ApiClientError} If the API request fails.
   */
  public async updateConsent(
    request: Omit<UpdateUserConsentRequest, "userId">, // Assuming userId is handled by backend
  ): Promise<ApiResponse<UpdateUserConsentResponse>> {
    // Path needs to be confirmed, e.g., /user/consents/{consentId} or just /user/consents
    // For this example, assuming a general update endpoint.
    // If updating a specific consentId, the path might be /user/consents/${request.consentId}
    // For now, using a generic /user/consents path and sending consentId in body.
    return this.apiClient.put<
      UpdateUserConsentResponse,
      Omit<UpdateUserConsentRequest, "userId">
    >(`${this.basePath}/consents`, request); // Adjust path as per actual API design
  }

  // Additional user-specific methods can be added here:
  // - e.g., managing payment methods, security settings, linked accounts, etc.
}
