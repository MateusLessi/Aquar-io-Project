import { useLiveQuery } from '@/core/database/useLiveQuery';
import { toDateKey } from '@/core/dates';
import { useHabitsRepository } from '@/features/habits/hooks/habitsContext';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { computeProgress } from './computeProgress';

/** Depth and today's points, live: refreshed whenever tasks or habits change. */
export function useProgress() {
  const todo = useTodo();
  const habits = useHabitsRepository();
  const todayKey = toDateKey(new Date());
  return useLiveQuery(`progress:${todayKey}`, ['tasks', 'habits'], async () =>
    computeProgress(
      await todo.progressFacts(todayKey),
      await habits.progressFacts(todayKey),
      todayKey,
    ),
  );
}
