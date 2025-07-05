import { Lock, CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import React, { useState, useEffect } from "react";

// --- TYPE DEFINITIONS ---

interface CartItem {
  name: string;
  description: string;
  price: string;
}

interface CheckoutTabProps {
  isAuthenticated: boolean;
  user: any;
  cartItems: CartItem[];
  signIn: (provider: "google", options: { callbackURL: string }) => void;
  anonymousSessionId: string | null;
}

type AnonymousWalletState = "idle" | "creating" | "funding" | "finalizing";
type PaymentStatus = "idle" | "processing" | "success";

// --- COMPONENT ---

const CheckoutTab: React.FC<CheckoutTabProps> = ({
  isAuthenticated,
  user,
  cartItems,
  signIn,
  anonymousSessionId,
}) => {
  // --- STATE ---
  const [policyholder, setPolicyholder] = useState({ name: "", email: "" });
  const [anonymousWallet, setAnonymousWallet] = useState<{
    state: AnonymousWalletState;
    address: string | null;
    privateKey: string | null;
  }>({ state: "idle", address: null, privateKey: null });
  const [paymentResult, setPaymentResult] = useState<{
    status: PaymentStatus;
    message: string | null;
    code: string | null;
  }>({ status: "idle", message: null, code: null });

  // --- EFFECTS ---
  useEffect(() => {
    if (isAuthenticated && user) {
      setPolicyholder({ name: user.name || "", email: user.email || "" });
    } else {
      setPolicyholder({ name: "", email: "" });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    setAnonymousWallet({ state: "idle", address: null, privateKey: null });
    setPaymentResult({ status: "idle", message: null, code: null });
  }, [cartItems]);

  // --- DATA & COMPUTED VALUES ---
  const total = cartItems
    .reduce((sum, item) => sum + parseFloat(item.price), 0)
    .toFixed(2);

  // --- EVENT HANDLERS ---
  const handleSimulatedPayment = (method: "Stripe" | "PayGo") => {
    setPaymentResult({
      status: "processing",
      message: "Processing your payment...",
      code: null,
    });
    setTimeout(() => {
      const mockCode = `MOCK_CODE_${Date.now()}`;
      setPaymentResult({
        status: "success",
        message: `Payment with ${method} successful!`,
        code: mockCode,
      });
    }, 1500);
  };

  const handleAnonymousWalletCreation = () => {
    setAnonymousWallet({ state: "creating", address: null, privateKey: null });
    setTimeout(() => {
      const mockAddress = `0x${[...Array(40)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")}`;
      const mockPrivateKey = `0x${[...Array(64)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")}`;
      setAnonymousWallet({
        state: "funding",
        address: mockAddress,
        privateKey: mockPrivateKey,
      });
    }, 2000);
  };

  const handlePayGoClick = () => {
    if (isAuthenticated) {
      handleSimulatedPayment("PayGo");
    } else {
      handleAnonymousWalletCreation();
    }
  };

  const handleFinalizeAnonymousPayment = () => {
    setAnonymousWallet((prev) => ({ ...prev, state: "finalizing" }));
    handleSimulatedPayment("PayGo");
  };

  const handleCreateAccount = () => {
    if (anonymousSessionId && paymentResult.code) {
      sessionStorage.setItem("migration_anonymous_id", anonymousSessionId);
      sessionStorage.setItem("migration_policy_code", paymentResult.code);
    }
    signIn("google", { callbackURL: "/dev-dashboard" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Private key copied to clipboard!");
  };

  // --- RENDER LOGIC ---

  if (cartItems.length === 0) {
    return (
      <div className="text-center bg-white p-10 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700">Checkout</h2>
        <p className="text-gray-500 mt-2">
          Your cart is empty. Please add an item from the Chat tab to proceed.
        </p>
      </div>
    );
  }

  const renderPaymentCardContent = () => {
    switch (paymentResult.status) {
      case "processing":
        return (
          <div className="text-center text-gray-600 p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            {paymentResult.message}
          </div>
        );
      case "success":
        return (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">
                {paymentResult.message}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Your Policy Verification Code is:
              </p>
              <p className="font-mono text-xs bg-green-100 text-green-900 p-2 rounded mt-1">
                {paymentResult.code}
              </p>
            </div>
            {!isAuthenticated && (
              <>
                {anonymousWallet.privateKey && (
                  <div className="mt-4 pt-4 border-t border-green-200 text-left">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle size={20} />
                      <h4 className="font-bold">
                        Action Required: Save Your Key
                      </h4>
                    </div>
                    <p className="text-xs text-yellow-900 bg-yellow-100 p-2 rounded mt-2">
                      This is your **only** chance to save the private key for
                      your temporary wallet. You will need it to access any
                      future payouts.
                    </p>
                    <div className="mt-2 p-2 bg-gray-700 text-white rounded font-mono text-xs break-all">
                      {anonymousWallet.privateKey}
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(anonymousWallet.privateKey || "")
                      }
                      className="w-full mt-2 p-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Copy Private Key
                    </button>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-green-200 text-left">
                  <h4 className="font-bold text-gray-800">Next Step</h4>
                  <p className="text-xs text-gray-600 mt-1 mb-2">
                    Create an account to save your policy, manage your wallet
                    without a private key, and view your transaction history.
                  </p>
                  <button
                    onClick={handleCreateAccount}
                    className="w-full p-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Create a Secure Account (with Google)
                  </button>
                </div>
              </>
            )}
          </div>
        );
      case "idle":
      default:
        if (anonymousWallet.state === "creating") {
          return (
            <div className="text-center text-gray-600 p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              Creating your secure, temporary wallet...
            </div>
          );
        }
        if (anonymousWallet.state === "funding") {
          return (
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-gray-800">
                Action Required: Fund Your Wallet
              </h3>
              <p className="text-sm text-gray-600">
                Please send exactly **${total}** to the address below to
                complete your purchase.
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <QRCodeSVG
                  value={anonymousWallet.address || ""}
                  size={128}
                  className="mx-auto"
                />
                <p className="font-mono text-xs text-gray-700 break-all mt-3">
                  {anonymousWallet.address}
                </p>
              </div>
              <button
                onClick={handleFinalizeAnonymousPayment}
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                I have sent the funds. Finalize Payment.
              </button>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <button
              onClick={() => handleSimulatedPayment("Stripe")}
              className="w-full p-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              <CreditCard size={20} />
              <span>Pay with Card (Stripe)</span>
            </button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-sm text-gray-500">OR</span>
              </div>
            </div>
            <button
              onClick={handlePayGoClick}
              className="w-full p-3 bg-indigo-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700"
            >
              <Lock size={20} />
              <span>
                {isAuthenticated
                  ? "Pay with triggerr Wallet"
                  : "Pay with PayGo Wallet"}
              </span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Summary and Details */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Order Summary
          </h2>
          <div className="space-y-3">
            {cartItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <p className="text-gray-700">{item.name}</p>
                <p className="font-medium">${item.price}</p>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t flex justify-between items-center font-bold text-lg">
              <p>Total</p>
              <p>${total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Policyholder Details
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name {isAuthenticated ? "" : "(Optional)"}
              </label>
              <input
                type="text"
                id="name"
                value={policyholder.name}
                onChange={(e) =>
                  setPolicyholder({ ...policyholder, name: e.target.value })
                }
                placeholder="Enter your full name"
                className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                disabled={isAuthenticated}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address {isAuthenticated ? "" : "(Optional)"}
              </label>
              <input
                type="email"
                id="email"
                value={policyholder.email}
                onChange={(e) =>
                  setPolicyholder({ ...policyholder, email: e.target.value })
                }
                placeholder="Enter your email address"
                className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                disabled={isAuthenticated}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Payment */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment</h2>
          {renderPaymentCardContent()}
        </div>
      </div>
    </div>
  );
};

export default CheckoutTab;
