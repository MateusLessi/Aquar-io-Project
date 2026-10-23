import { durationLabel, routinePhase, toMinutes } from '../domain/schedule';

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
