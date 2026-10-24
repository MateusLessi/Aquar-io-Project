import { useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { haptics } from '../haptics';
import { useTheme } from '../theme/ThemeProvider';
import { radius, touchTarget } from '../tokens';
import { withAlpha } from '../utils/color';

const TRACK = 6;
const THUMB = 28;

export type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Read by screen readers, e.g. "Meta por dia". */
  label: string;
  /** Spoken value, e.g. "20 minutos". Defaults to the number. */
  valueText?: (value: number) => string;
};

export function snapToStep(raw: number, min: number, max: number, step: number): number {
  const snapped = Math.round((raw - min) / step) * step + min;
  return Math.min(max, Math.max(min, snapped));
}

/**
 * Drag (or tap) along the track to pick a number. Each step gives a light tick. Screen readers
 * adjust it with swipe up/down; on the web the arrow keys work too.
 */
export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  valueText = String,
}: SliderProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const ratio = max > min ? (Math.min(max, Math.max(min, value)) - min) / (max - min) : 0;

  const fromTouch = (event: GestureResponderEvent) => {
    if (width <= 0) return;
    const x = Math.min(width, Math.max(0, event.nativeEvent.locationX));
    const next = snapToStep(min + (x / width) * (max - min), min, max, step);
    if (next === value) return;
    haptics.selection();
    onChange(next);
  };

  const nudge = (direction: 1 | -1) => {
    const next = snapToStep(value + direction * step, min, max, step);
    if (next === value) return;
    haptics.selection();
    onChange(next);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: valueText(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) =>
        nudge(event.nativeEvent.actionName === 'increment' ? 1 : -1)
      }
      focusable
      {...(Platform.OS === 'web'
        ? {
            onKeyDown: (event: { nativeEvent: { key: string }; preventDefault: () => void }) => {
              const key = event.nativeEvent.key;
              if (key === 'ArrowRight' || key === 'ArrowUp') nudge(1);
              else if (key === 'ArrowLeft' || key === 'ArrowDown') nudge(-1);
              else return;
              event.preventDefault();
            },
          }
        : {})}
      style={styles.root}
    >
      <View
        style={styles.hit}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        // Inside a sheet or a scroll view, keep the drag once it started on the slider.
        onResponderTerminationRequest={() => false}
        onResponderGrant={fromTouch}
        onResponderMove={fromTouch}
      >
        <View
          pointerEvents="none"
          style={[styles.track, { backgroundColor: withAlpha(colors.textPrimary, 0.1) }]}
        >
          <View
            style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: colors.accent }]}
          />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              left: ratio * width - THUMB / 2,
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.accent,
              shadowColor: colors.shadow,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: THUMB / 2 },
  hit: { height: touchTarget, justifyContent: 'center' },
  track: { height: TRACK, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  thumb: {
    position: 'absolute',
    top: (touchTarget - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
});
