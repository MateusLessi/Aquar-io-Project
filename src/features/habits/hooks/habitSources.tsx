import { createContext, useContext, type ComponentType } from 'react';

import type { HabitWithProgress } from '../domain/types';

/**
 * A habit done from a list, folder or routine (docs/connections.md), on one day. The app shell
 * computes it from the items themselves; this feature only shows it.
 */
export type ConnectedHabitDay = {
  /** Where it comes from today: "Push", "Semestre 4". */
  label: string;
  /** 0–1, counting items done in part. */
  ratio: number;
  done: boolean;
  doneCount: number;
  /** Items needed today; 0 is a rest day (no list that day). */
  required: number;
};

/** What the shell gives the habits feature for connected habits. */
export type HabitSources = {
  dayOf(habitId: string): ConnectedHabitDay | null;
  /** Marks (or clears) every item of today: the same marks as in the list or routine. */
  setDone(habitId: string, done: boolean): void;
  /** The items of the habit's day, with their own controls. */
  DayView: ComponentType<{ habitId: string }>;
};

export const HabitSourcesContext = createContext<HabitSources | null>(null);

export const useHabitSources = () => useContext(HabitSourcesContext);

/** A habit with its connected day applied: progress, done and rest come from the items. */
export function withConnectedDay(
  habit: HabitWithProgress,
  day: ConnectedHabitDay | null,
): HabitWithProgress {
  if (!day) return habit;
  return {
    ...habit,
    connected: day,
    scheduledToday: habit.scheduledToday && day.required > 0,
    doneToday: day.done,
    today: { ...habit.today, ratio: day.done ? 1 : day.ratio, amount: day.doneCount },
  };
}
