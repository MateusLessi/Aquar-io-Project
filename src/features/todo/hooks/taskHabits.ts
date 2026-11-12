import { createContext, useContext } from 'react';

/**
 * Which habits a list's items count for (the app shell knows the links). Lists outside any
 * habit give an empty list. Without a provider, nothing is shown.
 */
export type TaskHabits = (listId: string) => string[];

export const TaskHabitsContext = createContext<TaskHabits>(() => []);

export const useTaskHabits = () => useContext(TaskHabitsContext);
