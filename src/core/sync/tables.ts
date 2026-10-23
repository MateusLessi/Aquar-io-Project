import type { DataTopic } from '../database/changes';

/** A local table mirrored in the cloud. Columns are the same on both sides. */
export type SyncedTable = {
  name: string;
  columns: readonly string[];
  /** Live queries to refresh when rows arrive from the cloud. */
  topic: DataTopic;
};

/** In upload order: parents (lists, habits, routines) before the rows that point to them. */
export const syncedTables: readonly SyncedTable[] = [
  {
    name: 'task_lists',
    topic: 'lists',
    columns: [
      'id',
      'name',
      'emoji',
      'color',
      'sort_order',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
  },
  {
    name: 'tasks',
    topic: 'tasks',
    columns: [
      'id',
      'list_id',
      'parent_task_id',
      'title',
      'notes',
      'priority',
      'due_date',
      'completed_at',
      'sort_order',
      'source_type',
      'source_id',
      'repeat',
      'remind_at',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
  },
  {
    name: 'habits',
    topic: 'habits',
    columns: [
      'id',
      'name',
      'creature',
      'days',
      'reminder_times',
      'sort_order',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
  },
  {
    name: 'habit_checks',
    topic: 'habits',
    columns: ['id', 'habit_id', 'date', 'created_at', 'updated_at', 'deleted_at'],
  },
  {
    name: 'routines',
    topic: 'routines',
    columns: [
      'id',
      'name',
      'emoji',
      'color',
      'start_time',
      'end_time',
      'days',
      'remind',
      'sort_order',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
  },
  {
    name: 'routine_items',
    topic: 'routines',
    columns: ['id', 'routine_id', 'title', 'sort_order', 'created_at', 'updated_at', 'deleted_at'],
  },
  {
    name: 'routine_checks',
    topic: 'routines',
    columns: ['id', 'item_id', 'routine_id', 'date', 'created_at', 'updated_at', 'deleted_at'],
  },
];
