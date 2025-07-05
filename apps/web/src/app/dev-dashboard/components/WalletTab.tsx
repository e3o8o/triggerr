import { QRCodeSVG } from "qrcode.react";
import { ArrowDown, ArrowUp, QrCode } from "lucide-react";
import { createHttpClient } from "@triggerr/api-sdk";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { EscrowPurpose } from "@triggerr/core";

// --- TYPE DEFINITIONS ---

interface WalletInfo {
  walletAddress: string;
  balance: string;
  formattedBalance?: string;
}

interface Transaction {
  id: string;
  type: "receive" | "send";
  amount: string;
  formattedAmount?: string;
  from?: string;
  to?: string;
  date: string;
  hash: string;
}

interface EscrowItem {
  id: string;
  blockchainId: string;
  amount: string;
  status: string;
  expirationDate?: string;
  recipientAddress?: string;
  purpose?: string;
  creatorUserId?: string;
}

interface UserEscrowsResponse {
  created: EscrowItem[];
  assigned: EscrowItem[];
}

interface WalletTabProps {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const WalletTab: React.FC<WalletTabProps> = ({
  isAuthenticated,
  isLoading,
}) => {
  // Component State
  const [activeSubTab, setActiveSubTab] = useState("transactions");
  const [showQr, setShowQr] = useState(false);

  // Data State
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [escrows, setEscrows] = useState<UserEscrowsResponse>({
    created: [],
    assigned: [],
  });

  // Loading State
  const [isFetchingWallet, setIsFetchingWallet] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingEscrows, setIsLoadingEscrows] = useState(false);

  // Form State
  const [sendForm, setSendForm] = useState({ recipient: "", amount: "" });
  const [faucetForm, setFaucetForm] = useState({ amount: "" });
  const [createEscrowForm, setCreateEscrowForm] = useState({
    fulfiller: "",
    amount: "",
    expiration: "",
    purpose: "DEPOSIT" as EscrowPurpose,
  });
  const [manageEscrowForm, setManageEscrowForm] = useState({ escrowId: "" });

  // API Client
  const apiClient = useMemo(
    () =>
      createHttpClient({
        baseURL:
          process.env.NODE_ENV === "production"
            ? "https://insureinnie.com"
            : "http://localhost:3000",
      }),
    [],
  );

