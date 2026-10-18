import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';

const HEIGHT = 18;

/** A gentle wave separating the surface (header) from submerged content. Decorative. */
export function Waterline() {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const mid = HEIGHT / 2;

  const d =
    `M0 ${mid} C ${width * 0.11} ${mid - 6}, ${width * 0.22} ${mid - 6}, ${width / 3} ${mid} ` +
    `S ${width * 0.56} ${mid + 6}, ${width * (2 / 3)} ${mid} ` +
    `S ${width * 0.89} ${mid - 6}, ${width} ${mid}`;

  return (
    <View
      style={{ height: HEIGHT }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          <Path d={d} stroke={colors.waterline} strokeWidth={1.5} fill="none" />
        </Svg>
      ) : null}
    </View>
  );
}
