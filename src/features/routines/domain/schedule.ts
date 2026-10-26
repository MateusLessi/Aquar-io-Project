import { weekdayOf } from '@/core/dates';

import type { RoutinePhase, WeekdayMask } from './types';

export const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number) as [number, number];
  return h * 60 + m;
};

export function isRoutineDay(days: WeekdayMask, dateKey: string): boolean {
  return (days & (1 << weekdayOf(dateKey))) !== 0;
}

/** Where a routine stands at `minutesNow` (minutes since local midnight) on a given day. */
export function routinePhase(
  routine: { start: string; end: string; days: WeekdayMask },
  dateKey: string,
  minutesNow: number,
): { phase: RoutinePhase; minutesLeft: number } {
  if (!isRoutineDay(routine.days, dateKey)) return { phase: 'rest', minutesLeft: 0 };
  const start = toMinutes(routine.start);
  const end = toMinutes(routine.end);
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
