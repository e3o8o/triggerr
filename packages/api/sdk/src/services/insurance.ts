// ===========================================================================
// API SDK - INSURANCE SERVICE
// ===========================================================================

import type { ApiClient } from '../client';
import type { ApiResponse } from '@triggerr/api-contracts';
import { convertToQueryParams } from '../utils';
import type {
  InsuranceQuoteRequest as InsuranceQuoteRequestDto,
  InsuranceQuoteResponse as InsuranceQuoteResponseDto,
  InsuranceProductsResponse as InsuranceProductsResponseDto,
  PolicyPurchaseRequest as PolicyPurchaseRequestDto,
  PolicyPurchaseResponse as PolicyPurchaseResponseDto,
  AddToCartRequest as AddToCartRequestDto,
  AddToCartResponse as AddToCartResponseDto,
  // Assuming a DTO for listing products might not have complex query params
  // or they are simple enough to be passed as an object.
  // If InsuranceProductsListRequestDto exists in api-contracts, import it.
} from '@triggerr/api-contracts/dtos/insurance'; // Importing DTOs from the specific dtos path
import type { PaginationRequest } from '@triggerr/api-contracts/dtos/common';

/**
 * Service class for interacting with the Insurance API endpoints,
 * including product listings, quoting, and purchasing.
 */
export class InsuranceService {
  private apiClient: ApiClient;
  private readonly basePath = '/insurance'; // Base path for insurance endpoints

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Retrieves a list of available insurance products.
   *
   * @param params - Optional pagination and filtering parameters.
   *                 Example: { limit?: number, offset?: number, productType?: InsuranceProductType, tier?: CoverageTier }
   *                 (Define InsuranceProductsListRequestDto in api-contracts if more complex)
   * @returns A promise that resolves to the API response containing the list of insurance products.
   * @throws {ApiClientError} If the API request fails.
   */
  public async listProducts(
    params?: PaginationRequest & { productType?: string; tier?: string }, // Inline type for example
  ): Promise<ApiResponse<InsuranceProductsResponseDto>> {
    return this.apiClient.get<InsuranceProductsResponseDto>(
      `${this.basePath}/products`,
      convertToQueryParams(params),
    );
  }

  /**
   * Requests an insurance quote based on provided details.
   *
   * @param request - The insurance quote request payload.
   * @returns A promise that resolves to the API response containing the generated quote.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getQuote(
    request: InsuranceQuoteRequestDto,
  ): Promise<ApiResponse<InsuranceQuoteResponseDto>> {
    return this.apiClient.post<
      InsuranceQuoteResponseDto,
      InsuranceQuoteRequestDto
    >(`${this.basePath}/quote`, request);
  }

  /**
   * Adds a generated quote to an anonymous user's session cart.
   *
   * @param request - The request payload containing the quoteId and sessionId.
   * @returns A promise that resolves to the API response confirming the addition to the cart.
   * @throws {ApiClientError} If the API request fails.
   */
  public async addToCart(
    request: AddToCartRequestDto,
  ): Promise<ApiResponse<AddToCartResponseDto>> {
    return this.apiClient.post<AddToCartResponseDto, AddToCartRequestDto>(
      `${this.basePath}/cart/add`,
      request,
    );
  }

  /**
   * Purchases an insurance policy from a previously generated quote.
   * This typically requires user authentication.
   *
   * @param request - The policy purchase request payload.
   * @returns A promise that resolves to the API response containing details of the purchased policy.
   * @throws {ApiClientError} If the API request fails.
   */
  public async purchasePolicy(
    request: PolicyPurchaseRequestDto,
  ): Promise<ApiResponse<PolicyPurchaseResponseDto>> {
    // Note: The OpenAPI spec has this as /insurance/purchase,
    // while an earlier version might have had /policies/purchase.
    // Using /insurance/purchase to align with current OpenAPI.
    return this.apiClient.post<
      PolicyPurchaseResponseDto,
      PolicyPurchaseRequestDto
    >(`${this.basePath}/purchase`, request);
  }

  // Note: The /insurance/track endpoint from OpenAPI is for anonymous policy tracking.
  // A more comprehensive policy management service (PolicyService) would handle authenticated user policy details.
  // We can add a simple trackPolicy method here if it fits, or defer to a dedicated PolicyService.

  // Example:
  // public async trackPolicyAnonymous(
  //   request: PolicyTrackingRequestDto, // Assuming PolicyTrackingRequestDto exists
  // ): Promise<ApiResponse<PolicyTrackingResponseDto>> { // Assuming PolicyTrackingResponseDto exists
  //   return this.apiClient.post<PolicyTrackingResponseDto, PolicyTrackingRequestDto>(
  //     `${this.basePath}/track`,
  //      request
  //   );
  // }
}
