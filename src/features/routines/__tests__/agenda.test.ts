import { createDataChanges } from '@/core/database/changes';
import { migrate } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';
import { createEventLog } from '@/core/events/eventLog';

import { createRoutinesRepository } from '../data/routinesRepository';
import { eventEntry, eventOccurs, validateEvent } from '../domain/agenda';
import { routinePhase, routinesOn } from '../domain/schedule';
import { RoutineValidationError } from '../domain/validation';

let counter = 0;
const newId = () => `id-${++counter}`;
const clock = { now: new Date(2026, 10, 17, 10, 0) }; // Tuesday 17 Nov 2026, 10:00

async function setup() {
  const db = createMemoryDatabase();
  await migrate(db);
  const changes = createDataChanges();
  const events = createEventLog({ db, newId, now: () => clock.now });
  return createRoutinesRepository({ db, changes, events, newId, now: () => clock.now });
}

describe('when an event happens', () => {
  it('once, or every week, month or year', () => {
    const exam = { date: '2026-11-17', repeat: 'none' as const };
    expect(eventOccurs(exam, '2026-11-17')).toBe(true);
    expect(eventOccurs(exam, '2026-11-24')).toBe(false);
    expect(eventOccurs({ ...exam, repeat: 'weekly' }, '2026-11-24')).toBe(true);
    expect(eventOccurs({ ...exam, repeat: 'weekly' }, '2026-11-10')).toBe(false);
    expect(eventOccurs({ ...exam, repeat: 'monthly' }, '2026-12-17')).toBe(true);
    expect(eventOccurs({ ...exam, repeat: 'yearly' }, '2027-11-17')).toBe(true);
    expect(eventOccurs({ ...exam, repeat: 'yearly' }, '2027-12-17')).toBe(false);
  });

  it('never skips a month for lack of a day', () => {
    const rent = { date: '2026-01-31', repeat: 'monthly' as const };
    expect(eventOccurs(rent, '2026-02-28')).toBe(true);
    expect(eventOccurs(rent, '2026-04-30')).toBe(true);
    expect(eventOccurs(rent, '2026-04-29')).toBe(false);
    const leap = { date: '2028-02-29', repeat: 'yearly' as const };
    expect(eventOccurs(leap, '2029-02-28')).toBe(true);
  });

  it('shows among routines, whole-day events first', () => {
    const base = {
      id: 'e',
      emoji: null,
      color: 'coral' as const,
      repeat: 'none' as const,
      remindBefore: null,
      notes: null,
      listId: null,
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    };
    const exam = eventEntry({
      ...base,
      title: 'Prova',
      date: '2026-11-17',
      start: '08:00',
      end: '10:00',
    });
    const birthday = eventEntry({
      ...base,
      id: 'b',
      title: 'Aniversário',
      date: '2026-11-17',
      start: null,
      end: null,
    });
    expect(routinesOn([exam, birthday], '2026-11-17').map((e) => e.name)).toEqual([
      'Aniversário',
      'Prova',
    ]);
    expect(routinesOn([exam, birthday], '2026-11-18')).toEqual([]);
    expect(exam).toMatchObject({ source: 'event', refId: 'e', allDay: false });
  });

  it('validates what makes no sense', () => {
    const ok = { title: 'Prova', date: '2026-11-17' };
    expect(validateEvent(ok)).toMatchObject({ start: null, end: null, repeat: 'none' });
    expect(() => validateEvent({ ...ok, title: ' ' })).toThrow(RoutineValidationError);
    expect(() => validateEvent({ ...ok, start: '10:00' })).toThrow(RoutineValidationError);
    expect(() => validateEvent({ ...ok, start: '10:00', end: '09:00' })).toThrow(
      RoutineValidationError,
    );
    expect(() => validateEvent({ ...ok, date: '17/11' })).toThrow(RoutineValidationError);
  });
});

describe('a routine changed for one day only', () => {
  const routine = {
    start: '07:00',
    end: '08:00',
    days: 0b1111111,
    createdAt: '2026-11-01T00:00:00Z',
    overrides: {
      '2026-11-17': {
        routineId: 'r',
        date: '2026-11-17',
        skip: false,
        start: '09:00',
        end: '10:00',
      },
      '2026-11-18': { routineId: 'r', date: '2026-11-18', skip: true, start: null, end: null },
    },
  };

  it('moves on that day and is skipped on the other, and stays on the rest', () => {
    expect(routinesOn([routine], '2026-11-17')[0]).toMatchObject({ start: '09:00', end: '10:00' });
    expect(routinesOn([routine], '2026-11-18')).toEqual([]);
    expect(routinesOn([routine], '2026-11-19')[0]).toMatchObject({ start: '07:00' });
    expect(routinePhase(routine, '2026-11-17', 8 * 60)).toEqual({
      phase: 'upcoming',
      minutesLeft: 60,
    });
    expect(routinePhase(routine, '2026-11-18', 7 * 60).phase).toBe('rest');
  });
});

describe('agenda in the repository', () => {
  it('creates, changes and deletes events', async () => {
    const repo = await setup();
    const id = await repo.createEvent({
      title: 'Prova de Cálculo',
      date: '2026-11-20',
      start: '08:00',
      end: '10:00',
      remindBefore: 1440,
    });
    expect(await repo.getEvent(id)).toMatchObject({
      title: 'Prova de Cálculo',
      color: 'coral',
      remindBefore: 1440,
      repeat: 'none',
    });
    await repo.updateEvent(id, { title: 'Prova de Cálculo 3', date: '2026-11-21' });
    expect(await repo.getEvent(id)).toMatchObject({ date: '2026-11-21', start: null });
    await repo.deleteEvent(id);
    expect(await repo.listEvents()).toEqual([]);
    await expect(repo.updateEvent(id, { title: 'X', date: '2026-11-21' })).rejects.toThrow(
      RoutineValidationError,
    );
  });

  it('skips or moves a routine on one day, and puts it back', async () => {
    const repo = await setup();
    const id = await repo.createRoutine({
      name: 'Manhã',
      start: '07:00',
      end: '08:00',
      items: ['Água'],
    });
    await repo.setOverride(id, '2026-11-17', { start: '10:30', end: '11:00' });
    let [today] = await repo.listToday();
    expect(today).toMatchObject({ phase: 'upcoming', minutesLeft: 30 });
    expect(today!.overrides!['2026-11-17']).toMatchObject({ skip: false, start: '10:30' });

    await repo.setOverride(id, '2026-11-17', { skip: true });
    [today] = await repo.listToday();
    expect(today!.phase).toBe('rest');

    await repo.clearOverride(id, '2026-11-17');
    [today] = await repo.listToday();
    expect(today!.phase).toBe('past');
    await expect(
      repo.setOverride(id, '2026-11-18', { start: '10:00', end: '09:00' }),
    ).rejects.toThrow(RoutineValidationError);
  });

  it('a skipped day is not due for progress', async () => {
    const repo = await setup();
    clock.now = new Date(2026, 10, 16, 10, 0);
    const id = await repo.createRoutine({
      name: 'Manhã',
      start: '07:00',
      end: '08:00',
      items: ['Água'],
    });
    clock.now = new Date(2026, 10, 17, 10, 0);
    await repo.setOverride(id, '2026-11-16', { skip: true });
    const { due } = await repo.progressFacts('2026-11-17');
    expect(due.map((d) => d.day)).toEqual(['2026-11-17']);
  });
});
