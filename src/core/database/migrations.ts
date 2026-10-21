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
  {
    version: 2,
    name: 'sync outbox',
    // Triggers queue every local change for upload, so repositories stay unaware of sync.
    // Rows written by the sync engine itself are marked in sync_applying and not queued.
    sql: `
      CREATE TABLE sync_outbox (
        table_name  TEXT NOT NULL,
        row_id      TEXT NOT NULL,
        seq         INTEGER NOT NULL,
        PRIMARY KEY (table_name, row_id)
      );

      CREATE TABLE sync_applying (
        row_id  TEXT PRIMARY KEY NOT NULL
      );

      CREATE TABLE sync_state (
        key    TEXT PRIMARY KEY NOT NULL,
        value  TEXT NOT NULL
      );

      CREATE TRIGGER sync_task_lists_insert AFTER INSERT ON task_lists
      WHEN NOT EXISTS (SELECT 1 FROM sync_applying WHERE row_id = NEW.id)
      BEGIN
        INSERT INTO sync_outbox (table_name, row_id, seq)
        VALUES ('task_lists', NEW.id, (SELECT COALESCE(MAX(seq), 0) + 1 FROM sync_outbox))
        ON CONFLICT (table_name, row_id) DO UPDATE SET seq = excluded.seq;
      END;

      CREATE TRIGGER sync_task_lists_update AFTER UPDATE ON task_lists
      WHEN NOT EXISTS (SELECT 1 FROM sync_applying WHERE row_id = NEW.id)
      BEGIN
        INSERT INTO sync_outbox (table_name, row_id, seq)
        VALUES ('task_lists', NEW.id, (SELECT COALESCE(MAX(seq), 0) + 1 FROM sync_outbox))
        ON CONFLICT (table_name, row_id) DO UPDATE SET seq = excluded.seq;
      END;

      CREATE TRIGGER sync_tasks_insert AFTER INSERT ON tasks
      WHEN NOT EXISTS (SELECT 1 FROM sync_applying WHERE row_id = NEW.id)
      BEGIN
        INSERT INTO sync_outbox (table_name, row_id, seq)
        VALUES ('tasks', NEW.id, (SELECT COALESCE(MAX(seq), 0) + 1 FROM sync_outbox))
        ON CONFLICT (table_name, row_id) DO UPDATE SET seq = excluded.seq;
      END;

      CREATE TRIGGER sync_tasks_update AFTER UPDATE ON tasks
      WHEN NOT EXISTS (SELECT 1 FROM sync_applying WHERE row_id = NEW.id)
      BEGIN
        INSERT INTO sync_outbox (table_name, row_id, seq)
        VALUES ('tasks', NEW.id, (SELECT COALESCE(MAX(seq), 0) + 1 FROM sync_outbox))
        ON CONFLICT (table_name, row_id) DO UPDATE SET seq = excluded.seq;
      END;

      -- Everything created before sync existed goes up on the first sync.
      INSERT INTO sync_outbox (table_name, row_id, seq) SELECT 'task_lists', id, 0 FROM task_lists;
      INSERT INTO sync_outbox (table_name, row_id, seq) SELECT 'tasks', id, 0 FROM tasks;
    `,
  },
  {
    version: 3,
    name: 'habits',
    // A check-in's id is "<habit id>:<day>", so two devices checking the same day write
    // the same row instead of creating duplicates.
    sql: `
      CREATE TABLE habits (
        id          TEXT PRIMARY KEY NOT NULL,
        name        TEXT NOT NULL,
        creature    TEXT NOT NULL,
        days        INTEGER NOT NULL,
        sort_order  REAL NOT NULL,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL,
        deleted_at  TEXT
      );

      CREATE TABLE habit_checks (
        id          TEXT PRIMARY KEY NOT NULL,
        habit_id    TEXT NOT NULL REFERENCES habits(id),
        date        TEXT NOT NULL,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL,
        deleted_at  TEXT
      );

      CREATE INDEX idx_habit_checks_habit ON habit_checks(habit_id, date);
      ${outboxTriggers('habits')}
      ${outboxTriggers('habit_checks')}
    `,
  },
  {
    version: 4,
    name: 'reminders and repeating tasks',
    sql: `
      ALTER TABLE tasks ADD COLUMN repeat TEXT;
      ALTER TABLE tasks ADD COLUMN remind_at TEXT;
      ALTER TABLE habits ADD COLUMN reminder_times TEXT;
    `,
  },
];

/** Queues every insert and update of `table` for upload (see migration 2). */
function outboxTriggers(table: string): string {
  return ['INSERT', 'UPDATE']
    .map(
      (op) => `
      CREATE TRIGGER sync_${table}_${op.toLowerCase()} AFTER ${op} ON ${table}
      WHEN NOT EXISTS (SELECT 1 FROM sync_applying WHERE row_id = NEW.id)
      BEGIN
        INSERT INTO sync_outbox (table_name, row_id, seq)
        VALUES ('${table}', NEW.id, (SELECT COALESCE(MAX(seq), 0) + 1 FROM sync_outbox))
        ON CONFLICT (table_name, row_id) DO UPDATE SET seq = excluded.seq;
      END;`,
    )
    .join('\n');
}

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
