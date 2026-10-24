import type { ListColorName } from '@/design-system';

import { parseRepeat } from '../domain/repeat';
import type { Priority, Task, TaskList, TaskWithList } from '../domain/types';

/** Row shapes exactly as SQLite returns them (snake_case). */
export type TaskListRow = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  folder_id: string | null;
  sort_order: number;
  pending_count: number;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  list_id: string;
  parent_task_id: string | null;
  title: string;
  notes: string | null;
  priority: number;
  due_date: string | null;
  completed_at: string | null;
  repeat: string | null;
  remind_at: string | null;
  sort_order: number;
  subtask_count: number;
  subtask_done_count: number;
  created_at: string;
  updated_at: string;
};

export type TaskWithListRow = TaskRow & {
  list_folder_id: string | null;
  list_name: string;
  list_emoji: string | null;
  list_color: string | null;
};

export function toTaskList(row: TaskListRow): TaskList {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color as ListColorName | null,
    folderId: row.folder_id,
    sortOrder: row.sort_order,
    pendingCount: row.pending_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    listId: row.list_id,
    parentTaskId: row.parent_task_id,
    title: row.title,
    notes: row.notes,
    priority: row.priority as Priority,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    repeat: parseRepeat(row.repeat),
    remindAt: row.remind_at,
    sortOrder: row.sort_order,
    subtaskCount: row.subtask_count,
    subtaskDoneCount: row.subtask_done_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTaskWithList(row: TaskWithListRow, listPath: string[] = []): TaskWithList {
  return {
    ...toTask(row),
    listName: row.list_name,
    listEmoji: row.list_emoji,
    listColor: row.list_color as ListColorName | null,
    listPath,
  };
}
