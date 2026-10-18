import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeProvider';
import { pressedScale, springs } from '../tokens';

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode | ((state: { pressed: boolean; focused: boolean }) => ReactNode);
  /** How much the element sinks when pressed. */
  scaleTo?: number;
  /** Radius of the keyboard focus ring (web/desktop). */
  focusRadius?: number;
};

/**
 * Internal building block: a Pressable that sinks slightly on press (spring)
 * and shows a focus ring for keyboard navigation.
 */
export function PressableScale({
  style,
  children,
  scaleTo = pressedScale,
  focusRadius = 12,
  disabled,
  onPressIn,
  onPressOut,
  onFocus,
  onBlur,
  ...rest
}: PressableScaleProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={(event) => {
        setPressed(true);
        scale.set(withSpring(scaleTo, springs.responsive));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        scale.set(withSpring(1, springs.responsive));
        onPressOut?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      {...rest}
    >
      <Animated.View
        style={[
          style,
          animatedStyle,
          focused && {
            outlineColor: colors.focusRing,
            outlineWidth: 2,
            outlineStyle: 'solid',
            outlineOffset: 2,
            borderRadius: focusRadius,
          },
        ]}
      >
        {typeof children === 'function' ? children({ pressed, focused }) : children}
      </Animated.View>
    </Pressable>
  );
}
