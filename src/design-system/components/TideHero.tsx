import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';
import { useSvgId } from '../theme/useSvgId';
import { radius, spacing, springs, specular } from '../tokens';
import { DeepSurface } from './DeepSurface';
import { Text } from './Text';
import { clampProgress } from './WaterLevel';

const HEIGHT = 248;
/** The sea never fully empties: a calm day still has water. */
const MIN_LEVEL = 0.14;
const WAVE_HEIGHT = 14;
const WAVE_DRIFT_MS = 9000;

export type TideHeroProps = {
  /** Small label above the number, e.g. "Maré do dia". */
  label: string;
  completed: number;
  total: number;
  /** Line under the number, e.g. "tarefas concluídas". */
  caption: string;
  /** Shown instead of the caption when there is nothing to do. */
  emptyMessage?: string;
};

/** Height of the water in the card for a given progress. */
export function tideLevel(completed: number, total: number): number {
  return MIN_LEVEL + clampProgress(completed, total) * (1 - MIN_LEVEL);
}

/** Two gentle crests across `width`, repeated twice so it can drift seamlessly. */
function wavePath(width: number): string {
  const w = width;
  const h = WAVE_HEIGHT;
  return (
    `M0 ${h / 2} ` +
    `C ${w * 0.25} 0, ${w * 0.25} ${h}, ${w * 0.5} ${h / 2} ` +
    `S ${w * 0.75} 0, ${w} ${h / 2} ` +
    `S ${w * 1.25} ${h}, ${w * 1.5} ${h / 2} ` +
    `S ${w * 1.75} 0, ${w * 2} ${h / 2} ` +
    `V ${HEIGHT + h} H 0 Z`
  );
}

/**
 * The day's tide: a deep-water card whose water rises as things get done.
 * Light rays fall from the surface; the waves drift slowly unless Reduce Motion is on.
 */
export function TideHero({ label, completed, total, caption, emptyMessage }: TideHeroProps) {
  const { colors, reduceMotion } = useTheme();
  const raysId = useSvgId('rays');
  const [width, setWidth] = useState(0);
  const level = useSharedValue(tideLevel(completed, total));
  const drift = useSharedValue(0);
  const isEmpty = total === 0;

  useEffect(() => {
    level.set(withSpring(tideLevel(completed, total), springs.gentle));
  }, [level, completed, total]);

  useEffect(() => {
    if (reduceMotion || width === 0) return;
    drift.set(withRepeat(withTiming(1, { duration: WAVE_DRIFT_MS, easing: Easing.linear }), -1));
    return () => cancelAnimation(drift);
  }, [drift, reduceMotion, width]);

  const waterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - level.get()) * HEIGHT - WAVE_HEIGHT / 2 }],
  }));
  const backWaveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -drift.get() * width }],
  }));
  const frontWaveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (drift.get() - 1) * width }],
  }));

  return (
    <DeepSurface
      radius="xl"
      style={styles.card}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${completed} de ${total} ${caption}`}
      accessibilityValue={{ min: 0, max: Math.max(total, 1), now: Math.min(completed, total) }}
    >
      {width > 0 ? (
        <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
          {/* Light rays falling from the surface. */}
          <Svg width={width} height={HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={raysId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={specular} stopOpacity={0.14} />
                <Stop offset="1" stopColor={specular} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Polygon
              points={`${width * 0.18},0 ${width * 0.3},0 ${width * 0.55},${HEIGHT} ${width * 0.34},${HEIGHT}`}
              fill={`url(#${raysId})`}
            />
            <Polygon
              points={`${width * 0.42},0 ${width * 0.47},0 ${width * 0.72},${HEIGHT} ${width * 0.62},${HEIGHT}`}
              fill={`url(#${raysId})`}
            />
            <Polygon
              points={`${width * 0.62},0 ${width * 0.7},0 ${width * 0.98},${HEIGHT} ${width * 0.84},${HEIGHT}`}
              fill={`url(#${raysId})`}
            />
          </Svg>

          {/* The tide: two waves drifting in opposite phase. */}
          <Animated.View style={[styles.water, waterStyle]}>
            <Animated.View style={[styles.wave, backWaveStyle]}>
              <Svg width={width * 2} height={HEIGHT + WAVE_HEIGHT}>
                <Path d={wavePath(width)} fill={colors.deepAccent} opacity={0.16} />
              </Svg>
            </Animated.View>
            <Animated.View style={[styles.wave, styles.frontWave, frontWaveStyle]}>
              <Svg width={width * 2} height={HEIGHT + WAVE_HEIGHT}>
                <Path d={wavePath(width)} fill={colors.deepAccent} opacity={0.24} />
              </Svg>
            </Animated.View>
          </Animated.View>
        </View>
      ) : null}

      <View style={styles.content} pointerEvents="none">
        <Text variant="overline" tone="onDeepSecondary">
          {label}
        </Text>
        <View style={styles.numberRow}>
          <Text variant="display" tone="onDeep">
            {completed}
          </Text>
          <Text variant="title2" tone="onDeepSecondary" style={styles.total}>
            / {total}
          </Text>
        </View>
        <Text variant="callout" tone="onDeep">
          {isEmpty && emptyMessage ? emptyMessage : caption}
        </Text>
      </View>
    </DeepSurface>
  );
}

const styles = StyleSheet.create({
  card: { height: HEIGHT },
  clip: { overflow: 'hidden', borderRadius: radius.xl },
  water: { position: 'absolute', left: 0, right: 0, top: 0, height: HEIGHT + WAVE_HEIGHT },
  wave: { position: 'absolute', top: 0, left: 0 },
  frontWave: { top: 4 },
  content: { flex: 1, padding: spacing.xxl, justifyContent: 'flex-start' },
  numberRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.sm },
  total: { marginLeft: spacing.sm },
});
