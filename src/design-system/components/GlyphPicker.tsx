import { Pressable, StyleSheet, View } from 'react-native';

import { Glyph, glyphNames, type GlyphKey } from '../glyphs';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../tokens';

export type GlyphPickerProps = {
  options: readonly GlyphKey[];
  value: string | null;
  onChange: (value: GlyphKey | null) => void;
  /** Tapping the chosen icon again clears it. */
  allowNone?: boolean;
};

/** A row of icons to choose from: the chosen one fills with the accent. */
export function GlyphPicker({ options, value, onChange, allowNone = true }: GlyphPickerProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(selected && allowNone ? null : option)}
            accessibilityRole="button"
            accessibilityLabel={`Ícone ${glyphNames[option]}`}
            accessibilityState={{ selected }}
            aria-selected={selected}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected
                  ? colors.accent
                  : pressed
                    ? colors.surfacePressed
                    : colors.waterline,
              },
            ]}
          >
            <Glyph
              name={option}
              size={22}
              color={selected ? colors.onAccent : colors.textSecondary}
              strokeWidth={selected ? 2.3 : 1.9}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
