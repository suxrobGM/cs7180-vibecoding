import type { CacheEntry, StorageAdapter } from "../types";

/**
 * LocalStorage adapter for browser environments
 */
export class LocalStorageAdapter<V> implements StorageAdapter<string, V> {
  constructor(private readonly storageKey: string = "cache-data") {}

  async load(): Promise<Map<string, CacheEntry<V>>> {
    try {
      if (typeof localStorage === "undefined") {
        return new Map();
      }

      const data = localStorage.getItem(this.storageKey);
      if (!data) return new Map();

      const parsed = JSON.parse(data) as Array<[string, CacheEntry<V>]>;
      return new Map(parsed);
    } catch {
      return new Map();
    }
  }

  async save(data: Map<string, CacheEntry<V>>): Promise<void> {
    try {
      if (typeof localStorage === "undefined") {
        return;
      }

      const serialized = JSON.stringify(Array.from(data.entries()));
      localStorage.setItem(this.storageKey, serialized);
    } catch {
      // Silently fail on storage errors (quota exceeded, etc.)
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(this.storageKey);
      }
    } catch {
      // Silently fail
    }
  }
}
