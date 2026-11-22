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
