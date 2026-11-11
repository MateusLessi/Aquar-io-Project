import { useLiveQuery } from '@/core/database/useLiveQuery';
import { toDateKey } from '@/core/dates';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';

import { useMemo } from 'react';

import { useHabitSources, withConnectedDay } from './habitSources';
import { useHabitsRepository } from './habitsContext';

/** Live reads: each re-runs when habits or check-ins change, here or from another device. */

export function useHabits(now: Date = new Date()) {
  const habits = useHabitsRepository();
  const sources = useHabitSources();
  const { weekStart } = useCalendarPrefs();
  const todayKey = toDateKey(now);
  const query = useLiveQuery(`habits:${todayKey}:${weekStart}`, ['habits'], () =>
    habits.listHabits(todayKey, weekStart),
  );
  // Connected habits: today comes from their list, folder or routine.
  const data = useMemo(
    () =>
      sources && query.data
        ? query.data.map((h) => withConnectedDay(h, sources.dayOf(h.id)))
        : query.data,
    [query.data, sources],
  );
  return { todayKey, ...query, data };
}

export function useHabit(id: string, now: Date = new Date()) {
  const habits = useHabitsRepository();
  const { weekStart } = useCalendarPrefs();
  const sources = useHabitSources();
  const todayKey = toDateKey(now);
  const query = useLiveQuery(`habit:${id}:${todayKey}:${weekStart}`, ['habits'], () =>
    habits.getHabit(id, todayKey, weekStart),
  );
  const data = useMemo(
    () =>
      sources && query.data
        ? { ...query.data, habit: withConnectedDay(query.data.habit, sources.dayOf(id)) }
        : query.data,
    [query.data, sources, id],
  );
  return { todayKey, ...query, data };
}

/** Today's habits as numbers, for the day's tide on the Today screen. */
export function useTodayHabitProgress(): { completed: number; total: number } {
  const { data: habits = [] } = useHabits();
  const due = habits.filter((h) => h.scheduledToday || h.doneToday);
  return { completed: due.filter((h) => h.doneToday).length, total: due.length };
}
