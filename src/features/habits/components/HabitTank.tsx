import { useEffect, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AquariumTank, springs, useTheme, type TankScene } from '@/design-system';

import type { HabitWithProgress } from '../domain/types';
import type { Stage } from '../domain/stages';
import { CreatureArt } from './CreatureArt';

/** Width of a creature at each stage, for a tank 300 points tall. */
const SIZES: Record<Stage, number> = { egg: 44, baby: 54, young: 66, adult: 80 };
const MAX_SWIMMERS = 10;

type HabitTankProps = {
  habits: HabitWithProgress[];
  height: number;
  /** The day's tide, 0–1: how full the tank is. */
  level: number;
  ruler?: boolean;
  /** Sand height: taller when chips sit on it (see AquariumTank). */
  floor?: number;
  overlay?: ReactNode;
  accessibilityLabel: string;
  progress?: { now: number; max: number };
};

/**
 * Your aquarium: one creature per habit, bigger as it grows. They rest near the sand while a
 * habit waits and swim up toward the light as it fills up. Eggs lie on the sand.
 */
export function HabitTank({
  habits,
  height,
  level,
  ruler,
  floor,
  overlay,
  accessibilityLabel,
  progress,
}: HabitTankProps) {
  const { mode } = useTheme();
  const shown = habits.slice(0, MAX_SWIMMERS);
  return (
    <AquariumTank
      height={height}
      level={level}
      ruler={ruler}
      floor={floor}
      transparent={mode === 'crystal'}
      overlay={overlay}
      accessibilityLabel={accessibilityLabel}
      progress={progress}
    >
      {(scene) =>
        shown.map((habit, index) => (
          <Swimmer key={habit.id} habit={habit} index={index} count={shown.length} scene={scene} />
        ))
      }
    </AquariumTank>
  );
}

const seeded = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function Swimmer({
  habit,
  index,
  count,
  scene,
}: {
  habit: HabitWithProgress;
  index: number;
  count: number;
  scene: TankScene;
}) {
  const { reduceMotion } = useTheme();
  const scale = Math.min(1.25, Math.max(0.7, scene.height / 300));
  const size = SIZES[habit.stage] * scale;
  const egg = habit.stage === 'egg';
  const resting = !habit.scheduledToday && !habit.doneToday;

  // Each creature keeps its own lane, so they never all line up.
  const home = ((index + 0.5) / count) * scene.width;
  const range = Math.min(scene.width * 0.28, 90);
  const floor = scene.sand - 4 - size * 0.6;
  const surface = scene.waterline + 24 + size * 0.2;
  const ratio = habit.doneToday ? 1 : habit.today.ratio;
  const lane = seeded(index, 7) * 0.18;
  const targetY = egg
    ? scene.sand + 2 - size * 0.55
    : floor - (floor - surface) * Math.min(1, ratio + lane);

  const y = useSharedValue(targetY);
  const t = useSharedValue(seeded(index, 3) * Math.PI * 2);
  const bob = useSharedValue(0);

  useEffect(() => {
    y.set(withSpring(targetY, springs.gentle));
  }, [y, targetY]);

  useEffect(() => {
    if (reduceMotion || egg) return;
    const start = t.get();
    // Slow laps: a full one takes 16–26 seconds.
    t.set(
      withRepeat(
        withTiming(start + Math.PI * 2, {
          duration: 16000 + seeded(index, 5) * 10000,
          easing: Easing.linear,
        }),
        -1,
      ),
    );
    bob.set(
      withRepeat(
        withTiming(1, {
          duration: 2200 + seeded(index, 6) * 1400,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
    return () => {
      cancelAnimation(t);
      cancelAnimation(bob);
    };
  }, [t, bob, index, reduceMotion, egg]);

  const style = useAnimatedStyle(() => {
    const phase = t.get();
    const x = egg ? 0 : Math.sin(phase) * range;
    // Facing the way it swims: the derivative of sin is cos.
    const facing = egg || Math.cos(phase) >= 0 ? 1 : -1;
    return {
      transform: [
        { translateX: home - size / 2 + x },
        { translateY: y.get() - size * 0.375 + (bob.get() - 0.5) * (egg ? 0 : 6) },
        { scaleX: facing },
      ],
    };
  });

  return (
    <Animated.View style={[styles.swimmer, { opacity: resting ? 0.55 : 1 }, style]}>
      <CreatureArt creature={habit.creature} stage={habit.stage} size={size} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  swimmer: { position: 'absolute', left: 0, top: 0 },
});
