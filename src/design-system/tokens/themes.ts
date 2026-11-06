import { abyss, ocean } from './palette';
import { zoneWater, type ZoneId, type ZoneWater } from './zones';

/** The tone of the text: light text on dark backgrounds ('dark') or dark text on light ones. */
export type ColorScheme = 'light' | 'dark';

/** Escuro, Claro or Crystal (the live aquarium behind everything, with frosted-glass cards). */
export type ThemeMode = 'light' | 'dark' | 'crystal';

export const schemeOfMode = (mode: ThemeMode): ColorScheme => (mode === 'light' ? 'light' : 'dark');

export type ThemeColors = {
  /** Background gradient, top to bottom: light gets deeper as you go down. */
  surfaceTop: string;
  surfaceBase: string;
  surfaceDeep: string;
  /** Solid surface for content (lists, cards). */
  surfaceRaised: string;
  /** Pressed / selected state on top of `surfaceRaised`. */
  surfacePressed: string;
  /** Translucent material for chrome (bars, sheets, floating controls). */
  glass: string;
  /** Used instead of `glass` when blur is unavailable or transparency is reduced. */
  glassFallback: string;
  glassBorder: string;
  scrim: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  separator: string;
  border: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  onAccent: string;
  focusRing: string;
  priority: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  caustic: string;
  waterline: string;
  shadow: string;
  /** Deep water: a dark, contrasting surface for navigation chrome in both themes. */
  deepTop: string;
  deepBottom: string;
  deepBorder: string;
  onDeep: string;
  onDeepSecondary: string;
  deepAccent: string;
  deepAccentSoft: string;
  onDeepAccent: string;
  /** Energy: coral, the warm counterpart to the ocean. Reserved for the main action. */
  energy: string;
  energyPressed: string;
  onEnergy: string;
  /** The light the aquarium gives off: halos and particles around the tank. */
  lamp: string;
  /** Soft shadow under cards (they have no borders: depth comes from light and shadow). */
  cardShadow: string;
  cardShadowOpacity: number;
};

export const lightColors: ThemeColors = {
  surfaceTop: '#E6F4F5',
  surfaceBase: abyss[50],
  surfaceDeep: '#E7EEF2',
  surfaceRaised: '#FFFFFF',
  surfacePressed: abyss[100],
  glass: 'rgba(255, 255, 255, 0.72)',
  glassFallback: 'rgba(250, 252, 253, 0.97)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
  scrim: 'rgba(10, 20, 28, 0.32)',
  textPrimary: '#0C1A23',
  textSecondary: abyss[600],
  textTertiary: '#546A79',
  separator: 'rgba(12, 40, 52, 0.08)',
  border: abyss[200],
  accent: ocean[600],
  accentPressed: ocean[700],
  accentSoft: 'rgba(14, 113, 111, 0.12)',
  onAccent: '#FFFFFF',
  focusRing: ocean[400],
  priority: '#B5562A',
  success: '#1E7A51',
  warning: '#8A5D0C',
  error: '#C23B33',
  info: '#2A70AE',
  caustic: ocean[500],
  waterline: 'rgba(14, 113, 111, 0.16)',
  shadow: '#0C2834',
  deepTop: '#0F4549',
  deepBottom: '#06202A',
  deepBorder: 'rgba(140, 200, 210, 0.16)',
  onDeep: '#EAF4F6',
  onDeepSecondary: '#A9C4CD',
  deepAccent: ocean[200],
  deepAccentSoft: 'rgba(147, 218, 213, 0.16)',
  onDeepAccent: ocean[950],
  energy: '#FF8160',
  energyPressed: '#F26A47',
  onEnergy: '#2B0D05',
  lamp: ocean[300],
  cardShadow: '#0C2834',
  cardShadowOpacity: 0.08,
};

