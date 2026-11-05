import type { DataChanges } from '../database/changes';
import type { Database } from '../database/types';

/** Who may see a piece of the profile once profiles are visible to others. */
export type Visibility = 'me' | 'friends' | 'public';
export const PRIVACY_FIELDS = ['name', 'bio', 'depth', 'showcase', 'stats'] as const;
export type PrivacyField = (typeof PRIVACY_FIELDS)[number];
export type Privacy = Record<PrivacyField, Visibility>;

export const PROFILE_LIMITS = { name: 40, bio: 80, showcase: 3 } as const;

export type Profile = {
  name: string;
  creature: string | null;
  bio: string;
  /** A list color name; null = the creature's own color. */
  color: string | null;
  /** Up to three picks, in order: "streak", "tides", "tasks", "days", "favorite:<habit>", "badge:<id>". */
  showcase: string[];
  privacy: Privacy;
};

export const defaultPrivacy: Privacy = {
  name: 'me',
  bio: 'me',
  depth: 'me',
  showcase: 'me',
  stats: 'me',
};

const ID = 'me';
const VISIBILITIES: Visibility[] = ['me', 'friends', 'public'];

function parseJson(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Unknown or broken values fall back to "only me": privacy never opens up by accident. */
export function parsePrivacy(text: string | null): Privacy {
  const raw = parseJson(text);
  const out = { ...defaultPrivacy };
  if (raw && typeof raw === 'object') {
    for (const field of PRIVACY_FIELDS) {
      const value = (raw as Record<string, unknown>)[field];
      if (VISIBILITIES.includes(value as Visibility)) out[field] = value as Visibility;
    }
  }
  return out;
}

export function parseShowcase(text: string | null): string[] {
  const raw = parseJson(text);
  return Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === 'string').slice(0, PROFILE_LIMITS.showcase)
    : [];
}

const clean = (text: string, max: number) => text.trim().replace(/\s+/g, ' ').slice(0, max);

type Row = {
  name: string | null;
  creature: string | null;
  bio: string | null;
  color: string | null;
  showcase: string | null;
  privacy: string | null;
};

/** The person's profile card: one row, synced across their devices. */
export function createProfileRepository(db: Database, changes: DataChanges, now: () => Date) {
  async function get(): Promise<Profile> {
    const row = await db.get<Row>(
      `SELECT name, creature, bio, color, showcase, privacy FROM profile
       WHERE id = ? AND deleted_at IS NULL`,
      [ID],
    );
    return {
      name: row?.name ?? '',
      creature: row?.creature ?? null,
      bio: row?.bio ?? '',
      color: row?.color ?? null,
      showcase: parseShowcase(row?.showcase ?? null),
      privacy: parsePrivacy(row?.privacy ?? null),
    };
  }

  return {
    get,

    /** Changes some fields, keeping the others. */
    async set(patch: Partial<Profile>): Promise<void> {
      const next = { ...(await get()), ...patch };
      const at = now().toISOString();
      await db.run(
        `INSERT INTO profile (id, name, creature, bio, color, showcase, privacy, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, creature = excluded.creature,
           bio = excluded.bio, color = excluded.color, showcase = excluded.showcase,
           privacy = excluded.privacy, updated_at = excluded.updated_at`,
        [
          ID,
          clean(next.name, PROFILE_LIMITS.name),
          next.creature,
          clean(next.bio, PROFILE_LIMITS.bio) || null,
          next.color,
          JSON.stringify([...new Set(next.showcase)].slice(0, PROFILE_LIMITS.showcase)),
          JSON.stringify(parsePrivacy(JSON.stringify(next.privacy))),
          at,
          at,
        ],
      );
      changes.notify('profile');
    },
  };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
