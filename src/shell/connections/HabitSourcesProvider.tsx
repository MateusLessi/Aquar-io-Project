import { useRouter } from 'expo-router';
import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useLiveQuery } from '@/core/database/useLiveQuery';
import { toDateKey } from '@/core/dates';
import { useLinks } from '@/core/links/linksContext';
import { Checkbox, Text, spacing, useTheme } from '@/design-system';
import {
  HabitSourcesContext,
  type ConnectedHabitDay,
  type HabitSources,
} from '@/features/habits/hooks/habitSources';
import { useHabitsRepository } from '@/features/habits/hooks/habitsContext';
import { useRoutinesRepository } from '@/features/routines/hooks/routinesContext';
import { TaskRow } from '@/features/todo/components/TaskRow';
import type { TaskWithList } from '@/features/todo/domain/types';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { habitDay, type DayFacts, type HabitDay } from './habitDay';

const dayOfIso = (iso: string) => toDateKey(new Date(iso));

type Loaded = {
  days: Map<string, HabitDay>;
  tasks: Map<string, TaskWithList>;
};

/**
 * Habits done from a list, folder or routine (docs/connections.md). Computes each one's day
 * from the items themselves, keeps the habit's history in step (streak, consistency, growth)
 * and gives the habits feature what it needs to show and mark those days.
 */
export function HabitSourcesProvider({ children }: { children: ReactNode }) {
  const todo = useTodo();
  const links = useLinks();
  const routines = useRoutinesRepository();
  const habitsRepo = useHabitsRepository();
  const now = new Date();
  const todayKey = toDateKey(now);
  const weekday = now.getDay();

  const { data } = useLiveQuery<Loaded>(
    `habit-sources:${todayKey}`,
    ['tasks', 'lists', 'links', 'routines', 'habits'],
    async () => {
      const [all, lists, folders, tasks, routineDays, habits] = await Promise.all([
        links.allLinks(),
        todo.listLists(),
        todo.listFolders(),
        todo.folderTasks(null),
        routines.listToday(),
        habitsRepo.listHabits(todayKey),
      ]);
      const facts: DayFacts = {
        lists: lists.map((l) => ({
          id: l.id,
          name: l.name,
          folderId: l.folderId,
          resets: l.resets,
        })),
        folders: folders.map((f) => ({ id: f.id, name: f.name, parentId: f.parentId })),
        tasks,
        routines: routineDays.map((r) => ({
          id: r.id,
          name: r.name,
          days: r.days,
          items: r.items.map((i) => ({ id: i.id, title: i.title, done: i.done })),
        })),
      };
      const days = new Map<string, HabitDay>();
      for (const habit of habits) {
        const into = all.filter((l) => l.targetKind === 'habit' && l.targetId === habit.id);
        const day = habitDay(into, facts, todayKey, weekday, dayOfIso);
        if (day) days.set(habit.id, day);
      }
      return { days, tasks: new Map(tasks.map((t) => [t.id, t])) };
    },
  );

  // The habit's history follows its items: done today when they are.
  useEffect(() => {
    if (!data) return;
    for (const [habitId, day] of data.days) {
      habitsRepo
        .setConnectedDay(habitId, todayKey, day.ratio, day.done)
        .catch((error: unknown) => console.warn('Could not update a connected habit.', error));
    }
  }, [data, habitsRepo, todayKey]);

  const value = useMemo<HabitSources | null>(() => {
    if (!data) return null;
    const report = (error: unknown) => console.warn('Could not mark the items.', error);
    return {
      dayOf(habitId): ConnectedHabitDay | null {
        const day = data.days.get(habitId);
        return day
          ? {
              label: day.label,
              ratio: day.ratio,
              done: day.done,
              doneCount: day.doneCount,
              required: day.required,
            }
          : null;
      },
      setDone(habitId, done) {
        const day = data.days.get(habitId);
        if (!day) return;
        for (const item of day.items) {
          if (item.done === done) continue;
          if (item.kind === 'task') todo.setCompleted(item.id, done).catch(report);
          else routines.setItemChecked(item.routineId, item.id, todayKey, done).catch(report);
        }
      },
      DayView: ({ habitId }) => (
        <ConnectedDayView day={data.days.get(habitId)} tasks={data.tasks} todayKey={todayKey} />
      ),
    };
  }, [data, todo, routines, todayKey]);

  return <HabitSourcesContext.Provider value={value}>{children}</HabitSourcesContext.Provider>;
}

/** The items of a connected habit's day, each with its own control. */
function ConnectedDayView({
  day,
  tasks,
  todayKey,
}: {
  day: HabitDay | undefined;
  tasks: Map<string, TaskWithList>;
  todayKey: string;
}) {
  const router = useRouter();
  const todo = useTodo();
  const routines = useRoutinesRepository();
  const { colors } = useTheme();
  if (!day) return null;
  if (day.items.length === 0) {
    return (
      <Text variant="footnote" tone="secondary" style={styles.empty}>
        Nada para hoje em {day.label}.
      </Text>
    );
  }
  const report = (error: unknown) => console.warn('Could not mark the item.', error);
  return (
    <View>
      {day.items.map((item, index) => {
        if (item.kind === 'task') {
          const task = tasks.get(item.id);
          if (!task) return null;
          return (
            <TaskRow
              key={item.id}
              task={task}
              todayKey={todayKey}
              listColor={task.listColor}
              separator={index > 0}
              onToggle={(done) => todo.setCompleted(task.id, done).catch(report)}
              onPress={() =>
                router.push({ pathname: '/aquarium/lists/[id]', params: { id: task.listId } })
              }
            />
          );
        }
        return (
          <View
            key={item.id}
            style={[
              styles.step,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.separator,
              },
            ]}
          >
            <Checkbox
              checked={item.done}
              label={item.title}
              onChange={(done) =>
                routines.setItemChecked(item.routineId, item.id, todayKey, done).catch(report)
              }
            />
            <Text variant="body" struck={item.done} style={styles.flex}>
              {item.title}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: spacing.sm },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  flex: { flex: 1 },
});
