import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PROFILE_LIMITS } from '@/core/profile/profileRepository';
import { useProfile, useProfileRepository } from '@/core/profile/useProfile';
import {
  Button,
  Sheet,
  Text,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
} from '@/design-system';

import { showcaseItem, type ShowcaseItem } from './achievements';
import { profileTone } from './ProfileHeader';
import { useAchievements } from './useAchievements';

/** The three highlights the person picked, then every badge (earned ones in color). */
export function ProfileShowcase() {
  const { colors, scheme } = useTheme();
  const wide = useBreakpoint() !== 'compact';
  const { data: profile } = useProfile();
  const repository = useProfileRepository();
  const { facts, badges, options } = useAchievements();
  const [choosing, setChoosing] = useState(false);
  const tone = profileTone(profile, scheme);
  const picks = (profile?.showcase ?? [])
    .map((pick) => showcaseItem(pick, facts, badges))
    .filter((item): item is ShowcaseItem => item !== null);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="overline" tone="tertiary" accessibilityRole="header">
          Vitrine
        </Text>
        <Button label="Escolher" variant="ghost" onPress={() => setChoosing(true)} />
      </View>
      {picks.length > 0 ? (
        <View style={styles.tiles}>
          {picks.map((item) => (
            <View
              key={item.pick}
              accessible
              accessibilityLabel={`${item.label}: ${item.value}${item.detail ? `, ${item.detail}` : ''}`}
              style={[
                styles.tile,
                { backgroundColor: colors.surfaceRaised, borderColor: withAlpha(tone, 0.45) },
              ]}
            >
              <Text variant="caption" tone="tertiary" numberOfLines={1}>
                {item.label}
              </Text>
              <Text variant="title2" numberOfLines={1}>
                {item.emoji} {item.value}
              </Text>
              {item.detail ? (
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  {item.detail}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <Text variant="footnote" tone="secondary" style={styles.empty}>
          Escolha até 3 destaques: sua maior sequência, as marés cheias, uma criatura favorita…
        </Text>
      )}

      <View style={styles.header}>
        <Text variant="overline" tone="tertiary" accessibilityRole="header">
          Selos · {earned} de {badges.length}
        </Text>
      </View>
      <View style={styles.badges}>
        {badges.map((badge) => (
          <View
            key={badge.id}
            accessible
            accessibilityLabel={`${badge.title}: ${badge.earned ? 'conquistado' : badge.hint}`}
            style={[
              styles.badge,
              wide && styles.badgeWide,
              {
                backgroundColor: badge.earned ? withAlpha(tone, 0.16) : colors.surfaceRaised,
                opacity: badge.earned ? 1 : 0.55,
              },
            ]}
          >
            <Text variant="title2" style={!badge.earned && styles.locked}>
              {badge.emoji}
            </Text>
            <Text variant="caption" style={styles.center} numberOfLines={2}>
              {badge.title}
            </Text>
            {!badge.earned ? (
              <Text variant="caption" tone="tertiary" style={styles.center} numberOfLines={2}>
                {badge.hint}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      <Sheet visible={choosing} onClose={() => setChoosing(false)} title="Vitrine">
        {choosing ? (
          <ShowcasePicker
            options={options}
            selected={profile?.showcase ?? []}
            onSave={async (showcase) => {
              await repository.set({ showcase });
              setChoosing(false);
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function ShowcasePicker({
  options,
  selected,
  onSave,
}: {
  options: ShowcaseItem[];
  selected: string[];
  onSave: (picks: string[]) => Promise<void>;
}) {
  const { colors } = useTheme();
  const [picks, setPicks] = useState(selected.filter((p) => options.some((o) => o.pick === p)));
  const full = picks.length >= PROFILE_LIMITS.showcase;
  const toggle = (pick: string) =>
    setPicks((current) =>
      current.includes(pick)
        ? current.filter((p) => p !== pick)
        : current.length < PROFILE_LIMITS.showcase
          ? [...current, pick]
          : current,
    );
  return (
    <View style={styles.picker}>
      <Text variant="footnote" tone="secondary">
        Escolha até 3, na ordem em que devem aparecer. Tudo vem do que você fez de verdade.
      </Text>
      <View style={[styles.list, { backgroundColor: colors.surfaceRaised }]}>
        {options.map((option, i) => {
          const at = picks.indexOf(option.pick);
          const on = at >= 0;
          return (
            <Pressable
              key={option.pick}
              onPress={() => toggle(option.pick)}
              disabled={!on && full}
              accessibilityRole="checkbox"
              accessibilityLabel={`${option.label}: ${option.value}`}
              accessibilityState={{ checked: on, disabled: !on && full }}
              aria-checked={on}
              style={[
                styles.option,
                i > 0 && {
                  borderTopColor: colors.separator,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
                !on && full && styles.dim,
              ]}
            >
              <Text variant="title2">{option.emoji}</Text>
              <View style={styles.flex}>
                <Text variant="body">{option.label}</Text>
                <Text variant="footnote" tone="secondary" numberOfLines={1}>
                  {[option.value, option.detail].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View
                style={[
                  styles.order,
                  {
                    backgroundColor: on ? colors.accent : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text variant="caption" tone={on ? 'onAccent' : 'tertiary'}>
                  {on ? `${at + 1}º` : ''}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Button label="Salvar" block onPress={() => void onSave(picks)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.xs,
    minHeight: 36,
  },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: 2 },
  empty: { marginHorizontal: spacing.xs },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  badgeWide: { width: '13%' },
  locked: { opacity: 0.5 },
  center: { textAlign: 'center' },
  picker: { gap: spacing.lg },
  list: { borderRadius: radius.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dim: { opacity: 0.4 },
  flex: { flex: 1 },
  order: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
