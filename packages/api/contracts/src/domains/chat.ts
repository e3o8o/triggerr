// ===========================================================================
// CHAT DOMAIN BARREL - API CONTRACTS
//
// This file provides clean, domain-specific exports for all chat-related
// DTOs, validators, and utilities that actually exist in the codebase.
// ===========================================================================

// === STEP 1: IMPORT DTOs & TYPES FOR LOCAL USE AND RE-EXPORT ===
import type {
  // Basic Types
  ChatMessageRole,
  ChatMessageContentType,
  ChatInterface,

  // Core Chat Types
  ChatMessage,
  ChatMessageRequest,
  ChatMessageResponse,
  ChatContext,
  FlightSearchContext,
  QuoteRequestContext,
  PolicyInquiryContext,
  ChatAction,

  // Conversation Types
  Conversation,
  ConversationListRequest,
  ConversationListResponse,
  ConversationMessagesRequest,
  ConversationMessagesResponse,
  SyncAnonymousConversationRequest,
  SyncAnonymousConversationResponse,

  // Configuration Types
  ChatInterfaceConfig,
} from "../dtos/chat";

// === STEP 2: IMPORT VALIDATORS FOR LOCAL USE AND RE-EXPORT ===
import {
  // Enum Validators
  chatMessageRoleSchema,
  chatMessageContentTypeSchema,
  chatInterfaceSchema,
  conversationStatusSchema,

  // Base Schema Validators
  conversationIdSchema,
  chatContextSchema,
  chatActionSchema,
  chatInterfaceConfigSchema,

  // Request Validators
  chatMessageRequestSchema,
  conversationListRequestSchema,
  conversationMessagesRequestSchema,
  syncAnonymousConversationRequestSchema,

  // Response Validators
  chatMessageResponseSchema,
  conversationListResponseSchema,
  conversationMessagesResponseSchema,
  syncAnonymousConversationResponseSchema,

  // Core Schema Validators
  chatMessageSchema,
  conversationSchema,

  // Validation Functions
  validateChatMessageRequest,
  validateConversationListRequest,
  validateConversationMessagesRequest,
  validateSyncAnonymousConversationRequest,
  safeValidateChatMessageRequest,
  safeValidateConversationListRequest,
} from "../validators/chat";

// Import Zod-inferred types for re-export
import type {
  ChatMessageRequest as ZodChatMessageRequest,
  ChatMessageResponse as ZodChatMessageResponse,
  ConversationListRequest as ZodConversationListRequest,
  ConversationListResponse as ZodConversationListResponse,
  ConversationMessagesRequest as ZodConversationMessagesRequest,
  ConversationMessagesResponse as ZodConversationMessagesResponse,
  SyncAnonymousConversationRequest as ZodSyncAnonymousConversationRequest,
  SyncAnonymousConversationResponse as ZodSyncAnonymousConversationResponse,
  ChatMessage as ZodChatMessage,
  Conversation as ZodConversation,
  ChatContext as ZodChatContext,
  ChatAction as ZodChatAction,
  ChatMessageRole as ZodChatMessageRole,
  ChatMessageContentType as ZodChatMessageContentType,
  ChatInterface as ZodChatInterface,
  ConversationStatus as ZodConversationStatus,
} from "../validators/chat";

// === STEP 3: RE-EXPORT ALL IMPORTED ITEMS FOR EXTERNAL USE ===

// DTO re-exports
export type {
  ChatMessageRole,
  ChatMessageContentType,
  ChatInterface,
  ChatMessage,
  ChatMessageRequest,
  ChatMessageResponse,
  ChatContext,
  FlightSearchContext,
  QuoteRequestContext,
  PolicyInquiryContext,
  ChatAction,
  Conversation,
  ConversationListRequest,
  ConversationListResponse,
  ConversationMessagesRequest,
  ConversationMessagesResponse,
  SyncAnonymousConversationRequest,
  SyncAnonymousConversationResponse,
  ChatInterfaceConfig,
};

