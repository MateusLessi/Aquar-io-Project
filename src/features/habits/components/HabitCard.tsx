import { Check, ChevronDown, ChevronUp, Pause, Play } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import {
  Checkbox,
  Tag,
  Text,
  listColors,
  radius,
  spacing,
  touchTarget,
  useTheme,
  withAlpha,
  usePop,
} from '@/design-system';

import { amountLabel, clockLabel, fillRatio } from '../domain/amount';
import { creatures } from '../domain/creatures';
import { weekdayInitial } from '../domain/progress';
import { stageInfo } from '../domain/stages';
import type { DayState, HabitWithProgress } from '../domain/types';
import { useHabitSources } from '../hooks/habitSources';
import type { HabitActions } from '../hooks/useHabitActions';
import { useElapsed } from '../hooks/useElapsed';
import { CreatureArt } from './CreatureArt';

type HabitCardProps = {
  habit: HabitWithProgress;
  actions: HabitActions;
};

export function streakLabel({ streak, doneToday, scheduledToday }: HabitWithProgress): string {
  if (streak === 0) return scheduledToday ? 'Comece hoje' : 'Dia de descanso';
  if (streak === 1) return doneToday ? 'Primeiro dia!' : '1 dia';
  return `${streak} dias seguidos`;
}

/** Today's amount, counting a running timer live. */
export function useLiveAmount(habit: HabitWithProgress): number {
  return habit.today.amount + useElapsed(habit.today.timerStartedAt);
}

/** "Faltam 5", "Rodando · 12:04", "Feito"…: the line under the name. */
function statusLabel(habit: HabitWithProgress, amount: number): string {
  const day = habit.connected;
  if (day) {
    if (day.done) return `${day.label} · feito`;
    if (day.required === 0) return `${day.label} · descanso hoje`;
    return `${day.label} · ${day.doneCount} de ${day.required}`;
  }
  if (habit.doneToday) return 'Feito';
  if (!habit.scheduledToday) return 'Descansando hoje';
  if (habit.today.timerStartedAt) return `Rodando · ${clockLabel(amount)}`;
  switch (habit.kind) {
    case 'count': {
      const left = habit.target - amount;
      return `Faltam ${left}${habit.unit ? ` ${habit.unit}` : ''}`;
    }
    case 'time':
      return amount > 0 ? 'Pausado' : `Meta de ${habit.target} min`;
    case 'checklist':
      return `${habit.steps.length - habit.today.stepsDone.length} passos para hoje`;
    default:
      return 'Para hoje';
  }
}

/**
 * A habit as a card (Fase 6): its creature seen from above, the stage, today's progress as a
 * bar, the week and the control for its kind. The control acts on today; the rest of the card
 * opens the habit. A checklist opens its steps right inside the card.
 */
