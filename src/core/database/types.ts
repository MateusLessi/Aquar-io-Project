/** A value SQLite can store. */
export type SqlValue = string | number | null;

/**
 * The minimal database contract the app depends on. The app uses expo-sqlite;
 * tests use Node's built-in SQLite with the exact same SQL.
 */
export type Database = {
  /** Runs one or more statements without parameters (schema changes). */
  exec(sql: string): Promise<void>;
  /** Runs a statement that changes data. */
  run(sql: string, params?: SqlValue[]): Promise<{ changes: number }>;
  /** Returns every matching row. */
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  /** Returns the first matching row, or null. */
  get<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  /** Runs `work` atomically: all of it is saved, or none of it. */
  transaction(work: () => Promise<void>): Promise<void>;
};
