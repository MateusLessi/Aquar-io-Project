import { createContext, useContext } from 'react';

import type { RoutinesRepository } from '../data/routinesRepository';

export const RoutinesContext = createContext<RoutinesRepository | null>(null);

/** The Routines repository, for actions (create, update, check, delete). */
export function useRoutinesRepository(): RoutinesRepository {
  const routines = useContext(RoutinesContext);
  if (!routines) throw new Error('useRoutinesRepository must be used inside RoutinesContext.');
  return routines;
}
