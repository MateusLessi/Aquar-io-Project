import { TabTrigger } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type PressableProps,
} from 'react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Animated, {
  FadeIn,
  LinearTransition,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DeepSurface,
  FloatingActionButton,
  Text,
  chrome,
  haptics,
  radius,
  spacing,
  springs,
  useTheme,
} from '@/design-system';

import type { Destination } from './destinations';

const layoutTransition = LinearTransition.springify()
  .damping(springs.responsive.damping)
  .stiffness(springs.responsive.stiffness);

/** From this OS text size on, every tab shows its name, not only the active one. */
const LABELS_FONT_SCALE = 1.3;

type TabBarProps = {
  destinations: Destination[];
  activeName: string | undefined;
  onCreate: () => void;
  /** Degrees to turn icons so they stay upright when the phone is held sideways. */
  iconRotation?: number;
};

/**
 * Phones: the deep-water capsule with the destinations side by side. Icons sit bare; the
 * active one gets a rounded highlight with its name, and the highlight slides from tab to
 * tab. The round button beside the capsule creates.
 */
export function TabBar({ destinations, activeName, onCreate, iconRotation = 0 }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const showAllLabels = fontScale >= LABELS_FONT_SCALE;
  const showsCreate = destinations.find((d) => d.name === activeName)?.showsCreate ?? false;

  // The highlight follows the active tab's measured box.
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const active = activeName ? layouts[activeName] : undefined;
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const placed = useRef(false);
  useEffect(() => {
    if (!active) return;
    if (!placed.current) {
      // First time: appear in place instead of sliding in from the edge.
      x.set(active.x);
      width.set(active.width);
      placed.current = true;
      return;
    }
    x.set(withSpring(active.x, springs.responsive));
    width.set(withSpring(active.width, springs.responsive));
  }, [active, x, width]);
  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
    width: width.get(),
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { bottom: insets.bottom + chrome.tabBarOffset }]}
    >
      <Animated.View layout={layoutTransition} style={styles.barWrap}>
        <DeepSurface radius="pill" style={styles.bar}>
          <View accessibilityRole="tablist" style={styles.tabs}>
            {active ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.highlight,
                  { backgroundColor: colors.deepAccentSoft, borderColor: colors.deepAccent },
                  highlightStyle,
                ]}
              />
            ) : null}
            {destinations.map((destination) => (
              <TabTrigger key={destination.name} name={destination.name} asChild>
                <TabBarButton
                  icon={destination.icon}
                  label={destination.label}
                  showLabel={showAllLabels}
                  rotation={iconRotation}
                  onMeasure={(box) =>
                    setLayouts((current) =>
                      current[destination.name]?.x === box.x &&
                      current[destination.name]?.width === box.width
                        ? current
                        : { ...current, [destination.name]: box },
                    )
                  }
                />
              </TabTrigger>
            ))}
          </View>
        </DeepSurface>
      </Animated.View>
      {showsCreate ? (
        <Animated.View entering={ZoomIn.springify()} exiting={ZoomOut.duration(150)}>
          <FloatingActionButton label="Criar" onPress={onCreate} />
        </Animated.View>
      ) : null}
    </View>
  );
}

type TabBarButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: LucideIcon;
  label: string;
  /** Show the name even when not focused (large OS text sizes). */
  showLabel: boolean;
  rotation: number;
  onMeasure: (box: { x: number; width: number }) => void;
  /** Injected by TabTrigger. */
  isFocused?: boolean;
};

function TabBarButton({
  icon: Icon,
  label,
  showLabel,
  rotation,
  onMeasure,
  isFocused = false,
  onPress,
  ...rest
}: TabBarButtonProps) {
  const { colors } = useTheme();
  // Sideways, names would read rotated: show icons only, turned upright.
  const labelVisible = (isFocused || showLabel) && rotation === 0;
  const press = useSharedValue(1);
  const hop = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // A small hop when the tab becomes active.
    if (isFocused)
      hop.set(withSequence(withSpring(1.22, springs.responsive), withSpring(1, springs.buoyant)));
  }, [isFocused, hop]);

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.get() }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: hop.get() }] }));

  return (
    <Pressable
      {...rest}
      onPress={(event) => {
        if (!isFocused) haptics.selection();
        onPress?.(event);
      }}
      onPressIn={() => press.set(withSpring(0.9, springs.responsive))}
      onPressOut={() => press.set(withSpring(1, springs.buoyant))}
      onLayout={(event) =>
        onMeasure({ x: event.nativeEvent.layout.x, width: event.nativeEvent.layout.width })
      }
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      aria-selected={isFocused}
      style={[styles.button, labelVisible && styles.buttonWithLabel]}
    >
      <Animated.View layout={layoutTransition} style={[styles.item, pressStyle]}>
        <Animated.View style={iconStyle}>
          <Upright rotation={rotation}>
            <Icon
              size={24}
              strokeWidth={isFocused ? 2.3 : 1.8}
              color={isFocused ? colors.deepAccent : colors.onDeepSecondary}
            />
          </Upright>
        </Animated.View>
        {labelVisible ? (
          <Animated.View entering={FadeIn.duration(200)}>
            <Text
              variant="bodyStrong"
              numberOfLines={1}
              style={{ color: isFocused ? colors.deepAccent : colors.onDeepSecondary }}
            >
              {label}
            </Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

/** Turns its content with a spring, like icons in a camera app when the phone rotates. */
function Upright({ rotation, children }: { rotation: number; children: ReactNode }) {
  const angle = useSharedValue(rotation);
  useEffect(() => {
    angle.set(withSpring(rotation, springs.gentle));
  }, [angle, rotation]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  barWrap: { flex: 1 },
  bar: { height: chrome.tabBarHeight, justifyContent: 'center', paddingHorizontal: 10 },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  highlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  button: { height: 52, minWidth: 52, justifyContent: 'center', alignItems: 'center' },
  buttonWithLabel: { paddingHorizontal: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
