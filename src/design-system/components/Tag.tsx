import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../tokens';
import { withAlpha } from '../utils/color';
import { Text } from './Text';

export type TagTone = 'accent' | 'sand' | 'neutral';

export type TagProps = {
  label: string;
  /** accent: a state ("Jovem"); sand: an achievement ("7 dias seguidos"); neutral: a fact. */
  tone?: TagTone;
  icon?: LucideIcon;
};

/**
 * A small label that only informs (Fase 6), unlike `Chip`, which is pressed. A soft pill in the
 * tone's color with the text in the same color.
 */
export function Tag({ label, tone = 'accent', icon: Icon }: TagProps) {
  const { colors } = useTheme();
  const color = { accent: colors.accent, sand: colors.warning, neutral: colors.textSecondary }[
    tone
  ];
  return (
    <View style={[styles.tag, { backgroundColor: withAlpha(color, 0.14) }]}>
      {Icon ? <Icon size={13} strokeWidth={2.4} color={color} /> : null}
      <Text variant="caption" style={{ color }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
});
