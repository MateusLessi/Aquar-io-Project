import { useRouter, type Href } from 'expo-router';
import { useContext, useEffect } from 'react';
import { AppState } from 'react-native';

import { DataChangesContext } from '@/core/database/useLiveQuery';
import {
  configureNotifications,
  notificationPermission,
  notificationsSupported,
  onReminderTapped,
  replaceScheduledReminders,
} from '@/core/notifications';
import { useSetting } from '@/core/settings/useSetting';
import { useHabitsRepository } from '@/features/habits/hooks/habitsContext';
import { useRoutinesRepository } from '@/features/routines/hooks/routinesContext';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { planReminders } from './plan';

/** Per device: each person picks which of their devices rings. Not synced. */
export const REMINDERS_SETTING = 'reminders';
export type RemindersSetting = 'on' | 'off';

/** Wait for a burst of edits to settle before rescheduling. */
const DEBOUNCE_MS = 1000;

/**
 * Keeps this device's scheduled notifications in line with the data: on startup, after any
 * change to habits or tasks (here or synced from another device) and when the app comes back.
 */
export function useReminderScheduler() {
  const router = useRouter();
  const changes = useContext(DataChangesContext);
  const habits = useHabitsRepository();
  const todo = useTodo();
  const routines = useRoutinesRepository();
  const [setting] = useSetting<RemindersSetting>(REMINDERS_SETTING, 'on');

  useEffect(() => {
    if (!notificationsSupported) return;
    configureNotifications();
    return onReminderTapped((url) => router.push(url as Href));
  }, [router]);

  useEffect(() => {
    if (!notificationsSupported || !changes) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;

    const reschedule = async () => {
      const allowed = setting === 'on' && (await notificationPermission()) === 'granted';
      const now = new Date();
      const plan = allowed
        ? planReminders({
            habits: await habits.listHabits(),
            tasks: await todo.listReminders(),
            routines: await routines.listReminders(),
            now,
          })
        : [];
      if (active) await replaceScheduledReminders(plan);
    };
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        reschedule().catch((error: unknown) =>
          console.warn('Could not schedule reminders.', error),
        );
      }, DEBOUNCE_MS);
    };

    soon();
    const unsubscribe = changes.subscribe((topic) => {
      if (topic !== 'lists') soon();
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') soon();
    });
    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe();
      appState.remove();
    };
  }, [changes, habits, todo, routines, setting]);
}
