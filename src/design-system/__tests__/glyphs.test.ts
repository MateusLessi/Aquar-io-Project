import { glyphKey, glyphKeys, glyphNames } from '../glyphs';

describe('glyphKey', () => {
  it('keeps stored icon keys', () => {
    expect(glyphKey('dumbbell')).toBe('dumbbell');
    expect(glyphKey('book-open')).toBe('book-open');
  });

  it('maps emoji from before icons to the closest icon', () => {
    expect(glyphKey('🏋️')).toBe('dumbbell');
    expect(glyphKey('📚')).toBe('library');
    expect(glyphKey('🌅')).toBe('sunrise');
  });

  it('falls back to a star for an emoji it does not know, and to nothing for empty', () => {
    expect(glyphKey('🦄')).toBe('star');
    expect(glyphKey(null)).toBeNull();
    expect(glyphKey('')).toBeNull();
  });

  it('names every icon for screen readers', () => {
    for (const key of glyphKeys) expect(glyphNames[key]).toBeTruthy();
  });
});
