import { needsInstallHint } from '../install/installHint';

const iphone =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const base = { userAgent: iphone, maxTouchPoints: 5, standalone: false, dismissed: false };

describe('install hint', () => {
  it('shows on iPhone Safari outside the installed app', () => {
    expect(needsInstallHint(base)).toBe(true);
  });

  it('shows on iPad, which reports itself as a Mac', () => {
    const ipad =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
    expect(needsInstallHint({ ...base, userAgent: ipad })).toBe(true);
    expect(needsInstallHint({ ...base, userAgent: ipad, maxTouchPoints: 0 })).toBe(false);
  });

  it('stays away once installed, dismissed, or elsewhere', () => {
    expect(needsInstallHint({ ...base, standalone: true })).toBe(false);
    expect(needsInstallHint({ ...base, dismissed: true })).toBe(false);
    expect(needsInstallHint({ ...base, userAgent: iphone.replace('Safari', 'CriOS Safari') })).toBe(
      false,
    );
    expect(
      needsInstallHint({
        ...base,
        userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36',
      }),
    ).toBe(false);
  });
});
