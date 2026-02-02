import fs from "fs/promises";
import type { CacheEntry, StorageAdapter } from "../types";

/**
 * File-based storage adapter for Node/Bun environments
 */
export class FileAdapter<V> implements StorageAdapter<string, V> {
  constructor(private readonly filePath: string = "./cache-data.json") {}

  async load(): Promise<Map<string, CacheEntry<V>>> {
    try {
      const data = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(data) as Array<[string, CacheEntry<V>]>;
      return new Map(parsed);
    } catch {
      return new Map();
    }
  }

  async save(data: Map<string, CacheEntry<V>>): Promise<void> {
    try {
      const serialized = JSON.stringify(Array.from(data.entries()), null, 2);
      await fs.writeFile(this.filePath, serialized, "utf-8");
    } catch {
      // Silently fail on file system errors
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch {
      // File might not exist, that's fine
    }
  }
}
