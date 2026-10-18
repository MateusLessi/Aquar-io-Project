import { createEmitter } from '../events/emitter';

/** Which kind of data changed. Live queries re-run when a topic they read changes. */
export type DataTopic = 'lists' | 'tasks' | 'settings';

export type DataChanges = ReturnType<typeof createDataChanges>;

export function createDataChanges() {
  const emitter = createEmitter<DataTopic>();
  return { notify: emitter.emit, subscribe: emitter.subscribe };
}
