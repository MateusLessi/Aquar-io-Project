import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import {
  RisingBubbles,
  abyss,
  pond,
  radius as radii,
  specular,
  useSvgId,
  useTheme,
  withAlpha,
  Text,
} from '@/design-system';

import { catalogCreature, type CatalogCreature } from '../domain/creatures';
import type { HabitWithProgress } from '../domain/types';
import { CreatureArt } from './CreatureArt';

/** Creatures near the surface (today's habits) and deep below (resting ones). */
const MAX_NEAR = 8;
const MAX_DEEP = 4;
/** These swim head first along their path, swaying; the others drift upright and pulse. */
export const SWIMS_HEAD_FIRST: ReadonlySet<CatalogCreature> = new Set([
  'fish',
  'shark',
  'turtle',
  'ray',
]);

type HabitPondProps = {
  habits: HabitWithProgress[];
  height: number;
  overlay?: ReactNode;
  accessibilityLabel: string;
  progress?: { now: number; max: number };
  radius?: keyof typeof radii;
};

/**
 * Your aquarium seen from above (Fase 6): a pond where the creature of each habit swims. Today's
 * habits swim near the surface, in color; the ones resting today glide deep below as dark
 * shapes. Leaves frame the edges, light drifts on the water. Decorative: the label says what
 * the picture shows. With "Reduzir movimento" everything holds still.
 */
export function HabitPond({
  habits,
  height,
  overlay,
  accessibilityLabel,
  progress,
  radius = 'xl',
}: HabitPondProps) {
  const [width, setWidth] = useState(0);
  const today = (h: HabitWithProgress) => h.scheduledToday || h.doneToday;
  const near = habits.filter(today).slice(0, MAX_NEAR);
  const deep = habits.filter((h) => !today(h)).slice(0, MAX_DEEP);
  const borderRadius = radii[radius];

  return (
    <View
      style={{ height }}
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole={progress ? 'progressbar' : 'image'}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={
        progress
          ? { min: 0, max: Math.max(progress.max, 1), now: Math.min(progress.now, progress.max) }
          : undefined
      }
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
    >
      <View
        style={[StyleSheet.absoluteFill, styles.clip, { borderRadius }]}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {width > 0 ? (
          <>
            <PondWater width={width} height={height} />
            {deep.map((habit, i) => (
              <Swimmer
                key={habit.id}
                habit={habit}
                index={i + MAX_NEAR}
                width={width}
                height={height}
                deep
              />
            ))}
            {near.map((habit, i) => (
              <Swimmer key={habit.id} habit={habit} index={i} width={width} height={height} />
            ))}
            <PondLeaves width={width} height={height} />
            <RisingBubbles height={height} count={5} />
          </>
        ) : null}
      </View>
      {overlay}
    </View>
  );
}

/** A number on dark glass over the water: "3 de 6 hoje". */
export function PondCount({ value, label }: { value: string; label: string }) {
  return (
    <View style={[styles.count, { backgroundColor: withAlpha(abyss[950], 0.5) }]}>
      <Text style={[styles.countValue, { color: specular }]}>{value}</Text>
      <Text variant="caption" style={{ color: specular }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** A small label on dark glass over the water. */
export function PondTag({ label }: { label: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: withAlpha(abyss[950], 0.5) }]}>
      <Text variant="caption" style={{ color: specular }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Green water, deeper toward one corner, with soft light drifting on it. */
export function PondWater({ width, height }: { width: number; height: number }) {
  const { reduceMotion } = useTheme();
  const waterId = useSvgId('pond-water');
  const lightId = useSvgId('pond-light');
  const drift = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    drift.set(
      withRepeat(withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    return () => cancelAnimation(drift);
  }, [drift, reduceMotion]);
  const lightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift.get() * width * 0.08 },
      { translateY: drift.get() * height * 0.06 },
    ],
  }));
  return (
    <>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={waterId} x1="0" y1="0" x2="0.7" y2="1">
            <Stop offset="0" stopColor={pond.water[0]} />
            <Stop offset="0.3" stopColor={pond.water[1]} />
            <Stop offset="0.62" stopColor={pond.water[2]} />
            <Stop offset="1" stopColor={pond.water[3]} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill={`url(#${waterId})`} />
      </Svg>
      {/* Bigger than the pond, so its edge never shows while it drifts. */}
      <Animated.View
        style={[
          styles.light,
          { left: -width * 0.25, top: -height * 0.25, width: width * 1.5, height: height * 1.5 },
          lightStyle,
        ]}
      >
        <Svg width={width * 1.5} height={height * 1.5}>
          <Defs>
            <RadialGradient id={lightId} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={pond.light} stopOpacity={0.22} />
              <Stop offset="1" stopColor={pond.light} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx={width * 0.53}
            cy={height * 0.45}
            rx={width * 0.45}
            ry={height * 0.35}
            fill={`url(#${lightId})`}
          />
          <Ellipse
            cx={width * 1.03}
            cy={height * 0.87}
            rx={width * 0.3}
            ry={height * 0.25}
            fill={`url(#${lightId})`}
            opacity={0.5}
          />
        </Svg>
      </Animated.View>
    </>
  );
}

