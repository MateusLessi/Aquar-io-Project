/**
 * The pond seen from above (Fase 6, after the GoldFish reference): green water getting deeper
 * toward one corner, soft light drifting on it, leaves framing the edges, and creatures far
 * below as dark shapes.
 */
export const pond = {
  /** The water, from the lit corner to the deep one. */
  water: ['#13A08A', '#0B7A70', '#075056', '#06343F'],
  /** Light drifting on the water. */
  light: '#BEFFEB',
  /** Leaves at the edges: lit and shaded greens. */
  leafLight: '#2FD48F',
  leafMid: '#16A86E',
  leafDark: '#0A5A45',
  leafDeep: '#06402F',
  /** Creatures deep below (habits resting today): dark shapes in the water. */
  deep: '#06303A',
} as const;

/**
 * The ornaments of the pond (Fase 6, etapa 12b): one per region, drawn in vectors in the style of
 * the regions' paintings (soft gradients, a darker underside, a little glow).
 */
export const ornament = {
  padLight: '#9BE36A',
  padMid: '#55C243',
  padDeep: '#2C8A35',
  padRim: '#C2552F',
  flower: '#F7A8C4',
  flowerDeep: '#E2739C',
  flowerCore: '#FFE08A',
  coralLight: '#FFC15A',
  coralOrange: '#FF8F3C',
  coralPink: '#F2668B',
  coralDeep: '#C9446B',
  kelpLight: '#F7D046',
  kelpGold: '#E0A82A',
  kelpGreen: '#3FBF5F',
  kelpDeep: '#1F7A44',
  brassLight: '#E3CF86',
  brass: '#B49A4E',
  brassDeep: '#7A6630',
  moss: '#7FAF3A',
  glow: '#5FF2E6',
  glowCore: '#E8FFFC',
  metal: '#3E4C7A',
  metalLight: '#6B7BAE',
  woodLight: '#9B6634',
  wood: '#7A4B22',
  woodDeep: '#4E2E12',
  gold: '#F4C04E',
  goldLight: '#FFE39A',
  shade: '#06303A',
} as const;
