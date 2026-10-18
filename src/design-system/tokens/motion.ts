import {
  ReduceMotion,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

/**
 * Spring presets inspired by water: buoyant, never bouncy for long.
 * `ReduceMotion.System` makes every animation respect the OS "Reduce Motion" setting.
 */
export const springs = {
  /** Large surfaces settling into place (sheets, panels). */
  gentle: { damping: 22, stiffness: 160, mass: 1, reduceMotion: ReduceMotion.System },
  /** Direct responses to touch (press, toggle). */
  responsive: { damping: 18, stiffness: 320, mass: 0.8, reduceMotion: ReduceMotion.System },
  /** Small floating elements with a hint of buoyancy (checkbox mark, FAB). */
  buoyant: { damping: 11, stiffness: 220, mass: 0.7, reduceMotion: ReduceMotion.System },
} satisfies Record<string, WithSpringConfig>;

export const durations = {
  quick: 150,
  base: 250,
  slow: 400,
  /** Ambient loops, such as caustics drifting. */
  ambient: 24000,
} as const;

export const timings = {
  quick: { duration: durations.quick, reduceMotion: ReduceMotion.System },
  base: { duration: durations.base, reduceMotion: ReduceMotion.System },
  slow: { duration: durations.slow, reduceMotion: ReduceMotion.System },
} satisfies Record<string, WithTimingConfig>;

/** Scale applied to pressable elements while pressed. */
export const pressedScale = 0.96;
