// ===========================================================================
// API SDK - POLICY SERVICE (PARAMETRIC MODEL)
// ===========================================================================

import type { ApiClient } from "../client";
import type { ApiResponse } from "@triggerr/api-contracts";
import { convertToQueryParams } from "../utils";
import type {
  PolicyType as Policy,
  ListUserPoliciesRequest,
  ListUserPoliciesResponse,
  AutomatedPayoutRecord,
  GetAutomatedPayoutRecordRequest,
  ListPolicyAutomatedPayoutsRequest,
  ListPolicyAutomatedPayoutsResponse,
  GetPolicyTimelineRequest,
  GetPolicyTimelineResponse,
  CancelPolicyRequest,
  CancelPolicyResponse,
  AddPolicyDocumentRequest,
  AddPolicyDocumentResponse,
  ManuallyReviewPayoutRequest,
  ManuallyReviewPayoutResponse,
} from "@triggerr/api-contracts";

/**
 * Service class for interacting with parametric Policy API endpoints.
 * This includes fetching policy details, event timelines, automated payout records,
 * and managing policy lifecycle events like cancellation.
 */
export class PolicyService {
  private apiClient: ApiClient;
  private readonly basePath = "/policies"; // Base path for policy endpoints

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Retrieves detailed information for a specific parametric insurance policy.
   * The identifier can be the policy's UUID, policy number, or tracking number.
   *
   * @param policyIdentifier - The unique identifier of the policy.
   * @param trackingNumber - Optional anonymous tracking number if policyIdentifier is not it.
   * @returns A promise that resolves to the API response containing the policy details.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getPolicyDetails(
    policyIdentifier: string,
    // trackingNumber?: string, // The OpenAPI path is /policies/{policyIdentifier}, tracking number can be a query param
  ): Promise<ApiResponse<Policy>> {
    // const queryParams = trackingNumber ? { trackingNumber } : undefined;
    return this.apiClient.get<Policy>(
      `${this.basePath}/${encodeURIComponent(policyIdentifier)}`,
      // queryParams,
    );
  }

  /**
   * Retrieves the event history (timeline) for a specific policy.
   *
   * @param policyId - The UUID of the policy.
   * @param params - Optional pagination and filtering parameters for the timeline.
   * @returns A promise that resolves to the API response containing the policy events.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getPolicyTimeline(
    policyId: string,
    params?: Omit<GetPolicyTimelineRequest, "policyId">,
  ): Promise<ApiResponse<GetPolicyTimelineResponse>> {
    if (!policyId) {
      throw new Error(
        "PolicyService: policyId is required for getPolicyTimeline.",
      );
    }
    return this.apiClient.get<GetPolicyTimelineResponse>(
      `${this.basePath}/${policyId}/timeline`,
      convertToQueryParams(params),
    );
  }

  /**
   * Retrieves automated payout records associated with a specific policy.
   *
   * @param policyId - The UUID of the policy.
   * @param params - Optional pagination and filtering parameters for payout records.
   * @returns A promise that resolves to the API response containing the list of automated payout records.
   * @throws {ApiClientError} If the API request fails.
   */
  public async listAutomatedPayouts(
    policyId: string,
    params?: Omit<ListPolicyAutomatedPayoutsRequest, "policyId">,
  ): Promise<ApiResponse<ListPolicyAutomatedPayoutsResponse>> {
    if (!policyId) {
      throw new Error(
        "PolicyService: policyId is required for listAutomatedPayouts.",
      );
    }
    return this.apiClient.get<ListPolicyAutomatedPayoutsResponse>(
      `${this.basePath}/${policyId}/payouts`,
      params,
    );
  }

