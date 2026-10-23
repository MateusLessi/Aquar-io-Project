import { useLocalSearchParams } from 'expo-router';

import { HabitDetailScreen } from '@/features/habits/screens/HabitDetailScreen';

export default function HabitRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HabitDetailScreen habitId={id} />;
}
