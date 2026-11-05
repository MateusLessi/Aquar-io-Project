import { router } from 'expo-router';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useProfileRepository } from '@/core/profile/useProfile';
import { SettingsContext } from '@/core/settings/useSetting';
import { useHabitsRepository } from '@/features/habits/hooks/habitsContext';
import { useRoutinesRepository } from '@/features/routines/hooks/routinesContext';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { WelcomeFlow, type WelcomeResult } from './WelcomeFlow';

export const WELCOME_DONE = 'welcome.done';
/** The age range from the quiz: kept on this device only (never synced). */
export const WELCOME_AGE = 'welcome.age';
/** Web: a browser that already went through the welcome (also lets tests start inside the app). */
const WEB_SEEN_KEY = 'aquario.welcome';

const WelcomeContext = createContext<{ open: () => void }>({ open: () => {} });

/** "Ver as boas-vindas" in Ajustes → Sobre. */
export const useWelcome = () => useContext(WelcomeContext);

function webSeen(): boolean {
  if (Platform.OS !== 'web') return false;
  try {
    return globalThis.localStorage?.getItem(WEB_SEEN_KEY) === 'done';
  } catch {
    return false;
  }
}

function rememberWebSeen() {
  if (Platform.OS !== 'web') return;
  try {
    globalThis.localStorage?.setItem(WEB_SEEN_KEY, 'done');
  } catch {
    // Private mode or blocked storage: the stored setting still remembers it.
  }
}

/**
 * Shows the welcome dive the first time the app opens on a device with nothing in it. People
 * who already use the app never see it after updating (their data marks it as seen).
 */
export function WelcomeHost({ children }: { children: ReactNode }) {
  const settings = useContext(SettingsContext);
  const habits = useHabitsRepository();
  const routines = useRoutinesRepository();
  const todo = useTodo();
  const profile = useProfileRepository();
  const [visible, setVisible] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!settings || webSeen()) return;
    let active = true;
    (async () => {
      if (await settings.get(WELCOME_DONE)) return;
      const empty =
        (await habits.listHabits()).length === 0 &&
        (await routines.listRoutines()).length === 0 &&
        (await todo.listLists()).length === 0;
      if (!empty) {
        await settings.set(WELCOME_DONE, 'existing');
        return;
      }
      if (active) setVisible(true);
    })().catch((error: unknown) => console.warn('Could not check the welcome.', error));
    return () => {
      active = false;
    };
  }, [settings, habits, routines, todo]);

  const done = async (how: string) => {
    rememberWebSeen();
    setVisible(false);
    await settings?.set(WELCOME_DONE, how);
  };

  const finish = async (result: WelcomeResult) => {
    await profile.set({ name: result.name, creature: result.creature });
    if (result.age) await settings?.set(WELCOME_AGE, result.age);
    for (const s of result.create) {
      if (s.kind === 'habit') await habits.createHabit(s.habit);
      else if (s.kind === 'routine') await routines.createRoutine(s.routine);
      else await todo.createList(s.list);
    }
    await done('quiz');
    router.replace('/');
  };

  return (
    <WelcomeContext.Provider
      value={{
        open: () => {
          setRound((r) => r + 1);
          setVisible(true);
        },
      }}
    >
      {children}
      <WelcomeFlow
        // A fresh start each time it opens.
        key={round}
        visible={visible}
        onFinish={finish}
        onSkip={() => void done('skipped')}
        onHaveAccount={() => {
          void done('account');
          router.push({ pathname: '/profile/settings', params: { section: 'account' } });
        }}
      />
    </WelcomeContext.Provider>
  );
}
