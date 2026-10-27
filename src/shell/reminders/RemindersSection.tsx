import { useEffect, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';

import {
  notificationPermission,
  remindersUnavailableNote,
  requestNotificationPermission,
  type NotificationPermission,
} from '@/core/notifications';
import { useSetting } from '@/core/settings/useSetting';
import { Button, SegmentedControl, Text, spacing } from '@/design-system';

import { REMINDERS_SETTING, type RemindersSetting } from './useReminderScheduler';

const options: { value: RemindersSetting; label: string }[] = [
  { value: 'on', label: 'Ligados' },
  { value: 'off', label: 'Desligados' },
];

function usePermission(): NotificationPermission | null {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  useEffect(() => {
    const check = () => {
      notificationPermission().then(setPermission, () => setPermission('unsupported'));
    };
    check();
    // The person may have changed it in the system settings and come back.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, []);
  return permission;
}

/** Settings: whether this device rings for reminders, and the system permission behind it. */
export function RemindersSection() {
  const [setting, setSetting] = useSetting<RemindersSetting>(REMINDERS_SETTING, 'on');
  const permission = usePermission();

  if (permission === 'unsupported') {
    return (
      <Text variant="footnote" tone="tertiary" style={styles.note}>
        {remindersUnavailableNote} Configure-os nos hábitos e nas tarefas.
      </Text>
    );
  }

  return (
    <View style={styles.root}>
      <SegmentedControl
        accessibilityLabel="Lembretes neste aparelho"
        options={options}
        value={setting}
        onChange={(value) => {
          void setSetting(value);
          if (value === 'on') void requestNotificationPermission();
        }}
      />
      <Text variant="footnote" tone="tertiary" style={styles.note}>
        {setting === 'off'
          ? 'Este aparelho não toca lembretes. Os outros aparelhos continuam tocando.'
          : permission === 'denied'
            ? 'As notificações do Aquar.io estão bloqueadas nos ajustes do sistema.'
            : permission === 'granted'
              ? 'Os lembretes dos seus hábitos e tarefas tocam neste aparelho.'
              : 'O app pede permissão quando você criar o primeiro lembrete.'}
      </Text>
      {setting === 'on' && permission === 'denied' ? (
        <Button
          label="Abrir ajustes do sistema"
          variant="secondary"
          onPress={() => void Linking.openSettings()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  note: { marginLeft: spacing.xs },
});
