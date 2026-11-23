import { consistency } from '../stats/ConsistencyCard';

describe('consistency', () => {
  it('is the share of the plan done so far this week', () => {
    expect(consistency({ due: 4, done: 3 })).toBe(0.75);
    expect(consistency({ due: 5, done: 5 })).toBe(1);
  });

  it('is empty, not zero, when nothing was planned yet', () => {
    expect(consistency({ due: 0, done: 0 })).toBeNull();
  });

  it('never passes 100%', () => {
    expect(consistency({ due: 2, done: 3 })).toBe(1);
  });
});
