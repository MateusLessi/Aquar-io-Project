import { useLiveQuery } from '@/core/database/useLiveQuery';
import { toDateKey } from '@/core/dates';
import { useLinks } from '@/core/links/linksContext';
import { useHabitsRepository } from '@/features/habits/hooks/habitsContext';
import { useRoutinesRepository } from '@/features/routines/hooks/routinesContext';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { habitSourceLists } from '../connections/habitDay';
import { computeProgress } from './computeProgress';

/** Depth and today's points, live: refreshed whenever tasks, habits or routines change. */
export function useProgress() {
  const todo = useTodo();
  const habits = useHabitsRepository();
  const routines = useRoutinesRepository();
  const links = useLinks();
  const todayKey = toDateKey(new Date());
  return useLiveQuery(
    `progress:${todayKey}`,
    ['tasks', 'habits', 'routines', 'links', 'lists'],
    async () => {
      const tasks = await todo.progressFacts(todayKey);
      // Items that feed a habit count once, as the habit's steps: not again as tasks.
      const sources = habitSourceLists(await links.allLinks(), {
        lists: (await todo.listLists()).map((l) => ({
          id: l.id,
          name: l.name,
          folderId: l.folderId,
          resets: l.resets,
        })),
        folders: (await todo.listFolders()).map((f) => ({
          id: f.id,
          name: f.name,
          parentId: f.parentId,
        })),
      });
      return computeProgress(
        { ...tasks, completions: tasks.completions.filter((c) => !sources.has(c.listId)) },
        await habits.progressFacts(todayKey),
        await routines.progressFacts(todayKey),
        todayKey,
      );
    },
  );
}
