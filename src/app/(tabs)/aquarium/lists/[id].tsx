import { useLocalSearchParams } from 'expo-router';

import { ListScreen } from '@/features/todo/screens/ListScreen';
import { ListEvents } from '@/shell/aquarium/ListEvents';
import { ConnectedSection } from '@/shell/connections/ConnectedSection';

export default function ListRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ListScreen
      listId={id}
      footer={(list) => (
        <>
          <ListEvents listId={list.id} />
          <ConnectedSection kind="list" id={list.id} name={list.name} />
        </>
      )}
    />
  );
}
