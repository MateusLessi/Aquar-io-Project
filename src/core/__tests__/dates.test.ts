import { formatTime, leadingBlanks, startOfWeek, weekdayOrder } from '../dates';

describe('week start and clock', () => {
  // 2026-11-05 is a Thursday.
  it('finds the first day of the week, Sunday or Monday', () => {
    expect(startOfWeek('2026-11-05', 0)).toBe('2026-11-01');
    expect(startOfWeek('2026-11-05', 1)).toBe('2026-11-02');
    expect(startOfWeek('2026-11-01', 1)).toBe('2026-10-26'); // a Sunday belongs to the week before
    expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(leadingBlanks(0, 1)).toBe(6);
    expect(leadingBlanks(3, 0)).toBe(3);
  });

  it('reads times in 24 h or 12 h', () => {
    expect(formatTime('19:30', true)).toBe('19:30');
    expect(formatTime('19:30', false)).toBe('7:30 PM');
    expect(formatTime('00:05', false)).toBe('12:05 AM');
    expect(formatTime('12:00', false)).toBe('12:00 PM');
  });
});
