import type { CreatureId } from './creatures';

/** Days of the week as a bitmask: bit 0 = Sunday … bit 6 = Saturday. */
export type WeekdayMask = number;
export const EVERY_DAY: WeekdayMask = 0b1111111;

export type Habit = {
  id: string;
  name: string;
  creature: CreatureId;
  days: WeekdayMask;
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
};

export type DayState = 'done' | 'missed' | 'pending' | 'rest' | 'future';

export type HabitWithProgress = Habit & HabitProgress;

export type NewHabit = { name: string; creature: CreatureId; days?: WeekdayMask };
export type HabitPatch = Partial<NewHabit>;
