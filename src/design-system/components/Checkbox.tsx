import { Check } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '../haptics';
import { useTheme } from '../theme/ThemeProvider';
import { springs, timings, touchTarget } from '../tokens';
import { PressableScale } from './PressableScale';

const SIZE = 24;

export type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Read by screen readers, e.g. the task title. */
  label: string;
  disabled?: boolean;
  testID?: string;
};

/**
 * Circular checkbox. Checking it fills it with a buoyant spring,
 * sends out a ripple ring and a light haptic tap.
 */
export function Checkbox({ checked, onChange, label, disabled = false, testID }: CheckboxProps) {
  const { colors } = useTheme();
  const fill = useSharedValue(checked ? 1 : 0);
  const ripple = useSharedValue(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    fill.set(withSpring(checked ? 1 : 0, springs.buoyant));
    // Only ripple on a real change to checked, not on first render.
    if (checked && !isFirstRender.current) {
      ripple.set(0);
      ripple.set(withSequence(withTiming(1, timings.slow), withTiming(0, { duration: 0 })));
    }
    isFirstRender.current = false;
  }, [checked, fill, ripple]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fill.get(),
    transform: [{ scale: 0.4 + fill.get() * 0.6 }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: ripple.get() === 0 ? 0 : 0.5 * (1 - ripple.get()),
    transform: [{ scale: 1 + ripple.get() * 1.2 }],
  }));

  return (
    <PressableScale
      testID={testID}
      onPress={() => {
        const next = !checked;
        if (next) haptics.light();
        onChange(next);
      }}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      hitSlop={(touchTarget - SIZE) / 2}
      focusRadius={SIZE}
      scaleTo={0.85}
      style={disabled && styles.disabled}
    >
      <View style={styles.box}>
        <Animated.View
          pointerEvents="none"
          style={[styles.circle, { borderColor: colors.accent, borderWidth: 1.5 }, rippleStyle]}
        />
        <View style={[styles.circle, { borderColor: colors.textTertiary, borderWidth: 2 }]} />
        <Animated.View
          style={[styles.circle, styles.center, { backgroundColor: colors.accent }, fillStyle]}
        >
          <Check size={14} strokeWidth={3} color={colors.onAccent} />
        </Animated.View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.4 },
  box: { width: SIZE, height: SIZE },
  circle: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: SIZE / 2 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
