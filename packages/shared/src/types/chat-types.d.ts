export interface AnonymousSession {
    sessionId: string;
    cartItems: string[];
    conversationId?: string;
    expiresAt: Date;
    createdAt: Date;
    lastActiveAt?: Date;
    metadata?: {
        userAgent?: string;
        ipAddress?: string;
        referrer?: string;
    };
}
export interface ChatMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    uiElements?: ChatUIElement[];
    metadata?: ChatMessageMetadata;
    createdAt: Date;
    isStreaming?: boolean;
    error?: string;
}
export interface ChatUIElement {
    type: 'quote_card' | 'flight_info' | 'loading' | 'error' | 'policy_summary' | 'payment_form';
    id: string;
    data: any;
    position?: 'inline' | 'floating' | 'sidebar';
    actions?: ChatUIAction[];
}
export interface ChatUIAction {
    type: 'add_to_cart' | 'view_details' | 'purchase' | 'share' | 'retry';
    label: string;
    data?: any;
    disabled?: boolean;
    loading?: boolean;
}
export interface ChatMessageMetadata {
    toolCalls?: string[];
    responseTime?: number;
    model?: string;
    tokens?: {
        prompt: number;
        completion: number;
        total: number;
    };
    confidence?: number;
    sources?: string[];
    flightContext?: FlightContextSnapshot;
    insuranceContext?: InsurancePreferencesSnapshot;
}
export interface Conversation {
    id: string;
    userId?: string;
    anonymousSessionId?: string;
    title?: string;
    initialSearchQuery?: string;
    currentFlightContext?: FlightContextSnapshot;
    currentInsurancePreferences?: InsurancePreferencesSnapshot;
    currentOtaContext?: OtaContextSnapshot;
    metadata?: ConversationMetadata;
    messages?: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}
export interface FlightContextSnapshot {
    flightNumber?: string;
    origin?: string;
    destination?: string;
    date?: string;
    airline?: string;
    departureTime?: string;
    arrivalTime?: string;
    status?: string;
    delays?: {
        departure?: number;
        arrival?: number;
    };
    lastUpdated: Date;
    confidence: number;
}
export interface InsurancePreferencesSnapshot {
    coverageType?: 'FLIGHT_DELAY' | 'WEATHER' | 'COMPREHENSIVE';
    maxPremium?: number;
    delayThreshold?: number;
    coverageAmount?: number;
    preferredProvider?: string;
    riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH';
    lastUpdated: Date;
}
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
export interface ConversationMetadata {
    language?: string;
    timezone?: string;
    channel?: 'WEB' | 'MOBILE' | 'API';
    userAgent?: string;
    referrer?: string;
    tags?: string[];
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    satisfaction?: number;
}
export interface QuoteCartItem {
    id: string;
    userId?: string;
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
        delayThreshold: number;
        maxPayout: number;
        terms: string[];
    };
    pricing: {
        basePremium: number;
        riskAdjustment: number;
        fees: number;
        total: number;
        confidence: number;
    };
    validUntil: Date;
    riskFactors?: RiskFactor[];
}
export interface RiskFactor {
    factor: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    weight: number;
    description: string;
}
export interface LeftPanelState {
    conversations: ConversationSummary[];
    selectedConversationId?: string;
    isLoading: boolean;
    searchQuery?: string;
    filter?: 'ALL' | 'RECENT' | 'ARCHIVED';
}
export interface ConversationSummary {
    id: string;
    title: string;
    lastMessage?: string;
    lastActivity: Date;
    messageCount: number;
    hasQuotes: boolean;
    status: 'ACTIVE' | 'ARCHIVED';
}
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
export interface RightPanelState {
    cartItems: QuoteCartItem[];
    totalPremium: number;
    totalCoverage: number;
    isCheckoutReady: boolean;
    selectedItems: string[];
    isLoading: boolean;
    tools?: ChatTool[];
}
export interface ChatTool {
    id: string;
    name: string;
    description: string;
    icon?: string;
    action: 'FLIGHT_SEARCH' | 'WEATHER_CHECK' | 'HELP' | 'CLEAR_CART';
    enabled: boolean;
}
export interface FileAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
    status: 'UPLOADING' | 'UPLOADED' | 'ERROR';
}
export interface ChatMessageRequest {
    content: string;
    conversationId?: string;
    anonymousSessionId?: string;
    attachments?: string[];
    context?: {
        flightContext?: Partial<FlightContextSnapshot>;
        insurancePreferences?: Partial<InsurancePreferencesSnapshot>;
    };
}
export interface ChatMessageResponse {
    message: ChatMessage;
    conversation: Conversation;
    updatedContext?: {
        flightContext?: FlightContextSnapshot;
        insurancePreferences?: InsurancePreferencesSnapshot;
    };
    suggestedActions?: SuggestedAction[];
}
export interface SuggestedAction {
    type: 'SEARCH_FLIGHT' | 'GET_QUOTE' | 'ADD_TO_CART' | 'VIEW_POLICY';
    label: string;
    data?: any;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
}
export interface ConversationListRequest {
    page?: number;
    limit?: number;
    filter?: 'ALL' | 'RECENT' | 'ARCHIVED';
    search?: string;
}
export interface ConversationListResponse {
    conversations: ConversationSummary[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}
export type ChatEventType = 'MESSAGE_RECEIVED' | 'MESSAGE_DELIVERED' | 'MESSAGE_READ' | 'TYPING_START' | 'TYPING_STOP' | 'CONVERSATION_UPDATED' | 'CART_UPDATED' | 'CONNECTION_STATUS';
export interface ChatEvent {
    type: ChatEventType;
    conversationId?: string;
    userId?: string;
    anonymousSessionId?: string;
    data?: any;
    timestamp: Date;
}
export interface TypingIndicator {
    conversationId: string;
    userId?: string;
    isTyping: boolean;
    timestamp: Date;
}
export interface ChatAnalytics {
    conversationId: string;
    messageCount: number;
    duration: number;
    userSatisfaction?: number;
    conversionEvents: ConversionEvent[];
    bounceRate?: number;
    responseTime: {
        average: number;
        p95: number;
    };
}
export interface ConversionEvent {
    type: 'QUOTE_GENERATED' | 'ADDED_TO_CART' | 'POLICY_PURCHASED';
    timestamp: Date;
    value?: number;
    metadata?: any;
}
//# sourceMappingURL=chat-types.d.ts.map