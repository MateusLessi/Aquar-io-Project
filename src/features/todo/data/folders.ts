import type { ListColorName } from '@/design-system';

import type { Folder, FolderCrumb, FolderPatch, FolderSummary, NewFolder } from '../domain/types';
import {
  MAX_FOLDER_DEPTH,
  ValidationError,
  validateFolderName,
  validateListColor,
} from '../domain/validation';
import type { TodoDeps } from './todoRepository';

type FolderRow = {
  id: string;
  parent_id: string | null;
  name: string;
  emoji: string | null;
  color: string | null;
  pinned: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const FOLDER_COLUMNS =
  'id, parent_id, name, emoji, color, pinned, sort_order, created_at, updated_at';

function toFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    emoji: row.emoji,
    color: row.color as ListColorName | null,
    pinned: row.pinned === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Every folder at once, as a tree. A parent that is missing (deleted, or not synced yet), or
 * a loop left by two devices moving folders at the same time, puts a folder at the top level,
 * so nothing ever disappears.
 */
export type FolderTree = {
  folders: Map<string, FolderSummary>;
  /** The folder a list or folder effectively lives in (null at the top level). */
  parentOf: (folderId: string) => string | null;
  folderOfList: (listFolderId: string | null) => string | null;
  /** From the top level down to the folder itself. */
  path: (folderId: string | null) => FolderCrumb[];
  /** The folder and every folder inside it. */
  subtree: (folderId: string) => string[];
  /** How many levels the subtree spans, counting the folder itself. */
  height: (folderId: string) => number;
};

export function createFolderMethods({ db, changes, newId, now }: TodoDeps) {
  const timestamp = () => now().toISOString();

  async function loadTree(): Promise<FolderTree> {
    const rows = await db.all<FolderRow>(
      `SELECT ${FOLDER_COLUMNS} FROM task_folders WHERE deleted_at IS NULL ORDER BY sort_order`,
    );
    const raw = new Map(rows.map((r) => [r.id, toFolder(r)]));

    const parentOf = (id: string): string | null => {
      // Walk up: a missing parent or a loop ends at the top level.
      const parent = raw.get(id)?.parentId ?? null;
      if (!parent || !raw.has(parent)) return null;
      const seen = new Set([id]);
      for (let at: string | null = parent; at; at = raw.get(at)?.parentId ?? null) {
        if (seen.has(at)) return null;
        seen.add(at);
        if (!raw.has(at)) break;
      }
      return parent;
    };
    const children = new Map<string | null, string[]>();
    for (const id of raw.keys()) {
      const parent = parentOf(id);
      children.set(parent, [...(children.get(parent) ?? []), id]);
    }
    const subtree = (id: string): string[] => [
      id,
      ...(children.get(id) ?? []).flatMap((child) => subtree(child)),
    ];
    const height = (id: string): number =>
      1 + Math.max(0, ...(children.get(id) ?? []).map((child) => height(child)));
    const depthOf = (id: string): number => {
      let depth = 1;
      for (let at = parentOf(id); at; at = parentOf(at)) depth += 1;
      return depth;
    };
    const path = (id: string | null): FolderCrumb[] => {
      const crumbs: FolderCrumb[] = [];
      for (let at = id && raw.has(id) ? id : null; at; at = parentOf(at)) {
        const folder = raw.get(at)!;
        crumbs.unshift({ id: folder.id, name: folder.name, emoji: folder.emoji });
      }
      return crumbs;
    };

    // Lists and their task counts, to sum per folder.
    const lists = await db.all<{ folder_id: string | null; open: number; done: number }>(
      `SELECT l.folder_id,
         (SELECT COUNT(*) FROM tasks t WHERE t.list_id = l.id AND t.parent_task_id IS NULL
            AND t.deleted_at IS NULL AND t.completed_at IS NULL) AS open,
         (SELECT COUNT(*) FROM tasks t WHERE t.list_id = l.id AND t.parent_task_id IS NULL
            AND t.deleted_at IS NULL AND t.completed_at IS NOT NULL) AS done
       FROM task_lists l WHERE l.deleted_at IS NULL`,
    );
    const folderOfList = (folderId: string | null) =>
      folderId && raw.has(folderId) ? folderId : null;

    const folders = new Map<string, FolderSummary>();
    for (const [id, folder] of raw) {
      const inside = new Set(subtree(id));
      const mine = lists.filter((l) => {
        const at = folderOfList(l.folder_id);
        return at !== null && inside.has(at);
      });
      folders.set(id, {
        ...folder,
        parentId: parentOf(id),
        depth: depthOf(id),
        folderCount: inside.size - 1,
        listCount: mine.length,
        openCount: mine.reduce((sum, l) => sum + l.open, 0),
        doneCount: mine.reduce((sum, l) => sum + l.done, 0),
      });
    }
    return { folders, parentOf, folderOfList, path, subtree, height };
  }

  async function requireFolder(tree: FolderTree, id: string): Promise<FolderSummary> {
    const folder = tree.folders.get(id);
    if (!folder) throw new ValidationError('Esta pasta não existe mais.');
    return folder;
  }

  return {
    loadTree,

    /** Every folder, with its depth and counts. */
    async listFolders(): Promise<FolderSummary[]> {
      return [...(await loadTree()).folders.values()];
    },

    async createFolder(input: NewFolder): Promise<string> {
      const name = validateFolderName(input.name);
      const color = validateListColor(input.color);
      const parentId = input.parentId ?? null;
      if (parentId) {
        const parent = await requireFolder(await loadTree(), parentId);
        if (parent.depth >= MAX_FOLDER_DEPTH) {
          throw new ValidationError(`Pastas vão até ${MAX_FOLDER_DEPTH} níveis.`);
        }
      }
      const id = newId();
      const at = timestamp();
      const max = await db.get<{ max: number | null }>(
        'SELECT MAX(sort_order) AS max FROM task_folders WHERE deleted_at IS NULL',
      );
      await db.run(
        `INSERT INTO task_folders
           (id, parent_id, name, emoji, color, pinned, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [id, parentId, name, input.emoji?.trim() || null, color, (max?.max ?? 0) + 1, at, at],
      );
      changes.notify('lists');
      return id;
    },

    async updateFolder(id: string, patch: FolderPatch): Promise<void> {
      const sets: string[] = [];
      const params: (string | number | null)[] = [];
      if (patch.name !== undefined) {
        sets.push('name = ?');
        params.push(validateFolderName(patch.name));
      }
      if (patch.emoji !== undefined) {
        sets.push('emoji = ?');
        params.push(patch.emoji?.trim() || null);
      }
      if (patch.color !== undefined) {
        sets.push('color = ?');
        params.push(validateListColor(patch.color));
      }
      if (patch.pinned !== undefined) {
        sets.push('pinned = ?');
        params.push(patch.pinned ? 1 : 0);
      }
      if (sets.length === 0) return;
      const { changes: updated } = await db.run(
        `UPDATE task_folders SET ${sets.join(', ')}, updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`,
        [...params, timestamp(), id],
      );
      if (updated === 0) throw new ValidationError('Esta pasta não existe mais.');
      changes.notify('lists');
    },

    /** Moves a folder (and everything in it) into another folder, or to the top level. */
    async moveFolder(id: string, parentId: string | null): Promise<void> {
      const tree = await loadTree();
      await requireFolder(tree, id);
      if (parentId) {
        const parent = await requireFolder(tree, parentId);
        if (tree.subtree(id).includes(parentId)) {
          throw new ValidationError('Uma pasta não pode ir para dentro dela mesma.');
        }
        if (parent.depth + tree.height(id) > MAX_FOLDER_DEPTH) {
          throw new ValidationError(`Pastas vão até ${MAX_FOLDER_DEPTH} níveis.`);
        }
      }
      await db.run('UPDATE task_folders SET parent_id = ?, updated_at = ? WHERE id = ?', [
        parentId,
        timestamp(),
        id,
      ]);
      changes.notify('lists');
    },

    async moveList(listId: string, folderId: string | null): Promise<void> {
      if (folderId) await requireFolder(await loadTree(), folderId);
      const { changes: updated } = await db.run(
        'UPDATE task_lists SET folder_id = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
        [folderId, timestamp(), listId],
      );
      if (updated === 0) throw new ValidationError('Esta lista não existe mais.');
      changes.notify('lists');
    },

    /**
     * Deletes a folder. `keep` moves what is inside up to the folder's parent; `all` deletes
     * every folder, list and task inside too (soft deletes, like everything else).
     */
    async deleteFolder(id: string, mode: 'keep' | 'all'): Promise<void> {
      const tree = await loadTree();
      await requireFolder(tree, id);
      const parentId = tree.parentOf(id);
      const at = timestamp();
      await db.transaction(async () => {
        if (mode === 'keep') {
          await db.run(
            `UPDATE task_folders SET parent_id = ?, updated_at = ?
             WHERE parent_id = ? AND deleted_at IS NULL`,
            [parentId, at, id],
          );
          await db.run(
            `UPDATE task_lists SET folder_id = ?, updated_at = ?
             WHERE folder_id = ? AND deleted_at IS NULL`,
            [parentId, at, id],
          );
          await db.run('UPDATE task_folders SET deleted_at = ?, updated_at = ? WHERE id = ?', [
            at,
            at,
            id,
          ]);
          return;
        }
        const ids = tree.subtree(id);
        const marks = ids.map(() => '?').join(', ');
        await db.run(
          `UPDATE tasks SET deleted_at = ?, updated_at = ?
           WHERE deleted_at IS NULL AND list_id IN (
             SELECT id FROM task_lists WHERE deleted_at IS NULL AND folder_id IN (${marks}))`,
          [at, at, ...ids],
        );
        await db.run(
          `UPDATE task_lists SET deleted_at = ?, updated_at = ?
           WHERE deleted_at IS NULL AND folder_id IN (${marks})`,
          [at, at, ...ids],
        );
        await db.run(
          `UPDATE task_folders SET deleted_at = ?, updated_at = ?
           WHERE deleted_at IS NULL AND id IN (${marks})`,
          [at, at, ...ids],
        );
      });
      changes.notify('lists');
      changes.notify('tasks');
    },
  };
}
