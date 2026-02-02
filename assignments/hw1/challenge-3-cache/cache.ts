import { MemoryAdapter } from "./adapters/memory-adapter";
import type { CacheEntry, StorageAdapter } from "./types";

export interface CacheConfig<K, V> {
  maxSize?: number;
  defaultTTL?: number;
  storage?: StorageAdapter<K, V>;
  persistOnChange?: boolean;
}

/**
 * A generic cache with TTL and LRU eviction support.
 *
 * Features:
 * - Time-to-live (TTL) per entry or default
 * - Least Recently Used (LRU) eviction when full
 * - Pluggable persistence via StorageAdapter
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
   * Initialize the cache by loading from storage
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
   * Update access order for LRU tracking
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
   * Check if an entry has expired
   */
  private isExpired(entry: CacheEntry<V>): boolean {
    if (entry.expiresAt === null) return false;
    return Date.now() > entry.expiresAt;
  }

  /**
   * Persist to storage if enabled
   */
  private async persist(): Promise<void> {
    if (this.persistOnChange) {
      await this.storage.save(this.data);
    }
  }

  /**
   * Get a value from the cache
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
   * Set a value in the cache
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
   * Delete a key from the cache
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
   * Check if a key exists (and is not expired)
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
   * Clear all entries
   */
  async clear(): Promise<void> {
    await this.init();

    this.data.clear();
    this.accessOrder = [];

    await this.storage.clear();
  }

  /**
   * Get the current size of the cache
   */
  size(): number {
    return this.data.size;
  }

  /**
   * Get all keys (including potentially expired ones)
   */
  keys(): K[] {
    return Array.from(this.data.keys());
  }

  /**
   * Force persist to storage
   */
  async save(): Promise<void> {
    await this.storage.save(this.data);
  }
}

export default Cache;
