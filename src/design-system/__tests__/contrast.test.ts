import {
  appColors,
  highContrastColors,
  listColorNames,
  listColors,
  oceanDepths,
  specular,
} from '../tokens';
import { contrastRatio } from '../utils/contrast';

const AA_TEXT = 4.5;
const AA_GRAPHICS = 3;

/** The app has one look (Fase 6): every text pair is checked here. */
describe('the one look (WCAG AA)', () => {
  const c = appColors;
  const text = [
    'textPrimary',
    'textSecondary',
    'textTertiary',
    'accent',
    'priority',
    'success',
    'warning',
    'error',
    'info',
  ] as const;

  it.each(text)('%s is readable on every surface', (token) => {
    for (const background of [c.surfaceRaised, c.surfaceBase, c.surfaceTop]) {
      expect(contrastRatio(c[token], background)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('text on the midnight-green chrome is readable along the whole gradient', () => {
    for (const background of [c.deepTop, c.deepBottom]) {
      for (const token of ['onDeep', 'onDeepSecondary', 'deepAccent'] as const) {
        expect(contrastRatio(c[token], background)).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
    expect(contrastRatio(c.onDeepAccent, c.deepAccent)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('text on the orange action and on the accent is readable', () => {
    expect(contrastRatio(c.onEnergy, c.energy)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.onEnergy, c.energyPressed)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.onAccent, c.accent)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('text on what is selected (midnight green) is readable', () => {
    expect(contrastRatio(c.onSelected, c.selected)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.deepAccent, c.selected)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('keeps orange out of small text: it is below AA on the cards', () => {
    // A reminder of why the orange is only a button and icon color.
    expect(contrastRatio(c.energy, c.surfaceRaised)).toBeLessThan(AA_TEXT);
  });

  it.each(listColorNames)('list color %s is visible as a graphic', (name) => {
    expect(contrastRatio(listColors[name].dark, c.surfaceRaised)).toBeGreaterThanOrEqual(
      AA_GRAPHICS,
    );
  });
});

describe('high contrast (WCAG AAA for text)', () => {
  const c = { ...appColors, ...highContrastColors };
  it.each(['textPrimary', 'textSecondary', 'textTertiary'] as const)(
    '%s reaches 7:1 on surfaces',
    (token) => {
      for (const background of [c.surfaceRaised, c.surfaceBase]) {
        expect(contrastRatio(c[token], background)).toBeGreaterThanOrEqual(7);
      }
    },
  );
});

describe('welcome dive', () => {
  it('keeps white text readable at the top of every depth', () => {
    for (const depth of oceanDepths) {
      expect(contrastRatio(specular, depth.top)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
