import type { Timestamp, UUID, EmailAddress, MoneyAmount } from '../types';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK' | 'IN_APP';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'READ';
export interface NotificationContext {
    userName?: string;
    userEmail?: EmailAddress;
    userId?: UUID;
    policyNumber?: string;
    policyVerificationCode?: string;
    productName?: string;
    coverageAmount?: MoneyAmount;
    premiumAmount?: MoneyAmount;
    policyEffectiveDate?: Timestamp;
    policyExpirationDate?: Timestamp;
    flightNumber?: string;
    originAirport?: string;
    destinationAirport?: string;
    departureTime?: Timestamp;
    arrivalTime?: Timestamp;
    delayMinutes?: number;
    walletAddress?: string;
    payoutAmount?: MoneyAmount;
    transactionHash?: string;
    faucetAmount?: MoneyAmount;
    actionUrl?: string;
    reason?: string;
    details?: string;
    supportEmail?: EmailAddress;
    platformName?: string;
    currentYear?: string;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    description?: string;
    channel: NotificationChannel;
    priority: NotificationPriority;
    subject?: (context: NotificationContext) => string;
    textBody?: (context: NotificationContext) => string;
    htmlBody?: (context: NotificationContext) => string;
    pushPayload?: (context: NotificationContext) => object;
    webhookPayload?: (context: NotificationContext) => object;
    inAppContent?: (context: NotificationContext) => object;
    requiredContextKeys?: (keyof NotificationContext)[];
    tags?: string[];
}
export declare const defaultPlatformName = "\u00EFnsureinnie";
export declare const defaultSupportEmail = "support@triggerr.com";
export declare const EMAIL_TEMPLATES: Record<string, NotificationTemplate>;
/**
 * Renders a notification template with the given context.
 *
 * @param templateId - The ID of the template to render.
 * @param context - The context object for interpolation.
 * @returns The rendered notification parts (subject, textBody, htmlBody, etc.).
 * @throws Error if template ID is not found or context is invalid.
 */
export declare function renderNotification(templateId: keyof typeof EMAIL_TEMPLATES, // Extend for other channels
context: NotificationContext): {
    subject?: string;
    textBody?: string;
    htmlBody?: string;
    payload?: object;
};
//# sourceMappingURL=index.d.ts.map