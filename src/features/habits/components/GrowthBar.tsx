import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text, spacing, useTheme } from '@/design-system';

import { levelFor } from '../domain/stages';
import type { HabitWithProgress } from '../domain/types';

export const days = (n: number) => (n === 1 ? '1 dia' : `${n} dias`);

/**
 * The creature's level and how far the next one is (Fase 6, etapa 12c): "Nível 7" and a bar,
 * "240 XP · faltam 20 para o nível 8". On the habit's page and on its card in the aquarium.
 * The stages (Ovo → Adulto) follow the levels; their path is the page's "Evolução".
 */
export function LevelBar({
  habit,
  style,
}: {
  habit: HabitWithProgress;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const lvl = levelFor(habit.xp);
  const left = lvl.to - lvl.xp;
  const label = `${lvl.xp} XP · faltam ${left} para o nível ${lvl.level + 1}`;
  return (
    <View
      style={[styles.root, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Nível ${lvl.level}: ${label}`}
      accessibilityValue={{ min: lvl.from, max: lvl.to, now: lvl.xp }}
    >
      <View style={styles.head}>
        <Text variant="footnote" style={styles.level}>
          Nível {lvl.level}
        </Text>
        <Text variant="footnote" tone="secondary" numberOfLines={1} style={styles.flex}>
          {label}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfacePressed }]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.round(lvl.progress * 100)}%`, backgroundColor: colors.accent },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  level: { fontWeight: '700' },
  flex: { flex: 1, textAlign: 'right' },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});
