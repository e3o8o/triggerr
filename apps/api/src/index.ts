import { BlockchainServiceRegistry } from "@triggerr/service-registry";
import { EscrowEngineFactory, EscrowManager } from "@triggerr/escrow-engine";
import { WalletService } from "@triggerr/wallet-service";
import { createApiError, createApiResponse } from "@triggerr/api-contracts";

// --- Domain: User Wallet & Escrows ---
import { handleGetWalletBalance } from "./routes/v1/user/wallet/balance";
import { handleFaucetRequest } from "./routes/v1/user/wallet/faucet";
import { handleSendFunds } from "./routes/v1/user/wallet/send";
import { handleGetWalletInfo } from "./routes/v1/user/wallet/info";
import { handleGetTransactions } from "./routes/v1/user/wallet/transactions";
import { handleGetWalletsSummary } from "./routes/v1/user/wallet/summary";
import { handleGenerateAnonymousWallet } from "./routes/v1/user/wallet/generate-anonymous";
import { handleLinkExistingWallet } from "./routes/v1/user/wallet/link-existing";
import { handleCreateEscrowRequest } from "./routes/v1/user/wallet/escrows/create";
import { handleFulfillEscrowRequest } from "./routes/v1/user/wallet/escrows/fulfill";
import { handleReleaseEscrowRequest } from "./routes/v1/user/wallet/escrows/release";
import { handleGetEscrowById } from "./routes/v1/user/wallet/escrows/[id]";
import { handleGetUserEscrows } from "./routes/v1/user/wallet/escrows/index";

// --- Domain: User Policies & Conversations ---
import { handleListUserPolicies } from "./routes/v1/user/policies";
import { handleGetPolicyById } from "./routes/v1/user/policies/[id]";
import { handleUserPolicyPurchase } from "./routes/v1/user/policies/purchase";
import { handleListConversations } from "./routes/v1/user/conversations";
import { handleGetConversationById } from "./routes/v1/user/conversations/[id]";
import { handleSyncAnonymousConversation } from "./routes/v1/user/conversations/[id]/sync-anonymous";

// --- Domain: Public Policy & Insurance ---
import { handleAnonymousPolicyPurchase } from "./routes/v1/policy/purchase";
import { handleTrackPolicyRequest } from "./routes/v1/policy/track";
import { handleListProducts } from "./routes/v1/insurance/products";
import { handleInsuranceQuote } from "./routes/v1/insurance/quote";

// --- Domain: Health Checks ---
import { handleSystemHealthCheck } from "./routes/v1/health/index";
import { handleDatabaseHealthCheck } from "./routes/v1/health/database";
import { handleBetterAuthHealthCheck } from "./routes/v1/health/better-auth";
import { handleAnonymousSessionsHealthCheck } from "./routes/v1/health/anonymous-sessions";
import { handleWalletHealthCheck } from "./routes/v1/health/wallet";
import { handleEscrowEngineHealthCheck } from "./routes/v1/health/escrow-engine";
import { handleChatHealthCheck } from "./routes/v1/health/chat";

// --- Domain: Authentication ---
import { handleCheckExistence } from "./routes/auth/check-existence";
import { handleAuthRequest } from "./routes/auth/index";

const API_PORT = process.env.API_PORT || 4000;

console.log("🚀 Initializing triggerr API Server Dependencies...");

// ============================================================================
//  SERVICE INSTANTIATION (Dependency Injection)
//  Create a single instance of each core service at startup.
//  These instances will be passed to the route handlers that need them.
// ============================================================================
const blockchainRegistry = new BlockchainServiceRegistry();
const escrowEngineFactory = new EscrowEngineFactory(blockchainRegistry);
const escrowManager = new EscrowManager(escrowEngineFactory);
const walletService = new WalletService(blockchainRegistry);

console.log("✅ Core services instantiated successfully.");

