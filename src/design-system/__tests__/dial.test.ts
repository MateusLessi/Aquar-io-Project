import { dialValue } from '../components/dialMath';

const at = (deg: number, r = 50) => ({
  x: 60 + r * Math.sin((deg * Math.PI) / 180),
  y: 60 - r * Math.cos((deg * Math.PI) / 180),
});
const base = { size: 120, perTurn: 60, min: 1, max: 180 };

describe('dialValue', () => {
  it('reads the angle as a value within the turn', () => {
    expect(dialValue({ ...base, ...at(90), current: 10 })).toBe(15);
    expect(dialValue({ ...base, ...at(180), current: 20 })).toBe(30);
  });

  it('goes on to the next turn past the top, and back', () => {
    expect(dialValue({ ...base, ...at(30), current: 55 })).toBe(65);
    expect(dialValue({ ...base, ...at(330), current: 65 })).toBe(55);
  });

  it('snaps to the step and stays within the limits', () => {
    expect(dialValue({ ...base, ...at(97), current: 15, step: 5 })).toBe(15);
    expect(dialValue({ ...base, ...at(300), current: 2 })).toBe(1);
    expect(dialValue({ ...base, ...at(10), current: 178 })).toBe(180);
  });
});
