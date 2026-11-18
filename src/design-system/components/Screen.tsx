import { ChevronLeft } from 'lucide-react-native';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chrome, spacing } from '../tokens';
import { useChromeInsets } from './ChromeInsets';
import { IconButton } from './IconButton';
import { OceanBackground } from './OceanBackground';
import { Text } from './Text';
import { Waterline } from './Waterline';

/** Lets something inside a screen bring itself into view (a setting found by search). */
export type ScreenScroll = {
  /** Scrolls so that a point measured with `measureInWindow` sits near the top. */
  revealWindowY: (windowY: number) => void;
};
const ScreenScrollContext = createContext<ScreenScroll | null>(null);
export const useScreenScroll = () => useContext(ScreenScrollContext);

/** Scroll distance over which the large title fades out. */
const COLLAPSE_END = 72;

export type ScreenProps = {
  title: string;
  /** Small line above the title, e.g. today's date. */
  eyebrow?: string;
  /** Shown under the title, e.g. a WaterLevel. */
  accessory?: ReactNode;
  children?: ReactNode;
  /** Shows a back button above the title. */
  onBack?: () => void;
  /** Buttons at the top right, e.g. "Editar lista". */
  actions?: ReactNode;
  /** Use the full width on large screens (dashboards); text-heavy screens keep a reading width. */
  wide?: boolean;
  /**
   * A bar under the title that stays at hand: when the content scrolls, it stops at the
   * top of the screen instead of leaving it (the Aquarium's sections).
   */
  stickyBar?: ReactNode;
  /**
   * Fill the window exactly, with no page scroll (Início on computers): the content gets the
   * height left under the title and lays itself out in it. A window too short for it still
   * scrolls, so nothing is squeezed.
   */
  fit?: boolean;
  testID?: string;
};

/**
 * A top-level screen: ocean background, large title at the surface and a waterline.
 * When the content scrolls, the large title simply fades away: no bar over the content.
 */
export function Screen({
  title,
  eyebrow,
  accessory,
  children,
  onBack,
  actions,
  wide = false,
  stickyBar,
  fit = false,
  testID,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const chromeInsets = useChromeInsets();
  const scrollY = useSharedValue(0);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const reveal = useMemo<ScreenScroll>(
    () => ({
      revealWindowY: (windowY) => {
        // Near the top, with a little air.
        const target = scrollY.get() + windowY - (insets.top + spacing.lg);
        scrollRef.current?.scrollTo({ y: Math.max(0, target), animated: true });
      },
    }),
    [scrollY, scrollRef, insets.top],
  );
  // Where the sticky bar starts in the content, and where it stops on screen.
  const [barY, setBarY] = useState(0);
  const contentTop = insets.top + spacing.xxl;
  // No bar over the content (it took too much room): the sticky bar stops at the very top.
  const stopAt = insets.top + spacing.sm;
  const stickyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(0, scrollY.get() - (contentTop + barY - stopAt)) }],
  }));

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, COLLAPSE_END], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(scrollY.get(), [-80, 0], [1.08, 1], Extrapolation.CLAMP) }],
  }));

  return (
    <OceanBackground>
      <Animated.ScrollView
        ref={scrollRef}
        testID={testID}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          {
            paddingTop: contentTop,
            paddingBottom: chromeInsets.bottom + (fit ? spacing.lg : spacing.xxxl),
          },
          fit && styles.grow,
        ]}
      >
        <View style={[styles.column, wide && styles.wide, fit && styles.fit]}>
          {onBack || actions ? (
            <View style={styles.toolbar}>
              {onBack ? (
                <IconButton icon={ChevronLeft} label="Voltar" onPress={onBack} />
              ) : (
                <View />
              )}
              <View style={styles.actions}>{actions}</View>
            </View>
          ) : null}
          <Animated.View style={[styles.header, largeTitleStyle]}>
            {eyebrow ? (
              <Text variant="footnote" tone="secondary" style={styles.eyebrow}>
                {eyebrow}
              </Text>
            ) : null}
            <Text variant="largeTitle">{title}</Text>
            {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
          </Animated.View>
          {stickyBar ? (
            <Animated.View
              onLayout={(e) => setBarY(e.nativeEvent.layout.y)}
              style={[styles.sticky, stickyStyle]}
            >
              {stickyBar}
            </Animated.View>
          ) : null}
          <Waterline />
          <ScreenScrollContext.Provider value={reveal}>
            <View style={[styles.body, fit && styles.fitBody]}>{children}</View>
          </ScreenScrollContext.Provider>
        </View>
      </Animated.ScrollView>
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
  wide: { maxWidth: chrome.contentMaxWidthWide },
  grow: { flexGrow: 1 },
  // Fit: the whole width of big monitors too, and the height left under the title.
  fit: { flex: 1, maxWidth: chrome.contentMaxWidthFit },
  fitBody: { flex: 1, minHeight: 460 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: -spacing.md,
  },
  actions: { flexDirection: 'row', gap: spacing.xs },
  header: { paddingHorizontal: spacing.xs, transformOrigin: 'left' },
  eyebrow: { marginBottom: spacing.xxs },
  accessory: { marginTop: spacing.md, flexDirection: 'row' },
  sticky: { marginTop: spacing.md, zIndex: 10, elevation: 10 },
  body: { marginTop: spacing.md, gap: spacing.lg },
});
