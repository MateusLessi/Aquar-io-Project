import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '../haptics';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, touchTarget } from '../tokens';
import { Text } from './Text';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Describes the whole group, e.g. "Tema". */
  accessibilityLabel: string;
};

/** A small set of mutually exclusive options, e.g. System / Light / Dark. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: colors.surfacePressed }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(option.value);
            }}
            style={[
              styles.segment,
              selected && [
                styles.selected,
                { backgroundColor: colors.surfaceRaised, shadowColor: colors.shadow },
              ],
            ]}
          >
            <Text
              variant={selected ? 'bodyStrong' : 'body'}
              tone={selected ? 'primary' : 'secondary'}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.pill, padding: spacing.xs },
  segment: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  selected: {
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
