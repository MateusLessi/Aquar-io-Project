import { useRouter } from 'expo-router';
import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useLiveQuery } from '@/core/database/useLiveQuery';
import { toDateKey } from '@/core/dates';
import { useLinks } from '@/core/links/linksContext';
import { Checkbox, Text, spacing, useTheme } from '@/design-system';
import type { Link } from '@/core/links/linksRepository';
import type { SourceRule } from '@/core/links/sourceRule';
import {
  HabitSourcesContext,
  type ConnectedHabitDay,
  type HabitSources,
  type SourceDraft,
} from '@/features/habits/hooks/habitSources';
import { useHabitsRepository } from '@/features/habits/hooks/habitsContext';
import { useRoutinesRepository } from '@/features/routines/hooks/routinesContext';
import { TaskRow } from '@/features/todo/components/TaskRow';
import type { TaskWithList } from '@/features/todo/domain/types';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { habitDay, type DayFacts, type HabitDay } from './habitDay';
import { SourcePicker, maskOf } from './SourcePicker';

const dayOfIso = (iso: string) => toDateKey(new Date(iso));

type Loaded = {
  days: Map<string, HabitDay>;
  tasks: Map<string, TaskWithList>;
  /** Links into each habit from a list, folder or routine. */
  sources: Map<string, Link[]>;
  facts: DayFacts;
};

const isSource = (l: Link) =>
  l.targetKind === 'habit' &&
  (l.itemKind === 'list' || l.itemKind === 'folder' || l.itemKind === 'routine');

/** The editor's view of a habit's source (the first one, which is what the editor creates). */
function draftOf(links: Link[], facts: DayFacts): SourceDraft | null {
  const link = links[0];
  if (!link || link.itemKind === 'habit') return null;
  const rule = link.rule;
  const atLeast = typeof rule.doneWhen === 'object' ? rule.doneWhen.atLeast : null;
  if (link.itemKind === 'folder') {
    const weekday = rule.folder?.mode === 'weekday' ? rule.folder.lists : null;
    return {
      kind: 'folder',
      id: link.itemId,
      folderMode: weekday ? 'weekday' : 'due',
      lists: weekday ?? {},
      atLeast,
      days: weekday ? maskOf(weekday) : null,
    };
  }
  const routine = facts.routines.find((r) => r.id === link.itemId);
  return {
    kind: link.itemKind,
    id: link.itemId,
    folderMode: 'due',
    lists: {},
    atLeast,
    days: link.itemKind === 'routine' ? (routine?.days ?? null) : null,
  };
}

/** The rule stored on the link for a draft. */
function ruleOf(draft: SourceDraft): SourceRule {
  const rule: SourceRule = { doneWhen: draft.atLeast ? { atLeast: draft.atLeast } : 'all' };
  if (draft.kind === 'folder') {
    rule.folder =
      draft.folderMode === 'weekday' ? { mode: 'weekday', lists: draft.lists } : { mode: 'due' };
  }
  return rule;
}

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
      const sources = new Map<string, Link[]>();
      for (const habit of habits) {
        const into = all.filter((l) => isSource(l) && l.targetId === habit.id);
        if (into.length > 0) sources.set(habit.id, into);
        const day = habitDay(into, facts, todayKey, weekday, dayOfIso);
        if (day) days.set(habit.id, day);
      }
      return { days, tasks: new Map(tasks.map((t) => [t.id, t])), sources, facts };
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
      SourcePicker,
      sourceOf: (habitId) => draftOf(data.sources.get(habitId) ?? [], data.facts),
      async saveSource(habitId, draft) {
        const current = data.sources.get(habitId) ?? [];
        // One source per habit from the editor: anything else linked in goes.
        for (const link of current) {
          if (!draft || link.itemKind !== draft.kind || link.itemId !== draft.id) {
            await links.unlink(link.id);
          }
        }
        if (!draft?.id) return;
        const id = await links.link({
          itemKind: draft.kind,
          itemId: draft.id,
          targetKind: 'habit',
          targetId: habitId,
        });
        await links.setRule(id, ruleOf(draft));
        // The lists of the days start over every day, like a workout.
        if (draft.kind === 'folder' && draft.folderMode === 'weekday') {
          for (const listId of new Set(Object.values(draft.lists))) {
            const list = data.facts.lists.find((l) => l.id === listId);
            if (listId && list && !list.resets) await todo.updateList(listId, { resets: true });
          }
        }
      },
      DayView: ({ habitId }) => (
        <ConnectedDayView day={data.days.get(habitId)} tasks={data.tasks} todayKey={todayKey} />
      ),
    };
  }, [data, todo, routines, links, todayKey]);

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
