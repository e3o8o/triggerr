// ===========================================================================
// API SDK - CHAT SERVICE
// ===========================================================================

import type { ApiClient } from "../client";
import type {
  ApiResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  ConversationListRequest,
  ConversationListResponse,
  ConversationMessagesRequest,
  ConversationMessagesResponse,
  SyncAnonymousConversationRequest,
  SyncAnonymousConversationResponse,
} from "@triggerr/api-contracts";
import { convertToQueryParams } from "../utils";

/**
 * Service class for interacting with the Chat API endpoints.
 */
export class ChatService {
  private apiClient: ApiClient;
  private readonly basePath = "/chat"; // Base path for chat endpoints

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Sends a message to the conversational AI system.
   *
   * @param request - The chat message request payload.
   * @returns A promise that resolves to the API response containing the chat message response.
   * @throws {ApiClientError} If the API request fails.
   */
  public async sendMessage(
    request: ChatMessageRequest,
  ): Promise<ApiResponse<ChatMessageResponse>> {
    return this.apiClient.post<ChatMessageResponse, ChatMessageRequest>(
      `${this.basePath}/message`,
      request,
    );
  }

  /**
   * Retrieves a paginated list of conversations for the authenticated user.
   *
   * @param params - Optional parameters for pagination and filtering.
   * @returns A promise that resolves to the API response containing the list of conversations.
   * @throws {ApiClientError} If the API request fails.
   */
  public async listConversations(
    params?: ConversationListRequest,
  ): Promise<ApiResponse<ConversationListResponse>> {
    return this.apiClient.get<ConversationListResponse>(
      `${this.basePath}/conversations`,
      convertToQueryParams(params),
    );
  }

  /**
   * Retrieves messages for a specific conversation.
   * This endpoint would typically require the conversationId as a path parameter.
   * Example path: /chat/conversations/{conversationId}/messages
   *
   * @param conversationId - The ID of the conversation.
   * @param params - Optional parameters for pagination.
   * @returns A promise that resolves to the API response containing the conversation messages.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getConversationMessages(
    conversationId: string,
    params?: Omit<ConversationMessagesRequest, "conversationId">, // conversationId is part of path
  ): Promise<ApiResponse<ConversationMessagesResponse>> {
    if (!conversationId) {
      throw new Error(
        "ChatService: conversationId is required for getConversationMessages.",
      );
    }
    return this.apiClient.get<ConversationMessagesResponse>(
      `${this.basePath}/conversations/${conversationId}/messages`,
      convertToQueryParams(params),
    );
  }

  /**
   * Synchronizes anonymous conversations with an authenticated user account.
   * This endpoint is typically called after a user signs up or logs in,
   * to migrate their anonymous chat history.
   *
   * @param request - The request payload containing the anonymous session ID and conversation IDs.
   * @returns A promise that resolves to the API response indicating the sync status.
   * @throws {ApiClientError} If the API request fails.
   */
  public async syncAnonymousConversations(
    request: SyncAnonymousConversationRequest,
  ): Promise<ApiResponse<SyncAnonymousConversationResponse>> {
    // This endpoint might be under a user-specific path, e.g., /user/chat/sync-conversations
    // Adjust the path if necessary based on actual API design.
    // For now, assuming a hypothetical path, as it's not explicitly in the OpenAPI paths yet.
    // A common pattern is to put user-specific actions under /user/*
    return this.apiClient.post<
      SyncAnonymousConversationResponse,
      SyncAnonymousConversationRequest
    >(`/user/chat/sync-anonymous-data`, request); // Example path, adjust as needed
  }

  // Additional chat-related methods can be added here, for example:
  // - createConversation(title?: string): Promise<ApiResponse<ConversationDto>>
  // - updateConversationTitle(conversationId: string, title: string): Promise<ApiResponse<ConversationDto>>
  // - deleteConversation(conversationId: string): Promise<ApiResponse<void>>
}
