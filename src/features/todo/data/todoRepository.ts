import type { DataChanges } from '@/core/database/changes';
import type { Database } from '@/core/database/types';
import type { DomainEvent } from '@/core/events/events';
import type { EventLog } from '@/core/events/eventLog';
import { idFrom } from '@/core/ids';

import { toDateKey } from '../domain/dates';
import { formatRepeat, nextDueDate } from '../domain/repeat';
import type {
  FolderCrumb,
  FolderSummary,
  ListPatch,
  NewList,
  NewTask,
  Task,
  TaskList,
  TaskPatch,
  TaskReminder,
  TaskWithList,
} from '../domain/types';
import {
  ValidationError,
  validateDueDate,
  validateListColor,
  validateListName,
  validateNotes,
  validatePriority,
  validateRemindAt,
  validateTaskGoal,
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
import { doneOn, dayLiteral, resetsOf } from './daySql';
import { createFolderMethods } from './folders';

export type TodoDeps = {
  db: Database;
  changes: DataChanges;
  events: EventLog;
  newId: () => string;
  now: () => Date;
};

/** A list, and how many of its top-level items are open (today, for lists that start over). */
const listColumns = (day: string) => `
  l.id, l.name, l.emoji, l.color, l.folder_id, l.resets, l.sort_order, l.created_at, l.updated_at,
  (SELECT COUNT(*) FROM tasks t
    WHERE t.list_id = l.id AND t.parent_task_id IS NULL AND t.deleted_at IS NULL
      AND CASE WHEN l.resets = 1 THEN ${doneOn('t', day)} IS NULL
               ELSE t.completed_at IS NULL END) AS pending_count`;

/**
 * A task. In a list that starts over every day, "completed" and the amount are that day's
 * (task_checks), so every screen shows today's state without knowing the difference.
 */
const taskColumns = (day: string) => `
  t.id, t.list_id, t.parent_task_id, t.title, t.notes, t.priority, t.due_date,
  CASE WHEN ${resetsOf('t')} = 1 THEN ${doneOn('t', day)} ELSE t.completed_at END AS completed_at,
  CASE WHEN ${resetsOf('t')} = 1
       THEN COALESCE((SELECT c.amount FROM task_checks c WHERE c.task_id = t.id
                        AND c.date = ${dayLiteral(day)} AND c.deleted_at IS NULL), 0)
       ELSE t.amount END AS amount,
  t.kind, t.target, t.unit,
  (SELECT tm.started_at FROM task_timers tm WHERE tm.task_id = t.id) AS timer_started_at,
  t.repeat, t.remind_at, t.sort_order, t.created_at, t.updated_at,
  (SELECT COUNT(*) FROM tasks s WHERE s.parent_task_id = t.id AND s.deleted_at IS NULL)
    AS subtask_count,
  (SELECT COUNT(*) FROM tasks s
    WHERE s.parent_task_id = t.id AND s.deleted_at IS NULL AND s.completed_at IS NOT NULL)
    AS subtask_done_count`;

/**
 * All To Do reads and writes. Every write validates its input, stamps `updated_at`
 * and announces which data changed so live screens refresh.
 */
export function createTodoRepository(deps: TodoDeps) {
  const { db, changes, events, newId, now } = deps;
  const timestamp = () => now().toISOString();
  const today = () => toDateKey(now());
  const folders = createFolderMethods(deps);

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
      `SELECT ${taskColumns(today())} FROM tasks t WHERE t.id = ? AND t.deleted_at IS NULL`,
      [id],
    );
    return row ? toTask(row) : null;
  }

  /**
   * Completing a repeating task creates its next copy and hands the repetition over to it.
   * The copy's id comes from the original's, so two devices completing the same task create
   * the same copy, which sync merges.
   */
  async function createNextOccurrence(task: Task, at: string): Promise<void> {
    const dueDate = nextDueDate(task.dueDate!, task.repeat!, toDateKey(now()));
    await db.run(
      `INSERT OR IGNORE INTO tasks
         (id, list_id, title, notes, priority, due_date, repeat, remind_at,
          sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idFrom(`${task.id}:next`),
        task.listId,
        task.title,
        task.notes,
        task.priority,
        dueDate,
        formatRepeat(task.repeat),
        task.remindAt,
        task.sortOrder,
        at,
        at,
      ],
    );
    await db.run('UPDATE tasks SET repeat = NULL WHERE id = ?', [task.id]);
  }

  // Read-then-write changes run one at a time.
  let queue: Promise<unknown> = Promise.resolve();
  function serially<T>(work: () => Promise<T>): Promise<T> {
    const run = queue.then(work, work);
    queue = run.catch(() => undefined);
    return run;
  }

  /** Units to reach, or seconds for a time item; 1 for a check item. */
  function goalOf(task: Task): number {
    if (task.kind === 'check' || !task.target) return 1;
    return task.kind === 'time' ? task.target * 60 : task.target;
  }

  async function listResets(listId: string): Promise<boolean> {
    const row = await db.get<{ resets: number }>('SELECT resets FROM task_lists WHERE id = ?', [
      listId,
    ]);
    return row?.resets === 1;
  }

  /** A day's mark on an item of a list that starts over. One row per item and day. */
  async function writeCheck(task: Task, day: string, amount: number, done: boolean) {
    const at = timestamp();
    await db.run(
      `INSERT INTO task_checks (id, task_id, list_id, date, amount, done, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET amount = excluded.amount, done = excluded.done,
         updated_at = excluded.updated_at, deleted_at = NULL`,
      [`${task.id}:${day}`, task.id, task.listId, day, amount, done ? 1 : 0, at, at],
    );
  }

  /** Records and announces a completion: sounds, celebrations and live screens follow it. */
  async function publishCompletion(task: Task, completed: boolean) {
    const event = await events.record(
      completed ? 'TASK_COMPLETED' : 'TASK_UNCOMPLETED',
      { type: 'task', id: task.id },
      { taskId: task.id, listId: task.listId, parentTaskId: task.parentTaskId },
    );
    changes.notify('tasks');
    changes.notify('lists');
    events.publish(event);
  }

  /** Top-level tasks of the given lists, each with its list and the list's folder path. */
  async function tasksOfLists(
    where: string,
    params: (string | null)[],
    orderBy = 't.sort_order',
  ): Promise<TaskWithList[]> {
    const tree = await folders.loadTree();
    const rows = await db.all<TaskWithListRow>(
      `SELECT ${taskColumns(today())}, l.folder_id AS list_folder_id, l.name AS list_name,
              l.emoji AS list_emoji, l.color AS list_color
       FROM tasks t JOIN task_lists l ON l.id = t.list_id AND l.deleted_at IS NULL
       WHERE t.parent_task_id IS NULL AND t.deleted_at IS NULL AND ${where}
       ORDER BY ${orderBy}`,
      params,
    );
    return rows.map((row) =>
      toTaskWithList(
        row,
        tree.path(tree.folderOfList(row.list_folder_id)).map((c) => c.name),
      ),
    );
  }

  return {
    // ---------- Folders ----------

    ...folders,

    /**
     * What a folder shows: its subfolders and lists, and the trail to it. `null` is the top
     * level: folders without a parent and lists without a folder.
     */
    async folderContents(folderId: string | null): Promise<{
      folder: FolderSummary | null;
      path: FolderCrumb[];
      folders: FolderSummary[];
      lists: TaskList[];
    } | null> {
      const tree = await folders.loadTree();
      const folder = folderId ? (tree.folders.get(folderId) ?? null) : null;
      if (folderId && !folder) return null;
      const rows = await db.all<TaskListRow>(
        `SELECT ${listColumns(today())} FROM task_lists l
         WHERE l.deleted_at IS NULL ORDER BY l.sort_order`,
      );
      return {
        folder,
        path: tree.path(folderId),
        folders: [...tree.folders.values()].filter((f) => f.parentId === folderId),
        lists: rows.map(toTaskList).filter((l) => tree.folderOfList(l.folderId) === folderId),
      };
    },

    /**
     * Every top-level task in the folder's lists and subfolders (every list when `null`):
     * open ones by due date (no date last), then completed ones, newest first.
     */
    async folderTasks(folderId: string | null): Promise<TaskWithList[]> {
      const tree = await folders.loadTree();
      if (folderId && !tree.folders.has(folderId)) return [];
      const inside = folderId ? new Set(tree.subtree(folderId)) : null;
      const tasks = await tasksOfLists('1 = 1', []);
      const lists = await db.all<{ id: string; folder_id: string | null }>(
        'SELECT id, folder_id FROM task_lists WHERE deleted_at IS NULL',
      );
      // No folder: every list, as the top level's "all together".
      const listIds = new Set(
        lists
          .filter((l) => !inside || inside.has(tree.folderOfList(l.folder_id) ?? ''))
          .map((l) => l.id),
      );
      return tasks
        .filter((t) => listIds.has(t.listId))
        .sort((a, b) => {
          if (!a.completedAt !== !b.completedAt) return a.completedAt ? 1 : -1;
          if (a.completedAt && b.completedAt) return b.completedAt.localeCompare(a.completedAt);
          const due = (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
          return due !== 0 ? due : a.sortOrder - b.sortOrder;
        });
    },

    // ---------- Lists ----------

    async listLists(): Promise<TaskList[]> {
      const rows = await db.all<TaskListRow>(
        `SELECT ${listColumns(today())} FROM task_lists l
         WHERE l.deleted_at IS NULL ORDER BY l.sort_order`,
      );
      return rows.map(toTaskList);
    },

    async getList(id: string): Promise<TaskList | null> {
      const row = await db.get<TaskListRow>(
        `SELECT ${listColumns(today())} FROM task_lists l WHERE l.id = ? AND l.deleted_at IS NULL`,
        [id],
      );
      return row ? toTaskList(row) : null;
    },

    async createList(input: NewList): Promise<string> {
      const name = validateListName(input.name);
      const color = validateListColor(input.color);
      const folderId = input.folderId ?? null;
      if (folderId && !(await folders.loadTree()).folders.has(folderId)) {
        throw new ValidationError('Esta pasta não existe mais.');
      }
      const id = newId();
      const at = timestamp();
      const sortOrder = await nextSortOrder(
        'SELECT MAX(sort_order) AS max FROM task_lists WHERE deleted_at IS NULL',
        [],
      );
      await db.run(
        `INSERT INTO task_lists
           (id, name, emoji, color, folder_id, resets, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name,
          input.emoji?.trim() || null,
          color,
          folderId,
          input.resets ? 1 : 0,
          sortOrder,
          at,
          at,
        ],
      );
      changes.notify('lists');
      return id;
    },

    async updateList(id: string, patch: ListPatch): Promise<void> {
      const sets: string[] = [];
      const params: (string | number | null)[] = [];
      if (patch.name !== undefined) {
        sets.push('name = ?');
        params.push(validateListName(patch.name));
      }
      if (patch.resets !== undefined) {
        sets.push('resets = ?');
        params.push(patch.resets ? 1 : 0);
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
        `SELECT ${taskColumns(today())} FROM tasks t
         WHERE t.list_id = ? AND t.parent_task_id IS NULL AND t.deleted_at IS NULL
         ORDER BY completed_at IS NOT NULL, completed_at DESC, t.sort_order`,
        [listId],
      );
      return rows.map(toTask);
    },

    async listSubtasks(parentTaskId: string): Promise<Task[]> {
      const rows = await db.all<TaskRow>(
        `SELECT ${taskColumns(today())} FROM tasks t
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
    /**
     * What gamification needs from tasks: every completion with its local day, and per due
     * day how many top-level tasks were due and done. Completed tasks count even if deleted
     * later: the effort happened.
     */
    /** For statistics: when each task (not subtask) was completed, between two days. */
    async completionTimes(from: string, to: string): Promise<string[]> {
      const rows = await db.all<{ completed_at: string }>(
        `SELECT completed_at FROM tasks
         WHERE completed_at IS NOT NULL AND parent_task_id IS NULL AND deleted_at IS NULL`,
      );
      return rows
        .map((r) => r.completed_at)
        .filter((at) => {
          const day = toDateKey(new Date(at));
          return day >= from && day <= to;
        });
    },

    async progressFacts(todayKey: string = toDateKey(now())): Promise<{
      completions: { day: string; subtask: boolean; listId: string }[];
      due: { day: string; total: number; done: number }[];
    }> {
      const completed = await db.all<{
        parent_task_id: string | null;
        completed_at: string;
        list_id: string;
      }>('SELECT parent_task_id, completed_at, list_id FROM tasks WHERE completed_at IS NOT NULL');
      // Lists that start over: each day's marks count on their day.
      const checked = await db.all<{ date: string; list_id: string }>(
        `SELECT c.date, c.list_id FROM task_checks c
         JOIN tasks t ON t.id = c.task_id AND t.deleted_at IS NULL AND t.parent_task_id IS NULL
         WHERE c.done = 1 AND c.deleted_at IS NULL`,
      );
      const due = await db.all<{ day: string; total: number; done: number }>(
        `SELECT due_date AS day, COUNT(*) AS total,
                SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS done
         FROM tasks
         WHERE parent_task_id IS NULL AND deleted_at IS NULL
           AND due_date IS NOT NULL AND due_date <= ?
         GROUP BY due_date`,
        [todayKey],
      );
      return {
        completions: [
          ...completed.map((row) => ({
            day: toDateKey(new Date(row.completed_at)),
            subtask: row.parent_task_id !== null,
            listId: row.list_id,
          })),
          ...checked.map((row) => ({ day: row.date, subtask: false, listId: row.list_id })),
        ],
        due,
      };
    },

    /** Open tasks with a reminder on or after `fromKey`, for scheduling notifications. */
    async listReminders(fromKey: string = toDateKey(now())): Promise<TaskReminder[]> {
      const rows = await db.all<{
        id: string;
        title: string;
        list_id: string;
        list_name: string;
        list_emoji: string | null;
        due_date: string;
        remind_at: string;
      }>(
        `SELECT t.id, t.title, t.list_id, t.due_date, t.remind_at,
                l.name AS list_name, l.emoji AS list_emoji
         FROM tasks t JOIN task_lists l ON l.id = t.list_id AND l.deleted_at IS NULL
         WHERE t.deleted_at IS NULL AND t.completed_at IS NULL
           AND t.remind_at IS NOT NULL AND t.due_date >= ?
         ORDER BY t.due_date, t.remind_at`,
        [fromKey],
      );
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        listId: row.list_id,
        listName: row.list_name,
        listEmoji: row.list_emoji,
        dueDate: row.due_date,
        remindAt: row.remind_at,
      }));
    },

    async listToday(todayKey: string = toDateKey(now())): Promise<TaskWithList[]> {
      return tasksOfLists(
        '(t.due_date = ? OR (t.due_date < ? AND t.completed_at IS NULL))',
        // The last ? belongs to ORDER BY: today's tasks after the overdue ones.
        [todayKey, todayKey, todayKey],
        't.due_date = ?, t.completed_at IS NOT NULL, l.sort_order, t.sort_order',
      );
    },

    async createTask(input: NewTask): Promise<string> {
      const title = validateTaskTitle(input.title);
      const dueDate = validateDueDate(input.dueDate);
      const priority = validatePriority(input.priority);
      const goal = validateTaskGoal(input.kind ?? 'check', input.target, input.unit);
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
           (id, list_id, parent_task_id, title, priority, due_date, kind, target, unit,
            sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          listId,
          parentTaskId,
          title,
          priority,
          dueDate,
          goal.kind,
          goal.target,
          goal.unit,
          sortOrder,
          at,
          at,
        ],
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
      // Repeating and reminders hang on the due date: removing the date removes them.
      const current = await requireTask(id);
      if (patch.kind !== undefined || patch.target !== undefined || patch.unit !== undefined) {
        const goal = validateTaskGoal(
          patch.kind ?? current.kind,
          patch.target !== undefined ? patch.target : current.target,
          patch.unit !== undefined ? patch.unit : current.unit,
        );
        sets.push('kind = ?', 'target = ?', 'unit = ?');
        params.push(goal.kind, goal.target, goal.unit);
      }
      const dueDate = patch.dueDate !== undefined ? patch.dueDate : current.dueDate;
      if (!dueDate) {
        if (patch.repeat) throw new ValidationError('Escolha uma data para a tarefa repetir.');
        if (patch.remindAt) throw new ValidationError('Escolha uma data para o lembrete.');
        if (current.repeat || current.remindAt) sets.push('repeat = NULL', 'remind_at = NULL');
      } else {
        if (patch.repeat !== undefined) {
          if (patch.repeat && current.parentTaskId) {
            throw new ValidationError('Subtarefas não se repetem.');
          }
          sets.push('repeat = ?');
          params.push(formatRepeat(patch.repeat));
        }
        if (patch.remindAt !== undefined) {
          sets.push('remind_at = ?');
          params.push(validateRemindAt(patch.remindAt));
        }
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
      const goal = goalOf(task);
      // A list that starts over keeps the mark for today only.
      if (await listResets(task.listId)) {
        await writeCheck(task, today(), completed ? Math.max(task.amount, goal) : 0, completed);
        await publishCompletion(task, completed);
        return;
      }
      let event: DomainEvent | null = null;
      await db.transaction(async () => {
        await db.run('UPDATE tasks SET completed_at = ?, amount = ?, updated_at = ? WHERE id = ?', [
          completed ? at : null,
          completed ? Math.max(task.amount, goal) : 0,
          at,
          id,
        ]);
        if (completed && task.repeat && task.dueDate && !task.parentTaskId) {
          await createNextOccurrence(task, at);
        }
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

    /**
     * Sets a count item's units, or a time item's seconds. Reaching the goal completes it;
     * going back below reopens it.
     */
    async setAmount(id: string, amount: number): Promise<void> {
      const task = await requireTask(id);
      if (task.kind === 'check') throw new ValidationError('Este item não usa quantidade.');
      const value = Math.max(0, Math.round(amount));
      const done = value >= goalOf(task);
      if (await listResets(task.listId)) {
        await writeCheck(task, today(), value, done);
        if (done !== Boolean(task.completedAt)) await publishCompletion(task, done);
        else changes.notify('tasks');
        return;
      }
      if (done !== Boolean(task.completedAt)) await this.setCompleted(id, done);
      await db.run('UPDATE tasks SET amount = ?, updated_at = ? WHERE id = ?', [
        value,
        timestamp(),
        id,
      ]);
      changes.notify('tasks');
    },

    /**
     * Adds to (or takes from) an item's amount. Never below zero. Taps are queued, so quick
     * taps all count (each one reads the amount the previous one wrote).
     */
    addAmount(id: string, delta: number): Promise<void> {
      return serially(async () => {
        const task = await requireTask(id);
        await this.setAmount(id, task.amount + delta);
      });
    },

    /** Starts a time item's timer. Only the start is stored, so it counts with the app closed. */
    async startTimer(id: string): Promise<void> {
      const task = await requireTask(id);
      if (task.kind !== 'time') throw new ValidationError('Este item não usa cronômetro.');
      await db.run(
        `INSERT INTO task_timers (task_id, date, started_at) VALUES (?, ?, ?)
         ON CONFLICT(task_id) DO NOTHING`,
        [id, today(), timestamp()],
      );
      changes.notify('tasks');
    },

    /** Stops the timer and adds the elapsed time. Returns the seconds added. */
    async stopTimer(id: string): Promise<number> {
      const timer = await db.get<{ started_at: string }>(
        'SELECT started_at FROM task_timers WHERE task_id = ?',
        [id],
      );
      if (!timer) return 0;
      await db.run('DELETE FROM task_timers WHERE task_id = ?', [id]);
      const seconds = Math.max(
        0,
        Math.round((now().getTime() - new Date(timer.started_at).getTime()) / 1000),
      );
      await this.addAmount(id, seconds);
      return seconds;
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
