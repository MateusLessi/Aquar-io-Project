import { suggestionsFor } from '../welcome/suggestions';

describe('welcome suggestions', () => {
  it('suggests nothing when nothing was chosen', () => {
    expect(suggestionsFor({ areas: [], peak: null, habits: [], age: null })).toEqual([]);
  });

  it('turns answers into habits, routines at the best time, and lists', () => {
    const s = suggestionsFor({
      areas: ['study', 'health', 'home'],
      peak: 'night',
      habits: ['water', 'read'],
      age: '18-24',
    });
    expect(s.map((x) => x.title)).toEqual([
      'Beber água',
      'Ler',
      'Rotina: Estudo',
      'Rotina: Treino',
      'Lista: Faculdade',
      'Lista: Treinos',
      'Lista: Casa',
    ]);
    const study = s.find((x) => x.key === 'routine:study');
    expect(study?.kind === 'routine' && [study.routine.start, study.routine.end]).toEqual([
      '19:00',
      '21:00',
    ]);
    const water = s.find((x) => x.key === 'habit:water');
    expect(water?.kind === 'habit' && water.habit).toMatchObject({ kind: 'count', target: 8 });
  });

  it('keeps at most two routines and adapts the study list to the age range', () => {
    const s = suggestionsFor({
      areas: ['study', 'work', 'health', 'wellbeing'],
      peak: 'morning',
      habits: [],
      age: 'u18',
    });
    expect(s.filter((x) => x.kind === 'routine')).toHaveLength(2);
    expect(s.some((x) => x.title === 'Lista: Escola')).toBe(true);
    expect(
      suggestionsFor({ areas: ['study'], peak: null, habits: [], age: null }).some(
        (x) => x.title === 'Lista: Estudos',
      ),
    ).toBe(true);
  });
});