  /**
   * Retrieves a specific automated payout record by its ID or associated policy ID.
   *
   * @param params - Request parameters containing either payoutRecordId or policyId.
   * @returns A promise that resolves to the API response containing the automated payout record or null.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getAutomatedPayoutRecord(
    params: GetAutomatedPayoutRecordRequest,
  ): Promise<ApiResponse<AutomatedPayoutRecord | null>> {
    // The actual endpoint for this might vary. OpenAPI doesn't explicitly define a GET for a single payout record yet.
    // Assuming it might be something like /payouts/{payoutRecordId} or queried via policy.
    // For now, this method is a placeholder for that functionality.
    // If using query params on a general /payouts endpoint:
    // return this.apiClient.get<AutomatedPayoutRecordDto | null>(`/payouts`, params);
    // If it's /policies/{policyId}/payouts/{payoutRecordId}
    if (params.payoutRecordId && params.policyId) {
      return this.apiClient.get<AutomatedPayoutRecord | null>(
        `${this.basePath}/${params.policyId}/payouts/${params.payoutRecordId}`,
      );
    } else if (params.payoutRecordId) {
      // This path might not exist, depends on API design
      return this.apiClient.get<AutomatedPayoutRecord | null>(
        `/payouts/${params.payoutRecordId}`, // Hypothetical path
      );
    }
    // This implies an API that can find a single payout record for a policy if only policyId is given.
    // This usually makes more sense as part of listAutomatedPayouts with specific filters if a policy
    // can have multiple payouts.
    throw new Error(
      "getAutomatedPayoutRecord: Not fully implemented based on current OpenAPI. Requires specific endpoint for single payout record retrieval.",
    );
  }

  /**
   * Initiates the cancellation of a policy.
   *
   * @param request - The cancel policy request payload.
   * @returns A promise that resolves to the API response containing the updated policy and cancellation details.
   * @throws {ApiClientError} If the API request fails.
   */
  public async cancelPolicy(
    policyId: string, // Assuming policyId is part of the path, e.g., /policies/{policyId}/cancel
    request: Omit<CancelPolicyRequest, "policyId">,
  ): Promise<ApiResponse<CancelPolicyResponse>> {
    if (!policyId) {
      throw new Error("PolicyService: policyId is required for cancelPolicy.");
    }
    return this.apiClient.post<
      CancelPolicyResponse,
      Omit<CancelPolicyRequest, "policyId">
    >(
      `${this.basePath}/${policyId}/cancel`, // Hypothetical path
      request,
    );
  }

  /**
   * Adds a document to a policy or a specific payout record.
   *
   * @param request - The add policy document request payload.
   * @returns A promise that resolves to the API response containing details of the added document.
   * @throws {ApiClientError} If the API request fails.
   */
  public async addPolicyDocument(
    policyId: string, // Assuming policyId is part of the path
    request: Omit<AddPolicyDocumentRequest, "policyId">,
  ): Promise<ApiResponse<AddPolicyDocumentResponse>> {
    if (!policyId) {
      throw new Error(
        "PolicyService: policyId is required for addPolicyDocument.",
      );
    }
    // Path could be /policies/{policyId}/documents
    return this.apiClient.post<
      AddPolicyDocumentResponse,
      Omit<AddPolicyDocumentRequest, "policyId">
    >(
      `${this.basePath}/${policyId}/documents`, // Hypothetical path
      request,
    );
  }

  /**
   * Allows an administrator or system with appropriate permissions to manually review
   * and act upon an automated payout record that requires attention.
   *
   * @param request - The request payload for manually reviewing a payout.
   * @returns A promise that resolves to the API response containing the updated payout record.
   * @throws {ApiClientError} If the API request fails.
   */
  public async manuallyReviewPayout(
    payoutRecordId: string, // Assuming payoutRecordId is part of path, e.g. /admin/payouts/{payoutRecordId}/review
    request: Omit<ManuallyReviewPayoutRequest, "payoutRecordId">,
  ): Promise<ApiResponse<ManuallyReviewPayoutResponse>> {
    if (!payoutRecordId) {
      throw new Error(
        "PolicyService: payoutRecordId is required for manuallyReviewPayout.",
      );
    }
    // This endpoint is likely under an /admin path
    return this.apiClient.post<
      ManuallyReviewPayoutResponse,
      Omit<ManuallyReviewPayoutRequest, "payoutRecordId">
    >(
      `/admin/payouts/${payoutRecordId}/review`, // Hypothetical admin path
      request,
    );
  }

  /**
   * Retrieves a list of policies for an authenticated user.
   * Note: This is often part of a UserService but included here if PolicyService is the main interaction point for policies.
   *
   * @param params - Optional pagination and filtering parameters.
   * @returns A promise that resolves to the API response containing the list of policy summaries.
   * @throws {ApiClientError} If the API request fails.
   */
  public async listUserPolicies(
    params?: ListUserPoliciesRequest, // This DTO might include userId for admin or be implicit for user
  ): Promise<ApiResponse<ListUserPoliciesResponse>> {
    // Path from OpenAPI is /user/policies
    return this.apiClient.get<ListUserPoliciesResponse>(
      `/user/policies`,
      convertToQueryParams(params),
    );
  }
}
