import type { SqlValue } from '../database/types';

export type SyncRow = Record<string, SqlValue> & { id: string; updated_at: string };
/** A row as the cloud returns it, stamped with the moment the server accepted it. */
export type RemoteRow = SyncRow & { server_updated_at: string };

/**
 * The cloud side of sync. The server keeps the newest version of each row
 * (last write wins on `updated_at`) and stamps `server_updated_at` on every accepted write.
 */
export type SyncRemote = {
  /**
   * Uploads rows; the server ignores any that are older than what it has. `conflictKey` names
   * the columns that identify a row in the cloud (default `id`).
   */
  push(table: string, rows: SyncRow[], conflictKey?: string): Promise<void>;
  /** Rows accepted after `since` (all when null), oldest first. */
  pull(table: string, since: string | null, limit: number): Promise<RemoteRow[]>;
};
