import type { ListColorName } from '@/design-system';

/** 0 none · 1 low · 2 medium · 3 high */
export type Priority = 0 | 1 | 2 | 3;

export type TaskList = {
  id: string;
  name: string;
  emoji: string | null;
  color: ListColorName | null;
  sortOrder: number;
  /** Top-level tasks not yet completed. */
  pendingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  listId: string;
  parentTaskId: string | null;
  title: string;
  notes: string | null;
  priority: Priority;
  /** Calendar date `YYYY-MM-DD`, independent of time zone. */
  dueDate: string | null;
  /** When it was completed (ISO instant); null while open. */
  completedAt: string | null;
  sortOrder: number;
  subtaskCount: number;
  subtaskDoneCount: number;
  createdAt: string;
  updatedAt: string;
};

/** A task shown outside its list (e.g. Today), with the list's identity attached. */
export type TaskWithList = Task & {
  listName: string;
  listEmoji: string | null;
  listColor: ListColorName | null;
};

export type NewList = { name: string; emoji?: string | null; color?: ListColorName | null };
export type ListPatch = Partial<NewList>;

export type NewTask = {
  listId: string;
  title: string;
  parentTaskId?: string | null;
  dueDate?: string | null;
  priority?: Priority;
};
export type TaskPatch = {
  title?: string;
  notes?: string | null;
  dueDate?: string | null;
  priority?: Priority;
};
