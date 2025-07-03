// ===========================================================================
// NOTIFICATION TEMPLATES & UTILITIES
// ===========================================================================

import type {
  Timestamp,
  UUID,
  EmailAddress,
  PhoneNumber,
  MoneyAmount,
} from "../types";

// ===========================================================================
// INTERFACES & TYPES
// ===========================================================================

export type NotificationChannel =
  | "EMAIL"
  | "SMS"
  | "PUSH"
  | "WEBHOOK"
  | "IN_APP";
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type NotificationStatus =
  | "PENDING"
  | "SENT"
  | "FAILED"
  | "DELIVERED"
  | "READ";

// Context for interpolating variables into templates
export interface NotificationContext {
  // User context
  userName?: string;
  userEmail?: EmailAddress;
  userId?: UUID;

  // Policy context
  policyNumber?: string;
  policyVerificationCode?: string;
  productName?: string;
  coverageAmount?: MoneyAmount;
  premiumAmount?: MoneyAmount;
  policyEffectiveDate?: Timestamp;
  policyExpirationDate?: Timestamp;

  // Flight context
  flightNumber?: string;
  originAirport?: string;
  destinationAirport?: string;
  departureTime?: Timestamp;
  arrivalTime?: Timestamp;
  delayMinutes?: number;

  // Wallet & Payout context
  walletAddress?: string;
  payoutAmount?: MoneyAmount;
  transactionHash?: string;
  faucetAmount?: MoneyAmount;

  // Generic context
  actionUrl?: string; // For buttons/links
  reason?: string;
  details?: string;
  supportEmail?: EmailAddress;
  platformName?: string; // e.g., "triggerr"
  currentYear?: string;
}

// Structure for a single notification template
export interface NotificationTemplate {
  id: string; // Unique identifier for the template
  name: string; // Human-readable name
  description?: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  subject?: (context: NotificationContext) => string; // For EMAIL, PUSH
  textBody?: (context: NotificationContext) => string; // For EMAIL (plain text), SMS
  htmlBody?: (context: NotificationContext) => string; // For EMAIL (HTML)
  pushPayload?: (context: NotificationContext) => object; // For PUSH notifications
  webhookPayload?: (context: NotificationContext) => object; // For WEBHOOK notifications
  inAppContent?: (context: NotificationContext) => object; // For IN_APP notifications
  requiredContextKeys?: (keyof NotificationContext)[]; // Keys that must be present in context
  tags?: string[];
}

// ===========================================================================
// EMAIL TEMPLATES
// ===========================================================================

export const defaultPlatformName = "triggerr";
export const defaultSupportEmail = "support@triggerr.com"; // Replace with actual support email

