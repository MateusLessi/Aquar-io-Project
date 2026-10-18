import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';
import { durations } from '../tokens';

const causticsTexture = require('../assets/caustics.png');

/** Size of one tile of the caustics texture, in points. */
const TILE = 256;
const CAUSTICS_HEIGHT = 260;

type OceanBackgroundProps = {
  children?: ReactNode;
  /** Light refracting through the surface at the top of the screen. */
  caustics?: boolean;
};

/**
 * Screen background: gets slightly deeper towards the bottom, with optional caustics.
 * Caustics drift very slowly and stay still when "Reduce Motion" is on.
 */
export function OceanBackground({ children, caustics = true }: OceanBackgroundProps) {
  const { colors, scheme } = useTheme();

  return (
    <View style={styles.root}>
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        preserveAspectRatio="none"
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="depth" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.surfaceTop} />
            <Stop offset="0.34" stopColor={colors.surfaceBase} />
            <Stop offset="1" stopColor={colors.surfaceDeep} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#depth)" />
      </Svg>
      {caustics ? (
        <Caustics color={colors.caustic} opacity={scheme === 'dark' ? 0.06 : 0.11} />
      ) : null}
      {children}
    </View>
  );
}

function Caustics({ color, opacity }: { color: string; opacity: number }) {
  const { colors, reduceMotion } = useTheme();
  const { width } = useWindowDimensions();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    drift.set(
      withRepeat(withTiming(1, { duration: durations.ambient, easing: Easing.linear }), -1),
    );
    return () => cancelAnimation(drift);
  }, [drift, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -drift.get() * TILE }, { translateY: -drift.get() * TILE * 0.5 }],
  }));

  return (
    <View style={[styles.caustics, { height: CAUSTICS_HEIGHT }]} pointerEvents="none">
      <Animated.Image
        source={causticsTexture}
        resizeMode="repeat"
        style={[
          { width: width + TILE, height: CAUSTICS_HEIGHT + TILE, opacity, tintColor: color },
          animatedStyle,
        ]}
      />
      {/* Fades the caustics into the background, so they only live near the surface. */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.surfaceBase} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.surfaceBase} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#fade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  caustics: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
});
