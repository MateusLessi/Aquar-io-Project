import type { ListColorName } from '@/design-system';

import type { Repeat } from './repeat';

/** 0 none · 1 low · 2 medium · 3 high */
export type Priority = 0 | 1 | 2 | 3;

export type TaskList = {
  id: string;
  name: string;
  emoji: string | null;
  color: ListColorName | null;
  /** The folder it lives in, or null at the top level (see docs/todo.md). */
  folderId: string | null;
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
  /** Repeating tasks need a due date; completing one creates the next. */
  repeat: Repeat | null;
  /** Reminder time on the due date, `HH:MM`. */
  remindAt: string | null;
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
  /** Names of the folders the list is in, outermost first ("UnB", "Semestre 3"). */
  listPath: string[];
};

/** Folders hold lists and other folders, up to MAX_FOLDER_DEPTH levels. */
export type Folder = {
  id: string;
  parentId: string | null;
  name: string;
  emoji: string | null;
  color: ListColorName | null;
  /** Shown on the dashboard. */
  pinned: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** A folder with what is inside it, counted through every subfolder. */
export type FolderSummary = Folder & {
  /** 1 at the top level. */
  depth: number;
  folderCount: number;
  listCount: number;
  /** Top-level tasks inside, open and completed. */
  openCount: number;
  doneCount: number;
};

export type FolderCrumb = { id: string; name: string; emoji: string | null };

export type NewFolder = {
  name: string;
  emoji?: string | null;
  color?: ListColorName | null;
  parentId?: string | null;
};
export type FolderPatch = {
  name?: string;
  emoji?: string | null;
  color?: ListColorName | null;
  pinned?: boolean;
};

export type NewList = {
  name: string;
  emoji?: string | null;
  color?: ListColorName | null;
  folderId?: string | null;
};
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
  repeat?: Repeat | null;
  remindAt?: string | null;
};

/** A task with a reminder, for scheduling notifications. */
export type TaskReminder = {
  id: string;
  title: string;
  listId: string;
  listName: string;
  listEmoji: string | null;
  dueDate: string;
  remindAt: string;
};
