import type { CacheEntry, StorageAdapter } from "../types";

/**
 * In-memory storage adapter (no persistence)
 */
export class MemoryAdapter<K, V> implements StorageAdapter<K, V> {
  async load(): Promise<Map<K, CacheEntry<V>>> {
    return new Map();
  }

  async save(): Promise<void> {
    // No-op for memory storage
  }

  async clear(): Promise<void> {
    // No-op for memory storage
  }
}
