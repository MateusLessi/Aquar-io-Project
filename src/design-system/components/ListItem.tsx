import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { spacing, touchTarget } from '../tokens';
import { Text } from './Text';

/** Where the separator starts when there is a leading control (aligned with the title). */
const LEADING_INSET = spacing.lg + 24 + spacing.md + 2;

export type ListItemProps = {
  title: string;
  /** Secondary line: a string, or custom content such as list dot + time. */
  subtitle?: ReactNode;
  /** Usually a Checkbox or an icon. It handles its own presses. */
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  /** Dims and strikes the title, e.g. a completed task. */
  completed?: boolean;
  /** Draws a separator above this row (not on the first row of a group). */
  separator?: boolean;
  /** Color mark on the leading edge, e.g. the task's list color. */
  accentColor?: string;
  accessibilityHint?: string;
  testID?: string;
};

/** A row inside a solid Surface. Pressing the row opens details; the leading control acts on its own. */
export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  selected = false,
  disabled = false,
  completed = false,
  separator = false,
  accentColor,
  accessibilityHint,
  testID,
}: ListItemProps) {
  const { colors } = useTheme();

  const content = (
    <>
      {separator ? (
        <View
          style={[
            styles.separator,
            { backgroundColor: colors.separator, left: leading ? LEADING_INSET : spacing.lg },
          ]}
        />
      ) : null}
      {accentColor ? <View style={[styles.accent, { backgroundColor: accentColor }]} /> : null}
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.texts}>
        <Text variant="body" struck={completed}>
          {title}
        </Text>
        {typeof subtitle === 'string' ? (
          <Text variant="footnote" tone="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : subtitle ? (
          <View style={styles.subtitle}>{subtitle}</View>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  // A row that does nothing itself (its switch or control acts) is a plain container: a
  // disabled button around it would make screen readers announce the control as disabled too.
  if (!onPress) {
    return (
      <View
        testID={testID}
        style={[
          styles.row,
          selected && { backgroundColor: colors.surfacePressed },
          disabled && styles.disabled,
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected }}
      style={({ pressed }) => [
        styles.row,
        (pressed || selected) && { backgroundColor: colors.surfacePressed },
        disabled && styles.disabled,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: touchTarget + 8,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.md + 2,
  },
  leading: { paddingTop: 1 },
  separator: { position: 'absolute', top: 0, right: 0, height: StyleSheet.hairlineWidth },
  accent: {
    position: 'absolute',
    left: 0,
    top: spacing.md,
    bottom: spacing.md,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  texts: { flex: 1 },
  subtitle: { marginTop: 3 },
  trailing: { alignSelf: 'center' },
  disabled: { opacity: 0.4 },
});
