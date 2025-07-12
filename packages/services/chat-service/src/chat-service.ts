/**
 * Chat Service - Conversational AI for Insurance Quoting
 *
 * This service orchestrates the conversational flow for insurance quoting:
 * 1. Processes natural language user messages
 * 2. Extracts flight and insurance entities using LLM
 * 3. Generates quotes via QuoteEngine when sufficient data is available
 * 4. Manages conversation context and state
 * 5. Provides fallback to structured forms when LLM is unavailable
 */

import type { Logger } from "@triggerr/core";
import type { 
  ILLMClient, 
  LLMMessage, 
  LLMRequest, 
  LLMResponse,
  InsuranceContext,
  InsuranceLLMRequest,
  InsuranceLLMResponse 
} from "@triggerr/llm-interface";
import { QuoteService, type InsuranceQuoteRequest } from "@triggerr/quote-engine";
import { DataRouter } from "@triggerr/data-router";

// ============================================================================
// Request and Response Types
// ============================================================================

export interface ChatMessageRequest {
  message: string;
  conversationId?: string;
  userId?: string;
  sessionId?: string;
  context?: ConversationContext;
}

export interface ChatMessageResponse {
  response: string;
  conversationId: string;
  intent: ChatIntent;
  extractedData?: ExtractedFlightData;
  quoteResult?: QuoteGenerationResult | undefined;
  suggestedActions?: SuggestedAction[];
  confidence: number;
  fallbackToForm: boolean;
}

export interface ConversationContext {
  userId?: string;
  sessionId?: string;
  conversationHistory: LLMMessage[];
  currentQuote?: string;
  activePolicies?: string[];
  conversationPhase: ConversationPhase;
  flightContext?: {
    flightNumber?: string;
    date?: string;
    route?: string;
  };
}

export type ConversationPhase = 
  | "greeting"
  | "quote_gathering"
  | "quote_explanation"
  | "purchase"
  | "support";

export type ChatIntent = 
  | "get_quote"
  | "explain_coverage"
  | "purchase_policy"
  | "general_support"
  | "clarification_needed";

export interface ExtractedFlightData {
  flightNumber?: string | undefined;
  flightDate?: string | undefined;
  originAirport?: string | undefined;
  destinationAirport?: string | undefined;
  coverageType?: "FLIGHT_DELAY" | "FLIGHT_CANCELLATION" | "WEATHER_DISRUPTION" | undefined;
  coverageAmount?: string | undefined;
  confidence: number;
}

export interface QuoteGenerationResult {
  quoteId: string;
  validUntil: string;
  quotes: Array<{
    productName: string;
    coverageType: string;
    premium: string;
    coverageAmount: string;
    confidence: number;
  }>;
}

export interface SuggestedAction {
  type: "quote" | "purchase" | "redirect" | "clarify";
  label: string;
  parameters?: Record<string, any>;
}

// ============================================================================
// Chat Service Implementation
// ============================================================================

export class ChatService {
  private llmClient: ILLMClient;
  private quoteService: QuoteService;
  private dataRouter: DataRouter;
  private logger: Logger;

  constructor(
    llmClient: ILLMClient,
    quoteService: QuoteService,
    dataRouter: DataRouter,
    logger: Logger
  ) {
    this.llmClient = llmClient;
    this.quoteService = quoteService;
    this.dataRouter = dataRouter;
    this.logger = logger;

    this.logger.info("[ChatService] Initialized with LLM client and QuoteService");
  }

  /**
   * Main method to process user chat messages
   */
  async processMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    this.logger.info(
      `[ChatService] [${requestId}] Processing message: "${request.message.substring(0, 50)}..."`
    );

