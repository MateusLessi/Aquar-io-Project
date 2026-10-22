import { TodayHabits } from '@/features/habits/components/TodayHabits';
import { useTodayHabitProgress } from '@/features/habits/hooks/queries';
import { TodayScreen } from '@/features/todo/screens/TodayScreen';
import { DepthGauge } from '@/shell/progress/DepthGauge';

export default function TodayRoute() {
  return (
    <TodayScreen
      extra={
        <>
          <DepthGauge />
          <TodayHabits />
        </>
      }
      extraProgress={useTodayHabitProgress()}
    />
  );
}
