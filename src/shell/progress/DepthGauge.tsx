import { StyleSheet, View } from 'react-native';

import { ZONES } from '@/core/progress/rules';
import { DeepSurface, Text, radius, spacing, useTheme, withAlpha } from '@/design-system';

import { useProgress } from './useProgress';

const meters = (value: number) => `${new Intl.NumberFormat('pt-BR').format(value)} m`;

/**
 * How deep the person has gone: their zone, the meters, how far to the next zone and the
 * points earned today. The card itself gets darker the deeper they are.
 */
export function DepthGauge() {
  const { colors } = useTheme();
  const { data } = useProgress();
  if (!data) return null;
  const { depth, today } = data;
  const zoneIndex = ZONES.indexOf(depth.zone);
  const next = depth.next;
  const remaining = next ? next.from - depth.meters : 0;
  const summary = next
    ? `Faltam ${meters(remaining)} para ${next.emoji} ${next.name}`
    : 'Você chegou ao ponto mais fundo do oceano!';

  return (
    <DeepSurface
      radius="xl"
      style={styles.card}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Profundidade: ${meters(depth.meters)}, ${depth.zone.name}. ${summary}. ${today.points} pontos hoje.`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(depth.progress * 100) }}
    >
      {/* Deeper zones, darker water. */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(colors.deepBottom, zoneIndex * 0.09) },
        ]}
        pointerEvents="none"
      />
      <View style={styles.row}>
        <Text style={styles.emoji}>{depth.zone.emoji}</Text>
        <View style={styles.texts}>
          <Text variant="overline" tone="onDeepSecondary">
            Profundidade
          </Text>
          <Text variant="title2" tone="onDeep" numberOfLines={1}>
            {meters(depth.meters)} · {depth.zone.name}
          </Text>
        </View>
        <View style={[styles.points, { backgroundColor: colors.energy }]}>
          <Text variant="headline" tone="onEnergy">
            +{today.points}
          </Text>
          <Text variant="caption" tone="onEnergy">
            {today.capped ? 'limite do dia' : 'hoje'}
          </Text>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: colors.deepAccentSoft }]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(4, depth.progress * 100)}%`, backgroundColor: colors.deepAccent },
          ]}
        />
      </View>
      <Text variant="footnote" tone="onDeepSecondary">
        {summary}
      </Text>
    </DeepSurface>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 36, lineHeight: 44 },
  texts: { flex: 1 },
  points: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    minWidth: 64,
  },
  track: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
