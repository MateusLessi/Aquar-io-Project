import type { DataChanges, DataTopic } from '@/core/database/changes';
import type { Database } from '@/core/database/types';

/** Tables that hold what the person made (all have soft deletes, except the local timers). */
const CONTENT_TABLES = [
  'profile',
  'task_folders',
  'task_lists',
  'tasks',
  'habits',
  'habit_checks',
  'habit_progress',
  'routines',
  'routine_items',
  'routine_checks',
  'links',
] as const;

/** Local bookkeeping that goes with the content: event log, sync queue and cursors, timers. */
const BOOKKEEPING_TABLES = [
  'habit_timers',
  'domain_events',
  'sync_outbox',
  'sync_applying',
  'sync_state',
] as const;

const TOPICS: DataTopic[] = ['lists', 'tasks', 'habits', 'routines', 'links', 'profile'];

export type DataExport = {
  app: 'Aquar.io';
  format: 1;
  exportedAt: string;
  tables: Record<string, Record<string, unknown>[]>;
};

/** Everything the person made on this device, without what they deleted. */
export async function collectExport(db: Database, now = new Date()): Promise<DataExport> {
  const tables: DataExport['tables'] = {};
  for (const table of CONTENT_TABLES) {
    tables[table] = await db.all<Record<string, unknown>>(
      `SELECT * FROM ${table} WHERE deleted_at IS NULL`,
    );
  }
  return { app: 'Aquar.io', format: 1, exportedAt: now.toISOString(), tables };
}

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** The tasks as a spreadsheet: list, task, subtask of, due date, done at, created at. */
export async function tasksCsv(db: Database): Promise<string> {
  const rows = await db.all<{
    list: string;
    title: string;
    parent: string | null;
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
  }>(
    `SELECT l.name AS list, t.title, p.title AS parent, t.due_date, t.completed_at, t.created_at
     FROM tasks t
     JOIN task_lists l ON l.id = t.list_id
     LEFT JOIN tasks p ON p.id = t.parent_task_id
     WHERE t.deleted_at IS NULL AND l.deleted_at IS NULL
     ORDER BY l.name, t.created_at`,
  );
  const head = ['Lista', 'Tarefa', 'Subtarefa de', 'Prazo', 'Concluída em', 'Criada em'];
  return [
    head.join(','),
    ...rows.map((r) =>
      [r.list, r.title, r.parent, r.due_date, r.completed_at, r.created_at].map(csvCell).join(','),
    ),
  ].join('\n');
}

/**
 * Erases everything the person made on this device, with its sync bookkeeping. The device's
 * own choices (Ajustes) stay. Screens refresh right away.
 */
export async function wipeLocalData(db: Database, changes: DataChanges): Promise<void> {
  await db.transaction(async () => {
    // Children before parents (foreign keys): timers and checks before habits, tasks before lists.
    for (const table of [...BOOKKEEPING_TABLES, ...[...CONTENT_TABLES].reverse()]) {
      await db.run(`DELETE FROM ${table}`);
    }
  });
  for (const topic of TOPICS) changes.notify(topic);
}
