import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { fontFamily, radius, spacing } from '../tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type ChipProps = {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  icon?: LucideIcon;
  /** A small color dot before the label, e.g. a list color. */
  dotColor?: string;
  /** Left text, e.g. an emoji. */
  leadingText?: string;
  accessibilityHint?: string;
  testID?: string;
};

/** A compact, selectable pill: quick choices such as "Hoje" or a list. */
export function Chip({
  label,
  onPress,
  selected = false,
  icon: Icon,
  dotColor,
  leadingText,
  accessibilityHint,
  testID,
}: ChipProps) {
  const { colors } = useTheme();
  const content = selected ? colors.onAccent : colors.textPrimary;

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      aria-selected={selected}
      focusRadius={radius.pill}
    >
      <View
        style={[
          styles.chip,
          selected
            ? { backgroundColor: colors.accent, borderColor: colors.accent }
            : { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
        ]}
      >
        {Icon ? <Icon size={16} strokeWidth={2} color={content} /> : null}
        {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
        {leadingText ? <Text variant="callout">{leadingText}</Text> : null}
        <Text variant="callout" style={[styles.label, { color: content }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontFamily: fontFamily.textSemiBold },
});
