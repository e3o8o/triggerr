/**
 * LLM Interface - Core Types and Interfaces
 *
 * This package defines the generic, provider-agnostic interfaces and models
 * for LLM interactions used throughout the Triggerr platform.
 */

// Core message types for LLM conversations
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface LLMConversation {
  id: string;
  messages: LLMMessage[];
  context?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// LLM Request and Response types
export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  context?: Record<string, any>;
}

export interface LLMResponse {
  message: LLMMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: "stop" | "length" | "content_filter" | "error";
  metadata?: Record<string, any>;
}

// Configuration interfaces
export interface LLMConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
}

export interface LLMProviderCapabilities {
  supportsStreaming: boolean;
  supportsSystemPrompts: boolean;
  supportsImages: boolean;
  supportsTools: boolean;
  maxTokens: number;
  supportedModels: string[];
}

// Error types
export class LLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(provider: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, "RATE_LIMIT", provider);
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter;
    }
  }

  public retryAfter?: number;
}

export class LLMAuthenticationError extends LLMError {
  constructor(provider: string) {
    super(`Authentication failed for ${provider}`, "AUTH_ERROR", provider);
  }
}

// Core LLM Client Interface
export interface ILLMClient {
  readonly name: string;
  readonly provider: string;
  readonly capabilities: LLMProviderCapabilities;

  /**
   * Initialize the LLM client with configuration
   */
  initialize(config: LLMConfig): Promise<void>;

  /**
   * Check if the client is properly configured and ready
   */
  isReady(): boolean;

  /**
   * Generate a response from the LLM
   */
  generateResponse(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Generate a streaming response from the LLM
   */
  generateStreamingResponse?(
    request: LLMRequest,
  ): AsyncGenerator<LLMResponse, void, unknown>;

  /**
   * Test the connection to the LLM provider
   */
  testConnection(): Promise<boolean>;

  /**
   * Get current usage statistics if available
   */
  getUsageStats?(): Promise<{
    requestsToday: number;
    tokensUsedToday: number;
    remainingQuota?: number;
  }>;
}

// Insurance-specific LLM context types
export interface InsuranceContext {
  userId?: string;
  sessionId?: string;
  currentQuote?: string;
  activePolicies?: string[];
  conversationPhase:
    | "greeting"
    | "quote_gathering"
    | "quote_explanation"
    | "purchase"
    | "support";
  flightContext?: {
    flightNumber?: string;
    date?: string;
    route?: string;
  };
}

export interface InsuranceLLMRequest extends LLMRequest {
  context: InsuranceContext;
  intent?:
    | "get_quote"
    | "explain_coverage"
    | "purchase_policy"
    | "general_support";
}

export interface InsuranceLLMResponse extends LLMResponse {
  extractedData?: {
    flightNumber?: string;
    flightDate?: string;
    coverageType?: string;
    coverageAmount?: string;
    intent?: string;
  };
  suggestedActions?: {
    type: "quote" | "purchase" | "redirect" | "clarify";
    parameters?: Record<string, any>;
  }[];
}

// Factory interface for creating LLM clients
export interface ILLMClientFactory {
  createClient(provider: string, config: LLMConfig): ILLMClient;
  getSupportedProviders(): string[];
}