const server = Bun.serve({
  port: API_PORT,
  async fetch(request: Request) {
    const { url, method } = request;
    const { pathname } = new URL(url);

    console.log(`[API] Received: ${method} ${pathname}`);

    // Health Check
    if (pathname === "/") {
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "triggerr API is running.",
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // --- Better Auth Handler ---
    if (
      pathname.startsWith("/api/auth/") &&
      (method === "GET" || method === "POST")
    ) {
      return handleAuthRequest(request);
    }

    // --- API v1 Router ---
    if (pathname.startsWith("/api/v1")) {
      // --- Wallet Routes ---
      if (pathname === "/api/v1/wallet/generate-anonymous" && method === "POST")
        return handleGenerateAnonymousWallet(request, walletService);

      // --- User Wallet & Escrow Routes ---
      if (pathname === "/api/v1/user/wallet/link-existing" && method === "POST")
        return handleLinkExistingWallet(request, walletService);
      if (pathname === "/api/v1/user/wallets/summary" && method === "GET")
        return handleGetWalletsSummary(request, walletService);
      if (pathname === "/api/v1/user/wallet/balance" && method === "GET")
        return handleGetWalletBalance(request, walletService);
      if (pathname === "/api/v1/user/wallet/faucet" && method === "POST")
        return handleFaucetRequest(request, walletService);
      if (pathname === "/api/v1/user/wallet/send" && method === "POST")
        return handleSendFunds(request, walletService);
      if (pathname === "/api/v1/user/wallet/info" && method === "GET")
        return handleGetWalletInfo(request, walletService);
      if (pathname === "/api/v1/user/wallet/transactions" && method === "GET")
        return handleGetTransactions(request, walletService);
      if (
        pathname === "/api/v1/user/wallet/escrows/create" &&
        method === "POST"
      )
        return handleCreateEscrowRequest(request, escrowManager);
      if (
        pathname === "/api/v1/user/wallet/escrows/fulfill" &&
        method === "POST"
      )
        return handleFulfillEscrowRequest(request, escrowManager);
      if (
        pathname === "/api/v1/user/wallet/escrows/release" &&
        method === "POST"
      )
        return handleReleaseEscrowRequest(request, escrowManager);
      if (pathname === "/api/v1/user/wallet/escrows" && method === "GET")
        return handleGetUserEscrows(request); // Note: This handler might need escrowManager
      if (
        pathname.startsWith("/api/v1/user/wallet/escrows/") &&
        method === "GET"
      )
        return handleGetEscrowById(request); // Note: This handler might need escrowManager

      // --- User Policy & Conversation Routes (No service injection needed yet) ---
      if (pathname === "/api/v1/user/policies" && method === "GET")
        return handleListUserPolicies(request);
      if (pathname.startsWith("/api/v1/user/policies/") && method === "GET")
        return handleGetPolicyById(request);
      if (pathname === "/api/v1/user/policies/purchase" && method === "POST")
        return handleUserPolicyPurchase(request); // Will need EscrowManager later
      if (pathname === "/api/v1/user/conversations" && method === "GET")
        return handleListConversations(request);
      if (
        pathname.startsWith("/api/v1/user/conversations/") &&
        pathname.endsWith("/sync-anonymous") &&
        method === "POST"
      )
        return handleSyncAnonymousConversation(request);
      if (
        pathname.startsWith("/api/v1/user/conversations/") &&
        method === "GET"
      )
        return handleGetConversationById(request);

      // --- User Auth Routes (No service injection needed) ---
      if (pathname === "/api/v1/auth/check-existence" && method === "POST")
        return handleCheckExistence(request);

      // --- Health Check Routes (No service injection needed) ---
      if (pathname === "/api/v1/health" && method === "GET")
        return handleSystemHealthCheck(request);
      if (pathname === "/api/v1/health/database" && method === "GET")
        return handleDatabaseHealthCheck(request);
      if (pathname === "/api/v1/health/better-auth" && method === "GET")
        return handleBetterAuthHealthCheck(request);
      if (pathname === "/api/v1/health/anonymous-sessions" && method === "GET")
        return handleAnonymousSessionsHealthCheck(request);
      if (pathname === "/api/v1/health/wallet" && method === "GET")
        return handleWalletHealthCheck(request);
      if (pathname === "/api/v1/health/escrow-engine" && method === "GET")
        return handleEscrowEngineHealthCheck(request);
      if (pathname === "/api/v1/health/chat" && method === "GET")
        return handleChatHealthCheck(request);

      // --- Public Policy & Insurance Routes (Will need services later) ---
      if (pathname === "/api/v1/policy/purchase" && method === "POST")
        return handleAnonymousPolicyPurchase(request); // Will need EscrowManager
      if (pathname === "/api/v1/policy/track" && method === "GET")
        return handleTrackPolicyRequest(request);
      if (pathname === "/api/v1/insurance/products" && method === "GET")
        return handleListProducts(request);
      if (pathname === "/api/v1/insurance/quote" && method === "POST")
        return handleInsuranceQuote(request); // Will need QuoteEngine
    }

    // Default 404
    return new Response(
      JSON.stringify(
        createApiError(
          "NOT_FOUND",
          `Endpoint ${method} ${pathname} not found.`,
        ),
      ),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  },
  error(error) {
    console.error("[API] Unhandled server error:", error);
    return new Response(
      JSON.stringify(
        createApiError(
          "SERVER_ERROR",
          "An unexpected internal error occurred.",
        ),
      ),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  },
});

console.log(`✅ triggerr API listening on http://localhost:${server.port}`);
