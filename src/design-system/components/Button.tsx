import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, touchTarget } from '../tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/**
 * `primary` is the main action, orange (Fase 6); `energy` is the same, kept for the places that
 * name it. `secondary` is a quiet gunmetal button, `ghost` a turquoise link. `deep` is the
 * primary button on a DeepSurface.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'deep' | 'energy' | 'danger';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  disabled?: boolean;
  /** Shows a spinner, blocks presses and announces "busy" to screen readers. */
  loading?: boolean;
  /** Stretch to the container width. */
  block?: boolean;
  accessibilityHint?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled = false,
  loading = false,
  block = false,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const palette = {
    // Fase 6: the main action is orange (laranja só na ação principal).
    primary: { background: colors.energy, pressed: colors.energyPressed, content: colors.onEnergy },
    secondary: {
      background: colors.surfacePressed,
      pressed: colors.border,
      content: colors.textPrimary,
    },
    ghost: { background: 'transparent', pressed: colors.accentSoft, content: colors.accent },
    deep: { background: colors.deepAccent, pressed: colors.onDeep, content: colors.onDeepAccent },
    energy: { background: colors.energy, pressed: colors.energyPressed, content: colors.onEnergy },
    danger: { background: 'transparent', pressed: colors.surfacePressed, content: colors.error },
  }[variant];

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      focusRadius={radius.md}
      style={[block && styles.block, inactive && !loading && styles.disabled]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.container,
            { backgroundColor: pressed ? palette.pressed : palette.background },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={palette.content} />
          ) : (
            <>
              {Icon ? <Icon size={18} color={palette.content} strokeWidth={2} /> : null}
              <Text variant="bodyStrong" style={{ color: palette.content }} numberOfLines={1}>
                {label}
              </Text>
            </>
          )}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  block: { alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
  container: {
    minHeight: touchTarget + 4,
    paddingHorizontal: spacing.xl,
    // Rounded corners, not a pill: the same family as the cards and the tab shape.
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
