import { useRouter } from 'expo-router';
import { Check, ListChecks, Pause, Play, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Text, spacing, useBreakpoint, useTheme, withAlpha } from '@/design-system';

import { amountLabel, fillRatio } from '../domain/amount';
import type { HabitWithProgress } from '../domain/types';
import { useHabits } from '../hooks/queries';
import { useHabitActions, type HabitActions } from '../hooks/useHabitActions';
import { useLiveAmount } from './HabitCard';
import { HabitCapsule } from './HabitCapsule';

const WIDTH = 70;
const HEIGHT = 92;

/**
 * Today's habits as capsules: one tap does the habit's main action (check, +1, start the
 * timer, open the checklist); a long press opens the habit. Hidden when none is due.
 * On phones the row scrolls; on wider screens it wraps.
 */
export function TodayHabits() {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const { data: habits = [], todayKey } = useHabits();
  const actions = useHabitActions(todayKey);
  const due = habits.filter((h) => h.scheduledToday || h.doneToday);
  if (due.length === 0) return null;
  const done = due.filter((h) => h.doneToday).length;

  const items = due.map((habit) => <TodayCapsule key={habit.id} habit={habit} actions={actions} />);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="overline" tone="tertiary" style={styles.title}>
          Hábitos · {done} de {due.length}
        </Text>
        <Button
          label="Ver todos"
          variant="ghost"
          onPress={() => router.navigate({ pathname: '/aquarium', params: { tab: 'habits' } })}
        />
      </View>
      {breakpoint === 'compact' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {items}
        </ScrollView>
      ) : (
        <View style={[styles.row, styles.wrap]}>{items}</View>
      )}
    </View>
  );
}

function TodayCapsule({ habit, actions }: { habit: HabitWithProgress; actions: HabitActions }) {
  const { colors } = useTheme();
  const amount = useLiveAmount(habit);
  const running = habit.today.timerStartedAt !== null;
  const ratio = running ? fillRatio(habit, amount, habit.doneToday) : habit.today.ratio;
  const caption = amountLabel({ ...habit, unit: null }, amount);

  let Icon = Check;
  let action: string;
  let onPress: () => void;
  switch (habit.kind) {
    case 'count':
      Icon = Plus;
      action = 'somar 1';
      onPress = () => actions.add(habit, 1);
      break;
    case 'time':
      Icon = running ? Pause : Play;
      action = running ? 'pausar cronômetro' : 'iniciar cronômetro';
      onPress = () => actions.toggleTimer(habit);
      break;
    case 'checklist':
      Icon = ListChecks;
      action = 'abrir passos';
      onPress = () => actions.open(habit);
      break;
    default:
      action = habit.doneToday ? 'desmarcar' : 'marcar como feito';
      onPress = () => actions.toggle(habit, !habit.doneToday);
  }
  const label = [habit.name, amountLabel(habit, amount), habit.doneToday ? 'feito hoje' : null]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => actions.open(habit)}
      accessibilityRole={habit.kind === 'check' ? 'checkbox' : 'button'}
      accessibilityLabel={label}
      accessibilityHint={`Toque para ${action}. Segure para abrir o hábito.`}
      accessibilityState={habit.kind === 'check' ? { checked: habit.doneToday } : undefined}
      aria-checked={habit.kind === 'check' ? habit.doneToday : undefined}
      accessibilityActions={[{ name: 'longpress', label: 'Abrir hábito' }]}
      onAccessibilityAction={() => actions.open(habit)}
      style={({ pressed }) => [styles.item, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
    >
      <View>
        <HabitCapsule
          creature={habit.creature}
          stage={habit.stage}
          ratio={ratio}
          done={habit.doneToday}
          width={WIDTH}
          height={HEIGHT}
          caption={caption}
        />
        <View
          style={[
            styles.action,
            {
              backgroundColor: withAlpha(colors.surfaceBase, 0.8),
              borderColor: withAlpha(colors.textPrimary, 0.18),
            },
          ]}
        >
          <Icon size={13} strokeWidth={2.6} color={colors.textPrimary} />
        </View>
      </View>
      <Text
        variant="caption"
        tone={habit.doneToday ? 'primary' : 'secondary'}
        numberOfLines={1}
        style={styles.name}
      >
        {habit.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginLeft: spacing.xs },
  row: { gap: spacing.md, paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  item: { alignItems: 'center', gap: spacing.xs, width: WIDTH + 6 },
  name: { textAlign: 'center', width: WIDTH + 6 },
  action: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
