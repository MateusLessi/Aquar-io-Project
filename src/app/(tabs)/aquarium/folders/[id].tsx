import { useLocalSearchParams } from 'expo-router';

import { FolderScreen } from '@/features/todo/screens/FolderScreen';

export default function FolderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FolderScreen folderId={id} />;
}
