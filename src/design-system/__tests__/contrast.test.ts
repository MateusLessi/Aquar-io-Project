import {
  highContrastColors,
  listColorNames,
  listColors,
  oceanDepths,
  specular,
  themeColors,
  type ColorScheme,
} from '../tokens';
import { contrastRatio } from '../utils/contrast';

const AA_TEXT = 4.5;
const AA_GRAPHICS = 3;

const schemes: ColorScheme[] = ['light', 'dark'];

describe.each(schemes)('%s theme contrast (WCAG AA)', (scheme) => {
  const c = themeColors[scheme];
  const backgrounds = { surfaceRaised: c.surfaceRaised, surfaceBase: c.surfaceBase };

  const textTokens = [
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

  it.each(textTokens)('%s is readable on surfaces', (token) => {
    for (const background of Object.values(backgrounds)) {
      expect(contrastRatio(c[token], background)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  it('text on deep water is readable along the whole gradient', () => {
    for (const background of [c.deepTop, c.deepBottom]) {
      for (const token of ['onDeep', 'onDeepSecondary', 'deepAccent'] as const) {
        expect(contrastRatio(c[token], background)).toBeGreaterThanOrEqual(AA_TEXT);
      }
    }
    expect(contrastRatio(c.onDeepAccent, c.deepAccent)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('onEnergy is readable on energy', () => {
    expect(contrastRatio(c.onEnergy, c.energy)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrastRatio(c.onEnergy, c.energyPressed)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('onAccent is readable on accent', () => {
    expect(contrastRatio(c.onAccent, c.accent)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(listColorNames)('list color %s is visible as a graphic', (name) => {
    expect(contrastRatio(listColors[name][scheme], c.surfaceRaised)).toBeGreaterThanOrEqual(
      AA_GRAPHICS,
    );
  });
});

describe.each(schemes)('%s high contrast (WCAG AAA for text)', (scheme) => {
  const c = { ...themeColors[scheme], ...highContrastColors[scheme] };
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
