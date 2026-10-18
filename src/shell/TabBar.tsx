import { TabTrigger } from 'expo-router/ui';
import type { LucideIcon } from 'lucide-react-native';
import type { RefObject } from 'react';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import Animated, { FadeIn, LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FloatingActionButton,
  GlassSurface,
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

type TabBarProps = {
  destinations: Destination[];
  activeName: string | undefined;
  onCreate: () => void;
  blurTarget: RefObject<View | null>;
};

/** Phones: a floating glass bar with the destinations, plus the drop-shaped create button. */
export function TabBar({ destinations, activeName, onCreate, blurTarget }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const showsCreate = destinations.find((d) => d.name === activeName)?.showsCreate ?? false;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { bottom: insets.bottom + chrome.tabBarOffset }]}
    >
      <Animated.View layout={layoutTransition} style={styles.barWrap}>
        <GlassSurface depth={1} radius="pill" blurTarget={blurTarget} style={styles.bar}>
          <View accessibilityRole="tablist" style={styles.tabs}>
            {destinations.map((destination) => (
              <TabTrigger key={destination.name} name={destination.name} asChild>
                <TabBarButton icon={destination.icon} label={destination.label} />
              </TabTrigger>
            ))}
          </View>
        </GlassSurface>
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
  /** Injected by TabTrigger. */
  isFocused?: boolean;
};

function TabBarButton({
  icon: Icon,
  label,
  isFocused = false,
  onPress,
  ...rest
}: TabBarButtonProps) {
  const { colors } = useTheme();

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
      style={styles.button}
    >
      <Animated.View
        layout={layoutTransition}
        style={[styles.pill, isFocused && { backgroundColor: colors.accentSoft }]}
      >
        <Icon
          size={24}
          strokeWidth={isFocused ? 2.1 : 1.8}
          color={isFocused ? colors.accent : colors.textSecondary}
        />
        {isFocused ? (
          <Animated.View entering={FadeIn.duration(180)}>
            <Text variant="bodyStrong" tone="accent" numberOfLines={1}>
              {label}
            </Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
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
  bar: { height: chrome.tabBarHeight, justifyContent: 'center', paddingHorizontal: spacing.sm },
  tabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  button: { minHeight: 56, justifyContent: 'center' },
  pill: {
    height: 52,
    minWidth: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
