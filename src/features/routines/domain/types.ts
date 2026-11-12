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
  /** One-day changes, by date: skipped, or at another time that day only. */
  overrides?: Record<string, RoutineOverride>;
  /**
   * The agenda shows events and tasks with a date among routines, as entries of this same
   * shape: `source` tells them apart, `occurs` says on which days they happen.
   */
  source?: 'routine' | 'event' | 'task';
  /** The event's or task's own id (the entry's id is prefixed to stay unique). */
  refId?: string;
  /** No time: the whole day. */
  allDay?: boolean;
  occurs?: (dateKey: string) => boolean;
};

/** A routine changed for one day only. */
export type RoutineOverride = {
  routineId: string;
  date: string;
  skip: boolean;
  start: string | null;
  end: string | null;
};

/** How an event repeats. */
export type EventRepeat = 'none' | 'weekly' | 'monthly' | 'yearly';

/** Something with a date: an exam, an appointment, a birthday. */
export type AgendaEvent = {
  id: string;
  title: string;
  emoji: string | null;
  color: ListColorName;
  /** `YYYY-MM-DD`: the day, or the first one when it repeats. */
  date: string;
  /** `HH:MM`; both null for the whole day. */
  start: string | null;
  end: string | null;
  repeat: EventRepeat;
  /** Ring this many minutes before (0 = at the start, 1440 = the day before); null = no. */
  remindBefore: number | null;
  notes: string | null;
  /** A list it belongs to ("Prova" in Cálculo 3): it shows there and counts for its habits. */
  listId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewEvent = {
  title: string;
  emoji?: string | null;
  color?: ListColorName;
  date: string;
  start?: string | null;
  end?: string | null;
  repeat?: EventRepeat;
  remindBefore?: number | null;
  notes?: string | null;
  listId?: string | null;
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
