import { createContext, useContext } from 'react';

import type { LinksRepository } from './linksRepository';

export const LinksContext = createContext<LinksRepository | null>(null);

export function useLinks(): LinksRepository {
  const links = useContext(LinksContext);
  if (!links) throw new Error('useLinks must be used inside LinksContext.');
  return links;
}
