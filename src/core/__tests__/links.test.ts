import { createDataChanges } from '@/core/database/changes';
import { migrate } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';

import { canLink, createLinksRepository, linkId } from '../links/linksRepository';

const clock = { now: new Date(2026, 9, 25, 9, 0) };

async function setup() {
  const db = createMemoryDatabase();
  await migrate(db);
  const changes = createDataChanges();
  const topics: string[] = [];
  changes.subscribe((t) => topics.push(t));
  return { db, topics, links: createLinksRepository({ db, changes, now: () => clock.now }) };
}

describe('links', () => {
  it('knows what fits where', () => {
    expect(canLink('habit', 'routine')).toBe(true);
    expect(canLink('list', 'habit')).toBe(true);
    expect(canLink('folder', 'routine')).toBe(true);
    expect(canLink('habit', 'habit')).toBe(false);
  });

  it('places items in a routine, habits by time first, and shows both directions', async () => {
    const { links, topics } = await setup();
    await links.link({
      itemKind: 'list',
      itemId: 'treino',
      targetKind: 'routine',
      targetId: 'gym',
    });
    await links.link({
      itemKind: 'habit',
      itemId: 'agua',
      targetKind: 'routine',
      targetId: 'gym',
      at: '18:10',
    });
    await links.link({
      itemKind: 'habit',
      itemId: 'alongar',
      targetKind: 'routine',
      targetId: 'gym',
      at: '18:05',
    });
    const inGym = await links.linksTo('routine', 'gym');
    expect(inGym.map((l) => [l.itemId, l.at])).toEqual([
      ['alongar', '18:05'],
      ['agua', '18:10'],
      ['treino', null],
    ]);
    await links.link({ itemKind: 'list', itemId: 'treino', targetKind: 'habit', targetId: 'hab' });
    expect((await links.linksFrom('list', 'treino')).map((l) => l.targetKind)).toEqual([
      'routine',
      'habit',
    ]);
    expect(topics.every((t) => t === 'links')).toBe(true);
  });

  it('is one row per pair, even made twice or on two devices', async () => {
    const { links } = await setup();
    const input = {
      itemKind: 'habit',
      itemId: 'agua',
      targetKind: 'routine',
      targetId: 'gym',
    } as const;
    const first = await links.link(input);
    const again = await links.link({ ...input, at: '18:30' });
    expect(again).toBe(first);
    expect(first).toBe(linkId('habit', 'agua', 'routine', 'gym'));
    const [link] = await links.linksTo('routine', 'gym');
    expect(link?.at).toBe('18:30');
  });

  it('unlinks without deleting anything else, and links again', async () => {
    const { links } = await setup();
    const id = await links.link({
      itemKind: 'list',
      itemId: 'l',
      targetKind: 'habit',
      targetId: 'h',
    });
    await links.unlink(id);
    expect(await links.linksTo('habit', 'h')).toEqual([]);
    expect(
      await links.link({ itemKind: 'list', itemId: 'l', targetKind: 'habit', targetId: 'h' }),
    ).toBe(id);
    expect(await links.linksTo('habit', 'h')).toHaveLength(1);
  });

  it('refuses what does not fit and bad times', async () => {
    const { links } = await setup();
    await expect(
      links.link({ itemKind: 'habit', itemId: 'a', targetKind: 'habit', targetId: 'b' }),
    ).rejects.toThrow('dentro de outro hábito');
    await expect(
      links.link({
        itemKind: 'list',
        itemId: 'a',
        targetKind: 'routine',
        targetId: 'b',
        at: '18:00',
      }),
    ).rejects.toThrow('Horário');
    await expect(
      links.link({
        itemKind: 'habit',
        itemId: 'a',
        targetKind: 'routine',
        targetId: 'b',
        at: '25:00',
      }),
    ).rejects.toThrow('Horário');
  });
});
