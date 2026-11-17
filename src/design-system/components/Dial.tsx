import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';

import { haptics } from '../haptics';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../tokens';
import { withAlpha } from '../utils/color';
import { dialValue } from './dialMath';
import { IconButton } from './IconButton';
import { Text } from './Text';

export type DialProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  /** How much one full turn adds (60 minutes, 12 glasses). It can turn more than once. */
  perTurn: number;
  step?: number;
  /** Under the number: "copos", "min". */
  unit: string;
  /** Spoken name: "Meta do dia". */
  label: string;
  /** The ring's color. */
  tone?: string;
  size?: number;
};

/**
 * A round dial for a goal: drag around the ring (it keeps turning past the top), or tap − / +.
 * Screen readers adjust it like a slider.
 */
export function Dial({
  value,
  onChange,
  min,
  max,
  perTurn,
  step = 1,
  unit,
  label,
  tone,
  size = 148,
}: DialProps) {
  const { colors } = useTheme();
  const color = tone ?? colors.accent;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const inTurn = value % perTurn === 0 && value > 0 ? 1 : (value % perTurn) / perTurn;
  const turns = Math.floor((value - 1) / perTurn);
  const angle = inTurn * 2 * Math.PI;
  const knob = {
    left: size / 2 + r * Math.sin(angle) - 11,
    top: size / 2 - r * Math.cos(angle) - 11,
  };
  // The value the drag started from, then the latest, so each move continues from it.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));
    if (clamped === latest.current) return;
    latest.current = clamped;
    haptics.selection();
    onChange(clamped);
  };
  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onUpdate: (e) =>
      set(dialValue({ x: e.x, y: e.y, size, current: latest.current, perTurn, min, max, step })),
  });

  return (
    <View style={styles.row}>
      <IconButton icon={Minus} label={`${label}: menos`} onPress={() => set(value - step)} />
      <GestureDetector gesture={pan}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value, text: `${value} ${unit}` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) =>
            set(value + (e.nativeEvent.actionName === 'increment' ? step : -step))
          }
          style={{ width: size, height: size }}
        >
          <Svg width={size} height={size} style={styles.ring}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={withAlpha(color, 0.18)}
              strokeWidth={stroke}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference * inTurn} ${circumference}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View
            pointerEvents="none"
            style={[
              styles.knob,
              knob,
              { backgroundColor: colors.textPrimary, shadowColor: colors.shadow },
            ]}
          />
          <View pointerEvents="none" style={styles.center}>
            <Text variant="display" style={styles.number}>
              {value}
            </Text>
            <Text variant="footnote" tone="secondary">
              {unit}
            </Text>
            {turns > 0 ? (
              <Text variant="caption" tone="tertiary">
                {turns + 1} voltas
              </Text>
            ) : null}
          </View>
        </View>
      </GestureDetector>
      <IconButton icon={Plus} label={`${label}: mais`} onPress={() => set(value + step)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  ring: { position: 'absolute' },
  knob: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontSize: 40, lineHeight: 44 },
});
