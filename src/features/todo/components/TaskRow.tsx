import { CalendarDays, ListChecks, StickyNote } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import {
  Checkbox,
  ListItem,
  Text,
  fontFamily,
  listColors,
  spacing,
  useTheme,
  type ListColorName,
} from '@/design-system';

import { dueLabel, dueStatus } from '../domain/dates';
import type { Task } from '../domain/types';
import { priorityLabels } from '../domain/validation';

type TaskRowProps = {
  task: Task;
  todayKey: string;
  listColor: ListColorName | null;
  onToggle: (completed: boolean) => void;
  onPress: () => void;
  separator?: boolean;
  /** Shown on screens that mix lists (e.g. Today). */
  listName?: string;
  listEmoji?: string | null;
};

/** A task in a list: checkbox, title and a compact line of details. */
export function TaskRow({
  task,
  todayKey,
  listColor,
  onToggle,
  onPress,
  separator,
  listName,
  listEmoji,
}: TaskRowProps) {
  const { colors, scheme } = useTheme();
  const done = Boolean(task.completedAt);
  const tone = listColor ? listColors[listColor][scheme] : colors.accent;
  const overdue = !done && task.dueDate !== null && dueStatus(task.dueDate, todayKey) === 'overdue';

  const details = [
    task.priority > 0 && !done ? (
      <Text
        key="priority"
        variant="footnote"
        tone={task.priority === 3 ? 'priority' : 'secondary'}
        style={task.priority === 3 ? styles.strong : undefined}
      >
        {priorityLabels[task.priority]}
      </Text>
    ) : null,
    listName ? (
      <View key="list" style={styles.inline}>
        {listEmoji ? (
          <Text variant="footnote">{listEmoji}</Text>
        ) : (
          <View style={[styles.dot, { backgroundColor: tone }]} />
        )}
        <Text variant="footnote" tone="secondary" numberOfLines={1}>
          {listName}
        </Text>
      </View>
    ) : null,
    task.dueDate ? (
      <View key="due" style={styles.inline}>
        <CalendarDays size={13} color={overdue ? colors.error : colors.textSecondary} />
        <Text variant="footnote" tone={overdue ? 'error' : 'secondary'}>
          {dueLabel(task.dueDate, todayKey)}
        </Text>
      </View>
    ) : null,
    task.subtaskCount > 0 ? (
      <View key="subtasks" style={styles.inline}>
        <ListChecks size={13} color={colors.textSecondary} />
        <Text variant="footnote" tone="secondary">
          {task.subtaskDoneCount}/{task.subtaskCount}
        </Text>
      </View>
    ) : null,
    task.notes ? (
      <StickyNote
        key="notes"
        size={13}
        color={colors.textSecondary}
        accessibilityLabel="Tem notas"
      />
    ) : null,
  ].filter(Boolean);

  return (
    <ListItem
      title={task.title}
      completed={done}
      separator={separator}
      accentColor={done ? undefined : tone}
      onPress={onPress}
      accessibilityHint="Abre os detalhes da tarefa"
      leading={<Checkbox checked={done} label={task.title} onChange={onToggle} />}
      subtitle={details.length > 0 ? <View style={styles.details}>{details}</View> : undefined}
    />
  );
}

const styles = StyleSheet.create({
  details: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.md },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 180 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  strong: { fontFamily: fontFamily.textBold },
});
