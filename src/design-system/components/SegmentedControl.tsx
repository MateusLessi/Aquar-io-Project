import { Check, type LucideIcon } from 'lucide-react-native';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '../haptics';
import { useTheme } from '../theme/ThemeProvider';
import { fontFamily, radius, spacing, touchTarget } from '../tokens';
import { Text } from './Text';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Shown before the label, so the choice reads at a glance. */
  icon?: LucideIcon;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Describes the whole group, e.g. "Tema". */
  accessibilityLabel: string;
  /** Smaller, for a second row under the main one (e.g. Dia / Semana under Agenda). */
  compact?: boolean;
};

/** Set by a dropdown: its segmented controls stand as a list and tell it when you pick. */
const ListModeContext = createContext<{ onChoose: () => void } | null>(null);

/**
 * Turns the segmented controls inside into a vertical list (the phone's dropdown of
 * subtopics); `onChoose` runs after a pick, so the dropdown can close.
 */
export function SegmentedListMode({
  onChoose,
  children,
}: {
  onChoose: () => void;
  children: ReactNode;
}) {
  return <ListModeContext.Provider value={{ onChoose }}>{children}</ListModeContext.Provider>;
}

/** Whether this sits in a dropdown's list (so a bar can lay its extras out as rows). */
export function useSegmentedListMode(): boolean {
  return useContext(ListModeContext) !== null;
}

/** An action at the end of a dropdown's list (e.g. "Novo na agenda"); it closes the list. */
export function SegmentedListAction({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  const list = useContext(ListModeContext);
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        list?.onChoose();
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        styles.action,
        { borderTopColor: colors.separator },
        pressed && { backgroundColor: colors.surfacePressed },
      ]}
    >
      <Icon size={18} strokeWidth={2.3} color={colors.accent} />
      <Text variant="bodyStrong" tone="accent" style={styles.flex} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A small set of mutually exclusive options, e.g. System / Light / Dark. */
export function SegmentedControl<T extends string>(props: SegmentedControlProps<T>) {
  const list = useContext(ListModeContext);
  return list ? <SegmentedList {...props} onChoose={list.onChoose} /> : <Segmented {...props} />;
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  compact = false,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  // Narrow: only the chosen option keeps its icon, so every word still fits.
  const [narrow, setNarrow] = useState(false);

  return (
    <View
      onLayout={(e) => {
        const next = e.nativeEvent.layout.width / options.length < (compact ? 92 : 110);
        if (next !== narrow) setNarrow(next);
      }}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: colors.surfacePressed }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(option.value);
            }}
            style={[
              styles.segment,
              compact && styles.compact,
              selected && [
                styles.selected,
                { backgroundColor: colors.surfaceRaised, shadowColor: colors.shadow },
              ],
            ]}
          >
            {option.icon && (selected || !narrow) ? (
              <option.icon
                size={compact ? 15 : 17}
                strokeWidth={selected ? 2.3 : 1.9}
                color={selected ? colors.textPrimary : colors.textSecondary}
              />
            ) : null}
            <Text
              variant={compact ? 'callout' : selected ? 'bodyStrong' : 'body'}
              style={compact && selected ? styles.strong : undefined}
              tone={selected ? 'primary' : 'secondary'}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The same choice as a vertical list, in a dropdown. Picking closes it. */
function SegmentedList<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  onChoose,
}: SegmentedControlProps<T> & { onChoose: () => void }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={styles.list}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            onPress={() => {
              if (!selected) {
                haptics.selection();
                onChange(option.value);
              }
              onChoose();
            }}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: selected
                  ? colors.surfaceRaised
                  : pressed
                    ? colors.surfacePressed
                    : 'transparent',
              },
            ]}
          >
            {option.icon ? (
              <option.icon
                size={18}
                strokeWidth={selected ? 2.3 : 1.9}
                color={selected ? colors.textPrimary : colors.textSecondary}
              />
            ) : null}
            <Text
              variant={selected ? 'bodyStrong' : 'body'}
              tone={selected ? 'primary' : 'secondary'}
              style={styles.flex}
              numberOfLines={1}
            >
              {option.label}
            </Text>
            {selected ? <Check size={18} strokeWidth={2.4} color={colors.textPrimary} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 2 },
  row: {
    minHeight: touchTarget,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  flex: { flex: 1 },
  action: { marginTop: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth },
  track: { flexDirection: 'row', borderRadius: radius.pill, padding: spacing.xs },
  segment: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  compact: { minHeight: 36, paddingHorizontal: spacing.sm },
  strong: { fontFamily: fontFamily.textBold },
  selected: {
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
