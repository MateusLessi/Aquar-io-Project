import { TodayHabits } from '@/features/habits/components/TodayHabits';
import { useTodayHabitProgress } from '@/features/habits/hooks/queries';
import { TodayScreen } from '@/features/todo/screens/TodayScreen';

export default function TodayRoute() {
  return <TodayScreen extra={<TodayHabits />} extraProgress={useTodayHabitProgress()} />;
}
