// ============================================================================
// CHAT INTERFACE TYPES
// ============================================================================

// Anonymous session for chat and quote cart functionality
export interface AnonymousSession {
  sessionId: string;
  cartItems: string[]; // Quote cart item IDs
  conversationId?: string; // Current active conversation
  expiresAt: Date;
  createdAt: Date;
  lastActiveAt?: Date;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
  };
}

// Chat message with UI elements for the chat interface
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  uiElements?: ChatUIElement[];
  metadata?: ChatMessageMetadata;
  createdAt: Date;
  isStreaming?: boolean; // For real-time streaming responses
  error?: string; // For error messages
}

// UI elements that can be embedded in chat messages
export interface ChatUIElement {
  type: 'quote_card' | 'flight_info' | 'loading' | 'error' | 'policy_summary' | 'payment_form';
  id: string;
  data: any;
  position?: 'inline' | 'floating' | 'sidebar';
  actions?: ChatUIAction[];
}

// Actions available on UI elements
export interface ChatUIAction {
  type: 'add_to_cart' | 'view_details' | 'purchase' | 'share' | 'retry';
  label: string;
  data?: any;
  disabled?: boolean;
  loading?: boolean;
}

// Metadata for chat messages
export interface ChatMessageMetadata {
  toolCalls?: string[]; // LLM tool/function calls made
  responseTime?: number; // Time to generate response in ms
  model?: string; // LLM model used
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  confidence?: number; // AI confidence in response (0-1)
  sources?: string[]; // Data sources used for response
  flightContext?: FlightContextSnapshot;
  insuranceContext?: InsurancePreferencesSnapshot;
}

// ============================================================================
// CONVERSATION CONTEXT TYPES
// ============================================================================

// Complete conversation with messages and context
export interface Conversation {
  id: string;
  userId?: string; // Null for anonymous conversations
  anonymousSessionId?: string; // For anonymous users
  title?: string; // Auto-generated from first message
  initialSearchQuery?: string; // Original user input
  currentFlightContext?: FlightContextSnapshot;
  currentInsurancePreferences?: InsurancePreferencesSnapshot;
  currentOtaContext?: OtaContextSnapshot; // Phase 3
  metadata?: ConversationMetadata;
  messages?: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Flight context maintained during conversation
export interface FlightContextSnapshot {
  flightNumber?: string;
  origin?: string; // IATA code
  destination?: string; // IATA code
  date?: string; // ISO date
  airline?: string;
  departureTime?: string;
  arrivalTime?: string;
  status?: string;
  delays?: {
    departure?: number; // minutes
    arrival?: number; // minutes
  };
  lastUpdated: Date;
  confidence: number; // How confident we are in this data
}

// Insurance preferences gathered during conversation
export interface InsurancePreferencesSnapshot {
  coverageType?: 'FLIGHT_DELAY' | 'WEATHER' | 'COMPREHENSIVE';
  maxPremium?: number; // in cents
  delayThreshold?: number; // minutes
  coverageAmount?: number; // in cents
  preferredProvider?: string;
  riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUpdated: Date;
}

// OTA context for Phase 3
export interface OtaContextSnapshot {
  searchQuery?: string;
  passengers?: number;
  cabinClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  flexibleDates?: boolean;
  priceRange?: {
    min?: number;
    max?: number;
  };
  lastUpdated: Date;
}

// Conversation metadata
export interface ConversationMetadata {
  language?: string; // ISO 639-1 language code
  timezone?: string; // IANA timezone
  channel?: 'WEB' | 'MOBILE' | 'API';
  userAgent?: string;
  referrer?: string;
  tags?: string[]; // For categorization
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  satisfaction?: number; // 1-5 rating if provided
}

// ============================================================================
// QUOTE CART TYPES
// ============================================================================

// Quote cart item for the right panel
export interface QuoteCartItem {
  id: string;
  userId?: string; // Null for anonymous users
  anonymousSessionId?: string;
  insuranceProductId: string;
  flightContextSnapshot: FlightContextSnapshot;
  quotedPremiumCents: number;
  quotedCoverageCents: number;
  quoteDetails: QuoteDetails;
  addedAt: Date;
  status: 'ACTIVE' | 'PURCHASED' | 'EXPIRED' | 'REMOVED';
  expiresAt?: Date;
}

// Detailed quote information
export interface QuoteDetails {
  provider: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  product: {
    id: string;
    name: string;
    description: string;
    coverageType: string;
  };
  coverage: {
    delayThreshold: number; // minutes
    maxPayout: number; // cents
    terms: string[];
  };
  pricing: {
    basePremium: number; // cents
    riskAdjustment: number; // cents
    fees: number; // cents
    total: number; // cents
    confidence: number; // 0-1
  };
  validUntil: Date;
  riskFactors?: RiskFactor[];
}

// Risk factors considered in pricing
export interface RiskFactor {
  factor: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  weight: number; // 0-1
  description: string;
}

// ============================================================================
// THREE-PANEL LAYOUT TYPES
// ============================================================================

// Left panel: conversation history and navigation
export interface LeftPanelState {
  conversations: ConversationSummary[];
  selectedConversationId?: string;
  isLoading: boolean;
  searchQuery?: string;
  filter?: 'ALL' | 'RECENT' | 'ARCHIVED';
}

// Conversation summary for left panel
export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage?: string;
  lastActivity: Date;
  messageCount: number;
  hasQuotes: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
}

