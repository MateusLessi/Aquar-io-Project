import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Text,
  haptics,
  listColors,
  radius,
  spacing,
  touchTarget,
  useTheme,
  withAlpha,
} from '@/design-system';

import { creatures } from '../domain/creatures';
import { weekdayInitial } from '../domain/progress';
import type { DayState, HabitWithProgress } from '../domain/types';
import { CreatureBubble } from './CreatureBubble';

type HabitCardProps = {
  habit: HabitWithProgress;
  onToggle: (done: boolean) => void;
  onPress: () => void;
};

export function streakLabel({ streak, doneToday, scheduledToday }: HabitWithProgress): string {
  if (streak === 0) return scheduledToday ? 'Comece hoje' : 'Dia de descanso';
  if (streak === 1) return doneToday ? 'Primeiro dia!' : '1 dia';
  return `${streak} dias seguidos`;
}

/**
 * A habit as a tile: its creature, the check for today and this week at a glance.
 * The big round button checks today; the rest of the card opens the habit.
 */
export function HabitCard({ habit, onToggle, onPress }: HabitCardProps) {
  const { colors, scheme } = useTheme();
  const tone = listColors[creatures[habit.creature].color][scheme];
  const resting = !habit.scheduledToday && !habit.doneToday;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${habit.name}, ${streakLabel(habit)}`}
      accessibilityHint="Abre o hábito"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: withAlpha(tone, habit.doneToday ? 0.6 : 0.3),
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(tone, habit.doneToday ? 0.2 : 0.1) },
        ]}
      />
      <View style={styles.top}>
        <CreatureBubble creature={habit.creature} done={habit.doneToday} resting={resting} />
        <CheckButton
          done={habit.doneToday}
          tone={tone}
          label={habit.name}
          onToggle={(done) => {
            if (done) haptics.success();
            else haptics.selection();
            onToggle(done);
          }}
        />
      </View>
      <View style={styles.texts}>
        <Text variant="headline" numberOfLines={1}>
          {habit.name}
        </Text>
        <Text variant="footnote" tone={habit.streak > 0 ? 'primary' : 'secondary'}>
          {habit.streak > 0 ? '🌊 ' : ''}
          {streakLabel(habit)}
        </Text>
      </View>
      <WeekStrip week={habit.week} tone={tone} />
    </Pressable>
  );
}

function CheckButton({
  done,
  tone,
  label,
  onToggle,
}: {
  done: boolean;
  tone: string;
  label: string;
  onToggle: (done: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onToggle(!done)}
      accessibilityRole="checkbox"
      accessibilityLabel={`${label}: feito hoje`}
      accessibilityState={{ checked: done }}
      aria-checked={done}
      hitSlop={8}
      style={({ pressed }) => [
        styles.check,
        {
          backgroundColor: done ? tone : 'transparent',
          borderColor: done ? tone : withAlpha(tone, 0.7),
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
      ]}
    >
      <Check
        size={22}
        strokeWidth={3}
        color={done ? colors.surfaceRaised : withAlpha(tone, 0.55)}
      />
    </Pressable>
  );
}

/** Seven small dots, Sunday first: filled when done, ringed when due, faint when resting. */
export function WeekStrip({ week, tone }: { week: DayState[]; tone: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.week} accessible={false}>
      {week.map((state, i) => (
        <View key={i} style={styles.day}>
          <View
            style={[
              styles.dot,
              state === 'done' && { backgroundColor: tone, borderColor: tone },
              state === 'missed' && { borderColor: withAlpha(tone, 0.45) },
              state === 'pending' && { borderColor: tone, borderWidth: 2 },
              (state === 'rest' || state === 'future') && {
                borderColor: colors.border,
                borderStyle: 'dashed',
              },
            ]}
          />
          <Text variant="caption" tone="tertiary">
            {weekdayInitial[i]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  texts: { gap: 2 },
  check: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 2 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: 'transparent' },
});
