import type { DomainEvent } from '@/core/events/events';
import type { SoundName } from '@/design-system';

export type FeedbackLookups = {
  /** Open (not completed) top-level tasks left in a list. */
  openTasksIn: (listId: string) => Promise<number>;
  /** Items of a routine still unchecked today. */
  routineItemsLeft: (routineId: string) => Promise<number>;
};

/**
 * Which sound a domain event makes: a drop for a task, bubbles for a habit, a small drop for
 * a step, and the chime when it was the last thing of its list or routine. Unchecking is quiet.
 */
export async function soundForEvent(
  event: DomainEvent,
  lookups: FeedbackLookups,
): Promise<SoundName | null> {
  switch (event.type) {
    case 'TASK_COMPLETED': {
      const { listId, parentTaskId } = event.payload as DomainEvent<'TASK_COMPLETED'>['payload'];
      if (parentTaskId) return 'step';
      return (await lookups.openTasksIn(listId)) === 0 ? 'complete' : 'task';
    }
    case 'HABIT_CHECKED':
      return 'habit';
    case 'ROUTINE_ITEM_CHECKED': {
      const { routineId } = event.payload as DomainEvent<'ROUTINE_ITEM_CHECKED'>['payload'];
      return (await lookups.routineItemsLeft(routineId)) === 0 ? 'complete' : 'step';
    }
    default:
      return null;
  }
}
