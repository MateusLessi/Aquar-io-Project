import { useLiveQuery } from '../database/useLiveQuery';
import { useLinks } from './linksContext';
import type { LinkItemKind, LinkTargetKind } from './linksRepository';

/** Live reads of links: re-run when links change, here or synced from another device. */

export function useAllLinks() {
  const links = useLinks();
  return useLiveQuery('links:all', ['links'], () => links.allLinks());
}

export function useLinksTo(targetKind: LinkTargetKind, targetId: string) {
  const links = useLinks();
  return useLiveQuery(`links:to:${targetKind}:${targetId}`, ['links'], () =>
    links.linksTo(targetKind, targetId),
  );
}

export function useLinksFrom(itemKind: LinkItemKind, itemId: string) {
  const links = useLinks();
  return useLiveQuery(`links:from:${itemKind}:${itemId}`, ['links'], () =>
    links.linksFrom(itemKind, itemId),
  );
}
