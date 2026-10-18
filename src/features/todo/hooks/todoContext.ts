import { createContext, useContext } from 'react';

import type { TodoRepository } from '../data/todoRepository';

export const TodoContext = createContext<TodoRepository | null>(null);

/** The To Do repository, for actions (create, update, complete, delete). */
export function useTodo(): TodoRepository {
  const todo = useContext(TodoContext);
  if (!todo) throw new Error('useTodo must be used inside TodoContext.');
  return todo;
}
