import { addDays, weekdayOf } from '@/core/dates';

import type { DayState, HabitProgress, WeekdayMask } from './types';

export function isScheduled(days: WeekdayMask, dateKey: string): boolean {
  return (days & (1 << weekdayOf(dateKey))) !== 0;
}

/** How far back a streak is counted. Long enough for any realistic streak in V1. */
const MAX_LOOKBACK_DAYS = 3660;

/**
 * Non-punitive progress (docs/gamification.md): a missed day ends the current streak, but the
 * best streak and the 30-day consistency keep the history. Today is never a miss: until
 * midnight there is still time.
 */
export function habitProgress(input: {
  days: WeekdayMask;
  /** Day keys with a check-in. */
  done: ReadonlySet<string>;
  /** First day that counts: the day the habit was created. */
  startKey: string;
  todayKey: string;
}): HabitProgress {
  const { days, done, startKey, todayKey } = input;
  const scheduled = (key: string) => isScheduled(days, key);

  // Current streak: walk back from today.
  let streak = 0;
  for (let i = 0, key = todayKey; i < MAX_LOOKBACK_DAYS && key >= startKey; i++) {
    if (scheduled(key) || done.has(key)) {
      if (done.has(key)) streak += 1;
      else if (key !== todayKey) break;
    }
    key = addDays(key, -1);
  }

  // Best streak: walk forward from the start.
  let best = 0;
  let run = 0;
  for (let key = startKey; key <= todayKey; key = addDays(key, 1)) {
    if (done.has(key)) best = Math.max(best, ++run);
    else if (scheduled(key) && key !== todayKey) run = 0;
  }

  // Consistency over the last 30 days (today counts only once done).
  let due = 0;
  let kept = 0;
  for (let i = 0; i < 30; i++) {
    const key = addDays(todayKey, -i);
    if (key < startKey) break;
    if (!scheduled(key) || (key === todayKey && !done.has(key))) continue;
    due += 1;
    if (done.has(key)) kept += 1;
  }

  const sunday = addDays(todayKey, -weekdayOf(todayKey));
  const week = Array.from({ length: 7 }, (_, i): DayState => {
    const key = addDays(sunday, i);
    if (done.has(key)) return 'done';
    if (key > todayKey) return 'future';
    if (!scheduled(key) || key < startKey) return 'rest';
    return key === todayKey ? 'pending' : 'missed';
  });

  return {
    scheduledToday: scheduled(todayKey),
    doneToday: done.has(todayKey),
    streak,
    bestStreak: best,
    consistency: due === 0 ? null : kept / due,
    week,
  };
}

/** "Todo dia", "Dias úteis", "Fim de semana" or e.g. "Seg, Qua, Sex". */
export function daysLabel(days: WeekdayMask): string {
  if (days === 0b1111111) return 'Todo dia';
  if (days === 0b0111110) return 'Dias úteis';
  if (days === 0b1000001) return 'Fim de semana';
  return weekdayShort.filter((_, i) => days & (1 << i)).join(', ');
}

export const weekdayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const weekdayInitial = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
