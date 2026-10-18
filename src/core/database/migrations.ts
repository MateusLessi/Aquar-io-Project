import type { Database } from './types';

export type Migration = { version: number; name: string; sql: string };

/**
 * Schema history. Each migration runs once per device, in order.
 * Never edit a migration that has shipped: add a new one instead.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: 'todo foundation',
    sql: `
      CREATE TABLE task_lists (
        id          TEXT PRIMARY KEY NOT NULL,
        name        TEXT NOT NULL,
        emoji       TEXT,
        color       TEXT,
        sort_order  REAL NOT NULL,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL,
        deleted_at  TEXT
      );

      CREATE TABLE tasks (
        id              TEXT PRIMARY KEY NOT NULL,
        list_id         TEXT NOT NULL REFERENCES task_lists(id),
        parent_task_id  TEXT REFERENCES tasks(id),
        title           TEXT NOT NULL,
        notes           TEXT,
        priority        INTEGER NOT NULL DEFAULT 0,
        due_date        TEXT,
        completed_at    TEXT,
        sort_order      REAL NOT NULL,
        source_type     TEXT,
        source_id       TEXT,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL,
        deleted_at      TEXT
      );

      CREATE INDEX idx_tasks_list ON tasks(list_id, deleted_at);
      CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
      CREATE INDEX idx_tasks_due ON tasks(due_date);

      CREATE TABLE domain_events (
        id           TEXT PRIMARY KEY NOT NULL,
        type         TEXT NOT NULL,
        entity_type  TEXT NOT NULL,
        entity_id    TEXT NOT NULL,
        payload      TEXT NOT NULL,
        occurred_at  TEXT NOT NULL
      );

      CREATE INDEX idx_events_type ON domain_events(type, occurred_at);

      CREATE TABLE app_settings (
        key    TEXT PRIMARY KEY NOT NULL,
        value  TEXT NOT NULL
      );
    `,
  },
];

/**
 * Brings the database up to the latest schema. The current version is stored in
 * SQLite's built-in `user_version`, so each migration runs exactly once.
 */
export async function migrate(db: Database, list: Migration[] = migrations): Promise<number> {
  const row = await db.get<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  for (const migration of list) {
    if (migration.version <= current) continue;
    await db.transaction(async () => {
      await db.exec(migration.sql);
      await db.exec(`PRAGMA user_version = ${migration.version}`);
    });
    current = migration.version;
  }

  return current;
}
