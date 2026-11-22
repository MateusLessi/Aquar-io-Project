import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { TabTrigger } from 'expo-router/ui';
import { Plus, type LucideIcon } from 'lucide-react-native';
import { Image, Pressable, ScrollView, StyleSheet, View, type PressableProps } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, {
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  DeepSurface,
  Text,
  panelColor,
  springs,
  chrome,
  haptics,
  radius,
  spacing,
  useKeyboardFocus,
  useTheme,
  withAlpha,
} from '@/design-system';

import { aquariumTab, aquariumTabs } from './aquarium/AquariumScreen';
import type { Destination } from './destinations';
import { NowCard } from './nav/NowCard';
import { ProfileChip } from './nav/ProfileChip';

const mascot = require('@/design-system/assets/mascot.png');

type SidebarProps = {
  destinations: Destination[];
  onCreate: () => void;
};

const ITEM_HEIGHT = 48;
/** The inward curves that join the active item to the content panel. */
const NOTCH = 18;

/**
 * Tablets in landscape and desktop: a floating deep-water card beside the content panel (Fase 5,
 * from the reference). The panel passes under the card, so its round corners show the panel's
 * color; the active item is a solid piece in that color that reaches into it, with inward
 * curves, and slides to the item you pick. The Aquarium opens its
 * sections right under it; "Agora" shows what is on and the habit of the moment; you sit at
 * the bottom, with the gear to Ajustes. The profile is reached from there, not from a tab.
 */
export function Sidebar({ destinations, onCreate }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const { reduceMotion, colors } = useTheme();
  const sectionLine = withAlpha(colors.onDeep, 0.25);
  const piece = panelColor(colors);
  // Where each item sits, so the active piece can slide to it.
  const [rows, setRows] = useState<Record<string, number>>({});
  const [active, setActive] = useState<string | null>(null);
  const top = useSharedValue(-1);
  const target = active ? rows[active] : undefined;
  useEffect(() => {
    if (target === undefined) return;
    top.set(top.get() < 0 || reduceMotion ? target : withSpring(target, springs.responsive));
  }, [target, top, reduceMotion]);
  const pieceStyle = useAnimatedStyle(() => ({
    opacity: top.get() < 0 ? 0 : 1,
    transform: [{ translateY: Math.max(0, top.get()) }],
  }));
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ tab?: string }>();
  const inAquarium = pathname === '/aquarium' || pathname.startsWith('/aquarium/');
  const section = pathname === '/aquarium' ? aquariumTab(params.tab) : null;

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
      ]}
    >
      <DeepSurface radius="xl" sheen style={styles.panel}>
        <View style={styles.brand}>
          <Image source={mascot} style={styles.mascot} accessibilityIgnoresInvertColors />
          <View>
            <Text variant="title1" tone="onDeep">
              Aquar.io
            </Text>
            <Text variant="footnote" tone="onDeepSecondary">
              Tudo importa.
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View accessibilityRole="tablist" style={styles.items}>
            {/* The active piece, under the items: the panel's color, reaching into it. */}
            <Animated.View
              pointerEvents="none"
              style={[styles.piece, { backgroundColor: piece }, pieceStyle]}
            >
              <Notch color={piece} side="top" />
              <Notch color={piece} side="bottom" />
            </Animated.View>
            {destinations
              .filter((d) => d.name !== 'profile')
              .map((destination) => (
                <View
                  key={destination.name}
                  onLayout={(e) => {
                    const y = e.nativeEvent.layout.y;
                    setRows((r) =>
                      r[destination.name] === y ? r : { ...r, [destination.name]: y },
                    );
                  }}
                >
                  <TabTrigger name={destination.name} asChild>
                    <SidebarItem
                      icon={destination.icon}
                      label={destination.label}
                      onActive={() => setActive(destination.name)}
                    />
                  </TabTrigger>
                  {destination.name === 'aquarium' && inAquarium ? (
                    <Animated.View
                      entering={reduceMotion ? undefined : FadeInUp.springify().damping(18)}
                      exiting={reduceMotion ? undefined : FadeOut.duration(120)}
                      style={[styles.sections, { borderLeftColor: sectionLine }]}
                    >
                      {aquariumTabs.map((tab) => (
                        <SectionItem
                          key={tab.value}
                          icon={tab.icon}
                          label={tab.label}
                          selected={section === tab.value}
                          tab={tab.value}
                        />
                      ))}
                    </Animated.View>
                  ) : null}
                </View>
              ))}
          </View>

          <View style={styles.footer}>
            <NowCard />
            <Button label="Criar" variant="energy" icon={Plus} block onPress={onCreate} />
            <ProfileChip />
          </View>
        </ScrollView>
      </DeepSurface>
    </View>
  );
}

type SidebarItemProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: LucideIcon;
  label: string;
  /** Tells the sidebar this item became the active one (to move the piece). */
  onActive: () => void;
  /** Injected by TabTrigger. */
  isFocused?: boolean;
};

function SidebarItem({
  icon: Icon,
  label,
  isFocused = false,
  onActive,
  ...rest
}: SidebarItemProps) {
  const { colors } = useTheme();
  useEffect(() => {
    if (isFocused) onActive();
  }, [isFocused, onActive]);
  const { focused: keyboardFocused, handlers: focus } = useKeyboardFocus();

  return (
    <Pressable
      {...rest}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      aria-selected={isFocused}
      onPressIn={focus.onPressIn}
      onPressOut={focus.onPressOut}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: !isFocused && pressed ? withAlpha(colors.onDeep, 0.08) : 'transparent',
        },
        keyboardFocused && {
          outlineColor: colors.energy,
          outlineWidth: 2,
          outlineStyle: 'solid',
        },
      ]}
    >
      <Icon
        size={22}
        strokeWidth={isFocused ? 2.2 : 1.8}
        color={isFocused ? colors.textPrimary : colors.onDeepSecondary}
      />
      {/* On the active piece (the panel's color), the panel's text color. */}
      <Text variant={isFocused ? 'bodyStrong' : 'body'} tone={isFocused ? 'primary' : 'onDeep'}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * An inward curve at the panel's edge, above or below the active piece: a square in the
 * piece's color minus a quarter circle, so the piece flows into the panel.
 */
function Notch({ color, side }: { color: string; side: 'top' | 'bottom' }) {
  const d =
    side === 'top'
      ? `M ${NOTCH} 0 L ${NOTCH} ${NOTCH} L 0 ${NOTCH} A ${NOTCH} ${NOTCH} 0 0 0 ${NOTCH} 0 Z`
      : `M ${NOTCH} ${NOTCH} L ${NOTCH} 0 L 0 0 A ${NOTCH} ${NOTCH} 0 0 1 ${NOTCH} ${NOTCH} Z`;
  return (
    <Svg
      width={NOTCH}
      height={NOTCH}
      style={[styles.notch, side === 'top' ? { top: -NOTCH } : { bottom: -NOTCH }]}
    >
      <Path d={d} fill={color} />
    </Svg>
  );
}

/** One of the Aquarium's sections, under it in the sidebar. */
function SectionItem({
  icon: Icon,
  label,
  selected,
  tab,
}: {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  tab: string;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        if (!selected) haptics.selection();
        router.navigate({ pathname: '/aquarium', params: { tab } });
      }}
      accessibilityRole="link"
      accessibilityLabel={`Aquário: ${label}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.section,
        {
          backgroundColor: selected
            ? withAlpha(colors.onDeep, 0.14)
            : pressed
              ? withAlpha(colors.onDeep, 0.06)
              : 'transparent',
        },
      ]}
    >
      <Icon size={17} color={selected ? colors.onDeep : colors.onDeepSecondary} />
      <Text variant="callout" tone={selected ? 'onDeep' : 'onDeepSecondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Above the content panel, which passes under the card's right corners.
  root: { width: chrome.sidebarWidth, paddingLeft: spacing.md, zIndex: 1 },
  // A floating card, round on all corners. No padding on the right: the active piece reaches
  // its edge, where the content panel (passing under the card) shows the same color.
  panel: {
    flex: 1,
    paddingLeft: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  piece: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: ITEM_HEIGHT,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  notch: { position: 'absolute', right: 0 },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingRight: spacing.lg,
  },
  mascot: { width: 44, height: 44 },
  // Room above the first item for the active piece's upper curve.
  scroll: { flex: 1, marginTop: spacing.sm },
  scrollContent: { flexGrow: 1, paddingTop: NOTCH + spacing.xs },
  items: { gap: spacing.xs },
  sections: {
    marginLeft: spacing.xl,
    marginRight: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    gap: 2,
  },
  section: {
    minHeight: 38,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  item: {
    height: ITEM_HEIGHT,
    marginRight: spacing.lg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footer: { marginTop: 'auto', paddingTop: spacing.lg, paddingRight: spacing.lg, gap: spacing.md },
});
