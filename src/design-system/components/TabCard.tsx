import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { radius as radii } from '../tokens';

/** How tall the tab is, above the card's body. */
export const TAB_HEIGHT = 20;

/**
 * The outline of the brand shape (Fase 6, "a aba"): a rounded card whose right part rises into
 * a tab, with a soft S-curve where it steps up. Drawn for the real size, so the curves never
 * stretch. Starts at `tabFrom` (0–1 of the width).
 */
export function tabPath(
  width: number,
  height: number,
  { tab = TAB_HEIGHT, corner = radii.lg, tabFrom = 0.46 } = {},
): string {
  const r = Math.min(corner, (height - tab) / 2, width / 4);
  const x = Math.max(r * 2, Math.min(width - r * 2, width * tabFrom));
  // The step up: a smooth S from the body's top edge to the tab's top edge.
  const step = Math.min(18, tab);
  const n = (v: number) => Math.round(v * 100) / 100;
  return [
    `M${n(r)},${n(tab)}`,
    `L${n(x - step)},${n(tab)}`,
    `C${n(x - step / 3)},${n(tab)} ${n(x - step / 3)},0 ${n(x + step / 2)},0`,
    `L${n(width - r)},0`,
    `Q${n(width)},0 ${n(width)},${n(r)}`,
    `L${n(width)},${n(height - r)}`,
    `Q${n(width)},${n(height)} ${n(width - r)},${n(height)}`,
    `L${n(r)},${n(height)}`,
    `Q0,${n(height)} 0,${n(height - r)}`,
    `L0,${n(tab + r)}`,
    `Q0,${n(tab)} ${n(r)},${n(tab)}`,
    'Z',
  ].join(' ');
}

export type TabCardProps = {
  /** The card's color: it is filled, not outlined. */
  color: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Where the tab starts, 0–1 of the width (default a little before the middle). */
  tabFrom?: number;
};

/**
 * The brand shape (Fase 6): a card with a tab on top, like a folder. Folders use it, and the
 * same curve shows in the sidebar and the Aquarium's tabs. The content starts below the tab.
 */
export function TabCard({ color, children, style, tabFrom }: TabCardProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <View
      style={[styles.card, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (Math.abs(width - size.width) > 0.5 || Math.abs(height - size.height) > 0.5)
          setSize({ width, height });
      }}
    >
      {size.width > 0 ? (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Path d={tabPath(size.width, size.height, { tabFrom })} fill={color} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingTop: TAB_HEIGHT },
});
