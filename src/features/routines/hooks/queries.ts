import { useEffect, useState } from 'react';

import { useLiveQuery } from '@/core/database/useLiveQuery';
import { toDateKey } from '@/core/dates';

import { useRoutinesRepository } from './routinesContext';

/** The current minute, ticking: routine phases and "time left" change as the clock moves. */
function useMinute(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Every routine with today's checklist and where it stands right now. Live. */
export function useRoutinesToday() {
  const routines = useRoutinesRepository();
  const now = useMinute();
  const minuteKey = `${toDateKey(now)}T${now.getHours()}:${now.getMinutes()}`;
  return {
    todayKey: toDateKey(now),
    ...useLiveQuery(`routines:${minuteKey}`, ['routines'], () => routines.listToday(now)),
  };
}

export function useRoutine(id: string | null) {
  const routines = useRoutinesRepository();
  return useLiveQuery(`routine:${id}`, ['routines'], () =>
    id ? routines.getRoutine(id) : Promise.resolve(null),
  );
}

/** Today's routine items as numbers, for the day's tide. */
export function useTodayRoutineProgress(): { completed: number; total: number } {
  const { data: routines = [] } = useRoutinesToday();
  const today = routines.filter((r) => r.phase !== 'rest');
  return {
    completed: today.reduce((n, r) => n + r.items.filter((i) => i.done).length, 0),
    total: today.reduce((n, r) => n + r.items.length, 0),
  };
}

/** Items checked per routine and day between two days, keyed `<routine id>:<day>`. Live. */
export function useRoutineDone(from: string, to: string) {
  const routines = useRoutinesRepository();
  return useLiveQuery(`routine-done:${from}:${to}`, ['routines'], () =>
    routines.doneBetween(from, to),
  );
}
