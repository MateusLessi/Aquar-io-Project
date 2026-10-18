import { CalendarDays, X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CalendarMonth, Chip, spacing } from '@/design-system';

import { dueLabel, quickDueDates } from '../domain/dates';

type DueDatePickerProps = {
  value: string | null;
  todayKey: string;
  onChange: (value: string | null) => void;
};

/** Quick picks (Hoje, Amanhã, Próxima semana) plus a calendar for any other day. */
export function DueDatePicker({ value, todayKey, onChange }: DueDatePickerProps) {
  const quick = quickDueDates(todayKey);
  const isQuick = quick.some((q) => q.value === value);
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <View style={styles.root}>
      <View style={styles.chips}>
        {quick.map((option) => (
          <Chip
            key={option.label}
            label={option.label}
            selected={value === option.value}
            onPress={() => {
              setCalendarOpen(false);
              onChange(value === option.value ? null : option.value);
            }}
          />
        ))}
        <Chip
          label={value && !isQuick ? dueLabel(value, todayKey) : 'Escolher data'}
          icon={CalendarDays}
          selected={Boolean(value && !isQuick) || calendarOpen}
          onPress={() => setCalendarOpen((open) => !open)}
        />
        {value ? (
          <Chip
            label="Sem prazo"
            icon={X}
            onPress={() => {
              setCalendarOpen(false);
              onChange(null);
            }}
          />
        ) : null}
      </View>
      {calendarOpen ? (
        <CalendarMonth
          value={value}
          today={todayKey}
          onChange={(day) => {
            onChange(day);
            setCalendarOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
