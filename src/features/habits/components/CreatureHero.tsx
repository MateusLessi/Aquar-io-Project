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
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { RisingBubbles, pond, radius, useSvgId, useTheme } from '@/design-system';

import { catalogCreature, type CreatureId } from '../domain/creatures';
import type { Stage } from '../domain/stages';
import { CreatureArt } from './CreatureArt';
import { PondLeaves, PondWater, SWIMS_HEAD_FIRST } from './HabitPond';

/** Taller on wide screens, never squeezed on small phones; low enough for today's action to show. */
const heightFor = (width: number) => Math.round(Math.min(260, Math.max(210, width * 0.6)));

/**
 * The creature of one habit, big, seen from above on the pond's water (Fase 6, the habit's
 * page): it floats in place, turning a little, with its shadow on the bottom; jellyfish and
 * octopus pulse instead. Holds still with "Reduzir movimento". `children` sit over the water
 * (small tags). The label says what the picture shows.
 */
export function CreatureHero({
  creature,
  stage,
  accessibilityLabel,
  children,
}: {
  creature: CreatureId;
  stage: Stage;
  accessibilityLabel: string;
  children?: ReactNode;
}) {
  const [width, setWidth] = useState(0);
  const height = heightFor(width);
  const size = Math.round(height * 0.62);

  return (
    <View
      style={[styles.root, { height }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
    >
      <View
        style={[StyleSheet.absoluteFill, styles.clip]}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {width > 0 ? (
          <>
            <PondWater width={width} height={height} />
            <Floating creature={creature} stage={stage} size={size} />
            <PondLeaves width={width} height={height} />
            <RisingBubbles height={height} count={4} />
          </>
        ) : null}
      </View>
      {children ? <View style={styles.tags}>{children}</View> : null}
    </View>
  );
}

/** The creature in the middle of the water, and its shadow on the bottom. */
function Floating({ creature, stage, size }: { creature: CreatureId; stage: Stage; size: number }) {
  const { reduceMotion } = useTheme();
  const shadowId = useSvgId('creature-shadow');
  // An egg rests; the ones that swim head first turn a little as they float.
  const turns = SWIMS_HEAD_FIRST.has(catalogCreature(creature)) && stage !== 'egg';
  const pulses = !turns && stage !== 'egg';
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    t.set(
      withRepeat(
        withTiming(1, { duration: pulses ? 2400 : 3200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(t);
  }, [t, reduceMotion, pulses]);

  const bodyStyle = useAnimatedStyle(() => {
    const v = t.get();
    return {
      transform: [
        { translateY: -v * 6 },
        { rotate: turns ? `${-18 + v * 5}deg` : '0deg' },
        { scaleX: pulses ? 1 - v * 0.06 : 1 },
        { scaleY: pulses ? 1 + v * 0.04 : 1 },
      ],
    };
  });
  // The higher it floats, the smaller and fainter its shadow.
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 1 - t.get() * 0.25,
    transform: [{ scale: 1 - t.get() * 0.06 }],
  }));

  const shadow = size * 0.8;
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.center}>
        {/* Lit from the top left: the shadow falls down and to the right. */}
        <Animated.View
          style={[
            styles.shadow,
            { width: shadow, height: shadow, marginLeft: size * 0.16, marginTop: size * 0.26 },
            shadowStyle,
          ]}
        >
          <Svg width={shadow} height={shadow}>
            <Defs>
              <RadialGradient id={shadowId} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={pond.deep} stopOpacity={0.55} />
                <Stop offset="1" stopColor={pond.deep} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse
              cx={shadow / 2}
              cy={shadow / 2}
              rx={shadow / 2}
              ry={shadow * 0.36}
              fill={`url(#${shadowId})`}
            />
          </Svg>
        </Animated.View>
        <Animated.View style={bodyStyle}>
          <CreatureArt creature={creature} stage={stage} size={size} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRadius: radius.xl },
  clip: { overflow: 'hidden', borderRadius: radius.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shadow: { position: 'absolute' },
  tags: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
});
