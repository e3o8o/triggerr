/**
 * Chat Service - Conversational AI for Insurance Quoting
 *
 * This package provides conversational AI capabilities for the triggerr platform:
 * - Natural language processing for insurance queries
 * - Entity extraction from user messages
 * - Integration with QuoteEngine for quote generation
 * - Conversation management and context persistence
 * - LLM-agnostic architecture with provider flexibility
 */

// Main service class
export { ChatService } from "./chat-service";

// Request and Response types
export type {
  ChatMessageRequest,
  ChatMessageResponse,
  ConversationContext,
} from "./chat-service";

// Re-export useful types from the service
export type {
  ChatIntent,
  ExtractedFlightData,
  QuoteGenerationResult,
} from "./chat-service";

// Package metadata
export const PACKAGE_NAME = '@triggerr/chat-service';
export const PACKAGE_VERSION = '0.1.0'; 