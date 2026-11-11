import type { Link } from '@/core/links/linksRepository';
import { DEFAULT_RULE, type SourceRule } from '@/core/links/sourceRule';

import { habitDay, habitSourceLists, type DayFacts, type DayTask } from '../connections/habitDay';

const TUESDAY = '2026-11-17';
const dayOf = (iso: string) => iso.slice(0, 10);

const link = (
  itemKind: Link['itemKind'],
  itemId: string,
  rule: SourceRule = DEFAULT_RULE,
): Link => ({
  id: `${itemKind}:${itemId}`,
  itemKind,
  itemId,
  targetKind: 'habit',
  targetId: 'gym',
  at: null,
  rule,
  sortOrder: 1,
  createdAt: '2026-11-01T00:00:00.000Z',
});

const task = (over: Partial<DayTask> & Pick<DayTask, 'id' | 'listId'>): DayTask => ({
  title: over.id,
  dueDate: null,
  completedAt: null,
  kind: 'check',
  target: null,
  amount: 0,
  ...over,
});

const facts: DayFacts = {
  folders: [
    { id: 'academia', name: 'Academia', parentId: null },
    { id: 'sem4', name: 'Semestre 4', parentId: null },
    { id: 'calc', name: 'Cálculo 3', parentId: 'sem4' },
  ],
  lists: [
    { id: 'legday', name: 'Legday', folderId: 'academia', resets: true },
    { id: 'push', name: 'Push', folderId: 'academia', resets: true },
    { id: 'provas', name: 'Provas', folderId: 'calc', resets: false },
    { id: 'leitura', name: 'Leitura', folderId: null, resets: false },
  ],
  tasks: [
    task({
      id: 'supino',
      listId: 'push',
      kind: 'count',
      target: 4,
      amount: 4,
      completedAt: `${TUESDAY}T19:00:00Z`,
    }),
    task({ id: 'desenvolvimento', listId: 'push', kind: 'count', target: 3, amount: 2 }),
    task({ id: 'triceps', listId: 'push' }),
    task({ id: 'agachamento', listId: 'legday' }),
    task({ id: 'lista5', listId: 'provas', dueDate: TUESDAY }),
    task({ id: 'relatorio', listId: 'provas', dueDate: '2026-11-18' }),
    task({
      id: 'capitulo',
      listId: 'provas',
      dueDate: '2026-11-16',
      completedAt: `${TUESDAY}T09:00:00Z`,
    }),
    task({ id: 'backlog', listId: 'leitura' }),
  ],
  routines: [
    {
      id: 'manha',
      name: 'Manhã',
      days: 0b0111110,
      items: [
        { id: 'agua', title: 'Beber água', done: true },
        { id: 'alongar', title: 'Alongar', done: false },
      ],
    },
  ],
};

describe('habitDay', () => {
  it('is null for a habit done on its own', () => {
    expect(habitDay([], facts, TUESDAY, 2, dayOf)).toBeNull();
  });

  it('a folder by weekday gives the list of the day, counting counters in part', () => {
    const rule: SourceRule = {
      doneWhen: 'all',
      folder: { mode: 'weekday', lists: { 1: 'legday', 2: 'push' } },
    };
    const day = habitDay([link('folder', 'academia', rule)], facts, TUESDAY, 2, dayOf)!;
    expect(day.label).toBe('Push');
    expect(day.items.map((i) => i.id)).toEqual(['supino', 'desenvolvimento', 'triceps']);
    expect(day).toMatchObject({ required: 3, doneCount: 1, done: false });
    // Supino whole, desenvolvimento 2 of 3: (1 + 2/3) of 3.
    expect(day.ratio).toBeCloseTo((1 + 2 / 3) / 3);
    // Wednesday has no list: a rest day, nothing required.
    expect(
      habitDay([link('folder', 'academia', rule)], facts, '2026-11-18', 3, dayOf),
    ).toMatchObject({
      items: [],
      required: 0,
      done: false,
    });
  });

  it('"at least N" is done before every item is', () => {
    const rule: SourceRule = {
      doneWhen: { atLeast: 1 },
      folder: { mode: 'weekday', lists: { 2: 'push' } },
    };
    expect(habitDay([link('folder', 'academia', rule)], facts, TUESDAY, 2, dayOf)).toMatchObject({
      required: 1,
      doneCount: 1,
      done: true,
      ratio: 1,
    });
  });

  it('a folder by due date gives what is due that day, through subfolders', () => {
    const day = habitDay(
      [link('folder', 'sem4', { doneWhen: 'all', folder: { mode: 'due' } })],
      facts,
      TUESDAY,
      2,
      dayOf,
    )!;
    // Due today, plus what was done today (yesterday's chapter, finished late).
    expect(day.items.map((i) => i.id).sort()).toEqual(['capitulo', 'lista5']);
    expect(day).toMatchObject({ doneCount: 1, required: 2, done: false, label: 'Semestre 4' });
  });

  it('a plain list does not turn its backlog into a daily goal', () => {
    expect(habitDay([link('list', 'leitura')], facts, TUESDAY, 2, dayOf)).toMatchObject({
      items: [],
      required: 0,
    });
  });

  it('a routine gives its steps on its days', () => {
    const day = habitDay([link('routine', 'manha')], facts, TUESDAY, 2, dayOf)!;
    expect(day).toMatchObject({ label: 'Manhã', doneCount: 1, required: 2, ratio: 0.5 });
    expect(habitDay([link('routine', 'manha')], facts, '2026-11-15', 0, dayOf)!.items).toEqual([]);
  });

  it('the same item linked twice counts once', () => {
    const rule: SourceRule = { doneWhen: 'all', folder: { mode: 'weekday', lists: { 2: 'push' } } };
    const day = habitDay(
      [link('folder', 'academia', rule), link('list', 'push')],
      facts,
      TUESDAY,
      2,
      dayOf,
    )!;
    expect(day.items).toHaveLength(3);
    expect(day.required).toBe(3);
  });
});

describe('habitSourceLists', () => {
  it('collects the lists feeding habits, through folders', () => {
    const ids = habitSourceLists([link('folder', 'sem4'), link('list', 'leitura')], facts);
    expect([...ids].sort()).toEqual(['leitura', 'provas']);
  });
});