export const EMAIL_TEMPLATES: Record<string, NotificationTemplate> = {
  // --- USER ONBOARDING & ACCOUNT ---
  USER_WELCOME: {
    id: "USER_WELCOME",
    name: "User Welcome & Wallet Ready",
    channel: "EMAIL",
    priority: "MEDIUM",
    subject: (ctx) =>
      `Welcome to ${ctx.platformName || defaultPlatformName}! Your Wallet is Ready!`,
    textBody: (ctx) => `
Hi ${ctx.userName || "there"},

Welcome to ${ctx.platformName || defaultPlatformName}!

We're thrilled to have you join our platform. Your secure, custodial PayGo wallet has been automatically created and is ready for use.
Your Wallet Address: ${ctx.walletAddress || "N/A"}

You can view your wallet and manage your policies by logging into your dashboard:
${ctx.actionUrl || `https://triggerr.com/dashboard`}

If you're testing on our Alpha/Testnet, you can request some test tokens from the faucet in your dashboard.

Happy travels,
The ${ctx.platformName || defaultPlatformName} Team
${ctx.supportEmail || defaultSupportEmail}
    `,
    htmlBody: (ctx) => `
<!DOCTYPE html>
<html>
<head><title>Welcome!</title></head>
<body>
  <p>Hi ${ctx.userName || "there"},</p>
  <p>Welcome to <strong>${ctx.platformName || defaultPlatformName}</strong>!</p>
  <p>We're thrilled to have you join our platform. Your secure, custodial PayGo wallet has been automatically created and is ready for use.</p>
  <p><strong>Your Wallet Address:</strong> ${ctx.walletAddress || "N/A"}</p>
  <p>You can view your wallet and manage your policies by logging into your dashboard:</p>
  <p><a href="${ctx.actionUrl || `https://triggerr.com/dashboard`}">Go to Dashboard</a></p>
  <p>If you're testing on our Alpha/Testnet, you can request some test tokens from the faucet in your dashboard.</p>
  <p>Happy travels,<br/>The ${ctx.platformName || defaultPlatformName} Team<br/>
  <a href="mailto:${ctx.supportEmail || defaultSupportEmail}">${ctx.supportEmail || defaultSupportEmail}</a></p>
</body>
</html>
    `,
    requiredContextKeys: [
      "userName",
      "walletAddress",
      "platformName",
      "supportEmail",
      "actionUrl",
    ],
  },

  PASSWORD_RESET_REQUEST: {
    id: "PASSWORD_RESET_REQUEST",
    name: "Password Reset Request",
    channel: "EMAIL",
    priority: "URGENT",
    subject: (ctx) =>
      `Password Reset Request for ${ctx.platformName || defaultPlatformName}`,
    textBody: (ctx) => `
Hi ${ctx.userName || "there"},

We received a request to reset your password for your ${ctx.platformName || defaultPlatformName} account.
If you did not make this request, please ignore this email.

To reset your password, click the link below:
${ctx.actionUrl}

This link will expire in 1 hour.

Thanks,
The ${ctx.platformName || defaultPlatformName} Team
    `,
    htmlBody: (ctx) => `
<!DOCTYPE html>
<html>
<body>
  <p>Hi ${ctx.userName || "there"},</p>
  <p>We received a request to reset your password for your ${ctx.platformName || defaultPlatformName} account. If you did not make this request, please ignore this email.</p>
  <p>To reset your password, click the link below:</p>
  <p><a href="${ctx.actionUrl}">Reset Password</a></p>
  <p>This link will expire in 1 hour.</p>
  <p>Thanks,<br/>The ${ctx.platformName || defaultPlatformName} Team</p>
</body>
</html>
    `,
    requiredContextKeys: ["userName", "actionUrl", "platformName"],
  },

  // --- POLICY MANAGEMENT ---
  POLICY_PURCHASE_CONFIRMATION: {
    id: "POLICY_PURCHASE_CONFIRMATION",
    name: "Policy Purchase Confirmation",
    channel: "EMAIL",
    priority: "HIGH",
    subject: (ctx) =>
      `Your ${ctx.productName || "Policy"} is Confirmed! (Policy #${ctx.policyNumber})`,
    textBody: (ctx) => `
Hi ${ctx.userName || "there"},

Thank you for purchasing your ${ctx.productName || "insurance policy"} with ${ctx.platformName || defaultPlatformName}!

Policy Number: ${ctx.policyNumber}
Product: ${ctx.productName}
Coverage Amount: ${ctx.coverageAmount?.formatted || ctx.coverageAmount?.cents + " cents"}
Premium Paid: ${ctx.premiumAmount?.formatted || ctx.premiumAmount?.cents + " cents"}
Effective Date: ${ctx.policyEffectiveDate}
Expiration Date: ${ctx.policyExpirationDate}

Flight Details:
  Flight: ${ctx.flightNumber}
  Origin: ${ctx.originAirport}
  Destination: ${ctx.destinationAirport}
  Scheduled Departure: ${ctx.departureTime}

You can track your policy status here using your Policy Verification Code "${ctx.policyVerificationCode}":
${ctx.actionUrl || `https://triggerr.com/track`}

Safe travels!
The ${ctx.platformName || defaultPlatformName} Team
    `,
    htmlBody: (ctx) => `
<!DOCTYPE html>
<html>
<body>
  <p>Hi ${ctx.userName || "there"},</p>
  <p>Thank you for purchasing your <strong>${ctx.productName || "insurance policy"}</strong> with ${ctx.platformName || defaultPlatformName}!</p>
  <p><strong>Policy Number:</strong> ${ctx.policyNumber}</p>
  <p><strong>Product:</strong> ${ctx.productName}</p>
  <p><strong>Coverage Amount:</strong> ${ctx.coverageAmount?.formatted || ctx.coverageAmount?.cents + " cents"}</p>
  <p><strong>Premium Paid:</strong> ${ctx.premiumAmount?.formatted || ctx.premiumAmount?.cents + " cents"}</p>
  <p><strong>Effective Date:</strong> ${ctx.policyEffectiveDate}</p>
  <p><strong>Expiration Date:</strong> ${ctx.policyExpirationDate}</p>
  <p><strong>Flight Details:</strong></p>
  <ul>
    <li>Flight: ${ctx.flightNumber}</li>
    <li>Origin: ${ctx.originAirport}</li>
    <li>Destination: ${ctx.destinationAirport}</li>
    <li>Scheduled Departure: ${ctx.departureTime}</li>
  </ul>
  <p>You can track your policy status <a href="${ctx.actionUrl || `https://triggerr.com/track`}">here</a> using your Policy Verification Code "<strong>${ctx.policyVerificationCode}</strong>".</p>
  <p>Safe travels!<br/>The ${ctx.platformName || defaultPlatformName} Team</p>
</body>
</html>
    `,
    requiredContextKeys: [
      "userName",
      "productName",
      "policyNumber",
      "coverageAmount",
      "premiumAmount",
      "policyEffectiveDate",
      "policyExpirationDate",
      "flightNumber",
      "originAirport",
      "destinationAirport",
      "departureTime",
      "policyVerificationCode",
      "platformName",
      "actionUrl",
    ],
  },

  FLIGHT_DELAY_DETECTED: {
    id: "FLIGHT_DELAY_DETECTED",
    name: "Flight Delay Detected for Your Policy",
    channel: "EMAIL",
    priority: "HIGH",
    subject: (ctx) =>
      `Flight Delay Detected: ${ctx.flightNumber} - Policy #${ctx.policyNumber}`,
    textBody: (ctx) => `
Hi ${ctx.userName || "there"},

We've detected a significant delay for your insured flight:
Flight: ${ctx.flightNumber}
Origin: ${ctx.originAirport}
Destination: ${ctx.destinationAirport}
Scheduled Departure: ${ctx.departureTime}
Reported Delay: Approximately ${ctx.delayMinutes} minutes.

Your policy #${ctx.policyNumber} is active for this flight.
If the delay meets your policy's threshold, a payout will be automatically processed.
No action is needed from you at this time. We will notify you of any payouts.

You can monitor your policy status here:
${ctx.actionUrl || `https://triggerr.com/track?code=${ctx.policyVerificationCode}`}

The ${ctx.platformName || defaultPlatformName} Team
    `,
    htmlBody: (ctx) => `
<!DOCTYPE html>
<html>
<body>
  <p>Hi ${ctx.userName || "there"},</p>
  <p>We've detected a significant delay for your insured flight:</p>
  <ul>
    <li><strong>Flight:</strong> ${ctx.flightNumber}</li>
    <li><strong>Origin:</strong> ${ctx.originAirport}</li>
    <li><strong>Destination:</strong> ${ctx.destinationAirport}</li>
    <li><strong>Scheduled Departure:</strong> ${ctx.departureTime}</li>
    <li><strong>Reported Delay:</strong> Approximately ${ctx.delayMinutes} minutes.</li>
  </ul>
  <p>Your policy #${ctx.policyNumber} is active for this flight. If the delay meets your policy's threshold, a payout will be automatically processed. No action is needed from you at this time. We will notify you of any payouts.</p>
  <p>You can monitor your policy status <a href="${ctx.actionUrl || `https://triggerr.com/track?code=${ctx.policyVerificationCode}`}">here</a>.</p>
  <p>The ${ctx.platformName || defaultPlatformName} Team</p>
</body>
</html>
    `,
    requiredContextKeys: [
      "userName",
      "flightNumber",
      "originAirport",
      "destinationAirport",
      "departureTime",
      "delayMinutes",
      "policyNumber",
      "policyVerificationCode",
      "platformName",
      "actionUrl",
    ],
  },

  PAYOUT_PROCESSED: {
    id: "PAYOUT_PROCESSED",
    name: "Parametric Payout Processed",
    channel: "EMAIL",
    priority: "HIGH",
    subject: (ctx) =>
      `Your Payout of ${ctx.payoutAmount?.formatted || ctx.payoutAmount?.cents + " cents"} is On Its Way!`,
    textBody: (ctx) => `
Hi ${ctx.userName || "there"},

Great news! Your parametric insurance payout has been processed.

Policy Number: ${ctx.policyNumber}
Flight: ${ctx.flightNumber}
Payout Amount: ${ctx.payoutAmount?.formatted || ctx.payoutAmount?.cents + " cents"}
Wallet Address: ${ctx.walletAddress}
Transaction Hash (PayGo): ${ctx.transactionHash || "N/A"}

The funds have been sent to your custodial PayGo wallet. You should see the balance updated shortly.

Thank you for choosing ${ctx.platformName || defaultPlatformName}.
The ${ctx.platformName || defaultPlatformName} Team
    `,
    htmlBody: (ctx) => `
<!DOCTYPE html>
<html>
<body>
  <p>Hi ${ctx.userName || "there"},</p>
  <p>Great news! Your parametric insurance payout has been processed.</p>
  <ul>
    <li><strong>Policy Number:</strong> ${ctx.policyNumber}</li>
    <li><strong>Flight:</strong> ${ctx.flightNumber}</li>
    <li><strong>Payout Amount:</strong> ${ctx.payoutAmount?.formatted || ctx.payoutAmount?.cents + " cents"}</li>
    <li><strong>Wallet Address:</strong> ${ctx.walletAddress}</li>
    <li><strong>Transaction Hash (PayGo):</strong> ${ctx.transactionHash || "N/A"}</li>
  </ul>
  <p>The funds have been sent to your custodial PayGo wallet. You should see the balance updated shortly.</p>
  <p>Thank you for choosing ${ctx.platformName || defaultPlatformName}.<br/>
  The ${ctx.platformName || defaultPlatformName} Team</p>
</body>
</html>
    `,
    requiredContextKeys: [
      "userName",
      "policyNumber",
      "flightNumber",
      "payoutAmount",
      "walletAddress",
      "platformName",
    ],
  },

  // --- WALLET ---
  FAUCET_REQUEST_COMPLETED: {
    id: "FAUCET_REQUEST_COMPLETED",
    name: "Testnet Faucet Request Completed",
    channel: "EMAIL",
    priority: "MEDIUM",
    subject: (ctx) =>
      `Test Tokens Added: ${ctx.faucetAmount?.formatted || ctx.faucetAmount?.cents + " cents"}`,
    textBody: (ctx) => `
Hi ${ctx.userName || "there"},

Your request for test tokens has been successfully processed.
Amount Added: ${ctx.faucetAmount?.formatted || ctx.faucetAmount?.cents + " cents"}
Wallet Address: ${ctx.walletAddress}
Transaction Hash (PayGo): ${ctx.transactionHash || "N/A"}

Your wallet balance has been updated. You can use these tokens for testing on the ${ctx.platformName || defaultPlatformName} Alpha/Testnet.

The ${ctx.platformName || defaultPlatformName} Team
    `,
    htmlBody: (ctx) => `
<!DOCTYPE html>
<html>
<body>
  <p>Hi ${ctx.userName || "there"},</p>
  <p>Your request for test tokens has been successfully processed.</p>
  <ul>
    <li><strong>Amount Added:</strong> ${ctx.faucetAmount?.formatted || ctx.faucetAmount?.cents + " cents"}</li>
    <li><strong>Wallet Address:</strong> ${ctx.walletAddress}</li>
    <li><strong>Transaction Hash (PayGo):</strong> ${ctx.transactionHash || "N/A"}</li>
  </ul>
  <p>Your wallet balance has been updated. You can use these tokens for testing on the ${ctx.platformName || defaultPlatformName} Alpha/Testnet.</p>
  <p>The ${ctx.platformName || defaultPlatformName} Team</p>
</body>
</html>
    `,
    requiredContextKeys: [
      "userName",
      "faucetAmount",
      "walletAddress",
      "platformName",
    ],
  },
};

// ===========================================================================
// UTILITY FUNCTIONS (Example)
// ===========================================================================

/**
 * Renders a notification template with the given context.
 *
 * @param templateId - The ID of the template to render.
 * @param context - The context object for interpolation.
 * @returns The rendered notification parts (subject, textBody, htmlBody, etc.).
 * @throws Error if template ID is not found or context is invalid.
 */
export function renderNotification(
  templateId: keyof typeof EMAIL_TEMPLATES, // Extend for other channels
  context: NotificationContext,
): {
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  payload?: object;
} {
  const template = EMAIL_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Notification template not found: ${templateId}`);
  }

  // Basic context validation (can be more sophisticated)
  if (template.requiredContextKeys) {
    for (const key of template.requiredContextKeys) {
      if (context[key] === undefined || context[key] === null) {
        // In a real app, you might want to handle this more gracefully,
        // e.g., by logging an error and returning a fallback message.
        console.warn(
          `Missing required context key "${key}" for template "${templateId}"`,
        );
        // throw new Error(`Missing required context key "${key}" for template "${templateId}"`);
      }
    }
  }

  const rendered: {
    subject?: string;
    textBody?: string;
    htmlBody?: string;
    payload?: object;
  } = {};

  if (template.subject) {
    rendered.subject = template.subject(context);
  }
  if (template.textBody) {
    rendered.textBody = template.textBody(context);
  }
  if (template.htmlBody) {
    rendered.htmlBody = template.htmlBody(context);
  }
  if (template.pushPayload) {
    rendered.payload = template.pushPayload(context);
  } else if (template.webhookPayload) {
    rendered.payload = template.webhookPayload(context);
  } else if (template.inAppContent) {
    rendered.payload = template.inAppContent(context);
  }

  return rendered;
}

// Example usage:
/*
try {
  const renderedEmail = renderNotification('USER_WELCOME', {
    userName: 'John Doe',
    walletAddress: '0x123abc...',
    platformName: 'My Awesome App',
    supportEmail: 'help@myawesomeapp.com',
    actionUrl: 'https://myawesomeapp.com/login',
    currentYear: new Date().getFullYear().toString()
  });
  console.log('Subject:', renderedEmail.subject);
  console.log('HTML Body:', renderedEmail.htmlBody);
} catch (error) {
  console.error('Error rendering notification:', error.message);
}
*/
