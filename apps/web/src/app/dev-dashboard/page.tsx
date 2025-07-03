"use client";

import React, { useState, useEffect, useCallback, FC } from "react";
import { useAuth, useAnonymousSession } from "@/lib/auth-client";
import type { EscrowPurpose } from "@triggerr/core";
import { fetchTravelImages, UnsplashImage } from "@/lib/image-fetcher";

// Import Tab Components
import SystemTab from "./components/SystemTab";
import WalletTab from "./components/WalletTab";
import CartTab from "./components/CartTab";
import ChatTab from "./components/ChatTab";
import TrackPolicyTab from "./components/TrackPolicyTab";
import CheckoutTab from "./components/CheckoutTab";
import MyPoliciesTab from "./components/MyPoliciesTab";
import ReconciliationModal from "./components/ReconciliationModal";

// --- TYPE DEFINITIONS ---

interface CartItem {
  name: string;
  description: string;
  price: string;
}

interface Policy {
  id: string;
  flightSummary: string;
  status: "ACTIVE" | "EXPIRED" | "PAID_OUT";
  verificationCode: string;
  premium: string;
  coverage: string;
}

interface ReconciliationData {
  isOpen: boolean;
  policyCode: string | null;
  temporaryPrivateKey: string | undefined;
}

// --- IMAGE TYPE DEFINITIONS ---

// --- MAIN PARENT COMPONENT ---

