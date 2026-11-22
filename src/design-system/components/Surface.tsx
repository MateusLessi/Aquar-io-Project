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
 * shadow and the light of the water.
 */
export function Surface({
  radius = 'lg',
  elevated = true,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const { colors, highContrast } = useTheme();
  const borderRadius = radii[radius];

  return (
    <View
      style={[
        styles.base,
        { borderRadius, backgroundColor: colors.surfaceRaised },
        elevated ? shadowStyle(colors.cardShadow, colors.cardShadowOpacity) : null,
        highContrast ? { borderWidth: 1, borderColor: colors.border } : null,
        style,
      ]}
      {...rest}
    >
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
});
