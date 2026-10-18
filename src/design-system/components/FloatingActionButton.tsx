import { Plus, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Circle, Stop } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';
import { useSvgId } from '../theme/useSvgId';
import { specular } from '../tokens';
import { PressableScale } from './PressableScale';

const SIZE = 64;

export type FloatingActionButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  testID?: string;
};

/** The main creation action: a drop of coral, the warm counterpart to the ocean. */
export function FloatingActionButton({
  label,
  onPress,
  icon: Icon = Plus,
  disabled = false,
  testID,
}: FloatingActionButtonProps) {
  const { colors } = useTheme();
  const bodyId = useSvgId('body');
  const specularId = useSvgId('specular');

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      focusRadius={SIZE / 2}
      scaleTo={0.9}
      style={[styles.shadow, { shadowColor: colors.energyPressed }, disabled && styles.disabled]}
    >
      <View style={styles.drop}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id={bodyId} cx="50%" cy="110%" r="90%">
              <Stop offset="0" stopColor={colors.energyPressed} />
              <Stop offset="0.75" stopColor={colors.energy} />
            </RadialGradient>
            <RadialGradient id={specularId} cx="34%" cy="24%" r="22%">
              <Stop offset="0" stopColor={specular} stopOpacity={0.35} />
              <Stop offset="1" stopColor={specular} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill={`url(#${bodyId})`} />
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill={`url(#${specularId})`} />
        </Svg>
        {/* Wrapped so it paints above the absolutely positioned gradient (web stacking). */}
        <View>
          <Icon size={28} strokeWidth={2.4} color={colors.onEnergy} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  shadow: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  drop: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
});
