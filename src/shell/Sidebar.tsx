import { TabTrigger } from 'expo-router/ui';
import { Plus, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  DeepSurface,
  Text,
  chrome,
  radius,
  spacing,
  useKeyboardFocus,
  useTheme,
} from '@/design-system';

import type { Destination } from './destinations';

type SidebarProps = {
  destinations: Destination[];
  onCreate: () => void;
};

/** Tablets and desktop: a floating deep-water sidebar that stands out in both themes. */
export function Sidebar({ destinations, onCreate }: SidebarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
      ]}
    >
      <DeepSurface radius="xl" style={styles.panel}>
        <View style={styles.brand}>
          <Text variant="title1" tone="onDeep">
            Aquar.io
          </Text>
          <Text variant="footnote" tone="onDeepSecondary">
            Tudo importa.
          </Text>
        </View>

        <View accessibilityRole="tablist" style={styles.items}>
          {destinations.map((destination) => (
            <TabTrigger key={destination.name} name={destination.name} asChild>
              <SidebarItem icon={destination.icon} label={destination.label} />
            </TabTrigger>
          ))}
        </View>

        <View style={styles.footer}>
          <Button label="Nova tarefa" variant="deep" icon={Plus} block onPress={onCreate} />
        </View>
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
      onPressIn={focus.onPressIn}
      onPressOut={focus.onPressOut}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      style={({ pressed }) => [
        styles.item,
        (isFocused || pressed) && { backgroundColor: colors.accentSoft },
        keyboardFocused && {
          outlineColor: colors.focusRing,
          outlineWidth: 2,
          outlineStyle: 'solid',
        },
      ]}
    >
      <Icon
        size={22}
        strokeWidth={isFocused ? 2.1 : 1.8}
        color={isFocused ? colors.deepAccent : colors.onDeepSecondary}
      />
      <Text variant={isFocused ? 'bodyStrong' : 'body'} tone={isFocused ? 'deepAccent' : 'onDeep'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: chrome.sidebarWidth, paddingLeft: spacing.md },
  panel: { flex: 1, padding: spacing.lg },
  brand: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm, gap: spacing.xxs },
  items: { marginTop: spacing.xxl, gap: spacing.xs },
  item: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footer: { marginTop: 'auto' },
});
