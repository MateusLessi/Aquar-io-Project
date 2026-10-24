import type { Link, LinkItemKind, LinkTargetKind } from '@/core/links/linksRepository';
import { useAllLinks } from '@/core/links/queries';
import type { HabitWithProgress } from '@/features/habits/domain/types';
import { useHabits } from '@/features/habits/hooks/queries';
import type { RoutineToday } from '@/features/routines/domain/types';
import { useRoutinesToday } from '@/features/routines/hooks/queries';
import type { FolderSummary, TaskList } from '@/features/todo/domain/types';
import { useFolders, useLists } from '@/features/todo/hooks/queries';

export type Connected =
  | { kind: 'habit'; link: Link; habit: HabitWithProgress }
  | { kind: 'list'; link: Link; list: TaskList }
  | { kind: 'folder'; link: Link; folder: FolderSummary };

export type ConnectedTarget =
  | { kind: 'habit'; link: Link; habit: HabitWithProgress }
  | { kind: 'routine'; link: Link; routine: RoutineToday };

/**
 * Everything the app knows, resolved for links: what is inside each target and where each item
 * is. Links to things that no longer exist (deleted, or not synced yet) are skipped.
 */
export function useConnections() {
  const { data: links = [] } = useAllLinks();
  const { data: habits = [], todayKey } = useHabits();
  const { data: lists = [] } = useLists();
  const { data: folders = [] } = useFolders();
  const { data: routines = [] } = useRoutinesToday();

  const habitById = new Map(habits.map((h) => [h.id, h]));
  const listById = new Map(lists.map((l) => [l.id, l]));
  const folderById = new Map(folders.map((f) => [f.id, f]));
  const routineById = new Map(routines.map((r) => [r.id, r]));

  const resolveItem = (link: Link): Connected | null => {
    const kind: LinkItemKind = link.itemKind;
    if (kind === 'habit') {
      const habit = habitById.get(link.itemId);
      return habit ? { kind, link, habit } : null;
    }
    if (kind === 'list') {
      const list = listById.get(link.itemId);
      return list ? { kind, link, list } : null;
    }
    const folder = folderById.get(link.itemId);
    return folder ? { kind: 'folder', link, folder } : null;
  };
  const resolveTarget = (link: Link): ConnectedTarget | null => {
    if (link.targetKind === 'habit') {
      const habit = habitById.get(link.targetId);
      return habit ? { kind: 'habit', link, habit } : null;
    }
    const routine = routineById.get(link.targetId);
    return routine ? { kind: 'routine', link, routine } : null;
  };

  return {
    todayKey,
    habits,
    lists,
    folders,
    routines,
    /** What a habit or routine holds: habits by time, then lists and folders. */
    inside(targetKind: LinkTargetKind, targetId: string): Connected[] {
      return links
        .filter((l) => l.targetKind === targetKind && l.targetId === targetId)
        .sort((a, b) => {
          if (a.at !== b.at)
            return a.at === null ? 1 : b.at === null ? -1 : a.at.localeCompare(b.at);
          return a.sortOrder - b.sortOrder;
        })
        .map(resolveItem)
        .filter((c): c is Connected => c !== null);
    },
    /** Where an item is linked ("Usada em…"). */
    placesOf(itemKind: LinkItemKind, itemId: string): ConnectedTarget[] {
      return links
        .filter((l) => l.itemKind === itemKind && l.itemId === itemId)
        .map(resolveTarget)
        .filter((c): c is ConnectedTarget => c !== null);
    },
  };
}
