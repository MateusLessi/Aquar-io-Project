import { createMemoryDatabase } from '@/core/database/testing';
import { createAppData, saveThemePreference } from '@/shell/AppData';

describe('app data', () => {
  it('starts with the system theme and remembers the chosen one', async () => {
    const db = createMemoryDatabase();
    const first = await createAppData(db);
    expect(first.themePreference).toBe('system');

    await saveThemePreference(first, 'dark');

    // Reopening the same database (the next app launch) restores the choice.
    const second = await createAppData(db);
    expect(second.themePreference).toBe('dark');
  });

  it('ignores an unknown stored theme', async () => {
    const db = createMemoryDatabase();
    const data = await createAppData(db);
    await data.settings.set('theme', 'neon');
    expect((await createAppData(db)).themePreference).toBe('system');
  });
});
