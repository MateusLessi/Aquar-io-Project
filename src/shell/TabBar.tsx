import { TabTrigger } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type PressableProps,
} from 'react-native';
import { useEffect, type ReactNode } from 'react';
import Animated, {
  FadeIn,
  LinearTransition,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useSharedValue,
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
 * Phones: a deep-water track with one circle per destination. The active one opens into
 * a bright pill with its name. The coral drop beside it creates.
 */
export function TabBar({ destinations, activeName, onCreate, iconRotation = 0 }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const showAllLabels = fontScale >= LABELS_FONT_SCALE;
  const showsCreate = destinations.find((d) => d.name === activeName)?.showsCreate ?? false;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { bottom: insets.bottom + chrome.tabBarOffset }]}
    >
      <Animated.View layout={layoutTransition} style={styles.barWrap}>
        <DeepSurface radius="pill" style={styles.bar}>
          <View accessibilityRole="tablist" style={styles.tabs}>
            {destinations.map((destination) => (
              <TabTrigger key={destination.name} name={destination.name} asChild>
                <TabBarButton
                  icon={destination.icon}
                  label={destination.label}
                  showLabel={showAllLabels}
                  rotation={iconRotation}
                />
              </TabTrigger>
            ))}
          </View>
        </DeepSurface>
      </Animated.View>
      {showsCreate ? (
        <Animated.View entering={ZoomIn.springify()} exiting={ZoomOut.duration(150)}>
          <FloatingActionButton label="Nova tarefa" onPress={onCreate} />
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
  /** Injected by TabTrigger. */
  isFocused?: boolean;
};

function TabBarButton({
  icon: Icon,
  label,
  showLabel,
  rotation,
  isFocused = false,
  onPress,
  ...rest
}: TabBarButtonProps) {
  const { colors } = useTheme();
  // Sideways, names would read rotated: show icons only, turned upright.
  const labelVisible = (isFocused || showLabel) && rotation === 0;

  return (
    <Pressable
      {...rest}
      onPress={(event) => {
        if (!isFocused) haptics.selection();
        onPress?.(event);
      }}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      aria-selected={isFocused}
      style={[styles.button, isFocused && styles.buttonFocused]}
    >
      <Animated.View
        layout={layoutTransition}
        style={[
          styles.pill,
          labelVisible && styles.pillWithLabel,
          { backgroundColor: isFocused ? colors.deepAccent : colors.deepAccentSoft },
        ]}
      >
        <Upright rotation={rotation}>
          <Icon
            size={24}
            strokeWidth={isFocused ? 2.2 : 1.8}
            color={isFocused ? colors.onDeepAccent : colors.onDeep}
          />
        </Upright>
        {labelVisible ? (
          <Animated.View entering={FadeIn.duration(180)}>
            <Text
              variant="bodyStrong"
              tone={isFocused ? 'onDeepAccent' : 'onDeep'}
              numberOfLines={1}
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
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  button: { justifyContent: 'center' },
  buttonFocused: { flexShrink: 1 },
  pill: {
    height: 52,
    width: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pillWithLabel: { width: 'auto', paddingHorizontal: spacing.lg },
});
