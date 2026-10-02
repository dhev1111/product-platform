/**
 * Minimal asynchronous key/value port. The registry and future stage
 * implementations depend on this abstraction, never on a concrete store, so
 * persistence can be swapped (in-memory → file → database) without touching
 * domain code.
 */
export interface Storage {
  /** Read a value; `undefined` when the key does not exist. */
  get<T>(key: string): Promise<T | undefined>;

  /** Write a value under a key. */
  set<T>(key: string, value: T): Promise<void>;

  /** Remove a key. Resolves `true` when the key existed. */
  delete(key: string): Promise<boolean>;

  /** List stored keys, optionally filtered by prefix. */
  keys(prefix?: string): Promise<string[]>;
}
