import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeepSurface, RisingBubbles, Text, haptics, spacing, springs } from '@/design-system';

const VISIBLE_MS = 4500;

/** A short celebration that drops in from the top; a tap or a few seconds dismiss it. */
export function CelebrationBanner({ message, onDone }: { message: string; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const drop = useSharedValue(-160);

  useEffect(() => {
    haptics.success();
    drop.set(withSpring(0, springs.buoyant));
    const timer = setTimeout(onDone, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [drop, message, onDone]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: drop.get() }] }));

  return (
    <Animated.View style={[styles.wrap, { top: insets.top + spacing.sm }, style]}>
      <Pressable
        onPress={onDone}
        accessibilityRole="button"
        accessibilityLabel={`${message} Toque para fechar.`}
        accessibilityLiveRegion="polite"
      >
        <DeepSurface radius="xl" style={styles.card}>
          <RisingBubbles height={72} count={8} festive />
          <Text variant="headline" tone="onDeep" style={styles.text}>
            {message}
          </Text>
        </DeepSurface>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    alignItems: 'center',
  },
  card: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    overflow: 'hidden',
    maxWidth: 520,
  },
  text: { textAlign: 'center' },
});
