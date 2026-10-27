import { Bell, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { notificationsSupported, remindersUnavailableNote } from '@/core/notifications';
import { Button, Chip, Text, TimePicker, radius, spacing, useTheme } from '@/design-system';

import { MAX_REMINDERS } from '../domain/validation';

type ReminderTimesFieldProps = { value: string[]; onChange: (times: string[]) => void };

/** The habit's reminder times: chips to remove, and a picker to add one more. */
export function ReminderTimesField({ value, onChange }: ReminderTimesFieldProps) {
  const { colors } = useTheme();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('08:00');

  return (
    <View style={styles.root}>
      <View style={styles.chips}>
        {value.map((time) => (
          <Pressable
            key={time}
            onPress={() => onChange(value.filter((t) => t !== time))}
            accessibilityRole="button"
            accessibilityLabel={`Remover lembrete das ${time}`}
            style={[styles.time, { backgroundColor: colors.accentSoft }]}
          >
            <Bell size={16} color={colors.accent} />
            <Text variant="headline" tone="accent">
              {time}
            </Text>
            <X size={16} color={colors.accent} />
          </Pressable>
        ))}
        {!adding && value.length < MAX_REMINDERS ? (
          <Chip
            label={value.length === 0 ? 'Adicionar lembrete' : 'Outro horário'}
            icon={Plus}
            onPress={() => setAdding(true)}
          />
        ) : null}
      </View>

      {adding ? (
        <View style={[styles.picker, { borderColor: colors.border }]}>
          <TimePicker value={draft} onChange={setDraft} />
          <View style={styles.actions}>
            <Button label="Cancelar" variant="ghost" onPress={() => setAdding(false)} />
            <Button
              label="Adicionar"
              onPress={() => {
                onChange([...new Set([...value, draft])].sort());
                setAdding(false);
              }}
            />
          </View>
        </View>
      ) : null}

      {!notificationsSupported && value.length > 0 ? (
        <Text variant="footnote" tone="tertiary">
          {remindersUnavailableNote}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
