import type { DataChanges, DataTopic } from '../database/changes';
import type { Database, SqlValue } from '../database/types';
import type { RemoteRow, SyncRemote, SyncRow } from './remote';
import { syncedTables, type SyncedTable } from './tables';

const PUSH_BATCH = 200;
const PULL_PAGE = 500;
/**
 * Re-read a little before the last cursor: a write that committed late on the server can carry
 * an earlier stamp than one we already saw. Re-applying a row is harmless.
 */
const PULL_OVERLAP_MS = 30_000;

export type SyncResult = { pushed: number; pulled: number };

type SyncEngineDeps = {
  db: Database;
  remote: SyncRemote;
  changes: DataChanges;
  now?: () => Date;
  tables?: readonly SyncedTable[];
};

/**
 * Local-first sync (ADR-004): the device's SQLite stays the source of truth for the UI.
 * A sync uploads the queued local changes, then downloads what changed in the cloud.
 * Conflicts resolve per row: the most recent `updated_at` wins, on both sides.
 */
export function createSyncEngine({
  db,
  remote,
  changes,
  now = () => new Date(),
  tables = syncedTables,
}: SyncEngineDeps) {
  async function getState(key: string) {
    const row = await db.get<{ value: string }>('SELECT value FROM sync_state WHERE key = ?', [
      key,
    ]);
    return row?.value ?? null;
  }

  async function setState(key: string, value: string) {
    await db.run(
      `INSERT INTO sync_state (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
    );
  }

  async function push(table: SyncedTable): Promise<number> {
    let pushed = 0;
    const pending = await db.all<{ row_id: string; seq: number }>(
      'SELECT row_id, seq FROM sync_outbox WHERE table_name = ? ORDER BY seq',
      [table.name],
    );
    for (let start = 0; start < pending.length; start += PUSH_BATCH) {
      const batch = pending.slice(start, start + PUSH_BATCH);
      const rows = await db.all<SyncRow>(
        `SELECT ${table.columns.join(', ')} FROM ${table.name}
         WHERE id IN (${batch.map(() => '?').join(', ')})`,
        batch.map((entry) => entry.row_id),
      );
      if (rows.length > 0) await remote.push(table.name, rows, table.conflictKey);
      // Only clear entries that did not change again while we were uploading.
      for (const entry of batch) {
        await db.run('DELETE FROM sync_outbox WHERE table_name = ? AND row_id = ? AND seq = ?', [
          table.name,
          entry.row_id,
          entry.seq,
        ]);
      }
      pushed += rows.length;
    }
    return pushed;
  }

  /** Writes cloud rows that are newer than ours, without queueing them for upload again. */
  async function apply(table: SyncedTable, rows: RemoteRow[]): Promise<number> {
    let applied = 0;
    await db.transaction(async () => {
      // A subtask can arrive before its parent within the same page.
      await db.exec('PRAGMA defer_foreign_keys = ON');
      for (const row of rows) {
        const local = await db.get<{ updated_at: string }>(
          `SELECT updated_at FROM ${table.name} WHERE id = ?`,
          [row.id],
        );
        if (local && local.updated_at >= row.updated_at) continue;
        // Only columns the cloud sent: a column it does not have yet keeps the local value.
        const columns = table.columns.filter((c) => c in row);
        await db.run('INSERT OR IGNORE INTO sync_applying (row_id) VALUES (?)', [row.id]);
        await db.run(
          `INSERT INTO ${table.name} (${columns.join(', ')})
           VALUES (${columns.map(() => '?').join(', ')})
           ON CONFLICT(id) DO UPDATE SET ${columns
             .filter((c) => c !== 'id')
             .map((c) => `${c} = excluded.${c}`)
             .join(', ')}`,
          columns.map((c) => (row[c] ?? null) as SqlValue),
        );
        await db.run('DELETE FROM sync_applying WHERE row_id = ?', [row.id]);
        applied += 1;
      }
    });
    return applied;
  }

  async function pull(table: SyncedTable, touched: Set<DataTopic>): Promise<number> {
    let pulled = 0;
    const key = `cursor:${table.name}`;
    let cursor = withOverlap(await getState(key));
    for (;;) {
      const page = await remote.pull(table.name, cursor, PULL_PAGE);
      if (page.length === 0) break;
      const applied = await apply(table, page);
      if (applied > 0) touched.add(table.topic);
      pulled += applied;
      cursor = page[page.length - 1]!.server_updated_at;
      await setState(key, cursor);
      if (page.length < PULL_PAGE) break;
    }
    return pulled;
  }

  /**
   * Each table syncs on its own: one that fails (e.g. not yet created in the cloud) does not
   * hold back the others. Its changes stay queued and the error is reported at the end.
   */
  async function run(): Promise<SyncResult> {
    const errors: unknown[] = [];
    let pushed = 0;
    let pulled = 0;
    for (const table of tables) {
      try {
        pushed += await push(table);
      } catch (error) {
        errors.push(error);
      }
    }
    const touched = new Set<DataTopic>();
    for (const table of tables) {
      try {
        pulled += await pull(table, touched);
      } catch (error) {
        errors.push(error);
      }
    }
    touched.forEach((topic) => changes.notify(topic));
    if (errors.length > 0) throw errors[0];
    await setState('lastSyncedAt', now().toISOString());
    return { pushed, pulled };
  }

  let running: Promise<SyncResult> | null = null;

  return {
    /** Uploads, then downloads. Calls made while a sync runs share its result. */
    sync(): Promise<SyncResult> {
      running ??= (async () => {
        try {
          return await run();
        } finally {
          running = null;
        }
      })();
      return running;
    },
    async pendingCount(): Promise<number> {
      const row = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox');
      return row?.n ?? 0;
    },
    lastSyncedAt: () => getState('lastSyncedAt'),
  };
}

export type SyncEngine = ReturnType<typeof createSyncEngine>;

function withOverlap(cursor: string | null): string | null {
  if (!cursor) return null;
  const time = Date.parse(cursor);
  return Number.isNaN(time) ? cursor : new Date(time - PULL_OVERLAP_MS).toISOString();
}