// Validator and Zod-inferred type re-exports
export {
  chatMessageRoleSchema,
  chatMessageContentTypeSchema,
  chatInterfaceSchema,
  conversationStatusSchema,
  conversationIdSchema,
  chatContextSchema,
  chatActionSchema,
  chatInterfaceConfigSchema,
  chatMessageRequestSchema,
  conversationListRequestSchema,
  conversationMessagesRequestSchema,
  syncAnonymousConversationRequestSchema,
  chatMessageResponseSchema,
  conversationListResponseSchema,
  conversationMessagesResponseSchema,
  syncAnonymousConversationResponseSchema,
  chatMessageSchema,
  conversationSchema,
  validateChatMessageRequest,
  validateConversationListRequest,
  validateConversationMessagesRequest,
  validateSyncAnonymousConversationRequest,
  safeValidateChatMessageRequest,
  safeValidateConversationListRequest,
};
export type {
  ZodChatMessageRequest,
  ZodChatMessageResponse,
  ZodConversationListRequest,
  ZodConversationListResponse,
  ZodConversationMessagesRequest,
  ZodConversationMessagesResponse,
  ZodSyncAnonymousConversationRequest,
  ZodSyncAnonymousConversationResponse,
  ZodChatMessage,
  ZodConversation,
  ZodChatContext,
  ZodChatAction,
  ZodChatMessageRole,
  ZodChatMessageContentType,
  ZodChatInterface,
  ZodConversationStatus,
};

// === NAMESPACE EXPORTS ===

/**
 * Chat validators namespace.
 * This works because the schemas were imported into the local scope first.
 */
export const validators = {
  // Request validators
  messageRequest: chatMessageRequestSchema,
  conversationListRequest: conversationListRequestSchema,
  conversationMessagesRequest: conversationMessagesRequestSchema,
  syncAnonymousConversationRequest: syncAnonymousConversationRequestSchema,

  // Response validators
  messageResponse: chatMessageResponseSchema,
  conversationListResponse: conversationListResponseSchema,
  conversationMessagesResponse: conversationMessagesResponseSchema,
  syncAnonymousConversationResponse: syncAnonymousConversationResponseSchema,

  // Core validators
  message: chatMessageSchema,
  conversation: conversationSchema,
  chatContext: chatContextSchema,
  chatAction: chatActionSchema,
  interfaceConfig: chatInterfaceConfigSchema,

  // Enum validators
  messageRole: chatMessageRoleSchema,
  contentType: chatMessageContentTypeSchema,
  interface: chatInterfaceSchema,
  conversationStatus: conversationStatusSchema,

  // Base validators
  conversationId: conversationIdSchema,

  // Validation Functions
  validateChatMessageRequest,
  validateConversationListRequest,
  validateConversationMessagesRequest,
  validateSyncAnonymousConversationRequest,
  safeValidateChatMessageRequest,
  safeValidateConversationListRequest,
} as const;

/**
 * Chat utilities namespace
 */
