import React from "react";
import { Plane, CheckCircle, Clock, Shield } from "lucide-react";

// Mock interface for a policy object
interface Policy {
  id: string;
  flightSummary: string;
  status: "ACTIVE" | "EXPIRED" | "PAID_OUT";
  verificationCode: string;
  premium: string;
  coverage: string;
}

interface MyPoliciesTabProps {
  isAuthenticated: boolean;
  policies: Policy[];
}

const MyPoliciesTab: React.FC<MyPoliciesTabProps> = ({
  isAuthenticated,
  policies,
}) => {
  const getStatusIcon = (status: Policy["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Shield className="w-5 h-5 text-green-600" />
        );
      case "PAID_OUT":
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case "EXPIRED":
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Policy["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-700 bg-green-100";
      case "PAID_OUT":
        return "text-blue-700 bg-blue-100";
      case "EXPIRED":
        return "text-gray-700 bg-gray-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  // This view is primarily for authenticated users.
  // The tab itself will be hidden if the user is not authenticated.
  // This is a fallback message.
  if (!isAuthenticated) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
        <h2 className="text-xl font-semibold text-gray-700">My Policies</h2>
        <p className="text-gray-500 mt-2">
          Please sign in to view your saved policies.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">My Policies</h2>
      {policies.length === 0 ? (
        <div className="text-center text-gray-500 p-8 border-2 border-dashed rounded-lg">
          <p>You have no policies linked to your account yet.</p>
          <p className="text-sm mt-1">
            Purchase a policy through the Chat tab to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Plane className="w-6 h-6 text-gray-500" />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {policy.flightSummary}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      Verification Code: {policy.verificationCode}
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(
                    policy.status,
                  )}`}
                >
                  {getStatusIcon(policy.status)}
                  <span>{policy.status}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Premium</p>
                  <p className="font-semibold text-gray-800">
                    ${policy.premium}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Coverage</p>
                  <p className="font-semibold text-gray-800">
                    ${policy.coverage}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPoliciesTab;
