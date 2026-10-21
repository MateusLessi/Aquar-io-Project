import { createContext, useContext } from 'react';

import type { HabitsRepository } from '../data/habitsRepository';

export const HabitsContext = createContext<HabitsRepository | null>(null);

/** The Habits repository, for actions (create, update, check, delete). */
export function useHabitsRepository(): HabitsRepository {
  const habits = useContext(HabitsContext);
  if (!habits) throw new Error('useHabitsRepository must be used inside HabitsContext.');
  return habits;
}
