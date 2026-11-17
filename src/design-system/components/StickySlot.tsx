import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

/** Holds what a screen's content puts into the screen's sticky bar. */
type SlotStore = {
  get: () => ReactNode;
  /** A word for what the bar shows now (e.g. "Dia"), for a closed dropdown on phones. */
  summary: () => string | null;
  set: (node: ReactNode, summary?: string | null) => void;
  subscribe: (listener: () => void) => () => void;
};

function createSlotStore(): SlotStore {
  let node: ReactNode = null;
  let summary: string | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => node,
    summary: () => summary,
    set: (next, nextSummary = null) => {
      node = next;
      summary = nextSummary;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const SlotContext = createContext<SlotStore | null>(null);

/** Lets the content below put a bar into the screen's sticky bar (`StickySlotHost`). */
export function StickySlotProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createSlotStore);
  return <SlotContext.Provider value={store}>{children}</SlotContext.Provider>;
}

/** Where the bar shows up, inside the sticky bar. Only this re-renders when the bar changes. */
export function StickySlotHost() {
  const store = useContext(SlotContext);
  const node = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.get ?? nothing,
    store?.get ?? nothing,
  );
  return <>{node}</>;
}

/** What the bar shows now, in a word (from `StickySlot`'s `summary`), or null. */
export function useStickySummary(): string | null {
  const store = useContext(SlotContext);
  return useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.summary ?? nothing,
    store?.summary ?? nothing,
  );
}

/**
 * A bar that belongs in the screen's sticky bar (the Agenda's Dia / Semana / Mês / Lista).
 * Without a provider above (the same panel elsewhere), it simply shows in place.
 */
export function StickySlot({ children, summary }: { children: ReactNode; summary?: string }) {
  const store = useContext(SlotContext);
  useLayoutEffect(() => {
    store?.set(children, summary ?? null);
  });
  useLayoutEffect(() => () => store?.set(null), [store]);
  return store ? null : <>{children}</>;
}

const noopSubscribe = () => () => {};
const nothing = () => null;
