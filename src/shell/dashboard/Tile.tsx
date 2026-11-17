import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme, withAlpha } from '@/design-system';

/**
 * One dashboard block (Fase 4): the whole block opens its place, not only a link inside it.
 * Buttons inside it (a habit's check, a task's box) still work on their own. `plain` blocks
 * draw themselves (the tank); the others get the card here, so their own content is "bare".
 */
export function Tile({
  label,
  onPress,
  plain = false,
  fill = false,
  children,
}: {
  /** Stretch to the row (side by side with others); in a column it keeps its own height. */
  fill?: boolean;
  /** Where it goes, for screen readers: "Abrir Agenda". */
  label: string;
  onPress: () => void;
  plain?: boolean;
  children: ReactNode;
}) {
  const { colors, mode } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.tile,
        fill && styles.fill,
        !plain && [
          styles.card,
          {
            backgroundColor: colors.surfaceRaised,
            boxShadow: `0px 10px 26px 0px ${withAlpha(colors.cardShadow, mode === 'light' ? 0.12 : 0.35)}`,
          },
        ],
        { transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      {children}
      {plain ? null : (
        <View pointerEvents="none" style={styles.chevron}>
          <ChevronRight size={18} color={colors.textTertiary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { minWidth: 0 },
  fill: { flex: 1 },
  card: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md, overflow: 'hidden' },
  chevron: { position: 'absolute', top: spacing.lg, right: spacing.md },
});