export const utils = {
  /**
   * Generate a unique conversation ID
   */
  generateConversationId: (): string => {
    return crypto.randomUUID();
  },

  /**
   * Generate a unique message ID
   */
  generateMessageId: (): string => {
    return crypto.randomUUID();
  },

  /**
   * Format message timestamp for display
   */
  formatMessageTimestamp: (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours =
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  },

  /**
   * Check if content type requires special handling
   */
  requiresSpecialHandling: (contentType: string): boolean => {
    const specialTypes = [
      "quote_request",
      "quote_response",
      "flight_info",
      "policy_info",
    ];
    return specialTypes.includes(contentType);
  },

  /**
   * Get display name for content type
   */
  getContentTypeDisplayName: (contentType: string): string => {
    const displayNames: Record<string, string> = {
      text: "Text Message",
      quote_request: "Quote Request",
      quote_response: "Quote Response",
      flight_info: "Flight Information",
      policy_info: "Policy Information",
    };
    return displayNames[contentType] || "Unknown";
  },

  /**
   * Get display name for chat interface
   */
  getInterfaceDisplayName: (chatInterface: string): string => {
    const displayNames: Record<string, string> = {
      web: "Web Interface",
      api: "API Client",
      cli: "Command Line",
      terminal: "Terminal",
    };
    return displayNames[chatInterface] || "Unknown";
  },

  /**
   * Get display name for conversation status
   */
  getStatusDisplayName: (status: string): string => {
    const displayNames: Record<string, string> = {
      active: "Active",
      completed: "Completed",
      archived: "Archived",
    };
    return displayNames[status] || "Unknown";
  },

  /**
   * Get display name for message role
   */
  getRoleDisplayName: (role: string): string => {
    const displayNames: Record<string, string> = {
      user: "User",
      assistant: "Assistant",
      system: "System",
    };
    return displayNames[role] || "Unknown";
  },

  /**
   * Truncate message content for display
   */
  truncateMessage: (content: string, maxLength: number = 100): string => {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength - 3) + "...";
  },

  /**
   * Extract flight context from message
   */
  extractFlightContext: (message: string): Record<string, any> => {
    const context: Record<string, any> = {};

    // Extract flight number (e.g., "AA123", "UA456")
    const flightMatch = message.match(/([A-Z]{2,3}\d{1,4})/gi);
    if (flightMatch && flightMatch.length > 0) {
      context.flightNumber = flightMatch[0].toUpperCase();
    }

    // Extract airport codes (e.g., "JFK", "LAX")
    const airportMatch = message.match(/\b[A-Z]{3}\b/g);
    if (airportMatch && airportMatch.length >= 2) {
      context.origin = airportMatch[0];
      context.destination = airportMatch[1];
    }

    // Extract dates (basic pattern)
    const dateMatch = message.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g);
    if (dateMatch && dateMatch.length > 0) {
      context.departureDate = dateMatch[0];
    }

    // Extract passenger count
    const passengerMatch = message.match(/(\d+)\s+passenger/gi);
    if (passengerMatch && passengerMatch.length > 0) {
      const count = parseInt(passengerMatch[0].match(/\d+/)?.[0] || "1");
      context.passengers = count;
    }

    return context;
  },

  /**
   * Detect user intent from message
   */
  detectIntent: (message: string): string => {
    const lowerMessage = message.toLowerCase();

    // Quote-related intents
    if (
      lowerMessage.includes("quote") ||
      lowerMessage.includes("price") ||
      lowerMessage.includes("cost")
    ) {
      return "quote_request";
    }

    // Flight search intents
    if (
      lowerMessage.includes("flight") ||
      lowerMessage.includes("search") ||
      lowerMessage.includes("find")
    ) {
      return "flight_search";
    }

    // Policy tracking intents
    if (
      lowerMessage.includes("policy") ||
      lowerMessage.includes("track") ||
      lowerMessage.includes("status")
    ) {
      return "policy_inquiry";
    }

    // Help intents
    if (
      lowerMessage.includes("help") ||
      lowerMessage.includes("how") ||
      lowerMessage.includes("what")
    ) {
      return "help_request";
    }

    // Purchase intents
    if (
      lowerMessage.includes("buy") ||
      lowerMessage.includes("purchase") ||
      lowerMessage.includes("get")
    ) {
      return "purchase_intent";
    }

    return "general_inquiry";
  },

  /**
   * Generate contextual suggestions
   */
  generateSuggestions: (context?: Record<string, any>): string[] => {
    const suggestions: string[] = [];

    if (context?.flightNumber) {
      suggestions.push(`Get quote for flight ${context.flightNumber}`);
      suggestions.push(`Check ${context.flightNumber} status`);
    }

    if (context?.origin && context?.destination) {
      suggestions.push(
        `Find flights from ${context.origin} to ${context.destination}`,
      );
      suggestions.push(
        `Get insurance quote for ${context.origin} to ${context.destination}`,
      );
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push("Get a flight insurance quote");
      suggestions.push("Track my policy");
      suggestions.push("Find flights");
      suggestions.push("How does flight insurance work?");
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  },

  /**
   * Validate message content
   */
  isValidMessage: (content: string): boolean => {
    return content.trim().length > 0 && content.length <= 4000;
  },

  /**
   * Sanitize message content
   */
  sanitizeMessage: (content: string): string => {
    // Remove potential XSS content
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .trim();
  },

  /**
   * Generate conversation title from first message
   */
  generateConversationTitle: (
    firstMessage: string,
    maxLength: number = 50,
  ): string => {
    const cleaned = firstMessage.trim().replace(/\s+/g, " ");
    if (cleaned.length <= maxLength) return cleaned;

    const truncated = cleaned.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 20
      ? truncated.substring(0, lastSpace) + "..."
      : truncated + "...";
  },

  /**
   * Get conversation age in hours
   */
  getConversationAge: (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.abs(now.getTime() - created.getTime()) / (1000 * 60 * 60);
  },

  /**
   * Check if conversation should be archived
   */
  shouldArchiveConversation: (
    createdAt: string,
    lastActivity: string,
  ): boolean => {
    const daysSinceCreation =
      Math.abs(new Date().getTime() - new Date(createdAt).getTime()) /
      (1000 * 60 * 60 * 24);
    const daysSinceActivity =
      Math.abs(new Date().getTime() - new Date(lastActivity).getTime()) /
      (1000 * 60 * 60 * 24);

    return daysSinceCreation > 30 || daysSinceActivity > 7;
  },
} as const;

