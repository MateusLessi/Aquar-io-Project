import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Grid,
  Text,
  colorsFor,
  haptics,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  type ThemeMode,
  type ThemePreference,
} from '@/design-system';

/** Each theme's own colors (its background, accent and action), taken from the theme itself. */
function preview(mode: ThemeMode): string[] {
  const c = colorsFor(mode, 'surface');
  if (mode === 'midnight') return [c.surfaceRaised, c.deepBottom, c.energy, c.deepAccent];
  if (mode === 'crystal') return [c.surfaceBase, c.accent, c.textPrimary];
  return [c.surfaceBase, c.accent, c.energy];
}

const themes: { value: ThemePreference; label: string; swatch: string[]; note?: string }[] = [
  {
    value: 'system',
    label: 'Sistema',
    swatch: [colorsFor('light', 'surface').surfaceBase, colorsFor('dark', 'surface').surfaceBase],
  },
  { value: 'light', label: 'Claro', swatch: preview('light') },
  { value: 'dark', label: 'Escuro', swatch: preview('dark') },
  { value: 'crystal', label: 'Crystal', swatch: preview('crystal') },
  { value: 'midnight', label: 'Meia-noite', swatch: preview('midnight'), note: 'Em teste' },
];

/**
 * The theme as small cards with a preview of their colors (Fase 6: five themes no longer fit a
 * segmented control on phones, and seeing the colors helps when trying new looks).
 */
export function ThemePicker() {
  const { preference, setPreference, colors } = useTheme();
  const compact = useBreakpoint() === 'compact';
  return (
    <Grid columns={compact ? 3 : 5} gap={spacing.sm} accessibilityRole="radiogroup">
      {themes.map((theme) => {
        const selected = theme.value === preference;
        return (
          <Pressable
            key={theme.value}
            accessibilityRole="radio"
            accessibilityLabel={
              theme.note ? `${theme.label}, ${theme.note.toLowerCase()}` : theme.label
            }
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              setPreference(theme.value);
            }}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: selected ? colors.accentSoft : colors.surfacePressed,
                borderColor: selected ? colors.accent : 'transparent',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.swatch}>
              {theme.swatch.map((color) => (
                <View key={color} style={[styles.band, { backgroundColor: color }]} />
              ))}
              {selected ? (
                <View style={[styles.check, { backgroundColor: colors.accent }]}>
                  <Check size={12} strokeWidth={3} color={colors.onAccent} />
                </View>
              ) : null}
            </View>
            <Text variant={selected ? 'bodyStrong' : 'callout'} numberOfLines={1}>
              {theme.label}
            </Text>
            {theme.note ? (
              <Text variant="caption" tone="tertiary" numberOfLines={1}>
                {theme.note}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </Grid>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.sm,
    gap: spacing.xs,
    minHeight: 96,
  },
  swatch: {
    height: 40,
    borderRadius: radius.md,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  band: { flex: 1 },
  check: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
