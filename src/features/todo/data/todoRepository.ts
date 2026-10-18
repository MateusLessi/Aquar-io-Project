import type { DataChanges } from '@/core/database/changes';
import type { Database } from '@/core/database/types';
import type { DomainEvent } from '@/core/events/events';
import type { EventLog } from '@/core/events/eventLog';

import { toDateKey } from '../domain/dates';
import type {
  ListPatch,
  NewList,
  NewTask,
  Task,
  TaskList,
  TaskPatch,
  TaskWithList,
} from '../domain/types';
import {
  ValidationError,
  validateDueDate,
  validateListColor,
  validateListName,
  validateNotes,
  validatePriority,
  validateTaskTitle,
} from '../domain/validation';
import {
  toTask,
  toTaskList,
  toTaskWithList,
  type TaskListRow,
  type TaskRow,
  type TaskWithListRow,
} from './rows';

export type TodoDeps = {
  db: Database;
  changes: DataChanges;
  events: EventLog;
  newId: () => string;
  now: () => Date;
};

const LIST_COLUMNS = `
  l.id, l.name, l.emoji, l.color, l.sort_order, l.created_at, l.updated_at,
  (SELECT COUNT(*) FROM tasks t
    WHERE t.list_id = l.id AND t.parent_task_id IS NULL
      AND t.deleted_at IS NULL AND t.completed_at IS NULL) AS pending_count`;

const TASK_COLUMNS = `
  t.id, t.list_id, t.parent_task_id, t.title, t.notes, t.priority, t.due_date,
  t.completed_at, t.sort_order, t.created_at, t.updated_at,
  (SELECT COUNT(*) FROM tasks s WHERE s.parent_task_id = t.id AND s.deleted_at IS NULL)
    AS subtask_count,
  (SELECT COUNT(*) FROM tasks s
    WHERE s.parent_task_id = t.id AND s.deleted_at IS NULL AND s.completed_at IS NOT NULL)
    AS subtask_done_count`;

/**
 * All To Do reads and writes. Every write validates its input, stamps `updated_at`
 * and announces which data changed so live screens refresh.
 */
