import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, touchTarget } from '../tokens';
import { PressableScale } from './PressableScale';

export type IconButtonProps = {
  icon: LucideIcon;
  /** Required: icon-only buttons must still be described to screen readers. */
  label: string;
  onPress?: () => void;
  variant?: 'plain' | 'tinted';
  selected?: boolean;
  disabled?: boolean;
  testID?: string;
};

export function IconButton({
  icon: Icon,
  label,
  onPress,
  variant = 'plain',
  selected = false,
  disabled = false,
  testID,
}: IconButtonProps) {
  const { colors } = useTheme();
  const active = selected || variant === 'tinted';

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      focusRadius={radius.pill}
      scaleTo={0.9}
      style={disabled && styles.disabled}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.container,
            { backgroundColor: active || pressed ? colors.accentSoft : 'transparent' },
          ]}
        >
          <Icon size={22} strokeWidth={1.8} color={active ? colors.accent : colors.textSecondary} />
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.4 },
  container: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
