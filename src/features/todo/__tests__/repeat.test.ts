import { formatRepeat, nextDueDate, parseRepeat } from '../domain/repeat';

// 2026-10-21 is a Wednesday.
const today = '2026-10-21';

describe('repeat', () => {
  it('round-trips through text', () => {
    for (const text of ['daily', 'weekly', 'monthly', 'days:62']) {
      expect(formatRepeat(parseRepeat(text))).toBe(text);
    }
    expect(parseRepeat('days:0')).toBeNull();
    expect(parseRepeat('yearly')).toBeNull();
    expect(parseRepeat(null)).toBeNull();
  });

  it('daily: tomorrow, even when done late', () => {
    expect(nextDueDate(today, { kind: 'daily' }, today)).toBe('2026-10-22');
    expect(nextDueDate('2026-10-15', { kind: 'daily' }, today)).toBe('2026-10-22');
    // Done early: the day after the due date.
    expect(nextDueDate('2026-10-25', { kind: 'daily' }, today)).toBe('2026-10-26');
  });

  it('weekly: same weekday, skipping weeks already past', () => {
    expect(nextDueDate(today, { kind: 'weekly' }, today)).toBe('2026-10-28');
    expect(nextDueDate('2026-10-07', { kind: 'weekly' }, today)).toBe('2026-10-28');
  });

  it('monthly: same day of the month, clamped to short months', () => {
    expect(nextDueDate(today, { kind: 'monthly' }, today)).toBe('2026-11-21');
    expect(nextDueDate('2026-01-31', { kind: 'monthly' }, '2026-01-31')).toBe('2026-02-28');
    expect(nextDueDate('2026-01-31', { kind: 'monthly' }, '2026-03-01')).toBe('2026-03-31');
  });

  it('weekdays: the next chosen day of the week', () => {
    const weekdays = { kind: 'weekdays', days: 0b0111110 } as const;
    expect(nextDueDate('2026-10-23', weekdays, '2026-10-23')).toBe('2026-10-26'); // Fri → Mon
    expect(nextDueDate(today, weekdays, today)).toBe('2026-10-22');
  });
});
