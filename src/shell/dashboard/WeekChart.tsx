import { StyleSheet, View } from 'react-native';

import { addDays, fromDateKey } from '@/core/dates';
import { DAILY_CAP } from '@/core/progress/rules';
import { Surface, Text, radius, spacing, useTheme, withAlpha } from '@/design-system';

const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const BAR_HEIGHT = 120;

type WeekChartProps = {
  todayKey: string;
  byDay: Record<string, { points: number; fullTide: boolean }>;
};

/** The last seven days as bars of points; today stands out, high-tide days get a wave. */
export function WeekChart({ todayKey, byDay }: WeekChartProps) {
  const { colors } = useTheme();
  const days = Array.from({ length: 7 }, (_, i) => addDays(todayKey, i - 6));
  const total = days.reduce((sum, key) => sum + (byDay[key]?.points ?? 0), 0);

  return (
    <Surface
      style={styles.card}
      accessible
      accessibilityLabel={`Sua semana: ${total} pontos nos últimos 7 dias.`}
    >
      <View style={styles.header}>
        <Text variant="headline">Sua semana</Text>
        <Text variant="footnote" tone="secondary">
          {total} pontos
        </Text>
      </View>
      <View style={styles.bars}>
        {days.map((key) => {
          const day = byDay[key];
          const points = day?.points ?? 0;
          const isToday = key === todayKey;
          const height = Math.max(6, (points / DAILY_CAP) * BAR_HEIGHT);
          return (
            <View key={key} style={styles.column}>
              <Text variant="caption" tone={isToday ? 'primary' : 'tertiary'}>
                {day?.fullTide ? '🌊' : points > 0 ? points : ''}
              </Text>
              <View style={[styles.track, { backgroundColor: withAlpha(colors.accent, 0.08) }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: isToday
                        ? colors.energy
                        : withAlpha(colors.accent, points > 0 ? 0.75 : 0.2),
                    },
                  ]}
                />
              </View>
              <Text variant="caption" tone={isToday ? 'primary' : 'secondary'}>
                {LETTERS[fromDateKey(key).getDay()]}
              </Text>
            </View>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  bars: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  column: { flex: 1, alignItems: 'center', gap: spacing.xs },
  track: {
    width: '100%',
    maxWidth: 40,
    height: BAR_HEIGHT,
    borderRadius: radius.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: radius.md },
});
