import type { LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../tokens';
import { Button } from './Button';
import { Text } from './Text';

const ICON_SIZE = 76;
const mascot = require('../assets/mascot.png');

export type EmptyStateProps = {
  /** For problems (an error, something deleted). Without it, the mascot swims in. */
  icon?: LucideIcon;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

/** Shown when a screen has nothing to list yet: calm, specific, and pointing to the next step. */
export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      {Icon ? (
        <View style={styles.halo}>
          <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
            <Icon size={32} strokeWidth={1.7} color={colors.accent} />
          </View>
        </View>
      ) : (
        <Mascot />
      )}
      <Text variant="title2" style={styles.center}>
        {title}
      </Text>
      <Text variant="callout" tone="secondary" style={[styles.center, styles.message]}>
        {message}
      </Text>
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} variant="secondary" onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

/** The Aquar.io fish, bobbing gently (still with Reduce Motion). Decorative. */
function Mascot() {
  const { reduceMotion } = useTheme();
  const bob = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    bob.set(
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    return () => cancelAnimation(bob);
  }, [bob, reduceMotion]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: (bob.get() - 0.5) * 10 }, { rotate: `${(bob.get() - 0.5) * 4}deg` }],
  }));
  return (
    <Animated.View
      style={[styles.mascot, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image source={mascot} style={styles.mascotImage} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.xl },
  halo: { padding: 10, marginBottom: spacing.xl },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: { marginBottom: spacing.lg },
  mascotImage: { width: 120, height: 120 },
  center: { textAlign: 'center' },
  message: { marginTop: spacing.sm, maxWidth: 340 },
  action: { marginTop: spacing.xl },
});
