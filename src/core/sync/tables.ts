import type { DataTopic } from '../database/changes';

/** A local table mirrored in the cloud. Columns are the same on both sides. */
export type SyncedTable = {
  name: string;
  columns: readonly string[];
  /** Live queries to refresh when rows arrive from the cloud. */
  topic: DataTopic;
};

/** In upload order: parents (lists, habits) before the rows that point to them. */
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
];
