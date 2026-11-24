import type { ImageSourcePropType } from 'react-native';

import { useSetting } from '@/core/settings/useSetting';
import { isZoneId, useTheme, type ZoneId } from '@/design-system';

/** Personalizar → Seu lago: the region shown as the pond's scene ('' = the latest reached). */
export const AQUARIUM_REGION_SETTING = 'aquarium.region';

/**
 * The scene of each region (Fase 6, etapa 12): painted water, plants and the region's ornament,
 * with the middle left clear for the creatures. Light and bubbles are drawn over it in code.
 * Trying another art is replacing the file. The Lagoa is still drawn in code.
 */
export const regionScenes: Partial<Record<ZoneId, ImageSourcePropType>> = {
  reef: require('../assets/regions/reef.webp'),
  kelp: require('../assets/regions/kelp.webp'),
  open: require('../assets/regions/open.webp'),
  bio: require('../assets/regions/bio.webp'),
  mariana: require('../assets/regions/mariana.webp'),
};

/**
 * The region the pond shows: the one chosen in Personalizar, or the latest reached (the theme's
 * zone, kept by the app shell from the points). Returns the setter too.
 */
export function useAquariumRegion() {
  const { zone } = useTheme();
  const [chosen, set] = useSetting<string>(AQUARIUM_REGION_SETTING, '');
  const region: ZoneId = isZoneId(chosen) ? chosen : zone;
  return [region, set, isZoneId(chosen)] as const;
}
