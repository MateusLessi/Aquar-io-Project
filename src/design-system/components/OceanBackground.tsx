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
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';
import { useSvgId } from '../theme/useSvgId';
import { durations, type ColorScheme, type ThemeColors } from '../tokens';
import { withAlpha } from '../utils/color';
import { RisingBubbles } from './RisingBubbles';

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
  const { colors, scheme, mode } = useTheme();
  if (mode === 'crystal') return <CrystalWater>{children}</CrystalWater>;
  return (
    <PlainBackground caustics={caustics} colors={colors} scheme={scheme}>
      {children}
    </PlainBackground>
  );
}

function PlainBackground({
  children,
  caustics,
  colors,
  scheme,
}: OceanBackgroundProps & { caustics: boolean; colors: ThemeColors; scheme: ColorScheme }) {
  const surfaceId = useSvgId('surface');
  const depthId = useSvgId('depth');

  return (
    <View style={styles.root}>
      {/* Two bands meeting at CAUSTICS_HEIGHT: the surface light ends exactly on the base
          color, so the caustics fade into it without a visible edge. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height={CAUSTICS_HEIGHT} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={surfaceId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.surfaceTop} />
              <Stop offset="1" stopColor={colors.surfaceBase} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${surfaceId})`} />
        </Svg>
        <Svg width="100%" style={styles.flex} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={depthId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.surfaceBase} />
              <Stop offset="1" stopColor={colors.surfaceDeep} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${depthId})`} />
        </Svg>
      </View>
      {caustics ? (
        <Caustics color={colors.caustic} opacity={scheme === 'dark' ? 0.06 : 0.11} />
      ) : null}
      {children}
    </View>
  );
}

function Caustics({ color, opacity }: { color: string; opacity: number }) {
  const { colors, reduceMotion } = useTheme();
  const fadeId = useSvgId('fade');
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
          <LinearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.surfaceBase} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.surfaceBase} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${fadeId})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  caustics: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
});

/**
 * Crystal: the aquarium is the whole screen. Water from the zone, light from above, kelp and
 * sand at the bottom; cards float over it as frosted glass. Darkened enough for white text.
 */
function CrystalWater({ children }: { children?: ReactNode }) {
  const { colors, water } = useTheme();
  const { width, height } = useWindowDimensions();
  const id = useSvgId('crystal');
  const rays = [0.12, 0.38, 0.64, 0.88];
  const kelp: [number, number][] = [
    [0.05, 0.26],
    [0.1, 0.34],
    [0.9, 0.3],
    [0.95, 0.22],
  ];
  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.surfaceTop} />
              <Stop offset="0.6" stopColor={colors.surfaceBase} />
              <Stop offset="1" stopColor={colors.surfaceDeep} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
          {rays.map((x) => (
            <Path
              key={x}
              d={`M${width * x - 24} 0 L${width * x + 28} 0 L${width * x - 90} ${height} L${width * x - 170} ${height}Z`}
              fill={colors.caustic}
              opacity={water.rays * 0.55}
            />
          ))}
          {kelp.map(([x, h], k) => {
            const X = width * x;
            return (
              <Path
                key={x}
                d={`M${X} ${height} C${X - 22} ${height - height * h * 0.4} ${X + 22} ${height - height * h * 0.7} ${X - 6} ${height - height * h}`}
                stroke={water.kelp}
                strokeWidth={10 - (k % 2) * 2}
                strokeLinecap="round"
                fill="none"
                opacity={0.55}
              />
            );
          })}
          <Path
            d={`M0 ${height - 40} Q${width * 0.3} ${height - 62} ${width * 0.55} ${height - 44} T${width} ${height - 50} V${height} H0Z`}
            fill={withAlpha(water.sand, 0.4)}
          />
          <Ellipse
            cx={width * 0.72}
            cy={height - 44}
            rx={34}
            ry={14}
            fill={withAlpha(water.bottom, 0.5)}
          />
        </Svg>
        <RisingBubbles height={height} count={10} />
      </View>
      {children}
    </View>
  );
}
