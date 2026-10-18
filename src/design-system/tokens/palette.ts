/**
 * Raw color scales. Components never use these directly; they use the
 * semantic tokens in `themes.ts`, which map these values per theme.
 */

/** Accent: petrol blue with a slight green cast. */
export const ocean = {
  50: '#E8F7F6',
  100: '#C6ECE9',
  200: '#93DAD5',
  300: '#5CC3BD',
  400: '#2FA9A4',
  500: '#168C89',
  600: '#0E716F',
  700: '#0D5A5A',
  800: '#0E4748',
  900: '#0C3A3C',
  950: '#062224',
} as const;

/** Neutrals: always blue-tinted, never pure grey. */
export const abyss = {
  50: '#F3F7F9',
  100: '#E4ECF0',
  200: '#C9D6DD',
  300: '#A3B6C0',
  400: '#7891A0',
  500: '#587283',
  600: '#445A69',
  700: '#344654',
  800: '#22313D',
  900: '#15212B',
  950: '#0A141C',
} as const;

/** Pure white, used only for specular highlights (light reflecting on water). */
export const specular = '#FFFFFF';

/** Colors a user can pick for a list. Each has a tone per theme. */
export const listColors = {
  lagoon: { light: '#1E8E89', dark: '#4CC0B9' },
  tide: { light: '#2F75B5', dark: '#6FA9E0' },
  coral: { light: '#C9573F', dark: '#EE8A73' },
  kelp: { light: '#4E8549', dark: '#86BF7F' },
  sand: { light: '#A57B36', dark: '#D7B477' },
  anemone: { light: '#8358B3', dark: '#B697DE' },
} as const;

export type ListColorName = keyof typeof listColors;
export const listColorNames = Object.keys(listColors) as ListColorName[];
