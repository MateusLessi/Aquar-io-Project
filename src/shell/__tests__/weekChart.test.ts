import { daySummary } from '../dashboard/WeekChart';

describe('daySummary', () => {
  it('says what was done, in words, with the points', () => {
    expect(daySummary({ points: 45, fullTide: false, tasks: 3, habits: 1, routines: 0 })).toBe(
      '3 tarefas, 1 hábito · 45 pontos',
    );
    expect(daySummary({ points: 5, fullTide: false, routines: 1 })).toBe(
      '1 item de rotina · 5 pontos',
    );
    expect(daySummary(undefined)).toBe('Nada feito');
  });
});
