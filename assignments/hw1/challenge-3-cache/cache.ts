import { MemoryAdapter } from "./adapters";
import type { CacheEntry, StorageAdapter } from "./types";

/**
 * Configuration options for the Cache instance.
 * @template K - The type of cache keys
 * @template V - The type of cached values
 */
export interface CacheConfig<K, V> {
  /** Maximum number of entries before LRU eviction (default: 100) */
  maxSize?: number;
  /** Default TTL in milliseconds for entries without explicit TTL (default: null = no expiration) */
  defaultTTL?: number;
  /** Storage adapter for persistence (default: MemoryAdapter) */
  storage?: StorageAdapter<K, V>;
  /** Whether to persist on every change (default: true) */
  persistOnChange?: boolean;
}

/**
 * A generic cache with TTL and LRU eviction support.
 *
 * Features:
 * - Time-to-live (TTL) per entry or default
 * - Least Recently Used (LRU) eviction when full
 * - Pluggable persistence via StorageAdapter
 *
 * @template K - The type of cache keys
 * @template V - The type of cached values
 *
 * @example
 * ```typescript
 * const cache = new Cache<string, User>({ maxSize: 50, defaultTTL: 60000 });
 * await cache.set('user:1', { name: 'Alice' });
 * const user = await cache.get('user:1');
 * ```
 */
export class Cache<K, V> {
  private data: Map<K, CacheEntry<V>> = new Map();
  private accessOrder: K[] = [];
  private readonly maxSize: number;
  private readonly defaultTTL: number | null;
  private readonly storage: StorageAdapter<K, V>;
  private readonly persistOnChange: boolean;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(config: CacheConfig<K, V> = {}) {
    this.maxSize = config.maxSize ?? 100;
    this.defaultTTL = config.defaultTTL ?? null;
    this.storage = config.storage ?? new MemoryAdapter<K, V>();
    this.persistOnChange = config.persistOnChange ?? true;
  }

  /**
   * Initialize the cache by loading from storage.
   * Called automatically on first cache operation.
   */
  private async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const loaded = await this.storage.load();

      // Filter out expired entries during load
      const now = Date.now();
      for (const [key, entry] of loaded) {
        if (entry.expiresAt === null || entry.expiresAt > now) {
          this.data.set(key, entry);
          this.accessOrder.push(key);
        }
      }

      // Sort by last accessed time to restore LRU order
      this.accessOrder.sort((a, b) => {
        const entryA = this.data.get(a);
        const entryB = this.data.get(b);
        return (entryA?.lastAccessed ?? 0) - (entryB?.lastAccessed ?? 0);
      });

      this.initialized = true;
    })();

    return this.initPromise;
  }

  /**
   * Update access order for LRU tracking.
   * Moves the key to the end of the access order list.
   * @param key - The cache key to mark as recently accessed
   */
  private touch(key: K): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);

    const entry = this.data.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder.shift()!;
    this.data.delete(lruKey);
  }

  /**
   * Check if an entry has expired based on its TTL.
   * @param entry - The cache entry to check
   * @returns True if the entry has expired, false otherwise
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    if (entry.expiresAt === null) return false;
    return Date.now() > entry.expiresAt;
  }

  /**
   * Persist current cache state to storage if persistOnChange is enabled.
   */
  private async persist(): Promise<void> {
    if (this.persistOnChange) {
      await this.storage.save(this.data);
    }
  }

  /**
   * Get a value from the cache.
   * Returns undefined if the key doesn't exist or has expired.
   * @param key - The key to retrieve
   * @returns A promise that resolves to the value, or undefined if not found
   */
  async get(key: K): Promise<V | undefined> {
    await this.init();

    const entry = this.data.get(key);
    if (!entry) return undefined;

    // Check expiration
    if (this.isExpired(entry)) {
      await this.delete(key);
      return undefined;
    }

    // Update LRU order
    this.touch(key);
    await this.persist();

    return entry.value;
  }

  /**
   * Set a value in the cache.
   * If the cache is at capacity, the least recently used entry is evicted.
   * @param key - The key to store the value under
   * @param value - The value to cache
   * @param ttl - Optional TTL in milliseconds (overrides defaultTTL)
   */
  async set(key: K, value: V, ttl?: number): Promise<void> {
    await this.init();

    // Calculate expiration
    const ttlMs = ttl ?? this.defaultTTL;
    const expiresAt = ttlMs !== null ? Date.now() + ttlMs : null;

    // If key exists, update it
    if (this.data.has(key)) {
      this.data.set(key, {
        value,
        expiresAt,
        lastAccessed: Date.now(),
      });
      this.touch(key);
    } else {
      // Evict if at capacity
      while (this.data.size >= this.maxSize) {
        this.evictLRU();
      }

      // Add new entry
      this.data.set(key, {
        value,
        expiresAt,
        lastAccessed: Date.now(),
      });
      this.accessOrder.push(key);
    }

    await this.persist();
  }

  /**
   * Delete a key from the cache.
   * @param key - The key to delete
   */
  async delete(key: K): Promise<void> {
    await this.init();

    this.data.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    await this.persist();
  }

  /**
   * Check if a key exists in the cache and is not expired.
   * @param key - The key to check
   * @returns A promise that resolves to true if the key exists and is valid
   */
  async has(key: K): Promise<boolean> {
    await this.init();

    const entry = this.data.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all entries from the cache and storage.
   */
  async clear(): Promise<void> {
    await this.init();

    this.data.clear();
    this.accessOrder = [];

    await this.storage.clear();
  }

  /**
   * Get the current number of entries in the cache.
   * Note: May include expired entries that haven't been cleaned up yet.
   * @returns The number of entries in the cache
   */
  size(): number {
    return this.data.size;
  }

  /**
   * Get all keys currently in the cache.
   * Note: May include keys for expired entries that haven't been cleaned up yet.
   * @returns An array of all cache keys
   */
  keys(): K[] {
    return Array.from(this.data.keys());
  }

  /**
   * Force persist the current cache state to storage.
   * Useful when persistOnChange is disabled and manual save is needed.
   */
  async save(): Promise<void> {
    await this.storage.save(this.data);
  }
}
