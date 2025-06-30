// ============================================================================
// CHAT API VALIDATORS (ZOD SCHEMAS)
// ============================================================================

import { z } from 'zod';

// ============================================================================
// ENUMS & CONSTANTS (aligned with database schema)
// ============================================================================

export const chatMessageRoleSchema = z.enum(['user', 'assistant', 'system']);
export const chatMessageContentTypeSchema = z.enum(['text', 'quote_request', 'quote_response', 'flight_info', 'policy_info']);
export const chatInterfaceSchema = z.enum(['web', 'api', 'cli', 'terminal']);
export const conversationStatusSchema = z.enum(['active', 'completed', 'archived']);

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const conversationIdSchema = z.string().uuid({ message: "Invalid Conversation ID format" });

export const chatContextSchema = z.object({
  flightSearch: z.object({
    origin: z.string().optional(),
    destination: z.string().optional(),
    departureDate: z.string().datetime().optional(),
    returnDate: z.string().datetime().optional(),
    passengers: z.number().int().min(1).max(20).optional(),
    cabin: z.string().optional(),
  }).optional(),
  quoteRequest: z.object({
    productType: z.string().optional(),
    coverageAmount: z.number().int().positive().optional(),
    flightDetails: z.object({
      flightNumber: z.string().optional(),
      airline: z.string().optional(),
      departureTime: z.string().datetime().optional(),
      route: z.string().optional(),
    }).optional(),
    delayThreshold: z.number().int().min(30).max(720).optional(), // 30 minutes to 12 hours
    premiumRange: z.object({
      min: z.number().int().nonnegative(),
      max: z.number().int().positive(),
    }).optional(),
  }).optional(),
  policyInquiry: z.object({
    policyId: z.string().optional(),
    trackingNumber: z.string().optional(),
    claimInquiry: z.boolean().optional(),
    statusCheck: z.boolean().optional(),
  }).optional(),
  userIntent: z.string().max(500).optional(),
  previousActions: z.array(z.string()).max(50).optional(),
});

export const chatActionSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(100),
  type: z.enum(['quote', 'search', 'track', 'purchase', 'info']),
  endpoint: z.string().url().optional(),
  params: z.record(z.any()).optional(),
});

// ============================================================================
// REQUEST VALIDATORS
// ============================================================================

export const chatMessageRequestSchema = z.object({
  message: z.string().min(1).max(4000), // Reasonable message length limit
  conversationId: z.string().uuid().optional(),
  sessionId: z.string().optional(), // Anonymous session ID
  context: chatContextSchema.optional(),
  interface: chatInterfaceSchema.default('web'),
}).strict();

export const conversationListRequestSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().nonnegative().default(0),
  status: conversationStatusSchema.optional(),
  interface: chatInterfaceSchema.optional(),
}).strict();

export const conversationMessagesRequestSchema = z.object({
  conversationId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  before: z.string().uuid().optional(), // Message ID for pagination
  after: z.string().uuid().optional(), // Message ID for pagination
}).strict();

export const syncAnonymousConversationRequestSchema = z.object({
  sessionId: z.string().min(1).max(255),
  conversationIds: z.array(z.string().uuid()).max(100), // Reasonable limit
}).strict();

// ============================================================================
// RESPONSE VALIDATORS
// ============================================================================

export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: chatMessageRoleSchema,
  content: z.string(),
  contentType: chatMessageContentTypeSchema,
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
  interface: chatInterfaceSchema,
});

export const chatMessageResponseSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  message: z.string(),
  role: chatMessageRoleSchema,
  contentType: chatMessageContentTypeSchema,
  timestamp: z.string().datetime(),
  context: chatContextSchema.optional(),
  suggestions: z.array(z.string().max(200)).max(10).optional(),
  actions: z.array(chatActionSchema).max(10).optional(),
});

export const conversationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  status: conversationStatusSchema,
  interface: chatInterfaceSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  messageCount: z.number().int().nonnegative(),
  lastMessage: z.string().max(500).optional(),
  context: chatContextSchema.optional(),
});

export const conversationListResponseSchema = z.object({
  conversations: z.array(conversationSchema),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  pagination: z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
  }),
});

export const conversationMessagesResponseSchema = z.object({
  messages: z.array(chatMessageSchema),
  conversation: conversationSchema,
  hasMore: z.boolean(),
  pagination: z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    before: z.string().uuid().optional(),
    after: z.string().uuid().optional(),
  }),
});

export const syncAnonymousConversationResponseSchema = z.object({
  synced: z.boolean(),
  migratedConversations: z.number().int().nonnegative(),
  message: z.string(),
});

export const chatInterfaceConfigSchema = z.object({
  interface: chatInterfaceSchema,
  features: z.object({
    suggestions: z.boolean(),
    actions: z.boolean(),
    contextAware: z.boolean(),
    fileUpload: z.boolean(),
    voiceInput: z.boolean(),
  }),
  limits: z.object({
    maxMessageLength: z.number().int().positive(),
    maxConversationLength: z.number().int().positive(),
    rateLimitPerMinute: z.number().int().positive(),
  }),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate chat message request
 */
export function validateChatMessageRequest(data: unknown) {
  return chatMessageRequestSchema.parse(data);
}

/**
 * Validate conversation list request
 */
export function validateConversationListRequest(data: unknown) {
  return conversationListRequestSchema.parse(data);
}

/**
 * Validate conversation messages request
 */
export function validateConversationMessagesRequest(data: unknown) {
  return conversationMessagesRequestSchema.parse(data);
}

/**
 * Validate sync anonymous conversation request
 */
export function validateSyncAnonymousConversationRequest(data: unknown) {
  return syncAnonymousConversationRequestSchema.parse(data);
}

/**
 * Safe validation with error handling
 */
export function safeValidateChatMessageRequest(data: unknown) {
  const result = chatMessageRequestSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.issues,
  };
}

/**
 * Safe validation for conversation list request
 */
export function safeValidateConversationListRequest(data: unknown) {
  const result = conversationListRequestSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.issues,
  };
}

// ============================================================================
// TYPE EXPORTS (inferred from schemas)
// ============================================================================

export type ChatMessageRequest = z.infer<typeof chatMessageRequestSchema>;
export type ChatMessageResponse = z.infer<typeof chatMessageResponseSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type ConversationListRequest = z.infer<typeof conversationListRequestSchema>;
export type ConversationListResponse = z.infer<typeof conversationListResponseSchema>;
export type ConversationMessagesRequest = z.infer<typeof conversationMessagesRequestSchema>;
export type ConversationMessagesResponse = z.infer<typeof conversationMessagesResponseSchema>;
export type SyncAnonymousConversationRequest = z.infer<typeof syncAnonymousConversationRequestSchema>;
export type SyncAnonymousConversationResponse = z.infer<typeof syncAnonymousConversationResponseSchema>;
export type ChatContext = z.infer<typeof chatContextSchema>;
export type ChatAction = z.infer<typeof chatActionSchema>;
export type ChatInterfaceConfig = z.infer<typeof chatInterfaceConfigSchema>;

// Role and interface type exports
export type ChatMessageRole = z.infer<typeof chatMessageRoleSchema>;
export type ChatMessageContentType = z.infer<typeof chatMessageContentTypeSchema>;
export type ChatInterface = z.infer<typeof chatInterfaceSchema>;
export type ConversationStatus = z.infer<typeof conversationStatusSchema>;
