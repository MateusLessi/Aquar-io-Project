import { habitProgress } from '@/features/habits/domain/progress';
import type { HabitWithProgress } from '@/features/habits/domain/types';

import { MAX_SCHEDULED, inQuietHours, parseQuietHours, planReminders } from '../reminders/plan';

// Wednesday 2026-10-21, 12:30 local time.
const now = new Date(2026, 9, 21, 12, 30);
const today = '2026-10-21';

function habit(overrides: Partial<HabitWithProgress> & { done?: string[] }): HabitWithProgress {
  const days = overrides.days ?? 0b1111111;
  return {
    id: 'h1',
    name: 'Beber água',
    creature: 'fish',
    days,
    reminderTimes: ['10:00', '14:00'],
    kind: 'check',
    target: 1,
    unit: null,
    steps: [],
    today: { amount: 0, stepsDone: [], ratio: 0, timerStartedAt: null },
    weekRatios: [0, 0, 0, 0, 0, 0, 0],
    sortOrder: 1,
    stage: 'egg',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...habitProgress({
      days,
      done: new Set(overrides.done ?? []),
      startKey: '2026-10-01',
      todayKey: today,
    }),
    ...overrides,
  };
}

describe('planReminders', () => {
  it('schedules habit times on scheduled days, only in the future', () => {
    const plan = planReminders({ habits: [habit({})], tasks: [], now });
    // Today 10:00 has passed; 14:00 is next, then two per day for 6 more days.
    expect(plan[0]?.at).toEqual(new Date(2026, 9, 21, 14, 0));
    expect(plan[0]?.title).toBe('Beber água');
    expect(plan[0]?.url).toBe('/aquarium/habits/h1');
    expect(plan).toHaveLength(1 + 6 * 2);
  });

  it('skips today once the habit is done, and rest days', () => {
    const weekend = habit({ days: 0b1000001, done: [today] });
    const plan = planReminders({ habits: [weekend], tasks: [], now });
    // Only Saturday 24 and Sunday 25 fall in the next 7 days.
    expect(plan.map((r) => r.at.getDate())).toEqual([24, 24, 25, 25]);

    const doneToday = habit({ done: [today] });
    expect(planReminders({ habits: [doneToday], tasks: [], now })[0]?.at.getDate()).toBe(22);
  });

  it('schedules task reminders on their due date, soonest first', () => {
    const task = {
      id: 't1',
      title: 'Pagar contas',
      listId: 'l1',
      listName: 'Casa',
      listEmoji: '🏠',
      remindAt: '09:00',
    };
    const plan = planReminders({
      habits: [],
      tasks: [
        { ...task, id: 't2', dueDate: '2026-10-23' },
        { ...task, dueDate: '2026-10-22' },
        { ...task, id: 'past', dueDate: today }, // 09:00 already passed
        { ...task, id: 'far', dueDate: '2026-12-01' }, // beyond the horizon
      ],
      now,
    });
    expect(plan.map((r) => r.id)).toEqual(['task:t1:2026-10-22T09:00', 'task:t2:2026-10-23T09:00']);
    expect(plan[0]).toMatchObject({
      title: 'Pagar contas',
      body: '🏠 Casa',
      url: '/aquarium/lists/l1',
    });
  });

  it('never exceeds the platform limit', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      habit({ id: `h${i}`, reminderTimes: ['13:00', '15:00', '17:00', '19:00', '21:00'] }),
    );
    expect(planReminders({ habits: many, tasks: [], now })).toHaveLength(MAX_SCHEDULED);
  });

  it('moves or skips a routine reminder changed for one day', () => {
    const routine = {
      id: 'r1',
      name: 'Academia',
      emoji: null,
      color: 'coral' as const,
      start: '19:00',
      end: '20:00',
      days: 0b0101010,
      remind: true,
      tag: null,
      sortOrder: 1,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      overrides: {
        '2026-10-21': {
          routineId: 'r1',
          date: '2026-10-21',
          skip: false,
          start: '21:00',
          end: '22:00',
        },
        '2026-10-23': { routineId: 'r1', date: '2026-10-23', skip: true, start: null, end: null },
      },
    };
    const plan = planReminders({ habits: [], tasks: [], routines: [routine], now });
    expect(plan.map((r) => [r.at.getDate(), r.at.getHours()])).toEqual([
      [21, 21],
      [26, 19],
    ]);
  });

  it('rings events before they start, and whole-day ones the evening before', () => {
    const base = {
      emoji: null,
      color: 'coral' as const,
      repeat: 'none' as const,
      notes: null,
      listId: null,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    const plan = planReminders({
      habits: [],
      tasks: [],
      events: [
        {
          ...base,
          id: 'e1',
          title: 'Prova',
          date: '2026-10-23',
          start: '08:00',
          end: '10:00',
          remindBefore: 60,
        },
        {
          ...base,
          id: 'e2',
          title: 'Aniversário',
          date: '2026-10-25',
          start: null,
          end: null,
          remindBefore: 1440,
        },
        {
          ...base,
          id: 'e3',
          title: 'Sem aviso',
          date: '2026-10-22',
          start: '08:00',
          end: '09:00',
          remindBefore: null,
        },
      ],
      now,
    });
    expect(plan.map((r) => [r.title, r.at.getDate(), r.at.getHours()])).toEqual([
      ['Prova', 23, 7],
      ['Aniversário', 24, 20],
    ]);
    expect(plan[1]!.body).toBe('Amanhã, o dia todo.');
  });

  it('rings routines with a reminder when they start', () => {
    const routine = {
      id: 'r1',
      name: 'Academia',
      emoji: '🏋️',
      color: 'coral' as const,
      start: '19:00',
      end: '20:00',
      days: 0b0101010, // Mon, Wed, Fri
      remind: true,
      tag: null,
      sortOrder: 1,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    const plan = planReminders({ habits: [], tasks: [], routines: [routine], now });
    // Wed 21 (today, 19:00 still ahead), Fri 23, Mon 26.
    expect(plan.map((r) => r.at.getDate())).toEqual([21, 23, 26]);
    expect(plan[0]).toMatchObject({ title: 'Academia', url: '/aquarium?tab=routines' });
    const silent = planReminders({
      habits: [],
      tasks: [],
      routines: [{ ...routine, remind: false }],
      now,
    });
    expect(silent).toEqual([]);
  });

  it('rings when a running timer reaches the goal', () => {
    const reading = habit({
      kind: 'time',
      target: 20,
      reminderTimes: [],
      today: {
        amount: 5 * 60,
        stepsDone: [],
        ratio: 0.25,
        timerStartedAt: '2026-10-21T15:30:00.000Z',
      },
    });
    const plan = planReminders({ habits: [reading], tasks: [], now });
    const timer = plan.find((r) => r.id.startsWith('timer:'));
    expect(timer?.at.toISOString()).toBe('2026-10-21T15:45:00.000Z');
    expect(timer?.url).toBe('/aquarium/habits/h1?dive=1');
    // Not while stopped.
    const stopped = habit({ kind: 'time', target: 20, reminderTimes: [] });
    expect(planReminders({ habits: [stopped], tasks: [], now }).length).toBe(0);
  });
});

describe('quiet hours', () => {
  it('reads the setting and keeps only valid windows', () => {
    expect(parseQuietHours('22:00-07:00')).toEqual({ from: '22:00', to: '07:00' });
    expect(parseQuietHours('')).toBeNull();
    expect(parseQuietHours('08:00-08:00')).toBeNull();
  });

  it('covers windows across midnight and within a day', () => {
    const at = (h: number, m = 0) => new Date(2026, 10, 5, h, m);
    const night = { from: '22:00', to: '07:00' };
    expect(inQuietHours(at(23), night)).toBe(true);
    expect(inQuietHours(at(6, 59), night)).toBe(true);
    expect(inQuietHours(at(7), night)).toBe(false);
    expect(inQuietHours(at(12), night)).toBe(false);
    const lunch = { from: '12:00', to: '13:30' };
    expect(inQuietHours(at(12, 45), lunch)).toBe(true);
    expect(inQuietHours(at(13, 30), lunch)).toBe(false);
  });
});
