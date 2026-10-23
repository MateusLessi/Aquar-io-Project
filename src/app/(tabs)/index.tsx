import { useRouter } from 'expo-router';
import { Settings2 } from 'lucide-react-native';

import { IconButton, useBreakpoint } from '@/design-system';
import { TodayHabits } from '@/features/habits/components/TodayHabits';
import { useTodayHabitProgress } from '@/features/habits/hooks/queries';
import { TodayRoutines } from '@/features/routines/components/TodayRoutines';
import { useTodayRoutineProgress } from '@/features/routines/hooks/queries';
import { TodayScreen } from '@/features/todo/screens/TodayScreen';
import { DepthGauge } from '@/shell/progress/DepthGauge';

export default function TodayRoute() {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const habits = useTodayHabitProgress();
  const routines = useTodayRoutineProgress();

  return (
    <TodayScreen
      // On phones Settings is not in the tab bar (no room for five tabs): it lives here.
      headerActions={
        breakpoint === 'compact' ? (
          <IconButton
            icon={Settings2}
            label="Ajustes"
            onPress={() => router.navigate('/settings')}
          />
        ) : undefined
      }
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
