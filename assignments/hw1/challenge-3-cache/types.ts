/**
 * Represents a single entry in the cache.
 * @template V - The type of the cached value
 */
export interface CacheEntry<V> {
  /** The cached value */
  value: V;
  /** Unix timestamp when the entry expires, or null if no expiration */
  expiresAt: number | null;
  /** Unix timestamp of the last access (for LRU tracking) */
  lastAccessed: number;
}

/**
 * Interface for storage adapters that handle cache persistence.
 * Implement this interface to create custom storage backends.
 * @template K - The type of cache keys
 * @template V - The type of cached values
 */
export interface StorageAdapter<K, V> {
  /**
   * Load all cached entries from storage.
   * @returns A promise that resolves to a Map of cache entries
   */
  load(): Promise<Map<K, CacheEntry<V>>>;

  /**
   * Save all cached entries to storage.
   * @param data - The Map of cache entries to persist
   */
  save(data: Map<K, CacheEntry<V>>): Promise<void>;

  /**
   * Clear all entries from storage.
   */
  clear(): Promise<void>;
}
