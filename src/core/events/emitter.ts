type Listener<T> = (value: T) => void;

/** A tiny publish/subscribe channel. */
export function createEmitter<T>() {
  const listeners = new Set<Listener<T>>();

  return {
    emit(value: T) {
      for (const listener of listeners) listener(value);
    },
    subscribe(listener: Listener<T>): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type Emitter<T> = ReturnType<typeof createEmitter<T>>;
