import { useRouter } from 'expo-router';
import { Check, ListChecks, Pause, Play, Plus, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button, Text, radius, spacing, usePop, useTheme } from '@/design-system';

import { amountLabel } from '../domain/amount';
import type { HabitWithProgress } from '../domain/types';
import { useHabits } from '../hooks/queries';
import { useHabitActions, type HabitActions } from '../hooks/useHabitActions';
import { CreatureArt } from './CreatureArt';
import { useLiveAmount } from './HabitCard';

const THUMB = 40;
const CONTROL = 34;

/**
 * Today's habits as rows (Fase 6): the creature, the name, where it stands ("5 de 8 copos",
 * "Feito hoje") and the habit's main action on the right (check, +1, start the timer, open the
 * steps). The row itself opens the habit. Hidden when none is due, unless bare.
 */
export function TodayHabits({ bare = false }: { bare?: boolean } = {}) {
  const router = useRouter();
  const { data: habits = [], todayKey } = useHabits();
  const actions = useHabitActions(todayKey);
  const due = habits.filter((h) => h.scheduledToday || h.doneToday);
  if (due.length === 0) {
    return bare ? (
      <View style={styles.root}>
        <Text variant="overline" tone="tertiary" style={styles.title}>
          Hábitos de hoje
        </Text>
        <Text variant="footnote" tone="secondary" style={styles.title}>
          Nenhum hábito para hoje. Toque para ver os seus ou criar um.
        </Text>
      </View>
    ) : null;
  }
  const done = due.filter((h) => h.doneToday).length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="overline" tone="tertiary" style={styles.title}>
          Hábitos de hoje · {done} de {due.length}
        </Text>
        {bare ? null : (
          <Button
            label="Ver todos"
            variant="ghost"
            onPress={() => router.navigate({ pathname: '/aquarium', params: { tab: 'habits' } })}
          />
        )}
      </View>
      <View style={styles.rows}>
        {due.map((habit) => (
          <HabitRow key={habit.id} habit={habit} actions={actions} />
        ))}
      </View>
    </View>
  );
}

function HabitRow({ habit, actions }: { habit: HabitWithProgress; actions: HabitActions }) {
  const { colors } = useTheme();
  const amount = useLiveAmount(habit);
  const running = habit.today.timerStartedAt !== null;
  const day = habit.connected;
  // A little jump when it is done, and on each +1 (Fase 5).
  const pop = usePop(
    habit.kind === 'count' ? habit.today.amount : habit.doneToday,
    habit.kind === 'count' || habit.doneToday,
  );

  const status = day
    ? `${day.label} · ${day.doneCount} de ${day.required}`
    : habit.kind === 'check'
      ? habit.doneToday
        ? 'Feito hoje'
        : 'Para hoje'
      : `${amountLabel(habit, amount)}${habit.doneToday ? ' · feito' : ''}`;

  let Icon: LucideIcon = Check;
  let action: string;
  let onPress: () => void;
  switch (day ? 'connected' : habit.kind) {
    case 'connected':
      // Today's items live in the habit: open it to do them.
      Icon = ListChecks;
      action = 'abrir os itens de hoje';
      onPress = () => actions.open(habit);
      break;
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
      action = 'feito hoje';
      onPress = () => actions.toggle(habit, !habit.doneToday);
  }
  const isCheck = !day && habit.kind === 'check';
  const filled = habit.doneToday || running;

  return (
    <View style={[styles.row, { backgroundColor: colors.surfaceBase }]}>
      {/* The row opens the habit; the round button beside it acts (no button inside another). */}
      <Pressable
        onPress={() => actions.open(habit)}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${status}`}
        accessibilityHint="Abre o hábito"
        style={({ pressed }) => [styles.open, pressed && styles.pressed]}
      >
        <View style={[styles.thumb, { backgroundColor: colors.surfacePressed }]}>
          <CreatureArt creature={habit.creature} stage={habit.stage} size={THUMB - 4} />
        </View>
        <View style={styles.text}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {habit.name}
          </Text>
          <Text variant="footnote" tone="secondary" numberOfLines={1}>
            {status}
          </Text>
        </View>
      </Pressable>
      <Animated.View style={pop}>
        <Pressable
          onPress={onPress}
          accessibilityRole={isCheck ? 'checkbox' : 'button'}
          accessibilityLabel={`${habit.name}: ${action}`}
          accessibilityState={isCheck ? { checked: habit.doneToday } : undefined}
          aria-checked={isCheck ? habit.doneToday : undefined}
          hitSlop={6}
          style={({ pressed }) => [
            styles.control,
            filled
              ? { backgroundColor: colors.accent, borderColor: colors.accent }
              : {
                  backgroundColor: isCheck ? 'transparent' : colors.accentSoft,
                  borderColor: isCheck ? colors.textTertiary : 'transparent',
                },
            pressed && styles.pressed,
          ]}
        >
          {isCheck && !habit.doneToday ? null : (
            <Icon size={17} strokeWidth={2.6} color={filled ? colors.onAccent : colors.accent} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginLeft: spacing.xs },
  rows: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg - 4,
    paddingRight: spacing.md,
  },
  open: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
  },
  pressed: { opacity: 0.75 },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  control: {
    width: CONTROL,
    height: CONTROL,
    borderRadius: CONTROL / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
