import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { createDataChanges, type DataChanges } from '@/core/database/changes';
import { openAppDatabase } from '@/core/database/expoDatabase';
import { migrate } from '@/core/database/migrations';
import type { Database } from '@/core/database/types';
import { DataChangesContext } from '@/core/database/useLiveQuery';
import { createEventLog, type EventLog } from '@/core/events/eventLog';
import { EventsContext } from '@/core/events/eventsContext';
import { newId } from '@/core/ids';
import { LinksContext } from '@/core/links/linksContext';
import { createLinksRepository, type LinksRepository } from '@/core/links/linksRepository';
import { createProfileRepository, type ProfileRepository } from '@/core/profile/profileRepository';
import { ProfileContext } from '@/core/profile/useProfile';
import { createDefaultAccount, type AccountService } from '@/core/sync/account';
import {
  createSettingsRepository,
  type SettingsRepository,
} from '@/core/settings/settingsRepository';
import { SettingsContext } from '@/core/settings/useSetting';
import type { AccessibilityChoices, ThemePreference } from '@/design-system';
import {
  createHabitsRepository,
  type HabitsRepository,
} from '@/features/habits/data/habitsRepository';
import { HabitsContext } from '@/features/habits/hooks/habitsContext';
import {
  createRoutinesRepository,
  type RoutinesRepository,
} from '@/features/routines/data/routinesRepository';
import { RoutinesContext } from '@/features/routines/hooks/routinesContext';
import { createTodoRepository, type TodoRepository } from '@/features/todo/data/todoRepository';
import { TodoContext } from '@/features/todo/hooks/todoContext';

import { AccountProvider } from './Account';

export type AppData = {
  db: Database;
  /** Null when the app was built without a cloud project. */
  account: AccountService | null;
  changes: DataChanges;
  events: EventLog;
  settings: SettingsRepository;
  todo: TodoRepository;
  habits: HabitsRepository;
  routines: RoutinesRepository;
  profile: ProfileRepository;
  links: LinksRepository;
  themePreference: ThemePreference;
  /** The person's accessibility choices (null: follow the device). */
  accessibility: AccessibilityChoices;
};

const THEME_KEY = 'theme';
const themePreferences: ThemePreference[] = ['system', 'light', 'dark'];

/** Wires every module to the same database: the app's composition root. */
export async function createAppData(
  db: Database,
  now: () => Date = () => new Date(),
  account: AccountService | null = createDefaultAccount(),
) {
  await migrate(db);
  const changes = createDataChanges();
  const events = createEventLog({ db, newId, now });
  const settings = createSettingsRepository(db, changes);
  const todo = createTodoRepository({ db, changes, events, newId, now });
  const habits = createHabitsRepository({ db, changes, events, newId, now });
  const routines = createRoutinesRepository({ db, changes, events, newId, now });
  const profile = createProfileRepository(db, changes, now);
  const links = createLinksRepository({ db, changes, now });
  // The profile used to live in this device's settings: carry it over once.
  const oldName = await settings.get('profileName');
  const oldCreature = await settings.get('profileCreature');
  const current = await profile.get();
  if (!current.name && !current.creature && (oldName || oldCreature)) {
    await profile.set({ name: oldName ?? '', creature: oldCreature });
  }
  const storedTheme = await settings.get(THEME_KEY);
  const themePreference = themePreferences.find((p) => p === storedTheme) ?? 'system';
  const choice = (value: string | null) => (value === 'on' ? true : value === 'off' ? false : null);
  const accessibility: AccessibilityChoices = {
    reduceMotion: choice(await settings.get('reduceMotion')),
    reduceTransparency: choice(await settings.get('reduceTransparency')),
  };
  return {
    db,
    account,
    changes,
    events,
    settings,
    todo,
    habits,
    routines,
    profile,
    links,
    themePreference,
    accessibility,
  } satisfies AppData;
}

export type BootState =
  | { status: 'loading' }
  | { status: 'ready'; data: AppData }
  | { status: 'error'; error: Error; retry: () => void };

/** Opens the database once at startup. */
export function useAppDataBootstrap(): BootState {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<BootState>({ status: 'loading' });
  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let active = true;
    openAppDatabase()
      .then((db) => createAppData(db))
      .then(
        (data) => active && setState({ status: 'ready', data }),
        (error: unknown) =>
          active &&
          setState({
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
            retry,
          }),
      );
    return () => {
      active = false;
    };
  }, [attempt, retry]);

  return state;
}

export function AppDataProvider({ data, children }: { data: AppData; children: ReactNode }) {
  return (
    <DataChangesContext.Provider value={data.changes}>
      <EventsContext.Provider value={data.events}>
        <SettingsContext.Provider value={data.settings}>
          <TodoContext.Provider value={data.todo}>
            <HabitsContext.Provider value={data.habits}>
              <RoutinesContext.Provider value={data.routines}>
                <ProfileContext.Provider value={data.profile}>
                  <LinksContext.Provider value={data.links}>
                    <AccountProvider account={data.account} db={data.db} changes={data.changes}>
                      {children}
                    </AccountProvider>
                  </LinksContext.Provider>
                </ProfileContext.Provider>
              </RoutinesContext.Provider>
            </HabitsContext.Provider>
          </TodoContext.Provider>
        </SettingsContext.Provider>
      </EventsContext.Provider>
    </DataChangesContext.Provider>
  );
}

export const saveAccessibility = (
  data: AppData,
  key: keyof AccessibilityChoices,
  value: boolean | null,
) => data.settings.set(key, value === null ? '' : value ? 'on' : 'off');

export const saveThemePreference = (data: AppData, preference: ThemePreference) =>
  data.settings.set(THEME_KEY, preference);
