export interface CacheEntry<V> {
  value: V;
  expiresAt: number | null;
  lastAccessed: number;
}

export interface StorageAdapter<K, V> {
  load(): Promise<Map<K, CacheEntry<V>>>;
  save(data: Map<K, CacheEntry<V>>): Promise<void>;
  clear(): Promise<void>;
}