// Center panel: main chat interface
export interface CenterPanelState {
  conversation?: Conversation;
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  streamingMessageId?: string;
  error?: string;
  inputValue: string;
  attachments?: FileAttachment[];
}

// Right panel: quote cart and tools
export interface RightPanelState {
  cartItems: QuoteCartItem[];
  totalPremium: number; // cents
  totalCoverage: number; // cents
  isCheckoutReady: boolean;
  selectedItems: string[]; // item IDs
  isLoading: boolean;
  tools?: ChatTool[];
}

// Chat tools for right panel
export interface ChatTool {
  id: string;
  name: string;
  description: string;
  icon?: string;
  action: 'FLIGHT_SEARCH' | 'WEATHER_CHECK' | 'HELP' | 'CLEAR_CART';
  enabled: boolean;
}

// File attachment for chat
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  status: 'UPLOADING' | 'UPLOADED' | 'ERROR';
}

// ============================================================================
// CHAT API TYPES
// ============================================================================

// Chat message request
export interface ChatMessageRequest {
  content: string;
  conversationId?: string;
  anonymousSessionId?: string;
  attachments?: string[]; // File IDs
  context?: {
    flightContext?: Partial<FlightContextSnapshot>;
    insurancePreferences?: Partial<InsurancePreferencesSnapshot>;
  };
}

// Chat message response
export interface ChatMessageResponse {
  message: ChatMessage;
  conversation: Conversation;
  updatedContext?: {
    flightContext?: FlightContextSnapshot;
    insurancePreferences?: InsurancePreferencesSnapshot;
  };
  suggestedActions?: SuggestedAction[];
}

// Suggested actions from AI
export interface SuggestedAction {
  type: 'SEARCH_FLIGHT' | 'GET_QUOTE' | 'ADD_TO_CART' | 'VIEW_POLICY';
  label: string;
  data?: any;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Conversation list request
export interface ConversationListRequest {
  page?: number;
  limit?: number;
  filter?: 'ALL' | 'RECENT' | 'ARCHIVED';
  search?: string;
}

// Conversation list response
export interface ConversationListResponse {
  conversations: ConversationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================================================
// REAL-TIME EVENTS
// ============================================================================

// WebSocket message types for real-time chat
export type ChatEventType =
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_READ'
  | 'TYPING_START'
  | 'TYPING_STOP'
  | 'CONVERSATION_UPDATED'
  | 'CART_UPDATED'
  | 'CONNECTION_STATUS';

// WebSocket event
export interface ChatEvent {
  type: ChatEventType;
  conversationId?: string;
  userId?: string;
  anonymousSessionId?: string;
  data?: any;
  timestamp: Date;
}

// Typing indicator
export interface TypingIndicator {
  conversationId: string;
  userId?: string;
  isTyping: boolean;
  timestamp: Date;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

// Chat analytics data
export interface ChatAnalytics {
  conversationId: string;
  messageCount: number;
  duration: number; // seconds
  userSatisfaction?: number; // 1-5
  conversionEvents: ConversionEvent[];
  bounceRate?: number;
  responseTime: {
    average: number;
    p95: number;
  };
}

// Conversion tracking
export interface ConversionEvent {
  type: 'QUOTE_GENERATED' | 'ADDED_TO_CART' | 'POLICY_PURCHASED';
  timestamp: Date;
  value?: number; // monetary value in cents
  metadata?: any;
}
