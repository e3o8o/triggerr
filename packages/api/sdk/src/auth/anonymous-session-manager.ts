// ===========================================================================
// API SDK - ANONYMOUS SESSION MANAGER
// ===========================================================================

import type { AnonymousSession } from "@triggerr/api-contracts";

/**
 * Storage interface for anonymous session persistence
 */
export interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Default localStorage implementation
 */
class LocalStorage implements SessionStorage {
  getItem(key: string): string | null {
    try {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem(key)
        : null;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch {
      // Silently fail if localStorage is not available
    }
  }
}

/**
 * Memory-based storage fallback
 */
class MemoryStorage implements SessionStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

/**
 * Configuration options for AnonymousSessionManager
 */
export interface AnonymousSessionManagerConfig {
  /**
   * Storage key for persisting the session
   * @default 'triggerr-anonymous-session'
   */
  storageKey?: string;

  /**
   * Session expiry time in milliseconds
   * @default 24 hours (86400000 ms)
   */
  expiryMs?: number;

  /**
   * Storage implementation to use
   * @default LocalStorage with MemoryStorage fallback
   */
  storage?: SessionStorage;

  /**
   * Auto-create session if none exists
   * @default true
   */
  autoCreate?: boolean;
}

/**
 * Manages anonymous user sessions for the InsureInnie API SDK.
 *
 * This class handles:
 * - Creating and storing anonymous session IDs
 * - Persisting session data across browser sessions
 * - Managing session expiration
 * - Providing a clean API for session management
 *
 * @example
 * ```typescript
 * const sessionManager = new AnonymousSessionManager();
 * const sessionId = sessionManager.getSessionId();
 * ```
 */
export class AnonymousSessionManager {
  private config: Required<AnonymousSessionManagerConfig>;
  private storage: SessionStorage;
  private currentSession: AnonymousSession | null = null;

  constructor(config: AnonymousSessionManagerConfig = {}) {
    this.config = {
      storageKey: config.storageKey ?? "triggerr-anonymous-session",
      expiryMs: config.expiryMs ?? 86400000, // 24 hours
      storage: config.storage ?? new LocalStorage(),
      autoCreate: config.autoCreate ?? true,
    };

    this.storage = this.config.storage;
    this.loadSession();
  }

  /**
   * Gets the current session ID, creating a new session if none exists and autoCreate is enabled
   */
  public getSessionId(): string | null {
    const session = this.getOrCreateSession();
    return session?.sessionId ?? null;
  }

  /**
   * Gets the current anonymous session, creating one if none exists and autoCreate is enabled
   */
  public getOrCreateSession(): AnonymousSession | null {
    if (!this.currentSession || this.isSessionExpired(this.currentSession)) {
      if (this.config.autoCreate) {
        this.currentSession = this.createNewSession();
        this.saveSession();
      } else {
        this.currentSession = null;
      }
    }

    return this.currentSession;
  }

  /**
   * Forces creation of a new session, replacing any existing session
   */
  public createSession(): AnonymousSession {
    this.currentSession = this.createNewSession();
    this.saveSession();
    return this.currentSession;
  }

