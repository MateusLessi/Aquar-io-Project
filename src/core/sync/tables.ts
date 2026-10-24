import type { DataTopic } from '../database/changes';

/** A local table mirrored in the cloud. Columns are the same on both sides. */
export type SyncedTable = {
  name: string;
  columns: readonly string[];
  /** Live queries to refresh when rows arrive from the cloud. */
  topic: DataTopic;
  /** Columns that identify a row in the cloud when `id` alone is not unique (default `id`). */
  conflictKey?: string;
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
      'kind',
      'target',
      'unit',
      'steps',
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
    name: 'habit_progress',
    topic: 'habits',
    columns: [
      'id',
      'habit_id',
      'date',
      'amount',
      'steps_done',
      'created_at',
      'updated_at',
      'deleted_at',
    ],
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
  {
    // One row per person with the fixed id 'me', so in the cloud a row is (user_id, id).
    name: 'profile',
    topic: 'profile',
    conflictKey: 'user_id,id',
    columns: ['id', 'name', 'creature', 'created_at', 'updated_at', 'deleted_at'],
  },
];
