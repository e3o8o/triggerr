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
export class CacheManager {
    cache;
    ttl; // Time-To-Live in milliseconds
    /**
     * Initializes the cache manager.
     * @param {number} ttl - The time-to-live for cache entries in milliseconds. Default is 5 minutes.
     */
    constructor(ttl = 5 * 60 * 1000) {
        this.cache = new Map();
        this.ttl = ttl;
        console.log(`CacheManager instantiated with a TTL of ${ttl / 1000} seconds.`);
    }
    /**
     * Generates a standardized cache key for flight data.
     * @param {string} flightNumber - The flight number (e.g., "BT318").
     * @param {string} date - Optional date in ISO format. Defaults to today's date.
     * @returns {string} A standardized cache key.
     */
    generateCacheKey(flightNumber, date) {
        const dateStr = date || new Date().toISOString().split("T")[0];
        const normalizedFlightNumber = flightNumber.toUpperCase().trim();
        return `flight:${normalizedFlightNumber}:${dateStr}`;
    }
    /**
     * Generates a cache key for weather data.
     * @param {string} airportCode - The airport IATA code (e.g., "JFK").
     * @param {string} date - Optional date in ISO format. Defaults to today's date.
     * @returns {string} A standardized cache key for weather data.
     */
    generateWeatherCacheKey(airportCode, date) {
        const dateStr = date || new Date().toISOString().split("T")[0];
        const normalizedAirportCode = airportCode.toUpperCase().trim();
        return `weather:${normalizedAirportCode}:${dateStr}`;
    }
    /**
     * Retrieves an entry from the cache.
     * Returns null if the entry does not exist or has expired.
     * @param {string} key - The key for the cache entry.
     * @returns {T | null} The cached data or null.
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            console.log(`[CacheManager] Cache MISS for key: ${key}`);
            return null;
        }
        const isExpired = Date.now() - entry.timestamp > this.ttl;
        if (isExpired) {
            console.log(`[CacheManager] Cache STALE for key: ${key}`);
            this.cache.delete(key);
            return null;
        }
        console.log(`[CacheManager] Cache HIT for key: ${key}`);
        return entry.data;
    }
    /**
     * Adds or updates an entry in the cache.
     * @param {string} key - The key for the cache entry.
     * @param {T} data - The data to be cached.
     */
    set(key, data) {
        console.log(`[CacheManager] SETTING cache for key: ${key}`);
        const entry = {
            data,
            timestamp: Date.now(),
        };
        this.cache.set(key, entry);
    }
    /**
     * Checks if a valid (non-expired) entry exists for a key.
     * @param {string} key - The key to check.
     * @returns {boolean} True if a valid entry exists, false otherwise.
     */
    has(key) {
        return this.get(key) !== null;
    }
    /**
     * Deletes an entry from the cache.
     * @param {string} key - The key to delete.
     */
    delete(key) {
        console.log(`[CacheManager] DELETING cache for key: ${key}`);
        this.cache.delete(key);
    }
    /**
     * Clears the entire cache.
     */
    clear() {
        console.log("[CacheManager] CLEARING entire cache.");
        this.cache.clear();
    }
}
//# sourceMappingURL=cache-manager.js.map