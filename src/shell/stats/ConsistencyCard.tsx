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
  const { colors } = useTheme();
  const { weekStart } = useCalendarPrefs();
  const { data } = useStats(periodOf('week', toDateKey(new Date()), weekStart));
  const planned = data?.current.planned ?? { due: 0, done: 0 };
  const rate = consistency(planned);
  const percent = rate === null ? 0 : Math.round(rate * 100);
  const shown = Math.round(useCountUp(percent));
  const r = (RING - STROKE) / 2;
  const length = 2 * Math.PI * r;
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
      <View style={styles.ring}>
        <Svg width={RING} height={RING}>
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={r}
            stroke={colors.surfacePressed}
            strokeWidth={STROKE}
            fill="none"
          />
          {rate !== null && rate > 0 ? (
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={r}
              stroke={colors.deepAccent}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${(length * shown) / 100} ${length}`}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          ) : null}
        </Svg>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.center}>
            <Text variant="headline">{rate === null ? '—' : `${shown}%`}</Text>
          </View>
        </View>
      </View>
      <View style={styles.text}>
        <Text variant="headline">Consistência da semana</Text>
        <Text variant="footnote" tone="secondary">
          {sentence}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingRight: spacing.xl },
  ring: { width: RING, height: RING },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
