import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius as radii } from '../tokens';

export type SurfaceProps = ViewProps & {
  radius?: keyof typeof radii;
  /** Lifts the card off the background with a soft shadow (no borders anywhere). */
  elevated?: boolean;
};

/**
 * Solid surface for content: lists and cards. It has no border: what sets it apart is a soft
 * shadow and the light of the water. In Crystal it is frosted glass over the aquarium.
 */
export function Surface({
  radius = 'lg',
  elevated = true,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const { colors, mode, supportsBlur, reduceTransparency, highContrast } = useTheme();
  const borderRadius = radii[radius];
  const glass = mode === 'crystal';
  const blur = glass && supportsBlur && !reduceTransparency;
  const background = glass && !blur ? colors.glassFallback : colors.surfaceRaised;

  return (
    <View
      style={[
        styles.base,
        { borderRadius },
        // Without blur the color goes on the card itself. A layer is only needed for real
        // frosted glass, and it sits behind the content: on the web, an absolutely positioned
        // layer would otherwise cover text fields.
        blur ? styles.stack : { backgroundColor: background },
        elevated ? shadowStyle(colors.cardShadow, colors.cardShadowOpacity) : null,
        highContrast ? { borderWidth: 1, borderColor: colors.border } : null,
        style,
      ]}
      {...rest}
    >
      {blur ? (
        <View
          style={[StyleSheet.absoluteFill, styles.behind, { borderRadius }]}
          pointerEvents="none"
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceRaised }]} />
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** A wide, soft shadow. `boxShadow` is not clipped by `overflow: hidden` on any platform. */
export function shadowStyle(color: string, opacity: number) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color)?.[1] ?? '000000';
  const n = parseInt(hex, 16);
  const rgba = `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
  return { boxShadow: `0px 10px 28px 0px ${rgba}` };
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  /** Its own stacking context, so the glass layer can sit behind the content. */
  stack: { zIndex: 0 },
  behind: { zIndex: -1, overflow: 'hidden' },
});
