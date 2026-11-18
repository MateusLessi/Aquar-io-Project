import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { addDays, fromDateKey } from '@/core/dates';
import { DAILY_CAP } from '@/core/progress/rules';
import {
  Surface,
  Text,
  chartColors,
  radius,
  spacing,
  useTheme,
  withAlpha,
  type ChartSeries,
} from '@/design-system';

import type { DaySummary } from '../progress/computeProgress';

const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const BAR_HEIGHT = 120;
const SERIES: { key: ChartSeries; label: string; one: string; many: string }[] = [
  { key: 'tasks', label: 'Tarefas', one: 'tarefa', many: 'tarefas' },
  { key: 'habits', label: 'Hábitos', one: 'hábito', many: 'hábitos' },
  { key: 'routines', label: 'Rotinas', one: 'item de rotina', many: 'itens de rotina' },
];

type WeekChartProps = {
  /** Inside a dashboard block, which draws the card. */
  bare?: boolean;
  /** Shorter bars, for a small box (Início on a laptop). */
  barHeight?: number;
  todayKey: string;
  byDay: Record<string, Partial<DaySummary> & { points: number; fullTide: boolean }>;
};

/** "3 tarefas, 1 hábito · 45 pontos", or "Nada feito". */
export function daySummary(day: (Partial<DaySummary> & { points: number }) | undefined): string {
  const parts = SERIES.map((s) => ({ s, n: day?.[s.key] ?? 0 }))
    .filter((p) => p.n > 0)
    .map((p) => `${p.n} ${p.n === 1 ? p.s.one : p.s.many}`);
  if (parts.length === 0) return 'Nada feito';
  return `${parts.join(', ')} · ${day?.points ?? 0} pontos`;
}

/**
 * The last seven days as bars of points, stacked by what was done (tasks, habits, routines);
 * today stands out. Tapping a day says what was done on it, right there.
 */
export function WeekChart({
  todayKey,
  byDay,
  bare = false,
  barHeight = BAR_HEIGHT,
}: WeekChartProps) {
  const Root = bare ? View : Surface;
  const { colors, scheme } = useTheme();
  const [chosen, setChosen] = useState<string | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(todayKey, i - 6));
  const total = days.reduce((sum, key) => sum + (byDay[key]?.points ?? 0), 0);
  const shown = chosen ?? todayKey;
  const shownDate = fromDateKey(shown);

  return (
    <Root
      style={bare ? styles.bare : styles.card}
      accessibilityLabel={`Sua semana: ${total} pontos nos últimos 7 dias.`}
    >
      <View style={[styles.header, bare && styles.bareHeader]}>
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
          const height = points > 0 ? Math.max(8, (points / DAILY_CAP) * barHeight) : 0;
          const counts = SERIES.map((s) => day?.[s.key] ?? 0);
          const sum = counts.reduce((a, b) => a + b, 0);
          const selected = key === shown;
          return (
            <Pressable
              key={key}
              onPress={() => setChosen(key === chosen ? null : key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${DAY_NAMES[fromDateKey(key).getDay()]}: ${daySummary(day)}`}
              style={styles.column}
            >
              <Text variant="caption" tone={selected ? 'primary' : 'tertiary'}>
                {day?.fullTide ? 'cheia' : points > 0 ? points : ''}
              </Text>
              <View
                style={[
                  styles.track,
                  {
                    height: barHeight,
                    backgroundColor: withAlpha(colors.accent, selected ? 0.16 : 0.08),
                    borderColor: isToday ? colors.energy : 'transparent',
                  },
                ]}
              >
                {/* Each kind gets its share of the day's bar. */}
                <View style={[styles.stack, { height }]}>
                  {SERIES.map((s, i) =>
                    counts[i]! > 0 ? (
                      <View
                        key={s.key}
                        style={{
                          flex: sum > 0 ? counts[i]! / sum : 0,
                          backgroundColor: chartColors[s.key][scheme],
                        }}
                      />
                    ) : null,
                  )}
                  {sum === 0 && height > 0 ? (
                    <View style={{ flex: 1, backgroundColor: withAlpha(colors.accent, 0.6) }} />
                  ) : null}
                </View>
              </View>
              <Text variant="caption" tone={selected ? 'primary' : 'secondary'}>
                {LETTERS[fromDateKey(key).getDay()]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.legend}>
        {SERIES.map((s) => (
          <View key={s.key} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: chartColors[s.key][scheme] }]} />
            <Text variant="caption" tone="secondary">
              {s.label}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="footnote" tone="secondary" accessibilityLiveRegion="polite">
        {shown === todayKey ? 'Hoje' : `${DAY_NAMES[shownDate.getDay()]}, ${shownDate.getDate()}`}:{' '}
        {daySummary(byDay[shown])}
      </Text>
    </Root>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  bare: { gap: spacing.md, flex: 1 },
  // Room for the block's arrow.
  bareHeader: { paddingRight: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  bars: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  column: { flex: 1, alignItems: 'center', gap: spacing.xs },
  track: {
    width: '100%',
    maxWidth: 40,
    height: BAR_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  stack: {
    width: '100%',
    flexDirection: 'column-reverse',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  legend: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 8, height: 8, borderRadius: 4 },
});
