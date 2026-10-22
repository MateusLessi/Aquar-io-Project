import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { Text, listColors, specular, springs, useTheme, withAlpha } from '@/design-system';

import { creatures, type CreatureId } from '../domain/creatures';
import { stageInfo, type Stage } from '../domain/stages';

type CreatureBubbleProps = {
  creature: CreatureId;
  size?: number;
  /** Done today: the bubble fills with the creature's color and gives a little hop. */
  done?: boolean;
  /** Not scheduled today: the creature rests, dimmed. */
  resting?: boolean;
  /** Growth stage: an egg shows an egg; the creature grows with each stage. */
  stage?: Stage;
};

/** A creature inside a bubble of its own color. Decorative: the parent carries the label. */
export function CreatureBubble({
  creature,
  size = 56,
  done = false,
  resting = false,
  stage = 'young',
}: CreatureBubbleProps) {
  const { scheme, reduceMotion } = useTheme();
  const tone = listColors[creatures[creature].color][scheme];
  const hop = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (done && !reduceMotion) {
      hop.set(withSequence(withSpring(1.18, springs.responsive), withSpring(1, springs.buoyant)));
    }
  }, [done, hop, reduceMotion]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: hop.get() }] }));

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: done ? tone : withAlpha(tone, 0.16),
          borderColor: done ? withAlpha(specular, 0.5) : withAlpha(tone, 0.4),
          opacity: resting ? 0.45 : 1,
        },
        style,
      ]}
    >
      {/* A highlight, like light on a bubble. */}
      <View
        style={[
          styles.shine,
          {
            width: size * 0.28,
            height: size * 0.14,
            borderRadius: size,
            top: size * 0.14,
            left: size * 0.2,
            backgroundColor: withAlpha(specular, done ? 0.45 : 0.6),
          },
        ]}
      />
      <Text
        style={{
          fontSize: size * 0.5 * stageInfo[stage].scale,
          lineHeight: size * 0.62 * stageInfo[stage].scale,
        }}
      >
        {stage === 'egg' ? stageInfo.egg.emoji : creatures[creature].emoji}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  shine: { position: 'absolute', transform: [{ rotate: '-20deg' }] },
});
