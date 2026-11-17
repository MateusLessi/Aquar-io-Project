import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { radius, spacing, useTheme, withAlpha } from '@/design-system';

/**
 * One dashboard block (Fase 4): the whole block opens its place, not only a link inside it.
 * Buttons inside it (a habit's check, a task's box) still work on their own.
 *
 * A button can't hold other buttons (HTML forbids it, and screen readers would lump them
 * together). So a block with buttons inside is a plain pressable area, and its corner arrow is
 * the real button, with the name ("Abrir hábitos"). `plain` blocks have nothing to press inside
 * (the tank), so the whole block is the button.
 */
export function Tile({
  label,
  onPress,
  plain = false,
  fill = false,
  children,
}: {
  /** Where it goes: "Abrir hábitos". */
  label: string;
  onPress: () => void;
  /** Draws itself and has no buttons inside (the tank). */
  plain?: boolean;
  /** Stretch to the row (side by side with others); in a column it keeps its own height. */
  fill?: boolean;
  children: ReactNode;
}) {
  const { colors, mode } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      // Only a block with nothing to press inside is itself the button.
      accessible={plain}
      accessibilityRole={plain ? 'button' : undefined}
      accessibilityLabel={plain ? label : undefined}
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
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={8}
          style={({ pressed }) => [
            styles.chevron,
            { backgroundColor: pressed ? colors.surfacePressed : 'transparent' },
          ]}
        >
          <ChevronRight size={18} color={colors.textTertiary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { minWidth: 0 },
  fill: { flex: 1 },
  card: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md, overflow: 'hidden' },
  chevron: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
