import { isScheduled } from '@/features/habits/domain/progress';
import type { HabitWithProgress } from '@/features/habits/domain/types';
import { toMinutes } from '@/features/routines/domain/schedule';
import type { RoutineToday } from '@/features/routines/domain/types';

/**
 * What is happening on the agenda, or comes next today: one that is on now first (the one
 * that ends soonest), else the next to start. Whole-day things are left out.
 */
export function nextOnAgenda(entries: readonly RoutineToday[]): RoutineToday | null {
  const timed = entries.filter((e) => !e.allDay);
  const now = timed.filter((e) => e.phase === 'now').sort((a, b) => a.minutesLeft - b.minutesLeft);
  if (now[0]) return now[0];
  const next = timed
    .filter((e) => e.phase === 'upcoming')
    .sort((a, b) => a.minutesLeft - b.minutesLeft);
  return next[0] ?? null;
}

/**
 * The habit of the moment: due today and not done yet. One with a reminder near now (from half
 * an hour ago on) comes first, by its time; then the rest in their order.
 */
export function habitOfTheMoment(
  habits: readonly HabitWithProgress[],
  todayKey: string,
  nowMinutes: number,
): HabitWithProgress | null {
  const due = habits.filter((h) => isScheduled(h.days, todayKey) && !h.doneToday);
  const soon = (h: HabitWithProgress) => {
    const times = h.reminderTimes.map(toMinutes).filter((m) => m >= nowMinutes - 30);
    return times.length > 0 ? Math.min(...times) : Infinity;
  };
  return [...due].sort((a, b) => soon(a) - soon(b))[0] ?? null;
}
