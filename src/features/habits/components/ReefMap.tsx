import { StyleSheet, View } from 'react-native';

import { Text, useTheme, withAlpha } from '@/design-system';
import { addDays, weekdayOf } from '@/core/dates';

import { weekdayInitial } from '../domain/progress';

const WEEKS = 18;

type ReefMapProps = {
  /** How full each day was, 0–1, by day key. Missing days were empty. */
  dayRatios: Record<string, number>;
  todayKey: string;
  /** Days before this one are not drawn (the habit did not exist yet). */
  startKey: string;
  tone: string;
};

/**
 * The last months as a reef: one square per day, a column per week, stronger the more was
 * done that day. Like a contribution map, it shows consistency at a glance.
 */
export function ReefMap({ dayRatios, todayKey, startKey, tone }: ReefMapProps) {
  const { colors } = useTheme();
  const firstSunday = addDays(todayKey, -weekdayOf(todayKey) - (WEEKS - 1) * 7);
  const filled = Object.entries(dayRatios).filter(
    ([day, ratio]) => day >= firstSunday && ratio >= 1,
  ).length;

  return (
    <View
      accessible
      accessibilityLabel={`Recife das últimas ${WEEKS} semanas: ${filled} dias completos`}
      style={styles.root}
    >
      <View style={styles.letters}>
        {weekdayInitial.map((letter, row) => (
          <Text key={row} variant="caption" tone="tertiary" style={styles.letter}>
            {row % 2 === 1 ? letter : ' '}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: WEEKS }, (_, week) => (
          <View key={week} style={styles.column}>
            {Array.from({ length: 7 }, (_, row) => {
              const day = addDays(firstSunday, week * 7 + row);
              const ratio = dayRatios[day] ?? 0;
              const future = day > todayKey;
              const before = day < startKey;
              return (
                <View
                  key={row}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: future
                        ? 'transparent'
                        : before
                          ? withAlpha(colors.textPrimary, 0.025)
                          : ratio > 0
                            ? withAlpha(tone, 0.25 + ratio * 0.75)
                            : withAlpha(colors.textPrimary, 0.06),
                      borderColor: day === todayKey ? tone : 'transparent',
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', gap: 4 },
  letters: { gap: 3, justifyContent: 'space-between' },
  letter: { fontSize: 9, lineHeight: 11, flex: 1, textAlignVertical: 'center' },
  grid: { flex: 1, flexDirection: 'row', gap: 3 },
  column: { flex: 1, gap: 3 },
  cell: { aspectRatio: 1, borderRadius: 3, borderWidth: 1 },
});
