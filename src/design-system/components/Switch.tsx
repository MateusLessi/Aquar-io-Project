import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptics } from '../haptics';
import { useTheme } from '../theme/ThemeProvider';
import { springs, touchTarget } from '../tokens';

const WIDTH = 52;
const HEIGHT = 32;
const KNOB = 26;
const TRAVEL = WIDTH - KNOB - (HEIGHT - KNOB);

export type SwitchProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  /** Read by screen readers, e.g. "Reduzir movimento". */
  label: string;
  disabled?: boolean;
};

/** An on/off toggle: the knob springs across and the track fills with the accent color. */
export function Switch({ value, onChange, label, disabled = false }: SwitchProps) {
  const { colors } = useTheme();
  const position = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    position.set(withSpring(value ? 1 : 0, springs.responsive));
  }, [position, value]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.get() * TRAVEL }],
  }));

  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        onChange(!value);
      }}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      aria-checked={value}
      hitSlop={(touchTarget - HEIGHT) / 2}
      style={[
        styles.track,
        { backgroundColor: value ? colors.accent : colors.surfacePressed },
        disabled && styles.disabled,
      ]}
    >
      <Animated.View
        style={[
          styles.knob,
          { backgroundColor: colors.surfaceRaised, shadowColor: colors.shadow },
          knobStyle,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    padding: (HEIGHT - KNOB) / 2,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  disabled: { opacity: 0.4 },
});
