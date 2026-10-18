import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

function key(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export type CalendarMonthProps = {
  /** Selected day, `YYYY-MM-DD`. */
  value: string | null;
  /** Today, `YYYY-MM-DD`; highlighted. */
  today: string;
  onChange: (value: string) => void;
};

/** A month grid for picking a calendar day. */
export function CalendarMonth({ value, today, onChange }: CalendarMonthProps) {
  const { colors } = useTheme();
  const start = (value ?? today).split('-').map(Number) as [number, number, number];
  const [cursor, setCursor] = useState({ year: start[0], month: start[1] - 1 });

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const title = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(cursor.year, cursor.month, 1),
  );
  const move = (delta: number) =>
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  return (
    <View>
      <View style={styles.header}>
        <IconButton icon={ChevronLeft} label="Mês anterior" onPress={() => move(-1)} />
        <Text variant="headline" style={styles.title}>
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </Text>
        <IconButton icon={ChevronRight} label="Próximo mês" onPress={() => move(1)} />
      </View>
      <View style={styles.row}>
        {WEEKDAYS.map((day, i) => (
          <Text key={i} variant="caption" tone="tertiary" style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const dayKey = key(cursor.year, cursor.month, day);
          const selected = dayKey === value;
          const isToday = dayKey === today;
          return (
            <Pressable
              key={i}
              onPress={() => onChange(dayKey)}
              accessibilityRole="button"
              accessibilityLabel={`${WEEKDAY_NAMES[i % 7]}, ${day}${isToday ? ', hoje' : ''}`}
              accessibilityState={{ selected }}
              aria-selected={selected}
              style={styles.cell}
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.day,
                    selected && { backgroundColor: colors.accent },
                    !selected && pressed && { backgroundColor: colors.surfacePressed },
                    !selected && isToday && { borderColor: colors.accent, borderWidth: 1.5 },
                  ]}
                >
                  <Text
                    variant={selected || isToday ? 'bodyStrong' : 'body'}
                    tone={selected ? 'onAccent' : isToday ? 'accent' : 'primary'}
                  >
                    {day}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, textAlign: 'center' },
  row: { flexDirection: 'row', marginTop: spacing.sm },
  weekday: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, maxHeight: 48, padding: 2 },
  day: {
    flex: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
