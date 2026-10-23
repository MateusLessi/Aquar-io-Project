import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { addDays, toDateKey } from '@/core/dates';
import { DAILY_CAP } from '@/core/progress/rules';
import { IconButton, Surface, Text, spacing, useTheme, withAlpha } from '@/design-system';

const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type TideCalendarProps = {
  todayKey: string;
  byDay: Record<string, { points: number; fullTide: boolean }>;
};

/**
 * The month as tides: the more you did on a day, the fuller its water; high-tide days are
 * solid with a wave. A glance shows how consistent the month has been.
 */
export function TideCalendar({ todayKey, byDay }: TideCalendarProps) {
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
  const fullTides = cells.filter((k) => k && byDay[k]?.fullTide).length;
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
    <Surface style={styles.card}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="headline">{title.charAt(0).toUpperCase() + title.slice(1)}</Text>
          <Text variant="footnote" tone="secondary">
            {fullTides === 1 ? '1 dia de maré cheia' : `${fullTides} dias de maré cheia`}
          </Text>
        </View>
        <IconButton icon={ChevronLeft} label="Mês anterior" onPress={() => move(-1)} />
        <IconButton
          icon={ChevronRight}
          label="Próximo mês"
          onPress={() => move(1)}
          disabled={isCurrentMonth}
        />
      </View>
      <View style={styles.row}>
        {LETTERS.map((letter, i) => (
          <Text key={i} variant="caption" tone="tertiary" style={styles.letter}>
            {letter}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((key, i) => {
          if (!key) return <View key={`blank-${i}`} style={styles.cell} />;
          const day = byDay[key];
          const level = Math.min(1, (day?.points ?? 0) / DAILY_CAP);
          const isToday = key === todayKey;
          return (
            <View key={key} style={styles.cell}>
              <View
                accessible
                accessibilityLabel={`${Number(key.slice(8))}: ${day?.points ?? 0} pontos${day?.fullTide ? ', maré cheia' : ''}`}
                style={[
                  styles.day,
                  {
                    backgroundColor: day?.fullTide
                      ? colors.accent
                      : level > 0
                        ? withAlpha(colors.accent, 0.12 + level * 0.45)
                        : 'transparent',
                    borderColor: isToday ? colors.energy : 'transparent',
                  },
                ]}
              >
                <Text
                  variant="footnote"
                  tone={key > todayKey ? 'tertiary' : 'primary'}
                  style={day?.fullTide ? { color: colors.onAccent } : undefined}
                >
                  {Number(key.slice(8))}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  row: { flexDirection: 'row' },
  letter: { width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
