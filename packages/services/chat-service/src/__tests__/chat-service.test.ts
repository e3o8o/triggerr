/**
 * Chat Service Tests
 * 
 * Basic tests to verify the ChatService functionality
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { ChatService } from "../chat-service";
import type { ILLMClient, LLMResponse, LLMMessage } from "@triggerr/llm-interface";
import type { QuoteService } from "@triggerr/quote-engine";
import type { DataRouter } from "@triggerr/data-router";
import { Logger, defaultLogger } from "@triggerr/core";

// Mock implementations
class MockLLMClient implements ILLMClient {
  name = "mock-llm";
  provider = "mock";
  capabilities = {
    supportsStreaming: false,
    supportsSystemPrompts: true,
    supportsImages: false,
    supportsTools: false,
    maxTokens: 4096,
    supportedModels: ["mock-model"],
  };

  async initialize() {}
  isReady() { return true; }
  
  async generateResponse(request: any): Promise<LLMResponse> {
    // Mock response for entity extraction
    if (request.messages[0].content.includes("Extract flight")) {
      // Check if the user message contains flight information
      const userMessage = request.messages[1]?.content || "";
      if (userMessage.includes("flight AA123")) {
        return {
          message: {
            role: "assistant",
            content: JSON.stringify({
              flightNumber: "AA123",
              flightDate: "2025-01-13",
              originAirport: "JFK",
              destinationAirport: "LAX",
              coverageType: "FLIGHT_DELAY",
              coverageAmount: "500",
              confidence: 0.8
            })
          },
          model: "mock-model",
          finishReason: "stop"
        };
      } else {
        // No flight data found
        return {
          message: {
            role: "assistant",
            content: JSON.stringify({
              confidence: 0.1
            })
          },
          model: "mock-model",
          finishReason: "stop"
        };
      }
    }
    
    // Mock response for conversational response
    return {
      message: {
        role: "assistant",
        content: "I found insurance options for your flight! Would you like to proceed with the purchase?"
      },
      model: "mock-model",
      finishReason: "stop"
    };
  }
  
  async testConnection() { return true; }
}

class MockQuoteService {
  async generateQuote(request: any) {
    return {
      quoteId: "quote-123",
      validUntil: new Date(Date.now() + 3600000).toISOString(),
      quotes: [{
        productName: "Flight Delay Shield",
        coverageType: "FLIGHT_DELAY",
        premium: "2500",
        coverageAmount: "50000",
        policyTerms: {
          delayThresholdMinutes: 60,
          maxPayoutAmount: "50000",
          coverageIncludes: ["Flight delays"],
          exclusions: ["Weather events"]
        },
        riskFactors: {
          flightRiskScore: 0.3,
          weatherRiskScore: 0.2,
          overallRiskScore: 0.25,
          confidence: 0.8
        }
      }]
    };
  }
}

class MockDataRouter {
  async getPolicyData() {
    return {
      flightData: {},
      weatherData: []
    };
  }
}

// Use defaultLogger instead of creating a mock

describe("ChatService", () => {
  let chatService: ChatService;
  let mockLLMClient: MockLLMClient;
  let mockQuoteService: MockQuoteService;
  let mockDataRouter: MockDataRouter;

  beforeEach(() => {
    mockLLMClient = new MockLLMClient();
    mockQuoteService = new MockQuoteService() as any;
    mockDataRouter = new MockDataRouter() as any;
    
    chatService = new ChatService(
      mockLLMClient,
      mockQuoteService as any,
      mockDataRouter as any,
      defaultLogger
    );
  });

  describe("Basic Functionality", () => {
    it("should be instantiated correctly", () => {
      expect(chatService).toBeDefined();
      expect(typeof chatService.processMessage).toBe("function");
    });

    it("should process a message with flight information", async () => {
      const request = {
        message: "I need insurance for flight AA123 tomorrow",
        conversationId: "conv-123"
      };

      const response = await chatService.processMessage(request);

      expect(response).toBeDefined();
      expect(response.response).toBeTruthy();
      expect(response.conversationId).toBe("conv-123");
      expect(response.intent).toBe("get_quote");
      expect(response.extractedData).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.fallbackToForm).toBe(false);
    });

    it("should handle messages without sufficient flight data", async () => {
      const request = {
        message: "Hello, I need help with insurance",
        conversationId: "conv-456"
      };

      const response = await chatService.processMessage(request);

      expect(response).toBeDefined();
      expect(response.intent).toBe("general_support");
      expect(response.confidence).toBeLessThan(0.5);
      expect(response.fallbackToForm).toBe(true);
    });

    it("should generate quotes when sufficient data is available", async () => {
      const request = {
        message: "I need insurance for flight AA123 on 2025-01-13",
        conversationId: "conv-789"
      };

      const response = await chatService.processMessage(request);

      expect(response).toBeDefined();
      expect(response.quoteResult).toBeDefined();
      expect(response.quoteResult?.quotes).toHaveLength(1);
      expect(response.quoteResult?.quoteId).toBe("quote-123");
    });
  });

  describe("Error Handling", () => {
    it("should handle LLM failures gracefully", async () => {
      // Override the mock to simulate LLM failure
      mockLLMClient.generateResponse = async () => {
        throw new Error("LLM service unavailable");
      };

      const request = {
        message: "I need insurance for flight AA123",
        conversationId: "conv-error"
      };

      const response = await chatService.processMessage(request);

      expect(response).toBeDefined();
      expect(response.fallbackToForm).toBe(true);
      expect(response.response).toContain("Could you please provide your flight number and date");
    });
  });
}); 