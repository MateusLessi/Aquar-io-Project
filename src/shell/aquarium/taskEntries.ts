import type { RoutineToday } from '@/features/routines/domain/types';
import type { TaskWithList } from '@/features/todo/domain/types';

const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number) as [number, number];
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/**
 * Tasks with a date as agenda entries: at their reminder time (half an hour) when they have
 * one, otherwise the whole day. Done ones stay, so the day shows what got done.
 */
export function taskEntries(tasks: readonly TaskWithList[]): RoutineToday[] {
  return tasks
    .filter((task) => task.dueDate !== null && task.parentTaskId === null)
    .map((task) => {
      const day = task.dueDate!;
      const allDay = task.remindAt === null;
      return {
        id: `task:${task.id}`,
        refId: task.id,
        source: 'task',
        name: task.title,
        emoji: null,
        color: task.listColor ?? 'lagoon',
        start: task.remindAt ?? '00:00',
        end: task.remindAt ? addMinutes(task.remindAt, 30) : '23:59',
        allDay,
        days: 0b1111111,
        remind: false,
        tag: task.completedAt ? `Feita · ${task.listName}` : task.listName,
        sortOrder: task.sortOrder,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        items: [],
        phase: 'upcoming',
        minutesLeft: 0,
        occurs: (key: string) => key === day,
      };
    });
}
