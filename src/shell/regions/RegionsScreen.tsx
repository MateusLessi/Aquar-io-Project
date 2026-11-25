import { useRouter } from 'expo-router';
import { Check, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { ZONES, type Zone } from '@/core/progress/rules';
import {
  Button,
  Screen,
  Surface,
  Tag,
  Text,
  isZoneId,
  pond,
  radius,
  spacing,
  useSvgId,
  useTheme,
  withAlpha,
  zoneWater,
} from '@/design-system';
import { regionScenes, useAquariumRegion } from '@/features/habits/hooks/aquariumRegion';

import { useProgress } from '../progress/useProgress';

const points = (n: number) => new Intl.NumberFormat('pt-BR').format(n);
const STEP = 132;
const NODE = 68;

/**
 * The map of the regions (Fase 6, etapa 12d): the ocean seen from above, from the Lagoa down to
 * the Fossa das Marianas, with the trail between them. The regions reached are in color, the one
 * in the pond is ringed in sand, the others say how many points are left. A tap on a region
 * shows it, and a region reached can go to the pond.
 */
export function RegionsScreen() {
  const router = useRouter();
  const { data } = useProgress();
  const [region, setRegion] = useAquariumRegion();
  const total = data?.depth.meters ?? 0;
  const reached = ZONES.filter((z) => total >= z.from).length;
  const [selectedId, setSelectedId] = useState<string>(region);
  const selected = ZONES.find((z) => z.id === selectedId) ?? ZONES[0]!;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  return (
    <Screen
      title="Regiões"
      eyebrow={`${reached} de ${ZONES.length} · ${points(total)} pontos`}
      onBack={back}
    >
      <Detail
        zone={selected}
        total={total}
        inPond={selected.id === region}
        onUse={() => void setRegion(selected.id)}
      />
      <OceanMap
        total={total}
        inPond={region}
        selectedId={selected.id}
        onSelect={(zone) => setSelectedId(zone.id)}
      />
    </Screen>
  );
}

/** The region tapped: its scene, what it is, and where it stands for you. */
function Detail({
  zone,
  total,
  inPond,
  onUse,
}: {
  zone: Zone;
  total: number;
  inPond: boolean;
  onUse: () => void;
}) {
  const scene = isZoneId(zone.id) ? regionScenes[zone.id] : undefined;
  const reached = total >= zone.from;
  return (
    <Surface style={styles.detail}>
      <View style={[styles.preview, { backgroundColor: pond.water[1] }]}>
        {scene ? <Image source={scene} resizeMode="cover" style={styles.fill} /> : null}
      </View>
      <View style={styles.detailBody}>
        <View style={styles.detailHead}>
          <Text variant="title2" style={styles.flex} numberOfLines={1}>
            {zone.name}
          </Text>
          {inPond ? <Tag label="No seu lago" tone="sand" /> : null}
        </View>
        <Text variant="callout" tone="secondary">
          {zone.about}
        </Text>
        {reached ? (
          inPond ? null : (
            <Button label="Usar no meu lago" onPress={onUse} />
          )
        ) : (
          <Text variant="footnote" tone="tertiary">
            A partir de {points(zone.from)} pontos · faltam {points(zone.from - total)}
          </Text>
        )}
      </View>
    </Surface>
  );
}

/** The ocean from above, lighter at the Lagoa and darker at the trench, and the trail. */
function OceanMap({
  total,
  inPond,
  selectedId,
  onSelect,
}: {
  total: number;
  inPond: string;
  selectedId: string;
  onSelect: (zone: Zone) => void;
}) {
  const { colors } = useTheme();
  const gradient = useSvgId('ocean-map');
  const [width, setWidth] = useState(0);
  const height = STEP * ZONES.length + 40;
  const at = (i: number) => ({
    x: width * (i % 2 === 0 ? 0.28 : 0.72),
    y: 40 + i * STEP + NODE / 2,
  });
  const trail = ZONES.map((_, i) => at(i))
    .map((p, i, all) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = all[i - 1]!;
      const mid = (prev.y + p.y) / 2;
      return `C${prev.x},${mid} ${p.x},${mid} ${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <View
      testID="regions-map"
      style={[styles.map, { height }]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <>
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                {ZONES.map((z, i) => (
                  <Stop
                    key={z.id}
                    offset={i / (ZONES.length - 1)}
                    stopColor={isZoneId(z.id) ? zoneWater[z.id].mid : colors.surfaceRaised}
                  />
                ))}
              </LinearGradient>
            </Defs>
            <Rect width={width} height={height} fill={`url(#${gradient})`} />
            <Path
              d={trail}
              stroke={withAlpha(colors.textPrimary, 0.45)}
              strokeWidth={3}
              strokeDasharray="2 10"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
          {ZONES.map((zone, i) => {
            const p = at(i);
            const reached = total >= zone.from;
            const scene = isZoneId(zone.id) ? regionScenes[zone.id] : undefined;
            const here = zone.id === inPond;
            const chosen = zone.id === selectedId;
            return (
              <Pressable
                key={zone.id}
                onPress={() => onSelect(zone)}
                accessibilityRole="button"
                accessibilityState={{ selected: chosen }}
                accessibilityLabel={
                  reached
                    ? `${zone.name}${here ? ', no seu lago' : ', alcançada'}`
                    : `${zone.name}, faltam ${points(zone.from - total)} pontos`
                }
                style={[styles.node, { left: p.x - 70, top: p.y - NODE / 2 }]}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: pond.water[1],
                      borderColor: here
                        ? colors.deepAccent
                        : reached
                          ? withAlpha(colors.textPrimary, 0.85)
                          : withAlpha(colors.textPrimary, 0.25),
                      opacity: reached ? 1 : 0.6,
                      transform: [{ scale: chosen ? 1.08 : 1 }],
                    },
                  ]}
                >
                  {scene ? <Image source={scene} resizeMode="cover" style={styles.fill} /> : null}
                  {!reached ? (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: withAlpha(colors.surfaceBase, 0.7) },
                      ]}
                    >
                      <Lock size={16} color={colors.textPrimary} />
                    </View>
                  ) : here ? (
                    <View style={[styles.check, { backgroundColor: colors.deepAccent }]}>
                      <Check size={12} strokeWidth={3} color={colors.onDeepAccent} />
                    </View>
                  ) : null}
                </View>
                <View
                  style={[styles.label, { backgroundColor: withAlpha(colors.surfaceBase, 0.6) }]}
                >
                  <Text variant="caption" style={styles.center} numberOfLines={1}>
                    {zone.name}
                  </Text>
                  <Text variant="caption" tone="secondary" style={styles.center} numberOfLines={1}>
                    {here
                      ? 'no seu lago'
                      : reached
                        ? 'alcançada'
                        : `faltam ${points(zone.from - total)}`}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fill: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  center: { textAlign: 'center' },
  detail: { overflow: 'hidden' },
  preview: { height: 120, overflow: 'hidden' },
  detailBody: { padding: spacing.md, gap: spacing.sm },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  map: { borderRadius: radius.xl, overflow: 'hidden' },
  node: { position: 'absolute', width: 140, alignItems: 'center', gap: spacing.xs },
  dot: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    maxWidth: 140,
  },
});
