import { Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { toDateKey } from '@/core/dates';
import { useProfile } from '@/core/profile/useProfile';
import { Button, Screen, TideHero, spacing, useBreakpoint } from '@/design-system';
import { TodayHabits } from '@/features/habits/components/TodayHabits';
import { useTodayHabitProgress } from '@/features/habits/hooks/queries';
import { TodayRoutines } from '@/features/routines/components/TodayRoutines';
import { useTodayRoutineProgress } from '@/features/routines/hooks/queries';
import { PinnedFolders } from '@/features/todo/components/PinnedFolders';
import { TodayTasks } from '@/features/todo/components/TodayTasks';
import { useToday } from '@/features/todo/hooks/queries';

import { useCreate } from '../create/CreateContext';
import { DepthGauge } from '../progress/DepthGauge';
import { useProgress } from '../progress/useProgress';
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
  const byDay = progress?.byDay ?? {};

  const tasksDone = tasks.filter((t) => t.completedAt).length;
  const done = tasksDone + habits.completed + routines.completed;
  const total = tasks.length + habits.total + routines.total;
  const details = [
    { label: 'Tarefas', value: `${tasksDone}/${tasks.length}` },
    ...(routines.total > 0
      ? [{ label: 'Rotinas', value: `${routines.completed}/${routines.total}` }]
      : []),
    ...(habits.total > 0
      ? [{ label: 'Hábitos', value: `${habits.completed}/${habits.total}` }]
      : []),
  ];

  const tide = (
    <TideHero
      label="Maré do dia"
      completed={done}
      total={total}
      caption={
        done === total && total > 0
          ? 'Maré cheia! Tudo feito hoje 🎉'
          : `Faltam ${total - done} para a maré cheia`
      }
      emptyMessage="Mar calmo. Nada planejado para hoje."
      details={details.length > 1 ? details : undefined}
    />
  );
  const week = <WeekChart todayKey={todayKey} byDay={byDay} />;
  const calendar = <TideCalendar todayKey={todayKey} byDay={byDay} />;

  return (
    <Screen
      title={breakpoint === 'compact' ? greeting(now, name) : `${greeting(now, name)} 👋`}
      eyebrow={dateLabel(now)}
      wide={breakpoint === 'expanded'}
    >
      {breakpoint === 'compact' ? (
        <>
          {tide}
          <DepthGauge />
          <TodayRoutines />
          <TodayHabits />
          <TodayTasks />
          <PinnedFolders />
          {week}
        </>
      ) : breakpoint === 'medium' ? (
        <Columns>
          <Column>
            {tide}
            <DepthGauge />
            <TodayHabits />
            {week}
          </Column>
          <Column>
            <TodayRoutines />
            <TodayTasks />
            <PinnedFolders />
            {calendar}
          </Column>
        </Columns>
      ) : (
        <Columns>
          <Column flex={0.9}>
            <Button label="Criar" variant="energy" icon={Plus} block onPress={create} />
            {calendar}
            {week}
          </Column>
          <Column flex={1.1}>
            {tide}
            <DepthGauge />
            <TodayRoutines />
          </Column>
          <Column flex={1.1}>
            <TodayTasks />
            <TodayHabits />
            <PinnedFolders />
          </Column>
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
