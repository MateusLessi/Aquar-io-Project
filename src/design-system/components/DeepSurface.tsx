import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';
import { useSvgId } from '../theme/useSvgId';
import { radius as radii } from '../tokens';

export type DeepSurfaceProps = ViewProps & {
  radius?: keyof typeof radii;
};

/**
 * Deep water: a dark surface that gets darker towards the bottom, used for navigation
 * chrome that must stand out in both themes. Content on it uses the `onDeep*` tokens.
 */
export function DeepSurface({ radius = 'xl', style, children, ...rest }: DeepSurfaceProps) {
  const { colors } = useTheme();
  const deepId = useSvgId('deep');
  const borderRadius = radii[radius];

  return (
    <View
      style={[
        styles.shadow,
        { borderRadius, shadowColor: colors.shadow, backgroundColor: colors.deepBottom },
        style,
      ]}
      {...rest}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.clip,
          { borderRadius, borderColor: colors.deepBorder },
        ]}
      >
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={deepId} x1="0" y1="0" x2="0.35" y2="1">
              <Stop offset="0" stopColor={colors.deepTop} />
              <Stop offset="1" stopColor={colors.deepBottom} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${deepId})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  clip: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
});
