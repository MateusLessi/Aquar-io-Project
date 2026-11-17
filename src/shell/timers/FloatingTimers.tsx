import { useGlobalSearchParams, useRouter } from 'expo-router';
import { Check, Pause, Timer } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { toDateKey } from '@/core/dates';
import {
  GlassSurface,
  Text,
  chrome,
  haptics,
  listColors,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
} from '@/design-system';
import { CreatureBubble } from '@/features/habits/components/CreatureBubble';
import { creatures } from '@/features/habits/domain/creatures';
import { useHabits } from '@/features/habits/hooks/queries';
import { useHabitsRepository } from '@/features/habits/hooks/habitsContext';
import { useFolderTasks } from '@/features/todo/hooks/queries';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { clock, elapsedOf, runningTimers, type RunningTimer } from './running';

/** How much room the phone's pill takes above the tab bar. */
export const PILL_SPACE = 64 + spacing.sm;

/** Every timer running in the app right now. Live. */
export function useRunningTimers(): RunningTimer[] {
  const { data: habits } = useHabits();
  const { data: tasks } = useFolderTasks(null);
  return useMemo(() => runningTimers(habits ?? [], tasks ?? []), [habits, tasks]);
}

/** The current time, ticking every second while something runs. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

/**
 * Running timers float over the app (Fase 3b): on a phone, a pill above the tab bar; on wider
 * screens, a card in the bottom corner with all of them. Pause and finish right there; a tap
 * opens the habit's dive or the item's list. Hidden inside the dive itself.
 */
export function FloatingTimers({ timers }: { timers: RunningTimer[] }) {
  const compact = useBreakpoint() === 'compact';
  const insets = useSafeAreaInsets();
  const { dive } = useGlobalSearchParams<{ dive?: string }>();
  const [open, setOpen] = useState(false);
  const now = useNow(timers.length > 0);
  if (timers.length === 0 || dive === '1') return null;

  if (!compact) {
    return (
      <Animated.View
        entering={FadeInDown.springify().damping(18)}
        exiting={FadeOutDown}
        style={[styles.corner, { bottom: insets.bottom + spacing.lg }]}
      >
        <GlassSurface radius="xl" depth={2} style={styles.card}>
          <Text variant="overline" tone="tertiary" style={styles.cardTitle}>
            Correndo
          </Text>
          {timers.map((timer) => (
            <TimerRow key={`${timer.kind}:${timer.id}`} timer={timer} now={now} />
          ))}
        </GlassSurface>
      </Animated.View>
    );
  }

  const [first, ...more] = timers;
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown}
      style={[
        styles.pillWrap,
        { bottom: insets.bottom + chrome.tabBarOffset + chrome.tabBarHeight + spacing.sm },
      ]}
    >
      {open && more.length > 0 ? (
        <GlassSurface radius="xl" depth={2} style={styles.more}>
          {more.map((timer) => (
            <TimerRow key={`${timer.kind}:${timer.id}`} timer={timer} now={now} />
          ))}
        </GlassSurface>
      ) : null}
      <GlassSurface radius="pill" depth={2} style={styles.pill}>
        <TimerRow
          timer={first!}
          now={now}
          extra={
            more.length > 0 ? { count: more.length, open, toggle: () => setOpen(!open) } : undefined
          }
        />
      </GlassSurface>
    </Animated.View>
  );
}

function TimerRow({
  timer,
  now,
  extra,
}: {
  timer: RunningTimer;
  now: number;
  /** "+1": more timers behind this one. */
  extra?: { count: number; open: boolean; toggle: () => void };
}) {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const habits = useHabitsRepository();
  const todo = useTodo();
  const seconds = elapsedOf(timer, now);
  const ratio = timer.goal > 0 ? Math.min(1, seconds / timer.goal) : 0;
  const tone =
    timer.kind === 'habit'
      ? listColors[creatures[timer.creature].color][scheme]
      : listColors[timer.color ?? 'lagoon'][scheme];
  const line =
    timer.kind === 'habit'
      ? `de ${clock(timer.goal)}`
      : `de ${clock(timer.goal)} · ${timer.listName}`;
  const report = (error: unknown) => console.warn('Could not change the timer.', error);

  const openIt = () =>
    timer.kind === 'habit'
      ? router.push({ pathname: '/aquarium/habits/[id]', params: { id: timer.id, dive: '1' } })
      : router.push({ pathname: '/aquarium/lists/[id]', params: { id: timer.listId } });
  const pause = () => {
    haptics.selection();
    (timer.kind === 'habit' ? habits.stopTimer(timer.id) : todo.stopTimer(timer.id)).catch(report);
  };
  const finish = () => {
    haptics.success();
    const done =
      timer.kind === 'habit'
        ? habits
            .stopTimer(timer.id)
            .then(() => habits.setChecked(timer.id, toDateKey(new Date()), true))
        : todo.stopTimer(timer.id).then(() => todo.setCompleted(timer.id, true));
    done.catch(report);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={extra ? extra.toggle : openIt}
        accessibilityRole="button"
        accessibilityLabel={`${timer.name}, ${clock(seconds)} ${line}${
          extra ? `, e mais ${extra.count} correndo` : ''
        }`}
        accessibilityHint={extra ? 'Mostra os outros cronômetros' : 'Abre'}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <View style={styles.ring}>
          <Svg width={44} height={44} style={StyleSheet.absoluteFill}>
            <Circle
              cx={22}
              cy={22}
              r={19}
              stroke={withAlpha(tone, 0.2)}
              strokeWidth={4}
              fill="none"
            />
            <Circle
              cx={22}
              cy={22}
              r={19}
              stroke={tone}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 19 * ratio} ${2 * Math.PI * 19}`}
              transform="rotate(-90 22 22)"
            />
          </Svg>
          {timer.kind === 'habit' ? (
            <CreatureBubble creature={timer.creature} size={30} done />
          ) : (
            <Timer size={18} color={tone} />
          )}
        </View>
        <View style={styles.texts}>
          <Text variant="headline" numberOfLines={1}>
            {timer.name} · {clock(seconds)}
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {extra ? `${line} · +${extra.count} correndo` : line}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={pause}
        accessibilityRole="button"
        accessibilityLabel={`Pausar ${timer.name}`}
        hitSlop={4}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed ? colors.surfacePressed : withAlpha(colors.textPrimary, 0.08),
          },
        ]}
      >
        <Pause size={18} color={colors.textPrimary} />
      </Pressable>
      <Pressable
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel={`Concluir ${timer.name}`}
        hitSlop={4}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Check size={18} strokeWidth={2.6} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pillWrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, gap: spacing.sm },
  pill: { paddingVertical: spacing.xs + 2, paddingLeft: spacing.xs + 2, paddingRight: spacing.sm },
  more: { padding: spacing.sm, gap: spacing.sm },
  corner: { position: 'absolute', right: spacing.lg, width: 320 },
  card: { padding: spacing.sm, gap: spacing.sm },
  cardTitle: { marginLeft: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.75 },
  ring: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