export function createTodoRepository({ db, changes, events, newId, now }: TodoDeps) {
  const timestamp = () => now().toISOString();

  async function nextSortOrder(sql: string, params: (string | null)[]): Promise<number> {
    const row = await db.get<{ max: number | null }>(sql, params);
    return (row?.max ?? 0) + 1;
  }

  async function requireTask(id: string): Promise<Task> {
    const task = await getTask(id);
    if (!task) throw new ValidationError('Esta tarefa não existe mais.');
    return task;
  }

  async function getTask(id: string): Promise<Task | null> {
    const row = await db.get<TaskRow>(
      `SELECT ${TASK_COLUMNS} FROM tasks t WHERE t.id = ? AND t.deleted_at IS NULL`,
      [id],
    );
    return row ? toTask(row) : null;
  }

  return {
    // ---------- Lists ----------

    async listLists(): Promise<TaskList[]> {
      const rows = await db.all<TaskListRow>(
        `SELECT ${LIST_COLUMNS} FROM task_lists l
         WHERE l.deleted_at IS NULL ORDER BY l.sort_order`,
      );
      return rows.map(toTaskList);
    },

    async getList(id: string): Promise<TaskList | null> {
      const row = await db.get<TaskListRow>(
        `SELECT ${LIST_COLUMNS} FROM task_lists l WHERE l.id = ? AND l.deleted_at IS NULL`,
        [id],
      );
      return row ? toTaskList(row) : null;
    },

    async createList(input: NewList): Promise<string> {
      const name = validateListName(input.name);
      const color = validateListColor(input.color);
      const id = newId();
      const at = timestamp();
      const sortOrder = await nextSortOrder(
        'SELECT MAX(sort_order) AS max FROM task_lists WHERE deleted_at IS NULL',
        [],
      );
      await db.run(
        `INSERT INTO task_lists (id, name, emoji, color, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, input.emoji?.trim() || null, color, sortOrder, at, at],
      );
      changes.notify('lists');
      return id;
    },

    async updateList(id: string, patch: ListPatch): Promise<void> {
      const sets: string[] = [];
      const params: (string | null)[] = [];
      if (patch.name !== undefined) {
        sets.push('name = ?');
        params.push(validateListName(patch.name));
      }
      if (patch.emoji !== undefined) {
        sets.push('emoji = ?');
        params.push(patch.emoji?.trim() || null);
      }
      if (patch.color !== undefined) {
        sets.push('color = ?');
        params.push(validateListColor(patch.color));
      }
      if (sets.length === 0) return;
      await db.run(
        `UPDATE task_lists SET ${sets.join(', ')}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
        [...params, timestamp(), id],
      );
      changes.notify('lists');
    },

    /** Soft-deletes the list and every task in it. */
    async deleteList(id: string): Promise<void> {
      const at = timestamp();
      await db.transaction(async () => {
        await db.run(
          'UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE list_id = ? AND deleted_at IS NULL',
          [at, at, id],
        );
        await db.run(
          'UPDATE task_lists SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
          [at, at, id],
        );
      });
      changes.notify('lists');
      changes.notify('tasks');
    },

    // ---------- Tasks ----------

    getTask,

    /** Top-level tasks of a list: open ones first (in order), then completed (newest first). */
    async listTasks(listId: string): Promise<Task[]> {
      const rows = await db.all<TaskRow>(
        `SELECT ${TASK_COLUMNS} FROM tasks t
         WHERE t.list_id = ? AND t.parent_task_id IS NULL AND t.deleted_at IS NULL
         ORDER BY t.completed_at IS NOT NULL, t.completed_at DESC, t.sort_order`,
        [listId],
      );
      return rows.map(toTask);
    },

    async listSubtasks(parentTaskId: string): Promise<Task[]> {
      const rows = await db.all<TaskRow>(
        `SELECT ${TASK_COLUMNS} FROM tasks t
         WHERE t.parent_task_id = ? AND t.deleted_at IS NULL
         ORDER BY t.sort_order`,
        [parentTaskId],
      );
      return rows.map(toTask);
    },

    /**
     * Today: top-level tasks due today (open or done), plus overdue ones still open.
     * Overdue first, then by list and order.
     */
    async listToday(todayKey: string = toDateKey(now())): Promise<TaskWithList[]> {
      const rows = await db.all<TaskWithListRow>(
        `SELECT ${TASK_COLUMNS}, l.name AS list_name, l.emoji AS list_emoji, l.color AS list_color
         FROM tasks t JOIN task_lists l ON l.id = t.list_id AND l.deleted_at IS NULL
         WHERE t.parent_task_id IS NULL AND t.deleted_at IS NULL AND (
           t.due_date = ? OR (t.due_date < ? AND t.completed_at IS NULL)
         )
         ORDER BY t.due_date = ?, t.completed_at IS NOT NULL, l.sort_order, t.sort_order`,
        [todayKey, todayKey, todayKey],
      );
      return rows.map(toTaskWithList);
    },

    async createTask(input: NewTask): Promise<string> {
      const title = validateTaskTitle(input.title);
      const dueDate = validateDueDate(input.dueDate);
      const priority = validatePriority(input.priority);
      let listId = input.listId;
      const parentTaskId = input.parentTaskId ?? null;

      if (parentTaskId) {
        const parent = await requireTask(parentTaskId);
        if (parent.parentTaskId) {
          throw new ValidationError('Subtarefas não podem ter subtarefas.');
        }
        listId = parent.listId;
      }
      const list = await db.get<{ id: string }>(
        'SELECT id FROM task_lists WHERE id = ? AND deleted_at IS NULL',
        [listId],
      );
      if (!list) throw new ValidationError('Esta lista não existe mais.');

      const id = newId();
      const at = timestamp();
      const sortOrder = await nextSortOrder(
        parentTaskId
          ? 'SELECT MAX(sort_order) AS max FROM tasks WHERE parent_task_id = ?'
          : 'SELECT MAX(sort_order) AS max FROM tasks WHERE list_id = ? AND parent_task_id IS NULL',
        [parentTaskId ?? listId],
      );
      await db.run(
        `INSERT INTO tasks
           (id, list_id, parent_task_id, title, priority, due_date, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, listId, parentTaskId, title, priority, dueDate, sortOrder, at, at],
      );
      changes.notify('tasks');
      return id;
    },

    async updateTask(id: string, patch: TaskPatch): Promise<void> {
      const sets: string[] = [];
      const params: (string | number | null)[] = [];
      if (patch.title !== undefined) {
        sets.push('title = ?');
        params.push(validateTaskTitle(patch.title));
      }
      if (patch.notes !== undefined) {
        sets.push('notes = ?');
        params.push(validateNotes(patch.notes));
      }
      if (patch.dueDate !== undefined) {
        sets.push('due_date = ?');
        params.push(validateDueDate(patch.dueDate));
      }
      if (patch.priority !== undefined) {
        sets.push('priority = ?');
        params.push(validatePriority(patch.priority));
      }
      if (sets.length === 0) return;
      await db.run(
        `UPDATE tasks SET ${sets.join(', ')}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
        [...params, timestamp(), id],
      );
      changes.notify('tasks');
    },

    /**
     * Completes or reopens a task and records TASK_COMPLETED / TASK_UNCOMPLETED in the
     * same transaction. Setting the state it already has does nothing (no duplicate events).
     */
    async setCompleted(id: string, completed: boolean): Promise<void> {
      const task = await requireTask(id);
      if (Boolean(task.completedAt) === completed) return;

      const at = timestamp();
      let event: DomainEvent | null = null;
      await db.transaction(async () => {
        await db.run('UPDATE tasks SET completed_at = ?, updated_at = ? WHERE id = ?', [
          completed ? at : null,
          at,
          id,
        ]);
        event = await events.record(
          completed ? 'TASK_COMPLETED' : 'TASK_UNCOMPLETED',
          { type: 'task', id },
          { taskId: id, listId: task.listId, parentTaskId: task.parentTaskId },
        );
      });
      changes.notify('tasks');
      changes.notify('lists');
      if (event) events.publish(event);
    },

    /** Soft-deletes a task and its subtasks. */
    async deleteTask(id: string): Promise<void> {
      const at = timestamp();
      await db.run(
        `UPDATE tasks SET deleted_at = ?, updated_at = ?
         WHERE (id = ? OR parent_task_id = ?) AND deleted_at IS NULL`,
        [at, at, id, id],
      );
      changes.notify('tasks');
      changes.notify('lists');
    },
  };
}

export type TodoRepository = ReturnType<typeof createTodoRepository>;
