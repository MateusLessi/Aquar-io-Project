import { useRouter } from 'expo-router';
import { Waves } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, Screen, Surface, Text, TideHero, spacing } from '@/design-system';

import { TaskDetailSheet } from '../components/TaskDetailSheet';
import { TaskRow } from '../components/TaskRow';
import { dueStatus } from '../domain/dates';
import type { TaskWithList } from '../domain/types';
import { useToday } from '../hooks/queries';
import { useTodo } from '../hooks/todoContext';

function todayLabel(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** `extra` shows other modules' parts of today (e.g. habits), composed by the route. */
export function TodayScreen({ extra }: { extra?: ReactNode }) {
  const router = useRouter();
  const todo = useTodo();
  const { data: tasks = [], todayKey } = useToday();
  const [selected, setSelected] = useState<string | null>(null);

  const overdue = tasks.filter((t) => t.dueDate && dueStatus(t.dueDate, todayKey) === 'overdue');
  const dueToday = tasks.filter((t) => t.dueDate === todayKey);
  const completed = tasks.filter((t) => t.completedAt).length;

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
              listName={task.listName}
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
    <Screen title="Hoje" eyebrow={todayLabel(new Date())}>
      <TideHero
        label="Maré do dia"
        completed={completed}
        total={tasks.length}
        caption={
          completed === tasks.length && tasks.length > 0
            ? 'maré cheia! tudo feito'
            : 'tarefas concluídas'
        }
        emptyMessage="Mar calmo. Nada planejado para hoje."
      />

      {extra}

      {section('Atrasadas', overdue)}
      {section('Para hoje', dueToday)}

      {tasks.length === 0 ? (
        <EmptyState
          icon={Waves}
          title="Nada para hoje"
          message="Toque em + para criar uma tarefa para hoje, ou dê um prazo às tarefas das suas listas."
          action={{ label: 'Ver listas', onPress: () => router.navigate('/lists') }}
        />
      ) : null}

      <TaskDetailSheet taskId={selected} todayKey={todayKey} onClose={() => setSelected(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
});
