import { ChevronDown, ChevronRight, ListTodo, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState, Surface, Text, listColors, spacing, useTheme } from '@/design-system';

import { toDateKey } from '../domain/dates';
import type { TaskWithList } from '../domain/types';
import { useFolderTasks } from '../hooks/queries';
import { useTodo } from '../hooks/todoContext';
import { AddTaskField } from './AddTaskField';
import { TaskDetailSheet } from './TaskDetailSheet';
import { TaskRow } from './TaskRow';

type Group = { listId: string; tasks: TaskWithList[] };

/** Groups in the order their first task appears, so the most urgent list comes first. */
function byList(tasks: TaskWithList[]): Group[] {
  const groups = new Map<string, Group>();
  for (const task of tasks) {
    const group = groups.get(task.listId) ?? { listId: task.listId, tasks: [] };
    group.tasks.push(task);
    groups.set(task.listId, group);
  }
  return [...groups.values()];
}

/**
 * "Tudo junto": every task inside a folder and its subfolders, grouped by list and ordered
 * by due date. Tasks can be completed, opened and added right here. Completed ones wait at
 * the end, hidden until asked for.
 */
export function FolderTasksView({ folderId }: { folderId: string | null }) {
  const todo = useTodo();
  const { colors, scheme } = useTheme();
  const { data: tasks = [], loading } = useFolderTasks(folderId);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const todayKey = toDateKey(new Date());

  const open = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => t.completedAt);
  const toggle = (id: string) => (completed: boolean) =>
    todo.setCompleted(id, completed).catch((e: unknown) => console.error(e));

  if (!loading && tasks.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="Nenhuma tarefa aqui"
        message="As tarefas das listas desta pasta aparecem juntas aqui, pelo prazo."
      />
    );
  }

  return (
    <View style={styles.root}>
      {byList(open).map((group) => {
        const first = group.tasks[0]!;
        const tone = first.listColor ? listColors[first.listColor][scheme] : colors.accent;
        return (
          <Surface key={group.listId} style={styles.group}>
            <View style={styles.header}>
              <Text variant="headline" style={[styles.flex, { color: tone }]} numberOfLines={1}>
                {first.listEmoji ? `${first.listEmoji} ` : ''}
                {first.listName}
                <Text variant="footnote" tone="tertiary">
                  {'  '}
                  {group.tasks.length}
                </Text>
              </Text>
              <Pressable
                onPress={() => setAdding(adding === group.listId ? null : group.listId)}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar tarefa em ${first.listName}`}
                hitSlop={10}
              >
                <Plus size={20} color={tone} />
              </Pressable>
            </View>
            {adding === group.listId ? (
              <AddTaskField
                placeholder={`Adicionar em ${first.listName}`}
                onAdd={(title) =>
                  todo.createTask({ listId: group.listId, title }).then(() => undefined)
                }
              />
            ) : null}
            {group.tasks.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                todayKey={todayKey}
                listColor={task.listColor}
                separator={index > 0}
                onToggle={toggle(task.id)}
                onPress={() => setSelected(task.id)}
              />
            ))}
          </Surface>
        );
      })}

      {done.length > 0 ? (
        <View style={styles.doneSection}>
          <Pressable
            onPress={() => setShowDone((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showDone }}
            style={styles.doneHeader}
          >
            {showDone ? (
              <ChevronDown size={18} color={colors.textSecondary} />
            ) : (
              <ChevronRight size={18} color={colors.textSecondary} />
            )}
            <Text variant="headline" tone="secondary">
              {showDone ? 'Esconder concluídas' : `Mostrar concluídas (${done.length})`}
            </Text>
          </Pressable>
          {showDone ? (
            <Surface>
              {done.map((task, index) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  todayKey={todayKey}
                  listColor={task.listColor}
                  listName={task.listName}
                  listEmoji={task.listEmoji}
                  separator={index > 0}
                  onToggle={toggle(task.id)}
                  onPress={() => setSelected(task.id)}
                />
              ))}
            </Surface>
          ) : null}
        </View>
      ) : null}

      <TaskDetailSheet taskId={selected} todayKey={todayKey} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  group: { paddingTop: spacing.md, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  flex: { flex: 1 },
  doneSection: { gap: spacing.sm },
  doneHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.xs },
});
