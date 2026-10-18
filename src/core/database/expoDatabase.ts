import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { Database, SqlValue } from './types';

/** Adapts expo-sqlite to the app's Database contract. */
export function fromExpoSQLite(db: SQLiteDatabase): Database {
  return {
    exec: (sql) => db.execAsync(sql),
    run: async (sql, params: SqlValue[] = []) => {
      const result = await db.runAsync(sql, params);
      return { changes: result.changes };
    },
    all: (sql, params: SqlValue[] = []) => db.getAllAsync(sql, params),
    get: (sql, params: SqlValue[] = []) => db.getFirstAsync(sql, params),
    transaction: (work) => db.withTransactionAsync(work),
  };
}

export async function openAppDatabase(name = 'aquario.db'): Promise<Database> {
  const db = await openDatabaseAsync(name);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return fromExpoSQLite(db);
}
