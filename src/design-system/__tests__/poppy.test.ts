import { numberIn } from '../motion/poppy';

describe('numberIn', () => {
  it('finds the first number and writes the text with another value in its place', () => {
    const parts = numberIn('+30 m');
    expect(parts?.target).toBe(30);
    expect(parts?.write(12.4)).toBe('+12 m');
    expect(numberIn('45%')?.write(9)).toBe('9%');
    expect(numberIn('3 dias')?.write(3)).toBe('3 dias');
  });

  it('keeps decimals and the separator', () => {
    const parts = numberIn('1,5 L');
    expect(parts?.target).toBe(1.5);
    expect(parts?.write(0.75)).toBe('0,8 L');
    expect(numberIn('2.25 h')?.write(1)).toBe('1.00 h');
  });

  it('leaves text without numbers alone', () => {
    expect(numberIn('—')).toBeNull();
  });
});
