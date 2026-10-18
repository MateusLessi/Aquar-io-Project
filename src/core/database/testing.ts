// Test helper: a real SQLite database in memory, using Node's built-in driver.
import type { Database, SqlValue } from './types';

type NodeStatement = {
  run(...params: SqlValue[]): { changes: number | bigint };
  all(...params: SqlValue[]): unknown[];
  get(...params: SqlValue[]): unknown;
};
type NodeDatabase = { exec(sql: string): void; prepare(sql: string): NodeStatement };

export function createMemoryDatabase(): Database {
  // Loaded lazily so the app bundle never references node:sqlite.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (path: string) => NodeDatabase;
  };
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');

  return {
    exec: async (sql) => db.exec(sql),
    run: async (sql, params = []) => ({ changes: Number(db.prepare(sql).run(...params).changes) }),
    all: async <T>(sql: string, params: SqlValue[] = []) => db.prepare(sql).all(...params) as T[],
    get: async <T>(sql: string, params: SqlValue[] = []) =>
      (db.prepare(sql).get(...params) as T | undefined) ?? null,
    transaction: async (work) => {
      db.exec('BEGIN');
      try {
        await work();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
