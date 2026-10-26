import {
  durationLabel,
  hourRange,
  routinePhase,
  routinesOn,
  toMinutes,
  weekDays,
  weekStartOf,
} from '../domain/schedule';

// 2026-10-23 is a Friday.
const friday = '2026-10-23';
const morning = { start: '06:00', end: '08:00', days: 0b1111111 };

describe('routine schedule', () => {
  it('knows if a routine is upcoming, happening or over', () => {
    expect(routinePhase(morning, friday, toMinutes('05:20'))).toEqual({
      phase: 'upcoming',
      minutesLeft: 40,
    });
    expect(routinePhase(morning, friday, toMinutes('07:20'))).toEqual({
      phase: 'now',
      minutesLeft: 40,
    });
    expect(routinePhase(morning, friday, toMinutes('08:00')).phase).toBe('past');
  });

  it('rests on days it is not scheduled', () => {
    const weekend = { ...morning, days: 0b1000001 };
    expect(routinePhase(weekend, friday, 400).phase).toBe('rest');
  });

  it('labels durations', () => {
    expect([durationLabel(40), durationLabel(60), durationLabel(75)]).toEqual([
      '40 min',
      '1 h',
      '1 h 15',
    ]);
  });
});

describe('routine week', () => {
  it('starts weeks on Sunday and lists seven days', () => {
    expect(weekStartOf(friday)).toBe('2026-10-18');
    expect(weekStartOf('2026-10-18')).toBe('2026-10-18');
    expect(weekDays('2026-10-25')).toEqual([
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
  });

  it('shows a routine only on its days, from the day it was created', () => {
    const at = new Date(2026, 9, 21, 12).toISOString();
    const late = { start: '20:00', end: '21:00', days: 0b0111110, createdAt: at };
    const early = { start: '06:00', end: '07:00', days: 0b1111111, createdAt: at };
    expect(routinesOn([late, early], friday)).toEqual([early, late]);
    expect(routinesOn([late, early], '2026-10-24')).toEqual([early]); // Saturday
    expect(routinesOn([late, early], '2026-10-20')).toEqual([]); // before it existed
  });

  it('fits the grid to the routines', () => {
    expect(hourRange([])).toEqual({ from: 6, to: 22 });
    expect(hourRange([{ start: '05:30', end: '23:10' }])).toEqual({ from: 5, to: 24 });
  });
});
