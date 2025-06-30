import React, { useState } from "react";
import {
  HardDrive,
  Key,
  AlertTriangle,
  Copy,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsolidate: () => void;
  onExportKey: () => void;
  policyCode: string | null;
  temporaryPrivateKey?: string;
}

const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  isOpen,
  onClose,
  onConsolidate,
  onExportKey,
  policyCode,
  temporaryPrivateKey,
}) => {
  const [showExportFlow, setShowExportFlow] = useState(false);
  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  if (!isOpen) {
    return null;
  }

  const handleExportKey = () => {
    setShowExportFlow(true);
  };

  const handleCopyKey = async () => {
    if (temporaryPrivateKey) {
      try {
        await navigator.clipboard.writeText(temporaryPrivateKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy private key:", err);
      }
    }
  };

  const handleExportComplete = () => {
    if (confirmed) {
      onExportKey();
      setShowExportFlow(false);
    }
  };

  const handleBackToOptions = () => {
    setShowExportFlow(false);
    setPrivateKeyVisible(false);
    setCopied(false);
    setConfirmed(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      aria-labelledby="reconciliation-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
          <AlertTriangle
            className="w-6 h-6 text-yellow-600"
            aria-hidden="true"
          />
        </div>

        <h3
          className="mt-4 text-xl font-semibold text-gray-900"
          id="reconciliation-title"
        >
          Welcome Back! Action Required
        </h3>

        <div className="mt-2 text-sm text-gray-600">
          <p>
            We noticed you purchased policy{" "}
            <span className="font-mono bg-gray-100 px-1 rounded">
              {policyCode}
            </span>{" "}
            while browsing as a guest.
          </p>
          <p className="mt-2">
            This policy is held in a temporary wallet. Please choose how you
            would like to proceed to ensure you have access to any future
            payouts.
          </p>
        </div>

        {!showExportFlow ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Consolidate */}
            <button
              onClick={onConsolidate}
              className="w-full flex flex-col items-center p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <HardDrive className="w-8 h-8 text-green-600 mb-2" />
              <span className="font-semibold text-gray-800">
                Consolidate Wallet
              </span>
              <span className="mt-1 text-xs text-gray-500 text-center">
                (Recommended) Move the policy and funds to your primary wallet.
              </span>
            </button>

            {/* Option 2: Export Key */}
            <button
              onClick={handleExportKey}
              className="w-full flex flex-col items-center p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Key className="w-8 h-8 text-blue-600 mb-2" />
              <span className="font-semibold text-gray-800">Keep Separate</span>
              <span className="mt-1 text-xs text-gray-500 text-center">
                Export the private key for this temporary wallet to manage it
                yourself.
              </span>
            </button>
          </div>
        ) : (
          <div className="mt-6">
            {/* Private Key Export Flow */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-semibold text-red-800">
                  Security Warning
                </span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                <li>
                  • Keep this private key secure and never share it with anyone
                </li>
                <li>• Anyone with this key can access your wallet and funds</li>
                <li>
                  • Store it in a secure password manager or offline location
                </li>
                <li>• If you lose this key, you cannot recover your wallet</li>
              </ul>
            </div>

            {temporaryPrivateKey ? (
              <div className="space-y-4">
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Private Key for Policy {policyCode}
                    </label>
                    <button
                      onClick={() => setPrivateKeyVisible(!privateKeyVisible)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {privateKeyVisible ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type={privateKeyVisible ? "text" : "password"}
                      value={temporaryPrivateKey}
                      readOnly
                      className="flex-1 font-mono text-sm bg-white border rounded px-3 py-2"
                    />
                    <button
                      onClick={handleCopyKey}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                      <span className="ml-1 text-sm">
                        {copied ? "Copied!" : "Copy"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="confirm-saved"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label
                    htmlFor="confirm-saved"
                    className="text-sm text-gray-700"
                  >
                    I have securely saved this private key and understand the
                    risks
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleBackToOptions}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Back to Options
                  </button>
                  <button
                    onClick={handleExportComplete}
                    disabled={!confirmed}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete Export
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Private key not available</p>
                <button
                  onClick={handleBackToOptions}
                  className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back to Options
                </button>
              </div>
            )}
          </div>
        )}

        {!showExportFlow && (
          <div className="mt-6">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Decide Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReconciliationModal;
