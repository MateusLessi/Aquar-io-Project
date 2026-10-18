import type { Database } from '../database/types';
import { createEmitter } from './emitter';
import type { DomainEvent, DomainEventMap, DomainEventType } from './events';

export type EventLogDeps = { db: Database; newId: () => string; now: () => Date };

/**
 * Records domain events in the `domain_events` table and notifies live subscribers.
 * `record` must be called inside the same transaction as the change it describes,
 * so an event never exists without its change (or the other way around).
 */
export function createEventLog({ db, newId, now }: EventLogDeps) {
  const live = createEmitter<DomainEvent>();

  return {
    async record<T extends DomainEventType>(
      type: T,
      entity: { type: string; id: string },
      payload: DomainEventMap[T],
    ): Promise<DomainEvent<T>> {
      const event: DomainEvent<T> = {
        id: newId(),
        type,
        entityType: entity.type,
        entityId: entity.id,
        payload,
        occurredAt: now().toISOString(),
      };
      await db.run(
        `INSERT INTO domain_events (id, type, entity_type, entity_id, payload, occurred_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [event.id, type, entity.type, entity.id, JSON.stringify(payload), event.occurredAt],
      );
      return event;
    },
    /** Notify subscribers after the transaction committed. */
    publish(event: DomainEvent) {
      live.emit(event);
    },
    subscribe: live.subscribe,
    async count(type: DomainEventType): Promise<number> {
      const row = await db.get<{ total: number }>(
        'SELECT COUNT(*) AS total FROM domain_events WHERE type = ?',
        [type],
      );
      return row?.total ?? 0;
    },
  };
}

export type EventLog = ReturnType<typeof createEventLog>;
