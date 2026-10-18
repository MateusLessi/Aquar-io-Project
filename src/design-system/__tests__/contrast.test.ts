import { listColorNames, listColors, themeColors, type ColorScheme } from '../tokens';
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

  it('onAccent is readable on accent', () => {
    expect(contrastRatio(c.onAccent, c.accent)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(listColorNames)('list color %s is visible as a graphic', (name) => {
    expect(contrastRatio(listColors[name][scheme], c.surfaceRaised)).toBeGreaterThanOrEqual(
      AA_GRAPHICS,
    );
  });
});
