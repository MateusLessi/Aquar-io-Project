import { TodayHabits } from '@/features/habits/components/TodayHabits';
import { useTodayHabitProgress } from '@/features/habits/hooks/queries';
import { TodayRoutines } from '@/features/routines/components/TodayRoutines';
import { useTodayRoutineProgress } from '@/features/routines/hooks/queries';
import { TodayScreen } from '@/features/todo/screens/TodayScreen';
import { DepthGauge } from '@/shell/progress/DepthGauge';

/** Início: the day at a glance, gathered from every module. */
export default function DashboardRoute() {
  const habits = useTodayHabitProgress();
  const routines = useTodayRoutineProgress();

  return (
    <TodayScreen
      extra={
        <>
          <DepthGauge />
          <TodayRoutines />
          <TodayHabits />
        </>
      }
      extraProgress={{
        completed: habits.completed + routines.completed,
        total: habits.total + routines.total,
        breakdown: [
          ...(routines.total > 0
            ? [{ label: 'Rotinas', value: `${routines.completed}/${routines.total}` }]
            : []),
          ...(habits.total > 0
            ? [{ label: 'Hábitos', value: `${habits.completed}/${habits.total}` }]
            : []),
        ],
      }}
    />
  );
}
