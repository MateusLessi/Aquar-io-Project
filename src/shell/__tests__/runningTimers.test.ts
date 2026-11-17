import type { HabitWithProgress } from '@/features/habits/domain/types';
import type { TaskWithList } from '@/features/todo/domain/types';

import { clock, elapsedOf, runningTimers } from '../timers/running';

const habit = (over: Partial<HabitWithProgress>) =>
  ({
    id: 'h',
    name: 'Meditar',
    creature: 'octopus',
    kind: 'time',
    target: 10,
    today: { amount: 60, stepsDone: [], ratio: 0.1, timerStartedAt: null },
    ...over,
  }) as HabitWithProgress;
const task = (over: Partial<TaskWithList>) =>
  ({
    id: 't',
    title: 'Prancha',
    kind: 'time',
    target: 1,
    amount: 0,
    completedAt: null,
    timerStartedAt: null,
    listId: 'l',
    listName: 'Treino A',
    listColor: 'kelp',
    ...over,
  }) as TaskWithList;

describe('running timers', () => {
  it('collects running habit and item timers, the oldest first', () => {
    const list = runningTimers(
      [
        habit({
          today: { amount: 60, stepsDone: [], ratio: 0, timerStartedAt: '2026-11-17T10:05:00Z' },
        }),
        habit({ id: 'idle' }),
        habit({
          id: 'count',
          kind: 'count',
          today: { amount: 0, stepsDone: [], ratio: 0, timerStartedAt: '2026-11-17T10:00:00Z' },
        }),
      ],
      [
        task({ timerStartedAt: '2026-11-17T10:01:00Z' }),
        task({
          id: 'done',
          timerStartedAt: '2026-11-17T10:00:00Z',
          completedAt: '2026-11-17T10:02:00Z',
        }),
      ],
    );
    expect(list.map((t) => `${t.kind}:${t.id}`)).toEqual(['task:t', 'habit:h']);
    expect(list[1]).toMatchObject({ goal: 600, before: 60 });
    expect(list[0]).toMatchObject({ goal: 60, listName: 'Treino A' });
  });

  it('counts the time on the clock', () => {
    const [timer] = runningTimers(
      [
        habit({
          today: { amount: 60, stepsDone: [], ratio: 0, timerStartedAt: '2026-11-17T10:00:00Z' },
        }),
      ],
      [],
    );
    expect(elapsedOf(timer!, Date.parse('2026-11-17T10:06:32Z'))).toBe(452);
    expect(clock(452)).toBe('7:32');
    expect(clock(3729)).toBe('1:02:09');
  });
});
