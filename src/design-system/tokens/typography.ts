import type { TextStyle } from 'react-native';

/**
 * Font families as registered by `useFonts` (see `fonts.ts`).
 * Custom fonts on Android ignore `fontWeight`, so each weight is its own family.
 */
export const fontFamily = {
  displayMedium: 'PlusJakartaSans_600SemiBold',
  displaySemiBold: 'PlusJakartaSans_700Bold',
  displayBold: 'PlusJakartaSans_800ExtraBold',
  textRegular: 'PlusJakartaSans_400Regular',
  textMedium: 'PlusJakartaSans_500Medium',
  textSemiBold: 'PlusJakartaSans_600SemiBold',
  textBold: 'PlusJakartaSans_700Bold',
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
  | 'numeric'
  | 'display';

/** Plus Jakarta Sans everywhere: tight and heavy for titles and numbers, open for reading. */
export const typography: Record<TypographyVariant, TextStyle> = {
  largeTitle: {
    fontFamily: fontFamily.displayBold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1.1,
  },
  title1: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.6,
  },
  title2: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.4,
  },
  headline: { fontFamily: fontFamily.textBold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  body: { fontFamily: fontFamily.textMedium, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fontFamily.textBold, fontSize: 15, lineHeight: 21 },
  callout: { fontFamily: fontFamily.textMedium, fontSize: 14, lineHeight: 20 },
  footnote: { fontFamily: fontFamily.textMedium, fontSize: 12.5, lineHeight: 17 },
  caption: { fontFamily: fontFamily.textSemiBold, fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: fontFamily.textBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  /** Hero numbers, e.g. the day's tide. */
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  numeric: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 17,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
};
