import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, touchTarget } from '../tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/** `deep` is the primary button for use on a DeepSurface. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'deep';

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
    primary: { background: colors.accent, pressed: colors.accentPressed, content: colors.onAccent },
    secondary: {
      background: colors.accentSoft,
      pressed: colors.accentSoft,
      content: colors.accent,
    },
    ghost: { background: 'transparent', pressed: colors.accentSoft, content: colors.accent },
    deep: { background: colors.deepAccent, pressed: colors.onDeep, content: colors.onDeepAccent },
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
      focusRadius={radius.pill}
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
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
