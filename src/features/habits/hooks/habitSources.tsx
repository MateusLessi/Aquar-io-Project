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

/** Where a habit is done from, as chosen in the editor (the shell knows what the ids are). */
export type SourceDraft = {
  kind: 'list' | 'folder' | 'routine';
  /** The list, folder or routine; null until one is chosen. */
  id: string | null;
  /** Folders: one list per weekday, or the tasks due that day. */
  folderMode: 'weekday' | 'due';
  /** Weekday (0 = Sunday) → list id, for `weekday`. */
  lists: Partial<Record<number, string>>;
  /** Done with at least this many items; null for all of them. */
  atLeast: number | null;
  /** The days it applies, when the source decides them (weekday lists, a routine's days). */
  days: number | null;
};

export const emptySourceDraft = (kind: SourceDraft['kind']): SourceDraft => ({
  kind,
  id: null,
  folderMode: kind === 'folder' ? 'weekday' : 'due',
  lists: {},
  atLeast: null,
  days: null,
});

/** What the shell gives the habits feature for connected habits. */
export type HabitSources = {
  dayOf(habitId: string): ConnectedHabitDay | null;
  /** Marks (or clears) every item of today: the same marks as in the list or routine. */
  setDone(habitId: string, done: boolean): void;
  /** The items of the habit's day, with their own controls. */
  DayView: ComponentType<{ habitId: string }>;
  /** The editor's chooser for a list, folder or routine, with its rule. */
  SourcePicker: ComponentType<{ value: SourceDraft; onChange: (draft: SourceDraft) => void }>;
  /** Where an existing habit is done from, for the editor; null when done on its own. */
  sourceOf(habitId: string): SourceDraft | null;
  /** Saves (or, with null, removes) where a habit is done from. */
  saveSource(habitId: string, draft: SourceDraft | null): Promise<void>;
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
