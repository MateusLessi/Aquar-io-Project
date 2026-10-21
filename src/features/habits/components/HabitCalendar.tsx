import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { addDays, toDateKey } from '@/core/dates';
import { IconButton, Text, spacing, useTheme, withAlpha } from '@/design-system';

import { isScheduled, weekdayInitial } from '../domain/progress';
import type { WeekdayMask } from '../domain/types';

type HabitCalendarProps = {
  done: ReadonlySet<string>;
  days: WeekdayMask;
  todayKey: string;
  startKey: string;
  tone: string;
  /** Tapping a past day (or today) fixes its check-in. */
  onToggle: (date: string, done: boolean) => void;
};

/** A month of check-ins: filled when done, a faint ring when it was due and missed. */
export function HabitCalendar({
  done,
  days,
  todayKey,
  startKey,
  tone,
  onToggle,
}: HabitCalendarProps) {
  const { colors } = useTheme();
  const [today] = useState(() => todayKey.split('-').map(Number) as [number, number, number]);
  const [cursor, setCursor] = useState({ year: today[0], month: today[1] - 1 });

  const first = toDateKey(new Date(cursor.year, cursor.month, 1));
  const leading = new Date(cursor.year, cursor.month, 1).getDay();
  const length = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length }, (_, i) => addDays(first, i)),
  ];
  const title = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(cursor.year, cursor.month, 1),
  );
  const isCurrentMonth = cursor.year === today[0] && cursor.month === today[1] - 1;
  const move = (delta: number) =>
    setCursor(({ year, month }) => {
      const date = new Date(year, month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <IconButton icon={ChevronLeft} label="Mês anterior" onPress={() => move(-1)} />
        <Text variant="headline" style={styles.title}>
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </Text>
        <IconButton
          icon={ChevronRight}
          label="Próximo mês"
          onPress={() => move(1)}
          disabled={isCurrentMonth}
        />
      </View>
      <View style={styles.row}>
        {weekdayInitial.map((initial, i) => (
          <Text key={i} variant="caption" tone="tertiary" style={styles.weekday}>
            {initial}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((key, i) => {
          if (!key) return <View key={`blank-${i}`} style={styles.cell} />;
          const isDone = done.has(key);
          const future = key > todayKey;
          const missed =
            !isDone && !future && key !== todayKey && key >= startKey && isScheduled(days, key);
          const label = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(
            new Date(cursor.year, cursor.month, Number(key.slice(8))),
          );
          return (
            <View key={key} style={styles.cell}>
              <Pressable
                disabled={future}
                onPress={() => onToggle(key, !isDone)}
                accessibilityRole="checkbox"
                accessibilityLabel={label}
                accessibilityState={{ checked: isDone, disabled: future }}
                aria-checked={isDone}
                style={[
                  styles.day,
                  isDone && { backgroundColor: tone },
                  missed && { borderColor: withAlpha(tone, 0.35) },
                  key === todayKey && !isDone && { borderColor: tone, borderWidth: 2 },
                ]}
              >
                <Text
                  variant="callout"
                  tone={future ? 'tertiary' : 'primary'}
                  style={isDone ? { color: colors.surfaceRaised } : undefined}
                >
                  {Number(key.slice(8))}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, textAlign: 'center' },
  row: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
