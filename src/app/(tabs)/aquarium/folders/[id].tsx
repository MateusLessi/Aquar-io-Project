import { useLocalSearchParams } from 'expo-router';

import { FolderScreen } from '@/features/todo/screens/FolderScreen';
import { useConnect } from '@/shell/connections/ConnectProvider';

export default function FolderRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { open } = useConnect();
  return <FolderScreen folderId={id} onConnect={(item) => open({ from: item })} />;
}
