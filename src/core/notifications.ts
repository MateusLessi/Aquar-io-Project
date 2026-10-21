import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Local notifications exist on iOS and Android; the web build has no reminders. */
export const notificationsSupported = Platform.OS !== 'web';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function notificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

/**
 * Asks for permission in context (when the person sets their first reminder), never at launch.
 * Asks only once: after a "no", the system settings are the only way back.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await notificationPermission();
  if (current !== 'undetermined') return current === 'granted';
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export type Reminder = {
  /** Stable id, e.g. "habit:<id>:2026-10-21T10:00". */
  id: string;
  at: Date;
  title: string;
  body: string;
  /** Route opened when the notification is tapped. */
  url: string;
};

const CHANNEL = 'reminders';

/** Shows reminders as banners even while the app is open. Call once at startup. */
export function configureNotifications() {
  if (!notificationsSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Lembretes',
      importance: Notifications.AndroidImportance.HIGH,
    }).catch((error: unknown) => console.warn('Could not create the reminders channel.', error));
  }
}

/** Replaces everything this app scheduled with `reminders`. */
export async function replaceScheduledReminders(reminders: Reminder[]): Promise<void> {
  if (!notificationsSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: { title: reminder.title, body: reminder.body, data: { url: reminder.url } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.at,
        channelId: CHANNEL,
      },
    });
  }
}

/** Calls back with the route of each reminder the person taps. */
export function onReminderTapped(listener: (url: string) => void): () => void {
  if (!notificationsSupported) return () => {};
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string') listener(url);
  });
  return () => subscription.remove();
}
