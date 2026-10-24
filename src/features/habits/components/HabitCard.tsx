import { Check, ChevronDown, ChevronUp, Pause, Play } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import {
  Checkbox,
  Text,
  listColors,
  radius,
  specular,
  spacing,
  touchTarget,
  useTheme,
  withAlpha,
} from '@/design-system';

import { amountLabel, clockLabel, fillRatio } from '../domain/amount';
import { creatures } from '../domain/creatures';
import { weekdayInitial } from '../domain/progress';
import { stageInfo } from '../domain/stages';
import type { DayState, HabitWithProgress } from '../domain/types';
import type { HabitActions } from '../hooks/useHabitActions';
import { useElapsed } from '../hooks/useElapsed';
import { HabitCapsule } from './HabitCapsule';

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
 * A habit as a glass card: its capsule, the week's tide and the control for its kind.
 * The control acts on today; the rest of the card opens the habit. A checklist opens its
 * steps right inside the card.
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
  const badge = amountLabel(habit, amount);

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(22)}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: withAlpha(tone, habit.doneToday ? 0.55 : 0.22),
        },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(tone, habit.doneToday ? 0.14 : 0.06) },
        ]}
      />
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
          <HabitCapsule
            creature={habit.creature}
            stage={habit.stage}
            ratio={ratio}
            done={habit.doneToday}
            resting={resting}
            width={60}
            height={80}
          />
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text variant="headline" numberOfLines={1} style={styles.shrink}>
                {habit.name}
              </Text>
              {badge ? <Badge label={badge} tone={tone} /> : null}
            </View>
            <Text variant="footnote" tone="secondary" numberOfLines={1}>
              {statusLabel(habit, amount)}
              {habit.streak > 1 ? ` · 🌊 ${habit.streak}` : ''} · {stageInfo[habit.stage].emoji}
            </Text>
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

      {habit.kind === 'checklist' && expanded ? (
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

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: withAlpha(tone, 0.16) }]}>
      <Text variant="caption" style={styles.badgeText} numberOfLines={1}>
        {label}
      </Text>
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
  const iconColor = filled ? colors.surfaceRaised : colors.textPrimary;

  let content: React.ReactNode;
  let label: string;
  let onPress: () => void;
  let checked: boolean | undefined;
  switch (habit.kind) {
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
    <Pressable
      onPress={onPress}
      accessibilityRole={checked === undefined ? 'button' : 'checkbox'}
      accessibilityLabel={label}
      accessibilityState={checked === undefined ? undefined : { checked }}
      aria-checked={checked}
      hitSlop={6}
      style={({ pressed }) => [
        styles.control,
        {
          width: size,
          height: size,
          borderRadius: size * 0.34,
          backgroundColor: filled ? tone : withAlpha(tone, 0.2),
          borderColor: withAlpha(tone, filled ? 1 : 0.55),
          shadowColor: tone,
          transform: [{ scale: pressed ? 0.92 : 1 }, { translateY: pressed ? 1 : 0 }],
        },
      ]}
    >
      {/* The top edge catches the light: the button looks raised. */}
      <View
        style={[
          styles.controlShine,
          { backgroundColor: withAlpha(specular, filled ? 0.35 : 0.12) },
        ]}
      />
      {content}
    </Pressable>
  );
}

/**
 * The week as seven small capsules, Sunday first: how full each day was, not only yes or no.
 * Today is ringed, resting days are hatched and future days are faint.
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
                  borderColor: today ? tone : state === 'rest' ? colors.border : 'transparent',
                  borderStyle: state === 'rest' ? 'dashed' : 'solid',
                  opacity: state === 'future' ? 0.4 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.dayFill,
                  { height: `${Math.round(ratio * 100)}%`, backgroundColor: tone },
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
  card: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: 2, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  shrink: { flexShrink: 1 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  control: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  controlShine: { position: 'absolute', top: 0, left: 6, right: 6, height: 1.5, borderRadius: 1 },
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
