import { describe, expect, test, beforeEach } from 'bun:test';
import { Cache } from './cache';
import { MemoryAdapter } from './storage';
import type { CacheEntry, StorageAdapter } from './storage';

// Helper to wait for TTL expiration
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Cache', () => {
  describe('Basic Operations', () => {
    let cache: Cache<string, string>;

    beforeEach(() => {
      cache = new Cache({ maxSize: 5, persistOnChange: false });
    });

    test('set and get a value', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.get('key1')).toBe('value1');
    });

    test('get returns undefined for missing key', async () => {
      expect(await cache.get('nonexistent')).toBeUndefined();
    });

    test('has returns true for existing key', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.has('key1')).toBe(true);
    });

    test('has returns false for missing key', async () => {
      expect(await cache.has('nonexistent')).toBe(false);
    });

    test('delete removes a key', async () => {
      await cache.set('key1', 'value1');
      await cache.delete('key1');
      expect(await cache.get('key1')).toBeUndefined();
      expect(await cache.has('key1')).toBe(false);
    });

    test('clear removes all keys', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.clear();
      expect(cache.size()).toBe(0);
      expect(await cache.get('key1')).toBeUndefined();
      expect(await cache.get('key2')).toBeUndefined();
    });

    test('size returns correct count', async () => {
      expect(cache.size()).toBe(0);
      await cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      await cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });

    test('overwriting a key updates the value', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key1', 'value2');
      expect(await cache.get('key1')).toBe('value2');
      expect(cache.size()).toBe(1);
    });
  });

  describe('TTL (Time-to-Live)', () => {
    test('entry expires after TTL', async () => {
      const cache = new Cache<string, string>({ persistOnChange: false });
      await cache.set('key1', 'value1', 100); // 100ms TTL

      expect(await cache.get('key1')).toBe('value1');

      await sleep(150); // Wait for expiration

      expect(await cache.get('key1')).toBeUndefined();
    });

    test('entry with no TTL does not expire', async () => {
      const cache = new Cache<string, string>({ persistOnChange: false });
      await cache.set('key1', 'value1'); // No TTL

      await sleep(100);

      expect(await cache.get('key1')).toBe('value1');
    });

    test('default TTL is applied', async () => {
      const cache = new Cache<string, string>({
        defaultTTL: 100,
        persistOnChange: false,
      });
      await cache.set('key1', 'value1');

      await sleep(150);

      expect(await cache.get('key1')).toBeUndefined();
    });

    test('per-entry TTL overrides default', async () => {
      const cache = new Cache<string, string>({
        defaultTTL: 200,
        persistOnChange: false,
      });
      await cache.set('key1', 'value1', 100); // Override with 100ms

      await sleep(150);

      expect(await cache.get('key1')).toBeUndefined();
    });

    test('has returns false for expired entry', async () => {
      const cache = new Cache<string, string>({ persistOnChange: false });
      await cache.set('key1', 'value1', 100);

      await sleep(150);

      expect(await cache.has('key1')).toBe(false);
    });
  });

  describe('LRU Eviction', () => {
    test('evicts least recently used when full', async () => {
      const cache = new Cache<string, string>({
        maxSize: 3,
        persistOnChange: false,
      });

      await cache.set('a', '1');
      await cache.set('b', '2');
      await cache.set('c', '3');

      // Cache is full, adding 'd' should evict 'a'
      await cache.set('d', '4');

      expect(await cache.get('a')).toBeUndefined();
      expect(await cache.get('b')).toBe('2');
      expect(await cache.get('c')).toBe('3');
      expect(await cache.get('d')).toBe('4');
    });

    test('accessing a key updates its recency', async () => {
      const cache = new Cache<string, string>({
        maxSize: 3,
        persistOnChange: false,
      });

      await cache.set('a', '1');
      await cache.set('b', '2');
      await cache.set('c', '3');

      // Access 'a' to make it most recently used
      await cache.get('a');

      // Adding 'd' should evict 'b' (now least recently used)
      await cache.set('d', '4');

      expect(await cache.get('a')).toBe('1');
      expect(await cache.get('b')).toBeUndefined();
      expect(await cache.get('c')).toBe('3');
      expect(await cache.get('d')).toBe('4');
    });

    test('updating a key updates its recency', async () => {
      const cache = new Cache<string, string>({
        maxSize: 3,
        persistOnChange: false,
      });

      await cache.set('a', '1');
      await cache.set('b', '2');
      await cache.set('c', '3');

      // Update 'a' to make it most recently used
      await cache.set('a', 'updated');

      // Adding 'd' should evict 'b' (now least recently used)
      await cache.set('d', '4');

      expect(await cache.get('a')).toBe('updated');
      expect(await cache.get('b')).toBeUndefined();
    });
  });

  describe('Persistence', () => {
    test('saves and loads from storage adapter', async () => {
      // Create a mock storage that stores in-memory
      const storage: Map<string, CacheEntry<string>> = new Map();
      const mockAdapter: StorageAdapter<string, string> = {
        async load() {
          return new Map(storage);
        },
        async save(data) {
          storage.clear();
          for (const [k, v] of data) {
            storage.set(k, v);
          }
        },
        async clear() {
          storage.clear();
        },
      };

      // Create cache and add data
      const cache1 = new Cache<string, string>({
        storage: mockAdapter,
        persistOnChange: true,
      });
      await cache1.set('key1', 'value1');
      await cache1.set('key2', 'value2');

      // Create new cache with same storage
      const cache2 = new Cache<string, string>({
        storage: mockAdapter,
        persistOnChange: true,
      });

      expect(await cache2.get('key1')).toBe('value1');
      expect(await cache2.get('key2')).toBe('value2');
    });

    test('expired entries are filtered on load', async () => {
      const storage: Map<string, CacheEntry<string>> = new Map();
      storage.set('expired', {
        value: 'old',
        expiresAt: Date.now() - 1000, // Already expired
        lastAccessed: Date.now() - 2000,
      });
      storage.set('valid', {
        value: 'current',
        expiresAt: Date.now() + 10000, // Not expired
        lastAccessed: Date.now(),
      });

      const mockAdapter: StorageAdapter<string, string> = {
        async load() {
          return new Map(storage);
        },
        async save() {},
        async clear() {},
      };

      const cache = new Cache<string, string>({
        storage: mockAdapter,
        persistOnChange: false,
      });

      expect(await cache.get('expired')).toBeUndefined();
      expect(await cache.get('valid')).toBe('current');
    });
  });

  describe('Edge Cases', () => {
    test('empty cache operations', async () => {
      const cache = new Cache<string, string>({ persistOnChange: false });

      expect(cache.size()).toBe(0);
      expect(await cache.get('any')).toBeUndefined();
      expect(await cache.has('any')).toBe(false);
      await cache.delete('any'); // Should not throw
      await cache.clear(); // Should not throw
    });

    test('cache with maxSize of 1', async () => {
      const cache = new Cache<string, string>({
        maxSize: 1,
        persistOnChange: false,
      });

      await cache.set('a', '1');
      expect(await cache.get('a')).toBe('1');

      await cache.set('b', '2');
      expect(await cache.get('a')).toBeUndefined();
      expect(await cache.get('b')).toBe('2');
    });

    test('handles different value types', async () => {
      const cache = new Cache<string, unknown>({ persistOnChange: false });

      await cache.set('string', 'hello');
      await cache.set('number', 42);
      await cache.set('object', { foo: 'bar' });
      await cache.set('array', [1, 2, 3]);
      await cache.set('null', null);

      expect(await cache.get('string')).toBe('hello');
      expect(await cache.get('number')).toBe(42);
      expect(await cache.get('object')).toEqual({ foo: 'bar' });
      expect(await cache.get('array')).toEqual([1, 2, 3]);
      expect(await cache.get('null')).toBeNull();
    });

    test('keys method returns all keys', async () => {
      const cache = new Cache<string, string>({ persistOnChange: false });

      await cache.set('a', '1');
      await cache.set('b', '2');
      await cache.set('c', '3');

      const keys = cache.keys();
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('c');
      expect(keys.length).toBe(3);
    });
  });
});
