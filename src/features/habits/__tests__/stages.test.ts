import { creatureStage, nextStage } from '../domain/stages';

describe('creature stages', () => {
  it('hatches egg-laying creatures from an egg', () => {
    expect([0, 2, 3, 9, 10, 29, 30].map((d) => creatureStage('turtle', d))).toEqual([
      'egg',
      'egg',
      'baby',
      'baby',
      'young',
      'young',
      'adult',
    ]);
  });

  it('starts mammals and sharks as babies (no whale eggs)', () => {
    expect(creatureStage('whale', 0)).toBe('baby');
    expect(creatureStage('shark', 0)).toBe('baby');
    expect(nextStage('whale', 0)).toEqual({ stage: 'young', daysLeft: 10 });
  });

  it('says how far the next stage is, and nothing once adult', () => {
    expect(nextStage('turtle', 1)).toEqual({ stage: 'baby', daysLeft: 2 });
    expect(nextStage('turtle', 30)).toBeNull();
  });
});
