import { createDataChanges } from '@/core/database/changes';
import { migrate } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';

import { canLink, createLinksRepository, linkId } from '../links/linksRepository';
import { formatRule, parseRule } from '../links/sourceRule';

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

describe('how a habit is done from a link (rule)', () => {
  it('reads, cleans and writes rules, falling back to "all items"', () => {
    expect(parseRule(null)).toEqual({ doneWhen: 'all' });
    expect(parseRule('not json')).toEqual({ doneWhen: 'all' });
    expect(
      parseRule(
        JSON.stringify({
          doneWhen: { atLeast: 4 },
          folder: { mode: 'weekday', lists: { 1: 'legday', 2: 'push', 9: 'x' } },
        }),
      ),
    ).toEqual({
      doneWhen: { atLeast: 4 },
      folder: { mode: 'weekday', lists: { 1: 'legday', 2: 'push' } },
    });
    expect(formatRule({ doneWhen: 'all' })).toBeNull();
    expect(formatRule({ doneWhen: 'all', folder: { mode: 'due' } })).toBe(
      '{"doneWhen":"all","folder":{"mode":"due"}}',
    );
  });

  it('a routine can be where a habit is done from, and the rule is stored on the link', async () => {
    const db = createMemoryDatabase();
    await migrate(db);
    const links = createLinksRepository({
      db,
      changes: createDataChanges(),
      now: () => new Date('2026-11-17T10:00:00'),
    });
    expect(canLink('routine', 'habit')).toBe(true);
    const id = await links.link({
      itemKind: 'folder',
      itemId: 'academia',
      targetKind: 'habit',
      targetId: 'gym',
      rule: { doneWhen: 'all', folder: { mode: 'weekday', lists: { 2: 'push' } } },
    });
    expect((await links.linksTo('habit', 'gym'))[0]!.rule.folder).toEqual({
      mode: 'weekday',
      lists: { 2: 'push' },
    });
    await links.setRule(id, { doneWhen: { atLeast: 3 } });
    expect((await links.linksTo('habit', 'gym'))[0]!.rule).toEqual({ doneWhen: { atLeast: 3 } });
  });
});
