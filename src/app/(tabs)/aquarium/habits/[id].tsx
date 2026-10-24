import { useLocalSearchParams } from 'expo-router';

import { HabitDetailScreen } from '@/features/habits/screens/HabitDetailScreen';
import { ConnectedSection } from '@/shell/connections/ConnectedSection';

export default function HabitRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <HabitDetailScreen
      habitId={id}
      footer={(habit) => <ConnectedSection kind="habit" id={habit.id} name={habit.name} />}
    />
  );
}
