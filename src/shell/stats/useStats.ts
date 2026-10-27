import { useLiveQuery } from '@/core/database/useLiveQuery';
import { toDateKey } from '@/core/dates';
import { useHabitsRepository } from '@/features/habits/hooks/habitsContext';
import { useRoutinesRepository } from '@/features/routines/hooks/routinesContext';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { computeProgress } from '../progress/computeProgress';
import { computeStats, shiftPeriod, type Period, type Stats } from './computeStats';

/**
 * Statistics for a period and the one before it (for "▲ 12 vs. semana passada"). Live:
 * recomputed whenever tasks, habits or routines change.
 */
export function useStats(period: Period) {
  const todo = useTodo();
  const habits = useHabitsRepository();
  const routines = useRoutinesRepository();
  const todayKey = toDateKey(new Date());
  const previous = shiftPeriod(period, -1);
  return useLiveQuery<{ current: Stats; previous: Stats; todayKey: string }>(
    `stats:${period.mode}:${period.from}:${todayKey}`,
    ['tasks', 'habits', 'routines'],
    async () => {
      const [taskTimes, habitFacts, routineFacts, progress] = await Promise.all([
        todo.completionTimes(previous.from, period.to),
        habits.statsFacts(previous.from, period.to),
        routines.statsFacts(previous.from, period.to),
        Promise.all([
          todo.progressFacts(todayKey),
          habits.progressFacts(todayKey),
          routines.progressFacts(todayKey),
        ]).then(([t, h, r]) => computeProgress(t, h, r, todayKey)),
      ]);
      const facts = {
        taskTimes,
        habits: habitFacts.habits,
        habitDone: habitFacts.done,
        routines: routineFacts.routines,
        routineChecks: routineFacts.checks,
        points: progress.byDay,
      };
      return {
        current: computeStats(period, facts, todayKey),
        previous: computeStats(previous, facts, todayKey),
        todayKey,
      };
    },
  );
}
