import { TabTrigger } from 'expo-router/ui';
import { Plus, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DeepSurface,
  Text,
  chrome,
  haptics,
  radius,
  spacing,
  useKeyboardFocus,
  useTheme,
} from '@/design-system';

import type { Destination } from './destinations';

type NavigationRailProps = {
  destinations: Destination[];
  onCreate: () => void;
};

/**
 * Tablets in portrait and unfolded foldables: a slim deep-water rail with icons and short
 * labels, leaving more room for content than the full sidebar.
 */
export function NavigationRail({ destinations, onCreate }: NavigationRailProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md },
      ]}
    >
      <DeepSurface radius="xl" style={styles.panel}>
        <Pressable
          onPress={onCreate}
          accessibilityRole="button"
          accessibilityLabel="Criar"
          style={({ pressed }) => [
            styles.create,
            { backgroundColor: pressed ? colors.energyPressed : colors.energy },
          ]}
        >
          <Plus size={26} strokeWidth={2.4} color={colors.onEnergy} />
        </Pressable>

        <View accessibilityRole="tablist" style={styles.items}>
          {destinations.map((destination) => (
            <TabTrigger key={destination.name} name={destination.name} asChild>
              <RailItem icon={destination.icon} label={destination.label} />
            </TabTrigger>
          ))}
        </View>
      </DeepSurface>
    </View>
  );
}

type RailItemProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: LucideIcon;
  label: string;
  /** Injected by TabTrigger. */
  isFocused?: boolean;
};

function RailItem({ icon: Icon, label, isFocused = false, onPress, ...rest }: RailItemProps) {
  const { colors } = useTheme();
  const { focused: keyboardFocused, handlers: focus } = useKeyboardFocus();

  return (
    <Pressable
      {...rest}
      onPress={(event) => {
        if (!isFocused) haptics.selection();
        onPress?.(event);
      }}
      onPressIn={focus.onPressIn}
      onPressOut={focus.onPressOut}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      aria-selected={isFocused}
      style={styles.item}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: isFocused ? colors.deepAccent : 'transparent' },
          keyboardFocused && {
            outlineColor: colors.energy,
            outlineWidth: 2,
            outlineStyle: 'solid',
          },
        ]}
      >
        <Icon
          size={24}
          strokeWidth={isFocused ? 2.2 : 1.8}
          color={isFocused ? colors.onDeepAccent : colors.onDeepSecondary}
        />
      </View>
      <Text variant="caption" tone={isFocused ? 'onDeep' : 'onDeepSecondary'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { width: chrome.railWidth, paddingLeft: spacing.md },
  panel: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  create: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  items: { marginTop: spacing.xxl, gap: spacing.md, alignItems: 'center' },
  item: { alignItems: 'center', gap: spacing.xs, minWidth: 64 },
  icon: {
    width: 56,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
