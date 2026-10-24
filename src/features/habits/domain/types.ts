import type { CreatureId } from './creatures';
import type { Stage } from './stages';

/** Days of the week as a bitmask: bit 0 = Sunday … bit 6 = Saturday. */
export type WeekdayMask = number;
export const EVERY_DAY: WeekdayMask = 0b1111111;

/**
 * How a habit is done (docs/habits.md). `check` is one tap; the others fill up during the day:
 * `count` toward a number ("8 copos"), `time` toward minutes, `checklist` step by step.
 */
export type HabitKind = 'check' | 'count' | 'time' | 'checklist';
export const habitKinds: readonly HabitKind[] = ['check', 'count', 'time', 'checklist'];

export type HabitStep = { id: string; title: string };

export type Habit = {
  id: string;
  name: string;
  creature: CreatureId;
  days: WeekdayMask;
  kind: HabitKind;
  /** The day's goal: units for `count`, minutes for `time`, 1 for `check`, steps for `checklist`. */
  target: number;
  /** What a `count` habit counts ("copos", "páginas"); null otherwise. */
  unit: string | null;
  /** A `checklist` habit's steps, in order. Empty for the other kinds. */
  steps: HabitStep[];
  /** Reminder times on scheduled days, `HH:MM`, sorted. */
  reminderTimes: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** How a habit is going, computed from its check-ins. */
export type HabitProgress = {
  scheduledToday: boolean;
  doneToday: boolean;
  /** Scheduled days in a row that were done. Today only counts once it is done. */
  streak: number;
  bestStreak: number;
  /** Share of scheduled days done in the last 30 days, 0–1. Null before any scheduled day. */
  consistency: number | null;
  /** This week, Sunday first. */
  week: DayState[];
  /** Every day done, ever: what makes the creature grow. */
  daysDone: number;
};

/** Today's partial progress. */
export type HabitToday = {
  /** Units, seconds (`time`) or steps done today. Can pass the goal: extra time still counts. */
  amount: number;
  /** Ids of the checklist steps done today. */
  stepsDone: string[];
  /** 0–1: how full the capsule is. 1 when the day is done. */
  ratio: number;
  /** When the running timer started (ISO), or null. */
  timerStartedAt: string | null;
};

export type DayState = 'done' | 'missed' | 'pending' | 'rest' | 'future';

export type HabitWithProgress = Habit &
  HabitProgress & {
    stage: Stage;
    today: HabitToday;
    /** How full each day of this week was, Sunday first, 0–1. */
    weekRatios: number[];
  };

export type NewHabit = {
  name: string;
  creature: CreatureId;
  days?: WeekdayMask;
  reminderTimes?: string[];
  kind?: HabitKind;
  target?: number;
  unit?: string | null;
  /** Steps keep their id when edited, so today's checked steps stay checked. */
  steps?: { id?: string; title: string }[];
};
export type HabitPatch = Partial<NewHabit>;
