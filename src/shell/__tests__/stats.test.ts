import { computeStats, periodOf, shiftPeriod, type StatsFacts } from '../stats/computeStats';

// 2026-10-25 is a Sunday; "today" is Wednesday 28.
const today = '2026-10-28';
const local = (day: string, hour: number) => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, hour, 15).toISOString();
};
const created = local('2026-10-26', 8); // Monday

const facts = (over: Partial<StatsFacts> = {}): StatsFacts => ({
  taskTimes: [],
  habits: [],
  habitDone: [],
  routines: [],
  routineChecks: [],
  points: {},
  ...over,
});

describe('stats periods', () => {
  it('finds the week (Sunday first) and the month of a day', () => {
    const week = periodOf('week', today);
    expect([week.from, week.to, week.days.length]).toEqual(['2026-10-25', '2026-10-31', 7]);
    const month = periodOf('month', today);
    expect([month.from, month.to, month.days.length]).toEqual(['2026-10-01', '2026-10-31', 31]);
    expect(periodOf('month', '2026-02-10').days.length).toBe(28);
  });

  it('moves to the previous and next period', () => {
    expect(shiftPeriod(periodOf('week', today), -1).from).toBe('2026-10-18');
    expect(shiftPeriod(periodOf('month', today), 1).from).toBe('2026-11-01');
    expect(shiftPeriod(periodOf('month', '2026-01-15'), -1).from).toBe('2025-12-01');
  });
});

describe('computeStats', () => {
  it('counts completions per day and per part of the day, only inside the period', () => {
    const stats = computeStats(
      periodOf('week', today),
      facts({
        taskTimes: [local('2026-10-26', 9), local('2026-10-26', 20), local('2026-10-20', 9)],
        habits: [
          { id: 'h', name: 'Meditar', creature: 'turtle', days: 0b1111111, createdAt: created },
        ],
        habitDone: [{ habitId: 'h', day: '2026-10-27', at: local('2026-10-27', 7) }],
      }),
      today,
    );
    expect(stats.byDay.find((d) => d.day === '2026-10-26')).toMatchObject({ tasks: 2, habits: 0 });
    expect(stats.totals).toEqual({ tasks: 2, habits: 1, routines: 0, all: 3 });
    expect(stats.hours[1]![1]).toBe(1); // Monday morning task
    expect(stats.hours[3]![1]).toBe(1); // Monday evening task
    expect(stats.hours[1]![2]).toBe(1); // Tuesday morning habit
    expect(stats.byDay.at(-1)?.future).toBe(true);
  });

  it('plans habits and routines only from their creation day up to today', () => {
    const stats = computeStats(
      periodOf('week', today),
      facts({
        habits: [
          { id: 'h', name: 'Meditar', creature: 'turtle', days: 0b1111111, createdAt: created },
        ],
        habitDone: [
          { habitId: 'h', day: '2026-10-26', at: local('2026-10-26', 7) },
          { habitId: 'h', day: '2026-10-27', at: local('2026-10-27', 7) },
        ],
        routines: [
          {
            id: 'r',
            name: 'Manhã',
            emoji: '🌅',
            color: 'kelp',
            tag: 'Saúde',
            days: 0b1111111,
            createdAt: created,
            itemCount: 2,
          },
        ],
        routineChecks: [
          { routineId: 'r', day: '2026-10-26', at: local('2026-10-26', 6) },
          { routineId: 'r', day: '2026-10-26', at: local('2026-10-26', 6) },
          { routineId: 'r', day: '2026-10-27', at: local('2026-10-27', 6) },
        ],
      }),
      today,
    );
    // Mon, Tue, Wed: 3 habit days (2 done) + 3 × 2 routine items (3 done).
    expect(stats.planned).toEqual({ due: 9, done: 5 });
    expect(stats.habitRows[0]).toMatchObject({ done: 2, due: 3, total: 2 });
    expect(stats.routineRows[0]).toMatchObject({ itemsDone: 3, itemsDue: 6, fullDays: 1, days: 3 });
    expect(stats.weekdayRate[0]).toBeNull(); // Sunday: nothing existed yet
    expect(stats.weekdayRate[1]).toBe(1);
    expect(stats.weekdayRate[3]).toBe(0);
  });

  it('follows depth from before the period, day by day', () => {
    const stats = computeStats(
      periodOf('week', today),
      facts({
        points: {
          '2026-10-20': { points: 100, fullTide: true },
          '2026-10-26': { points: 30, fullTide: false },
          '2026-10-28': { points: 20, fullTide: false },
        },
      }),
      today,
    );
    expect(stats.depth.start).toBe(100);
    expect(stats.depth.end).toBe(150);
    expect(stats.depth.byDay.map((d) => d.meters)).toEqual([100, 130, 130, 150]);
  });
});
