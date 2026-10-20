import { createContext, useCallback, useContext } from 'react';

import { useLiveQuery } from '../database/useLiveQuery';
import type { SettingsRepository } from './settingsRepository';

export const SettingsContext = createContext<SettingsRepository | null>(null);

/** Reads a stored preference live, with a fallback, and returns a setter that persists it. */
export function useSetting<T extends string>(key: string, fallback: T) {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error('useSetting must be used inside SettingsContext.');
  const { data } = useLiveQuery(`setting:${key}`, ['settings'], () => settings.get(key));
  const set = useCallback((value: T) => settings.set(key, value), [settings, key]);
  return [(data ?? fallback) as T, set] as const;
}
