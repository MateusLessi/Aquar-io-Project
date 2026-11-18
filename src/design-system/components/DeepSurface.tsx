import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';
import { useSvgId } from '../theme/useSvgId';
import { radius as radii } from '../tokens';

export type DeepSurfaceProps = ViewProps & {
  radius?: keyof typeof radii;
  /** Round only the left corners (the sidebar, whose right edge meets the content panel). */
  corners?: 'all' | 'left';
  /** A soft glass sheen from the top (the sidebar, from the reference). */
  sheen?: boolean;
};

/**
 * Deep water: a dark surface that gets darker towards the bottom, used for navigation
 * chrome that must stand out in both themes. Content on it uses the `onDeep*` tokens.
 */
export function DeepSurface({
  radius = 'xl',
  corners = 'all',
  sheen = false,
  style,
  children,
  ...rest
}: DeepSurfaceProps) {
  const { colors, highContrast } = useTheme();
  const deepId = useSvgId('deep');
  const sheenId = useSvgId('sheen');
  const r = radii[radius];
  const round =
    corners === 'left'
      ? {
          borderTopLeftRadius: r,
          borderBottomLeftRadius: r,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }
      : { borderRadius: r };

  return (
    <View
      style={[
        styles.shadow,
        { ...round, shadowColor: colors.shadow, backgroundColor: colors.deepBottom },
        style,
      ]}
      {...rest}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.clip,
          { ...round, borderColor: colors.deepBorder, borderWidth: highContrast ? 1 : 0 },
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
        {sheen ? (
          <Svg
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <LinearGradient id={sheenId} x1="0" y1="0" x2="0.6" y2="1">
                <Stop offset="0" stopColor={colors.onDeep} stopOpacity={0.14} />
                <Stop offset="0.55" stopColor={colors.onDeep} stopOpacity={0.03} />
                <Stop offset="1" stopColor={colors.onDeep} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${sheenId})`} />
          </Svg>
        ) : null}
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
  clip: { overflow: 'hidden' },
});
