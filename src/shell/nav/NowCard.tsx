import { useRouter } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import { Glyph, Text, listColors, radius, spacing, useTheme, withAlpha } from '@/design-system';
import { amountLabel } from '@/features/habits/domain/amount';
import { CreatureBubble } from '@/features/habits/components/CreatureBubble';
import type { HabitWithProgress } from '@/features/habits/domain/types';
import { useHabits } from '@/features/habits/hooks/queries';
import { useHabitActions } from '@/features/habits/hooks/useHabitActions';
import { eventEntry, withPhase } from '@/features/routines/domain/agenda';
import { durationLabel, routinesOn } from '@/features/routines/domain/schedule';
import type { RoutineToday } from '@/features/routines/domain/types';
import { useAgendaEvents, useRoutinesToday } from '@/features/routines/hooks/queries';

import { habitOfTheMoment, nextOnAgenda } from './now';

/**
 * "Agora" in the sidebar: what is on (or next) on today's agenda, and the habit of the moment
 * with a quick tap (+1, or done). Hidden when there is nothing for today.
 */
export function NowCard() {
  const { data: routines = [], todayKey, nowMinutes } = useRoutinesToday();
  const { data: events = [] } = useAgendaEvents();
  const { data: habits = [] } = useHabits();
  const entries = [
    ...routines,
    ...routinesOn(
      events.map((e) => withPhase(eventEntry(e), todayKey, nowMinutes)),
      todayKey,
    ),
  ];
  const { colors } = useTheme();
  const next = nextOnAgenda(entries);
  const habit = habitOfTheMoment(habits, todayKey, nowMinutes);
  if (!next && !habit) return null;

  return (
    <View
      style={[styles.card, { backgroundColor: withAlpha(colors.deepAccent, 0.1) }]}
      accessibilityRole="summary"
    >
      <Text variant="overline" tone="onDeepSecondary">
        Agora
      </Text>
      {next ? <AgendaLine entry={next} /> : null}
      {habit ? <HabitLine habit={habit} todayKey={todayKey} /> : null}
    </View>
  );
}

function AgendaLine({ entry }: { entry: RoutineToday }) {
  const router = useRouter();
  const { scheme } = useTheme();
  const { showTime } = useCalendarPrefs();
  const tone = listColors[entry.color][scheme];
  const when =
    entry.phase === 'now'
      ? `Agora · faltam ${durationLabel(entry.minutesLeft)}`
      : `${showTime(entry.start)} · em ${durationLabel(entry.minutesLeft)}`;
  return (
    <Pressable
      onPress={() =>
        router.navigate({
          pathname: '/aquarium',
          params:
            entry.source === 'event' && entry.refId
              ? { tab: 'routines', event: entry.refId }
              : { tab: 'routines' },
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`${entry.name}, ${when}`}
      style={({ pressed }) => [styles.line, pressed && styles.pressed]}
    >
      <View style={[styles.badge, { backgroundColor: withAlpha(tone, 0.25) }]}>
        <Glyph name={entry.emoji} fallback="calendar" size={16} color={tone} />
      </View>
      <View style={styles.texts}>
        <Text variant="footnote" tone="onDeep" numberOfLines={1} style={styles.bold}>
          {entry.name}
        </Text>
        <Text variant="caption" tone="onDeepSecondary" numberOfLines={1}>
          {when}
        </Text>
      </View>
    </Pressable>
  );
}

function HabitLine({ habit, todayKey }: { habit: HabitWithProgress; todayKey: string }) {
  const actions = useHabitActions(todayKey);
  const { colors } = useTheme();
  const progress = habit.connected
    ? `${habit.connected.doneCount} de ${habit.connected.required}`
    : (amountLabel(habit, habit.today.amount) ?? 'Para hoje');
  // One tap: +1 on a counter, done on a yes/no habit; the others open.
  const quick =
    habit.connected || habit.kind === 'time' || habit.kind === 'checklist'
      ? null
      : habit.kind === 'count'
        ? { label: `Somar 1 em ${habit.name}`, icon: Plus, run: () => actions.add(habit, 1) }
        : {
            label: `${habit.name}: feito hoje`,
            icon: Check,
            run: () => actions.toggle(habit, true),
          };
  return (
    <View style={styles.line}>
      <Pressable
        onPress={() => actions.open(habit)}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, ${progress}`}
        style={({ pressed }) => [styles.lineMain, pressed && styles.pressed]}
      >
        <CreatureBubble creature={habit.creature} size={30} stage={habit.stage} />
        <View style={styles.texts}>
          <Text variant="footnote" tone="onDeep" numberOfLines={1} style={styles.bold}>
            {habit.name}
          </Text>
          <Text variant="caption" tone="onDeepSecondary" numberOfLines={1}>
            {progress}
          </Text>
        </View>
      </Pressable>
      {quick ? (
        <Pressable
          onPress={quick.run}
          accessibilityRole="button"
          accessibilityLabel={quick.label}
          hitSlop={6}
          style={({ pressed }) => [
            styles.quick,
            { backgroundColor: pressed ? colors.deepAccent : colors.deepAccentSoft },
          ]}
        >
          <quick.icon size={16} strokeWidth={2.4} color={colors.onDeep} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lineMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.7 },
  badge: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  bold: { fontWeight: '700' },
  quick: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
