import { useLocalSearchParams } from 'expo-router';

import { ListScreen } from '@/features/todo/screens/ListScreen';

export default function ListRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ListScreen listId={id} />;
}
