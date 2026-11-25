import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ZONES } from '@/core/progress/rules';
import {
  Button,
  DeepSurface,
  RisingBubbles,
  Tag,
  Text,
  haptics,
  isZoneId,
  pond,
  radius,
  spacing,
  springs,
  type ZoneId,
} from '@/design-system';
import { ornaments, regionScenes, useAquariumRegion } from '@/features/habits/hooks/aquariumRegion';

const VISIBLE_MS = 4500;

/**
 * A short celebration that drops in from the top; a tap or a few seconds dismiss it. A new
 * region (Fase 6, etapa 12d) shows its scene and the ornament it gives, and waits for an answer:
 * "Usar no meu lago" or "Depois" (the region stays to choose in the map or in Personalizar).
 */
export function CelebrationBanner({
  message,
  region,
  onDone,
}: {
  message: string;
  region?: string;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const drop = useSharedValue(-220);
  const zone = region ? ZONES.find((z) => z.id === region) : undefined;

  useEffect(() => {
    haptics.success();
    drop.set(withSpring(0, springs.buoyant));
    // A new region waits for an answer; the others go away on their own.
    if (zone) return;
    const timer = setTimeout(onDone, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [drop, message, onDone, zone]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: drop.get() }] }));

  return (
    <Animated.View style={[styles.wrap, { top: insets.top + spacing.sm }, style]}>
      {zone && isZoneId(zone.id) ? (
        <NewRegion id={zone.id} name={zone.name} onDone={onDone} />
      ) : (
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel={`${message} Toque para fechar.`}
          accessibilityLiveRegion="polite"
        >
          <DeepSurface radius="xl" style={styles.card}>
            <RisingBubbles height={72} count={8} festive />
            <Text variant="headline" tone="onDeep" style={styles.text}>
              {message}
            </Text>
          </DeepSurface>
        </Pressable>
      )}
    </Animated.View>
  );
}

function NewRegion({ id, name, onDone }: { id: ZoneId; name: string; onDone: () => void }) {
  const [, setRegion] = useAquariumRegion();
  const scene = regionScenes[id];
  const gift = ornaments.find((x) => x.region === id);
  return (
    <DeepSurface
      radius="xl"
      style={styles.region}
      accessible={false}
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.preview, { backgroundColor: pond.water[1] }]}>
        {scene ? <Image source={scene} resizeMode="cover" style={styles.fill} /> : null}
        <RisingBubbles height={110} count={8} festive />
      </View>
      <View style={styles.body}>
        <Tag label="Nova região" tone="sand" />
        <Text variant="title2" tone="onDeep" accessibilityRole="header">
          {name}
        </Text>
        {gift ? (
          <Text variant="callout" tone="onDeepSecondary">
            Você ganhou o enfeite {gift.name}.
          </Text>
        ) : null}
        <View style={styles.actions}>
          <View style={styles.flex}>
            <Button
              label="Usar no meu lago"
              block
              onPress={() => {
                void setRegion(id);
                onDone();
              }}
            />
          </View>
          <Button label="Depois" variant="secondary" onPress={onDone} />
        </View>
      </View>
    </DeepSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    alignItems: 'center',
  },
  card: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    overflow: 'hidden',
    maxWidth: 520,
  },
  text: { textAlign: 'center' },
  region: { overflow: 'hidden', width: '100%', maxWidth: 420 },
  preview: {
    height: 110,
    overflow: 'hidden',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  fill: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  body: { padding: spacing.md, gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  flex: { flex: 1 },
});
