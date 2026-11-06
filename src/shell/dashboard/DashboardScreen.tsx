import { Plus } from 'lucide-react-native';
import { Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { toDateKey } from '@/core/dates';
import { useProfile } from '@/core/profile/useProfile';
import { Button, Screen, spacing, useBreakpoint } from '@/design-system';
import { TodayHabits } from '@/features/habits/components/TodayHabits';
import { useTodayHabitProgress } from '@/features/habits/hooks/queries';
import { TodayRoutines } from '@/features/routines/components/TodayRoutines';
import { useTodayRoutineProgress } from '@/features/routines/hooks/queries';
import { PinnedFolders } from '@/features/todo/components/PinnedFolders';
import { TodayTasks } from '@/features/todo/components/TodayTasks';
import { useToday } from '@/features/todo/hooks/queries';

import { RoutineExtras } from '../connections/RoutineExtras';
import { useCreate } from '../create/CreateContext';
import { DepthGauge } from '../progress/DepthGauge';
import { useProgress } from '../progress/useProgress';
import { useDashboardCards, useGamePrefs, type DashboardCardId } from '../settings/prefs';
import { WeekStatsCard } from '../stats/WeekStatsCard';
import { HomeTank } from './HomeTank';
import { TideCalendar } from './TideCalendar';
import { WeekChart } from './WeekChart';

function greeting(date: Date, name: string): string {
  const hour = date.getHours();
  const hello =
    hour < 5 ? 'Boa noite' : hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  return name ? `${hello}, ${name.split(' ')[0]}` : hello;
}

function dateLabel(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Início: the whole day at a glance, gathered from every module. Phones stack the blocks;
 * tablets and desktops lay them out as a bento of two or three columns.
 */
export function DashboardScreen() {
  const breakpoint = useBreakpoint();
  const create = useCreate();
  const now = new Date();
  const todayKey = toDateKey(now);
  const { data: profile } = useProfile();
  const name = profile?.name ?? '';
  const { data: tasks = [] } = useToday();
  const habits = useTodayHabitProgress();
  const routines = useTodayRoutineProgress();
  const { data: progress } = useProgress();
  const [cards] = useDashboardCards();
  const { showDepth } = useGamePrefs();
  const byDay = progress?.byDay ?? {};

  const tasksDone = tasks.filter((t) => t.completedAt).length;
  const done = tasksDone + habits.completed + routines.completed;
  const total = tasks.length + habits.total + routines.total;
  const tide = <HomeTank done={done} total={total} />;
  const cardNodes: Record<DashboardCardId, ReactNode> = {
    depth: <DepthGauge />,
    weekStats: <WeekStatsCard />,
    routines: <TodayRoutines renderExtra={(routine) => <RoutineExtras routine={routine} />} />,
    habits: <TodayHabits />,
    tasks: <TodayTasks />,
    folders: <PinnedFolders />,
    week: <WeekChart todayKey={todayKey} byDay={byDay} />,
    calendar: <TideCalendar todayKey={todayKey} byDay={byDay} />,
  };
  // Ajustes → Início: each column keeps its cards, in the person's order, without the hidden
  // ones (and without Profundidade when depth is turned off).
  const rank = new Map(cards.map((c, i) => [c.id, i]));
  const shown = new Set(
    cards.filter((c) => c.visible && (c.id !== 'depth' || showDepth)).map((c) => c.id),
  );
  const arrange = (ids: DashboardCardId[]) =>
    ids
      .filter((id) => shown.has(id))
      .sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0))
      .map((id) => <Fragment key={id}>{cardNodes[id]}</Fragment>);

  return (
    <Screen title={greeting(now, name)} eyebrow={dateLabel(now)} wide={breakpoint === 'expanded'}>
      {breakpoint === 'compact' ? (
        <>
          {tide}
          {arrange(['depth', 'weekStats', 'routines', 'habits', 'tasks', 'folders', 'week'])}
        </>
      ) : breakpoint === 'medium' ? (
        <Columns>
          <Column>
            {tide}
            {arrange(['depth', 'weekStats', 'habits', 'week'])}
          </Column>
          <Column>{arrange(['routines', 'tasks', 'folders', 'calendar'])}</Column>
        </Columns>
      ) : (
        <Columns>
          <Column flex={0.9}>
            <Button label="Criar" variant="energy" icon={Plus} block onPress={create} />
            {arrange(['weekStats', 'calendar', 'week'])}
          </Column>
          <Column flex={1.1}>
            {tide}
            {arrange(['depth', 'routines'])}
          </Column>
          <Column flex={1.1}>{arrange(['tasks', 'habits', 'folders'])}</Column>
        </Columns>
      )}
    </Screen>
  );
}

function Columns({ children }: { children: ReactNode }) {
  return <View style={styles.columns}>{children}</View>;
}

function Column({ children, flex = 1 }: { children: ReactNode; flex?: number }) {
  return <View style={[styles.column, { flex }]}>{children}</View>;
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  column: { gap: spacing.lg, minWidth: 0 },
});
