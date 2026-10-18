import type { DataChanges } from '../database/changes';
import type { Database } from '../database/types';

/** Small key/value store for app preferences (e.g. the theme). */
export function createSettingsRepository(db: Database, changes: DataChanges) {
  return {
    async get(key: string): Promise<string | null> {
      const row = await db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [
        key,
      ]);
      return row?.value ?? null;
    },
    async set(key: string, value: string): Promise<void> {
      await db.run(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value],
      );
      changes.notify('settings');
    },
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
