import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import {
  DeepSurface,
  RisingBubbles,
  Text,
  listColors,
  spacing,
  springs,
  useTheme,
  withAlpha,
} from '@/design-system';

import type { HabitWithProgress } from '../domain/types';
import { CreatureBubble } from './CreatureBubble';

const HEIGHT = 216;
const BUBBLE = 48;
/** Where creatures swim: near the surface when done today, down by the sand when not. */
const SWIM_HIGH = 74;
const SWIM_LOW = HEIGHT - BUBBLE - 26;

type ReefHeroProps = { habits: HabitWithProgress[] };

/**
 * Your reef: every habit's creature in one deep-water scene. Checking a habit makes its
 * creature swim up toward the light. The scene is decorative; the text says the same thing.
 */
export function ReefHero({ habits }: ReefHeroProps) {
  const { scheme } = useTheme();
  const [width, setWidth] = useState(0);
  const due = habits.filter((h) => h.scheduledToday || h.doneToday);
  const done = due.filter((h) => h.doneToday).length;
  const sand = listColors.sand[scheme];

  const summary =
    due.length === 0
      ? 'Dia de descanso para todo o recife.'
      : done === due.length
        ? 'Todo mundo nadando na superfície!'
        : `${done} de ${due.length} hábitos feitos hoje`;

  return (
    <DeepSurface
      radius="xl"
      style={styles.card}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`Seu recife: ${summary}`}
    >
      {width > 0 ? (
        <>
          <RisingBubbles height={HEIGHT} count={9} />
          <Svg width={width} height={40} style={styles.sand} pointerEvents="none">
            <Path
              d={`M0 18 C ${width * 0.2} 6, ${width * 0.35} 26, ${width * 0.55} 16 S ${width * 0.85} 8, ${width} 20 V 40 H 0 Z`}
              fill={withAlpha(sand, 0.28)}
            />
          </Svg>
          {habits.slice(0, 8).map((habit, index, shown) => (
            <Swimmer
              key={habit.id}
              habit={habit}
              x={((index + 0.5) / shown.length) * width - BUBBLE / 2}
              phase={index}
              labelWidth={Math.min(140, Math.max(BUBBLE + 36, width / shown.length - 8))}
            />
          ))}
        </>
      ) : null}
      <View pointerEvents="none">
        <Text variant="overline" tone="onDeepSecondary">
          Seu recife
        </Text>
        <Text variant="headline" tone="onDeep">
          {summary}
        </Text>
      </View>
      {habits.length > 8 ? (
        <Text variant="caption" tone="onDeepSecondary" style={styles.more}>
          +{habits.length - 8}
        </Text>
      ) : null}
    </DeepSurface>
  );
}

function Swimmer({
  habit,
  x,
  phase,
  labelWidth,
}: {
  habit: HabitWithProgress;
  x: number;
  phase: number;
  /** Room for the name: wider reefs show more of it. */
  labelWidth: number;
}) {
  const { reduceMotion } = useTheme();
  const depth = useSharedValue(habit.doneToday ? SWIM_HIGH : SWIM_LOW);
  const bob = useSharedValue(0);

  useEffect(() => {
    depth.set(withSpring(habit.doneToday ? SWIM_HIGH : SWIM_LOW, springs.gentle));
  }, [depth, habit.doneToday]);

  useEffect(() => {
    if (reduceMotion) return;
    // Each creature bobs at its own pace so the reef never moves in lockstep.
    bob.set(
      withRepeat(
        withTiming(1, { duration: 2400 + (phase % 4) * 450, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(bob);
  }, [bob, phase, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: depth.get() + (bob.get() - 0.5) * 8 }],
  }));

  return (
    <Animated.View style={[styles.swimmer, { left: x }, style]} pointerEvents="none">
      <CreatureBubble
        creature={habit.creature}
        size={BUBBLE}
        done={habit.doneToday}
        resting={!habit.scheduledToday && !habit.doneToday}
      />
      <Text
        variant="caption"
        tone="onDeepSecondary"
        numberOfLines={1}
        style={[styles.name, { width: labelWidth }]}
      >
        {habit.name}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { height: HEIGHT, padding: spacing.lg, overflow: 'hidden' },
  sand: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  swimmer: { position: 'absolute', top: 0, width: BUBBLE, alignItems: 'center' },
  name: { textAlign: 'center', marginTop: 2 },
  more: { position: 'absolute', right: spacing.lg, bottom: spacing.md },
});
