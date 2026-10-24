import { useLiveQuery } from '@/core/database/useLiveQuery';

import { toDateKey } from '../domain/dates';
import { useTodo } from './todoContext';

/** Live reads: each re-runs automatically when the data it depends on changes. */

export function useLists() {
  const todo = useTodo();
  return useLiveQuery('lists', ['lists', 'tasks'], () => todo.listLists());
}

export function useList(id: string) {
  const todo = useTodo();
  return useLiveQuery(`list:${id}`, ['lists', 'tasks'], () => todo.getList(id));
}

export function useListTasks(listId: string) {
  const todo = useTodo();
  return useLiveQuery(`tasks:${listId}`, ['tasks'], () => todo.listTasks(listId));
}

export function useTask(id: string | null) {
  const todo = useTodo();
  return useLiveQuery(`task:${id}`, ['tasks'], () =>
    id ? todo.getTask(id) : Promise.resolve(null),
  );
}

export function useSubtasks(parentTaskId: string | null) {
  const todo = useTodo();
  return useLiveQuery(`subtasks:${parentTaskId}`, ['tasks'], () =>
    parentTaskId ? todo.listSubtasks(parentTaskId) : Promise.resolve([]),
  );
}

export function useToday(now: Date = new Date()) {
  const todo = useTodo();
  const todayKey = toDateKey(now);
  return {
    todayKey,
    ...useLiveQuery(`today:${todayKey}`, ['tasks', 'lists'], () => todo.listToday(todayKey)),
  };
}

/** A folder's subfolders, lists and trail; `null` is the top level. */
export function useFolderContents(folderId: string | null) {
  const todo = useTodo();
  return useLiveQuery(`folder:${folderId ?? 'top'}`, ['lists', 'tasks'], () =>
    todo.folderContents(folderId),
  );
}

/** Every task inside a folder (or every list when `null`), for "Tudo junto". */
export function useFolderTasks(folderId: string | null) {
  const todo = useTodo();
  return useLiveQuery(`folder-tasks:${folderId ?? 'top'}`, ['lists', 'tasks'], () =>
    todo.folderTasks(folderId),
  );
}

/** Every folder with its depth and counts (the move sheet, pinned folders). */
export function useFolders() {
  const todo = useTodo();
  return useLiveQuery('folders', ['lists', 'tasks'], () => todo.listFolders());
}
