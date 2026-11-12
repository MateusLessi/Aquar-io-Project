import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { TabTrigger } from 'expo-router/ui';
import { Plus, type LucideIcon } from 'lucide-react-native';
import { Image, Pressable, ScrollView, StyleSheet, View, type PressableProps } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  DeepSurface,
  Text,
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

/**
 * Tablets in landscape and desktop: a floating deep-water sidebar. The Aquarium opens its
 * sections right under it; "Agora" shows what is on and the habit of the moment; you sit at
 * the bottom, with the gear to Ajustes. The profile is reached from there, not from a tab.
 */
export function Sidebar({ destinations, onCreate }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const { reduceMotion, colors } = useTheme();
  const sectionLine = withAlpha(colors.deepAccent, 0.3);
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
      <DeepSurface radius="xl" style={styles.panel}>
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
            {destinations
              .filter((d) => d.name !== 'profile')
              .map((destination) => (
                <View key={destination.name}>
                  <TabTrigger name={destination.name} asChild>
                    <SidebarItem icon={destination.icon} label={destination.label} />
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
  /** Injected by TabTrigger. */
  isFocused?: boolean;
};

function SidebarItem({ icon: Icon, label, isFocused = false, ...rest }: SidebarItemProps) {
  const { colors } = useTheme();
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
          backgroundColor: isFocused
            ? colors.deepAccent
            : pressed
              ? colors.deepAccentSoft
              : 'transparent',
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
        strokeWidth={isFocused ? 2.1 : 1.8}
        color={isFocused ? colors.onDeepAccent : colors.onDeepSecondary}
      />
      <Text
        variant={isFocused ? 'bodyStrong' : 'body'}
        tone={isFocused ? 'onDeepAccent' : 'onDeep'}
      >
        {label}
      </Text>
    </Pressable>
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
            ? colors.deepAccentSoft
            : pressed
              ? withAlpha(colors.onDeep, 0.06)
              : 'transparent',
        },
      ]}
    >
      <Icon size={17} color={selected ? colors.deepAccent : colors.onDeepSecondary} />
      <Text variant="callout" tone={selected ? 'onDeep' : 'onDeepSecondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: chrome.sidebarWidth, paddingLeft: spacing.md },
  panel: { flex: 1, padding: spacing.lg, paddingBottom: spacing.md },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  mascot: { width: 44, height: 44 },
  scroll: { flex: 1, marginTop: spacing.xl },
  scrollContent: { flexGrow: 1 },
  items: { gap: spacing.xs },
  sections: {
    marginLeft: spacing.xl,
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
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footer: { marginTop: 'auto', paddingTop: spacing.lg, gap: spacing.md },
});
