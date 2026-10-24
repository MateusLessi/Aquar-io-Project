import { useRouter } from 'expo-router';
import { CheckSquare } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Surface, Text, radius, spacing, useTheme } from '@/design-system';

import { dueStatus } from '../domain/dates';
import type { TaskWithList } from '../domain/types';
import { useToday } from '../hooks/queries';
import { useTodo } from '../hooks/todoContext';
import { TaskDetailSheet } from './TaskDetailSheet';
import { TaskRow } from './TaskRow';

/**
 * Today's tasks for the dashboard: overdue ones first, then the ones due today. With nothing
 * due, a small card points to the lists instead of taking over the screen.
 */
export function TodayTasks() {
  const router = useRouter();
  const todo = useTodo();
  const { colors } = useTheme();
  const { data: tasks = [], todayKey } = useToday();
  const [selected, setSelected] = useState<string | null>(null);

  const overdue = tasks.filter((t) => t.dueDate && dueStatus(t.dueDate, todayKey) === 'overdue');
  const dueToday = tasks.filter((t) => t.dueDate === todayKey);

  const section = (title: string, items: TaskWithList[]) =>
    items.length > 0 ? (
      <View style={styles.section}>
        <Text variant="overline" tone="tertiary" style={styles.sectionTitle}>
          {title}
        </Text>
        <Surface>
          {items.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              todayKey={todayKey}
              listColor={task.listColor}
              listName={[...task.listPath, task.listName].join(' › ')}
              listEmoji={task.listEmoji}
              separator={index > 0}
              onToggle={(done) =>
                todo.setCompleted(task.id, done).catch((e: unknown) => console.error(e))
              }
              onPress={() => setSelected(task.id)}
            />
          ))}
        </Surface>
      </View>
    ) : null;

  return (
    <View style={styles.root}>
      {section('Atrasadas', overdue)}
      {section('Tarefas de hoje', dueToday)}
      {tasks.length === 0 ? (
        <Pressable
          onPress={() => router.navigate({ pathname: '/aquarium', params: { tab: 'lists' } })}
          accessibilityRole="button"
          accessibilityLabel="Nada para hoje. Ver listas"
          style={({ pressed }) => [
            styles.empty,
            {
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surfacePressed : 'transparent',
            },
          ]}
        >
          <CheckSquare size={22} color={colors.accent} />
          <View style={styles.flex}>
            <Text variant="headline">Nenhuma tarefa para hoje</Text>
            <Text variant="footnote" tone="secondary">
              Toque em Criar ou dê um prazo às tarefas das suas listas.
            </Text>
          </View>
        </Pressable>
      ) : null}
      <TaskDetailSheet taskId={selected} todayKey={todayKey} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  flex: { flex: 1 },
});
