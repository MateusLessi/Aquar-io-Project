import { createContext, useContext, useEffect, useRef, useState } from 'react';

import type { DataChanges, DataTopic } from './changes';

export const DataChangesContext = createContext<DataChanges | null>(null);

export type LiveQuery<T> = {
  data: T | undefined;
  error: Error | null;
  /** True until the first result arrives. */
  loading: boolean;
};

/**
 * Runs `query` and re-runs it whenever one of `topics` changes, so screens always show
 * what is in the database. `key` identifies the query: change it to refetch (e.g. listId).
 */
export function useLiveQuery<T>(key: string, topics: DataTopic[], query: () => Promise<T>) {
  const changes = useContext(DataChangesContext);
  if (!changes) throw new Error('useLiveQuery must be used inside DataChangesContext.');

  const [state, setState] = useState<LiveQuery<T> & { key: string }>({
    key,
    data: undefined,
    error: null,
    loading: true,
  });
  const queryRef = useRef(query);
  const topicsKey = topics.join(',');

  useEffect(() => {
    queryRef.current = query;
  });

  useEffect(() => {
    let active = true;
    let generation = 0;
    const watched = new Set(topicsKey.split(','));

    const run = () => {
      const current = ++generation;
      queryRef.current().then(
        (data) => {
          if (active && current === generation)
            setState({ key, data, error: null, loading: false });
        },
        (error: unknown) => {
          if (active && current === generation) {
            setState({
              key,
              data: undefined,
              error: error instanceof Error ? error : new Error(String(error)),
              loading: false,
            });
          }
        },
      );
    };

    run();
    const unsubscribe = changes.subscribe((topic) => {
      if (watched.has(topic)) run();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [changes, key, topicsKey]);

  // While a new key loads, don't show the previous key's data.
  if (state.key !== key) return { data: undefined, error: null, loading: true };
  return { data: state.data, error: state.error, loading: state.loading };
}
