import type { HabitWithProgress } from '@/features/habits/domain/types';
import type { RoutineToday } from '@/features/routines/domain/types';

import { habitOfTheMoment, nextOnAgenda } from '../nav/now';

const entry = (over: Partial<RoutineToday>): RoutineToday =>
  ({
    id: 'x',
    name: 'X',
    start: '08:00',
    end: '09:00',
    phase: 'upcoming',
    minutesLeft: 0,
    ...over,
  }) as RoutineToday;

const habit = (over: Partial<HabitWithProgress>): HabitWithProgress =>
  ({
    id: 'h',
    name: 'H',
    days: 0b1111111,
    doneToday: false,
    reminderTimes: [],
    ...over,
  }) as HabitWithProgress;

describe('nextOnAgenda', () => {
  it('prefers what is on now, then what starts soonest; never whole-day things', () => {
    const list = [
      entry({ id: 'later', phase: 'upcoming', minutesLeft: 90 }),
      entry({ id: 'soon', phase: 'upcoming', minutesLeft: 20 }),
      entry({ id: 'bday', phase: 'now', allDay: true, minutesLeft: 600 }),
    ];
    expect(nextOnAgenda(list)?.id).toBe('soon');
    expect(nextOnAgenda([...list, entry({ id: 'now', phase: 'now', minutesLeft: 30 })])?.id).toBe(
      'now',
    );
    expect(nextOnAgenda([entry({ phase: 'past' })])).toBeNull();
  });
});

describe('habitOfTheMoment', () => {
  it('picks one due and not done, with a reminder near now first', () => {
    const habits = [
      habit({ id: 'done', doneToday: true }),
      habit({ id: 'plain' }),
      habit({ id: 'evening', reminderTimes: ['21:00'] }),
      habit({ id: 'noon', reminderTimes: ['12:00'] }),
      habit({ id: 'weekend', days: 0b1000001 }),
    ];
    // Tuesday 11:50.
    expect(habitOfTheMoment(habits, '2026-11-17', 11 * 60 + 50)?.id).toBe('noon');
    // 13:00: noon's reminder is past; the evening one comes next.
    expect(habitOfTheMoment(habits, '2026-11-17', 13 * 60)?.id).toBe('evening');
    expect(habitOfTheMoment([habit({ doneToday: true })], '2026-11-17', 600)).toBeNull();
  });
});