/**
 * Chat constants namespace
 */
export const constants = {
  MESSAGE_ROLES: {
    USER: "user" as const,
    ASSISTANT: "assistant" as const,
    SYSTEM: "system" as const,
  },

  CONTENT_TYPES: {
    TEXT: "text" as const,
    QUOTE_REQUEST: "quote_request" as const,
    QUOTE_RESPONSE: "quote_response" as const,
    FLIGHT_INFO: "flight_info" as const,
    POLICY_INFO: "policy_info" as const,
  },

  INTERFACES: {
    WEB: "web" as const,
    API: "api" as const,
    CLI: "cli" as const,
    TERMINAL: "terminal" as const,
  },

  CONVERSATION_STATUSES: {
    ACTIVE: "active" as const,
    COMPLETED: "completed" as const,
    ARCHIVED: "archived" as const,
  },

  MESSAGE_LIMITS: {
    MAX_LENGTH: 4000,
    MIN_LENGTH: 1,
  },

  CONVERSATION_LIMITS: {
    MAX_TITLE_LENGTH: 200,
    MAX_MESSAGES_PER_PAGE: 100,
    DEFAULT_MESSAGES_PER_PAGE: 20,
  },

  PAGINATION_LIMITS: {
    MAX_CONVERSATIONS_PER_PAGE: 100,
    DEFAULT_CONVERSATIONS_PER_PAGE: 10,
  },

  SUGGESTION_LIMITS: {
    MAX_SUGGESTIONS: 10,
    DEFAULT_SUGGESTIONS: 4,
  },

  ACTION_LIMITS: {
    MAX_ACTIONS: 10,
  },

  INTENTS: {
    QUOTE_REQUEST: "quote_request" as const,
    FLIGHT_SEARCH: "flight_search" as const,
    POLICY_INQUIRY: "policy_inquiry" as const,
    HELP_REQUEST: "help_request" as const,
    PURCHASE_INTENT: "purchase_intent" as const,
    GENERAL_INQUIRY: "general_inquiry" as const,
  },

  CONTEXT_TYPES: {
    FLIGHT_SEARCH: "flightSearch" as const,
    QUOTE_REQUEST: "quoteRequest" as const,
    POLICY_INQUIRY: "policyInquiry" as const,
  },

  ARCHIVAL_THRESHOLDS: {
    DAYS_SINCE_CREATION: 30,
    DAYS_SINCE_ACTIVITY: 7,
  },
} as const;

// === COMBINED NAMESPACE EXPORT ===
export const ChatDomain = {
  validators,
  utils,
  constants,
} as const;

// === TYPE DEFINITIONS ===
export type ChatDomainNamespace = typeof ChatDomain;
export type ChatValidators = typeof validators;
export type ChatUtils = typeof utils;
export type ChatConstants = typeof constants;
