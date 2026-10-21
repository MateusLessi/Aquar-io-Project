import { Bell, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { notificationsSupported, requestNotificationPermission } from '@/core/notifications';
import { Button, Chip, Text, TimePicker, radius, spacing, useTheme } from '@/design-system';

import { formatRepeat, type Repeat } from '../domain/repeat';
import type { Task } from '../domain/types';

const repeatOptions: { label: string; value: Repeat | null }[] = [
  { label: 'Não repete', value: null },
  { label: 'Todo dia', value: { kind: 'daily' } },
  { label: 'Dias úteis', value: { kind: 'weekdays', days: 0b0111110 } },
  { label: 'Toda semana', value: { kind: 'weekly' } },
  { label: 'Todo mês', value: { kind: 'monthly' } },
];

type Props = {
  task: Task;
  onChange: (patch: { repeat?: Repeat | null; remindAt?: string | null }) => Promise<void>;
};

/** "Repetir" chips for top-level tasks with a due date. */
export function RepeatField({ task, onChange }: Props) {
  const current = formatRepeat(task.repeat);
  return (
    <View style={styles.chips}>
      {repeatOptions.map((option) => (
        <Chip
          key={option.label}
          label={option.label}
          selected={formatRepeat(option.value) === current}
          onPress={() => void onChange({ repeat: option.value })}
        />
      ))}
    </View>
  );
}

/** A reminder at a time on the due date. */
export function ReminderField({ task, onChange }: Props) {
  const { colors } = useTheme();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('09:00');

  if (task.remindAt) {
    return (
      <View style={styles.chips}>
        <Pressable
          onPress={() => void onChange({ remindAt: null })}
          accessibilityRole="button"
          accessibilityLabel={`Remover lembrete das ${task.remindAt}`}
          style={[styles.time, { backgroundColor: colors.accentSoft }]}
        >
          <Bell size={16} color={colors.accent} />
          <Text variant="headline" tone="accent">
            {task.remindAt}
          </Text>
          <X size={16} color={colors.accent} />
        </Pressable>
        {!notificationsSupported ? (
          <Text variant="footnote" tone="tertiary">
            Toca no celular e no tablet.
          </Text>
        ) : null}
      </View>
    );
  }

  if (!adding) {
    return (
      <View style={styles.chips}>
        <Chip label="Adicionar lembrete" icon={Plus} onPress={() => setAdding(true)} />
      </View>
    );
  }

  return (
    <View style={[styles.picker, { borderColor: colors.border }]}>
      <TimePicker value={draft} onChange={setDraft} />
      <View style={styles.actions}>
        <Button label="Cancelar" variant="ghost" onPress={() => setAdding(false)} />
        <Button
          label="Salvar lembrete"
          onPress={async () => {
            await onChange({ remindAt: draft });
            setAdding(false);
            // Ask in context: only when the person has just set a reminder.
            await requestNotificationPermission();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    borderRadius: radius.pill,
  },
  picker: { gap: spacing.md, padding: spacing.md, borderWidth: 1, borderRadius: radius.lg },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
