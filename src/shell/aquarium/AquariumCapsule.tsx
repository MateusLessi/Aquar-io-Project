import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  GlassSurface,
  SegmentedListMode,
  StickySlotHost,
  Text,
  haptics,
  radius,
  spacing,
  touchTarget,
  useStickySummary,
  useTheme,
} from '@/design-system';

import { aquariumTabs, type AquariumTab } from './AquariumScreen';

type AquariumCapsuleProps = {
  tab: AquariumTab;
  onTab: (tab: AquariumTab) => void;
};

/**
 * Phones (Fase 5, from the reference): the Aquarium's sections as one glass capsule. The
 * section you are in is a solid piece with its name and the view inside it ("Agenda · Dia");
 * the others are just icons. Tapping the solid piece drops the section's views down as a glass
 * list, which closes once you pick one.
 */
export function AquariumCapsule({ tab, onTab }: AquariumCapsuleProps) {
  const { colors, reduceMotion } = useTheme();
  const summary = useStickySummary();
  // The list is open for one section; switching sections closes it.
  const [openFor, setOpenFor] = useState<AquariumTab | null>(null);
  const open = openFor === tab;

  return (
    <GlassSurface radius="xl" depth={1} style={styles.bar}>
      <View accessibilityRole="radiogroup" accessibilityLabel="Seção do Aquário" style={styles.row}>
        {aquariumTabs.map((option) => {
          const selected = option.value === tab;
          const Icon = option.icon;
          if (!selected) {
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: false }}
                aria-checked={false}
                onPress={() => {
                  haptics.selection();
                  onTab(option.value);
                }}
                style={({ pressed }) => [
                  styles.icon,
                  pressed && { backgroundColor: colors.surfacePressed },
                ]}
              >
                <Icon size={22} strokeWidth={1.9} color={colors.textSecondary} />
              </Pressable>
            );
          }
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityHint={summary ? `Vendo: ${summary}. Toque para trocar.` : undefined}
              accessibilityState={{ checked: true, expanded: summary ? open : undefined }}
              aria-checked
              aria-expanded={summary ? open : undefined}
              disabled={!summary}
              onPress={() => {
                haptics.selection();
                setOpenFor(open ? null : tab);
              }}
              style={({ pressed }) => [
                styles.active,
                { backgroundColor: colors.textPrimary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Icon size={20} strokeWidth={2.3} color={colors.surfaceBase} />
              <Text
                variant="bodyStrong"
                numberOfLines={1}
                style={[styles.label, { color: colors.surfaceBase }]}
              >
                {option.label}
                {summary ? (
                  <Text variant="body" style={{ color: colors.surfaceBase }}>
                    {` · ${summary}`}
                  </Text>
                ) : null}
              </Text>
              {summary ? (
                <ChevronDown
                  size={18}
                  strokeWidth={2.4}
                  color={colors.surfaceBase}
                  style={open ? styles.flip : undefined}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {/* The section's views, as a list; hidden until you ask for them. It leaves at once, so
          a fading copy is never tapped by mistake. */}
      {open ? (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInUp.springify().damping(18)}
          style={styles.drop}
        >
          <SegmentedListMode onChoose={() => setOpenFor(null)}>
            <StickySlotHost />
          </SegmentedListMode>
        </Animated.View>
      ) : null}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  bar: { padding: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  icon: {
    width: touchTarget + 4,
    height: touchTarget + 4,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    flex: 1,
    height: touchTarget + 4,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  label: { flexShrink: 1 },
  flip: { transform: [{ rotate: '180deg' }] },
  drop: { paddingTop: spacing.xs },
});
