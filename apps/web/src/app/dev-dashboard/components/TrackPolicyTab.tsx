import React, { useState } from "react";
import { Search } from "lucide-react";

// Mock interface for policy status display
interface PolicyStatusInfo {
  policyId: string;
  flightSummary: string;
  status: "ACTIVE" | "EXPIRED" | "PAID_OUT" | "PENDING";
  payoutStatus?: string;
  details: string;
}

const TrackPolicyTab: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [policyStatus, setPolicyStatus] = useState<PolicyStatusInfo | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrackPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError("Please enter a verification code.");
      setPolicyStatus(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPolicyStatus(null);

    // Simulate an API call
    setTimeout(() => {
      if (verificationCode.toLowerCase() === "error") {
        setError("Could not find a policy with this code.");
      } else {
        setPolicyStatus({
          policyId: verificationCode,
          flightSummary: "Flight BA245 - LHR to JFK",
          status: "ACTIVE",
          payoutStatus: "Not Triggered",
          details: "Your policy is active. Your flight is currently on time.",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        Track Your Policy
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Enter your Policy Verification Code to check the status of your
        coverage.
      </p>

      <form
        onSubmit={handleTrackPolicy}
        className="flex items-center gap-3 mb-6"
      >
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter your verification code..."
          className="flex-grow p-3 border border-gray-300 rounded-lg text-sm"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Search size={18} />
          <span>{isLoading ? "Tracking..." : "Track"}</span>
        </button>
      </form>

      {/* Results Display */}
      <div className="mt-4">
        {isLoading && (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Searching for your policy...
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
        {policyStatus && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <h3 className="font-bold text-lg text-green-800">Policy Found</h3>
            <div className="text-sm text-green-900 space-y-1">
              <p>
                <strong>Verification Code:</strong>{" "}
                <span className="font-mono">{policyStatus.policyId}</span>
              </p>
              <p>
                <strong>Flight:</strong> {policyStatus.flightSummary}
              </p>
              <p>
                <strong>Policy Status:</strong>{" "}
                <span className="font-semibold">{policyStatus.status}</span>
              </p>
              <p>
                <strong>Payout Status:</strong> {policyStatus.payoutStatus}
              </p>
              <p className="pt-2">{policyStatus.details}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackPolicyTab;
