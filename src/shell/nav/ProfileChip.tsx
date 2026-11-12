import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useProfile } from '@/core/profile/useProfile';
import { Text, radius, spacing, useTheme, withAlpha } from '@/design-system';
import { CreatureBubble } from '@/features/habits/components/CreatureBubble';
import { isCreatureId } from '@/features/habits/domain/creatures';

import { useProgress } from '../progress/useProgress';
import { useGamePrefs } from '../settings/prefs';

/** You, at the bottom of the sidebar: opens the profile; the gear opens Ajustes. */
export function ProfileChip() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: profile } = useProfile();
  const { data: progress } = useProgress();
  const { showDepth } = useGamePrefs();
  const creature =
    profile?.creature && isCreatureId(profile.creature) ? profile.creature : 'dolphin';
  const name = profile?.name || 'Mergulhador';
  const depth = progress?.depth;
  const line =
    depth && showDepth
      ? `${depth.zone.name} · ${new Intl.NumberFormat('pt-BR').format(depth.meters)} m`
      : 'Ver perfil';

  return (
    <View style={[styles.root, { backgroundColor: withAlpha(colors.onDeep, 0.06) }]}>
      <Pressable
        onPress={() => router.navigate('/profile')}
        accessibilityRole="button"
        accessibilityLabel={`Perfil: ${name}, ${line}`}
        style={({ pressed }) => [styles.me, pressed && styles.pressed]}
      >
        <CreatureBubble creature={creature} size={36} done />
        <View style={styles.texts}>
          <Text variant="footnote" tone="onDeep" numberOfLines={1} style={styles.bold}>
            {name}
          </Text>
          <Text variant="caption" tone="onDeepSecondary" numberOfLines={1}>
            {line}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => router.navigate('/profile/settings')}
        accessibilityRole="button"
        accessibilityLabel="Ajustes"
        hitSlop={6}
        style={({ pressed }) => [
          styles.gear,
          { backgroundColor: pressed ? colors.deepAccentSoft : 'transparent' },
        ]}
      >
        <Settings size={20} color={colors.onDeepSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  me: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 4 },
  pressed: { opacity: 0.7 },
  texts: { flex: 1 },
  bold: { fontWeight: '700' },
  gear: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
