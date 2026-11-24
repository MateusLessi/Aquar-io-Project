import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { toDateKey } from '@/core/dates';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import { Text, spacing, useCountUp, useTheme } from '@/design-system';

import { periodOf } from './computeStats';
import { useStats } from './useStats';

const RING = 68;
const STROKE = 7;

/** The share of the week's plan that got done, 0–1, or null when nothing was planned yet. */
export function consistency(planned: { due: number; done: number }): number | null {
  return planned.due > 0 ? Math.min(1, planned.done / planned.due) : null;
}

/**
 * "Consistência da semana" (Fase 6): one ring, one number and one sentence. The share of the
 * habits and routine items planned so far this week that got done. Simple on purpose: no
 * comparisons or charts here (they live in the statistics).
 */
export function ConsistencyCard() {
  const { weekStart } = useCalendarPrefs();
  const { data } = useStats(periodOf('week', toDateKey(new Date()), weekStart));
  const planned = data?.current.planned ?? { due: 0, done: 0 };
  const rate = consistency(planned);
  const percent = rate === null ? 0 : Math.round(rate * 100);
  const sentence =
    rate === null
      ? 'Nada planejado ainda nesta semana'
      : `${planned.done} de ${planned.due} hábitos e rotinas feitos`;

  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={
        rate === null
          ? `Consistência da semana: ${sentence}`
          : `Consistência da semana: ${percent}%. ${sentence}`
      }
    >
      <ConsistencyRing rate={rate} size={RING} stroke={STROKE} />
      <View style={styles.text}>
        <Text variant="headline">Consistência da semana</Text>
        <Text variant="footnote" tone="secondary">
          {sentence}
        </Text>
      </View>
    </View>
  );
}

/**
 * The consistency as a sand ring filling up, the number counting up in the middle ("—" with
 * nothing planned). Decorative: the parent says the number.
 */
export function ConsistencyRing({
  rate,
  size,
  stroke,
  big = false,
}: {
  rate: number | null;
  size: number;
  stroke: number;
  /** The number in a larger type (the statistics). */
  big?: boolean;
}) {
  const { colors } = useTheme();
  const percent = rate === null ? 0 : Math.round(rate * 100);
  const shown = Math.round(useCountUp(percent));
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size }} importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfacePressed}
          strokeWidth={stroke}
          fill="none"
        />
        {rate !== null && rate > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.deepAccent}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${(length * shown) / 100} ${length}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <Text variant={big ? 'title1' : 'headline'}>{rate === null ? '—' : `${shown}%`}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingRight: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
