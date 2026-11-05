import { createContext, useContext } from 'react';

import { formatTime, type WeekStart } from '../dates';

export type CalendarPrefs = {
  weekStart: WeekStart;
  clock24: boolean;
};

export const defaultCalendarPrefs: CalendarPrefs = { weekStart: 0, clock24: true };

export const CalendarPrefsContext = createContext<CalendarPrefs>(defaultCalendarPrefs);

/** When the week starts and how times read, as chosen in Ajustes → Calendário. */
export function useCalendarPrefs(): CalendarPrefs & { showTime: (hhmm: string) => string } {
  const prefs = useContext(CalendarPrefsContext);
  return { ...prefs, showTime: (hhmm) => formatTime(hhmm, prefs.clock24) };
}
