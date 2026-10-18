import { addDays, dueLabel, dueStatus, isDateKey, quickDueDates, toDateKey } from '../domain/dates';

describe('date keys', () => {
  it('uses the local calendar day', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('validates real calendar days only', () => {
    expect(isDateKey('2026-10-18')).toBe(true);
    expect(isDateKey('2026-02-29')).toBe(false);
    expect(isDateKey('2028-02-29')).toBe(true);
    expect(isDateKey('18/10/2026')).toBe(false);
  });

  it('adds days across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('due status and labels', () => {
  const today = '2026-10-18';

  it('classifies due dates relative to today', () => {
    expect(dueStatus('2026-10-17', today)).toBe('overdue');
    expect(dueStatus(today, today)).toBe('today');
    expect(dueStatus('2026-10-19', today)).toBe('tomorrow');
    expect(dueStatus('2026-11-02', today)).toBe('later');
  });

  it('uses friendly words near today', () => {
    expect(dueLabel(today, today)).toBe('Hoje');
    expect(dueLabel('2026-10-19', today)).toBe('Amanhã');
    expect(dueLabel('2026-10-17', today)).toBe('Ontem');
    expect(dueLabel('2026-10-22', today)).toMatch(/22/);
    expect(dueLabel('2027-01-05', today)).toMatch(/2027/);
  });

  it('offers quick picks', () => {
    expect(quickDueDates(today).map((q) => q.value)).toEqual([
      '2026-10-18',
      '2026-10-19',
      '2026-10-25',
    ]);
  });
});
