// ===========================================================================
// API SDK - ADMIN SERVICE
// ===========================================================================

import type { ApiClient } from '../client';
import type { ApiResponse } from '@triggerr/api-contracts';
import { convertToQueryParams } from '../utils';
import type {
  // DTOs from @triggerr/api-contracts/dtos/user for admin actions
  AdminListUsersRequest as AdminListUsersRequestDto,
  AdminListUsersResponse as AdminListUsersResponseDto,
  // AdminGetUserRequestDto is available from '../services/types' if needed
  AdminGetUserResponse as AdminGetUserResponseDto, // This is UserProfileDto
  AdminUpdateUserRequest as AdminUpdateUserRequestDto, // Body for updating user
  AdminUpdateUserResponse as AdminUpdateUserResponseDto, // This is UserProfileDto
  AdminPerformUserActionRequest as AdminPerformUserActionRequestDto, // Body for specific actions
  AdminPerformUserActionResponse as AdminPerformUserActionResponseDto,
  // Potentially other admin-specific DTOs from api-contracts
} from '@triggerr/api-contracts/dtos/user';

/**
 * Service class for interacting with Admin-specific API endpoints.
 * This includes listing users, performing administrative actions on users,
 * and other system management tasks that require admin privileges.
 */
export class AdminService {
  private apiClient: ApiClient;
  // Base path for admin-specific endpoints, typically /admin
  private readonly basePath = '/admin';

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Retrieves a paginated list of all users in the system.
   * Requires admin privileges.
   *
   * @param params - Optional pagination and filtering parameters.
   * @returns A promise that resolves to the API response containing the list of users.
   * @throws {ApiClientError} If the API request fails or the caller is not an admin.
   */
  public async listUsers(
    params?: AdminListUsersRequestDto,
  ): Promise<ApiResponse<AdminListUsersResponseDto>> {
    return this.apiClient.get<AdminListUsersResponseDto>(
      `${this.basePath}/users`,
      convertToQueryParams(params),
    );
  }

  /**
   * Retrieves detailed information for a specific user by their ID.
   * Requires admin privileges.
   *
   * @param userId - The UUID of the user to retrieve.
   * @returns A promise that resolves to the API response containing the user's profile.
   * @throws {ApiClientError} If the API request fails or user not found.
   */
  public async getUserById(
    userId: string,
  ): Promise<ApiResponse<AdminGetUserResponseDto>> {
    if (!userId) {
      throw new Error('AdminService: userId is required for getUserById.');
    }
    return this.apiClient.get<AdminGetUserResponseDto>(
      `${this.basePath}/users/${userId}`,
    );
  }

  /**
   * Updates details for a specific user.
   * Requires admin privileges.
   *
   * @param userId - The UUID of the user to update.
   * @param request - The payload containing fields to update.
   * @returns A promise that resolves to the API response containing the updated user profile.
   * @throws {ApiClientError} If the API request fails.
   */
  public async updateUser(
    userId: string,
    request: Omit<AdminUpdateUserRequestDto, 'userId'>, // userId is path param
  ): Promise<ApiResponse<AdminUpdateUserResponseDto>> {
    if (!userId) {
      throw new Error('AdminService: userId is required for updateUser.');
    }
    return this.apiClient.put<
      AdminUpdateUserResponseDto,
      Omit<AdminUpdateUserRequestDto, 'userId'>
    >(`${this.basePath}/users/${userId}`, request);
  }

  /**
   * Performs a specific administrative action on a user account
   * (e.g., suspend, verify KYC, change role).
   * Requires admin privileges.
   *
   * @param userId - The UUID of the user to perform the action on.
   * @param request - The request payload specifying the action and any associated data.
   * @returns A promise that resolves to the API response confirming the action.
   * @throws {ApiClientError} If the API request fails.
   */
  public async performUserAction(
    userId: string,
    request: Omit<AdminPerformUserActionRequestDto, 'userId'>, // userId is path param
  ): Promise<ApiResponse<AdminPerformUserActionResponseDto>> {
    if (!userId) {
      throw new Error('AdminService: userId is required for performUserAction.');
    }
    // The endpoint in OpenAPI for this was /admin/users/{userId}/action
    return this.apiClient.post<
      AdminPerformUserActionResponseDto,
      Omit<AdminPerformUserActionRequestDto, 'userId'>
    >(`${this.basePath}/users/${userId}/action`, request);
  }

  // Additional admin-specific methods can be added here:
  // - e.g., managing system configuration, viewing audit logs (if SDK exposed),
  //   triggering system maintenance tasks, managing API keys for B2B partners.
  //
  // Example: Get system configuration (if an endpoint exists)
  // public async getSystemConfiguration(): Promise<ApiResponse<SystemConfigDto[]>> {
  //   return this.apiClient.get<SystemConfigDto[]>(`${this.basePath}/system/configuration`);
  // }
  //
  // Example: Update a system configuration item
  // public async updateSystemConfigurationItem(
  //   key: string,
  //   value: any
  // ): Promise<ApiResponse<SystemConfigDto>> {
  //   return this.apiClient.put<SystemConfigDto, { value: any }>(
  //     `${this.basePath}/system/configuration/${key}`,
  //     { value }
  //   );
  // }
}
