# Chat Service & Quote Engine: Implementation Plan

**Document Version**: 1.0
**Date**: June 27, 2024
**Status**: Strategic Technical Blueprint
**Objective**: To provide a definitive technical plan for implementing the "Chat-to-Quote" feature. This document details the agnostic LLM architecture, the conversational flow, the structured UI fallback, and the critical dependencies on the data aggregation layer.

> **Legal Framework**: Comprehensive regulatory compliance strategy and entity structure documented in [Legal Reference](../04_compliance/LEGAL_REFERENCE.md)

---

## 1. **Executive Summary & Core Principles**

The "Chat-First" interface is a core pillar of the Triggerr user experience. This plan outlines an architecture that is both powerful for users and resilient to external service failures.

**Core Principles**:
1.  **LLM Agnostic**: The `ChatService` will be decoupled from any specific LLM provider (e.g., DeepSeek, OpenAI) via a generic `ILLMClient` interface, allowing us to switch providers with minimal code changes.
2.  **Logic-Driven, LLM-Enhanced**: The LLM will be used for what it excels at: Natural Language Understanding (NLU) and response generation. All core business logic (risk assessment, pricing, quote generation) will be handled by our internal, deterministic services.
3.  **Resilient by Design**: The user interface will offer both a conversational flow and a structured form. This ensures that users can always get a quote, even if the external LLM service is unavailable.
4.  **Multi-Modal Data for Quoting**: The `QuoteEngine` will be designed to consume data from **both** the `FlightAggregator` and the `WeatherAggregator`, enabling sophisticated, multi-factor risk assessment.

---

## 2. **Phase 1: The Agnostic LLM Abstraction Layer**
**Goal**: To create a "socket-and-plugs" architecture for LLM providers, mirroring our successful blockchain abstraction.

**Business Context**: Implemented under Triggerr Direct LLC as first-party provider, leveraging Nevada's innovation-friendly regulatory environment for AI/LLM integration.

*   **Task 1.1: Create the `llm-interface` Package**
    *   **Action**: Create `packages/llm/llm-interface/`.
    *   **Contents**:
        *   `models.ts`: Define generic types like `ChatMessage`, `LLMQueryOptions`, and `LLMResponse`.
        *   `service.ts`: Define the master `ILLMClient` interface with a primary method: `getChatCompletion(messages: ChatMessage[], options?: LLMQueryOptions): Promise<LLMResponse>`.

*   **Task 1.2: Create the `deepseek-adapter` Package**
    *   **Action**: Create `packages/llm/deepseek-adapter/`.
    *   **Contents**:
        *   `index.ts`: Implement a `DeepSeekClient` class that `implements ILLMClient`.
        *   **Logic**: This class will handle authenticating with the DeepSeek API, translating our generic `ChatMessage` format into the format required by their API, making the `fetch` call, and translating the response back into our generic `LLMResponse` format.

---

## 3. **Phase 2: The Data-Driven `QuoteEngine` Service**
**Goal**: To build the core business logic service responsible for risk assessment and price generation.

*   **Task 2.1: Create the `quote-engine` Service**
    *   **Action**: Flesh out the placeholder package `packages/services/quote-engine/`.
    *   **Dependencies**: The `QuoteEngine` service constructor will be injected with:
        *   `FlightAggregator`
        *   `WeatherAggregator`
        *   *(A database client for accessing historical pricing data)*

*   **Task 2.2: Implement `generateQuote` Logic**
    *   **Action**: The primary method, `generateQuote`, will accept a structured object containing flight details and location/date information.
    *   **Workflow**:
        1.  It will call `flightAggregator.getFlightStatus()` to get data on the flight's historical on-time performance.
        2.  It will call `weatherAggregator.getWeatherData()` to get historical weather data for the departure and arrival airports on the given date.
        3.  It will combine this data in a simple risk model (e.g., `risk = (delay_probability * 0.7) + (bad_weather_probability * 0.3)`).
        4.  It will calculate a premium based on the risk score.
        5.  It will save the complete quote (flight details, risk score, premium, coverage, expiration timestamp) to the `quotes` table in the database and return the full quote object, including its unique `quoteId`.

---

## 4. **Phase 3: The `ChatService` Orchestrator**
**Goal**: To implement the service that manages the conversational flow and orchestrates other services.

*   **Task 3.1: Create the `chat-service`**
    *   **Action**: Flesh out the placeholder package `packages/services/chat-service/`.
    *   **Dependencies**: The `ChatService` constructor will be injected with:
        *   `ILLMClient` (the generic interface, not a specific client)
        *   `QuoteEngine`

*   **Task 3.2: Implement the "Chat-to-Quote" Workflow**
    *   **Action**: The main method, `processUserMessage`, will orchestrate the full flow as designed:
        1.  **Entity Extraction**: Make a first call to `this.llmClient` with a system prompt designed to extract structured data (flight number, date, locations) from the user's raw text.
        2.  **Quote Generation**: Pass the extracted entities to `this.quoteEngine.generateQuote()` to get a quote.
        *   **Response Generation**: Make a second call to `this.llmClient` with a system prompt designed to generate a friendly, human-readable response that presents the quote to the user.
        *   **Return**: Send back a structured response to the frontend containing the AI's message, the `conversationId`, the `quoteId` in the context object, and provider information for regulatory compliance.

---

## 5. **Phase 4: API and Frontend Implementation**
**Goal**: To expose the new services via the API and build the resilient UI with entity-aware responses.

### Enhanced Response Structure for Entity Compliance

```typescript
interface ChatMessageResponse {
  // ... existing fields
  provider: "Triggerr Direct" | "Third-Party Marketplace";
  entity: "triggerr-direct-llc" | "parametrigger-inc";
  jurisdiction: "nevada" | "multi-state";
  complianceFramework: "insurance-sandbox" | "surplus-lines";
}
```

*   **Task 5.1: Implement API Endpoints**
    *   **`POST /api/v1/chat/message`**: This handler will receive the user's text, inject the `ChatService`, and call the `processUserMessage` method.
    *   **`POST /api/v1/insurance/quote`**: This is the handler for the structured form. It will bypass the `ChatService` and directly call the `QuoteEngine` with the validated form data.

*   **Task 5.2: Build the Hybrid Frontend UI**
    *   **Action**: Implement the UI in `apps/web/` as designed.
    *   **Components**:
        *   A default view with a chat input that calls the `/chat/message` endpoint.
        *   A "Switch to Advanced Form" button.
        *   A structured form view with fields for airports, date, etc., which calls the `/insurance/quote` endpoint.
    *   **Resilience**: The frontend will include logic to detect if the `/chat/message` endpoint fails (e.g., due to an LLM service outage) and will prompt the user to use the structured form as a fallback.

This comprehensive plan ensures that our chat feature is not only powerful and intuitive but also robust, scalable, and perfectly aligned with our modular, interface-driven architecture while maintaining compliance with our Nevada-based entity structure and regulatory arbitrage strategy.

> **Legal Framework**: Detailed entity responsibilities, AI/LLM compliance requirements, and regulatory considerations documented in [Legal Reference](../04_compliance/LEGAL_REFERENCE.md)
