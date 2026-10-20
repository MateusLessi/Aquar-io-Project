import { Plus } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Surface, Text, spacing, touchTarget, typography, useTheme } from '@/design-system';

import { ValidationError } from '../domain/validation';

type AddTaskFieldProps = {
  placeholder?: string;
  onAdd: (title: string) => Promise<void>;
};

/** Always-visible "add a task" row: type, press enter, keep typing the next one. */
export function AddTaskField({ placeholder = 'Adicionar tarefa', onAdd }: AddTaskFieldProps) {
  const { colors } = useTheme();
  const [title, setTitleState] = useState('');
  const [error, setError] = useState<string | null>(null);
  // The latest text, updated synchronously: pressing Enter right after typing must submit
  // what was just typed, even before React re-renders with the new state.
  const latest = useRef('');

  const setTitle = (text: string) => {
    latest.current = text;
    setTitleState(text);
  };

  const submit = async () => {
    const value = latest.current;
    if (!value.trim()) return;
    // Clear right away so fast typists can start the next task while this one saves.
    setTitle('');
    setError(null);
    try {
      await onAdd(value);
    } catch (e) {
      if (!latest.current) setTitle(value);
      setError(
        e instanceof ValidationError ? e.message : 'Não foi possível adicionar. Tente de novo.',
      );
    }
  };

  return (
    <View>
      <Surface style={styles.row}>
        <Plus size={22} color={colors.accent} strokeWidth={2.2} />
        <TextInput
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={submit}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
          accessibilityLabel={placeholder}
          style={[typography.body, styles.input, { color: colors.textPrimary }]}
        />
      </Surface>
      {error ? (
        <Text variant="footnote" tone="error" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget + 12,
  },
  input: { flex: 1, paddingVertical: spacing.md },
  error: { marginTop: spacing.xs, marginLeft: spacing.sm },
});
