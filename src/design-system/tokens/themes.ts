/**
 * The text tone. The app has one look (Fase 6): dark, so this is always 'dark'. It stays as a
 * type because list colors still carry a light variant, until the components are redrawn.
 */
export type ColorScheme = 'light' | 'dark';

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

/**
 * The one look of the app (Fase 6, the redesign): no themes to choose from. Gunmetal surfaces,
 * ivory text, midnight-green chrome, sand for streaks and highlights, orange for the main action
 * only (never small text: 4.35:1 on gunmetal). The same in every depth zone, while the depths
 * are rethought. Every text pair is checked in contrast.test.ts.
 */
export const appColors: ThemeColors = {
  surfaceTop: '#1D2A31',
  surfaceBase: '#161F25',
  surfaceDeep: '#10171C',
  surfaceRaised: '#233038',
  surfacePressed: '#2C3B44',
  glass: 'rgba(35, 48, 56, 0.82)',
  glassFallback: 'rgba(35, 48, 56, 0.97)',
  glassBorder: 'rgba(211, 219, 221, 0.08)',
  scrim: 'rgba(8, 12, 15, 0.55)',
  textPrimary: '#FDF6E3',
  textSecondary: '#D3DBDD',
  textTertiary: '#AAB6BA',
  separator: 'rgba(211, 219, 221, 0.1)',
  border: '#3A4A52',
  accent: '#4FC9B8',
  accentPressed: '#7AD9CC',
  accentSoft: 'rgba(79, 201, 184, 0.14)',
  onAccent: '#0B2A2E',
  focusRing: '#F4D47C',
  priority: '#FF8A4C',
  success: '#6FD49B',
  warning: '#F4D47C',
  error: '#FF7B72',
  info: '#79B8F0',
  caustic: '#4FC9B8',
  waterline: 'rgba(79, 201, 184, 0.14)',
  shadow: '#000000',
  deepTop: '#0B5F66',
  deepBottom: '#06363C',
  deepBorder: 'rgba(244, 212, 124, 0.12)',
  onDeep: '#FDF6E3',
  onDeepSecondary: '#D3DBDD',
  deepAccent: '#F4D47C',
  deepAccentSoft: 'rgba(244, 212, 124, 0.16)',
  onDeepAccent: '#233038',
  energy: '#FF5B04',
  energyPressed: '#FF7A33',
  onEnergy: '#1A1410',
  lamp: '#4FC9B8',
  cardShadow: '#000000',
  cardShadowOpacity: 0.35,
};

/**
 * "Alto contraste" (an accessibility choice, not a theme): secondary and tertiary text close
 * to the primary, firmer separators and borders. Laid over the colors above.
 */
export const highContrastColors: Partial<ThemeColors> = {
  textSecondary: '#F2F5F5',
  textTertiary: '#DDE4E6',
  separator: 'rgba(211, 219, 221, 0.3)',
  border: '#6B7C84',
  glassBorder: 'rgba(211, 219, 221, 0.38)',
};

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
