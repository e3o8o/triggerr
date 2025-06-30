// ===========================================================================
// API SDK - CACHE UTILITY
// ===========================================================================

import { CacheError, CacheOperation } from '../types/errors';

// ===========================================================================
// CACHE INTERFACES
// ===========================================================================

/**
 * Represents a cached item with metadata
 */
export interface CacheItem<T> {
  /**
   * The actual cached data
   */
  data: T;

  /**
   * When this item was added to the cache
   */
  createdAt: number;

  /**
   * When this item will expire (timestamp)
   */
  expiresAt: number;

  /**
   * Optional metadata for the cached item
   */
  metadata?: Record<string, any> | undefined;
}

/**
 * Basic configuration for cache operations
 */
export interface CacheOptions {
  /**
   * Time to live in milliseconds
   */
  ttl?: number;

  /**
   * Optional metadata to store with the cached item
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for cache storage implementations
 */
export interface CacheStore {
  /**
   * Gets an item from the cache
   * @param key The cache key
   * @returns The cached item or undefined if not found
   */
  get<T>(key: string): Promise<CacheItem<T> | undefined>;

  /**
   * Sets an item in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param options Cache options including TTL
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Removes an item from the cache
   * @param key The cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Removes all items from the cache
   */
  clear(): Promise<void>;

  /**
   * Gets all cache keys that match a pattern
   * @param pattern The pattern to match (implementation specific)
   */
  keys(pattern?: string): Promise<string[]>;

  /**
   * Gets the number of items in the cache
   */
  size(): Promise<number>;
}

/**
 * High-level cache manager interface
 */
export interface CacheManager {
  /**
   * Gets a cached value
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * Sets a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Time to live in milliseconds (overrides default)
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Removes a cached value
   * @param key The cache key
   */
  remove(key: string): Promise<void>;

  /**
   * Removes all cached values
   */
  clear(): Promise<void>;

  /**
   * Removes all cached values matching a pattern
   * @param pattern The pattern to match (implementation specific)
   */
  invalidate(pattern: string): Promise<void>;
}

// ===========================================================================
// IN-MEMORY CACHE IMPLEMENTATION
// ===========================================================================

/**
 * Simple in-memory cache implementation
 */
export class InMemoryCacheStore implements CacheStore {
  private cache: Map<string, CacheItem<any>>;
  private cleanupInterval: number | NodeJS.Timeout;
  private readonly DEFAULT_CLEANUP_INTERVAL = 60000; // 1 minute

  constructor(cleanupInterval?: number) {
    this.cache = new Map();
    this.cleanupInterval = cleanupInterval || this.DEFAULT_CLEANUP_INTERVAL;
    this.startCleanupTimer();
  }

  public async get<T>(key: string): Promise<CacheItem<T> | undefined> {
    const item = this.cache.get(key) as CacheItem<T> | undefined;

    if (!item) {
      return undefined;
    }

    // Check if item has expired
    if (item.expiresAt < Date.now()) {
      await this.delete(key);
      return undefined;
    }

    return item;
  }

  public async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const now = Date.now();
    const ttl = options.ttl || 300000; // Default 5 minutes
    const expiresAt = now + ttl;

    const item: CacheItem<T> = {
      data: value,
      createdAt: now,
      expiresAt,
      metadata: options.metadata || undefined,
    };

    this.cache.set(key, item);
  }

  public async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  public async clear(): Promise<void> {
    this.cache.clear();
  }

