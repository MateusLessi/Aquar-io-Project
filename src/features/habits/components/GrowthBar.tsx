import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text, spacing, useTheme } from '@/design-system';

import { nextStage, stageInfo } from '../domain/stages';
import type { HabitWithProgress } from '../domain/types';

export const days = (n: number) => (n === 1 ? '1 dia' : `${n} dias`);

/**
 * How far the creature is from its next stage: a bar and "12 de 30 dias até Adulto". Full, in
 * sand, once grown. On the habit's page and on its card in the aquarium.
 */
export function GrowthBar({
  habit,
  style,
}: {
  habit: HabitWithProgress;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const next = nextStage(habit.creature, habit.daysDone);
  const goal = next ? habit.daysDone + next.daysLeft : habit.daysDone;
  const ratio = next ? habit.daysDone / goal : 1;
  const label = next
    ? `${habit.daysDone} de ${days(goal)} até ${stageInfo[next.stage].label}`
    : `Totalmente crescido · ${days(habit.daysDone)} feitos`;
  return (
    <View
      style={[styles.root, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Crescimento: ${label}`}
      accessibilityValue={{ min: 0, max: Math.max(goal, 1), now: habit.daysDone }}
    >
      <View style={[styles.track, { backgroundColor: colors.surfacePressed }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.round(ratio * 100)}%`,
              backgroundColor: next ? colors.accent : colors.deepAccent,
            },
          ]}
        />
      </View>
      <Text variant="footnote" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});
