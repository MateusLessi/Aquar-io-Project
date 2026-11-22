import { Plus, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../tokens';
import { PressableScale } from './PressableScale';

const SIZE = 60;

export type FloatingActionButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  testID?: string;
};

/**
 * The main creation action (Fase 6): an orange rounded square, the warm counterpart to the
 * water. Orange is kept for the main action only.
 */
export function FloatingActionButton({
  label,
  onPress,
  icon: Icon = Plus,
  disabled = false,
  testID,
}: FloatingActionButtonProps) {
  const { colors } = useTheme();

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      focusRadius={radius.lg}
      scaleTo={0.9}
      style={[styles.shadow, { shadowColor: colors.energy }, disabled && styles.disabled]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.button,
            { backgroundColor: pressed ? colors.energyPressed : colors.energy },
          ]}
        >
          <Icon size={28} strokeWidth={2.6} color={colors.onEnergy} />
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  shadow: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.lg,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.lg - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
});
