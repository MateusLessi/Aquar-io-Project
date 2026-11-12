import { isGecko } from '../theme/ThemeProvider';

describe('isGecko', () => {
  it('tells Firefox engines from the others', () => {
    expect(
      isGecko('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0'),
    ).toBe(true);
    expect(
      isGecko(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 OPR/115.0',
      ),
    ).toBe(false);
    expect(
      isGecko(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe(false);
    expect(isGecko(undefined)).toBe(false);
  });
});
