import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '../haptics';
import { useTheme } from '../theme/ThemeProvider';
import { fontFamily, radius, spacing, touchTarget } from '../tokens';
import { Text } from './Text';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Shown before the label, so the choice reads at a glance. */
  icon?: LucideIcon;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Describes the whole group, e.g. "Tema". */
  accessibilityLabel: string;
  /** Smaller, for a second row under the main one (e.g. Dia / Semana under Agenda). */
  compact?: boolean;
};

/** A small set of mutually exclusive options, e.g. System / Light / Dark. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  compact = false,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  // Narrow: only the chosen option keeps its icon, so every word still fits.
  const [narrow, setNarrow] = useState(false);

  return (
    <View
      onLayout={(e) => {
        const next = e.nativeEvent.layout.width / options.length < (compact ? 92 : 110);
        if (next !== narrow) setNarrow(next);
      }}
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
            aria-checked={selected}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(option.value);
            }}
            style={[
              styles.segment,
              compact && styles.compact,
              selected && [
                styles.selected,
                { backgroundColor: colors.surfaceRaised, shadowColor: colors.shadow },
              ],
            ]}
          >
            {option.icon && (selected || !narrow) ? (
              <option.icon
                size={compact ? 15 : 17}
                strokeWidth={selected ? 2.3 : 1.9}
                color={selected ? colors.textPrimary : colors.textSecondary}
              />
            ) : null}
            <Text
              variant={compact ? 'callout' : selected ? 'bodyStrong' : 'body'}
              style={compact && selected ? styles.strong : undefined}
              tone={selected ? 'primary' : 'secondary'}
              numberOfLines={1}
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
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  compact: { minHeight: 36, paddingHorizontal: spacing.sm },
  strong: { fontFamily: fontFamily.textBold },
  selected: {
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
