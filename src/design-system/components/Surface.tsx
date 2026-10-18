import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius as radii } from '../tokens';

export type SurfaceProps = ViewProps & {
  radius?: keyof typeof radii;
};

/** Solid surface for content. Lists and cards live here, never on glass. */
export function Surface({ radius = 'lg', style, ...rest }: SurfaceProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.surfaceRaised, borderRadius: radii[radius] },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