  public async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());

    if (!pattern) {
      return allKeys;
    }

    // Simple pattern matching using glob-like syntax
    const regexPattern = this.patternToRegex(pattern);
    return allKeys.filter((key) => regexPattern.test(key));
  }

  public async size(): Promise<number> {
    return this.cache.size;
  }

  /**
   * Stops the cleanup timer
   */
  public dispose(): void {
    if (typeof this.cleanupInterval === 'number') {
      return;
    }
    clearInterval(this.cleanupInterval as NodeJS.Timeout);
  }

  /**
   * Converts a simple glob pattern to a RegExp
   * Supports * (any characters) and ? (single character)
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const converted = escaped
      .replace(/\\\*/g, '.*')
      .replace(/\\\?/g, '.');
    return new RegExp(`^${converted}$`);
  }

  private startCleanupTimer(): void {
    if (typeof this.cleanupInterval === 'number') {
      this.cleanupInterval = setInterval(() => this.removeExpiredItems(), this.cleanupInterval);
    }
  }

  private async removeExpiredItems(): Promise<void> {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

// ===========================================================================
// CACHE MANAGER IMPLEMENTATION
// ===========================================================================

/**
 * Default cache manager implementation
 */
export class DefaultCacheManager implements CacheManager {
  private store: CacheStore;
  private defaultTtl: number;

  constructor(options: {
    store: CacheStore;
    defaultTtl?: number | undefined;
  }) {
    this.store = options.store;
    this.defaultTtl = options.defaultTtl ?? 300000; // Default 5 minutes
  }

  public async get<T>(key: string): Promise<T | undefined> {
    try {
      const item = await this.store.get<T>(key);
      return item ? item.data : undefined;
    } catch (error) {
      throw new CacheError(
        `Failed to get item from cache: ${error instanceof Error ? error.message : String(error)}`,
        CacheOperation.GET,
        key
      );
    }
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.store.set(key, value, {
        ttl: ttl || this.defaultTtl,
      });
    } catch (error) {
      throw new CacheError(
        `Failed to set item in cache: ${error instanceof Error ? error.message : String(error)}`,
        CacheOperation.SET,
        key
      );
    }
  }

  public async remove(key: string): Promise<void> {
    try {
      await this.store.delete(key);
    } catch (error) {
      throw new CacheError(
        `Failed to remove item from cache: ${error instanceof Error ? error.message : String(error)}`,
        CacheOperation.DELETE,
        key
      );
    }
  }

  public async clear(): Promise<void> {
    try {
      await this.store.clear();
    } catch (error) {
      throw new CacheError(
        `Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`,
        CacheOperation.CLEAR,
        'all'
      );
    }
  }

  public async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.store.keys(pattern);
      await Promise.all(keys.map((key) => this.store.delete(key)));
    } catch (error) {
      throw new CacheError(
        `Failed to invalidate cache with pattern ${pattern}: ${error instanceof Error ? error.message : String(error)}`,
        CacheOperation.INVALIDATE,
        pattern
      );
    }
  }

  /**
   * Gets the underlying cache store
   */
  public getStore(): CacheStore {
    return this.store;
  }

  /**
   * Gets the default TTL value
   */
  public getDefaultTtl(): number {
    return this.defaultTtl;
  }
}

// ===========================================================================
// UTILITY FUNCTIONS
// ===========================================================================

/**
 * Creates a new in-memory cache manager with default settings
 */
export function createInMemoryCache(options?: {
  defaultTtl?: number;
  cleanupInterval?: number;
}): CacheManager {
  const store = new InMemoryCacheStore(options?.cleanupInterval);
  const config: { store: CacheStore; defaultTtl?: number | undefined } = { store };

  if (options?.defaultTtl !== undefined) {
    config.defaultTtl = options.defaultTtl;
  }

  return new DefaultCacheManager(config);
}

/**
 * Cache factory - creates different types of cache managers
 */
export const CacheFactory = {
  /**
   * Creates an in-memory cache
   */
  memory(options?: { defaultTtl?: number; cleanupInterval?: number }): CacheManager {
    return createInMemoryCache(options);
  },

  /**
   * Creates a no-op cache that doesn't actually cache anything
   */
  none(): CacheManager {
    return {
      async get<T>(_key: string): Promise<T | undefined> {
        return undefined;
      },
      async set<T>(_key: string, _value: T, _ttl?: number): Promise<void> {
        // No-op
      },
      async remove(_key: string): Promise<void> {
        // No-op
      },
      async clear(): Promise<void> {
        // No-op
      },
      async invalidate(_pattern: string): Promise<void> {
        // No-op
      },
    };
  },
};
