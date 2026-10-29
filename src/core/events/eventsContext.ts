import { createContext, useContext } from 'react';

import type { EventLog } from './eventLog';

export const EventsContext = createContext<EventLog | null>(null);

/** The domain event log, to react to things as they happen (e.g. sounds). */
export function useEvents(): EventLog {
  const events = useContext(EventsContext);
  if (!events) throw new Error('useEvents must be used inside EventsContext.');
  return events;
}
