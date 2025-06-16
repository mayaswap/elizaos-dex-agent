/**
 * Caching Service for ElizaOS DEX Agent
 * Provides efficient in-memory caching with TTL support
 */

import { logInfo, logDebug } from './logger.js';
import { cleanupManager } from '../utils/cleanupManager.js';
import { ICacheEntry } from '../types/extended.js';

export interface CacheOptions {
    maxSize?: number;           // Maximum number of entries
    defaultTTL?: number;        // Default TTL in milliseconds
    cleanupInterval?: number;   // Cleanup interval in milliseconds
    enableStats?: boolean;      // Track cache statistics
}

export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
    hitRate: number;
    size: number;
}

export class CacheService {
    private cache: Map<string, ICacheEntry> = new Map();
    private stats: CacheStats;
    private options: Required<CacheOptions>;
    private cleanupInterval?: NodeJS.Timeout;

    constructor(options: CacheOptions = {}) {
        this.options = {
            maxSize: options.maxSize || 1000,
            defaultTTL: options.defaultTTL || 5 * 60 * 1000, // 5 minutes
            cleanupInterval: options.cleanupInterval || 60 * 1000, // 1 minute
            enableStats: options.enableStats !== false
        };

        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            hitRate: 0,
            size: 0
        };

        // Start cleanup interval
        this.startCleanup();

        // Register with cleanup manager
        cleanupManager.registerCleanup(
            `cache-${Date.now()}`,
            'CacheService cleanup',
            () => this.destroy(),
            300 // Low priority
        );

        logInfo('CacheService initialized', {
            maxSize: this.options.maxSize,
            defaultTTL: this.options.defaultTTL
        });
    }

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key);

        if (!entry) {
            this.recordMiss();
            return null;
        }

        // Check if expired
        if (entry.expiry < Date.now()) {
            this.cache.delete(key);
            this.recordMiss();
            return null;
        }

        // Update last accessed and hits
        entry.lastAccessed = Date.now();
        if (entry.hits !== undefined) {
            entry.hits++;
        }

        this.recordHit();
        return entry.value as T;
    }

    /**
     * Get a value from cache or fetch it if not present
     */
    async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        // Try to get from cache first
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Fetch the value
        try {
            const value = await fetcher();
            await this.set(key, value, ttl);
            return value;
        } catch (error) {
            logDebug(`Cache fetch error for key ${key}`, { error });
            throw error;
        }
    }

    /**
     * Set a value in cache
     */
    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        // Check if we need to evict entries
        if (this.cache.size >= this.options.maxSize) {
            this.evictLRU();
        }

        const entry: ICacheEntry<T> = {
            value,
            expiry: Date.now() + (ttl || this.options.defaultTTL),
            hits: 0,
            lastAccessed: Date.now()
        };

        this.cache.set(key, entry);
        this.recordSet();

        logDebug(`Cache set: ${key}`, {
            ttl: ttl || this.options.defaultTTL,
            size: this.cache.size
        });
    }

    /**
     * Delete a value from cache
     */
    async delete(key: string): Promise<boolean> {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.recordDelete();
        }
        return deleted;
    }

    /**
     * Clear all cache entries
     */
    async clear(): Promise<void> {
        const size = this.cache.size;
        this.cache.clear();
        logInfo(`Cache cleared: ${size} entries removed`);
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? this.stats.hits / total : 0,
            size: this.cache.size
        };
    }

    /**
     * Get all keys in cache
     */
    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    /**
     * Check if key exists in cache
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;
        if (entry.expiry < Date.now()) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    /**
     * Get cache size
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Start cleanup interval
     */
    private startCleanup(): void {
        this.cleanupInterval = cleanupManager.trackInterval(
            setInterval(() => {
                this.cleanup();
            }, this.options.cleanupInterval),
            'CacheService cleanup interval'
        );
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiry < now) {
                this.cache.delete(key);
                removed++;
            }
        }

        if (removed > 0) {
            logDebug(`Cache cleanup: removed ${removed} expired entries`);
        }
    }

    /**
     * Evict least recently used entry
     */
    private evictLRU(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            const accessTime = entry.lastAccessed || 0;
            if (accessTime < oldestTime) {
                oldestTime = accessTime;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            logDebug(`Cache evicted LRU entry: ${oldestKey}`);
        }
    }

    /**
     * Record cache hit
     */
    private recordHit(): void {
        if (this.options.enableStats) {
            this.stats.hits++;
        }
    }

    /**
     * Record cache miss
     */
    private recordMiss(): void {
        if (this.options.enableStats) {
            this.stats.misses++;
        }
    }

    /**
     * Record cache set
     */
    private recordSet(): void {
        if (this.options.enableStats) {
            this.stats.sets++;
        }
    }

    /**
     * Record cache delete
     */
    private recordDelete(): void {
        if (this.options.enableStats) {
            this.stats.deletes++;
        }
    }

    /**
     * Destroy cache service
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cache.clear();
        logInfo('CacheService destroyed');
    }
}

// Singleton instances for different cache types
export const priceCache = new CacheService({
    maxSize: 500,
    defaultTTL: 60 * 1000, // 1 minute for prices
    enableStats: true
});

export const tokenCache = new CacheService({
    maxSize: 200,
    defaultTTL: 60 * 60 * 1000, // 1 hour for token metadata
    enableStats: true
});

export const poolCache = new CacheService({
    maxSize: 300,
    defaultTTL: 5 * 60 * 1000, // 5 minutes for pool data
    enableStats: true
});

export const generalCache = new CacheService({
    maxSize: 1000,
    defaultTTL: 10 * 60 * 1000, // 10 minutes default
    enableStats: true
});