import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef } from 'react';
import { Pause, Play, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import {
  RisingBubbles,
  haptics,
  sound,
  abyss,
  specular,
  Text,
  listColors,
  spacing,
  touchTarget,
  useTheme,
  withAlpha,
} from '@/design-system';

import { clockLabel, goalOf } from '../domain/amount';
import { creatures } from '../domain/creatures';
import type { HabitWithProgress } from '../domain/types';
import type { HabitActions } from '../hooks/useHabitActions';
import { useLiveAmount } from './HabitCard';
import { HabitCapsule } from './HabitCapsule';

type HabitDiveProps = {
  habit: HabitWithProgress;
  actions: HabitActions;
  visible: boolean;
  onClose: () => void;
};

const WAKE_TAG = 'habit-dive';

/**
 * Keeps the screen on while mounted. Its own component so it only runs while timing. Errors
 * are ignored: on the web the lock activates asynchronously (or not at all), and closing
 * before it did must not crash the dive.
 */
function KeepAwake() {
  useEffect(() => {
    activateKeepAwakeAsync(WAKE_TAG).catch(() => {});
    return () => {
      Promise.resolve()
        .then(() => deactivateKeepAwake(WAKE_TAG))
        .catch(() => {});
    };
  }, []);
  return null;
}

/**
 * The timer as a dive: a dark full screen where the water rises with the ring. Closing it
 * keeps the timer running; pause adds the time to today. Extra time past the goal still counts.
 */
export function HabitDive({ habit, actions, visible, onClose }: HabitDiveProps) {
  const { scheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const tone = listColors[creatures[habit.creature].color][scheme];
  const amount = useLiveAmount(habit);
  const running = habit.today.timerStartedAt !== null;
  const goal = goalOf(habit);
  const ratio = Math.min(1, amount / goal);
  const reached = amount >= goal;
  // The goal reached while diving: two bells (once, not on opening an already-full day).
  const wasReached = useRef(reached);
  useEffect(() => {
    if (reached && !wasReached.current && running) {
      sound.play('timer');
      haptics.success();
    }
    wasReached.current = reached;
  }, [reached, running]);
  const ring = Math.min(width - spacing.xl * 2, 280);
  const stroke = 8;
  const r = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {visible && running ? <KeepAwake /> : null}
      <View style={styles.root}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="dive" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.deepTop} />
              <Stop offset="0.55" stopColor={colors.deepBottom} />
              <Stop offset="1" stopColor={abyss[950]} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} fill="url(#dive)" />
        </Svg>
        <RisingBubbles height={height} count={10} />

        <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={running ? 'Fechar (o cronômetro continua)' : 'Fechar'}
            hitSlop={8}
            style={[styles.close, { backgroundColor: withAlpha(specular, 0.08) }]}
          >
            <X size={22} color={colors.onDeep} />
          </Pressable>
        </View>

        <View style={styles.center}>
          <Text variant="footnote" tone="onDeepSecondary">
            {habit.name} · meta de {habit.target} min
          </Text>
          <Text variant="title1" tone="onDeep" style={styles.title}>
            {reached ? 'Meta alcançada! 🎉' : running ? 'Mergulhando…' : 'Pronto para mergulhar'}
          </Text>

          <View style={{ width: ring, height: ring }}>
            <Svg width={ring} height={ring} style={StyleSheet.absoluteFill}>
              <Circle
                cx={ring / 2}
                cy={ring / 2}
                r={r}
                stroke={withAlpha(specular, 0.08)}
                strokeWidth={stroke}
                fill="none"
              />
              <Circle
                cx={ring / 2}
                cy={ring / 2}
                r={r}
                stroke={tone}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - ratio)}
                fill="none"
                transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
              />
            </Svg>
            <View style={styles.face}>
              <HabitCapsule
                creature={habit.creature}
                stage={habit.stage}
                ratio={ratio}
                done={reached}
                width={ring - stroke * 2 - 28}
                height={ring - stroke * 2 - 28}
                round
              />
            </View>
          </View>

          <Text
            variant="display"
            tone="onDeep"
            style={styles.clock}
            accessibilityLabel={`${Math.floor(amount / 60)} minutos de ${habit.target}`}
            accessibilityLiveRegion="none"
          >
            {clockLabel(amount)}
          </Text>
          <Text variant="callout" tone="onDeepSecondary">
            {reached
              ? `+${clockLabel(amount - goal)} além da meta`
              : `faltam ${clockLabel(goal - amount)}${running ? ' · tela acesa' : ''}`}
          </Text>
        </View>

        <View style={[styles.buttons, { paddingBottom: insets.bottom + spacing.xl }]}>
          <RoundButton
            label="Parar"
            onPress={() => {
              if (running) actions.toggleTimer(habit);
              onClose();
            }}
          />
          <Pressable
            onPress={() => actions.toggleTimer(habit)}
            accessibilityRole="button"
            accessibilityLabel={running ? 'Pausar' : 'Continuar'}
            style={({ pressed }) => [
              styles.main,
              { backgroundColor: tone, transform: [{ scale: pressed ? 0.94 : 1 }] },
            ]}
          >
            {running ? (
              <Pause size={30} color={colors.onDeepAccent} fill={colors.onDeepAccent} />
            ) : (
              <Play size={30} color={colors.onDeepAccent} fill={colors.onDeepAccent} />
            )}
          </Pressable>
          <RoundButton label="+5 min" onPress={() => actions.add(habit, 5 * 60)} />
        </View>
      </View>
    </Modal>
  );
}

function RoundButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.round,
        {
          backgroundColor: withAlpha(specular, pressed ? 0.16 : 0.08),
          borderColor: withAlpha(specular, 0.16),
        },
      ]}
    >
      <Text variant="caption" style={{ color: colors.onDeep }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  top: { flexDirection: 'row', paddingHorizontal: spacing.lg },
  close: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  title: { textAlign: 'center', marginBottom: spacing.sm },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clock: { fontVariant: ['tabular-nums'], marginTop: spacing.md },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  round: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
});
