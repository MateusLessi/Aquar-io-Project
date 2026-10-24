import { ListsBrowser, type ConnectableItem } from '../components/ListsBrowser';

/** Lists inside the Aquarium: the top level of folders and lists. */
export function ListsPanel({ onConnect }: { onConnect?: (item: ConnectableItem) => void } = {}) {
  return <ListsBrowser folderId={null} onConnect={onConnect} />;
}
