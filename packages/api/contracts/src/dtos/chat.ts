// ============================================================================
// CHAT & MESSAGING API TYPES
// ============================================================================

/**
 * Supported chat message roles
 */
export type ChatMessageRole = 'user' | 'assistant' | 'system';

/**
 * Chat message content types
 */
export type ChatMessageContentType = 'text' | 'quote_request' | 'quote_response' | 'flight_info' | 'policy_info';

/**
 * Chat interface types - supports multiple access methods
 */
export type ChatInterface = 'web' | 'api' | 'cli' | 'terminal';

/**
 * Base chat message structure
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  contentType: ChatMessageContentType;
  metadata?: Record<string, any>;
  timestamp: string; // ISO 8601
  interface: ChatInterface;
}

/**
 * Chat message request payload
 */
export interface ChatMessageRequest {
  message: string;
  conversationId?: string; // Optional for new conversations
  sessionId?: string; // Anonymous session ID if not authenticated
  context?: ChatContext;
  interface?: ChatInterface; // Defaults to 'web'
}

/**
 * Chat message response
 */
export interface ChatMessageResponse {
  id: string;
  conversationId: string;
  message: string;
  role: ChatMessageRole;
  contentType: ChatMessageContentType;
  timestamp: string;
  context?: ChatContext;
  suggestions?: string[]; // Follow-up suggestions
  actions?: ChatAction[]; // Available actions (e.g., get quote, book flight)
}

/**
 * Chat context for maintaining conversation state
 */
export interface ChatContext {
  flightSearch?: FlightSearchContext;
  quoteRequest?: QuoteRequestContext;
  policyInquiry?: PolicyInquiryContext;
  userIntent?: string;
  previousActions?: string[];
}

/**
 * Flight search context within chat
 */
export interface FlightSearchContext {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  cabin?: string;
}

/**
 * Quote request context within chat
 */
export interface QuoteRequestContext {
  productType?: string;
  coverageAmount?: number;
  flightDetails?: {
    flightNumber?: string;
    airline?: string;
    departureTime?: string;
    route?: string;
  };
  delayThreshold?: number; // minutes
  premiumRange?: {
    min: number;
    max: number;
  };
}

/**
 * Policy inquiry context
 */
export interface PolicyInquiryContext {
  policyId?: string;
  trackingNumber?: string;
  claimInquiry?: boolean;
  statusCheck?: boolean;
}

/**
 * Available chat actions
 */
export interface ChatAction {
  id: string;
  label: string;
  type: 'quote' | 'search' | 'track' | 'purchase' | 'info';
  endpoint?: string; // API endpoint for the action
  params?: Record<string, any>;
}

/**
 * Conversation metadata
 */
export interface Conversation {
  id: string;
  userId?: string; // null for anonymous
  sessionId?: string; // for anonymous users
  title?: string;
  status: 'active' | 'completed' | 'archived';
  interface: ChatInterface;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
  context?: ChatContext;
}

/**
 * Conversation list request
 */
export interface ConversationListRequest {
  limit?: number;
  offset?: number;
  status?: 'active' | 'completed' | 'archived';
  interface?: ChatInterface;
}

/**
 * Conversation list response
 */
export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
  };
}

/**
 * Conversation messages request
 */
export interface ConversationMessagesRequest {
  conversationId: string;
  limit?: number;
  offset?: number;
  before?: string; // Message ID for pagination
  after?: string; // Message ID for pagination
}

/**
 * Conversation messages response
 */
export interface ConversationMessagesResponse {
  messages: ChatMessage[];
  conversation: Conversation;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
    before?: string;
    after?: string;
  };
}

/**
 * Anonymous conversation sync request (for when user signs up)
 */
export interface SyncAnonymousConversationRequest {
  sessionId: string;
  conversationIds: string[];
}

/**
 * Anonymous conversation sync response
 */
export interface SyncAnonymousConversationResponse {
  synced: boolean;
  migratedConversations: number;
  message: string;
}

/**
 * Chat interface configuration
 */
export interface ChatInterfaceConfig {
  interface: ChatInterface;
  features: {
    suggestions: boolean;
    actions: boolean;
    contextAware: boolean;
    fileUpload: boolean;
    voiceInput: boolean;
  };
  limits: {
    maxMessageLength: number;
    maxConversationLength: number;
    rateLimitPerMinute: number;
  };
}
