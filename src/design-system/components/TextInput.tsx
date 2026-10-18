import { useId, useState } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, touchTarget, typography } from '../tokens';
import { Text } from './Text';

export type TextInputProps = Omit<RNTextInputProps, 'style' | 'editable'> & {
  label: string;
  /** When set, the field shows an error state and announces the message. */
  error?: string;
  disabled?: boolean;
};

export function TextInput({
  label,
  error,
  disabled = false,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const errorId = useId();

  const borderColor = error ? colors.error : focused ? colors.accent : colors.border;

  return (
    <View style={[styles.root, disabled && styles.disabled]}>
      <Text variant="footnote" tone="secondary" style={styles.label}>
        {label}
      </Text>
      <RNTextInput
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        editable={!disabled}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          typography.body,
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surfaceRaised,
            borderColor,
            borderWidth: focused || error ? 2 : 1,
          },
        ]}
        {...rest}
      />
      {error ? (
        <Text
          nativeID={errorId}
          variant="footnote"
          tone="error"
          accessibilityLiveRegion="polite"
          style={styles.error}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  disabled: { opacity: 0.5 },
  label: { marginLeft: spacing.xs },
  input: {
    minHeight: touchTarget + 4,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  error: { marginLeft: spacing.xs },
});
