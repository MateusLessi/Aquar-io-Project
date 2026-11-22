import { memo } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { useTheme, withAlpha } from '@/design-system';

import { catalogCreature, type CatalogCreature, type CreatureId } from '../domain/creatures';
import { stageInfo, type Stage } from '../domain/stages';

/**
 * The art of each creature, seen from above, head up (Fase 6). One image each: trying another
 * art is replacing the file here, nothing else changes.
 */
export const creatureImages: Record<CatalogCreature, ImageSourcePropType> = {
  fish: require('../assets/creatures/fish.png'),
  shark: require('../assets/creatures/shark.png'),
  turtle: require('../assets/creatures/turtle.png'),
  jellyfish: require('../assets/creatures/jellyfish.png'),
  octopus: require('../assets/creatures/octopus.png'),
  ray: require('../assets/creatures/ray.png'),
};

type CreatureArtProps = {
  creature: CreatureId;
  stage?: Stage;
  /** The side of the square box it is drawn in, in points. */
  size?: number;
  /** Head up (a still portrait) or right (swimming; mirror the parent to swim left). */
  heading?: 'up' | 'right';
};

/**
 * A creature as it looks at its stage: it grows in size, the egg is small and faint and the
 * adult gets a soft halo. Old creatures show as their match among the six. Decorative: the
 * parent carries the label.
 */
export const CreatureArt = memo(function CreatureArt({
  creature,
  stage = 'young',
  size = 64,
  heading = 'up',
}: CreatureArtProps) {
  const { colors } = useTheme();
  const look = stageInfo[stage];
  const inner = size * look.scale;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.box, { width: size, height: size }]}
    >
      {look.glow ? (
        <View
          style={[
            styles.halo,
            {
              width: inner * 0.9,
              height: inner * 0.9,
              borderRadius: inner,
              backgroundColor: withAlpha(colors.deepAccent, 0.16),
              boxShadow: `0px 0px ${Math.round(inner * 0.25)}px ${withAlpha(colors.deepAccent, 0.35)}`,
            },
          ]}
        />
      ) : null}
      <Image
        source={creatureImages[catalogCreature(creature)]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{
          width: inner,
          height: inner,
          opacity: look.opacity,
          transform: heading === 'right' ? [{ rotate: '90deg' }] : undefined,
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute' },
});
