import { EVERY_DAY } from '../domain/types';
import { daysLabel, habitProgress, isScheduled } from '../domain/progress';

// 2026-10-21 is a Wednesday.
const today = '2026-10-21';
const progress = (done: string[], days = EVERY_DAY, startKey = '2026-10-01') =>
  habitProgress({ days, done: new Set(done), startKey, todayKey: today });

describe('habit progress', () => {
  it('counts consecutive days and does not break on today', () => {
    expect(progress(['2026-10-19', '2026-10-20']).streak).toBe(2);
    expect(progress(['2026-10-19', '2026-10-20', today]).streak).toBe(3);
  });

  it('ends the current streak on a missed day but keeps the best one', () => {
    const result = progress(['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-20']);
    expect(result.streak).toBe(1);
    expect(result.bestStreak).toBe(3);
  });

  it('skips rest days', () => {
    const weekdays = 0b0111110; // Monday to Friday
    // Fri 16, (weekend), Mon 19, Tue 20: still a streak of 3.
    expect(progress(['2026-10-16', '2026-10-19', '2026-10-20'], weekdays).streak).toBe(3);
  });

  it('measures 30-day consistency without counting today early', () => {
    const result = progress(['2026-10-20', '2026-10-19'], EVERY_DAY, '2026-10-17');
    // Scheduled 17–20 (4 days), 2 done; today is not due yet.
    expect(result.consistency).toBe(0.5);
    expect(progress([], EVERY_DAY, today).consistency).toBeNull();
  });

  it('describes this week, Sunday first', () => {
    const result = progress(['2026-10-19'], 0b0111110);
    expect(result.week).toEqual([
      'rest',
      'done',
      'missed',
      'pending',
      'future',
      'future',
      'future',
    ]);
    expect(result.scheduledToday).toBe(true);
    expect(result.doneToday).toBe(false);
  });
});

describe('schedules', () => {
  it('reads weekdays from the mask', () => {
    expect(isScheduled(0b0000001, '2026-10-18')).toBe(true); // Sunday
    expect(isScheduled(0b0000001, today)).toBe(false);
  });

  it('labels common schedules', () => {
    expect(daysLabel(EVERY_DAY)).toBe('Todo dia');
    expect(daysLabel(0b0111110)).toBe('Dias úteis');
    expect(daysLabel(0b1000001)).toBe('Fim de semana');
    expect(daysLabel(0b0101010)).toBe('Seg, Qua, Sex');
  });
});
