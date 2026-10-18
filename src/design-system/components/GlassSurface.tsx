import { BlurView } from 'expo-blur';
import type { RefObject } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { depth as depthLevels, radius as radii, type DepthLevel } from '../tokens';

export type GlassSurfaceProps = ViewProps & {
  /** Higher levels use more blur and a stronger shadow. */
  depth?: Exclude<DepthLevel, 0>;
  radius?: keyof typeof radii;
  /** Android only: the BlurTargetView rendered behind this glass. */
  blurTarget?: RefObject<View | null>;
};

/**
 * Translucent material for chrome only: bars, sheets and floating controls.
 * Falls back to an almost-opaque surface when blur is unavailable (Android for now)
 * or when the user enabled "Reduce Transparency".
 */
export function GlassSurface({
  depth = 1,
  radius = 'xl',
  style,
  children,
  blurTarget,
  ...rest
}: GlassSurfaceProps) {
  const { colors, scheme, supportsBlur, reduceTransparency, experimentalAndroidBlur } = useTheme();
  const level = depthLevels[depth];
  const androidBlur = Platform.OS === 'android' && experimentalAndroidBlur && Boolean(blurTarget);
  const useBlur = (supportsBlur || androidBlur) && !reduceTransparency;
  const borderRadius = radii[radius];

  return (
    <View
      style={[
        {
          borderRadius,
          shadowColor: colors.shadow,
          shadowOpacity: level.shadowOpacity,
          shadowRadius: level.shadowRadius,
          shadowOffset: { width: 0, height: level.shadowRadius / 3 },
          elevation: level.elevation,
        },
        style,
      ]}
      {...rest}
    >
      <View style={[StyleSheet.absoluteFill, styles.clip, { borderRadius }]} pointerEvents="none">
        {useBlur ? (
          <BlurView
            intensity={level.blurIntensity}
            tint={scheme === 'dark' ? 'dark' : 'light'}
            blurTarget={androidBlur ? blurTarget : undefined}
            blurMethod={androidBlur ? 'dimezisBlurViewSdk31Plus' : undefined}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: useBlur ? colors.glass : colors.glassFallback,
              borderRadius,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.glassBorder,
            },
          ]}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