    try {
      // Step 1: Extract entities from user message
      const extractedData = await this.extractFlightEntities(request.message, requestId);
      
      // Step 2: Determine intent and generate response
      const intent = this.determineIntent(request.message, extractedData);
      
      // Step 3: Generate quote if sufficient data is available
      let quoteResult: QuoteGenerationResult | undefined;
      if (this.hasSufficientDataForQuote(extractedData)) {
        try {
          quoteResult = await this.generateQuoteFromExtractedData(extractedData, requestId);
        } catch (error) {
          this.logger.warn(
            `[ChatService] [${requestId}] Quote generation failed: ${error}`
          );
        }
      }

      // Step 4: Generate conversational response
      const response = await this.generateConversationalResponse(
        request.message,
        intent,
        extractedData,
        quoteResult,
        requestId
      );

      // Step 5: Determine if fallback to form is needed
      const fallbackToForm = this.shouldFallbackToForm(intent, extractedData, quoteResult);

      const processingTime = Date.now() - startTime;
      this.logger.info(
        `[ChatService] [${requestId}] Message processed in ${processingTime}ms`
      );

      return {
        response,
        conversationId: request.conversationId || `conv_${Date.now()}`,
        intent,
        extractedData,
        quoteResult,
        suggestedActions: this.generateSuggestedActions(intent, extractedData, quoteResult),
        confidence: extractedData.confidence,
        fallbackToForm,
      };

    } catch (error: any) {
      this.logger.error(
        `[ChatService] [${requestId}] Message processing failed: ${error}`
      );

      // Return fallback response
      return {
        response: "I'm having trouble processing your request. Please try using our structured quote form instead.",
        conversationId: request.conversationId || `conv_${Date.now()}`,
        intent: "general_support",
        confidence: 0,
        fallbackToForm: true,
      };
    }
  }

  /**
   * Extract flight and insurance entities from natural language
   */
  private async extractFlightEntities(
    message: string, 
    requestId: string
  ): Promise<ExtractedFlightData> {
    const extractionPrompt = this.buildExtractionPrompt();
    
    const llmRequest: InsuranceLLMRequest = {
      messages: [
        { role: "system", content: extractionPrompt },
        { role: "user", content: message }
      ],
      context: {
        conversationPhase: "quote_gathering"
      },
      model: "deepseek-chat",
      temperature: 0.1, // Low temperature for consistent extraction
      maxTokens: 500
    };

    try {
      const llmResponse = await this.llmClient.generateResponse(llmRequest);
      return this.parseExtractedData(llmResponse.message.content);
    } catch (error) {
      this.logger.warn(
        `[ChatService] [${requestId}] LLM extraction failed, using fallback: ${error}`
      );
      return this.fallbackEntityExtraction(message);
    }
  }

  /**
   * Build the system prompt for entity extraction
   */
  private buildExtractionPrompt(): string {
    return `You are an insurance assistant. Extract flight and insurance information from the user's message.

Return ONLY a JSON object with the following structure:
{
  "flightNumber": "string or null",
  "flightDate": "YYYY-MM-DD or null", 
  "originAirport": "3-letter IATA code or null",
  "destinationAirport": "3-letter IATA code or null",
  "coverageType": "FLIGHT_DELAY|FLIGHT_CANCELLATION|WEATHER_DISRUPTION or null",
  "coverageAmount": "number in dollars as string or null",
  "confidence": "number between 0 and 1"
}

Examples:
- "I need insurance for flight AA123 tomorrow" → {"flightNumber": "AA123", "flightDate": "2025-01-13", ...}
- "Flight delay coverage for $500" → {"coverageType": "FLIGHT_DELAY", "coverageAmount": "500", ...}
- "Insurance for my trip to Paris" → {"destinationAirport": "CDG", ...}

If you cannot extract any information, return {"confidence": 0}.`;
  }

  /**
   * Parse the extracted data from LLM response
   */
  private parseExtractedData(content: string): ExtractedFlightData {
    try {
      const parsed = JSON.parse(content);
      return {
        flightNumber: parsed.flightNumber || undefined,
        flightDate: parsed.flightDate || undefined,
        originAirport: parsed.originAirport || undefined,
        destinationAirport: parsed.destinationAirport || undefined,
        coverageType: parsed.coverageType || undefined,
        coverageAmount: parsed.coverageAmount || undefined,
        confidence: parsed.confidence || 0,
      };
    } catch (error) {
      this.logger.warn(`Failed to parse extracted data: ${error}`);
      return { confidence: 0 };
    }
  }

  /**
   * Fallback entity extraction when LLM fails
   */
  private fallbackEntityExtraction(message: string): ExtractedFlightData {
    // Simple regex-based extraction as fallback
    const flightMatch = message.match(/\b([A-Z]{2}\d{3,4})\b/);
    const dateMatch = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    const airportMatch = message.match(/\b([A-Z]{3})\b/g);
    
    return {
      flightNumber: flightMatch?.[1] || undefined,
      flightDate: dateMatch?.[1] || undefined,
      originAirport: airportMatch?.[0] || undefined,
      destinationAirport: airportMatch?.[1] || undefined,
      coverageType: message.toLowerCase().includes("delay") ? "FLIGHT_DELAY" : undefined,
      coverageAmount: undefined,
      confidence: 0.3, // Low confidence for fallback
    };
  }

  /**
   * Determine the user's intent from their message
   */
  private determineIntent(message: string, extractedData: ExtractedFlightData): ChatIntent {
    const lowerMessage = message.toLowerCase();
    
    if (extractedData.confidence > 0.7 && extractedData.flightNumber) {
      return "get_quote";
    }
    
    if (lowerMessage.includes("explain") || lowerMessage.includes("what") || lowerMessage.includes("how")) {
      return "explain_coverage";
    }
    
    if (lowerMessage.includes("buy") || lowerMessage.includes("purchase") || lowerMessage.includes("buy")) {
      return "purchase_policy";
    }
    
    if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
      return "general_support";
    }
    
    return "clarification_needed";
  }

  /**
   * Check if we have sufficient data to generate a quote
   */
  private hasSufficientDataForQuote(extractedData: ExtractedFlightData): boolean {
    return !!(
      extractedData.flightNumber &&
      extractedData.flightDate &&
      extractedData.confidence > 0.5
    );
  }

  /**
   * Generate a quote from extracted flight data
   */
  private async generateQuoteFromExtractedData(
    extractedData: ExtractedFlightData,
    requestId: string
  ): Promise<QuoteGenerationResult> {
    const quoteRequest: InsuranceQuoteRequest = {
      flightNumber: extractedData.flightNumber!,
      flightDate: extractedData.flightDate!,
      coverageType: extractedData.coverageType || "FLIGHT_DELAY",
      coverageAmount: extractedData.coverageAmount || "500.00",
      airports: [extractedData.originAirport, extractedData.destinationAirport].filter((airport): airport is string => airport !== undefined),
      productType: "BASIC",
    };

    this.logger.info(
      `[ChatService] [${requestId}] Generating quote for flight ${quoteRequest.flightNumber}`
    );

    const quoteResponse = await this.quoteService.generateQuote(quoteRequest);

    return {
      quoteId: quoteResponse.quoteId,
      validUntil: quoteResponse.validUntil,
      quotes: quoteResponse.quotes.map(quote => ({
        productName: quote.productName,
        coverageType: quote.coverageType,
        premium: quote.premium,
        coverageAmount: quote.coverageAmount,
        confidence: quote.riskFactors.confidence,
      })),
    };
  }

  /**
   * Generate conversational response based on intent and data
   */
  private async generateConversationalResponse(
    userMessage: string,
    intent: ChatIntent,
    extractedData: ExtractedFlightData,
    quoteResult: QuoteGenerationResult | undefined,
    requestId: string
  ): Promise<string> {
    const responsePrompt = this.buildResponsePrompt(intent, extractedData, quoteResult);
    
    const llmRequest: InsuranceLLMRequest = {
      messages: [
        { role: "system", content: responsePrompt },
        { role: "user", content: userMessage }
      ],
      context: {
        conversationPhase: "quote_gathering"
      },
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 1000
    };

    try {
      const llmResponse = await this.llmClient.generateResponse(llmRequest);
      return llmResponse.message.content;
    } catch (error) {
      this.logger.warn(
        `[ChatService] [${requestId}] LLM response generation failed: ${error}`
      );
      return this.generateFallbackResponse(intent, extractedData, quoteResult);
    }
  }

  /**
   * Build the system prompt for response generation
   */
  private buildResponsePrompt(
    intent: ChatIntent,
    extractedData: ExtractedFlightData,
    quoteResult: QuoteGenerationResult | undefined
  ): string {
    let prompt = `You are a helpful insurance assistant for triggerr.com. Be friendly, professional, and concise.`;

    if (intent === "get_quote" && quoteResult) {
      prompt += `\n\nI found a quote for the user. Present it clearly:\n`;
      quoteResult.quotes.forEach((quote, index) => {
        prompt += `\n${index + 1}. ${quote.productName}: $${parseInt(quote.premium) / 100} premium for $${parseInt(quote.coverageAmount) / 100} coverage`;
      });
      prompt += `\n\nAsk if they'd like to proceed with the purchase.`;
    } else if (intent === "clarification_needed") {
      prompt += `\n\nI need more information to help. Ask for: flight number, date, or coverage preferences.`;
    } else {
      prompt += `\n\nProvide helpful information about flight insurance.`;
    }

    return prompt;
  }

  /**
   * Generate fallback response when LLM fails
   */
  private generateFallbackResponse(
    intent: ChatIntent,
    extractedData: ExtractedFlightData,
    quoteResult: QuoteGenerationResult | undefined
  ): string {
    if (intent === "get_quote" && quoteResult) {
      return `I found insurance options for your flight! ${quoteResult.quotes.length} quote(s) available. Would you like to proceed with a purchase?`;
    }
    
    if (intent === "clarification_needed") {
      return "I need a bit more information to help you. Could you please provide your flight number and date?";
    }
    
    return "I'm here to help with flight insurance! Please let me know your flight details or ask about our coverage options.";
  }

  /**
   * Determine if we should fallback to structured form
   */
  private shouldFallbackToForm(
    intent: ChatIntent,
    extractedData: ExtractedFlightData,
    quoteResult: QuoteGenerationResult | undefined
  ): boolean {
    // Fallback if LLM extraction failed or confidence is very low
    if (extractedData.confidence < 0.3) {
      return true;
    }
    
    // Fallback if user needs clarification but we can't help
    if (intent === "clarification_needed" && extractedData.confidence < 0.5) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate suggested actions for the user
   */
  private generateSuggestedActions(
    intent: ChatIntent,
    extractedData: ExtractedFlightData,
    quoteResult: QuoteGenerationResult | undefined
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    if (intent === "get_quote" && quoteResult) {
      actions.push({
        type: "purchase",
        label: "Purchase Insurance",
        parameters: { quoteId: quoteResult.quoteId }
      });
    }

    if (intent === "clarification_needed") {
      actions.push({
        type: "redirect",
        label: "Use Quote Form",
        parameters: { url: "/quote/form" }
      });
    }

    actions.push({
      type: "redirect",
      label: "Learn More",
      parameters: { url: "/coverage" }
    });

    return actions;
  }
} 