/** Leaves framing the corners, over the creatures, like plants at the pond's edge. */
export function PondLeaves({ width, height }: { width: number; height: number }) {
  const lit = useSvgId('leaf-lit');
  const shade = useSvgId('leaf-shade');
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <LinearGradient id={lit} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor={pond.leafDark} />
          <Stop offset="1" stopColor={pond.leafLight} />
        </LinearGradient>
        <LinearGradient id={shade} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor={pond.leafDeep} />
          <Stop offset="1" stopColor={pond.leafMid} />
        </LinearGradient>
      </Defs>
      <Path d="M-4 100 C0 84 6 76 4 63 C14 75 18 88 16 100Z" fill={`url(#${shade})`} />
      <Path d="M-6 100 C8 91 13 81 25 73 C23 86 27 94 33 100Z" fill={`url(#${lit})`} />
      <Path d="M104 100 C92 87 88 77 92 65 C82 77 76 90 76 100Z" fill={`url(#${shade})`} />
      <Path d="M104 -2 C91 6 87 16 93 28 C99 18 102 10 104 6Z" fill={`url(#${lit})`} />
      <Path d="M-4 -2 C6 4 9 12 4 22 C0 14 -2 8 -4 4Z" fill={`url(#${shade})`} opacity={0.9} />
    </Svg>
  );
}

const seeded = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * One creature on its own figure-eight path. Swimmers turn their head the way they go and sway;
 * jellyfish and octopuses drift upright and pulse. Eggs move slowly.
 */
function Swimmer({
  habit,
  index,
  width,
  height,
  deep = false,
}: {
  habit: HabitWithProgress;
  index: number;
  width: number;
  height: number;
  deep?: boolean;
}) {
  const { reduceMotion } = useTheme();
  const base = Math.max(44, Math.min(108, Math.min(width, height) * 0.28));
  const size = deep ? base * 0.75 : base;
  const egg = habit.stage === 'egg';
  const headFirst = SWIMS_HEAD_FIRST.has(catalogCreature(habit.creature)) && !egg;

  // The path: a figure eight around its own center, inside the pond.
  const pad = size * 0.45;
  const cx = width * (0.3 + seeded(index, 1) * 0.4);
  const cy = height * (0.3 + seeded(index, 2) * 0.4);
  const ax = Math.max(
    6,
    Math.min(width * (0.22 + seeded(index, 3) * 0.14), cx - pad, width - cx - pad),
  );
  const ay = Math.max(
    4,
    Math.min(height * (0.14 + seeded(index, 4) * 0.12), cy - pad, height - cy - pad),
  );
  const phase = seeded(index, 5) * Math.PI * 2;
  const twist = seeded(index, 6) * Math.PI * 2;
  const dir = seeded(index, 8) > 0.5 ? 1 : -1;
  const lap = (18000 + seeded(index, 7) * 12000) * (egg ? 2 : 1) * (deep ? 1.4 : 1);

  const t = useSharedValue(phase);
  useEffect(() => {
    if (reduceMotion) {
      t.set(phase);
      return;
    }
    t.set(phase);
    t.set(
      withRepeat(
        withTiming(phase + dir * Math.PI * 2, { duration: lap, easing: Easing.linear }),
        -1,
      ),
    );
    return () => cancelAnimation(t);
  }, [t, phase, dir, lap, reduceMotion]);

  const style = useAnimatedStyle(() => {
    const a = t.get();
    const x = cx + ax * Math.sin(a);
    const y = cy + ay * Math.sin(2 * a + twist);
    let rotate: number;
    let pulse = 1;
    if (headFirst) {
      // Facing the way it goes (the art looks up, so a quarter turn more), with a sway.
      const dx = ax * Math.cos(a) * dir;
      const dy = 2 * ay * Math.cos(2 * a + twist) * dir;
      rotate = (Math.atan2(dy, dx) * 180) / Math.PI + 90 + Math.sin(a * 40) * 6;
    } else {
      rotate = Math.sin(a * 5) * 6;
      pulse = 1 + Math.sin(a * 24) * 0.05;
    }
    return {
      transform: [
        { translateX: x - size / 2 },
        { translateY: y - size / 2 },
        { rotate: `${rotate}deg` },
        { scaleY: pulse },
        { scaleX: 2 - pulse },
      ],
    };
  });

  return (
    <Animated.View
      style={[styles.swimmer, { width: size, height: size, opacity: deep ? 0.55 : 1 }, style]}
    >
      <CreatureArt
        creature={habit.creature}
        stage={habit.stage}
        size={size}
        silhouette={deep ? pond.deep : undefined}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  light: { position: 'absolute' },
  swimmer: { position: 'absolute', left: 0, top: 0 },
  count: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countValue: { fontSize: 22, lineHeight: 26, fontWeight: '800' },
  tag: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
});
