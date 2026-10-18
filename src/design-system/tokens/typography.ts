import type { TextStyle } from 'react-native';

/**
 * Font families as registered by `useFonts` (see `fonts.ts`).
 * Custom fonts on Android ignore `fontWeight`, so each weight is its own family.
 */
export const fontFamily = {
  displayMedium: 'Outfit_500Medium',
  displaySemiBold: 'Outfit_600SemiBold',
  displayBold: 'Outfit_700Bold',
  textRegular: 'Manrope_400Regular',
  textMedium: 'Manrope_500Medium',
  textSemiBold: 'Manrope_600SemiBold',
  textBold: 'Manrope_700Bold',
} as const;

export type TypographyVariant =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'headline'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'footnote'
  | 'caption'
  | 'overline'
  | 'numeric';

/** Outfit for titles and numbers, Manrope for reading text. */
export const typography: Record<TypographyVariant, TextStyle> = {
  largeTitle: {
    fontFamily: fontFamily.displayBold,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -0.6,
  },
  title1: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  title2: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  headline: { fontFamily: fontFamily.textSemiBold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fontFamily.textMedium, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.textSemiBold, fontSize: 16, lineHeight: 22 },
  callout: { fontFamily: fontFamily.textRegular, fontSize: 15, lineHeight: 20 },
  footnote: { fontFamily: fontFamily.textRegular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fontFamily.textSemiBold, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: fontFamily.textBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  numeric: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 17,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
};
