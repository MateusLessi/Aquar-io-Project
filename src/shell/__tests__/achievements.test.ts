import {
  badgesFor,
  showcaseItem,
  showcaseOptions,
  type AchievementFacts,
} from '../profile/achievements';

const facts = (over: Partial<AchievementFacts> = {}): AchievementFacts => ({
  fullTides: 0,
  meters: 0,
  tasksDone: 0,
  bestStreak: null,
  habits: [],
  links: 0,
  firstDay: null,
  todayKey: '2026-11-06',
  ...over,
});

describe('badges', () => {
  it('starts with none and says what is left', () => {
    const badges = badgesFor(facts());
    expect(badges).toHaveLength(14);
    expect(badges.every((b) => !b.earned)).toBe(true);
    expect(badges.find((b) => b.id === 'tide-10')?.hint).toBe('Faltam 10');
    expect(badges.find((b) => b.id === 'zone-reef')?.hint).toBe('Faltam 300 m');
  });

  it('earns from real progress', () => {
    const badges = badgesFor(
      facts({
        fullTides: 12,
        meters: 320,
        tasksDone: 100,
        bestStreak: { days: 9, habitName: 'Meditar', creature: 'turtle' },
        habits: [{ id: 'h', name: 'Meditar', creature: 'turtle', stage: 'adult' }],
        links: 1,
      }),
    );
    const earned = badges.filter((b) => b.earned).map((b) => b.id);
    expect(earned).toEqual([
      'tide-1',
      'tide-10',
      'streak-7',
      'zone-coastal',
      'zone-reef',
      'tasks-100',
      'grown',
      'link',
    ]);
  });
});

describe('showcase', () => {
  const f = facts({
    fullTides: 3,
    bestStreak: { days: 4, habitName: 'Ler', creature: 'fish' },
    habits: [{ id: 'h1', name: 'Ler', creature: 'fish', stage: 'baby' }],
    firstDay: '2026-11-01',
  });
  const badges = badgesFor(f);

  it('turns picks into tiles and drops the ones that no longer apply', () => {
    expect(showcaseItem('streak', f, badges)).toMatchObject({ value: '4 dias', detail: 'Ler' });
    expect(showcaseItem('days', f, badges)?.value).toBe('6 dias');
    expect(showcaseItem('favorite:h1', f, badges)?.value).toBe('Peixe');
    expect(showcaseItem('favorite:gone', f, badges)).toBeNull();
    expect(showcaseItem('badge:tide-50', f, badges)).toBeNull();
  });

  it('offers favorites per habit and only earned badges', () => {
    const picks = showcaseOptions(f, badges).map((o) => o.pick);
    expect(picks).toContain('favorite:h1');
    expect(picks).toContain('badge:tide-1');
    expect(picks).not.toContain('badge:tide-10');
  });
});
