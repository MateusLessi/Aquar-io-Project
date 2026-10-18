import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';
import { radius, springs } from '../tokens';
import { Text } from './Text';

const HEIGHT = 30;
const WAVE_HEIGHT = 6;

export type WaterLevelProps = {
  /** Completed items. */
  value: number;
  /** Total items. */
  total: number;
  /** Visible text. Defaults to "value de total". */
  label?: string;
  /** Spoken description, e.g. "Tarefas de hoje". */
  accessibilityLabel: string;
  minWidth?: number;
};

export function clampProgress(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, value / total));
}

/** Progress shown as water filling a capsule, with a gentle wave on top. */
export function WaterLevel({
  value,
  total,
  label,
  accessibilityLabel,
  minWidth = 92,
}: WaterLevelProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(minWidth);
  const progress = clampProgress(value, total);
  const level = useSharedValue(progress);

  useEffect(() => {
    level.set(withSpring(progress, springs.gentle));
  }, [level, progress]);

  const waterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - level.get()) * (HEIGHT + WAVE_HEIGHT) }],
  }));

  const wave =
    `M0 ${WAVE_HEIGHT / 2} ` +
    `C ${width * 0.13} 0, ${width * 0.24} 0, ${width * 0.37} ${WAVE_HEIGHT / 2} ` +
    `S ${width * 0.63} ${WAVE_HEIGHT}, ${width * 0.76} ${WAVE_HEIGHT / 2} ` +
    `S ${width * 0.93} 0, ${width} ${WAVE_HEIGHT / 2} ` +
    `V ${HEIGHT + WAVE_HEIGHT} H 0 Z`;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: total, now: Math.min(value, total) }}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.capsule, { minWidth, backgroundColor: colors.accentSoft }]}
    >
      <Animated.View style={[styles.water, waterStyle]} pointerEvents="none">
        <Svg width={width} height={HEIGHT + WAVE_HEIGHT}>
          <Path d={wave} fill={colors.accent} opacity={0.35} />
        </Svg>
      </Animated.View>
      <Text variant="caption" style={styles.label}>
        {label ?? `${value} de ${total}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    height: HEIGHT,
    borderRadius: radius.pill,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  water: { position: 'absolute', left: 0, right: 0, top: -WAVE_HEIGHT },
  label: { textAlign: 'center', fontVariant: ['tabular-nums'] },
});