export function HabitCard({ habit, actions }: HabitCardProps) {
  const { colors, scheme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const tone = listColors[creatures[habit.creature].color][scheme];
  const resting = !habit.scheduledToday && !habit.doneToday;
  const amount = useLiveAmount(habit);
  const ratio = habit.today.timerStartedAt
    ? fillRatio(habit, amount, habit.doneToday)
    : habit.today.ratio;
  const sources = useHabitSources();
  const day = habit.connected;
  // A connected habit says it in the line below ("Push · 1 de 2"): no amount too.
  const badge = day ? null : amountLabel(habit, amount);

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(22)}
      style={[styles.card, { backgroundColor: colors.surfaceRaised }]}
    >
      <View style={styles.row}>
        <Pressable
          onPress={() => actions.open(habit)}
          accessibilityRole="button"
          accessibilityLabel={[
            habit.name,
            badge,
            statusLabel(habit, amount),
            streakLabel(habit),
            stageInfo[habit.stage].label,
          ]
            .filter(Boolean)
            .join(', ')}
          accessibilityHint="Abre o hábito"
          style={({ pressed }) => [styles.main, { opacity: pressed ? 0.85 : 1 }]}
        >
          <CreatureTile habit={habit} resting={resting} />
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text variant="headline" numberOfLines={1} style={styles.name}>
                {habit.name}
              </Text>
              <Tag label={stageInfo[habit.stage].label} />
            </View>
            <Text variant="footnote" tone="secondary" numberOfLines={1}>
              {[badge, statusLabel(habit, amount)].filter(Boolean).join(' · ')}
              {habit.streak > 1 ? ` · ${habit.streak} dias seguidos` : ''}
            </Text>
            <ProgressBar ratio={habit.doneToday ? 1 : ratio} />
            <WeekTide week={habit.week} ratios={habit.weekRatios} tone={tone} />
          </View>
        </Pressable>
        <HabitControl
          habit={habit}
          tone={tone}
          actions={actions}
          expanded={expanded}
          onExpand={() => setExpanded((v) => !v)}
        />
      </View>

      {day && expanded && sources ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.steps}>
          <sources.DayView habitId={habit.id} />
        </Animated.View>
      ) : null}

      {!day && habit.kind === 'checklist' && expanded ? (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.steps}>
          {habit.steps.map((step) => {
            const done = habit.today.stepsDone.includes(step.id);
            return (
              <View key={step.id} style={[styles.step, { borderTopColor: colors.separator }]}>
                <Checkbox
                  checked={done}
                  label={step.title}
                  onChange={(checked) => actions.setStep(habit, step.id, checked)}
                />
                <Text variant="body" struck={done} style={styles.shrink}>
                  {step.title}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/** The creature seen from above, on a small square of deep water. Faint while it rests. */
export function CreatureTile({
  habit,
  resting = false,
  size = 64,
}: {
  habit: HabitWithProgress;
  resting?: boolean;
  size?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: colors.selected, opacity: resting ? 0.5 : 1 },
      ]}
    >
      <CreatureArt creature={habit.creature} stage={habit.stage} size={size - 6} />
    </View>
  );
}

/** Today's progress, turquoise to sand (Fase 6). */
function ProgressBar({ ratio }: { ratio: number }) {
  const { colors } = useTheme();
  const width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%` as const;
  return (
    <View style={[styles.bar, { backgroundColor: colors.surfacePressed }]}>
      <View
        style={[
          styles.barFill,
          { width, backgroundColor: ratio >= 1 ? colors.deepAccent : colors.accent },
        ]}
      />
    </View>
  );
}

/** The elevated button for a habit's kind: ✓, +1, ▶/❚❚ or the checklist chevron. */
export function HabitControl({
  habit,
  tone,
  actions,
  expanded,
  onExpand,
  size = touchTarget + 4,
}: {
  habit: HabitWithProgress;
  tone: string;
  actions: HabitActions;
  expanded?: boolean;
  onExpand?: () => void;
  size?: number;
}) {
  const { colors } = useTheme();
  const running = habit.today.timerStartedAt !== null;
  const filled = habit.kind === 'check' ? habit.doneToday : running;
  const iconColor = filled ? colors.onAccent : colors.accent;
  // A jump when it is done today, and on each +1 of a counter (Fase 5).
  const pop = usePop(
    habit.kind === 'count' ? habit.today.amount : habit.doneToday,
    habit.kind === 'count' || habit.doneToday,
  );

  let content: React.ReactNode;
  let label: string;
  let onPress: () => void;
  let checked: boolean | undefined;
  // Done from a list, folder or routine: the card opens today's items.
  const kind = habit.connected ? 'connected' : habit.kind;
  switch (kind) {
    case 'connected':
      content = expanded ? (
        <ChevronUp size={24} color={iconColor} />
      ) : (
        <ChevronDown size={24} color={iconColor} />
      );
      label = expanded
        ? `${habit.name}: esconder itens de hoje`
        : `${habit.name}: mostrar itens de hoje`;
      onPress = () => (onExpand ? onExpand() : actions.open(habit));
      break;
    case 'count':
      content = (
        <Text variant="headline" style={{ color: iconColor }}>
          +1
        </Text>
      );
      label = `${habit.name}: somar 1`;
      onPress = () => actions.add(habit, 1);
      break;
    case 'time':
      content = running ? (
        <Pause size={22} color={iconColor} fill={iconColor} />
      ) : (
        <Play size={22} color={iconColor} fill={iconColor} />
      );
      label = running ? `${habit.name}: pausar cronômetro` : `${habit.name}: iniciar cronômetro`;
      onPress = () => actions.toggleTimer(habit);
      break;
    case 'checklist':
      content = expanded ? (
        <ChevronUp size={24} color={iconColor} />
      ) : (
        <ChevronDown size={24} color={iconColor} />
      );
      label = expanded ? `${habit.name}: esconder passos` : `${habit.name}: mostrar passos`;
      onPress = () => (onExpand ? onExpand() : actions.open(habit));
      break;
    default:
      content = <Check size={24} strokeWidth={3} color={iconColor} />;
      label = `${habit.name}: feito hoje`;
      checked = habit.doneToday;
      onPress = () => actions.toggle(habit, !habit.doneToday);
  }

  return (
    <Animated.View style={pop}>
      <Pressable
        onPress={onPress}
        accessibilityRole={checked === undefined ? 'button' : 'checkbox'}
        accessibilityLabel={label}
        accessibilityState={checked === undefined ? undefined : { checked }}
        aria-checked={checked}
        hitSlop={6}
        style={({ pressed }) => [
          styles.control,
          // Fase 6: round, turquoise; a check waits as an empty ring.
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: filled
              ? colors.accent
              : checked === false
                ? 'transparent'
                : colors.accentSoft,
            borderColor: filled
              ? colors.accent
              : checked === false
                ? colors.textTertiary
                : 'transparent',
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
        ]}
      >
        {checked === false ? null : content}
      </Pressable>
    </Animated.View>
  );
}

/**
 * The week as seven small capsules, Sunday first: how full each day was, not only yes or no.
 * Today is ringed in sand, resting days are hatched and future days are faint.
 */
export function WeekTide({
  week,
  ratios,
  tone,
}: {
  week: DayState[];
  ratios: number[];
  tone: string;
}) {
  const { colors } = useTheme();
  // Future days come last, so today is the last one that is not in the future.
  const todayIndex = week.filter((s) => s !== 'future').length - 1;
  return (
    <View style={styles.week} accessible={false}>
      {week.map((state, i) => {
        const ratio = ratios[i] ?? 0;
        const today = i === todayIndex;
        return (
          <View key={i} style={styles.day}>
            <View
              style={[
                styles.dayCapsule,
                {
                  backgroundColor:
                    state === 'rest' ? 'transparent' : withAlpha(colors.textPrimary, 0.07),
                  borderColor: today
                    ? colors.deepAccent
                    : state === 'rest'
                      ? colors.border
                      : 'transparent',
                  borderStyle: state === 'rest' ? 'dashed' : 'solid',
                  opacity: state === 'future' ? 0.4 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.dayFill,
                  { height: `${Math.round(ratio * 100)}%`, backgroundColor: colors.accent },
                ]}
              />
            </View>
            <Text variant="caption" tone="tertiary" style={styles.dayLetter}>
              {weekdayInitial[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: 2, minWidth: 0 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  name: { flexShrink: 1, minWidth: 72 },
  shrink: { flexShrink: 1 },
  tile: { borderRadius: radius.lg - 4, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: spacing.sm },
  barFill: { height: '100%', borderRadius: 3 },
  control: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  week: { flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  day: { alignItems: 'center', gap: 2 },
  dayCapsule: {
    width: 14,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  dayFill: { width: '100%' },
  dayLetter: { fontSize: 10, lineHeight: 12 },
  steps: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
