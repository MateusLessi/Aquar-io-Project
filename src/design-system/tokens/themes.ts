import { abyss, ocean } from './palette';

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
  textTertiary: '#5C7382',
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
  textTertiary: '#7A93A2',
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
};

export const themeColors: Record<ColorScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
