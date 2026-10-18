import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chrome, spacing } from '../tokens';
import { useChromeInsets } from './ChromeInsets';
import { GlassSurface } from './GlassSurface';
import { OceanBackground } from './OceanBackground';
import { Text } from './Text';
import { Waterline } from './Waterline';

/** Scroll distance over which the large title hands over to the compact header. */
const COLLAPSE_START = 32;
const COLLAPSE_END = 72;

export type ScreenProps = {
  title: string;
  /** Small line above the title, e.g. today's date. */
  eyebrow?: string;
  /** Shown under the title, e.g. a WaterLevel. */
  accessory?: ReactNode;
  children?: ReactNode;
  testID?: string;
};

/**
 * A top-level screen: ocean background, large title at the surface and a waterline.
 * When the content scrolls, the large title gives way to a compact glass header.
 */
export function Screen({ title, eyebrow, accessory, children, testID }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const chromeInsets = useChromeInsets();
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  const compactHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.get(),
      [COLLAPSE_START, COLLAPSE_END],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, COLLAPSE_END], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(scrollY.get(), [-80, 0], [1.08, 1], Extrapolation.CLAMP) }],
  }));

  return (
    <OceanBackground>
      <Animated.ScrollView
        testID={testID}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.xxl,
          paddingBottom: chromeInsets.bottom + spacing.xxxl,
        }}
      >
        <View style={styles.column}>
          <Animated.View style={[styles.header, largeTitleStyle]}>
            {eyebrow ? (
              <Text variant="footnote" tone="secondary" style={styles.eyebrow}>
                {eyebrow}
              </Text>
            ) : null}
            <Text variant="largeTitle">{title}</Text>
            {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
          </Animated.View>
          <Waterline />
          <View style={styles.body}>{children}</View>
        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.compactHeader, compactHeaderStyle]}
      >
        <GlassSurface
          depth={1}
          radius="none"
          style={[
            styles.compactGlass,
            { paddingTop: insets.top, height: insets.top + chrome.compactHeaderHeight },
          ]}
        >
          <Text variant="headline" numberOfLines={1}>
            {title}
          </Text>
        </GlassSurface>
      </Animated.View>
    </OceanBackground>
  );
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    maxWidth: chrome.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: { paddingHorizontal: spacing.xs, transformOrigin: 'left' },
  eyebrow: { marginBottom: spacing.xxs },
  accessory: { marginTop: spacing.md, flexDirection: 'row' },
  body: { marginTop: spacing.md, gap: spacing.lg },
  compactHeader: { position: 'absolute', top: 0, left: 0, right: 0 },
  compactGlass: { alignItems: 'center', justifyContent: 'center' },
});
