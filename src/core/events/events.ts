/**
 * Domain events: facts about something that happened. Modules emit them; the future
 * Progress Engine (Etapa 9) reads them. Add new types here as modules ship.
 */
export type DomainEventMap = {
  TASK_COMPLETED: { taskId: string; listId: string; parentTaskId: string | null };
  TASK_UNCOMPLETED: { taskId: string; listId: string; parentTaskId: string | null };
  HABIT_CHECKED: { habitId: string; date: string };
  HABIT_UNCHECKED: { habitId: string; date: string };
  ROUTINE_ITEM_CHECKED: { routineId: string; itemId: string; date: string };
  ROUTINE_ITEM_UNCHECKED: { routineId: string; itemId: string; date: string };
};

export type DomainEventType = keyof DomainEventMap;

export type DomainEvent<T extends DomainEventType = DomainEventType> = {
  id: string;
  type: T;
  entityType: string;
  entityId: string;
  payload: DomainEventMap[T];
  occurredAt: string;
};
