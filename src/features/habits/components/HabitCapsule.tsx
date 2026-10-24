import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text, listColors, specular, springs, useTheme, withAlpha } from '@/design-system';

import { creatures, type CreatureId } from '../domain/creatures';
import { stageInfo, type Stage } from '../domain/stages';

const WAVE = 8;

type HabitCapsuleProps = {
  creature: CreatureId;
  stage: Stage;
  /** How full today is, 0–1. */
  ratio: number;
  done: boolean;
  /** Not scheduled today: the capsule rests, dimmed. */
  resting?: boolean;
  width: number;
  height: number;
  /** Small text at the bottom, such as "3/8". */
  caption?: string | null;
};

/**
 * A habit as a small glass aquarium: the water level is today's progress and the creature
 * swims at the surface, so it rises as the day fills and reaches the top when it is done.
 * Decorative: the parent carries the label.
 */
export function HabitCapsule({
  creature,
  stage,
  ratio,
  done,
  resting = false,
  width,
  height,
  caption,
}: HabitCapsuleProps) {
  const { scheme, reduceMotion } = useTheme();
  const tone = listColors[creatures[creature].color][scheme];
  const fontSize = Math.round(width * 0.4 * stageInfo[stage].scale);
  const level = useSharedValue(ratio);
  const drift = useSharedValue(0);
  const bob = useSharedValue(0);
  const hop = useSharedValue(1);
  const wasDone = useRef(done);

  useEffect(() => {
    level.set(withSpring(ratio, springs.gentle));
  }, [level, ratio]);

  // Finishing the day: a little hop of joy.
  useEffect(() => {
    if (done && !wasDone.current && !reduceMotion) {
      hop.set(withSequence(withSpring(1.22, springs.responsive), withSpring(1, springs.buoyant)));
    }
    wasDone.current = done;
  }, [done, hop, reduceMotion]);

  // The water ripples and the creature floats, unless motion is reduced.
  useEffect(() => {
    if (reduceMotion) return;
    drift.set(withRepeat(withTiming(1, { duration: 3600, easing: Easing.linear }), -1, false));
    bob.set(
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    return () => {
      cancelAnimation(drift);
      cancelAnimation(bob);
    };
  }, [bob, drift, reduceMotion]);

  const waterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - level.get()) * (height + WAVE) }],
  }));
  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -drift.get() * width }],
  }));
  const creatureStyle = useAnimatedStyle(() => {
    // Float at the surface, but never above the rim or below the floor.
    const surface = height - level.get() * height;
    const top = Math.min(height - fontSize * 1.25, Math.max(4, surface - fontSize * 0.7));
    return {
      transform: [{ translateY: top + (bob.get() - 0.5) * 4 }, { scale: hop.get() }],
    };
  });

  // Two wave periods side by side, so sliding one width left loops seamlessly.
  const w = width;
  const wave =
    `M0 ${WAVE / 2} ` +
    `C ${w * 0.25} 0, ${w * 0.25} ${WAVE}, ${w * 0.5} ${WAVE / 2} ` +
    `S ${w * 0.75} 0, ${w} ${WAVE / 2} ` +
    `S ${w * 1.25} ${WAVE}, ${w * 1.5} ${WAVE / 2} ` +
    `S ${w * 1.75} 0, ${w * 2} ${WAVE / 2} ` +
    `V ${height + WAVE * 2} H 0 Z`;
  const gradientId = `water-${creature}`;
  const corner = Math.min(width, height) * 0.32;

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        styles.capsule,
        {
          width,
          height,
          borderRadius: corner,
          backgroundColor: withAlpha(tone, scheme === 'dark' ? 0.08 : 0.1),
          borderColor: done ? tone : withAlpha(tone, 0.45),
          borderWidth: done ? 2 : 1.5,
          opacity: resting ? 0.5 : 1,
          shadowColor: tone,
          shadowOpacity: done ? 0.55 : 0,
        },
      ]}
    >
      <Animated.View style={[styles.water, { height: height + WAVE * 2 }, waterStyle]}>
        <Animated.View style={[{ width: width * 2 }, waveStyle]}>
          <Svg width={width * 2} height={height + WAVE * 2}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={tone} stopOpacity={0.75} />
                <Stop offset="1" stopColor={tone} stopOpacity={0.3} />
              </LinearGradient>
            </Defs>
            <Path d={wave} fill={`url(#${gradientId})`} />
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* Light on the glass. */}
      <View
        style={[
          styles.shine,
          {
            top: height * 0.09,
            left: width * 0.13,
            width: Math.max(3, width * 0.06),
            height: height * 0.2,
            backgroundColor: withAlpha(specular, scheme === 'dark' ? 0.07 : 0.3),
          },
        ]}
      />

      <Animated.View style={[styles.creature, creatureStyle]}>
        <Text style={{ fontSize, lineHeight: fontSize * 1.2 }}>
          {stage === 'egg' ? stageInfo.egg.emoji : creatures[creature].emoji}
        </Text>
      </Animated.View>

      {caption ? (
        <Text variant="caption" style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },
  water: { position: 'absolute', left: 0, right: 0, top: -WAVE },
  shine: { position: 'absolute', borderRadius: 99 },
  creature: { position: 'absolute', left: 0, right: 0, top: 0, alignItems: 'center' },
  caption: {
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: 5,
    textAlign: 'center',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
