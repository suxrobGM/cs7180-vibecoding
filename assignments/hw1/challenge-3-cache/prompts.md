# Challenge 3: Caching Layer - Prompt Iterations

## Version 1

**Prompt:**

```text
Create a caching system with TTL and LRU eviction.
```

**Generated Code Issues:**

- JavaScript instead of TypeScript
- No type safety for cached values
- LRU logic incomplete
- No persistence layer

**Test Results:**

- Basic get/set works
- TTL expiration works
- LRU eviction buggy with edge cases

---

## Version 2

**Prompt:**

```text
You are a backend engineer. Create a TypeScript caching layer with:

1. Generic types for key-value pairs
2. TTL (time-to-live) for each entry
3. LRU (Least Recently Used) eviction when max size reached
4. Persistence using localStorage or file system
5. Configurable max size

Include methods: get, set, delete, clear, has
```

**Improvements Made:**

- Role (backend engineer)
- Specified generics
- Listed required methods
- Mentioned persistence options

**Generated Code Issues:**

- Good generics but persistence tightly coupled
- File/localStorage not abstracted
- Edge cases in LRU not handled

**Test Results:**

- Core functionality works
- Persistence works but not swappable
- Some edge cases fail (concurrent access)

---

## Version 3

**Prompt:**

```text
You are a senior software engineer specializing in system design. Implement a production-grade caching layer with these specifications:

## Core Requirements
- TypeScript with strict mode
- Generic key-value storage: Cache<K, V>
- Thread-safe for async operations

## Features

### 1. TTL (Time-to-Live)
- Set TTL per entry or use default
- Entries expire and are removed on next access
- Method: `set(key, value, ttlMs?)`

### 2. LRU Eviction
- Track access order (get and set update recency)
- Evict least recently used when capacity reached
- Configurable maxSize (default: 100)

### 3. Persistence Layer (Abstract)
interface StorageAdapter<K, V> {
  load(): Promise<Map<K, CacheEntry<V>>>;
  save(data: Map<K, CacheEntry<V>>): Promise<void>;
  clear(): Promise<void>;
}

Provide two implementations:
- LocalStorageAdapter (browser)
- FileAdapter (Node/Bun, using JSON file)

### 4. Cache Interface
interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  storage?: StorageAdapter<K, V>;
}

class Cache<K, V> {
  constructor(config?: CacheConfig);
  get(key: K): Promise<V | undefined>;
  set(key: K, value: V, ttl?: number): Promise<void>;
  delete(key: K): Promise<void>;
  has(key: K): Promise<boolean>;
  clear(): Promise<void>;
  size(): number;
}

## Constraints
- No external dependencies
- Handle serialization edge cases (Date, undefined)
- Graceful error handling for storage failures

## Output Format
1. cache.ts - Main Cache class with LRU logic
2. storage.ts - StorageAdapter interface and implementations
3. cache.test.ts - Comprehensive tests using bun:test

## Test Cases to Include
- Basic get/set/delete/has/clear
- TTL expiration
- LRU eviction order
- Persistence save/load
- Edge cases: empty cache, full cache, expired entries

Write clean, well-structured code. Prioritize correctness and clarity.
```

**Improvements Made:**

- System design role for architectural thinking
- Abstract StorageAdapter interface
- Both storage implementations requested
- Async API for persistence compatibility
- Explicit error handling requirements
- Comprehensive test cases specified

**Test Results:**

- All core methods work correctly
- TTL and LRU work as expected
- Storage adapters are swappable
- Tests pass including edge cases
- Clean separation of concerns

---

## Version 4

**Prompt:**

```text
You are a senior software architect. Refactor the caching layer to follow clean architecture principles:

## Directory Structure
challenge-3-cache/
├── types.ts              # Shared types (CacheEntry, StorageAdapter interface)
├── cache.ts              # Main Cache class (slim, delegates to adapters)
├── cache.test.ts         # Comprehensive tests
└── adapters/
    ├── index.ts          # Barrel export for all adapters
    ├── memory-adapter.ts # In-memory storage (no persistence)
    ├── local-storage-adapter.ts # Browser localStorage
    └── file-adapter.ts   # Node/Bun file system

## Refactoring Goals
1. Single Responsibility: Each adapter in its own file
2. Types extracted to dedicated types.ts
3. Barrel exports for clean imports
4. Kebab-case file naming
5. Remove storage.ts monolith

## Adapter Interface
Each adapter implements StorageAdapter<K, V> from types.ts:
- MemoryAdapter: Simple Map wrapper, no persistence
- LocalStorageAdapter: Browser-compatible with JSON serialization
- FileAdapter: File system with async read/write

## Import Pattern
import { Cache } from './cache';
import { MemoryAdapter, FileAdapter } from './adapters';

const cache = new Cache({ storage: new FileAdapter('./cache.json') });

Provide modular, testable code with clear boundaries.
```

**Improvements Made:**

- Single file per adapter (single responsibility)
- Types extracted to dedicated file
- Barrel exports for clean imports
- Consistent kebab-case naming
- Easier to test individual adapters
- Easier to add new adapters

**Test Results:**

- All existing tests still pass
- Cleaner import statements
- Each adapter independently testable
- Better code organization
- Follows modern TypeScript patterns
