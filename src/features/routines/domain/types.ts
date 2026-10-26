import type { ListColorName } from '@/design-system';

/** Days of the week as a bitmask: bit 0 = Sunday … bit 6 = Saturday. */
export type WeekdayMask = number;

/** A block of time in the day, with a short checklist that starts fresh every day. */
export type Routine = {
  id: string;
  name: string;
  emoji: string | null;
  color: ListColorName;
  /** `HH:MM`, local time; `end` is after `start` (no blocks across midnight in V1). */
  start: string;
  end: string;
  days: WeekdayMask;
  /** Ring a reminder when the routine starts. */
  remind: boolean;
  /** A short label shown on the routine's block ("Faculdade", "Saúde"). */
  tag: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RoutineItem = { id: string; routineId: string; title: string; sortOrder: number };

/** Where a routine is relative to now. */
export type RoutinePhase = 'upcoming' | 'now' | 'past' | 'rest';

export type RoutineToday = Routine & {
  items: (RoutineItem & { done: boolean })[];
  phase: RoutinePhase;
  /** Minutes to the start (upcoming) or to the end (now). */
  minutesLeft: number;
};

export type NewRoutine = {
  name: string;
  emoji?: string | null;
  color?: ListColorName;
  start: string;
  end: string;
  days?: WeekdayMask;
  remind?: boolean;
  tag?: string | null;
  items?: string[];
};
