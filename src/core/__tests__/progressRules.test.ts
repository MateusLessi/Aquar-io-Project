import {
  DAILY_CAP,
  dayPoints,
  depthFor,
  emptyDay,
  isFullTide,
  rawPoints,
  totalDepth,
} from '../progress/rules';

const day = (overrides: Partial<ReturnType<typeof emptyDay>>) => ({ ...emptyDay(), ...overrides });

describe('points', () => {
  it('adds tasks, subtasks and habits', () => {
    expect(rawPoints(day({ tasks: 2, subtasks: 1, habitsScheduled: 1, habitsRestDay: 1 }))).toBe(
      20 + 3 + 15 + 8,
    );
  });

  it('gives the full-tide bonus only with at least 3 things due, all done', () => {
    expect(isFullTide(day({ due: 3, dueDone: 3 }))).toBe(true);
    expect(isFullTide(day({ due: 2, dueDone: 2 }))).toBe(false);
    expect(isFullTide(day({ due: 3, dueDone: 2 }))).toBe(false);
    expect(rawPoints(day({ tasks: 3, due: 3, dueDone: 3 }))).toBe(30 + 25);
  });

  it('caps a day', () => {
    expect(dayPoints(day({ tasks: 40 }))).toBe(DAILY_CAP);
    expect(totalDepth([day({ tasks: 40 }), day({ tasks: 1 })])).toBe(DAILY_CAP + 10);
  });
});

describe('depth', () => {
  it('finds the zone, the next one and the progress through it', () => {
    expect(depthFor(0).zone.id).toBe('surface');
    const reef = depthFor(500);
    expect([reef.zone.id, reef.next?.id, reef.progress]).toEqual(['reef', 'open', 0.5]);
    expect(depthFor(20000)).toMatchObject({ next: null, progress: 1 });
    expect(depthFor(20000).zone.id).toBe('mariana');
  });
});
