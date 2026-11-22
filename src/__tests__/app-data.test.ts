import { createMemoryDatabase } from '@/core/database/testing';
import { createAppData, saveTextScale } from '@/shell/AppData';

describe('app data', () => {
  it('starts with the default text size and remembers the chosen one', async () => {
    const db = createMemoryDatabase();
    const first = await createAppData(db);
    expect(first.textScale).toBe(1);

    await saveTextScale(first, 1.3);

    // Reopening the same database (the next app launch) restores the choice.
    const second = await createAppData(db);
    expect(second.textScale).toBe(1.3);
  });

  it('ignores an unknown stored text size', async () => {
    const db = createMemoryDatabase();
    const data = await createAppData(db);
    await data.settings.set('textScale', '9');
    expect((await createAppData(db)).textScale).toBe(1);
  });
});
