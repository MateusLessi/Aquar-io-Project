import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput as RNTextInput, View } from 'react-native';

import {
  Button,
  Checkbox,
  ConfirmDialog,
  SegmentedControl,
  Sheet,
  Surface,
  Text,
  TextInput,
  spacing,
  typography,
  useTheme,
} from '@/design-system';

import type { Priority, Task } from '../domain/types';
import { ValidationError, priorityLabels } from '../domain/validation';
import { useSubtasks, useTask } from '../hooks/queries';
import { useTodo } from '../hooks/todoContext';
import { AddTaskField } from './AddTaskField';
import { DueDatePicker } from './DueDatePicker';
import { ReminderField, RepeatField } from './RepeatAndReminder';

const priorityOptions = ([0, 1, 2, 3] as Priority[]).map((value) => ({
  value: String(value) as `${Priority}`,
  label: priorityLabels[value],
}));

type TaskDetailSheetProps = {
  taskId: string | null;
  todayKey: string;
  onClose: () => void;
};

/** Everything about one task, edited in place: changes save as you go. */
export function TaskDetailSheet({ taskId, todayKey, onClose }: TaskDetailSheetProps) {
  const { data: task } = useTask(taskId);
  const open = Boolean(taskId);

  return (
    <Sheet visible={open} onClose={onClose}>
      {task ? <TaskDetail key={task.id} task={task} todayKey={todayKey} onClose={onClose} /> : null}
    </Sheet>
  );
}

function TaskDetail({
  task,
  todayKey,
  onClose,
}: {
  task: Task;
  todayKey: string;
  onClose: () => void;
}) {
  const todo = useTodo();
  const { colors } = useTheme();
  const { data: subtasks = [] } = useSubtasks(task.parentTaskId ? null : task.id);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const attempt = async (work: () => Promise<void>) => {
    try {
      await work();
      setError(null);
    } catch (e) {
      setError(
        e instanceof ValidationError ? e.message : 'Não foi possível salvar. Tente de novo.',
      );
    }
  };

  const saveTitle = () => {
    if (title.trim() === task.title) return;
    return attempt(() => todo.updateTask(task.id, { title }));
  };

  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <View style={styles.check}>
          <Checkbox
            checked={Boolean(task.completedAt)}
            label={task.title}
            onChange={(checked) => attempt(() => todo.setCompleted(task.id, checked))}
          />
        </View>
        <RNTextInput
          value={title}
          onChangeText={setTitle}
          onBlur={saveTitle}
          onSubmitEditing={saveTitle}
          submitBehavior="blurAndSubmit"
          multiline
          accessibilityLabel="Título da tarefa"
          selectionColor={colors.accent}
          style={[
            typography.title2,
            styles.title,
            { color: colors.textPrimary },
            task.completedAt
              ? { textDecorationLine: 'line-through', color: colors.textTertiary }
              : null,
          ]}
        />
      </View>
      {error ? (
        <Text variant="footnote" tone="error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Section title="Prazo">
        <DueDatePicker
          value={task.dueDate}
          todayKey={todayKey}
          onChange={(dueDate) => attempt(() => todo.updateTask(task.id, { dueDate }))}
        />
      </Section>

      {task.dueDate ? (
        <>
          {task.parentTaskId ? null : (
            <Section title="Repetir">
              <RepeatField
                task={task}
                onChange={(patch) => attempt(() => todo.updateTask(task.id, patch))}
              />
            </Section>
          )}
          <Section title="Lembrete">
            <ReminderField
              task={task}
              onChange={(patch) => attempt(() => todo.updateTask(task.id, patch))}
            />
          </Section>
        </>
      ) : (
        <Text variant="footnote" tone="tertiary" style={styles.hint}>
          Com um prazo, a tarefa pode se repetir e ter lembrete.
        </Text>
      )}

      <Section title="Prioridade">
        <SegmentedControl
          accessibilityLabel="Prioridade"
          options={priorityOptions}
          value={String(task.priority) as `${Priority}`}
          onChange={(value) =>
            attempt(() => todo.updateTask(task.id, { priority: Number(value) as Priority }))
          }
        />
      </Section>

      {task.parentTaskId ? null : (
        <Section
          title={`Subtarefas${subtasks.length ? ` · ${subtasks.filter((s) => s.completedAt).length}/${subtasks.length}` : ''}`}
        >
          {subtasks.length > 0 ? (
            <Surface>
              {subtasks.map((subtask, index) => (
                <View
                  key={subtask.id}
                  style={[
                    styles.subtask,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.separator,
                    },
                  ]}
                >
                  <Checkbox
                    checked={Boolean(subtask.completedAt)}
                    label={subtask.title}
                    onChange={(checked) => attempt(() => todo.setCompleted(subtask.id, checked))}
                  />
                  <Text variant="body" struck={Boolean(subtask.completedAt)} style={styles.flex}>
                    {subtask.title}
                  </Text>
                  <Pressable
                    onPress={() => attempt(() => todo.deleteTask(subtask.id))}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover subtarefa ${subtask.title}`}
                    hitSlop={10}
                  >
                    <X size={18} color={colors.textTertiary} />
                  </Pressable>
                </View>
              ))}
            </Surface>
          ) : null}
          <AddTaskField
            placeholder="Adicionar subtarefa"
            onAdd={(subtaskTitle) =>
              todo
                .createTask({ listId: task.listId, parentTaskId: task.id, title: subtaskTitle })
                .then(() => undefined)
            }
          />
        </Section>
      )}

      <Section title="Notas">
        <TextInput
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          onBlur={() => {
            if (notes.trim() !== (task.notes ?? '')) {
              void attempt(() => todo.updateTask(task.id, { notes }));
            }
          }}
          multiline
          placeholder="Detalhes, links, ideias…"
        />
      </Section>

      <Button
        label="Excluir tarefa"
        variant="danger"
        block
        onPress={() => setConfirmDelete(true)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="Excluir tarefa?"
        message={
          subtasks.length > 0
            ? `"${task.title}" e suas ${subtasks.length} subtarefas serão excluídas.`
            : `"${task.title}" será excluída.`
        }
        confirmLabel="Excluir"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          await todo.deleteTask(task.id);
          onClose();
        }}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" tone="tertiary" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xl, paddingBottom: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  check: { paddingTop: 4 },
  title: { flex: 1, padding: 0 },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  subtask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  flex: { flex: 1 },
  hint: { marginLeft: spacing.xs, marginTop: -spacing.md },
});
