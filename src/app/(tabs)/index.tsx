import { TodayHabits } from '@/features/habits/components/TodayHabits';
import { TodayScreen } from '@/features/todo/screens/TodayScreen';

export default function TodayRoute() {
  return <TodayScreen extra={<TodayHabits />} />;
}