  // Fetch wallet information
  const fetchWalletInfo = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsFetchingWallet(true);
    try {
      const response = await apiClient.get("/api/v1/user/wallet/info");
      if (response.success && response.data) {
        const data = response.data as any;
        setWalletInfo({
          walletAddress: data.walletAddress,
          balance: data.balance,
          formattedBalance: data.formattedBalance,
        });
      }
    } catch (error) {
      console.error("Failed to fetch wallet info:", error);
      // Try fallback wallet creation
      try {
        const createResponse = await apiClient.post(
          "/api/v1/user/wallet/create",
          {},
        );
        if (createResponse.success) {
          // Retry fetching wallet info
          const retryResponse = await apiClient.get("/api/v1/user/wallet/info");
          if (retryResponse.success && retryResponse.data) {
            const retryData = retryResponse.data as any;
            setWalletInfo({
              walletAddress: retryData.walletAddress,
              balance: retryData.balance,
              formattedBalance: retryData.formattedBalance,
            });
          }
        }
      } catch (createError) {
        console.error("Failed to create wallet:", createError);
      }
    } finally {
      setIsFetchingWallet(false);
    }
  }, [isAuthenticated, apiClient]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated || !walletInfo) return;

    setIsLoadingTransactions(true);
    try {
      const response = await apiClient.get("/api/v1/user/wallet/transactions");
      if (response.success && response.data) {
        const data = response.data as any;
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [isAuthenticated, walletInfo, apiClient]);

  // Fetch escrows
  const fetchEscrows = useCallback(async () => {
    if (!isAuthenticated || !walletInfo) return;

    setIsLoadingEscrows(true);
    try {
      const response = await apiClient.get("/api/v1/user/wallet/escrows");
      if (response.success && response.data) {
        const data = response.data as any;
        setEscrows(data || { created: [], assigned: [] });
      }
    } catch (error) {
      console.error("Failed to fetch escrows:", error);
    } finally {
      setIsLoadingEscrows(false);
    }
  }, [isAuthenticated, walletInfo, apiClient]);

  // Handle send funds
  const handleSendFunds = async (recipient: string, amount: string) => {
    try {
      const response = await apiClient.post("/api/v1/user/wallet/send", {
        toAddress: recipient,
        amount: Math.round(parseFloat(amount) * 100),
      });

      if (response.success) {
        alert("Funds sent successfully!");
        setSendForm({ recipient: "", amount: "" });
        fetchWalletInfo();
        fetchTransactions();
      } else {
        alert(
          `Failed to send funds: ${response.error?.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error sending funds:", error);
      alert("Failed to send funds. Please try again.");
    }
  };

  // Handle faucet request
  const handleFaucetRequest = async (amount: string) => {
    try {
      const response = await apiClient.post("/api/v1/user/wallet/faucet", {
        amount: Math.round(parseFloat(amount) * 100),
      });

      if (response.success) {
        alert("Faucet request successful!");
        setFaucetForm({ amount: "" });
        fetchWalletInfo();
        fetchTransactions();
      } else {
        alert(
          `Faucet request failed: ${response.error?.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error requesting faucet:", error);
      alert("Faucet request failed. Please try again.");
    }
  };

  // Handle create escrow
  const handleCreateEscrow = async (
    fulfiller: string,
    amount: string,
    expiration: string,
    purpose: EscrowPurpose,
  ) => {
    try {
      const response = await apiClient.post(
        "/api/v1/user/wallet/escrows/create",
        {
          fulfillerAddress: fulfiller,
          amount: Math.round(parseFloat(amount) * 100),
          expirationDate: expiration,
          purpose,
        },
      );

      if (response.success) {
        alert("Escrow created successfully!");
        setCreateEscrowForm({
          fulfiller: "",
          amount: "",
          expiration: "",
          purpose: "DEPOSIT" as EscrowPurpose,
        });
        fetchEscrows();
        fetchWalletInfo();
      } else {
        alert(
          `Failed to create escrow: ${response.error?.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error creating escrow:", error);
      alert("Failed to create Schema.escrowSchema. Please try again.");
    }
  };

  // Handle fulfill escrow
  const handleFulfillEscrow = async (escrowId: string) => {
    try {
      const response = await apiClient.post(
        `/api/v1/user/wallet/escrows/${escrowId}/fulfill`,
        {},
      );

      if (response.success) {
        alert("Escrow fulfilled successfully!");
        fetchEscrows();
        fetchWalletInfo();
      } else {
        alert(
          `Failed to fulfill escrow: ${response.error?.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error fulfilling escrow:", error);
      alert("Failed to fulfill Schema.escrowSchema. Please try again.");
    }
  };

  // Handle release escrow
  const handleReleaseEscrow = async (escrowId: string) => {
    try {
      const response = await apiClient.post(
        `/api/v1/user/wallet/escrows/${escrowId}/release`,
        {},
      );

      if (response.success) {
        alert("Escrow released successfully!");
        fetchEscrows();
        fetchWalletInfo();
      } else {
        alert(
          `Failed to release escrow: ${response.error?.message || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error releasing escrow:", error);
      alert("Failed to release Schema.escrowSchema. Please try again.");
    }
  };

  // Effects
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchWalletInfo();
    }
  }, [isAuthenticated, isLoading, fetchWalletInfo]);

  useEffect(() => {
    if (walletInfo) {
      fetchTransactions();
      fetchEscrows();
    }
  }, [walletInfo, fetchTransactions, fetchEscrows]);

  const formatBalance = (amount: string | number): string => {
    try {
      const numericAmount = Number(amount);
      if (isNaN(numericAmount)) return "0.00";
      return numericAmount.toFixed(2);
    } catch (error) {
      console.error("Error formatting balance:", error);
      return "0.00";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center bg-white p-10 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700">Wallet Access</h2>
        <p className="text-gray-500 mt-2">
          Please sign in to access wallet operations.
        </p>
      </div>
    );
  }

  if (isLoading || isFetchingWallet) {
    return <div className="text-center p-10">Loading Wallet...</div>;
  }

  if (!walletInfo) {
    return (
      <div className="text-center bg-white p-10 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-yellow-700">
          Wallet Not Found
        </h2>
        <p className="text-gray-500 mt-2">
          Could not retrieve wallet information. Your account may not have a
          wallet created yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1: Wallet & Core Actions */}
      <div className="lg:col-span-1 space-y-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-800">My Wallet</h3>
            <button
              onClick={fetchWalletInfo}
              disabled={isFetchingWallet}
              className="px-3 py-1 bg-gray-100 border border-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              {isFetchingWallet ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div className="flex justify-between items-end">
            <div className="font-mono text-sm text-gray-600 break-all pr-4">
              {walletInfo.walletAddress}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-bold text-gray-800">
                {walletInfo.formattedBalance || `$${walletInfo.balance}`}
              </p>
              <p className="text-xs text-gray-500">USD</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setShowQr(!showQr)}
              className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded-md hover:bg-gray-800 flex items-center gap-2"
            >
              <QrCode size={16} />
              {showQr ? "Hide QR" : "Receive"}
            </button>
            {showQr && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md text-center border border-gray-200">
                <QRCodeSVG
                  value={walletInfo.walletAddress}
                  size={128}
                  className="mx-auto"
                  bgColor="transparent"
                />
                <p className="text-center text-xs mt-2 text-gray-500 font-mono">
                  {walletInfo.walletAddress}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Send Funds</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Recipient Address (0x...)"
              value={sendForm.recipient}
              onChange={(e) =>
                setSendForm({ ...sendForm, recipient: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="number"
              placeholder="Amount (e.g., 10.50)"
              value={sendForm.amount}
              onChange={(e) =>
                setSendForm({ ...sendForm, amount: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={() =>
                handleSendFunds(sendForm.recipient, sendForm.amount)
              }
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">
            Request Testnet Funds
          </h3>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Amount (e.g., 50.00)"
              value={faucetForm.amount}
              onChange={(e) =>
                setFaucetForm({ ...faucetForm, amount: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={() => handleFaucetRequest(faucetForm.amount)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              Request from Faucet
            </button>
          </div>
        </div>
      </div>

      {/* Column 2: Escrow Management */}
      <div className="lg:col-span-1 space-y-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Create Escrow</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Fulfiller Address (0x...)"
              value={createEscrowForm.fulfiller}
              onChange={(e) =>
                setCreateEscrowForm({
                  ...createEscrowForm,
                  fulfiller: e.target.value,
                })
              }
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              value={createEscrowForm.amount}
              onChange={(e) =>
                setCreateEscrowForm({
                  ...createEscrowForm,
                  amount: e.target.value,
                })
              }
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="number"
              placeholder="Expiration (in hours)"
              value={createEscrowForm.expiration}
              onChange={(e) =>
                setCreateEscrowForm({
                  ...createEscrowForm,
                  expiration: e.target.value,
                })
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <select
              value={createEscrowForm.purpose}
              onChange={(e) =>
                setCreateEscrowForm({
                  ...createEscrowForm,
                  purpose: e.target.value as EscrowPurpose,
                })
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAW">Withdraw</option>
              <option value="STAKE">Stake</option>
              <option value="BOND">Bond</option>
            </select>
            <button
              onClick={() =>
                handleCreateEscrow(
                  createEscrowForm.fulfiller,
                  createEscrowForm.amount,
                  createEscrowForm.expiration,
                  createEscrowForm.purpose,
                )
              }
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
            >
              Create Escrow
            </button>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Manage Escrow</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Escrow ID (0x...)"
              value={manageEscrowForm.escrowId}
              onChange={(e) =>
                setManageEscrowForm({
                  ...manageEscrowForm,
                  escrowId: e.target.value,
                })
              }
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleFulfillEscrow(manageEscrowForm.escrowId)}
                disabled={!manageEscrowForm.escrowId}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Fulfill
              </button>
              <button
                onClick={() => handleReleaseEscrow(manageEscrowForm.escrowId)}
                disabled={!manageEscrowForm.escrowId}
                className="w-full px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Release
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: History */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-6 text-sm">
              <button
                onClick={() => setActiveSubTab("transactions")}
                className={`py-2 px-1 border-b-2 ${
                  activeSubTab === "transactions"
                    ? "border-blue-500 text-blue-600 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveSubTab("created")}
                className={`py-2 px-1 border-b-2 ${
                  activeSubTab === "created"
                    ? "border-blue-500 text-blue-600 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                My Escrows
              </button>
              <button
                onClick={() => setActiveSubTab("assigned")}
                className={`py-2 px-1 border-b-2 ${
                  activeSubTab === "assigned"
                    ? "border-blue-500 text-blue-600 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Assigned to Me
              </button>
            </nav>
          </div>
          <div className="pt-4 flex-grow overflow-y-auto">
            {activeSubTab === "transactions" && (
              <div>
                {isLoadingTransactions ? (
                  <p className="text-center text-gray-500 py-4">Loading...</p>
                ) : transactions.length > 0 ? (
                  <ul className="space-y-3">
                    {transactions.map((tx) => (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex items-center justify-center w-8 h-8 rounded-full ${
                              tx.type === "receive"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {tx.type === "receive" ? (
                              <ArrowDown size={16} />
                            ) : (
                              <ArrowUp size={16} />
                            )}
                          </span>
                          <div>
                            <p className="font-medium capitalize text-sm">
                              {tx.type}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">
                              {tx.type === "receive"
                                ? `From: ${tx.from}`
                                : `To: ${tx.to}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-medium ${
                              tx.type === "receive"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {tx.type === "receive" ? "+" : "-"}
                            {tx.formattedAmount ||
                              `$${formatBalance(tx.amount)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tx.date).toLocaleString()}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No transactions found
                  </p>
                )}
              </div>
            )}
            {activeSubTab === "created" && (
              <div>
                {isLoadingEscrows ? (
                  <p className="text-center text-gray-500 py-4">Loading...</p>
                ) : escrows.created.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {escrows.created.map((escrow) => (
                      <li
                        key={escrow.id}
                        className="p-4 bg-gray-50 rounded-md border"
                      >
                        <p>
                          <strong>ID:</strong>{" "}
                          <span className="font-mono text-xs">
                            {escrow.blockchainId}
                          </span>
                        </p>
                        <p>
                          <strong>Amount:</strong> $
                          {formatBalance(escrow.amount)}
                        </p>
                        <p>
                          <strong>Fulfiller:</strong>{" "}
                          <span className="font-mono text-xs">
                            {escrow.recipientAddress || "Not specified"}
                          </span>
                        </p>
                        <p>
                          <strong>Status:</strong> {escrow.status} |{" "}
                          <strong>Expires:</strong>{" "}
                          {new Date(
                            escrow.expirationDate || 0,
                          ).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No escrows created
                  </p>
                )}
              </div>
            )}
            {activeSubTab === "assigned" && (
              <div>
                {isLoadingEscrows ? (
                  <p className="text-center text-gray-500 py-4">Loading...</p>
                ) : escrows.assigned.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {escrows.assigned.map((escrow) => (
                      <li
                        key={escrow.id}
                        className="p-4 bg-gray-50 rounded-md border"
                      >
                        <p>
                          <strong>ID:</strong>{" "}
                          <span className="font-mono text-xs">
                            {escrow.blockchainId}
                          </span>
                        </p>
                        <p>
                          <strong>Amount:</strong> $
                          {formatBalance(escrow.amount)}
                        </p>
                        <p>
                          <strong>Creator:</strong>{" "}
                          <span className="font-mono text-xs">
                            {escrow.creatorUserId}
                          </span>
                        </p>
                        <p>
                          <strong>Status:</strong> {escrow.status} |{" "}
                          <strong>Expires:</strong>{" "}
                          {new Date(
                            escrow.expirationDate || 0,
                          ).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No escrows assigned to you
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletTab;
