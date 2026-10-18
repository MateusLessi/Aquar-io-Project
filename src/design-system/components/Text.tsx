import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { typography, type ThemeColors, type TypographyVariant } from '../tokens';

type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'onAccent'
  | 'priority'
  | 'error'
  | 'onDeep'
  | 'onDeepSecondary'
  | 'deepAccent'
  | 'onEnergy'
  | 'onDeepAccent';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: TextTone;
  /** Strike through and dim, e.g. a completed task. */
  struck?: boolean;
};

const toneToColor: Record<TextTone, keyof ThemeColors> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  accent: 'accent',
  onAccent: 'onAccent',
  priority: 'priority',
  error: 'error',
  onDeep: 'onDeep',
  onDeepSecondary: 'onDeepSecondary',
  deepAccent: 'deepAccent',
  onEnergy: 'onEnergy',
  onDeepAccent: 'onDeepAccent',
};

/** Titles grow with the OS text size too, but are capped so layouts stay intact. */
const maxScale: Partial<Record<TypographyVariant, number>> = {
  display: 1.3,
  largeTitle: 1.5,
  title1: 1.6,
  title2: 1.8,
};

export function Text({
  variant = 'body',
  tone = 'primary',
  struck = false,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const isHeading = variant === 'largeTitle' || variant === 'title1' || variant === 'title2';

  return (
    <RNText
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={maxScale[variant]}
      style={[
        typography[variant],
        { color: colors[struck ? 'textTertiary' : toneToColor[tone]] },
        struck && { textDecorationLine: 'line-through' },
        style,
      ]}
      {...rest}
    />
  );
}
