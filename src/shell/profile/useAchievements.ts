import { useLiveQuery } from '@/core/database/useLiveQuery';
import { toDateKey } from '@/core/dates';
import { useAllLinks } from '@/core/links/queries';
import { useHabits } from '@/features/habits/hooks/queries';
import { useLists } from '@/features/todo/hooks/queries';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { useProgress } from '../progress/useProgress';
import { badgesFor, showcaseOptions, type AchievementFacts } from './achievements';

/** Badges and showcase options, live, from everything the person did. */
export function useAchievements() {
  const todo = useTodo();
  const todayKey = toDateKey(new Date());
  const { data: progress } = useProgress();
  const { data: habits = [] } = useHabits();
  const { data: lists = [] } = useLists();
  const { data: links = [] } = useAllLinks();
  const { data: tasksDone = 0 } = useLiveQuery(
    `tasks-done:${todayKey}`,
    ['tasks'],
    async () => (await todo.completionTimes('0000-00-00', todayKey)).length,
  );

  const best = habits.reduce<(typeof habits)[number] | null>(
    (top, h) => (h.bestStreak > (top?.bestStreak ?? 0) ? h : top),
    null,
  );
  const firstDay =
    [
      ...habits.map((h) => toDateKey(new Date(h.createdAt))),
      ...lists.map((l) => toDateKey(new Date(l.createdAt))),
      ...Object.keys(progress?.byDay ?? {}),
    ].sort()[0] ?? null;

  const facts: AchievementFacts = {
    fullTides: Object.values(progress?.byDay ?? {}).filter((d) => d.fullTide).length,
    meters: progress?.depth.meters ?? 0,
    tasksDone,
    bestStreak: best
      ? { days: best.bestStreak, habitName: best.name, creature: best.creature }
      : null,
    habits: habits.map((h) => ({ id: h.id, name: h.name, creature: h.creature, stage: h.stage })),
    links: links.length,
    firstDay,
    todayKey,
  };
  const badges = badgesFor(facts);
  return { facts, badges, options: showcaseOptions(facts, badges), ready: Boolean(progress) };
}
