import { Lock } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ZONES } from '@/core/progress/rules';
import {
  Button,
  Text,
  isZoneId,
  pond,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
} from '@/design-system';
import { regionScenes, useAquariumRegion } from '@/features/habits/hooks/aquariumRegion';

import { useProgress } from '../progress/useProgress';

const points = (n: number) => new Intl.NumberFormat('pt-BR').format(n);

/**
 * Cenário do aquário (Fase 6, etapa 12): the regions as cards with their scene. Any region
 * reached can be the pond's; the others show how many points are left. By default the pond
 * follows the latest region reached.
 */
export function RegionPicker() {
  const { colors } = useTheme();
  const wide = useBreakpoint() !== 'compact';
  const { data } = useProgress();
  const [region, setRegion, chosen] = useAquariumRegion();
  const total = data?.depth.meters ?? 0;

  return (
    <View style={styles.root}>
      <View
        style={styles.grid}
        accessibilityRole="radiogroup"
        accessibilityLabel="Cenário do aquário"
      >
        {ZONES.map((zone) => {
          const reached = total >= zone.from;
          const on = zone.id === region;
          const scene = isZoneId(zone.id) ? regionScenes[zone.id] : undefined;
          return (
            <Pressable
              key={zone.id}
              disabled={!reached}
              onPress={() => void setRegion(zone.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: !reached }}
              aria-checked={on}
              accessibilityLabel={
                reached
                  ? `${zone.name}. ${zone.about}`
                  : `${zone.name}, faltam ${points(zone.from - total)} pontos`
              }
              style={({ pressed }) => [
                styles.card,
                wide ? styles.cardWide : styles.cardPhone,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: on ? colors.deepAccent : 'transparent',
                  opacity: reached ? (pressed ? 0.85 : 1) : 0.55,
                },
              ]}
            >
              <View style={[styles.thumb, { backgroundColor: pond.water[1] }]}>
                {scene ? <Image source={scene} resizeMode="cover" style={styles.scene} /> : null}
                {!reached ? (
                  <View
                    style={[styles.lock, { backgroundColor: withAlpha(colors.surfaceBase, 0.7) }]}
                  >
                    <Lock size={16} color={colors.textPrimary} />
                  </View>
                ) : null}
              </View>
              <View style={styles.text}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {zone.name}
                </Text>
                <Text variant="caption" tone="tertiary" numberOfLines={2}>
                  {on
                    ? 'No seu lago'
                    : reached
                      ? zone.about
                      : `Faltam ${points(zone.from - total)} pontos`}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {chosen ? (
        <Button
          label="Seguir sempre a região mais nova"
          variant="ghost"
          onPress={() => void setRegion('')}
        />
      ) : (
        <Text variant="footnote" tone="tertiary" style={styles.note}>
          O lago mostra a região mais nova que você alcançou. Toque noutra para trocar.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { borderRadius: radius.lg, borderWidth: 2.5, overflow: 'hidden' },
  cardPhone: { width: '48.5%' },
  cardWide: { width: '32.4%' },
  thumb: { height: 88, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scene: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  lock: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  text: { padding: spacing.sm, gap: 2 },
  note: { marginLeft: spacing.xs },
});
