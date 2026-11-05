import { useLiveQuery } from '@/core/database/useLiveQuery';
import { toDateKey } from '@/core/dates';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';

import { useHabitsRepository } from './habitsContext';

/** Live reads: each re-runs when habits or check-ins change, here or from another device. */

export function useHabits(now: Date = new Date()) {
  const habits = useHabitsRepository();
  const { weekStart } = useCalendarPrefs();
  const todayKey = toDateKey(now);
  return {
    todayKey,
    ...useLiveQuery(`habits:${todayKey}:${weekStart}`, ['habits'], () =>
      habits.listHabits(todayKey, weekStart),
    ),
  };
}

export function useHabit(id: string, now: Date = new Date()) {
  const habits = useHabitsRepository();
  const { weekStart } = useCalendarPrefs();
  const todayKey = toDateKey(now);
  return {
    todayKey,
    ...useLiveQuery(`habit:${id}:${todayKey}:${weekStart}`, ['habits'], () =>
      habits.getHabit(id, todayKey, weekStart),
    ),
  };
}

/** Today's habits as numbers, for the day's tide on the Today screen. */
export function useTodayHabitProgress(): { completed: number; total: number } {
  const { data: habits = [] } = useHabits();
  const due = habits.filter((h) => h.scheduledToday || h.doneToday);
  return { completed: due.filter((h) => h.doneToday).length, total: due.length };
}
