import type { DataChanges } from '../database/changes';
import type { Database } from '../database/types';

export type Profile = { name: string; creature: string | null };

const ID = 'me';

/** The person's name and avatar: one row, synced across their devices. */
export function createProfileRepository(db: Database, changes: DataChanges, now: () => Date) {
  return {
    async get(): Promise<Profile> {
      const row = await db.get<{ name: string | null; creature: string | null }>(
        'SELECT name, creature FROM profile WHERE id = ? AND deleted_at IS NULL',
        [ID],
      );
      return { name: row?.name ?? '', creature: row?.creature ?? null };
    },

    async set(profile: Profile): Promise<void> {
      const at = now().toISOString();
      await db.run(
        `INSERT INTO profile (id, name, creature, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, creature = excluded.creature,
           updated_at = excluded.updated_at`,
        [ID, profile.name.trim().slice(0, 40), profile.creature, at, at],
      );
      changes.notify('profile');
    },
  };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
