import { createContext, useContext } from 'react';

import type { Database } from '@/core/database/types';

export const DatabaseContext = createContext<Database | null>(null);

/** The local database, for whole-device actions (export, erase) in Ajustes. */
export function useDatabase(): Database {
  const db = useContext(DatabaseContext);
  if (!db) throw new Error('useDatabase must be used inside DatabaseContext.');
  return db;
}
