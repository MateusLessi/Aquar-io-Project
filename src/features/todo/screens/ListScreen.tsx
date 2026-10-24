import { useRouter } from 'expo-router';
import { ChevronDown, ChevronRight, ListTodo, Pencil, SearchX } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState, IconButton, Screen, Surface, Text, spacing, useTheme } from '@/design-system';

import { AddTaskField } from '../components/AddTaskField';
import { ListEditorSheet } from '../components/ListEditorSheet';
import { TaskDetailSheet } from '../components/TaskDetailSheet';
import { TaskRow } from '../components/TaskRow';
import { toDateKey } from '../domain/dates';
import { useFolderContents, useList, useListTasks } from '../hooks/queries';
import { useTodo } from '../hooks/todoContext';

export function ListScreen({
  listId,
  footer,
}: {
  listId: string;
  /** Extra section after the tasks (the app shell's "Usada em"). */
  footer?: (list: { id: string; name: string }) => React.ReactNode;
}) {
  const router = useRouter();
  const todo = useTodo();
  const { colors } = useTheme();
  const { data: list, loading } = useList(listId);
  const { data: tasks = [] } = useListTasks(listId);
  const { data: place } = useFolderContents(list?.folderId ?? null);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const todayKey = toDateKey(new Date());
  const back = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/aquarium', params: { tab: 'lists' } });

  if (loading) return <Screen title="" onBack={back} />;

  if (!list) {
    return (
      <Screen title="Lista" onBack={back}>
        <EmptyState
          icon={SearchX}
          title="Esta lista não existe mais"
          message="Ela pode ter sido excluída."
          action={{
            label: 'Ver listas',
            onPress: () => router.replace({ pathname: '/aquarium', params: { tab: 'lists' } }),
          }}
        />
      </Screen>
    );
  }

  const open = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => t.completedAt);
  const toggle = (id: string) => (completed: boolean) => {
    todo.setCompleted(id, completed).catch((e: unknown) => console.error(e));
  };

  return (
    <Screen
      title={list.name}
      eyebrow={[
        place?.path.length ? place.path.map((c) => c.name).join(' › ') : null,
        list.emoji,
        open.length === 0 ? 'Tudo em dia' : `${open.length} pendentes`,
      ]
        .filter(Boolean)
        .join('  ·  ')}
      onBack={back}
      actions={<IconButton icon={Pencil} label="Editar lista" onPress={() => setEditing(true)} />}
    >
      <AddTaskField onAdd={(title) => todo.createTask({ listId, title }).then(() => undefined)} />

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Nenhuma tarefa ainda"
          message="Escreva acima e aperte Enter. Dá para adicionar várias seguidas."
        />
      ) : null}

      {open.length > 0 ? (
        <Surface>
          {open.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              todayKey={todayKey}
              listColor={list.color}
              separator={index > 0}
              onToggle={toggle(task.id)}
              onPress={() => setSelected(task.id)}
            />
          ))}
        </Surface>
      ) : null}

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
              Concluídas ({done.length})
            </Text>
          </Pressable>
          {showDone ? (
            <Surface>
              {done.map((task, index) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  todayKey={todayKey}
                  listColor={list.color}
                  separator={index > 0}
                  onToggle={toggle(task.id)}
                  onPress={() => setSelected(task.id)}
                />
              ))}
            </Surface>
          ) : null}
        </View>
      ) : null}

      {footer?.({ id: list.id, name: list.name })}

      <TaskDetailSheet taskId={selected} todayKey={todayKey} onClose={() => setSelected(null)} />
      <ListEditorSheet
        visible={editing}
        list={list}
        onClose={() => setEditing(false)}
        onDeleted={() => router.replace({ pathname: '/aquarium', params: { tab: 'lists' } })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  doneSection: { gap: spacing.sm },
  doneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.xs,
  },
});
