import type { DataChanges } from '../database/changes';
import type { Database } from '../database/types';
import { isTimeOfDay } from '../dates';
import { idFrom } from '../ids';

/** What can be placed somewhere else ("Tudo conectado", docs/connections.md). */
export type LinkItemKind = 'list' | 'folder' | 'habit';
/** Where it can be placed. Lists and folders going into folders are a move, not a link. */
export type LinkTargetKind = 'habit' | 'routine';

export type Link = {
  id: string;
  itemKind: LinkItemKind;
  itemId: string;
  targetKind: LinkTargetKind;
  targetId: string;
  /** For a habit inside a routine: when, `HH:MM`, within the routine's time. */
  at: string | null;
  sortOrder: number;
  createdAt: string;
};

/** Which item kinds each target accepts. A habit cannot hold another habit. */
const ACCEPTS: Record<LinkTargetKind, readonly LinkItemKind[]> = {
  habit: ['list', 'folder'],
  routine: ['list', 'folder', 'habit'],
};

export function canLink(itemKind: LinkItemKind, targetKind: LinkTargetKind): boolean {
  return ACCEPTS[targetKind].includes(itemKind);
}

/** One row per pair, on every device. */
export const linkId = (
  itemKind: LinkItemKind,
  itemId: string,
  targetKind: LinkTargetKind,
  targetId: string,
) => idFrom(`link:${itemKind}:${itemId}->${targetKind}:${targetId}`);

export class LinkError extends Error {
  override name = 'LinkError';
}

type LinkRow = {
  id: string;
  item_kind: string;
  item_id: string;
  target_kind: string;
  target_id: string;
  at_time: string | null;
  sort_order: number;
  created_at: string;
};

function toLink(row: LinkRow): Link {
  return {
    id: row.id,
    itemKind: row.item_kind as LinkItemKind,
    itemId: row.item_id,
    targetKind: row.target_kind as LinkTargetKind,
    targetId: row.target_id,
    at: row.at_time,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

const COLUMNS = 'id, item_kind, item_id, target_kind, target_id, at_time, sort_order, created_at';

/**
 * Links between lists, folders, habits and routines. Linking never copies or moves the item:
 * the habit stays one habit, the list stays one list, wherever it shows up. Links to things
 * that no longer exist are left in place and simply not shown by the screens.
 */
export function createLinksRepository({
  db,
  changes,
  now,
}: {
  db: Database;
  changes: DataChanges;
  now: () => Date;
}) {
  const timestamp = () => now().toISOString();

  return {
    canLink,

    /** Links into a target (what a habit or routine holds), habits by time, then in order. */
    async linksTo(targetKind: LinkTargetKind, targetId: string): Promise<Link[]> {
      const rows = await db.all<LinkRow>(
        `SELECT ${COLUMNS} FROM links
         WHERE target_kind = ? AND target_id = ? AND deleted_at IS NULL
         ORDER BY at_time IS NULL, at_time, sort_order`,
        [targetKind, targetId],
      );
      return rows.map(toLink);
    },

    /** Where an item is linked ("Usada em…"). */
    async linksFrom(itemKind: LinkItemKind, itemId: string): Promise<Link[]> {
      const rows = await db.all<LinkRow>(
        `SELECT ${COLUMNS} FROM links
         WHERE item_kind = ? AND item_id = ? AND deleted_at IS NULL ORDER BY sort_order`,
        [itemKind, itemId],
      );
      return rows.map(toLink);
    },

    /** Every live link, for screens that show many targets at once. */
    async allLinks(): Promise<Link[]> {
      const rows = await db.all<LinkRow>(
        `SELECT ${COLUMNS} FROM links WHERE deleted_at IS NULL ORDER BY sort_order`,
      );
      return rows.map(toLink);
    },

    /**
     * Places an item in a target. Linking an existing pair again only updates its time.
     * Returns the link id (for "Desfazer").
     */
    async link(input: {
      itemKind: LinkItemKind;
      itemId: string;
      targetKind: LinkTargetKind;
      targetId: string;
      at?: string | null;
    }): Promise<string> {
      const { itemKind, itemId, targetKind, targetId } = input;
      if (!canLink(itemKind, targetKind)) {
        throw new LinkError(
          itemKind === 'habit' && targetKind === 'habit'
            ? 'Um hábito não pode ficar dentro de outro hábito.'
            : 'Isso não encaixa aqui.',
        );
      }
      const at = input.at ?? null;
      if (at !== null && (!isTimeOfDay(at) || itemKind !== 'habit')) {
        throw new LinkError('Horário inválido.');
      }
      const id = linkId(itemKind, itemId, targetKind, targetId);
      const stamp = timestamp();
      const max = await db.get<{ max: number | null }>(
        'SELECT MAX(sort_order) AS max FROM links WHERE target_kind = ? AND target_id = ?',
        [targetKind, targetId],
      );
      await db.run(
        `INSERT INTO links
           (id, item_kind, item_id, target_kind, target_id, at_time, sort_order,
            created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET at_time = excluded.at_time,
           updated_at = excluded.updated_at, deleted_at = NULL`,
        [id, itemKind, itemId, targetKind, targetId, at, (max?.max ?? 0) + 1, stamp, stamp],
      );
      changes.notify('links');
      return id;
    },

    async setTime(id: string, at: string | null): Promise<void> {
      if (at !== null && !isTimeOfDay(at)) throw new LinkError('Horário inválido.');
      await db.run(
        'UPDATE links SET at_time = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
        [at, timestamp(), id],
      );
      changes.notify('links');
    },

    /** Takes the item out of the target. Nothing else is deleted. */
    async unlink(id: string): Promise<void> {
      const stamp = timestamp();
      await db.run(
        'UPDATE links SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
        [stamp, stamp, id],
      );
      changes.notify('links');
    },
  };
}

export type LinksRepository = ReturnType<typeof createLinksRepository>;
