import { creatureStage, levelFor, nextStage, stagePath } from '../domain/stages';

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

  it('lists the path from the first stage, with the day each one begins', () => {
    expect(stagePath('fish')).toEqual([
      { stage: 'egg', from: 0 },
      { stage: 'baby', from: 3 },
      { stage: 'young', from: 10 },
      { stage: 'adult', from: 30 },
    ]);
    // Born alive: no egg in the path.
    expect(stagePath('shark').map((s) => s.stage)).toEqual(['baby', 'young', 'adult']);
  });

  it('turns XP into levels that change where the stages do, and keep going after adult', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, from: 0, to: 15, progress: 0 });
    // 3, 10 and 30 planned days (15 XP each): levels 3, 6 and 10, like Filhote, Jovem, Adulto.
    expect([45, 150, 450].map((xp) => levelFor(xp).level)).toEqual([3, 6, 10]);
    expect(levelFor(240)).toMatchObject({ level: 7, from: 200, to: 260 });
    expect(levelFor(450 + 150 * 2 + 10)).toMatchObject({ level: 12, from: 750, to: 900 });
  });
});
