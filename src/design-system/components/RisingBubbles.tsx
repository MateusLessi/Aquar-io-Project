import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeProvider';
import { specular } from '../tokens';
import { withAlpha } from '../utils/color';

export type RisingBubblesProps = {
  /** Height the bubbles travel, in points (usually the card's height). */
  height: number;
  count?: number;
  /** Larger, faster and brighter: for celebrations. */
  festive?: boolean;
};

/** Pseudo-random but stable per index, so bubbles do not jump between renders. */
const seeded = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Bubbles drifting up through deep water. Decorative only (hidden from screen readers) and
 * absent when Reduce Motion is on.
 */
export function RisingBubbles({ height, count = 8, festive = false }: RisingBubblesProps) {
  const { reduceMotion } = useTheme();
  const bubbles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${6 + seeded(i, 1) * 88}%` as const,
        size: (festive ? 8 : 4) + seeded(i, 2) * (festive ? 14 : 8),
        duration: (festive ? 2200 : 5200) + seeded(i, 3) * (festive ? 1600 : 4000),
        delay: seeded(i, 4) * (festive ? 1200 : 5000),
      })),
    [count, festive],
  );
  if (reduceMotion) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {bubbles.map((bubble, i) => (
        <Bubble key={i} {...bubble} height={height} festive={festive} />
      ))}
    </View>
  );
}

function Bubble({
  left,
  size,
  duration,
  delay,
  height,
  festive,
}: {
  left: `${number}%`;
  size: number;
  duration: number;
  delay: number;
  height: number;
  festive: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false),
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p === 0 ? 0 : (festive ? 0.9 : 0.5) * Math.sin(Math.PI * p),
      transform: [
        { translateY: height - p * (height + size) },
        { translateX: Math.sin(p * Math.PI * 3) * 6 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: withAlpha(specular, festive ? 0.8 : 0.45),
          backgroundColor: withAlpha(specular, festive ? 0.18 : 0.08),
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bubble: { position: 'absolute', top: 0, borderWidth: 1 },
});
