import { createDataChanges } from '../database/changes';
import { migrate } from '../database/migrations';
import { createMemoryDatabase } from '../database/testing';
import { createProfileRepository, parsePrivacy } from '../profile/profileRepository';

async function setup() {
  const db = createMemoryDatabase();
  await migrate(db);
  return {
    db,
    repo: createProfileRepository(db, createDataChanges(), () => new Date(2026, 10, 6)),
  };
}

describe('profile', () => {
  it('starts empty and private', async () => {
    const { repo } = await setup();
    const p = await repo.get();
    expect(p).toMatchObject({ name: '', bio: '', color: null, showcase: [] });
    expect(Object.values(p.privacy).every((v) => v === 'me')).toBe(true);
  });

  it('changes some fields and keeps the others, trimming and capping', async () => {
    const { repo } = await setup();
    await repo.set({ name: '  Mateus  ', creature: 'dolphin' });
    await repo.set({ bio: 'x'.repeat(100), color: 'anemone' });
    await repo.set({ showcase: ['streak', 'tides', 'streak', 'tasks', 'days'] });
    const p = await repo.get();
    expect(p.name).toBe('Mateus');
    expect(p.creature).toBe('dolphin');
    expect(p.bio).toHaveLength(80);
    expect(p.color).toBe('anemone');
    expect(p.showcase).toEqual(['streak', 'tides', 'tasks']);
  });

  it('never opens privacy by accident', async () => {
    expect(parsePrivacy('{"depth":"public","name":"everyone"}')).toMatchObject({
      depth: 'public',
      name: 'me',
    });
    expect(parsePrivacy('not json').stats).toBe('me');
  });
});