export const darkColors: ThemeColors = {
  surfaceTop: '#0B2129',
  surfaceBase: '#07121A',
  surfaceDeep: '#040B11',
  surfaceRaised: '#0E1C26',
  surfacePressed: '#152836',
  glass: 'rgba(18, 38, 50, 0.7)',
  glassFallback: 'rgba(16, 32, 43, 0.97)',
  glassBorder: 'rgba(140, 200, 210, 0.12)',
  scrim: 'rgba(0, 0, 0, 0.5)',
  textPrimary: '#E6F0F4',
  textSecondary: '#9DB2BE',
  textTertiary: '#88A1AF',
  separator: 'rgba(157, 178, 190, 0.1)',
  border: abyss[700],
  accent: ocean[300],
  accentPressed: ocean[200],
  accentSoft: 'rgba(92, 195, 189, 0.14)',
  onAccent: ocean[950],
  focusRing: ocean[200],
  priority: '#F0A070',
  success: '#5BC995',
  warning: '#E8B656',
  error: '#F0786F',
  info: '#6FB1E8',
  caustic: ocean[300],
  waterline: 'rgba(92, 195, 189, 0.14)',
  shadow: '#000000',
  deepTop: '#0E2D36',
  deepBottom: '#091821',
  deepBorder: 'rgba(140, 200, 210, 0.14)',
  onDeep: '#E6F0F4',
  onDeepSecondary: '#A3BBC6',
  deepAccent: ocean[200],
  deepAccentSoft: 'rgba(147, 218, 213, 0.14)',
  onDeepAccent: ocean[950],
  energy: '#FF8E6E',
  energyPressed: '#FFA68C',
  onEnergy: '#2B0D05',
  lamp: ocean[300],
  cardShadow: '#000000',
  cardShadowOpacity: 0.35,
};

export const themeColors: Record<ColorScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

/**
 * "Alto contraste": secondary and tertiary text close to the primary, firmer separators and
 * borders, and glass edges that read clearly. Laid over the normal theme.
 */
export const highContrastColors: Record<ThemeMode, Partial<ThemeColors>> = {
  light: {
    textSecondary: '#24343F',
    textTertiary: '#33495A',
    separator: 'rgba(12, 40, 52, 0.24)',
    border: abyss[500],
    glassBorder: 'rgba(12, 40, 52, 0.32)',
  },
  dark: {
    textSecondary: '#D3E0E6',
    textTertiary: '#BACBD4',
    separator: 'rgba(190, 210, 220, 0.3)',
    border: abyss[400],
    glassBorder: 'rgba(200, 230, 235, 0.38)',
  },
  crystal: {
    textSecondary: '#FFFFFF',
    textTertiary: '#EAF6F8',
    separator: 'rgba(255, 255, 255, 0.32)',
    border: 'rgba(255, 255, 255, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.45)',
    surfaceRaised: 'rgba(4, 20, 28, 0.55)',
  },
};

// --- Zone-adaptive themes ---------------------------------------------------------------