const DevDashboardPage: FC = () => {
  // --- IMAGE STATE ---
  const [backgroundImages, setBackgroundImages] = useState<UnsplashImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // --- HOOKS ---
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const { anonymousSessionId } = useAnonymousSession();

  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<
    "chat" | "cart" | "checkout" | "track" | "policies" | "wallet" | "system"
  >("system");

  const [isMigrating, setIsMigrating] = useState(false);
  const [isUserSetupComplete, setIsUserSetupComplete] = useState(false);
  const [reconciliationData, setReconciliationData] =
    useState<ReconciliationData>({
      isOpen: false,
      policyCode: null,
      temporaryPrivateKey: undefined,
    });

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);

  const [operationResult, setOperationResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // --- HELPER FUNCTIONS ---

  const showResult = (type: "success" | "error", message: string) => {
    setOperationResult({ type, message });
    setTimeout(() => setOperationResult(null), 5000);
  };

  const handleManualRotate = () => {
    if (backgroundImages.length > 1) {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % backgroundImages.length,
      );
    }
  };

  // --- DATA FETCHING & ACTIONS ---

  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => [...prev, item]);
    showResult("success", "Sample Quote added to cart!");
  };

  const handleRemoveFromCart = (indexToRemove: number) => {
    setCartItems((prev) => prev.filter((_, index) => index !== indexToRemove));
    showResult("success", "Item removed from cart.");
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length > 0) setActiveTab("checkout");
    else showResult("error", "Your cart is empty.");
  };

  const handleCloseReconciliation = () => {
    // When user decides later, add the policy but mark it as linked to temporary wallet
    if (reconciliationData.policyCode) {
      const tempPolicy: Policy = {
        id: reconciliationData.policyCode,
        flightSummary: "Flight BA245 - LHR to JFK (Temporary Wallet)",
        status: "ACTIVE",
        verificationCode: reconciliationData.policyCode,
        premium: "25.00",
        coverage: "500.00",
      };
      setPolicies((prev) => [...prev, tempPolicy]);
      showResult(
        "success",
        `Policy ${reconciliationData.policyCode} added to your account. Note: This policy is linked to a temporary wallet.`,
      );
    }
    setReconciliationData({
      isOpen: false,
      policyCode: null,
      temporaryPrivateKey: undefined,
    });
    setIsUserSetupComplete(true);
  };

  const handleConsolidateWallet = () => {
    console.log("[Dev Dashboard] Starting wallet consolidation process");

    // Add the policy to the user's main account
    if (reconciliationData.policyCode) {
      const consolidatedPolicy: Policy = {
        id: reconciliationData.policyCode,
        flightSummary: "Flight BA245 - LHR to JFK (Consolidated)",
        status: "ACTIVE",
        verificationCode: reconciliationData.policyCode,
        premium: "25.00",
        coverage: "500.00",
      };
      setPolicies((prev) => [...prev, consolidatedPolicy]);
    }

    showResult(
      "success",
      `Wallet consolidated successfully! Policy ${reconciliationData.policyCode} has been moved to your primary wallet.`,
    );

    // Clear reconciliation data and complete setup
    setReconciliationData({
      isOpen: false,
      policyCode: null,
      temporaryPrivateKey: undefined,
    });
    setIsUserSetupComplete(true);
  };

  const handleExportPrivateKey = () => {
    console.log("[Dev Dashboard] Private key export completed");

    // Add the policy but mark it as separate wallet
    if (reconciliationData.policyCode) {
      const separatePolicy: Policy = {
        id: reconciliationData.policyCode,
        flightSummary: "Flight BA245 - LHR to JFK (Separate Wallet)",
        status: "ACTIVE",
        verificationCode: reconciliationData.policyCode,
        premium: "25.00",
        coverage: "500.00",
      };
      setPolicies((prev) => [...prev, separatePolicy]);
    }

    showResult(
      "success",
      `Private key exported successfully! You now have full control of the temporary wallet containing policy ${reconciliationData.policyCode}.`,
    );

    // Clear reconciliation data and complete setup
    setReconciliationData({
      isOpen: false,
      policyCode: null,
      temporaryPrivateKey: undefined,
    });
    setIsUserSetupComplete(true);
  };

  // --- DATA FETCHING & ACTIONS (Images) ---
  const fetchImages = useCallback(async () => {
    try {
      console.log("[ChatTab] Fetching travel images from dual sources");
      const images = await fetchTravelImages();
      if (images.length > 0) {
        console.log(`[ChatTab] Successfully loaded ${images.length} images`);
        setBackgroundImages(images);
      } else {
        console.warn("[ChatTab] No images available from any source");
      }
    } catch (error) {
      console.error("[ChatTab] Failed to fetch images:", error);
    }
  }, []);

  // --- EFFECTS ---

  useEffect(() => {
    const handleUserSetup = async () => {
      console.log(
        "[Dev Dashboard] Starting user setup process for:",
        user?.email || "no email",
      );

      // Wait for session cookie to be established to prevent 401 errors
      await new Promise((resolve) => setTimeout(resolve, 100));

      const anonId = sessionStorage.getItem("migration_anonymous_id");
      const policyCode = sessionStorage.getItem("migration_policy_code");

      console.log(
        "[Dev Dashboard] Migration data check - anonId:",
        anonId ? "present" : "none",
        "policyCode:",
        policyCode || "none",
      );

      if (anonId && policyCode) {
        try {
          // Validate user email before making API call
          if (
            !user?.email ||
            typeof user.email !== "string" ||
            !user.email.includes("@")
          ) {
            console.error(
              "Invalid user email for existence check:",
              user?.email,
            );
            // Fallback to new user flow if email is invalid
            setIsMigrating(true);
            setTimeout(() => {
              const newPolicy: Policy = {
                id: policyCode,
                flightSummary: "Flight BA245 - LHR to JFK (Migrated)",
                status: "ACTIVE",
                verificationCode: policyCode,
                premium: "25.00",
                coverage: "500.00",
              };
              setPolicies((prev) => [...prev, newPolicy]);
              setCartItems([]);
              showResult(
                "success",
                `Welcome! Your policy ${policyCode} has been linked to your new account.`,
              );
              setActiveTab("policies");
              setIsMigrating(false);
              setIsUserSetupComplete(true);
            }, 2500);
            sessionStorage.removeItem("migration_anonymous_id");
            sessionStorage.removeItem("migration_policy_code");
            return;
          }

          const checkRes = await fetch("/api/v1/auth/check-existence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          });

          if (!checkRes.ok) {
            console.warn("Session not ready, retrying user setup...");
            // Retry after a longer delay if session isn't ready
            setTimeout(() => {
              // Only retry if still not setup complete
              if (!isUserSetupComplete) {
                handleUserSetup();
              }
            }, 500);
            return;
          }

          const response = await checkRes.json();
          const exists = response.data?.exists ?? false;

          console.log("[Dev Dashboard] Check existence API response:", {
            success: response.success,
            exists: exists,
            email: response.data?.email,
            responseStructure: Object.keys(response),
          });

          if (exists) {
            console.log(
              "[Dev Dashboard] Existing user detected - showing reconciliation modal",
            );
            // Generate a mock temporary private key for the demo
            const mockPrivateKey =
              "0x" +
              crypto.randomUUID().replace(/-/g, "") +
              crypto.randomUUID().replace(/-/g, "").substring(0, 32);
            setReconciliationData({
              isOpen: true,
              policyCode,
              temporaryPrivateKey: mockPrivateKey,
            });
          } else {
            console.log(
              "[Dev Dashboard] New user detected - starting migration flow",
            );
            setIsMigrating(true);
            setTimeout(() => {
              const newPolicy: Policy = {
                id: policyCode,
                flightSummary: "Flight BA245 - LHR to JFK (Migrated)",
                status: "ACTIVE",
                verificationCode: policyCode,
                premium: "25.00",
                coverage: "500.00",
              };
              setPolicies((prev) => [...prev, newPolicy]);
              setCartItems([]);
              showResult(
                "success",
                `Welcome! Your policy ${policyCode} has been linked to your new account.`,
              );
              setActiveTab("policies");
              setIsMigrating(false);
              setIsUserSetupComplete(true);
            }, 2500);
          }
          sessionStorage.removeItem("migration_anonymous_id");
          sessionStorage.removeItem("migration_policy_code");
        } catch (error) {
          console.error(
            "[Dev Dashboard] Error during user setup:",
            error,
            "- Falling back to regular authenticated user setup",
          );
          // Fallback to setting up as regular authenticated user
          setPolicies([
            {
              id: "POL98765",
              flightSummary: "Flight UA123 - SFO to EWR",
              status: "ACTIVE",
              verificationCode: "MOCK_CODE_AUTH1",
              premium: "35.50",
              coverage: "600.00",
            },
          ]);
          setIsUserSetupComplete(true);
        }
      } else {
        console.log(
          "[Dev Dashboard] No migration data - setting up regular authenticated user",
        );
        setPolicies([
          {
            id: "POL98765",
            flightSummary: "Flight UA123 - SFO to EWR",
            status: "ACTIVE",
            verificationCode: "MOCK_CODE_AUTH1",
            premium: "35.50",
            coverage: "600.00",
          },
        ]);
        setIsUserSetupComplete(true);
      }
    };

    console.log("[Dev Dashboard] useEffect triggered with state:", {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email || "none",
      isUserSetupComplete,
    });

    if (isAuthenticated && user && !isUserSetupComplete) {
      handleUserSetup();
    } else if (!isAuthenticated) {
      console.log(
        "[Dev Dashboard] User not authenticated - clearing setup state",
      );
      setIsUserSetupComplete(false);
      setPolicies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // Effect to periodically fetch a new list of images
  useEffect(() => {
    // Fetch images immediately when the component mounts
    fetchImages();

    // Set up an interval to re-fetch every 30 minutes
    const fetchInterval = setInterval(() => {
      console.log(
        "[ChatTab] 30-minute interval elapsed. Fetching new image list...",
      );
      fetchImages();
    }, 1800000); // 30 minutes in milliseconds

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(fetchInterval);
  }, [fetchImages]);

  // Effect to rotate through the currently fetched images
  useEffect(() => {
    if (backgroundImages.length > 1) {
      // Set up an interval to rotate images every 5 minutes
      const rotationInterval = setInterval(() => {
        setCurrentImageIndex(
          (prevIndex) => (prevIndex + 1) % backgroundImages.length,
        );
      }, 300000); // 5 minutes in milliseconds

      // Cleanup function to clear the interval
      return () => clearInterval(rotationInterval);
    }
    // No-op if there aren't enough images to rotate
    return undefined;
  }, [backgroundImages]);

  // --- RENDER LOGIC ---

  if (isMigrating) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">
          Finalizing Your Account
        </h2>
        <p className="text-gray-600 mt-2">
          Welcome! We&apos;re linking the policy from your guest session to your
          new account. Please wait...
        </p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "system":
        return (
          <SystemTab
            user={user}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            anonymousSessionId={anonymousSessionId}
            signIn={signIn}
            signOut={signOut}
          />
        );
      case "wallet":
        return (
          <WalletTab isAuthenticated={isAuthenticated} isLoading={isLoading} />
        );
      case "cart":
        return (
          <CartTab
            cartItems={cartItems}
            handleRemoveFromCart={handleRemoveFromCart}
            handleProceedToCheckout={handleProceedToCheckout}
          />
        );
      case "checkout":
        return (
          <CheckoutTab
            isAuthenticated={isAuthenticated}
            user={user}
            cartItems={cartItems}
            signIn={signIn}
            anonymousSessionId={anonymousSessionId}
          />
        );
      case "track":
        return <TrackPolicyTab />;
      case "policies":
        return (
          <MyPoliciesTab
            isAuthenticated={isAuthenticated}
            policies={policies}
          />
        );
      case "chat":
        return (
          <ChatTab
            handleAddToCart={handleAddToCart}
            backgroundImages={backgroundImages}
            currentImageIndex={currentImageIndex}
            handleManualRotate={handleManualRotate}
          />
        );
      default:
        return null;
    }
  };

  const navTabs = [
    { id: "chat", label: "Chat" },
    { id: "cart", label: "Cart" },
    { id: "checkout", label: "Checkout" },
    { id: "track", label: "Track Policy" },
    ...(isAuthenticated ? [{ id: "policies", label: "My Policies" }] : []),
    { id: "wallet", label: "Wallet" },
    { id: "system", label: "System & Auth" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <ReconciliationModal
          isOpen={reconciliationData.isOpen}
          onClose={handleCloseReconciliation}
          onConsolidate={handleConsolidateWallet}
          onExportKey={handleExportPrivateKey}
          policyCode={reconciliationData.policyCode}
          {...(reconciliationData.temporaryPrivateKey && {
            temporaryPrivateKey: reconciliationData.temporaryPrivateKey,
          })}
        />

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          [MVPv0 Dev Dashboard] triggerr{" "}
          <span className="text-lg sm:text-xl text-gray-600 font-medium italic">
            - flight delays, instantly covered.
          </span>
        </h1>

        {operationResult && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              operationResult.type === "success"
                ? "bg-green-100 border border-green-200 text-green-800"
                : "bg-red-100 border border-red-200 text-red-800"
            }`}
          >
            {operationResult.message}
          </div>
        )}

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 overflow-x-auto">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | "chat"
                        | "cart"
                        | "checkout"
                        | "track"
                        | "policies"
                        | "wallet"
                        | "system",
                    )
                  }
                  className={`py-3 px-1 text-sm font-medium whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.id === "cart" && cartItems.length > 0 && (
                    <span className="ml-2 w-5 h-5 bg-blue-600 text-white text-xs font-bold flex items-center justify-center rounded-full">
                      {cartItems.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div>{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default DevDashboardPage;
