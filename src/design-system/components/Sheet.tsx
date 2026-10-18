import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, springs, timings } from '../tokens';
import { GlassSurface } from './GlassSurface';
import { Text } from './Text';

/** Drag distance (pt) or velocity that dismisses the sheet. */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 1.1;
const MAX_WIDTH = 560;

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  testID?: string;
};

/**
 * A glass panel that rises from the bottom (depth 2).
 * Closes by tapping the backdrop, dragging the handle down, or the system back gesture.
 * On tablets and desktop it is centered with a maximum width.
 */
export function Sheet({ visible, onClose, title, children, testID }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  // Mount as soon as it becomes visible (state adjusted during render, not in an effect).
  if (visible && !mounted) setMounted(true);
  const offset = useSharedValue(screenHeight);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      offset.set(screenHeight);
      offset.set(withSpring(0, springs.gentle));
      backdrop.set(withTiming(1, timings.base));
    } else {
      backdrop.set(withTiming(0, timings.base));
      offset.set(
        withTiming(screenHeight, timings.base, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, screenHeight, offset, backdrop]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 4,
        onPanResponderMove: (_, gesture) => {
          offset.set(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
            onClose();
          } else {
            offset.set(withSpring(0, springs.gentle));
          }
        },
      }),
    [offset, onClose],
  );

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.get() }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root} testID={testID}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, backdropStyle]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          />
        </Animated.View>
        <Animated.View style={[styles.panelWrap, panelStyle]}>
          <GlassSurface
            depth={2}
            radius="xl"
            accessibilityViewIsModal
            style={[styles.panel, { paddingBottom: insets.bottom + spacing.xl }]}
          >
            <View {...panResponder.panHandlers} style={styles.handleArea}>
              <View style={[styles.handle, { backgroundColor: colors.textTertiary }]} />
            </View>
            {title ? (
              <Text variant="title2" style={styles.title}>
                {title}
              </Text>
            ) : null}
            {children}
          </GlassSurface>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  panelWrap: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  panel: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: spacing.xl,
  },
  handleArea: { alignItems: 'center', paddingVertical: spacing.md },
  handle: { width: 40, height: 5, borderRadius: radius.pill, opacity: 0.5 },
  title: { marginBottom: spacing.lg },
});
