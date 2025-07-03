/**
 * @file cache-manager.ts
 * @description This component provides a caching layer for the flight aggregator.
 *
 * The CacheManager is responsible for storing and retrieving results from previous
 * API calls to various flight data providers. This is a critical optimization to
 * reduce latency, minimize API costs, and avoid rate-limiting.
 *
 * For the MVP, this will be a simple in-memory cache with a Time-To-Live (TTL).
 * In the future, this could be backed by a more persistent, distributed cache
 * like Redis or Memcached.
 */
export declare class CacheManager<T> {
    private cache;
    private ttl;
    /**
     * Initializes the cache manager.
     * @param {number} ttl - The time-to-live for cache entries in milliseconds. Default is 5 minutes.
     */
    constructor(ttl?: number);
    /**
     * Generates a standardized cache key for flight data.
     * @param {string} flightNumber - The flight number (e.g., "BT318").
     * @param {string} date - Optional date in ISO format. Defaults to today's date.
     * @returns {string} A standardized cache key.
     */
    generateCacheKey(flightNumber: string, date?: string): string;
    /**
     * Generates a cache key for weather data.
     * @param {string} airportCode - The airport IATA code (e.g., "JFK").
     * @param {string} date - Optional date in ISO format. Defaults to today's date.
     * @returns {string} A standardized cache key for weather data.
     */
    generateWeatherCacheKey(airportCode: string, date?: string): string;
    /**
     * Retrieves an entry from the cache.
     * Returns null if the entry does not exist or has expired.
     * @param {string} key - The key for the cache entry.
     * @returns {T | null} The cached data or null.
     */
    get(key: string): T | null;
    /**
     * Adds or updates an entry in the cache.
     * @param {string} key - The key for the cache entry.
     * @param {T} data - The data to be cached.
     */
    set(key: string, data: T): void;
    /**
     * Checks if a valid (non-expired) entry exists for a key.
     * @param {string} key - The key to check.
     * @returns {boolean} True if a valid entry exists, false otherwise.
     */
    has(key: string): boolean;
    /**
     * Deletes an entry from the cache.
     * @param {string} key - The key to delete.
     */
    delete(key: string): void;
    /**
     * Clears the entire cache.
     */
    clear(): void;
}
//# sourceMappingURL=cache-manager.d.ts.map