function channels(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mixes two `#RRGGBB` colors: `amount` 0 is `a`, 1 is `b`. */
export function mixHex(a: string, b: string, amount: number): string {
  const ca = channels(a);
  const cb = channels(b);
  return `#${ca
    .map((v, i) => Math.round(v + (cb[i]! - v) * amount))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const WHITE = '#FFFFFF';
const BLACK = '#000000';

/** Escuro: a dark room lit by the tank. Surfaces take the zone's tone, accents its light. */
function darkFor(water: ZoneWater): ThemeColors {
  const raised = mixHex(water.room, WHITE, 0.035);
  return {
    ...darkColors,
    surfaceTop: water.room,
    surfaceBase: mixHex(water.room, BLACK, 0.42),
    surfaceDeep: mixHex(water.room, BLACK, 0.66),
    surfaceRaised: raised,
    surfacePressed: mixHex(water.room, WHITE, 0.09),
    glass: rgba(mixHex(water.room, WHITE, 0.05), 0.82),
    glassFallback: rgba(mixHex(water.room, WHITE, 0.05), 0.97),
    glassBorder: rgba(water.lamp, 0.06),
    separator: 'rgba(200, 225, 235, 0.07)',
    border: mixHex(water.room, WHITE, 0.16),
    accent: water.lamp,
    accentPressed: mixHex(water.lamp, WHITE, 0.25),
    accentSoft: rgba(water.lamp, 0.14),
    onAccent: mixHex(water.room, BLACK, 0.5),
    focusRing: mixHex(water.lamp, WHITE, 0.3),
    caustic: water.lamp,
    waterline: rgba(water.lamp, 0.14),
    deepTop: mixHex(water.room, WHITE, 0.06),
    deepBottom: mixHex(water.room, BLACK, 0.25),
    deepBorder: rgba(water.lamp, 0.08),
    deepAccent: mixHex(water.lamp, WHITE, 0.35),
    deepAccentSoft: rgba(water.lamp, 0.16),
    onDeepAccent: mixHex(water.room, BLACK, 0.5),
    lamp: water.lamp,
  };
}

/** Claro: clear water and sand. The zone tints the top of the screen and the accent stays teal. */
function lightFor(water: ZoneWater): ThemeColors {
  return {
    ...lightColors,
    surfaceTop: mixHex(water.lamp, WHITE, 0.86),
    surfaceBase: mixHex(water.lamp, WHITE, 0.95),
    surfaceDeep: mixHex(water.sand, WHITE, 0.78),
    separator: 'rgba(12, 40, 52, 0.06)',
    glassBorder: 'rgba(255, 255, 255, 0.6)',
    deepTop: mixHex(water.bottom, BLACK, 0.3),
    deepBottom: mixHex(water.bottom, BLACK, 0.45),
    lamp: water.top,
  };
}

/** Crystal: the aquarium fills the screen and cards are frosted glass on top of the water. */
function crystalFor(water: ZoneWater): ThemeColors {
  const top = mixHex(water.mid, BLACK, 0.45);
  const base = mixHex(water.bottom, BLACK, 0.4);
  return {
    ...darkColors,
    surfaceTop: top,
    surfaceBase: base,
    surfaceDeep: mixHex(water.bottom, BLACK, 0.5),
    surfaceRaised: 'rgba(255, 255, 255, 0.12)',
    surfacePressed: 'rgba(255, 255, 255, 0.2)',
    // Chrome (bars, sheets) floats over moving content: tinted glass, so it stays readable.
    glass: rgba(mixHex(base, WHITE, 0.1), 0.8),
    glassFallback: rgba(mixHex(base, WHITE, 0.12), 0.97),
    glassBorder: 'rgba(255, 255, 255, 0.14)',
    scrim: 'rgba(0, 10, 16, 0.45)',
    textPrimary: '#F4FBFC',
    textSecondary: '#D7ECEF',
    textTertiary: '#C8E2E7',
    separator: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.3)',
    accent: mixHex(water.lamp, WHITE, 0.45),
    accentPressed: mixHex(water.lamp, WHITE, 0.65),
    accentSoft: 'rgba(255, 255, 255, 0.16)',
    onAccent: mixHex(water.bottom, BLACK, 0.4),
    focusRing: WHITE,
    caustic: WHITE,
    waterline: 'rgba(255, 255, 255, 0.2)',
    deepTop: rgba(mixHex(base, WHITE, 0.14), 0.88),
    deepBottom: rgba(mixHex(base, WHITE, 0.06), 0.92),
    deepBorder: 'rgba(255, 255, 255, 0.14)',
    deepAccent: mixHex(water.lamp, WHITE, 0.5),
    deepAccentSoft: 'rgba(255, 255, 255, 0.18)',
    onDeepAccent: mixHex(water.bottom, BLACK, 0.4),
    lamp: water.lamp,
    cardShadow: BLACK,
    cardShadowOpacity: 0.12,
  };
}

/** Colors for a mode in a zone. Solid stand-in for Crystal's glass, used to check contrast. */
export function colorsFor(mode: ThemeMode, zone: ZoneId): ThemeColors {
  const water = zoneWater[zone];
  if (mode === 'light') return lightFor(water);
  if (mode === 'crystal') return crystalFor(water);
  return darkFor(water);
}

/** What Crystal's glass looks like over its water, for contrast checks. */
export function crystalComposite(zone: ZoneId, alpha = 0.12): string {
  const base = mixHex(zoneWater[zone].bottom, BLACK, 0.4);
  return mixHex(base, WHITE, alpha);
}
