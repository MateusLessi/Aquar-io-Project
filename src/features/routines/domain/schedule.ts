import { addDays, startOfWeek, toDateKey, weekdayOf, type WeekStart } from '@/core/dates';

import type { Routine, RoutineOverride, RoutinePhase, WeekdayMask } from './types';

export const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number) as [number, number];
  return h * 60 + m;
};

export function isRoutineDay(days: WeekdayMask, dateKey: string): boolean {
  return (days & (1 << weekdayOf(dateKey))) !== 0;
}

/** Where a routine stands at `minutesNow` (minutes since local midnight) on a given day. */
export function routinePhase(
  routine: {
    start: string;
    end: string;
    days: WeekdayMask;
    overrides?: Record<string, RoutineOverride>;
  },
  dateKey: string,
  minutesNow: number,
): { phase: RoutinePhase; minutesLeft: number } {
  if (!isRoutineDay(routine.days, dateKey)) return { phase: 'rest', minutesLeft: 0 };
  const change = routine.overrides?.[dateKey];
  if (change?.skip) return { phase: 'rest', minutesLeft: 0 };
  const start = toMinutes(change?.start ?? routine.start);
  const end = toMinutes(change?.end ?? routine.end);
  if (minutesNow < start) return { phase: 'upcoming', minutesLeft: start - minutesNow };
  if (minutesNow < end) return { phase: 'now', minutesLeft: end - minutesNow };
  return { phase: 'past', minutesLeft: 0 };
}

/** "40 min", "1 h", "1 h 15". */
export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** The distinct labels in use, alphabetically: suggestions for the editor. */
export function tagsOf(routines: readonly { tag: string | null }[] | undefined): string[] {
  const tags = new Set<string>();
  for (const r of routines ?? []) if (r.tag) tags.add(r.tag);
  return [...tags].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** The first day (Sunday by default) of the week of `dateKey`. */
export function weekStartOf(dateKey: string, weekStart: WeekStart = 0): string {
  return startOfWeek(dateKey, weekStart);
}

/** The seven days of the week that starts on `start`. */
export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** What `routinesOn` reads: a routine, or an agenda entry of the same shape. */
type Scheduled = Pick<Routine, 'days' | 'start' | 'end' | 'createdAt'> & {
  overrides?: Record<string, RoutineOverride>;
  occurs?: (dateKey: string) => boolean;
  allDay?: boolean;
};

/** Whether a routine (or entry) happens on a day, taking its one-day changes into account. */
export function happensOn(entry: Scheduled, dateKey: string): boolean {
  if (entry.overrides?.[dateKey]?.skip) return false;
  if (entry.occurs) return entry.occurs(dateKey);
  return isRoutineDay(entry.days, dateKey) && toDateKey(new Date(entry.createdAt)) <= dateKey;
}

/** The entry as it is on a day: at another time when it was changed for that day only. */
export function onDay<T extends Scheduled>(entry: T, dateKey: string): T {
  const change = entry.overrides?.[dateKey];
  if (!change || change.skip || !change.start || !change.end) return entry;
  return { ...entry, start: change.start, end: change.end };
}

/**
 * The routines on a day, by start time (whole-day entries first), each at its time for that
 * day. A routine does not show on days before it was created: the past only shows what was
 * really planned. Days it was skipped on don't show it.
 */
export function routinesOn<T extends Scheduled>(routines: readonly T[], dateKey: string): T[] {
  return routines
    .filter((r) => happensOn(r, dateKey))
    .map((r) => onDay(r, dateKey))
    .sort((a, b) =>
      a.allDay !== b.allDay ? (a.allDay ? -1 : 1) : toMinutes(a.start) - toMinutes(b.start),
    );
}

/** Whole hours that fit every routine (06:00–22:00 at least), for the week grid. */
export function hourRange(
  routines: readonly (Pick<Routine, 'start' | 'end'> & { allDay?: boolean })[],
): {
  from: number;
  to: number;
} {
  let from = 6;
  let to = 22;
  for (const r of routines) {
    if (r.allDay) continue;
    from = Math.min(from, Math.floor(toMinutes(r.start) / 60));
    to = Math.max(to, Math.ceil(toMinutes(r.end) / 60));
  }
  return { from, to: Math.min(24, to) };
}
