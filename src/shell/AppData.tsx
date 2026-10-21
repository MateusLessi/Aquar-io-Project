import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { createDataChanges, type DataChanges } from '@/core/database/changes';
import { openAppDatabase } from '@/core/database/expoDatabase';
import { migrate } from '@/core/database/migrations';
import type { Database } from '@/core/database/types';
import { DataChangesContext } from '@/core/database/useLiveQuery';
import { createEventLog, type EventLog } from '@/core/events/eventLog';
import { newId } from '@/core/ids';
import { createDefaultAccount, type AccountService } from '@/core/sync/account';
import {
  createSettingsRepository,
  type SettingsRepository,
} from '@/core/settings/settingsRepository';
import { SettingsContext } from '@/core/settings/useSetting';
import type { ThemePreference } from '@/design-system';
import {
  createHabitsRepository,
  type HabitsRepository,
} from '@/features/habits/data/habitsRepository';
import { HabitsContext } from '@/features/habits/hooks/habitsContext';
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
  themePreference: ThemePreference;
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
  const storedTheme = await settings.get(THEME_KEY);
  const themePreference = themePreferences.find((p) => p === storedTheme) ?? 'system';
  return {
    db,
    account,
    changes,
    events,
    settings,
    todo,
    habits,
    themePreference,
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
      <SettingsContext.Provider value={data.settings}>
        <TodoContext.Provider value={data.todo}>
          <HabitsContext.Provider value={data.habits}>
            <AccountProvider account={data.account} db={data.db} changes={data.changes}>
              {children}
            </AccountProvider>
          </HabitsContext.Provider>
        </TodoContext.Provider>
      </SettingsContext.Provider>
    </DataChangesContext.Provider>
  );
}

export const saveThemePreference = (data: AppData, preference: ThemePreference) =>
  data.settings.set(THEME_KEY, preference);