  /**
   * Updates the session's last active timestamp
   */
  public updateActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date().toISOString();
      this.saveSession();
    }
  }

  /**
   * Adds an item to the session's cart
   */
  public addToCart(itemId: string): void {
    const session = this.getOrCreateSession();
    if (session && session.data) {
      if (!session.data.cartItems.includes(itemId)) {
        session.data.cartItems.push(itemId);
        this.saveSession();
      }
    }
  }

  /**
   * Removes an item from the session's cart
   */
  public removeFromCart(itemId: string): void {
    if (this.currentSession && this.currentSession.data) {
      const index = this.currentSession.data.cartItems.indexOf(itemId);
      if (index > -1) {
        this.currentSession.data.cartItems.splice(index, 1);
        this.saveSession();
      }
    }
  }

  /**
   * Gets the current cart items
   */
  public getCartItems(): string[] {
    return this.currentSession?.data?.cartItems ?? [];
  }

  /**
   * Sets the conversation ID for the current session
   */
  public setConversationId(conversationId: string): void {
    const session = this.getOrCreateSession();
    if (session && session.data) {
      if (!session.data.conversationIds) {
        session.data.conversationIds = [];
      }
      if (!session.data.conversationIds.includes(conversationId)) {
        session.data.conversationIds.push(conversationId);
        this.saveSession();
      }
    }
  }

  /**
   * Gets the current conversation IDs
   */
  public getConversationIds(): string[] {
    return this.currentSession?.data?.conversationIds ?? [];
  }

  /**
   * Clears the current session and removes it from storage
   */
  public clearSession(): void {
    this.currentSession = null;
    this.storage.removeItem(this.config.storageKey);
  }

  /**
   * Clears only the session ID (alias for clearSession for backward compatibility)
   */
  public clearSessionId(): void {
    this.clearSession();
  }

  /**
   * Checks if the current session is valid (exists and not expired)
   */
  public isSessionValid(): boolean {
    return (
      this.currentSession !== null &&
      !this.isSessionExpired(this.currentSession)
    );
  }

  /**
   * Gets session metadata
   */
  public getSessionMetadata(): Record<string, any> | undefined {
    return this.currentSession?.data?.metadata;
  }

  /**
   * Updates session metadata
   */
  public updateMetadata(metadata: Record<string, any>): void {
    const session = this.getOrCreateSession();
    if (session && session.data) {
      session.data.metadata = {
        ...session.data.metadata,
        ...metadata,
      };
      this.saveSession();
    }
  }

  /**
   * Creates a new anonymous session
   */
  private createNewSession(): AnonymousSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.expiryMs);

    return {
      sessionId: this.generateSessionId(),
      createdAt: now.toISOString(),
      lastActivity: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      data: {
        cartItems: [],
        conversationIds: [],
        metadata:
          typeof navigator !== "undefined" && navigator.userAgent
            ? { userAgent: navigator.userAgent }
            : {},
      },
    };
  }

  /**
   * Generates a unique session ID
   */
  private generateSessionId(): string {
    // Generate a UUID-like string for the session ID
    return (
      "anon_" +
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })
    );
  }

  /**
   * Loads session from storage
   */
  private loadSession(): void {
    try {
      const storedData = this.storage.getItem(this.config.storageKey);
      if (storedData) {
        const parsed = JSON.parse(storedData) as AnonymousSession;

        // Check if session is still valid (dates are stored as ISO strings)
        if (!this.isSessionExpired(parsed)) {
          this.currentSession = parsed;
        } else {
          // Clean up expired session
          this.storage.removeItem(this.config.storageKey);
        }
      }
    } catch (error) {
      // If there's an error loading the session, start fresh
      this.storage.removeItem(this.config.storageKey);
      this.currentSession = null;
    }
  }

  /**
   * Saves the current session to storage
   */
  private saveSession(): void {
    if (this.currentSession) {
      try {
        const serialized = JSON.stringify(this.currentSession);
        this.storage.setItem(this.config.storageKey, serialized);
      } catch (error) {
        // If storage fails, continue without persistence
        console.warn("Failed to save anonymous session to storage:", error);
      }
    }
  }

  /**
   * Checks if a session is expired
   */
  private isSessionExpired(session: AnonymousSession): boolean {
    return new Date() > new Date(session.expiresAt);
  }
}

/**
 * Creates a new AnonymousSessionManager with default configuration
 */
export function createAnonymousSessionManager(
  config?: AnonymousSessionManagerConfig,
): AnonymousSessionManager {
  return new AnonymousSessionManager(config);
}

/**
 * Creates an AnonymousSessionManager that uses memory storage only (no persistence)
 */
export function createMemoryAnonymousSessionManager(
  config?: Omit<AnonymousSessionManagerConfig, "storage">,
): AnonymousSessionManager {
  return new AnonymousSessionManager({
    ...config,
    storage: new MemoryStorage(),
  });
}
